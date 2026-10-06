// Motor consolidado de agentes de booking (Enviador ya migrado; Scout/Redactor/Lector siguen
// el mismo patrón en una fase posterior - ver server/routes/agent.ts). Se llama tanto desde el
// endpoint HTTP manual (/api/trigger-agent, disparado por el chatbot o un usuario) como desde
// el scheduler interno (server/services/agentScheduler.ts, disparo por horario configurado por
// banda) - una sola implementación real, sin duplicar lógica entre los dos disparadores.

import { getSupabase, dbGetAutonomyConfig } from "../db.js";
import { esEmailValido, ESTADOS_DE_ENVIO } from "../utils/email.js";
import { loadState } from "../state.js";
import { enviarEmail, crearBorrador, EmailAgentError } from "./emailAgentClient.js";
import { crearBorradorGmailApi, tieneGmailOAuthConectado, comprobarBorradorEnviadoConDetalle, buscarMensajeEnviadoA, enviarEmailGmailApi, obtenerEmailDeLaCuentaConectada } from "./gmailApiClient.js";
import { dbGetEpkConfig } from "../db/epk.js";
import { buildServerEmailHtml } from "../utils/emailTemplate.js";
import { getBandDnaProfile, buildIndexableSubjectLine } from "../utils/bandDna.js";

export async function logAgentExecution(logData: {
  band_id: string;
  agente: string;
  motor: string;
  disparado_por_tipo: string;
  usuario_id?: string;
  usuario_email?: string;
  estado: "success" | "error" | "warning";
  mensaje: string;
  leads_afectados?: any[];
  conteo_afectados?: number;
  duracion_ms: number;
  detalles?: any;
}): Promise<void> {
  try {
    const sb = getSupabase();
    await sb.from("agent_execution_logs").insert({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      band_id: logData.band_id,
      agente: logData.agente,
      motor: logData.motor,
      disparado_por_tipo: logData.disparado_por_tipo || "usuario_manual",
      usuario_id: logData.usuario_id || null,
      usuario_email: logData.usuario_email || null,
      estado: logData.estado,
      mensaje: logData.mensaje,
      leads_afectados: logData.leads_afectados || [],
      conteo_afectados: logData.conteo_afectados ?? (logData.leads_afectados ? logData.leads_afectados.length : 0),
      duracion_ms: logData.duracion_ms,
      detalles: logData.detalles || {}
    });
  } catch (e: any) {
    console.warn("[AUDIT LOG ERROR] No se pudo guardar el registro de auditoría en Supabase:", e?.message || e);
  }
}

// Leads que ESTA instancia está procesando ahora mismo (ver la guarda en runEnviadorAgent).
const leadsEnCurso = new Set<string>();

const MARCA_EMAIL_RECHAZADO = "[Email Rechazado]";

/** Tope de envíos reales por banda y día (AGENT_DAILY_SEND_CAP, 30 por defecto). */
export function limiteDiarioDeEnvios(): number {
  const n = Number(process.env.AGENT_DAILY_SEND_CAP);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

/** Correos que la banda ha enviado hoy (UTC): cuenta los mensajes salientes registrados. */
async function contarEnviosDeHoy(sb: any, bandId: string): Promise<number> {
  const inicioDelDia = new Date();
  inicioDelDia.setUTCHours(0, 0, 0, 0);
  try {
    const { count, error } = await sb
      .from("lead_messages")
      .select("id", { count: "exact", head: true })
      .eq("band_id", bandId)
      .eq("remitente", "banda")
      .gte("fecha", inicioDelDia.toISOString());
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** UPDATE de un lead que NO se traga el error: devuelve el mensaje si falla. */
async function actualizarLeadComprobando(sb: any, leadId: string, bandId: string, cambios: Record<string, any>): Promise<string | null> {
  const { error } = await sb.from("leads").update(cambios).eq("id", leadId).eq("band_id", bandId);
  return error ? String(error.message || error) : null;
}

export interface EnviadorResult {
  success: boolean;
  dispatchedCount: number;
  message: string;
  results: any[];
}

// Interruptor de seguridad global: mientras AGENT_EMAIL_MODE no sea exactamente 'send', NINGUNA
// banda puede enviar de verdad, pase lo que pase en su propia configuración de autonomía - es el
// límite de la plataforma entera, no algo que una banda pueda subir por su cuenta.
const ENVIO_REAL_HABILITADO_GLOBALMENTE = (process.env.AGENT_EMAIL_MODE || "draft").toLowerCase().trim() === "send";

// Despacha los leads aprobados de una banda por email real (SMTP, cualquier proveedor). A
// diferencia de las implementaciones anteriores de este mismo agente (Node nativo con Resend,
// Edge Function despachador-propuestas), NUNCA marca un lead como enviado sin haber enviado el
// email de verdad: si la banda no tiene cuenta de email conectada o la identidad no coincide
// con su EPK, falla
// explícito y no toca el estado del lead.
export async function runEnviadorAgent(opts: {
  bandId: string;
  triggerType: string;
  userId?: string;
  userEmail?: string;
  leadId?: string;
}): Promise<EnviadorResult> {
  const startTime = Date.now();
  const sb = getSupabase();

  // SIEMPRE acotado a la banda y a los estados de envío, también cuando se pide un lead concreto:
  // antes `leadId` reemplazaba la consulta entera y bastaba pasar el id de un lead de OTRA banda
  // (o de uno aún sin aprobar) para despacharlo con las credenciales de esta.
  let query = sb.from("leads").select("*").in("estado", ESTADOS_DE_ENVIO).eq("band_id", opts.bandId);
  if (opts.leadId) {
    query = query.eq("id", opts.leadId);
  }

  const { data: approvedLeads, error: fetchErr } = await query;
  if (fetchErr) {
    throw fetchErr;
  }

  if (!approvedLeads || approvedLeads.length === 0) {
    const emptyMsg = "No se encontraron propuestas o respuestas en cola ('aprobado_propuesta' / 'aprobado' / 'aprobado_respuesta') pendientes de despacho.";
    await logAgentExecution({
      band_id: opts.bandId,
      agente: "enviador",
      motor: "node_email_engine",
      disparado_por_tipo: opts.triggerType,
      usuario_id: opts.userId,
      usuario_email: opts.userEmail,
      estado: "warning",
      mensaje: emptyMsg,
      leads_afectados: [],
      conteo_afectados: 0,
      duracion_ms: Date.now() - startTime
    });
    return { success: true, dispatchedCount: 0, message: emptyMsg, results: [] };
  }

  let bandName = "Tu Banda";
  const { data: bandData } = await sb.from("registered_bands").select("nombre_banda").eq("band_id", opts.bandId).maybeSingle();
  if (bandData?.nombre_banda) bandName = bandData.nombre_banda;

  let epkConfig: any = null;
  try {
    epkConfig = await dbGetEpkConfig(opts.bandId);
  } catch (e) {
    // Non-blocking fallback
  }

  // El paso 1 (un humano le da a "Aprobar" en la app, lo que trajo el lead a este lote) es
  // siempre obligatorio y no depende de nada de lo de aquí abajo. Lo que decide esta banda es
  // solo el paso 2, qué pasa justo después de esa aprobación: 'draft_gmail' (por defecto) deja
  // el borrador para un último vistazo, 'direct_send' lo despacha ya sin ese segundo paso manual
  // - pero solo si además la plataforma entera tiene el envío real habilitado.
  let dispatchMode = "draft_gmail";
  let dispatchLevel = "draft_only";
  try {
    const autonomyConfig: any = await dbGetAutonomyConfig(opts.bandId);
    if (autonomyConfig?.dispatchMode === "direct_send") dispatchMode = "direct_send";
    if (autonomyConfig?.dispatchLevel) dispatchLevel = String(autonomyConfig.dispatchLevel);
  } catch (e) {
    // Sin configuración de autonomía guardada todavía: se queda en el modo seguro por defecto.
  }
  // Envío real solo si las TRES cosas lo permiten: la plataforma, el modo y el nivel de autonomía.
  // Antes `dispatchLevel` (draft_only) no se leía en ningún sitio y direct_send enviaba igualmente.
  const ENVIO_REAL = ENVIO_REAL_HABILITADO_GLOBALMENTE && dispatchMode === "direct_send" && dispatchLevel !== "draft_only";

  // Si la banda conectó Gmail por OAuth (server/routes/gmailOAuth.ts), se prefiere sobre
  // SMTP/IMAP tanto para el borrador como para el envío directo - sin contraseña de aplicación,
  // funciona igual desde el scheduler (sin navegador) que desde un disparo manual. Si no hay
  // OAuth conectado (o la banda usa Outlook), se mantiene el camino SMTP/IMAP de siempre.
  const usarGmailOAuth = await tieneGmailOAuthConectado(opts.bandId);

  const results: any[] = [];
  const nowIso = new Date().toISOString();

  // Tope diario de envíos REALES por banda (los borradores no cuentan: los envía una persona).
  let enviadosHoy = 0;
  if (ENVIO_REAL) {
    enviadosHoy = await contarEnviosDeHoy(sb, opts.bandId);
  }
  const TOPE_DIARIO = limiteDiarioDeEnvios();

  for (const lead of approvedLeads) {
    // Si otra ejecución (el planificador y un disparo manual a la vez, un doble clic) ya está
    // con este lead, se salta: sin esto salían dos correos o dos borradores idénticos.
    if (leadsEnCurso.has(lead.id)) {
      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "omitido", error: "Otra ejecución ya está procesando este lead." });
      continue;
    }
    // Un email que rebotó no se vuelve a intentar hasta que alguien lo corrija.
    if (String(lead.notas || "").includes(MARCA_EMAIL_RECHAZADO)) {
      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "omitido", error: "El email de contacto rebotó antes. Corrígelo antes de volver a enviar." });
      continue;
    }
    if (ENVIO_REAL && enviadosHoy >= TOPE_DIARIO) {
      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "omitido", error: `Se alcanzó el tope diario de ${TOPE_DIARIO} envíos. Continúa mañana.` });
      continue;
    }
    leadsEnCurso.add(lead.id);
    try {
    // El correo sale al contacto principal y, si lo hay, al secundario (es una función: salas con
    // dos buzones). Los destinatarios exactos quedan en la nota del lead y en el borrador.
    const rawEmails = [lead.email_contacto || lead.email, lead.email_secundario || lead.emailSecundario]
      .filter(Boolean)
      .flatMap(e => String(e).split(/[,;]/))
      .map(e => e.trim())
      .filter(esEmailValido)
      .filter((e, i, todos) => todos.findIndex((x) => x.toLowerCase() === e.toLowerCase()) === i);

    const emailContacto = rawEmails.length > 0 ? rawEmails.join(", ") : (lead.email_contacto || lead.email);
    const rawPitch = lead.pitch_generado || lead.ultimo_mensaje_recibido || "Hola, os dejamos nuestra propuesta de concierto.";
    const { html: emailHtml, text: emailText, cleanPitch } = buildServerEmailHtml({
      pitchText: rawPitch,
      bandName,
      bandId: opts.bandId,
      epkConfig,
      lead
    });

    const isRespuesta = lead.estado === "aprobado_respuesta";
    let asunto = isRespuesta
      ? `Re: Concierto ${bandName} en ${lead.nombre_sala}`
      : `Propuesta de concierto: ${bandName} en ${lead.nombre_sala}`;
    try {
      const state = loadState();
      const bandDna = getBandDnaProfile(state, opts.bandId, lead);
      asunto = buildIndexableSubjectLine({
        bandDna,
        lead,
        isRespuesta
      });
    } catch (e) {
      // Fallback silencioso si falla la resolución de ADN
    }

    // Última línea de defensa.
    if (rawEmails.length === 0) {
      results.push({
        id: lead.id,
        nombre_sala: lead.nombre_sala,
        status: "error",
        error: emailContacto
          ? `El email de contacto no es válido ("${emailContacto}"). No se ha enviado nada.`
          : "El lead no tiene email de contacto. No se ha enviado nada."
      });
      continue;
    }

    try {
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      if (!ENVIO_REAL) {
        // Modo borrador: se deja el email en la bandeja de la banda para revisión humana.
        let draftPath: string;
        let draftId: string | null = null;
        if (usarGmailOAuth) {
          const creado = await crearBorradorGmailApi(opts.bandId, {
            to: emailContacto,
            subject: asunto,
            body: emailText,
            html: emailHtml,
            inReplyTo: lead.gmail_message_id || undefined
          });
          draftPath = creado.draftPath;
          draftId = creado.draftId;
        } else {
          draftPath = (await crearBorrador(opts.bandId, {
            to: emailContacto,
            subject: asunto,
            body: emailText,
            html: emailHtml,
            inReplyTo: lead.gmail_message_id || undefined
          })).draftPath;
        }

        const draftNote = `*** [${dateTag}] BORRADOR creado en '${draftPath}' para ${emailContacto} por el Agente Enviador - NO se ha enviado, revísalo y envíalo a mano ***\n` + (lead.notas || "");
        const errGuardar = await actualizarLeadComprobando(sb, lead.id, opts.bandId, { estado: "borrador_creado", notas: draftNote, gmail_draft_id: draftId });
        if (errGuardar) {
          // El borrador YA está en Gmail pero el lead sigue "aprobado": se avisa para no crear otro.
          results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "error", error: `Borrador creado en Gmail, pero no se pudo guardar el estado del lead (${errGuardar}). No lo vuelvas a lanzar: revisa los borradores.` });
          continue;
        }

        results.push({ id: lead.id, nombre_sala: lead.nombre_sala, email_contacto: emailContacto, estado_anterior: lead.estado, estado_nuevo: "borrador_creado", carpeta_borradores: draftPath, status: "borrador" });
        continue;
      }

      let messageId: string;
      let threadId: string | undefined;
      if (usarGmailOAuth) {
        const result = await enviarEmailGmailApi(opts.bandId, {
          to: emailContacto,
          subject: asunto,
          body: emailText,
          html: emailHtml,
          inReplyTo: lead.gmail_message_id || undefined
        });
        messageId = result.messageId;
        threadId = result.threadId;
      } else {
        const result = await enviarEmail(opts.bandId, {
          to: emailContacto,
          subject: asunto,
          body: emailText,
          html: emailHtml,
          inReplyTo: lead.gmail_message_id || undefined
        });
        messageId = result.messageId;
      }

      const nextState = isRespuesta ? "negociando" : "contactado";
      const newNote = `*** [${dateTag}] Correo ENVIADO a ${emailContacto} por el Agente Enviador (email real) ***\n` + (lead.notas || "");
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
      const nuevoEnvioContacto = {
        id: `sent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Agente Enviador",
        notas: `Correo oficial despachado a la sala (${emailContacto})`,
        resultado: "📧 Correo Enviado",
        email_id: messageId
      };

      // El correo YA ha salido. Si guardar el estado falla, el siguiente ciclo volvería a
      // enviarlo (el lead seguiría "aprobado"): se reintenta y, si no hay manera, se avisa fuerte.
      let errGuardar: string | null = null;
      for (let intento = 0; intento < 3; intento++) {
        errGuardar = await actualizarLeadComprobando(sb, lead.id, opts.bandId, {
          estado: nextState,
          fecha_envio: nowIso,
          notas: newNote,
          gmail_draft_id: null,
          gmail_message_id: messageId,
          gmail_thread_id: threadId,
          email_abierto: false,
          clics_epk: 0,
          ultimo_clic_at: null,
          historial_contacto: [nuevoEnvioContacto, ...historialPrevio].slice(0, 50)
        });
        if (!errGuardar) break;
        await new Promise((r) => setTimeout(r, 200 * (intento + 1)));
      }
      enviadosHoy++;
      if (errGuardar) {
        console.error(`[Enviador] Correo ENVIADO a ${emailContacto} pero no se pudo guardar el estado del lead ${lead.id}: ${errGuardar}`);
        results.push({ id: lead.id, nombre_sala: lead.nombre_sala, email_contacto: emailContacto, status: "error", error: `El correo SÍ se envió a ${emailContacto}, pero no se pudo guardar el estado (${errGuardar}). Cámbialo a mano a "contactado" para que no se reenvíe.` });
        continue;
      }

      const { error: errMensaje } = await sb.from("lead_messages").insert({
        id: `imap-${messageId}`,
        lead_id: lead.id,
        band_id: lead.band_id || opts.bandId,
        remitente: "banda",
        remitente_nombre: `${bandName} Booking`,
        asunto,
        mensaje: cleanPitch,
        fecha: nowIso
      });
      if (errMensaje) console.warn(`[Enviador] Correo enviado, pero no se registró en lead_messages (${errMensaje.message}).`);

      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, email_contacto: emailContacto, estado_anterior: lead.estado, estado_nuevo: nextState, fecha_envio: nowIso, status: "enviado" });
    } catch (err: any) {
      const isIdentityIssue = err instanceof EmailAgentError && (err.code === "no_token" || err.code === "identity_mismatch");

      // Registrar si el fallo fue por "usuario no existe" (invalid_recipient)
      const failureReason = (err as any).deliveryFailureReason;
      if (failureReason === 'invalid_recipient') {
        // Se ANTEPONE a las notas existentes (antes se sustituían todas) y el lead sale de la cola
        // de envío para que no se reintente en cada ciclo.
        const leadNote = `${MARCA_EMAIL_RECHAZADO} Usuario no existe en ${emailContacto} - no reintentar\n` + (lead.notas || "");
        const errNota = await actualizarLeadComprobando(getSupabase(), lead.id, opts.bandId, { notas: leadNote, estado: "nuevo" });
        if (errNota) console.warn(`[Enviador] No se pudo registrar el rebote de ${emailContacto}: ${errNota}`);
      }

      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "error", error: err.message || String(err) });
      // Si el problema es de identidad/token, es el mismo para toda la banda: no tiene
      // sentido reintentar con el resto de leads de este lote.
      if (isIdentityIssue) break;
    }
    } finally {
      leadsEnCurso.delete(lead.id);
    }
  }

  const sentCount = results.filter((r) => r.status === "enviado" || r.status === "borrador").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const successMsg = sentCount > 0
    ? ENVIO_REAL
      ? `Agente Enviador: ${sentCount} propuesta(s) despachada(s) por email real${errorCount > 0 ? `, ${errorCount} con error` : ""}.`
      : `Agente Enviador (modo borrador): ${sentCount} borrador(es) creado(s) en la bandeja de la banda, pendientes de revisar y enviar a mano${errorCount > 0 ? `, ${errorCount} con error` : ""}. No se ha enviado ningún email.`
    : `Agente Enviador: no se pudo ${ENVIO_REAL ? "despachar" : "preparar"} ninguna propuesta (${errorCount} error(es)).`;

  await logAgentExecution({
    band_id: opts.bandId,
    agente: "enviador",
    motor: "node_email_engine",
    disparado_por_tipo: opts.triggerType,
    usuario_id: opts.userId,
    usuario_email: opts.userEmail,
    estado: sentCount > 0 ? "success" : "error",
    mensaje: successMsg,
    leads_afectados: results,
    conteo_afectados: sentCount,
    duracion_ms: Date.now() - startTime,
    detalles: { band_name: bandName, modo_email: ENVIO_REAL ? "send" : "draft", motor_borrador: usarGmailOAuth ? "gmail_oauth_api" : "imap" }
  });

  return { success: sentCount > 0 || errorCount === 0, dispatchedCount: sentCount, message: successMsg, results };
}

export interface ComprobarBorradoresResult {
  revisados: number;
  confirmadosEnviados: string[];
  // Para cada lead cuyo borrador Google confirma que SIGUE existiendo (no se interpreta como
  // enviado) - visibilidad de qué se comprobó y qué respondió Google, aunque la conclusión sea
  // "no ha cambiado nada". Sin esto, un chequeo que sí se ejecuta bien pero encuentra el borrador
  // todavía ahí es indistinguible en los logs de un chequeo que nunca llegó a hacerse.
  todaviaComoBorrador: Array<{ leadId: string; draftId: string; status: number; cuerpo?: string }>;
  errores: Array<{ leadId: string; draftId: string; error: string }>;
  // Borradores que desaparecieron de Gmail SIN que exista un envío a ese destinatario en Enviados:
  // se borraron a mano. No se marcan como enviados.
  eliminadosSinEnviar?: string[];
  // A qué cuenta de Gmail pertenece de verdad el access token usado en esta comprobación (ver
  // obtenerEmailDeLaCuentaConectada) - para descartar que se esté consultando una cuenta distinta
  // a la que la banda cree tener conectada.
  cuentaGmailReal: string | null;
}

// Cierra el hueco de los borradores creados vía Gmail OAuth (crearBorradorGmailApi): la banda
// puede darle a "Enviar" dentro de Gmail sin que la app se entere, así que el lead se quedaba
// para siempre en 'borrador_creado' aunque el correo ya hubiera salido de verdad. Se llama desde
// el propio Agente Lector (server/services/lectorAgent.ts) porque conceptualmente es lo mismo -
// comprobar el estado real de la bandeja de la banda - y ya corre en el mismo tick programado.
export async function comprobarBorradoresGmailEnviados(bandId: string): Promise<ComprobarBorradoresResult> {
  const sb = getSupabase();
  const cuentaGmailReal = await obtenerEmailDeLaCuentaConectada(bandId);
  const { data: leads, error } = await sb
    .from("leads")
    .select("id, nombre_sala, notas, gmail_draft_id, pitch_generado, email_contacto")
    .eq("band_id", bandId)
    .eq("estado", "borrador_creado")
    .not("gmail_draft_id", "is", null);

  if (error) throw error;
  if (!leads || leads.length === 0) return { revisados: 0, confirmadosEnviados: [], todaviaComoBorrador: [], errores: [], cuentaGmailReal };

  const confirmadosEnviados: string[] = [];
  const todaviaComoBorrador: Array<{ leadId: string; draftId: string; status: number; cuerpo?: string }> = [];
  const errores: Array<{ leadId: string; draftId: string; error: string }> = [];
  const eliminadosSinEnviar: string[] = [];
  const nowIso = new Date().toISOString();

  for (const lead of leads) {
    let resultado: { existe: boolean; status: number; messageId?: string; cuerpo?: string };
    try {
      resultado = await comprobarBorradorEnviadoConDetalle(bandId, lead.gmail_draft_id);
    } catch (e: any) {
      // Un fallo puntual comprobando (token caducado, red) no debe marcar nada como enviado por
      // error - se reintenta en el siguiente tick. Pero SÍ queda registrado en el resultado, para
      // no confundir "no se pudo comprobar" con "se comprobó y sigue existiendo".
      errores.push({ leadId: lead.id, draftId: lead.gmail_draft_id, error: e?.message || String(e) });
      continue;
    }
    if (resultado.existe) {
      todaviaComoBorrador.push({ leadId: String(lead.id), draftId: lead.gmail_draft_id, status: resultado.status, cuerpo: resultado.cuerpo });
      continue;
    }

    const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    // Un 404 también ocurre si el borrador se BORRÓ sin enviar: se confirma en Enviados antes de
    // dar el lead por contactado (si no, la app mentía diciendo que se había contactado a la sala).
    let enviado: { messageId: string } | null;
    try {
      enviado = await buscarMensajeEnviadoA(bandId, lead.email_contacto || "");
    } catch (e: any) {
      errores.push({ leadId: lead.id, draftId: lead.gmail_draft_id, error: e?.message || String(e) });
      continue;
    }
    if (!enviado) {
      await sb.from("leads").update({
        notas: `*** [${dateTag}] El borrador de Gmail desapareció y NO hay ningún envío a ${lead.email_contacto || "ese destinatario"} en Enviados: se borró sin enviar. ***\n` + (lead.notas || ""),
        gmail_draft_id: null
      }).eq("id", lead.id);
      eliminadosSinEnviar.push(String(lead.id));
      continue;
    }
    resultado = { ...resultado, messageId: resultado.messageId || enviado.messageId };

    const newNote = `*** [${dateTag}] Borrador de Gmail detectado como ENVIADO (ya no está en Borradores de Gmail) ***\n` + (lead.notas || "");

    await sb.from("leads").update({
      estado: "contactado",
      fecha_envio: nowIso,
      notas: newNote,
      gmail_draft_id: null,
      gmail_message_id: resultado.messageId,
      email_abierto: false,
      clics_epk: 0,
      ultimo_clic_at: null
    }).eq("id", lead.id);
    const cuerpoReal = resultado.cuerpo || lead.pitch_generado || lead.notas || "Propuesta de concierto enviada";
    await sb.from("lead_messages").insert({
      id: resultado.messageId ? `imap-${resultado.messageId}` : `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lead_id: lead.id,
      band_id: bandId,
      remitente: "banda",
      remitente_nombre: "Enviado desde Gmail",
      asunto: `Concierto en ${lead.nombre_sala}`,
      mensaje: cuerpoReal,
      fecha: nowIso
    });
    confirmadosEnviados.push(String(lead.id));
  }

  return { revisados: leads.length, confirmadosEnviados, todaviaComoBorrador, errores, eliminadosSinEnviar, cuentaGmailReal };
}

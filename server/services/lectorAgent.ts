// Agente Lector real: hasta ahora server/routes/agent.ts y agentScheduler.ts solo contaban
// cuántos correos sin leer había en la bandeja ("Agente Lector ejecutado... No se han detectado
// nuevas respuestas"), sin llegar a emparejar esos correos con un lead real ni actualizar nada.
// Este módulo cierra ese hueco: lee de verdad el cuerpo de los mensajes nuevos, los empareja por
// email de contacto con un lead de la banda, deja la respuesta registrada en lead_messages (la
// MISMA tabla donde el Agente Enviador ya guarda cada pitch enviado de verdad, para que el hilo
// esté completo) y transiciona el estado del lead. Solo LEE y CLASIFICA - nunca envía ni redacta
// una respuesta por su cuenta (eso es server/routes/leads/reply.ts, y sigue requiriendo que un
// humano lo revise y lo mande).

import { leerRespuestasEntrantes, marcarComoLeido } from "./emailAgentClient.js";
import { leerRespuestasGmailApi, marcarComoLeidoGmailApi, tieneGmailOAuthConectado } from "./gmailApiClient.js";
import { comprobarBorradoresGmailEnviados } from "./agentEngine.js";
import { generarBorradorRespuesta, getNegotiationKeywords, matchesKeyword } from "./replyDrafting.js";
import { dbGetLeads, dbUpsertLead, dbLeadMessageExists, dbCreateLeadMessage, dbGetLeadMessages, getSupabase } from "../db.js";
import { isBounceMessage, extractFailedRecipientEmail } from "../utils/emailDeliveryTracker.js";
import { detectPitchLanguage } from "../utils/leadLanguage.js";

// Heurística ligera y barata (sin llamada a IA) para decidir si una respuesta abre negociación:
// entrar aquí no bloquea el hilo, y una clasificación de más no hace daño (el mánager siempre
// puede corregir el estado a mano). Las palabras se comparten con replyDrafting.ts
// (getNegotiationKeywords) para que ambos clasificadores no diverjan con el tiempo, y ahora
// están indexadas por idioma - antes eran 100% en español, así que una sala francesa/italiana/
// etc. preguntando por precio o fecha nunca hacía que el lead pasara a "negociando".
export function detectarEstadoTrasRespuesta(estadoActual: string, textoRespuesta: string, languageCode?: string): string {
  const t = (textoRespuesta || "").toLowerCase();
  if (getNegotiationKeywords(languageCode).some((k) => matchesKeyword(t, k))) return "negociando";
  if (estadoActual === "contactado" || estadoActual === "esperando_respuesta") return "respondido";
  return estadoActual;
}

// Tope de borradores de respuesta generados con IA por banda y hora: a diferencia de los
// endpoints HTTP que llaman a IA (protegidos con iaRateLimiter, middleware de Express), el Lector
// corre en un bucle interno del scheduler sin request/response al que enganchar ese middleware.
// Sin ningún tope, cada mensaje entrante que empareje con un lead (por email exacto o por
// In-Reply-To) dispara una llamada de pago, tick tras tick - un email spoofeado con el
// email_contacto de un lead real, o simplemente muchas respuestas legítimas seguidas, agotaría
// la cuota de IA de la banda sin ningún freno. Si se supera el tope, el lead se queda solo
// clasificado (igual que si la IA fallara) - nunca se bloquea la detección en sí.
const CONTADOR_BORRADORES_IA: Record<string, { count: number; resetTime: number }> = {};
const MAX_BORRADORES_IA_POR_HORA = 20;
const VENTANA_BORRADORES_IA_MS = 60 * 60 * 1000;

export function puedeGenerarBorradorIA(bandId: string): boolean {
  const ahora = Date.now();
  const entrada = CONTADOR_BORRADORES_IA[bandId];
  if (!entrada || entrada.resetTime < ahora) {
    CONTADOR_BORRADORES_IA[bandId] = { count: 1, resetTime: ahora + VENTANA_BORRADORES_IA_MS };
    return true;
  }
  if (entrada.count >= MAX_BORRADORES_IA_POR_HORA) return false;
  entrada.count += 1;
  return true;
}

export interface LectorAgentResult {
  mensajesLeidos: number;
  leadsActualizados: string[];
  sinEmparejar: number;
  borradoresEnviadosDetectados: number;
  // Diagnóstico de comprobarBorradoresGmailEnviados: qué borradores Google confirma que siguen
  // existiendo (con el status HTTP crudo) y qué comprobaciones fallaron - visibilidad necesaria
  // para no confundir "se comprobó y de verdad sigue ahí" con "el chequeo nunca llegó a hacerse".
  borradoresTodaviaSinEnviar: Array<{ leadId: string; draftId: string; status: number; cuerpo?: string }>;
  erroresComprobandoBorradores: Array<{ leadId: string; draftId: string; error: string }>;
  cuentaGmailReal: string | null;
  // Actividad del Contestador automático (generarBorradorRespuesta) durante este tick - antes
  // era invisible: un fallo de la IA solo dejaba un console.warn, y el tope de
  // puedeGenerarBorradorIA ni eso lo registraba en ningún sitio que un mánager pudiera ver. Estos
  // tres contadores son los que runLectorTick (agentScheduler.ts) vuelca en agent_execution_logs.
  borradorIaGenerados: number;
  borradorIaFallidos: number;
  borradorIaBloqueadosPorLimite: number;
}

export async function runLectorAgent(bandId: string): Promise<LectorAgentResult> {
  // Gmail por OAuth (sin contraseña) se prefiere sobre IMAP, igual que ya hace el Agente
  // Enviador (server/services/agentEngine.ts) - hasta ahora este agente era 100% IMAP, así que
  // una banda conectada solo por OAuth nunca detectaba respuestas entrantes en absoluto.
  const usarGmailOAuth = await tieneGmailOAuthConectado(bandId);

  const leadsActualizados: string[] = [];

  // Comprueba, solo si la banda usa OAuth, si algún borrador que el Agente Enviador dejó en
  // Gmail se envió a mano desde ahí sin pasar por la app (ver comprobarBorradoresGmailEnviados).
  // A PROPÓSITO antes de leerRespuestasGmailApi: solo necesita el scope gmail.compose (el que ya
  // tenía cualquier banda conectada antes de añadir gmail.modify), así que si leer la bandeja
  // falla por falta de ese scope nuevo, la detección de borradores enviados no debe quedarse sin
  // ejecutarse por eso - son dos permisos y dos llamadas independientes.
  let borradoresEnviadosDetectados = 0;
  let borradoresTodaviaSinEnviar: Array<{ leadId: string; draftId: string; status: number; cuerpo?: string }> = [];
  let erroresComprobandoBorradores: Array<{ leadId: string; draftId: string; error: string }> = [];
  let cuentaGmailReal: string | null = null;
  if (usarGmailOAuth) {
    try {
      const resultado = await comprobarBorradoresGmailEnviados(bandId);
      leadsActualizados.push(...resultado.confirmadosEnviados);
      borradoresEnviadosDetectados = resultado.confirmadosEnviados.length;
      borradoresTodaviaSinEnviar = resultado.todaviaComoBorrador;
      erroresComprobandoBorradores = resultado.errores;
      cuentaGmailReal = resultado.cuentaGmailReal;
    } catch (e) {
      console.warn(`[Lector] No se pudieron comprobar los borradores de Gmail de ${bandId}:`, e);
    }
  }

  const mensajes = usarGmailOAuth ? await leerRespuestasGmailApi(bandId) : await leerRespuestasEntrantes(bandId);

  console.log(`[Lector] Banda ${bandId}: encontrados ${mensajes.length} mensaje(s). Usando ${usarGmailOAuth ? "Gmail API" : "IMAP"}`);
  if (mensajes.length > 0) {
    mensajes.forEach((m, i) => console.log(`  [${i}] From: ${m.from}, Subject: ${m.subject?.substring(0, 50)}`));
  }

  if (mensajes.length === 0) {
    return { mensajesLeidos: 0, leadsActualizados, sinEmparejar: 0, borradoresEnviadosDetectados, borradoresTodaviaSinEnviar, erroresComprobandoBorradores, cuentaGmailReal, borradorIaGenerados: 0, borradorIaFallidos: 0, borradorIaBloqueadosPorLimite: 0 };
  }

  const leads = await dbGetLeads(bandId);
  const uidsProcesados: Array<number | string> = [];
  let sinEmparejar = 0;
  let borradorIaGenerados = 0;
  let borradorIaFallidos = 0;
  let borradorIaBloqueadosPorLimite = 0;

  for (const msg of mensajes) {
    // Un bounce/NDR llega DESPUÉS de que el Enviador ya diera el pitch por enviado (Gmail acepta
    // el mensaje al enviarlo y solo el servidor destino lo rechaza más tarde), y su remitente es
    // mailer-daemon, no el lead - así que nunca empareja por "from" como una respuesta normal.
    // Hay que detectarlo aparte y sacar la dirección fallida del cuerpo del propio bounce.
    if (isBounceMessage(msg.subject || "", msg.from || "")) {
      const emailFallido = extractFailedRecipientEmail(msg.text || "");
      const leadBounce = emailFallido
        ? leads.find((l: any) => (l.email_contacto || "").toLowerCase().trim() === emailFallido)
        : null;
      if (leadBounce && !(leadBounce.notas || "").includes("[Email Rechazado]")) {
        await dbUpsertLead({
          ...leadBounce,
          notas: `${leadBounce.notas || ""}\n[Email Rechazado] Usuario no existe en ${emailFallido} - no reintentar`.trim()
        }, bandId);
        leadsActualizados.push(String(leadBounce.id));
      }
      uidsProcesados.push(msg.uid);
      continue;
    }

    // Intenta emparejar de 2 formas:
    // 1. Por email exacto (método original)
    // 2. Por In-Reply-To header → busca en lead_messages quién envió ese message-id (más robusto)
    const fromLower = (msg.from || "").toLowerCase().trim();
    let lead = fromLower
      ? leads.find((l: any) => {
          const mainEmail = (l.email_contacto || "").toLowerCase().trim();
          const secEmail = (l.email_secundario || "").toLowerCase().trim();
          return (mainEmail && (mainEmail === fromLower || mainEmail.includes(fromLower))) ||
                 (secEmail && (secEmail === fromLower || secEmail.includes(fromLower)));
        })
      : null;

    // Si no empareja por email, intenta por In-Reply-To (respuesta a un email que enviamos)
    if (!lead && msg.inReplyTo) {
      console.log(`[Lector] Email no emparejó por email, buscando por In-Reply-To: ${msg.inReplyTo}`);
      try {
        const sb = getSupabase();
        const { data: originalMsg } = await sb
          .from("lead_messages")
          .select("lead_id")
          .eq("band_id", bandId)
          .eq("id", `imap-${msg.inReplyTo}`)
          .maybeSingle();

        if (originalMsg) {
          lead = leads.find((l: any) => l.id === originalMsg.lead_id);
          console.log(`[Lector] Emparejado por In-Reply-To: Lead ${lead?.id}`);
        }
      } catch (e) {
        console.warn(`[Lector] Error buscando por In-Reply-To:`, e);
      }
    }

    console.log(`[Lector] Procesando: ${msg.from} -> ${lead ? `Lead ${lead.id}` : "SIN EMPAREJAR"}`);

    if (!lead) {
      // No se marca como leído a propósito: puede ser una respuesta de un contacto todavía sin
      // enriquecer con email_contacto, o de fuera de la CRM. Se reintenta en el siguiente tick
      // por si mientras tanto se completa la ficha del lead.
      sinEmparejar++;
      continue;
    }

    if (!msg.text) {
      uidsProcesados.push(msg.uid);
      continue;
    }

    // El Message-ID de IMAP es único por RFC 5322: sirve tal cual como id de la fila para
    // deduplicar sin necesidad de una columna extra ni de comparar texto.
    const messageRowId = `imap-${msg.messageId}`;
    const yaRegistrado = await dbLeadMessageExists(messageRowId);
    if (!yaRegistrado) {
      // El hilo previo (antes de registrar este mensaje) es lo que el Contestador necesita
      // como contexto de conversación - se pide ANTES de dbCreateLeadMessage para no tener que
      // filtrar luego el mensaje que acabamos de insertar.
      const hiloPrevio = await dbGetLeadMessages(String(lead.id), bandId);
      const threadSoFar = hiloPrevio.map((m) => ({ remitente: m.remitente, mensaje: m.mensaje }));

      await dbCreateLeadMessage({
        id: messageRowId,
        lead_id: lead.id,
        band_id: bandId,
        remitente: "sala",
        remitente_nombre: lead.nombre_sala || "Sala",
        asunto: msg.subject || "",
        mensaje: msg.text,
        fecha: (msg.date || new Date()).toISOString()
      });

      // Auto-Contestador: en vez de dejar el lead solo clasificado (negociando/respondido) sin
      // nada más que hacer, se intenta redactar ya mismo la respuesta con IA (mismo motor que
      // server/routes/leads/reply.ts) y se deja en 'pendiente_aprobacion' - el mismo estado que
      // ya usa el pitch inicial para el botón "Aprobar" en VenueDetailPanel.tsx. Nunca se envía
      // sola: sigue haciendo falta la aprobación humana (aprobado_respuesta) antes del Enviador.
      // Si la IA falla, se cae al comportamiento de antes (solo clasificar) para no dejar el
      // lead sin estado por un fallo de la IA.
      let nuevoEstado = detectarEstadoTrasRespuesta(lead.estado, msg.text, detectPitchLanguage(lead).code);
      let borradorGenerado: string | null = null;
      if (puedeGenerarBorradorIA(bandId)) {
        try {
          const { draftReply } = await generarBorradorRespuesta(bandId, lead, msg.text, threadSoFar);
          borradorGenerado = draftReply;
          nuevoEstado = "pendiente_aprobacion";
          borradorIaGenerados++;
        } catch (draftErr) {
          console.warn(`[Lector] No se pudo autogenerar la respuesta para el lead ${lead.id}:`, draftErr);
          borradorIaFallidos++;
        }
      } else {
        console.warn(`[Lector] Tope de borradores IA alcanzado para la banda ${bandId} esta hora - lead ${lead.id} queda solo clasificado, sin redactar.`);
        borradorIaBloqueadosPorLimite++;
      }

      await dbUpsertLead({
        ...lead,
        estado: nuevoEstado,
        ...(borradorGenerado ? { pitch_generado: borradorGenerado } : {}),
        fecha_ultima_respuesta: (msg.date || new Date()).toISOString()
      }, bandId);

      // RFC 5322: la próxima respuesta nuestra debe citar el Message-ID de ESTE mensaje entrante
      // (no el de nuestro propio envío anterior) para que Gmail/el cliente de la sala lo agrupe
      // bien en el hilo. dbUpsertLead no toca esta columna (ver server/db/leads.ts), así que se
      // actualiza aparte, igual que ya hace agentEngine.ts con gmail_message_id/gmail_thread_id.
      if (msg.messageId) {
        try {
          await getSupabase().from("leads").update({ gmail_message_id: msg.messageId }).eq("id", lead.id);
        } catch (idErr) {
          console.warn(`[Lector] No se pudo actualizar gmail_message_id para el lead ${lead.id}:`, idErr);
        }
      }

      leadsActualizados.push(String(lead.id));
    }

    uidsProcesados.push(msg.uid);
  }

  if (uidsProcesados.length > 0) {
    const marcarLeidos = usarGmailOAuth
      ? marcarComoLeidoGmailApi(bandId, uidsProcesados as string[])
      : marcarComoLeido(bandId, uidsProcesados as number[]);
    await marcarLeidos.catch((err) => {
      console.warn(`[Lector] No se pudieron marcar como leídos los mensajes de ${bandId}:`, err);
    });
  }

  return { mensajesLeidos: mensajes.length, leadsActualizados, sinEmparejar, borradoresEnviadosDetectados, borradoresTodaviaSinEnviar, erroresComprobandoBorradores, cuentaGmailReal, borradorIaGenerados, borradorIaFallidos, borradorIaBloqueadosPorLimite };
}

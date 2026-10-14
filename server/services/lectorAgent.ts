// Agente Lector real: hasta ahora server/routes/agent.ts y agentScheduler.ts solo contaban
// cuántos correos sin leer había en la bandeja ("Agente Lector ejecutado... No se han detectado
// nuevas respuestas"), sin llegar a emparejar esos correos con un lead real ni actualizar nada.
// Este módulo cierra ese hueco: lee de verdad el cuerpo de los mensajes nuevos, los empareja por
// email de contacto con un lead de la banda, deja la respuesta registrada en lead_messages (la
// MISMA tabla donde el Agente Enviador ya guarda cada pitch enviado de verdad, para que el hilo
// esté completo) y transiciona el estado del lead. Solo LEE y CLASIFICA - nunca envía ni redacta
// una respuesta por su cuenta (eso es server/routes/leads/reply.ts, y sigue requiriendo que un
// humano lo revise y lo mande).

import { esEmailValido } from "../utils/email.js";
import { leerRespuestasEntrantes, marcarComoLeido, type RespuestaEntrante } from "./emailAgentClient.js";
import { leerRespuestasGmailApi, marcarComoLeidoGmailApi, tieneGmailOAuthConectado } from "./gmailApiClient.js";
import { comprobarBorradoresGmailEnviados } from "./agentEngine.js";
import { generarBorradorRespuesta, getNegotiationKeywords, matchesKeyword, detectResponseType } from "./replyDrafting.js";
import { analyzeIncomingMessageSentiment } from "./sentimentAnalysis.js";
import { dbGetLeads, dbUpsertLead, dbLeadMessageExists, dbCreateLeadMessage, dbGetLeadMessages, dbGetAutonomyConfig, getSupabase } from "../db.js";
import { isBounceMessage, extractFailedRecipientEmail } from "../utils/emailDeliveryTracker.js";
import { detectPitchLanguage } from "../utils/leadLanguage.js";
import { quitarTextoCitado } from "../utils/respuestaEntrante.js";
import type { LeadConCorreo } from "./tiposLeadCorreo.js";

// Clasificador de precisión para respuestas entrantes de salas/festivales/medios:
// Evalúa el contenido del mensaje entrante en el idioma del lead y determina la transición de estado óptima:
// 1. 'rejection' -> 'no_interesado'
// 2. 'confirmation' -> 'confirmado'
// 3. 'price_negotiation' o palabras clave de negociación -> 'negociando'
// 4. 'follow_up' / 'neutral' -> 'respondido'
export function detectarEstadoTrasRespuesta(estadoActual: string, textoRespuesta: string, languageCode?: string): string {
  const t = (textoRespuesta || "").toLowerCase();
  
  let lang = languageCode;
  if (!lang) {
    if (/\b(what|price|rates|budget|how much|confirm|sorry|unfortunately|thanks)\b/i.test(t)) lang = 'en';
    else if (/\b(prezzo|quanto|confermiamo|purtroppo)\b/i.test(t)) lang = 'it';
    else if (/\b(prix|cachet|combien|confirmons|désolé|malheureusement)\b/i.test(t)) lang = 'fr';
    else lang = 'es';
  }

  if (estadoActual === "descartado" || estadoActual === "confirmado") {
    return estadoActual;
  }

  const resType = detectResponseType(textoRespuesta, lang);

  if (resType === "rejection") {
    return "no_interesado";
  }
  if (resType === "confirmation") {
    return "confirmado";
  }
  if (resType === "price_negotiation" || getNegotiationKeywords(lang).some((k) => matchesKeyword(t, k))) {
    return "negociando";
  }
  if (estadoActual === "contactado" || estadoActual === "esperando_respuesta" || estadoActual === "nuevo") {
    return "respondido";
  }
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
  /** Autoresponders, newsletters y avisos de sistema: se ignoran, sin cambiar estados ni gastar IA. */
  automaticosIgnorados: number;
}

function cleanMessageId(id?: string): string {
  if (!id) return "";
  return id.replace(/^imap-/, "").replace(/^<+/, "").replace(/>+$/, "").trim().toLowerCase();
}

/**
 * Patrón ILIKE para buscar en lead_messages el mensaje cuyo id (`imap-<Message-ID>`) contiene la
 * referencia. La referencia viene de las cabeceras In-Reply-To/References, que escribe un tercero:
 * antes se interpolaba en un filtro `.or(...)` de PostgREST, donde una coma o un paréntesis
 * cambiaban el filtro. Se escapan los comodines de LIKE (y `*`, que PostgREST trata como `%`), y
 * una referencia corta se descarta porque como subcadena casaría con cualquier id.
 */
export function patronIlikeMessageId(ref: string): string | null {
  if (!ref || ref.length < 8) return null;
  const escapada = ref.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/\*/g, "_");
  return `imap-%${escapada}%`;
}

function cleanEmailAddress(addr?: string): string {
  if (!addr) return "";
  const match = addr.match(/<([^>]+)>/);
  const raw = match ? match[1] : addr;
  return raw.replace(/["']/g, "").trim().toLowerCase();
}

function extractEmailDomain(addr?: string): string {
  const clean = cleanEmailAddress(addr);
  const parts = clean.split("@");
  return parts.length === 2 ? parts[1].trim().toLowerCase() : "";
}

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "live.com",
  "yahoo.com", "yahoo.es", "icloud.com", "me.com", "proton.me", "protonmail.com"
]);

/**
 * Motor de Emparejamiento Multi-Vector de Precisión ("Nivel Dios"):
 * Resuelve a qué lead pertenece un email entrante a través de 5 vectores jerárquicos:
 * 1. Gmail Thread ID (100% determinista si se envió por Gmail)
 * 2. In-Reply-To & References RFC 5322 (cadena de Message-IDs)
 * 3. Email principal / secundario / normalizado
 * 4. Dominio corporativo de la sala/festival (ej: @baobaoclub.com -> Sala BaoBao)
 * 5. Asunto y mención del nombre del recinto con estado activo
 */
export async function findMatchingLeadForIncomingMessage(
  msg: RespuestaEntrante,
  leads: LeadConCorreo[],
  bandId: string
): Promise<{ lead: LeadConCorreo; matchReason: string; shouldAutoEnrichEmail?: string } | null> {
  const sb = getSupabase();
  const fromClean = cleanEmailAddress(msg.from);
  const fromDomain = extractEmailDomain(msg.from);

  // --- VECTOR 1: Gmail Thread ID ---
  if (msg.threadId) {
    const leadByThread = leads.find((l) => l.gmail_thread_id && String(l.gmail_thread_id).trim() === String(msg.threadId).trim());
    if (leadByThread) {
      return { lead: leadByThread, matchReason: `Gmail Thread ID (${msg.threadId})`, shouldAutoEnrichEmail: fromClean };
    }

    try {
      const { data: msgByThread } = await sb
        .from("lead_messages")
        .select("lead_id")
        .eq("band_id", bandId)
        .eq("asunto", msg.subject || "")
        .maybeSingle();
      if (msgByThread) {
        const matched = leads.find((l) => String(l.id) === String(msgByThread.lead_id));
        if (matched) return { lead: matched, matchReason: `Lead Message Thread/Subject (${msg.threadId})`, shouldAutoEnrichEmail: fromClean };
      }
    } catch (err) { console.warn("[Lector] Fallo buscando el lead por asunto del hilo; se prueba el siguiente criterio:", err); }
  }

  // --- VECTOR 2: In-Reply-To & References RFC 5322 ---
  const allReferences: string[] = [];
  if (msg.inReplyTo) allReferences.push(cleanMessageId(msg.inReplyTo));
  if (msg.references && Array.isArray(msg.references)) {
    msg.references.forEach((r) => {
      const c = cleanMessageId(r);
      if (c && !allReferences.includes(c)) allReferences.push(c);
    });
  }

  for (const ref of allReferences) {
    if (!ref) continue;
    // Comprobar con leads.gmail_message_id
    const leadByMsgId = leads.find((l) => {
      const gId = cleanMessageId(l.gmail_message_id);
      return gId && (gId === ref || ref.includes(gId) || gId.includes(ref));
    });
    if (leadByMsgId) {
      return { lead: leadByMsgId, matchReason: `RFC References Match (${ref})`, shouldAutoEnrichEmail: fromClean };
    }

    // Comprobar en lead_messages
    const patron = patronIlikeMessageId(ref);
    if (!patron) continue;
    try {
      const { data: origMsg } = await sb
        .from("lead_messages")
        .select("lead_id")
        .eq("band_id", bandId)
        .ilike("id", patron)
        .limit(1)
        .maybeSingle();

      if (origMsg) {
        const matched = leads.find((l) => String(l.id) === String(origMsg.lead_id));
        if (matched) {
          return { lead: matched, matchReason: `RFC In-Reply-To (${ref})`, shouldAutoEnrichEmail: fromClean };
        }
      }
    } catch (err) { console.warn("[Lector] Fallo buscando el lead por In-Reply-To; se prueba el siguiente criterio:", err); }
  }

  // --- VECTOR 3: Email Principal, Secundario o Alias ---
  if (fromClean) {
    const leadByEmail = leads.find((l) => {
      const main = cleanEmailAddress(l.email_contacto);
      const sec = cleanEmailAddress(l.email_secundario);
      if (main && (main === fromClean || fromClean.includes(main) || main.includes(fromClean))) return true;
      if (sec && (sec === fromClean || fromClean.includes(sec) || sec.includes(fromClean))) return true;
      return false;
    });

    if (leadByEmail) {
      return { lead: leadByEmail, matchReason: `Email Address Match (${fromClean})` };
    }
  }

  // --- VECTOR 4: Dominio Corporativo del Recinto ---
  if (fromDomain && !GENERIC_EMAIL_DOMAINS.has(fromDomain)) {
    const leadByDomain = leads.find((l) => {
      const mainDom = extractEmailDomain(l.email_contacto);
      const secDom = extractEmailDomain(l.email_secundario);
      let webDom = "";
      if (l.website) {
        try {
          webDom = new URL(l.website.startsWith("http") ? l.website : `https://${l.website}`).hostname.replace(/^www\./, "").toLowerCase();
        } catch { /* web del lead mal formada: no cuenta para emparejar por dominio */ }
      }
      return (mainDom && mainDom === fromDomain) || (secDom && secDom === fromDomain) || (webDom && (webDom === fromDomain || fromDomain.includes(webDom) || webDom.includes(fromDomain)));
    });

    if (leadByDomain) {
      return { lead: leadByDomain, matchReason: `Domain Match (@${fromDomain})` };
    }
  }

  // --- VECTOR 5: Asunto & Nombre de la Sala (Fuzzy Matching Inteligente) ---
  const subjectClean = (msg.subject || "").toLowerCase().replace(/^(re|fwd|rv|aw|respuesta|sv):\s*/gi, "").trim();
  if (subjectClean.length >= 3) {
    const candidateLeads = leads.filter((l) => {
      const nombre = (l.nombre_sala || "").toLowerCase().trim();
      return nombre.length >= 3 && subjectClean.includes(nombre);
    });

    if (candidateLeads.length === 1) {
      return { lead: candidateLeads[0], matchReason: `Subject Name Match ("${candidateLeads[0].nombre_sala}")` };
    }

    if (candidateLeads.length > 1) {
      // Priorizar el que esté en un estado de conversación activa
      const active = candidateLeads.find((l) => ["contactado", "esperando_respuesta", "borrador_creado", "negociando"].includes(l.estado));
      if (active) {
        return { lead: active, matchReason: `Subject Active Conversation Match ("${active.nombre_sala}")` };
      }
    }
  }

  return null;
}

export async function runLectorAgent(bandId: string): Promise<LectorAgentResult> {
  // Gmail por OAuth (sin contraseña) se prefiere sobre IMAP, igual que ya hace el Agente
  // Enviador (server/services/agentEngine.ts) - hasta ahora este agente era 100% IMAP, así que
  // una banda conectada solo por OAuth nunca detectaba respuestas entrantes en absoluto.
  const usarGmailOAuth = await tieneGmailOAuthConectado(bandId);

  const leadsActualizados: string[] = [];

  // Comprueba, solo si la banda usa OAuth, si algún borrador que el Agente Enviador dejó en
  // Gmail se envió a mano desde ahí sin pasar por la app (ver comprobarBorradoresGmailEnviados).
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
    return { mensajesLeidos: 0, leadsActualizados, sinEmparejar: 0, borradoresEnviadosDetectados, borradoresTodaviaSinEnviar, erroresComprobandoBorradores, cuentaGmailReal, borradorIaGenerados: 0, borradorIaFallidos: 0, borradorIaBloqueadosPorLimite: 0, automaticosIgnorados: 0 };
  }

  const leads: LeadConCorreo[] = await dbGetLeads(bandId);
  const uidsProcesados: Array<number | string> = [];
  let sinEmparejar = 0;
  let borradorIaGenerados = 0;
  let borradorIaFallidos = 0;
  let borradorIaBloqueadosPorLimite = 0;
  let automaticosIgnorados = 0;

  for (const msg of mensajes) {
    // Un bounce/NDR llega DESPUÉS de que el Enviador ya diera el pitch por enviado
    if (isBounceMessage(msg.subject || "", msg.from || "")) {
      const emailFallido = extractFailedRecipientEmail(msg.text || "");
      const leadBounce = emailFallido
        ? leads.find((l) => (l.email_contacto || "").toLowerCase().trim() === emailFallido)
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

    // Un autoresponder ("fuera de la oficina"), una newsletter o un aviso de sistema no es una
    // respuesta de la sala: no cambia el estado de ningún lead ni gasta una llamada de IA.
    if (msg.automatico) {
      automaticosIgnorados++;
      uidsProcesados.push(msg.uid);
      continue;
    }

    // Emparejamiento Multi-Vector inteligente
    const matchResult = await findMatchingLeadForIncomingMessage(msg, leads, bandId);
    const lead = matchResult?.lead || null;

    if (lead && matchResult) {
      console.log(`[Lector] ✨ Emparejamiento exitoso: ${msg.from} -> Lead ${lead.id} (${lead.nombre_sala}) vía [${matchResult.matchReason}]`);

      // Auto-enriquecimiento de email secundario si respondió desde una dirección alternativa.
      // SOLO cuando el emparejamiento es por el hilo del correo (thread / References /
      // In-Reply-To): esa respuesta es de verdad de la sala. Antes también se hacía al emparejar
      // por dominio o por el nombre en el asunto, y un compañero, un reenvío o un auto-reply
      // acababan como destinatario de los siguientes envíos.
      if (matchResult.shouldAutoEnrichEmail && esEmailValido(matchResult.shouldAutoEnrichEmail)) {
        const newEmail = matchResult.shouldAutoEnrichEmail;
        const mainEmail = cleanEmailAddress(lead.email_contacto);
        const secEmail = cleanEmailAddress(lead.email_secundario);

        if (!mainEmail) {
          lead.email_contacto = newEmail;
          await dbUpsertLead(lead, bandId);
        } else if (!secEmail && mainEmail !== newEmail) {
          lead.email_secundario = newEmail;
          await dbUpsertLead(lead, bandId);
          console.log(`[Lector] 📧 Email secundario auto-enriquecido para Lead ${lead.id}: ${newEmail}`);
        }
      }
    } else {
      console.log(`[Lector] Procesando: ${msg.from} -> SIN EMPAREJAR (Subject: "${msg.subject?.substring(0, 30)}")`);
      sinEmparejar++;
      continue;
    }

    if (!msg.text) {
      uidsProcesados.push(msg.uid);
      continue;
    }

    // El Message-ID de IMAP/Gmail es único por RFC 5322
    const messageRowId = `imap-${msg.messageId}`;
    const yaRegistrado = await dbLeadMessageExists(messageRowId);
    if (!yaRegistrado) {
      // Se clasifica y se redacta sobre lo que escribió la sala; lo citado es nuestro propio pitch
      // ("caché", "fecha"...) y el clasificador lo leía como si lo dijera ella. En lead_messages se
      // guarda el mensaje completo, tal como llegó.
      const textoPropio = quitarTextoCitado(msg.text);
      const hiloPrevio = await dbGetLeadMessages(String(lead.id), bandId);
      const threadSoFar = hiloPrevio.map((m) => ({ remitente: m.remitente, mensaje: m.mensaje }));

      // Análisis de sentimiento, intención y temperatura comercial por el Agente Lector
      const leadLang = detectPitchLanguage(lead);
      const sentimentAnalysis = await analyzeIncomingMessageSentiment(textoPropio, leadLang.code, {
        name: lead.nombre_sala,
        city: lead.ciudad,
        tipo: lead.tipo
      });

      console.log(`[Lector] Sentimiento detectado para lead ${lead.id}: ${sentimentAnalysis.sentimiento} (Score: ${sentimentAnalysis.sentimiento_score}), Intención: ${sentimentAnalysis.intencion}, Temp: ${sentimentAnalysis.temperatura}`);

      await dbCreateLeadMessage({
        id: messageRowId,
        lead_id: lead.id,
        band_id: bandId,
        remitente: "sala",
        remitente_nombre: lead.nombre_sala || msg.fromName || "Sala",
        asunto: msg.subject || "",
        mensaje: msg.text,
        fecha: (msg.date || new Date()).toISOString(),
        sentimiento: sentimentAnalysis.sentimiento,
        sentimiento_score: sentimentAnalysis.sentimiento_score,
        sentimiento_label: sentimentAnalysis.sentimiento_label,
        intencion: sentimentAnalysis.intencion,
        intencion_etiqueta: sentimentAnalysis.intencion_etiqueta,
        temperatura: sentimentAnalysis.temperatura,
        objeciones: sentimentAnalysis.objeciones_detectadas,
        puntos_clave: sentimentAnalysis.puntos_clave,
        fechas_propuestas: sentimentAnalysis.fechas_propuestas,
        condiciones_economicas: sentimentAnalysis.condiciones_economicas,
        requisitos_tecnicos: sentimentAnalysis.requisitos_tecnicos,
        accion_sugerida: sentimentAnalysis.accion_sugerida,
        estrategia_playbook: sentimentAnalysis.estrategia_playbook,
        resumen_ejecutivo: sentimentAnalysis.resumen_ejecutivo,
        sugerencia_estrategia: sentimentAnalysis.sugerencia_estrategia,
        analisis_ia: sentimentAnalysis
      });

      // Auto-Contestador: Redactar respuesta de alta precisión en 'pendiente_aprobacion'
      let nuevoEstado = detectarEstadoTrasRespuesta(lead.estado, textoPropio, leadLang.code);
      let borradorGenerado: string | null = null;
      if (puedeGenerarBorradorIA(bandId)) {
        try {
          const { draftReply } = await generarBorradorRespuesta(
            bandId,
            lead,
            textoPropio,
            threadSoFar,
            undefined,
            undefined,
            sentimentAnalysis
          );
          borradorGenerado = draftReply;
          // Un lead descartado o confirmado no vuelve a la cola de aprobación solo porque el
          // contrario haya escrito: el borrador se guarda, pero el estado lo decide una persona.
          if (lead.estado !== "descartado" && lead.estado !== "confirmado") {
            nuevoEstado = "pendiente_aprobacion";
          }
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
        email_abierto: true,
        veces_abierto: Math.max(Number(lead.veces_abierto) || 0, 1),
        primer_abierto_at: lead.primer_abierto_at || (msg.date || new Date()).toISOString(),
        ultimo_abierto_at: (msg.date || new Date()).toISOString(),
        ...(borradorGenerado ? { pitch_generado: borradorGenerado } : {}),
        fecha_ultima_respuesta: (msg.date || new Date()).toISOString(),
        ultimo_sentimiento: sentimentAnalysis.sentimiento,
        ultimo_sentimiento_score: sentimentAnalysis.sentimiento_score,
        ultimo_sentimiento_label: sentimentAnalysis.sentimiento_label,
        ultima_intencion: sentimentAnalysis.intencion,
        ultima_intencion_etiqueta: sentimentAnalysis.intencion_etiqueta,
        ultimas_objeciones: sentimentAnalysis.objeciones_detectadas,
        ultimo_analisis_resumen: sentimentAnalysis.resumen_ejecutivo,
        temperatura_lead: sentimentAnalysis.temperatura,
        fechas_propuestas_sala: sentimentAnalysis.fechas_propuestas,
        condiciones_economicas_detectadas: sentimentAnalysis.condiciones_economicas,
        requisitos_tecnicos_detectados: sentimentAnalysis.requisitos_tecnicos,
        accion_sugerida_ia: sentimentAnalysis.accion_sugerida,
        estrategia_playbook: sentimentAnalysis.estrategia_playbook
      }, bandId);

      if (msg.messageId) {
        try {
          await getSupabase().from("leads").update({ gmail_message_id: msg.messageId }).eq("id", lead.id).eq("band_id", bandId);
        } catch (idErr) {
          console.warn(`[Lector] No se pudo actualizar gmail_message_id para el lead ${lead.id}:`, idErr);
        }
      }

      leadsActualizados.push(String(lead.id));
    }

    uidsProcesados.push(msg.uid);
  }

  // Solo se marcan los mensajes como "leídos" en la bandeja de entrada externa (Gmail/Outlook)
  // si la banda activó explícitamente la opción 'markAsReadInInbox' en su configuración de autonomía.
  // Por defecto (false), el Agente Lector extrae la información para el CRM pero respeta el estado
  // SIN LEER en el buzón oficial para que el usuario mantenga el control total de su correo.
  const autonomyConfig = await dbGetAutonomyConfig(bandId).catch(() => null);
  const debeMarcarComoLeido = autonomyConfig?.markAsReadInInbox === true;

  if (debeMarcarComoLeido && uidsProcesados.length > 0) {
    const marcarLeidos = usarGmailOAuth
      ? marcarComoLeidoGmailApi(bandId, uidsProcesados as string[])
      : marcarComoLeido(bandId, uidsProcesados as number[]);
    await marcarLeidos.catch((err) => {
      console.warn(`[Lector] No se pudieron marcar como leídos los mensajes de ${bandId}:`, err);
    });
  } else if (uidsProcesados.length > 0) {
    console.log(`[Lector] Banda ${bandId}: ${uidsProcesados.length} mensaje(s) procesados manteniendo su estado SIN LEER en la bandeja de entrada.`);
  }

  return { mensajesLeidos: mensajes.length, leadsActualizados, sinEmparejar, borradoresEnviadosDetectados, borradoresTodaviaSinEnviar, erroresComprobandoBorradores, cuentaGmailReal, borradorIaGenerados, borradorIaFallidos, borradorIaBloqueadosPorLimite, automaticosIgnorados };
}

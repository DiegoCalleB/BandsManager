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
import { dbGetLeads, dbUpsertLead, dbLeadMessageExists, dbCreateLeadMessage } from "../db.js";

// Heurística ligera y barata (sin llamada a IA) para decidir si una respuesta abre negociación:
// entrar aquí no bloquea el hilo, y una clasificación de más no hace daño (el mánager siempre
// puede corregir el estado a mano).
const PALABRAS_NEGOCIACION = [
  "precio", "cache", "caché", "presupuesto", "condiciones", "tarifa", "cuánto", "cuanto cobr",
  "fecha", "disponibilidad", "cuándo", "cuando podéis", "contrato", "rider"
];

export function detectarEstadoTrasRespuesta(estadoActual: string, textoRespuesta: string): string {
  const t = (textoRespuesta || "").toLowerCase();
  if (PALABRAS_NEGOCIACION.some((k) => t.includes(k))) return "negociando";
  if (estadoActual === "contactado" || estadoActual === "esperando_respuesta") return "respondido";
  return estadoActual;
}

export interface LectorAgentResult {
  mensajesLeidos: number;
  leadsActualizados: string[];
  sinEmparejar: number;
}

export async function runLectorAgent(bandId: string): Promise<LectorAgentResult> {
  const mensajes = await leerRespuestasEntrantes(bandId);
  if (mensajes.length === 0) {
    return { mensajesLeidos: 0, leadsActualizados: [], sinEmparejar: 0 };
  }

  const leads = await dbGetLeads(bandId);
  const leadsActualizados: string[] = [];
  const uidsProcesados: number[] = [];
  let sinEmparejar = 0;

  for (const msg of mensajes) {
    const fromLower = (msg.from || "").toLowerCase().trim();
    const lead = fromLower
      ? leads.find((l: any) => (l.email_contacto || "").toLowerCase().trim() === fromLower)
      : null;

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

      const nuevoEstado = detectarEstadoTrasRespuesta(lead.estado, msg.text);
      if (nuevoEstado !== lead.estado || !lead.fecha_ultima_respuesta) {
        await dbUpsertLead({
          ...lead,
          estado: nuevoEstado,
          fecha_ultima_respuesta: (msg.date || new Date()).toISOString()
        }, bandId);
      }
      leadsActualizados.push(String(lead.id));
    }

    uidsProcesados.push(msg.uid);
  }

  if (uidsProcesados.length > 0) {
    await marcarComoLeido(bandId, uidsProcesados).catch((err) => {
      console.warn(`[Lector] No se pudieron marcar como leídos los mensajes de ${bandId}:`, err);
    });
  }

  return { mensajesLeidos: mensajes.length, leadsActualizados, sinEmparejar };
}

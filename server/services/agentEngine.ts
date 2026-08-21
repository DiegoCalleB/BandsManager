// Motor consolidado de agentes de booking (Enviador ya migrado; Scout/Redactor/Lector siguen
// el mismo patrón en una fase posterior - ver server/routes/agent.ts). Se llama tanto desde el
// endpoint HTTP manual (/api/trigger-agent, disparado por el chatbot o un usuario) como desde
// el scheduler interno (server/services/agentScheduler.ts, disparo por horario configurado por
// banda) - una sola implementación real, sin duplicar lógica entre los dos disparadores.

import { getSupabase } from "../db.js";
import { BAKANDEYA_BAND_ID } from "../state.js";
import { enviarEmail, EmailAgentError } from "./emailAgentClient.js";

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
      band_id: logData.band_id || BAKANDEYA_BAND_ID,
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

export interface EnviadorResult {
  success: boolean;
  dispatchedCount: number;
  message: string;
  results: any[];
}

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

  let query = sb.from("leads").select("*").in("estado", ["aprobado_propuesta", "aprobado", "aprobado_respuesta"]);
  if (opts.leadId) {
    query = sb.from("leads").select("*").eq("id", opts.leadId);
  } else {
    query = query.eq("band_id", opts.bandId);
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

  const results: any[] = [];
  const nowIso = new Date().toISOString();

  for (const lead of approvedLeads) {
    const emailContacto = lead.email_contacto || lead.email;
    const pitch = lead.pitch_generado || lead.ultimo_mensaje_recibido || "Hola, os dejamos nuestra propuesta de concierto.";
    const isRespuesta = lead.estado === "aprobado_respuesta";
    const asunto = isRespuesta
      ? `Re: Concierto ${bandName} en ${lead.nombre_sala}`
      : `Propuesta de concierto: ${bandName} en ${lead.nombre_sala}`;

    if (!emailContacto) {
      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "error", error: "El lead no tiene email de contacto." });
      continue;
    }

    try {
      await enviarEmail(opts.bandId, {
        to: emailContacto,
        subject: asunto,
        body: pitch,
        inReplyTo: lead.thread_id || undefined
      });

      const nextState = isRespuesta ? "negociando" : "contactado";
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const newNote = `*** [${dateTag}] Correo ENVIADO a ${emailContacto} por el Agente Enviador (email real) ***\n` + (lead.notas || "");

      await sb.from("leads").update({ estado: nextState, fecha_envio: nowIso, notas: newNote }).eq("id", lead.id);

      await sb.from("lead_messages").insert({
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        lead_id: lead.id,
        band_id: lead.band_id || opts.bandId,
        remitente: "banda",
        remitente_nombre: `${bandName} Booking`,
        asunto,
        mensaje: pitch,
        fecha: nowIso
      });

      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, email_contacto: emailContacto, estado_anterior: lead.estado, estado_nuevo: nextState, fecha_envio: nowIso, status: "enviado" });
    } catch (err: any) {
      const isIdentityIssue = err instanceof EmailAgentError && (err.code === "no_token" || err.code === "identity_mismatch");
      results.push({ id: lead.id, nombre_sala: lead.nombre_sala, status: "error", error: err.message || String(err) });
      // Si el problema es de identidad/token, es el mismo para toda la banda: no tiene
      // sentido reintentar con el resto de leads de este lote.
      if (isIdentityIssue) break;
    }
  }

  const sentCount = results.filter((r) => r.status === "enviado").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const successMsg = sentCount > 0
    ? `Agente Enviador: ${sentCount} propuesta(s) despachada(s) por email real${errorCount > 0 ? `, ${errorCount} con error` : ""}.`
    : `Agente Enviador: no se pudo despachar ninguna propuesta (${errorCount} error(es)).`;

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
    detalles: { band_name: bandName }
  });

  return { success: sentCount > 0 || errorCount === 0, dispatchedCount: sentCount, message: successMsg, results };
}

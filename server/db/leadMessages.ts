import { getSupabase, cleanBandId } from "./core.js";
import crypto from "crypto";

// lead_messages es la tabla real de historial de conversación por lead - el Agente Enviador ya
// escribe aquí cada pitch enviado de verdad (server/services/agentEngine.ts). El Lector y el
// Contestador deben leer/escribir en la MISMA tabla para que el hilo esté completo (lo que
// mandamos + lo que responden), en vez de usar leads.hilo_emails, que es un campo aparte que
// hoy solo toca el frontend (integración de Gmail, simulación de negociación) y nunca se cruza
// con lo que el Enviador ya registra.
export interface DbLeadMessage {
  id: string;
  lead_id: string;
  band_id: string;
  fecha: string;
  remitente: "banda" | "sala";
  remitente_nombre: string;
  asunto: string;
  mensaje: string;
  unsubscribe_token?: string | null;
  unsubscribe_timestamp?: string | null;
}

export async function dbGetLeadMessages(leadId: string, bandId: string): Promise<DbLeadMessage[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("lead_messages")
      .select("*")
      .eq("lead_id", leadId)
      .eq("band_id", cleanBandId(bandId))
      .order("fecha", { ascending: true });

    if (error) {
      console.warn("Supabase lead_messages query warning:", error.message);
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn("Could not query lead_messages from Supabase:", err?.message || err);
    return [];
  }
}

/**
 * Genera un token seguro para unsubscribe (32 bytes en hex = 64 caracteres).
 * Usado en el footer de emails para permitir a las salas darse de baja (LSSICE).
 */
function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function dbLeadMessageExists(id: string): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { data } = await sb.from("lead_messages").select("id").eq("id", id).maybeSingle();
    return !!data;
  } catch (err) {
    return false;
  }
}

export async function dbCreateLeadMessage(msg: {
  id?: string;
  lead_id: string;
  band_id: string;
  remitente: "banda" | "sala";
  remitente_nombre: string;
  asunto?: string;
  mensaje: string;
  fecha?: string;
  unsubscribe_token?: string; // Token explícito si lo quieres pasar (normalmente generado aquí)
}): Promise<DbLeadMessage> {
  const sb = getSupabase();

  // Generar token de baja solo para emails que enviamos (remitente = "banda")
  // Los mensajes de salas que recibimos no necesitan token (ellos ya pueden responder en el hilo)
  const unsubscribeToken = msg.remitente === "banda" ? (msg.unsubscribe_token || generateUnsubscribeToken()) : null;

  const payload = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    lead_id: msg.lead_id,
    band_id: cleanBandId(msg.band_id),
    remitente: msg.remitente,
    remitente_nombre: msg.remitente_nombre || "",
    asunto: msg.asunto || "",
    mensaje: msg.mensaje,
    fecha: msg.fecha || new Date().toISOString(),
    unsubscribe_token: unsubscribeToken,
    unsubscribe_timestamp: null
  };

  const { data, error } = await sb.from("lead_messages").insert(payload).select().single();
  if (error) throw new Error(`Supabase Error (create lead message): ${error.message}`);
  return data;
}

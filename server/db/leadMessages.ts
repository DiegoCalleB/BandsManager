// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { getSupabase, cleanBandId } from "./core.js";

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
}): Promise<DbLeadMessage> {
  const sb = getSupabase();
  const payload = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    lead_id: msg.lead_id,
    band_id: cleanBandId(msg.band_id),
    remitente: msg.remitente,
    remitente_nombre: msg.remitente_nombre || "",
    asunto: msg.asunto || "",
    mensaje: msg.mensaje,
    fecha: msg.fecha || new Date().toISOString()
  };

  const { data, error } = await sb.from("lead_messages").insert(payload).select().single();
  if (error) throw new Error(`Supabase Error (create lead message): ${error.message}`);
  return data;
}

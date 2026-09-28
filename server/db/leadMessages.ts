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
  sentimiento?: string;
  sentimiento_score?: number;
  sentimiento_label?: string;
  intencion?: string;
  intencion_etiqueta?: string;
  temperatura?: string;
  objeciones?: string[];
  puntos_clave?: string[];
  fechas_propuestas?: string[];
  condiciones_economicas?: any;
  requisitos_tecnicos?: string[];
  accion_sugerida?: string;
  estrategia_playbook?: any;
  resumen_ejecutivo?: string;
  sugerencia_estrategia?: string;
  analisis_ia?: any;
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
  sentimiento?: string;
  sentimiento_score?: number;
  sentimiento_label?: string;
  intencion?: string;
  intencion_etiqueta?: string;
  temperatura?: string;
  objeciones?: string[];
  puntos_clave?: string[];
  fechas_propuestas?: string[];
  condiciones_economicas?: any;
  requisitos_tecnicos?: string[];
  accion_sugerida?: string;
  estrategia_playbook?: any;
  resumen_ejecutivo?: string;
  sugerencia_estrategia?: string;
  analisis_ia?: any;
}): Promise<DbLeadMessage> {
  const sb = getSupabase();
  const payload: any = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    lead_id: msg.lead_id,
    band_id: cleanBandId(msg.band_id),
    remitente: msg.remitente,
    remitente_nombre: msg.remitente_nombre || "",
    asunto: msg.asunto || "",
    mensaje: msg.mensaje,
    fecha: msg.fecha || new Date().toISOString()
  };

  if (msg.sentimiento !== undefined) payload.sentimiento = msg.sentimiento;
  if (msg.sentimiento_score !== undefined) payload.sentimiento_score = msg.sentimiento_score;
  if (msg.sentimiento_label !== undefined) payload.sentimiento_label = msg.sentimiento_label;
  if (msg.intencion !== undefined) payload.intencion = msg.intencion;
  if (msg.intencion_etiqueta !== undefined) payload.intencion_etiqueta = msg.intencion_etiqueta;
  if (msg.temperatura !== undefined) payload.temperatura = msg.temperatura;
  if (msg.objeciones !== undefined) payload.objeciones = msg.objeciones;
  if (msg.puntos_clave !== undefined) payload.puntos_clave = msg.puntos_clave;
  if (msg.fechas_propuestas !== undefined) payload.fechas_propuestas = msg.fechas_propuestas;
  if (msg.condiciones_economicas !== undefined) payload.condiciones_economicas = msg.condiciones_economicas;
  if (msg.requisitos_tecnicos !== undefined) payload.requisitos_tecnicos = msg.requisitos_tecnicos;
  if (msg.accion_sugerida !== undefined) payload.accion_sugerida = msg.accion_sugerida;
  if (msg.estrategia_playbook !== undefined) payload.estrategia_playbook = msg.estrategia_playbook;
  if (msg.resumen_ejecutivo !== undefined) payload.resumen_ejecutivo = msg.resumen_ejecutivo;
  if (msg.sugerencia_estrategia !== undefined) payload.sugerencia_estrategia = msg.sugerencia_estrategia;
  if (msg.analisis_ia !== undefined) payload.analisis_ia = msg.analisis_ia;

  try {
    const { data, error } = await sb.from("lead_messages").insert(payload).select().single();
    if (error) {
      // Si falla por columnas adicionales no migradas aún en Supabase remoto, reintentamos con payload base
      console.warn("Supabase create lead message with sentiment warning, falling back to base payload:", error.message);
      const basePayload = {
        id: payload.id,
        lead_id: payload.lead_id,
        band_id: payload.band_id,
        remitente: payload.remitente,
        remitente_nombre: payload.remitente_nombre,
        asunto: payload.asunto,
        mensaje: payload.mensaje,
        fecha: payload.fecha
      };
      const fallback = await sb.from("lead_messages").insert(basePayload).select().single();
      if (fallback.error) throw new Error(`Supabase Error (create lead message): ${fallback.error.message}`);
      return { ...fallback.data, ...payload };
    }
    return data;
  } catch (err: any) {
    console.warn("Could not insert lead message into Supabase:", err?.message || err);
    return payload as DbLeadMessage;
  }
}

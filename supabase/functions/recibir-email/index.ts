// Supabase Edge Function: recibir-email
// Webhook Inbound para recibir respuestas de salas de conciertos (Resend, SendGrid, Mailgun o Gmail Forwarder).
// Registra el email entrante en lead_messages, actualiza el estado a 'respondido' en Supabase
// y clasifica la intención mediante IA (Gemini).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Clasificador de respuesta con Gemini REST API
async function classifyEmailIntent(messageText: string, geminiKey?: string): Promise<{ intent: string; summary: string }> {
  if (!geminiKey || !messageText) {
    return { intent: "respuesta_general", summary: "Nueva respuesta recibida de la sala." };
  }

  try {
    const prompt = `Analiza este correo recibido de una sala de conciertos o programador musical.
Mensaje:
"${messageText}"

Responde ÚNICAMENTE un objeto JSON válido con este formato exacto:
{
  "intent": "interesado" | "pedir_fechas" | "pedir_cache" | "sala_llena" | "no_interesado" | "general",
  "summary": "Resumen en una frase corta en español"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      return { intent: "respuesta_general", summary: "Respuesta recibida." };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);
    return {
      intent: parsed.intent || "general",
      summary: parsed.summary || "Respuesta recibida.",
    };
  } catch (err) {
    console.error("Error clasificando con Gemini:", err);
    return { intent: "respuesta_general", summary: "Respuesta recibida de la sala." };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Normalización de campos según el proveedor de inbound webhook
    const fromRaw = body.from || body.sender || body.envelope?.from || "";
    const fromEmail = (fromRaw.match(/<([^>]+)>/)?.[1] || fromRaw).toLowerCase().trim();
    const fromName = fromRaw.replace(/<[^>]+>/, "").trim() || fromEmail;
    const subject = body.subject || "Respuesta de sala";
    const messageText = body.text || body.plain || body.strippedText || body.body || body.html || "";
    const threadId = body.headers?.["message-id"] || body.message_id || body.thread_id || null;

    if (!fromEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "No se encontró remitente en el payload." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 1. Buscar la sala en Supabase por email_contacto
    const { data: matchedLeads, error: searchError } = await supabase
      .from("leads")
      .select("*")
      .ilike("email_contacto", `%${fromEmail}%`)
      .limit(1);

    if (searchError) {
      throw searchError;
    }

    const lead = matchedLeads && matchedLeads.length > 0 ? matchedLeads[0] : null;
    const nowIso = new Date().toISOString();

    // 2. Analizar el mensaje con IA
    const classification = await classifyEmailIntent(messageText, geminiKey);

    if (lead) {
      // Determinar nuevo estado según clasificación
      let nuevoEstado = "respondido";
      if (classification.intent === "interesado" || classification.intent === "pedir_fechas") {
        nuevoEstado = "interesado";
      } else if (classification.intent === "no_interesado") {
        nuevoEstado = "no_interesado";
      }

      // 3. Actualizar el lead en Supabase
      await supabase
        .from("leads")
        .update({
          estado: nuevoEstado,
          fecha_ultima_respuesta: nowIso,
          ultimo_mensaje_recibido: messageText.slice(0, 1000),
          thread_id: threadId || lead.thread_id,
          notas: `[IA Inbound: ${classification.summary}]\n${lead.notas || ""}`,
        })
        .eq("id", lead.id);

      // 4. Guardar mensaje en lead_messages
      await supabase.from("lead_messages").insert({
        id: crypto.randomUUID(),
        lead_id: lead.id,
        band_id: lead.band_id || "band-bakandeya",
        remitente: "sala",
        remitente_nombre: fromName || lead.nombre_sala,
        asunto: subject,
        mensaje: messageText,
        fecha: nowIso,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Mensaje de ${fromEmail} vinculado a sala ${lead.nombre_sala}. Estado: ${nuevoEstado}`,
          leadId: lead.id,
          classification,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } else {
      // Si el remitente no coincide con un lead existente, se crea un lead nuevo o se registra como contacto entrante
      const newLeadId = `lead-${Date.now()}`;
      await supabase.from("leads").insert({
        id: newLeadId,
        nombre_sala: fromName || fromEmail,
        ciudad: "Nacional",
        region: "Nacional",
        aforo: 0,
        email_contacto: fromEmail,
        estado: "respondido",
        fuente: "Email Entrante Directo",
        ultimo_mensaje_recibido: messageText.slice(0, 1000),
        fecha_ultima_respuesta: nowIso,
        notas: `Contacto recibido directamente por email. Clasificación IA: ${classification.summary}`,
      });

      await supabase.from("lead_messages").insert({
        id: crypto.randomUUID(),
        lead_id: newLeadId,
        band_id: "band-bakandeya",
        remitente: "sala",
        remitente_nombre: fromName,
        asunto: subject,
        mensaje: messageText,
        fecha: nowIso,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Nuevo lead creado a partir de email entrante de ${fromEmail}.`,
          leadId: newLeadId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Error en recibir-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error procesando webhook entrante" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

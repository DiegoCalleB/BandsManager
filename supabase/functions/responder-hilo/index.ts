// Supabase Edge Function: responder-hilo
// Envía respuestas a hilos abiertos de salas previamente aprobadas por el músico (aprobado_respuesta).
// Se ejecuta inmediatamente tras la aprobación o encolado sin restricciones de horario frío,
// ya que se trata de una conversación en curso (warm response).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Puede recibir un lead_id específico en el body o procesar todos los pendientes
    let targetLeadId: string | null = null;
    let customMensaje: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        targetLeadId = body.lead_id || null;
        customMensaje = body.mensaje || null;
      } catch {
        // Body vacío o no JSON
      }
    }

    let query = supabase
      .from("leads")
      .select("*")
      .eq("estado", "aprobado_respuesta");

    if (targetLeadId) {
      query = query.eq("id", targetLeadId);
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No hay respuestas pendientes de envío.",
          count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results = [];

    for (const lead of leads) {
      const emailContacto = lead.email_contacto;
      const mensajeAEnviar = customMensaje || lead.pitch_generado;

      if (!emailContacto || !mensajeAEnviar) {
        continue;
      }

      // Obtener datos de la banda
      let bandName = "Tu Banda";
      if (lead.band_id) {
        const { data: bandData } = await supabase
          .from("registered_bands")
          .select("nombre_banda, email")
          .eq("band_id", lead.band_id)
          .maybeSingle();
        if (bandData?.nombre_banda) {
          bandName = bandData.nombre_banda;
        }
      }

      const asunto = `Re: Concierto en ${lead.nombre_sala} - ${bandName}`;
      let emailSent = false;
      let emailErrorMsg = "";

      if (resendApiKey) {
        try {
          const emailPayload: Record<string, any> = {
            from: `${bandName} Booking <booking@bandmanager.ai>`,
            to: [emailContacto],
            subject: asunto,
            text: mensajeAEnviar,
          };

          // Si disponemos del thread_id o ID de mensaje previo para cabeceras RFC 2822 In-Reply-To
          if (lead.thread_id) {
            emailPayload.headers = {
              "In-Reply-To": lead.thread_id,
              "References": lead.thread_id,
            };
          }

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
          });
          const emailData = await emailRes.json();
          if (emailRes.ok) {
            emailSent = true;
          } else {
            emailErrorMsg = emailData?.message || "Error al responder con Resend";
          }
        } catch (err: any) {
          emailErrorMsg = err.message || "Error de red al enviar respuesta";
        }
      } else {
        console.log(`[SIMULACIÓN RESPUESTA HILO] A: ${emailContacto} | Thread: ${lead.thread_id || 'N/A'}`);
        emailSent = true;
      }

      if (emailSent) {
        const nowIso = new Date().toISOString();

        // Actualizar el estado del lead a 'negociando'
        await supabase
          .from("leads")
          .update({
            estado: "negociando",
            fecha_ultima_respuesta: nowIso,
          })
          .eq("id", lead.id);

        // Guardar mensaje en el historial del hilo
        await supabase.from("lead_messages").insert({
          id: crypto.randomUUID(),
          lead_id: lead.id,
          band_id: lead.band_id || "band-bakandeya",
          remitente: "banda",
          remitente_nombre: bandName,
          asunto: asunto,
          mensaje: mensajeAEnviar,
          fecha: nowIso,
        });

        results.push({ leadId: lead.id, sala: lead.nombre_sala, status: "enviado" });
      } else {
        results.push({ leadId: lead.id, sala: lead.nombre_sala, status: "error", error: emailErrorMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Respuestas enviadas: ${results.filter((r) => r.status === "enviado").length}`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error en responder-hilo:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

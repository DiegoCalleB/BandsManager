// Supabase Edge Function: despachador-propuestas
// Envía los pitches y propuestas aprobadas en frío respetando la ventana horaria anti-spam (M-J 10h-13:30h y 16:30h-18:30h)
// y aplicando pausas de seguridad (rate-limiting) entre envíos.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprueba si la hora actual en la zona de España está dentro de la ventana de oficina musical
function isWithinBookingWindow(): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    hour12: false,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
  });
  
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value || "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const timeInMinutes = hour * 60 + minute;

  // Días permitidos: Martes (Tue), Miércoles (Wed), Jueves (Thu)
  const allowedDays = ["Tue", "Wed", "Thu"];
  if (!allowedDays.includes(weekday)) {
    return false;
  }

  // Ventana mañana: 10:00 (600 min) - 13:30 (810 min)
  // Ventana tarde:  16:30 (990 min) - 18:30 (1110 min)
  const isMorningWindow = timeInMinutes >= 600 && timeInMinutes <= 810;
  const isAfternoonWindow = timeInMinutes >= 990 && timeInMinutes <= 1110;

  return isMorningWindow || isAfternoonWindow;
}

// Función auxiliar para pausar la ejecución (ms)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const forceRun = url.searchParams.get("force") === "true";

    // 1. Verificación de ventana horaria (salvo que se fuerce para tests manuales)
    if (!forceRun && !isWithinBookingWindow()) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Fuera de la ventana horaria óptima de booking (Martes a Jueves 10-13:30h / 16:30-18:30h). Envíos pospuestos.",
          dispatchedCount: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Obtener leads con estado 'aprobado_propuesta' (o 'aprobado' legado)
    const { data: leads, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .in("estado", ["aprobado_propuesta", "aprobado"])
      .order("created_at", { ascending: true })
      .limit(5); // Máximo 5 por lote para proteger la reputación del remitente

    if (fetchError) {
      throw fetchError;
    }

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No hay propuestas pendientes de envío.",
          dispatchedCount: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results = [];

    // 3. Procesar envíos de 1 en 1 con pausas anti-spam
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const emailContacto = lead.email_contacto;
      const pitch = lead.pitch_generado;

      if (!emailContacto || !pitch) {
        console.warn(`Lead ${lead.id} (${lead.nombre_sala}) no tiene email o pitch.`);
        continue;
      }

      // Obtener datos de la banda para el remitente
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

      const asunto = `Propuesta de concierto: ${bandName} en ${lead.nombre_sala}`;
      let emailSent = false;
      let emailErrorMsg = "";

      // Envío vía API (Resend u otro proveedor configurado)
      if (resendApiKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${bandName} Booking <booking@bandmanager.ai>`,
              to: [emailContacto],
              subject: asunto,
              text: pitch,
            }),
          });
          const emailData = await emailRes.json();
          if (emailRes.ok) {
            emailSent = true;
          } else {
            emailErrorMsg = emailData?.message || "Error al enviar con Resend";
          }
        } catch (err: any) {
          emailErrorMsg = err.message || "Fallo de conexión al enviar email";
        }
      } else {
        // Modo simulado / sin API key de correo: registra el envío de forma segura
        console.log(`[SIMULACIÓN ENVÍO EMAIL] A: ${emailContacto} | Asunto: ${asunto}`);
        emailSent = true;
      }

      if (emailSent) {
        const nowIso = new Date().toISOString();

        // 4. Actualizar estado del lead a 'enviado'
        await supabase
          .from("leads")
          .update({
            estado: "enviado",
            fecha_envio: nowIso,
          })
          .eq("id", lead.id);

        // 5. Insertar en historial de mensajes (lead_messages)
        await supabase.from("lead_messages").insert({
          id: crypto.randomUUID(),
          lead_id: lead.id,
          band_id: lead.band_id || "band-bakandeya",
          remitente: "banda",
          remitente_nombre: bandName,
          asunto: asunto,
          mensaje: pitch,
          fecha: nowIso,
        });

        results.push({ leadId: lead.id, sala: lead.nombre_sala, status: "enviado" });
      } else {
        results.push({ leadId: lead.id, sala: lead.nombre_sala, status: "error", error: emailErrorMsg });
      }

      // Pausa anti-spam de 45 segundos entre envíos (excepto si es el último del lote)
      if (i < leads.length - 1) {
        await sleep(45000);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Despachados ${results.filter((r) => r.status === "enviado").length} correos en frío.`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error en despachador-propuestas:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

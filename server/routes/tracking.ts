import express from "express";
import crypto from "crypto";
import { getSupabase } from "../db/core.js";

const router = express.Router();

// Transparent 1x1 GIF buffer (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const TRACKING_SECRET = process.env.JWT_SECRET || process.env.CRON_SECRET || "bandmanager-telemetry-key-2025";

/**
 * Genera un token firmado con HMAC para evitar manipulaciones.
 */
export function generateTrackingToken(payload: { leadId: string; bandId: string; msgId?: string }): string {
  const jsonStr = JSON.stringify(payload);
  const base64Data = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto.createHmac("sha256", TRACKING_SECRET).update(base64Data).digest("hex").slice(0, 16);
  return `${base64Data}.${signature}`;
}

/**
 * Valida y decodifica el token de tracking.
 */
export function decodeTrackingToken(token: string): { leadId: string; bandId: string; msgId?: string } | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64Data, providedSig] = parts;
  const expectedSig = crypto.createHmac("sha256", TRACKING_SECRET).update(base64Data).digest("hex").slice(0, 16);

  if (expectedSig !== providedSig) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(base64Data, "base64url").toString("utf8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * GET /api/tracking/open
 * Píxel transparente de apertura.
 * Registra apertura del correo sin bloquear ni guardar caché en navegadores/clientes de correo.
 */
router.get("/tracking/open", async (req, res) => {
  // Retornar siempre el gif transparente inmediatamente con no-cache
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(200).send(TRANSPARENT_GIF_BUFFER);

  const token = req.query.t as string;
  const decoded = decodeTrackingToken(token);
  if (!decoded || !decoded.leadId) {
    return;
  }

  try {
    const sb = getSupabase();
    const nowIso = new Date().toISOString();

    // Obtener lead actual para incrementar contadores
    const { data: lead } = await sb
      .from("leads")
      .select("id, band_id, notas, historial_contacto, veces_abierto, primer_abierto_at, ultimo_abierto_at")
      .eq("id", decoded.leadId)
      .maybeSingle();

    if (lead) {
      const veces = (Number(lead.veces_abierto) || 0) + 1;
      const primerAbierto = lead.primer_abierto_at || nowIso;
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      const logNota = `[👁️ Email Abierto (${veces}ª vez)] Registrado el ${dateTag}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      // Nuevo registro en historial_contacto
      const nuevoContacto = {
        id: `open-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Telemetría Sistema",
        notas: `La sala abrió el correo electrónico (apertura #${veces})`,
        resultado: "Info recibida"
      };

      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];

      await sb
        .from("leads")
        .update({
          veces_abierto: veces,
          primer_abierto_at: primerAbierto,
          ultimo_abierto_at: nowIso,
          email_abierto: true,
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", decoded.leadId);
    }
  } catch (err: any) {
    console.warn("[Tracking] Error al registrar apertura:", err?.message || err);
  }
});

/**
 * GET /api/tracking/click
 * Redirector seguro de enlaces.
 * Registra que el programador hizo clic en el EPK, vídeo o enlace, y redirige a la URL real.
 */
router.get("/tracking/click", async (req, res) => {
  const targetUrl = (req.query.url as string) || "https://bandmanager.io";
  const token = req.query.t as string;
  const decoded = decodeTrackingToken(token);

  // Redirigir siempre a la URL solicitada
  // Validar protocolo seguro para evitar ataques de redirección maliciosa
  const isValidUrl = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
  const safeRedirectUrl = isValidUrl ? targetUrl : "https://bandmanager.io";

  res.redirect(302, safeRedirectUrl);

  if (!decoded || !decoded.leadId) {
    return;
  }

  try {
    const sb = getSupabase();
    const nowIso = new Date().toISOString();

    const { data: lead } = await sb
      .from("leads")
      .select("id, band_id, notas, historial_contacto, clics_epk, ultimo_clic_at")
      .eq("id", decoded.leadId)
      .maybeSingle();

    if (lead) {
      const clics = (Number(lead.clics_epk) || 0) + 1;
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      const logNota = `[🔗 Clic en Enlace (${clics}º clic)] Destino: ${safeRedirectUrl} el ${dateTag}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      const nuevoContacto = {
        id: `click-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Telemetría Sistema",
        notas: `La sala pulsó en enlace (${safeRedirectUrl})`,
        resultado: "Interesado"
      };

      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];

      await sb
        .from("leads")
        .update({
          clics_epk: clics,
          ultimo_clic_at: nowIso,
          email_abierto: true, // Si hizo clic, necesariamente abrió el email
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", decoded.leadId);
    }
  } catch (err: any) {
    console.warn("[Tracking] Error al registrar clic:", err?.message || err);
  }
});

/**
 * POST /api/webhooks/resend
 * Receptor oficial de Webhooks de Resend (para cuando se envíen emails a través de Resend).
 * Soporta eventos: email.delivered, email.opened, email.clicked, email.bounced, email.complained.
 * 
 * Implementación estructurada:
 * - Opción 1: Métricas de engagement en tiempo real (aperturas, clics, entregas e historial de contacto)
 * - Opción 2: Salud del dominio y gestión de rebotes (bounces/complaints para evitar penalizaciones)
 * - Opción 3: Capa inteligente para el Copilot de Booking (detección de leads calientes y recomendación de seguimiento)
 */
router.post("/webhooks/resend", express.json(), async (req, res) => {
  const event = req.body;
  
  // Responder inmediatamente con 200 OK a Resend
  res.status(200).json({ received: true });

  if (!event || !event.type) {
    return;
  }

  try {
    const eventType = String(event.type).toLowerCase(); // 'email.opened', 'email.clicked', 'email.delivered', 'email.bounced', 'email.complained'
    const eventData = event.data || {};
    const emailTo = Array.isArray(eventData.to) ? eventData.to[0] : (eventData.to || eventData.email);

    console.log(`[Resend Webhook] Evento recibido: ${eventType} para ${emailTo || 'destinatario desconocido'}`);

    if (!emailTo && !eventData.tags?.lead_id && !eventData.metadata?.lead_id) return;

    const sb = getSupabase();
    let lead: any = null;

    // 1. Intentar localizar por ID directo de metadata o tags si viene de Resend
    const directLeadId = eventData.metadata?.lead_id || eventData.tags?.lead_id;
    if (directLeadId) {
      const { data } = await sb
        .from("leads")
        .select("id, band_id, estado, veces_abierto, clics_epk, primer_abierto_at, ultimo_abierto_at, ultimo_clic_at, email_abierto, notas, historial_contacto")
        .eq("id", directLeadId)
        .maybeSingle();
      lead = data;
    }

    // 2. Fallback: Buscar lead por email_contacto
    if (!lead && emailTo) {
      const { data } = await sb
        .from("leads")
        .select("id, band_id, estado, veces_abierto, clics_epk, primer_abierto_at, ultimo_abierto_at, ultimo_clic_at, email_abierto, notas, historial_contacto")
        .ilike("email_contacto", `%${emailTo}%`)
        .maybeSingle();
      lead = data;
    }

    if (!lead) {
      console.log(`[Resend Webhook] No se encontró lead coincidente para ${emailTo || directLeadId}`);
      return;
    }

    const nowIso = new Date().toISOString();
    const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];

    // --- Opción 1: Métricas de engagement en tiempo real ---
    if (eventType === "email.delivered") {
      const nuevoContacto = {
        id: `resend-delivered-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `El correo fue entregado con éxito en el buzón de la sala (${emailTo}).`,
        resultado: "Entregado"
      };

      await sb
        .from("leads")
        .update({
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

    } else if (eventType === "email.opened") {
      const veces = (Number(lead.veces_abierto) || 0) + 1;
      const primerAbierto = lead.primer_abierto_at || nowIso;

      // --- Opción 3: Capa Inteligente para el Copilot ---
      const esLeadCaliente = veces >= 2;
      const copilotAlertNota = esLeadCaliente && !lead.notas?.includes("[🔥 Copilot Alert]")
        ? `\n[🔥 Copilot Alert] Alto interés detectado (${veces}ª apertura). Sugerencia: Realizar llamada de seguimiento o enviar propuesta de fecha.`
        : "";

      const nuevoContacto = {
        id: `resend-open-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `La sala abrió el correo electrónico (apertura #${veces} detectada por Resend).`,
        resultado: esLeadCaliente ? "🔥 Alto Interés (Revisión Múltiple)" : "Abierto"
      };

      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}[Resend 👁️ Apertura #${veces}] ${dateTag}${copilotAlertNota}`;

      await sb
        .from("leads")
        .update({
          veces_abierto: veces,
          primer_abierto_at: primerAbierto,
          ultimo_abierto_at: nowIso,
          email_abierto: true,
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

    } else if (eventType === "email.clicked") {
      const clics = (Number(lead.clics_epk) || 0) + 1;

      // --- Opción 3: Capa Inteligente para el Copilot ---
      const copilotAlertNota = !lead.notas?.includes("[🔥 Copilot Alert - Clic EPK]")
        ? `\n[🔥 Copilot Alert - Clic EPK] ¡El programador pulsó en el enlace del Dossier/EPK! Recomendado: Contacto directo para cerrar fecha.`
        : "";

      const nuevoContacto = {
        id: `resend-click-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `El programador de la sala hizo clic en un enlace del mensaje (Clic #${clics}).`,
        resultado: "🔥 Clic en EPK / Interesado"
      };

      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}[Resend 🔗 Clic #${clics}] ${dateTag}${copilotAlertNota}`;

      await sb
        .from("leads")
        .update({
          clics_epk: clics,
          ultimo_clic_at: nowIso,
          email_abierto: true,
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

    // --- Opción 2: Salud del Dominio y Gestión de Rebotes (Bounces / Complaints) ---
    } else if (eventType === "email.bounced" || eventType === "email.complained") {
      const motivo = eventType === "email.complained" ? "Queja de SPAM recibida" : "Correo rebotado (Bounced / Buzón lleno o inexistente)";

      const nuevoContacto = {
        id: `resend-bounce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `⚠️ FALLO DE ENTREGA: ${motivo}. Verificar la dirección de correo (${emailTo}).`,
        resultado: "Rebotado / Inválido"
      };

      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}[⚠️ Resend ${eventType === "email.complained" ? "SPAM Complaint" : "Rebote/Bounce"}] Correo inválido el ${dateTag}`;

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      console.warn(`[Resend Webhook] Alerta de salud de email en lead ${lead.id} (${emailTo}): ${motivo}`);
    }
  } catch (e: any) {
    console.warn("[Resend Webhook] Error procesando evento:", e?.message || e);
  }
});

export default router;

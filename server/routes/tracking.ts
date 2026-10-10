// Seguimiento público de emails y EPK (apertura, clic, PDF, interacción) y webhook de Resend. Solo
// registra con token firmado (`trackingSeguro.ts`); el webhook exige firma Svix (AGENTS.md §1).

import express from "express";
import { getSupabase } from "../db/core.js";
import { invalidateBandStateCache } from "../db/sync.js";
import { loadState, saveState } from "../state.js";
import { generarToken, decodificarToken, destinoSeguro, idSeguro, textoLibreSeguro, verificarFirmaSvix } from "../utils/trackingSeguro.js";
import { publicoRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Transparent 1x1 GIF buffer (43 bytes)
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * Tokens de seguimiento FIRMADOS (ver server/utils/trackingSeguro.ts). Se reexportan con los
 * nombres de siempre porque los usa la plantilla de los correos.
 */
export function generateTrackingToken(payload: { leadId: string; bandId: string; msgId?: string }): string {
  return generarToken(payload);
}

/** Solo devuelve algo si el token está firmado por nosotros; el base64 sin firma ya no vale. */
export function decodeTrackingToken(token: string): { leadId: string; bandId: string; msgId?: string } | null {
  return decodificarToken(token);
}

/**
 * Helper para resolver un lead a partir de IDs o tokens
 */
async function resolveLead(targetLeadId?: string) {
  // El id sale de un token firmado, pero se valida igualmente: nunca se consulta con texto libre.
  if (!targetLeadId || !idSeguro(targetLeadId)) return null;
  const sb = getSupabase();
  const { data: lead } = await sb
    .from("leads")
    .select("*")
    .eq("id", targetLeadId)
    .maybeSingle();
  return lead;
}

/**
 * GET /api/tracking/open & GET /tracking/open
 * Píxel transparente de apertura con anti-caching agresivo para Google Proxy / Apple Mail.
 */
router.get(["/tracking/open", "/api/tracking/open"], async (req, res) => {
  // Encabezados HTTP anti-proxy-cache para que cada apertura compute siempre
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate, proxy-revalidate, post-check=0, pre-check=0, max-age=0, s-maxage=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "Wed, 11 Jan 1984 05:00:00 GMT");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("ETag", `"${Date.now()}-${Math.random().toString(36).slice(2)}"`);
  res.setHeader("Last-Modified", new Date().toUTCString());
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.status(200).send(TRANSPARENT_GIF_BUFFER);

  // SOLO con token firmado: antes bastaba un `?leadId=` cualquiera para falsear aperturas.
  const rawToken = (req.query.t as string) || (req.query.token as string);
  const decoded = decodeTrackingToken(rawToken);
  const targetLeadId = decoded?.leadId;
  const targetMsgId = decoded?.msgId && idSeguro(decoded.msgId) ? decoded.msgId : undefined;

  if (!targetLeadId) return;

  try {
    const lead = await resolveLead(targetLeadId);
    if (lead) {
      const sb = getSupabase();
      const nowIso = new Date().toISOString();
      const userAgent = req.headers["user-agent"] || "";

      let clientLabel = "Cliente de correo";
      if (userAgent.includes("GoogleImageProxy") || userAgent.includes("googleusercontent")) {
        clientLabel = "Gmail (Google Proxy)";
      } else if (userAgent.includes("AppleWebKit") && (userAgent.includes("iPhone") || userAgent.includes("iPad"))) {
        clientLabel = "Apple Mail (iOS)";
      } else if (userAgent.includes("Outlook") || userAgent.includes("Microsoft")) {
        clientLabel = "Microsoft Outlook";
      } else if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
        clientLabel = "Móvil";
      }

      const effectiveEmailId = targetMsgId || lead.gmail_message_id || null;
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
      const openCount = historialPrevio.filter((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura")).length + 1;
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      const logNota = `[👁️ Email Abierto (${openCount}ª vez)] ${clientLabel} el ${dateTag}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      const nuevoContacto = {
        id: `open-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Telemetría Sistema",
        notas: `La sala abrió el correo electrónico por ${openCount}ª vez (${clientLabel})`,
        resultado: `👁️ Apertura de correo (#${openCount})`,
        event: "email_opened",
        email_id: effectiveEmailId
      };

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          email_abierto: true,
          veces_abierto: openCount,
          ultimo_abierto_at: nowIso,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      try {
        const s = loadState();
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id);
        if (memLead) {
          memLead.veces_abierto = openCount;
          memLead.ultimo_abierto_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [nuevoContacto, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      invalidateBandStateCache(lead.band_id);
      console.log(`[Telemetría] 👁️ Apertura #${openCount} registrada para lead ${lead.id} (${lead.nombre_sala}) vía ${clientLabel}`);
    }
  } catch (err: any) {
    console.warn("[Tracking] Error al registrar apertura:", err?.message || err);
  }
});

/**
 * GET /api/tracking/click & GET /tracking/click
 * Redirector seguro con detección de botón específico (Dossier, Spotify, Instagram, YouTube, etc.)
 */
router.get(["/tracking/click", "/api/tracking/click"], async (req, res) => {
  const rawToken = (req.query.t as string) || (req.query.token as string);
  const buttonType = textoLibreSeguro(req.query.btn || req.query.btype, 30);

  const targetLeadId = decodeTrackingToken(rawToken)?.leadId;

  // Redirección abierta: solo a destinos firmados por nosotros (los enlaces nuevos) o a dominios
  // conocidos (redes, la propia plataforma). Cualquier otro va a la web de la marca.
  const safeRedirectUrl = destinoSeguro(req.query.url, req.query.s);

  res.redirect(302, safeRedirectUrl);

  if (!targetLeadId) return;

  try {
    const lead = await resolveLead(targetLeadId);
    if (lead) {
      const sb = getSupabase();
      const nowIso = new Date().toISOString();
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
      const clickCount = historialPrevio.filter((h: any) => h.id?.startsWith("click-") || h.id?.startsWith("epk-") || h.notas?.includes("enlace") || h.notas?.includes("Dossier") || h.notas?.includes("Pulsó")).length + 1;
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      let accionBoton = "🔗 Enlace";
      let detalleBoton = `Pulsó enlace hacia: ${safeRedirectUrl}`;

      if (buttonType === "dossier_btn" || safeRedirectUrl.includes("/epk")) {
        accionBoton = "📄 Dossier EPK";
        detalleBoton = "Pulsó en el botón principal 'Ver Dossier Oficial & Kit de Prensa'";
      } else if (buttonType === "spotify" || safeRedirectUrl.includes("spotify.com")) {
        accionBoton = "🎧 Spotify";
        detalleBoton = "Pulsó en el icono de Spotify en la firma del correo";
      } else if (buttonType === "instagram" || safeRedirectUrl.includes("instagram.com")) {
        accionBoton = "📸 Instagram";
        detalleBoton = "Pulsó en el icono de Instagram en la firma del correo";
      } else if (buttonType === "youtube" || safeRedirectUrl.includes("youtube.com")) {
        accionBoton = "▶️ YouTube";
        detalleBoton = "Pulsó en el icono de YouTube en la firma del correo";
      } else if (buttonType === "tiktok" || safeRedirectUrl.includes("tiktok.com")) {
        accionBoton = "🎵 TikTok";
        detalleBoton = "Pulsó en el icono de TikTok en la firma del correo";
      } else if (buttonType === "website") {
        accionBoton = "🌐 Web Oficial";
        detalleBoton = "Pulsó en el enlace de la Web Oficial de la banda";
      }

      const logNota = `[🎯 Clic Botón (${accionBoton})] ${detalleBoton} el ${dateTag}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      const nuevoContacto = {
        id: `click-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Telemetría Sistema",
        notas: detalleBoton,
        resultado: accionBoton
      };

      // Si hace clic, necesariamente ha abierto el correo. Comprobamos si la última apertura fue hace más de 30s
      const lastOpen = historialPrevio.find((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura"));
      const timeSinceLastOpen = lastOpen?.fecha ? Date.now() - new Date(lastOpen.fecha).getTime() : Infinity;

      const opensCount = historialPrevio.filter((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura")).length + 1;

      const contactosToAdd = (timeSinceLastOpen > 30000 || !lastOpen)
        ? [
            nuevoContacto,
            {
              id: `open-${Date.now()}-click`,
              fecha: nowIso,
              tipo: "Email",
              autor: "Telemetría Sistema",
              notas: `La sala abrió el correo electrónico (apertura #${opensCount} detectada al interactuar)`,
              resultado: `👁️ Apertura de correo (#${opensCount})`
            }
          ]
        : [nuevoContacto];

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [...contactosToAdd, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      try {
        const s = loadState();
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id);
        if (memLead) {
          memLead.clics_epk = clickCount;
          memLead.ultimo_clic_at = nowIso;
          memLead.email_abierto = true;
          memLead.veces_abierto = Math.max(Number(memLead.veces_abierto) || 0, 1);
          memLead.historial_contacto = [...contactosToAdd, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      invalidateBandStateCache(lead.band_id);
      console.log(`[Telemetría] 🎯 Clic en ${accionBoton} registrado para lead ${lead.id} (${lead.nombre_sala})`);
    }
  } catch (err: any) {
    console.warn("[Tracking] Error al registrar clic:", err?.message || err);
  }
});

/**
 * POST /api/tracking/interaction & POST /tracking/interaction
 * Registra acciones interactivas realizadas en el Dossier EPK
 */
router.post(["/tracking/interaction", "/api/tracking/interaction"], express.json(), async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ received: true });

  const { token, action, details } = req.body || {};
  const targetLeadId = decodeTrackingToken(token)?.leadId;

  if (!targetLeadId) return;

  try {
    const lead = await resolveLead(targetLeadId);
    if (lead) {
      const sb = getSupabase();
      const nowIso = new Date().toISOString();
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      // Texto que llega de un visitante anónimo y acaba en las notas del lead: corto y sin saltos de línea.
      const cleanAction = textoLibreSeguro(action, 40) || "Interacción EPK";
      const cleanDetails = textoLibreSeguro(details, 160) || "El programador interactuó con el Dossier EPK";

      const logNota = `[🎯 Acción EPK (${cleanAction})] ${cleanDetails} el ${dateTag}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      const nuevoContacto = {
        id: `epk-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Interacción EPK",
        autor: "Programador de Sala",
        notas: cleanDetails,
        resultado: cleanAction
      };

      const clickCount = historialPrevio.filter((h: any) => h.id?.startsWith("click-") || h.id?.startsWith("epk-")).length + 1;

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      try {
        const s = loadState();
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id);
        if (memLead) {
          memLead.clics_epk = clickCount;
          memLead.ultimo_clic_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [nuevoContacto, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      invalidateBandStateCache(lead.band_id);
      console.log(`[Telemetría EPK] 🎯 ${cleanAction} registrada para lead ${lead.id} (${lead.nombre_sala}): ${cleanDetails}`);
    }
  } catch (err: any) {
    console.warn("[Tracking] Error al registrar interacción EPK:", err?.message || err);
  }
});

/**
 * GET /api/tracking/pdf & GET /tracking/pdf
 * Gateway de descarga y contador de aperturas del Dossier PDF en Supabase Storage.
 * Registra el evento 'pdf_opened' vinculado al ID del email y al lead.
 */
router.get(["/tracking/pdf", "/api/tracking/pdf"], async (req, res) => {
  const rawToken = (req.query.t as string) || (req.query.token as string);
  const decoded = decodeTrackingToken(rawToken);
  const targetLeadId = decoded?.leadId;
  const targetBandId = decoded?.bandId && idSeguro(decoded.bandId) ? decoded.bandId : "";
  const targetMsgId = decoded?.msgId && idSeguro(decoded.msgId) ? decoded.msgId : undefined;

  // La URL pedida solo se respeta si es de un dominio de confianza (Storage, la plataforma...) o
  // viene firmada; si no, se usa el Dossier configurado de la banda.
  const urlPedida = (req.query.url as string) || (req.query.target as string);
  let finalRedirectUrl: string | undefined = destinoSeguro(urlPedida, req.query.s, "") || undefined;

  try {
    const sb = getSupabase();
    let lead = targetLeadId ? await resolveLead(targetLeadId) : null;

    if (!finalRedirectUrl) {
      const bandToQuery = String(lead?.band_id || targetBandId || "");
      if (idSeguro(bandToQuery)) {
        const sinPrefijo = bandToQuery.replace(/^(band|reg)-/, "");
        // Sin alternativa a la de otra banda: antes una banda sin Dossier redirigía al ajeno.
        const { data: epkData } = await sb
          .from("epk_configs")
          .select("dossier_pdf_url")
          .in("band_id", [bandToQuery, sinPrefijo, `band-${sinPrefijo}`])
          .limit(1)
          .maybeSingle();

        if (epkData?.dossier_pdf_url) {
          finalRedirectUrl = epkData.dossier_pdf_url;
        }
      }
    }

    if (!finalRedirectUrl || !finalRedirectUrl.startsWith("http")) {
      finalRedirectUrl = "https://bandmanager.io/epk";
    }

    // Redirección inmediata al archivo en Supabase Storage
    res.redirect(302, finalRedirectUrl);

    if (lead) {
      const nowIso = new Date().toISOString();
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];

      const pdfOpenEvents = historialPrevio.filter(
        (h: any) => h.id?.startsWith("pdf-open-") || h.resultado?.includes("Dossier PDF") || h.notas?.includes("archivo PDF") || h.event === "pdf_opened"
      );
      const pdfOpenCount = pdfOpenEvents.length + 1;

      const effectiveEmailId = targetMsgId || lead.gmail_message_id || null;
      const emailIdLabel = effectiveEmailId ? ` (Email ID: ${effectiveEmailId})` : "";

      const nuevoContacto = {
        id: `pdf-open-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Dossier PDF",
        autor: "Programador de Sala",
        notas: `El programador abrió / descargó el archivo PDF del Dossier Oficial (apertura #${pdfOpenCount})${emailIdLabel}`,
        resultado: `📥 Apertura de Dossier PDF (#${pdfOpenCount})`,
        event: "pdf_opened",
        email_id: effectiveEmailId
      };

      const logNota = `[📥 Dossier PDF Abierto (${pdfOpenCount}ª vez)] Registrado el ${dateTag}${emailIdLabel}`;
      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}${logNota}`;

      // Si hace más de 30s que no se abre o no hay registro de apertura, registrar apertura de correo
      const lastOpen = historialPrevio.find((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura"));
      const timeSinceLastOpen = lastOpen?.fecha ? Date.now() - new Date(lastOpen.fecha).getTime() : Infinity;
      const opensCount = historialPrevio.filter((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura")).length + 1;

      const contactosToAdd = (timeSinceLastOpen > 30000 || !lastOpen)
        ? [
            nuevoContacto,
            {
              id: `open-${Date.now()}-pdf`,
              fecha: nowIso,
              tipo: "Email",
              autor: "Telemetría Sistema",
              notas: `La sala abrió el correo electrónico (detectado al descargar Dossier PDF #${pdfOpenCount})`,
              resultado: `👁️ Apertura de correo (#${opensCount})`,
              email_id: effectiveEmailId
            }
          ]
        : [nuevoContacto];

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [...contactosToAdd, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      try {
        const s = loadState();
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id);
        if (memLead) {
          memLead.clics_epk = (memLead.clics_epk || 0) + 1;
          memLead.ultimo_clic_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [...contactosToAdd, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      if (effectiveEmailId && idSeguro(effectiveEmailId)) {
        try {
          // Acotado a la banda del lead (antes marcaba como leído un mensaje de cualquier banda).
          await sb
            .from("lead_messages")
            .update({
              leido: true
            })
            .in("id", [effectiveEmailId, `imap-${effectiveEmailId}`])
            .eq("band_id", lead.band_id);
        } catch (_) {}
      }

      invalidateBandStateCache(lead.band_id);
      console.log(`[Telemetría PDF] 📥 Apertura #${pdfOpenCount} de Dossier PDF registrada para lead ${lead.id} (${lead.nombre_sala})${emailIdLabel}`);
    }
  } catch (err: any) {
    console.warn("[Tracking PDF] Error al registrar apertura PDF:", err?.message || err);
    if (!res.headersSent) {
      res.redirect(302, finalRedirectUrl || "https://bandmanager.io/epk");
    }
  }
});

/**
 * POST /api/webhooks/resend
 */
router.post("/webhooks/resend", publicoRateLimiter, express.json(), async (req, res) => {
  // Sin firma Svix válida no se acepta nada: antes cualquiera podía falsear aperturas, clics o
  // entregas de cualquier lead. Requiere RESEND_WEBHOOK_SECRET (el `whsec_...` del webhook).
  const cuerpoCrudo: Buffer | string = (req as any).rawBody || JSON.stringify(req.body ?? {});
  const firmado = verificarFirmaSvix({
    secreto: process.env.RESEND_WEBHOOK_SECRET,
    id: req.headers["svix-id"] as string | undefined,
    timestamp: req.headers["svix-timestamp"] as string | undefined,
    firma: req.headers["svix-signature"] as string | undefined,
    cuerpo: cuerpoCrudo,
  });
  if (!firmado) {
    if (!process.env.RESEND_WEBHOOK_SECRET) {
      console.warn("[Resend Webhook] RESEND_WEBHOOK_SECRET no está configurado: evento rechazado.");
    }
    return res.status(401).json({ error: "Firma no válida" });
  }

  const event = req.body;
  res.status(200).json({ received: true });

  if (!event || !event.type) return;

  try {
    const eventType = String(event.type).toLowerCase();
    const eventData = event.data || {};
    const emailTo = Array.isArray(eventData.to) ? eventData.to[0] : (eventData.to || eventData.email);

    if (!emailTo && !eventData.tags?.lead_id && !eventData.metadata?.lead_id) return;

    const sb = getSupabase();
    let lead: any = null;

    const directLeadId = eventData.metadata?.lead_id || eventData.tags?.lead_id;
    if (directLeadId && idSeguro(directLeadId)) {
      const { data } = await sb
        .from("leads")
        .select("*")
        .eq("id", directLeadId)
        .maybeSingle();
      lead = data;
    }

    if (!lead && emailTo) {
      const { data } = await sb
        .from("leads")
        .select("*")
        .eq("email_contacto", String(emailTo).trim().toLowerCase())
        .limit(1)
        .maybeSingle();
      lead = data;
    }

    if (!lead) return;

    const nowIso = new Date().toISOString();
    const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];

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
      const openCount = historialPrevio.filter((h: any) => h.id?.startsWith("open-") || h.notas?.includes("abrió el correo") || h.resultado?.includes("Apertura")).length + 1;
      const nuevoContacto = {
        id: `resend-open-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `La sala abrió el correo electrónico (apertura #${openCount} detectada por Resend).`,
        resultado: `👁️ Apertura de correo (#${openCount})`
      };

      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}[Resend 👁️ Apertura #${openCount}] ${dateTag}`;

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      invalidateBandStateCache(lead.band_id);

    } else if (eventType === "email.clicked") {
      const clickCount = historialPrevio.filter((h: any) => h.id?.startsWith("click-") || h.id?.startsWith("epk-") || h.notas?.includes("enlace") || h.notas?.includes("Dossier")).length + 1;
      const nuevoContacto = {
        id: `resend-click-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: nowIso,
        tipo: "Email",
        autor: "Resend Webhook",
        notas: `El programador de la sala hizo clic en un enlace del mensaje (Clic #${clickCount}).`,
        resultado: "📄 Clic en Dossier Oficial"
      };

      const updatedNotas = `${lead.notas ? lead.notas + "\n" : ""}[Resend 🔗 Clic #${clickCount}] ${dateTag}`;

      await sb
        .from("leads")
        .update({
          notas: updatedNotas,
          historial_contacto: [nuevoContacto, ...historialPrevio].slice(0, 50)
        })
        .eq("id", lead.id);

      invalidateBandStateCache(lead.band_id);
    }
  } catch (e: any) {
    console.warn("[Resend Webhook] Error procesando evento:", e?.message || e);
  }
});

export default router;

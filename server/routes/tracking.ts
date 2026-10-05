import express from "express";
import crypto from "crypto";
import { getSupabase } from "../db/core.js";
import { invalidateBandStateCache } from "../db/sync.js";
import { loadState, saveState } from "../state.js";

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
 * Valida y decodifica el token de tracking con máxima resiliencia.
 */
export function decodeTrackingToken(token: string): { leadId: string; bandId: string; msgId?: string } | null {
  if (!token || typeof token !== "string") return null;
  const clean = token.trim();
  if (!clean) return null;

  // 1. Formato estándar firmado (base64url.signature)
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length === 2) {
      const [base64Data, signature] = parts;
      const expectedSig = crypto.createHmac("sha256", TRACKING_SECRET).update(base64Data).digest("hex").slice(0, 16);
      if (signature !== expectedSig) {
        return null;
      }
      try {
        const jsonStr = Buffer.from(base64Data, "base64url").toString("utf8");
        const parsed = JSON.parse(jsonStr);
        if (parsed && (parsed.leadId || parsed.id)) {
          return {
            leadId: parsed.leadId || parsed.id,
            bandId: parsed.bandId || parsed.band_id || "band-bakandeya",
            msgId: parsed.msgId
          };
        }
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  // 2. Formato base64 puro (sin firma, sólo si decodifica como JSON estructurado con leadId)
  try {
    const jsonStr = Buffer.from(clean, "base64url").toString("utf8");
    if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
      const parsed = JSON.parse(jsonStr);
      if (parsed && (parsed.leadId || parsed.id)) {
        return {
          leadId: parsed.leadId || parsed.id,
          bandId: parsed.bandId || parsed.band_id || "band-bakandeya",
          msgId: parsed.msgId
        };
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Helper para resolver un lead a partir de IDs o tokens
 */
async function resolveLead(targetLeadId?: string) {
  if (!targetLeadId) return null;
  const sb = getSupabase();
  let { data: lead } = await sb
    .from("leads")
    .select("*")
    .eq("id", targetLeadId)
    .maybeSingle();

  if (!lead && (targetLeadId.includes("diego") || targetLeadId.includes("mon") || targetLeadId.includes("7cl88"))) {
    const { data: fallbackLead } = await sb
      .from("leads")
      .select("*")
      .or("email_contacto.eq.diego.delacalleb@gmail.com,nombre_sala.ilike.%Mon Live%")
      .maybeSingle();
    if (fallbackLead) lead = fallbackLead;
  }
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

  const rawToken = (req.query.t as string) || (req.query.token as string);
  const directLeadId = (req.query.leadId as string) || (req.query.l as string) || (req.query.id as string);
  const directMsgId = (req.query.msgId as string) || (req.query.m as string) || (req.query.emailId as string);
  
  let targetLeadId = directLeadId;
  let targetMsgId = directMsgId;
  if (rawToken) {
    const decoded = decodeTrackingToken(rawToken);
    if (decoded?.leadId) targetLeadId = decoded.leadId;
    if (decoded?.msgId) targetMsgId = decoded.msgId;
  }

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
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id || l.email_contacto === lead.email_contacto);
        if (memLead) {
          memLead.veces_abierto = openCount;
          memLead.ultimo_abierto_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [nuevoContacto, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      invalidateBandStateCache(lead.band_id);
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");
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
  const targetUrl = (req.query.url as string) || "https://bandmanager.io";
  const rawToken = (req.query.t as string) || (req.query.token as string);
  const directLeadId = (req.query.leadId as string) || (req.query.l as string) || (req.query.id as string);
  const buttonType = (req.query.btn as string) || (req.query.btype as string) || "";

  let targetLeadId = directLeadId;
  if (rawToken) {
    const decoded = decodeTrackingToken(rawToken);
    if (decoded?.leadId) targetLeadId = decoded.leadId;
  }

  const isValidUrl = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
  const safeRedirectUrl = isValidUrl ? targetUrl : "https://bandmanager.io";

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
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id || l.email_contacto === lead.email_contacto);
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
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");
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

  const { leadId, token, action, details, bandId } = req.body || {};
  let targetLeadId = leadId;

  if (!targetLeadId && token) {
    const decoded = decodeTrackingToken(token);
    if (decoded?.leadId) targetLeadId = decoded.leadId;
  }

  if (!targetLeadId) return;

  try {
    const lead = await resolveLead(targetLeadId);
    if (lead) {
      const sb = getSupabase();
      const nowIso = new Date().toISOString();
      const historialPrevio = Array.isArray(lead.historial_contacto) ? lead.historial_contacto : [];
      const dateTag = new Date().toLocaleDateString("es-ES") + " " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

      const cleanAction = String(action || "Interacción EPK").trim();
      const cleanDetails = String(details || "El programador interactuó con el Dossier EPK").trim();

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
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id || l.email_contacto === lead.email_contacto);
        if (memLead) {
          memLead.clics_epk = clickCount;
          memLead.ultimo_clic_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [nuevoContacto, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      invalidateBandStateCache(lead.band_id);
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");
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
  const directLeadId = (req.query.leadId as string) || (req.query.l as string) || (req.query.id as string);
  const directMsgId = (req.query.msgId as string) || (req.query.emailId as string) || (req.query.m as string);
  const targetUrl = (req.query.url as string) || (req.query.target as string);

  let targetLeadId = directLeadId;
  let targetBandId = "band-bakandeya";
  let targetMsgId = directMsgId;

  if (rawToken) {
    const decoded = decodeTrackingToken(rawToken);
    if (decoded?.leadId) targetLeadId = decoded.leadId;
    if (decoded?.bandId) targetBandId = decoded.bandId;
    if (decoded?.msgId) targetMsgId = decoded.msgId;
  }

  let finalRedirectUrl = targetUrl;

  try {
    const sb = getSupabase();
    let lead = targetLeadId ? await resolveLead(targetLeadId) : null;

    if (!finalRedirectUrl) {
      const bandToQuery = lead?.band_id || targetBandId;
      const { data: epkData } = await sb
        .from("epk_configs")
        .select("dossier_pdf_url")
        .or(`band_id.eq.${bandToQuery},band_id.eq.band-${bandToQuery},band_id.eq.bakandeya`)
        .maybeSingle();

      if (epkData?.dossier_pdf_url) {
        finalRedirectUrl = epkData.dossier_pdf_url;
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
        const memLead = (s.leads || []).find((l: any) => l.id === lead.id || l.email_contacto === lead.email_contacto);
        if (memLead) {
          memLead.clics_epk = (memLead.clics_epk || 0) + 1;
          memLead.ultimo_clic_at = nowIso;
          memLead.email_abierto = true;
          memLead.historial_contacto = [...contactosToAdd, ...(memLead.historial_contacto || [])].slice(0, 50);
          saveState(s);
        }
      } catch (_) {}

      if (effectiveEmailId) {
        try {
          await sb
            .from("lead_messages")
            .update({
              leido: true
            })
            .or(`id.eq.${effectiveEmailId},id.eq.imap-${effectiveEmailId}`);
        } catch (_) {}
      }

      invalidateBandStateCache(lead.band_id);
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");
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
router.post("/webhooks/resend", express.json(), async (req, res) => {
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
    if (directLeadId) {
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
        .ilike("email_contacto", `%${emailTo}%`)
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
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");

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
      invalidateBandStateCache("band-bakandeya");
      invalidateBandStateCache("bakandeya");
    }
  } catch (e: any) {
    console.warn("[Resend Webhook] Error procesando evento:", e?.message || e);
  }
});

export default router;

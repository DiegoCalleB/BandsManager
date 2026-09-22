// OAuth "offline" de Gmail por banda: una banda conecta su cuenta UNA vez y el backend guarda
// un refresh_token (server/db/gmailOAuth.ts) que usa para crear borradores sin contraseña de
// aplicación ni popup (server/services/gmailApiClient.ts) - incluido desde el Agente Enviador
// programado, que corre sin navegador. Sustituye, solo para Gmail, al popup de Firebase Auth
// de src/utils/gmail.ts (que no sirve para el scheduler) y complementa, sin sustituir,
// band_email_accounts (IMAP+contraseña), que sigue siendo el único camino para Outlook.
//
// Esta app autentica con un token Bearer en localStorage/cabecera, no con cookies - por eso el
// flujo se parte en dos: /authorize-url va detrás de requireAuth (llamada normal con apiFetch,
// que sí manda la cabecera) y devuelve la URL de Google como JSON; el cliente navega él mismo
// con window.location.href. /callback, en cambio, es una navegación normal del navegador de
// vuelta desde Google - no lleva ninguna cabecera nuestra, así que identifica la banda a través
// del parámetro "state" firmado (no de la sesión), igual que firmaDeFeed en concerts.ts firma
// las URLs públicas de calendario.

import express from "express";
import crypto from "crypto";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { getSupabase } from "../db/core.js";
import { dbUpsertBandGmailOAuth, dbDeleteBandGmailOAuth, dbGetBandGmailOAuth, toSafeGmailOAuthResponse } from "../db/gmailOAuth.js";

const router = express.Router();

// gmail.compose: crear/leer/enviar borradores (crearBorradorGmailApi, enviarEmailGmailApi,
// comprobarBorradorEnviado). gmail.modify: leer la bandeja y quitar la etiqueta UNREAD de lo ya
// procesado (leerRespuestasGmailApi/marcarComoLeidoGmailApi en gmailApiClient.ts) - lo que
// necesita el Agente Lector para detectar respuestas de una banda conectada solo por OAuth, sin
// IMAP. Una banda que conectó antes de este cambio solo tiene gmail.compose concedido y necesita
// reconectar (botón "Desconectar" + "Conectar con Google" de nuevo) para que el Lector funcione.
const GMAIL_OAUTH_SCOPE = "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify";
const AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
// La API de userinfo clásica (https://www.googleapis.com/oauth2/v2/userinfo) exige los scopes
// "email"/"profile", que este flujo nunca pide (solo gmail.compose/gmail.modify) - por eso
// gmail_email se guardaba siempre vacío. El propio endpoint de perfil de la API de Gmail sí
// funciona con esos scopes (lo confirma obtenerEmailDeLaCuentaConectada en gmailApiClient.ts,
// que ya lo usa con éxito), así que se reutiliza aquí en vez de pedir un scope nuevo.
const PROFILE_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const ESTADO_VALIDEZ_MS = 10 * 60 * 1000; // 10 minutos: tiempo de sobra para completar el consentimiento en Google

export function firmarEstadoOAuth(bandId: string): string {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    throw new Error("Falta CRON_SECRET en el servidor: no se puede firmar el estado de OAuth de Gmail.");
  }
  const ts = Date.now().toString();
  const firma = crypto.createHmac("sha256", secreto).update(`gmail-oauth:${bandId}:${ts}`).digest("hex").slice(0, 32);
  return `${bandId}.${ts}.${firma}`;
}

// Devuelve el band_id si la firma es válida y no ha caducado, o null. Nunca lanza: un estado
// inválido es un caso esperado (link caducado, manipulado) y se trata como tal, no como un 500.
export function verificarEstadoOAuth(state: unknown): string | null {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || typeof state !== "string") return null;

  const partes = state.split(".");
  if (partes.length !== 3) return null;
  const [bandId, ts, firmaRecibida] = partes;
  if (!bandId || !ts || !firmaRecibida) return null;

  const edadMs = Date.now() - Number(ts);
  if (!Number.isFinite(edadMs) || edadMs < 0 || edadMs > ESTADO_VALIDEZ_MS) return null;

  const firmaEsperada = crypto.createHmac("sha256", secreto).update(`gmail-oauth:${bandId}:${ts}`).digest("hex").slice(0, 32);
  if (firmaEsperada.length !== firmaRecibida.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(firmaEsperada), Buffer.from(firmaRecibida))) return null;

  return bandId;
}

function oauthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI);
}

// GET /api/gmail-oauth/authorize-url
router.get("/authorize-url", requireAuth, (req, res) => {
  if (!oauthConfigured()) {
    return res.status(503).json({ error: "El servidor no tiene configurado el OAuth de Gmail (GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI)." });
  }
  try {
    const bandId = getTargetBandId(req);
    const state = firmarEstadoOAuth(bandId);
    const url = new URL(AUTHORIZE_ENDPOINT);
    url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID!);
    url.searchParams.set("redirect_uri", process.env.GOOGLE_OAUTH_REDIRECT_URI!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent"); // fuerza que Google reemita refresh_token también en reconexiones
    url.searchParams.set("scope", GMAIL_OAUTH_SCOPE);
    url.searchParams.set("state", state);
    res.json({ url: url.toString() });
  } catch (err: any) {
    console.error("Error generando URL de autorización de Gmail OAuth:", err);
    res.status(500).json({ error: err.message || "Error al generar la URL de autorización." });
  }
});

// GET /api/gmail-oauth/callback (público a propósito - ver comentario de arriba)
router.get("/callback", async (req, res) => {
  const redirigirConError = (motivo: string) => res.redirect(`/?gmail_oauth=error&motivo=${encodeURIComponent(motivo)}`);

  const bandId = verificarEstadoOAuth(req.query.state);
  if (!bandId) {
    return redirigirConError("estado_invalido_o_caducado");
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    return redirigirConError("google_no_devolvio_codigo");
  }

  if (!oauthConfigured()) {
    return redirigirConError("oauth_no_configurado_en_servidor");
  }

  try {
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
        code,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      console.error("Error cambiando code por tokens en Gmail OAuth:", await tokenRes.text().catch(() => ""));
      return redirigirConError("google_rechazo_el_codigo");
    }

    const tokenData = await tokenRes.json();
    const refreshToken = tokenData.refresh_token as string | undefined;
    if (!refreshToken) {
      // Pasa si la banda ya había conectado antes y Google no reemite refresh_token pese a
      // prompt=consent (caso raro, pero posible) - mejor pedir que revoque el acceso en su
      // cuenta de Google y reconecte, a guardar un estado a medias.
      return redirigirConError("google_no_devolvio_refresh_token");
    }

    const profileRes = await fetch(PROFILE_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = profileRes.ok ? await profileRes.json() : {};
    const gmailEmail = profile.emailAddress || "";

    await dbUpsertBandGmailOAuth({
      band_id: bandId,
      gmail_email: gmailEmail,
      refresh_token: refreshToken,
      scope: String(tokenData.scope || GMAIL_OAUTH_SCOPE)
    });

    if (gmailEmail && gmailEmail.trim()) {
      try {
        const sb = getSupabase();
        await sb.from("registered_bands").update({ email: gmailEmail.trim().toLowerCase() }).eq("band_id", bandId);
      } catch (syncErr) {
        console.warn("[gmailOAuth] No se pudo sincronizar registered_bands.email:", syncErr);
      }
    }

    res.redirect("/?gmail_oauth=conectado");
  } catch (err: any) {
    console.error("Error en el callback de Gmail OAuth:", err);
    redirigirConError("error_interno");
  }
});

// GET /api/gmail-oauth/status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const account = await dbGetBandGmailOAuth(bandId);
    res.json(toSafeGmailOAuthResponse(account));
  } catch (err: any) {
    console.error("Error consultando estado de Gmail OAuth:", err);
    res.status(500).json({ error: "Error al consultar el estado de conexión de Gmail." });
  }
});

// POST /api/gmail-oauth/disconnect
router.post("/disconnect", requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    await dbDeleteBandGmailOAuth(bandId);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error desconectando Gmail OAuth:", err);
    res.status(500).json({ error: "Error al desconectar la cuenta de Gmail." });
  }
});

export default router;

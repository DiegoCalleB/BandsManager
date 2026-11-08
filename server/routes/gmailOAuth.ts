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
import { gmailOAuthRateLimiter } from "../middleware/rateLimiter.js";
import { dbUpsertBandGmailOAuth, dbDeleteBandGmailOAuth, dbGetBandGmailOAuth, toSafeGmailOAuthResponse } from "../db/gmailOAuth.js";
import { invalidarAccessTokenGmail } from "../services/gmailApiClient.js";
import { trasConectarGmail } from "../services/gmailConexion.js";
import { crearEstadoOAuth, dominioDeRetornoDistinto, leerCookie, ESTADO_VALIDEZ_MS } from "../utils/oauthEstado.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';

import { responderError } from '../utils/errorHttp.js';
const router = express.Router();

// gmail.compose: crear/leer/enviar borradores (crearBorradorGmailApi, enviarEmailGmailApi,
// comprobarBorradorEnviado). gmail.modify: leer la bandeja y quitar la etiqueta UNREAD de lo ya
// procesado (leerBandejaGmailIncremental/marcarComoLeidoGmailApi en gmailApiClient.ts) - lo que
// necesita el Agente Lector para detectar respuestas de una banda conectada solo por OAuth, sin
// IMAP. Una banda que conectó antes de este cambio solo tiene gmail.compose concedido y necesita
// reconectar (botón "Desconectar" + "Conectar con Google" de nuevo) para que el Lector funcione.
const GMAIL_OAUTH_SCOPE = "https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify email";
const AUTHORIZE_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const PROFILE_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
// El `state` firmado (bandId.ts.nonce.firma + cookie de nonce, un solo uso) vive en
// server/utils/oauthEstado.ts, compartido con el OAuth de Instagram.
const NOMBRE_COOKIE_NONCE = "gmail_oauth_nonce";
const estadoGmail = crearEstadoOAuth("gmail-oauth");

export const firmarEstadoOAuth = estadoGmail.firmar;
export const verificarEstadoOAuth = estadoGmail.verificar;
export const validarYConsumirEstadoOAuth = estadoGmail.validarYConsumir;
export { dominioDeRetornoDistinto };

function oauthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI);
}

// GET /api/gmail-oauth/authorize-url
router.get("/authorize-url", gmailOAuthRateLimiter, requireAuth, (req, res) => {
  if (!oauthConfigured()) {
    return res.status(503).json({ error: "El servidor no tiene configurado el OAuth de Gmail (GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI)." });
  }
  const dominioCorrecto = dominioDeRetornoDistinto(String(req.headers["x-forwarded-host"] || req.headers.host || ""), process.env.GOOGLE_OAUTH_REDIRECT_URI);
  if (dominioCorrecto) {
    return res.status(409).json({
      error: `Para conectar Gmail abre la app en https://${dominioCorrecto} (con tu sesión iniciada ahí) y vuelve a pulsar «Conectar con Google». Desde este dominio Google no puede devolverte a la app.`,
      codigo: "dominio_de_retorno_distinto",
      dominio: dominioCorrecto
    });
  }
  try {
    const bandId = getTargetBandId(req);
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = firmarEstadoOAuth(bandId, nonce);
    res.cookie(NOMBRE_COOKIE_NONCE, nonce, {
      httpOnly: true,
      sameSite: "lax", // el callback es una navegación de nivel superior desde Google: Lax la envía
      secure: process.env.NODE_ENV === "production",
      path: "/api/gmail-oauth",
      maxAge: ESTADO_VALIDEZ_MS
    });
    const url = new URL(AUTHORIZE_ENDPOINT);
    url.searchParams.set("client_id", process.env.GOOGLE_OAUTH_CLIENT_ID!);
    url.searchParams.set("redirect_uri", process.env.GOOGLE_OAUTH_REDIRECT_URI!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent"); // fuerza que Google reemita refresh_token también en reconexiones
    url.searchParams.set("scope", GMAIL_OAUTH_SCOPE);
    url.searchParams.set("state", state);
    res.json({ url: url.toString() });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error generando URL de autorización de Gmail OAuth:", err);
    responderError(res, err, "Error al generar la URL de autorización.");
  }
});

// GET /api/gmail-oauth/callback (público a propósito - ver comentario de arriba)
router.get("/callback", gmailOAuthRateLimiter, async (req, res) => {
  const redirigirConError = (motivo: string) => res.redirect(`/?gmail_oauth=error&motivo=${encodeURIComponent(motivo)}`);

  const nonceCookie = leerCookie(req, NOMBRE_COOKIE_NONCE);
  const bandId = validarYConsumirEstadoOAuth(req.query.state, nonceCookie);
  res.clearCookie(NOMBRE_COOKIE_NONCE, { path: "/api/gmail-oauth" });
  if (!bandId) {
    // Estado correcto pero sin la cookie del flujo = se empezó en otro dominio u otro navegador.
    return redirigirConError(!nonceCookie && estadoGmail.estadoVerificable(req.query.state) ? "empieza_y_termina_en_el_mismo_dominio" : "estado_invalido_o_caducado");
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

    let gmailEmail = "";
    try {
      const profileRes = await fetch(PROFILE_ENDPOINT, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        gmailEmail = profile.emailAddress || "";
      }
    } catch { /* se prueba el siguiente método para leer el email de la cuenta */ }

    // Fallback 1: Decodificar id_token si Google lo envió
    if (!gmailEmail && tokenData.id_token) {
      try {
        const payloadBase64 = String(tokenData.id_token).split(".")[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, "base64").toString("utf8"));
          gmailEmail = decoded.email || "";
        }
      } catch { /* se prueba el siguiente método para leer el email de la cuenta */ }
    }

    // Fallback 2: Endpoint userinfo clásico
    if (!gmailEmail) {
      try {
        const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        if (userinfoRes.ok) {
          const uData = await userinfoRes.json();
          gmailEmail = uData.email || "";
        }
      } catch { /* ningún método devolvió el email: la cuenta se conecta sin él */ }
    }

    await dbUpsertBandGmailOAuth({
      band_id: bandId,
      gmail_email: gmailEmail,
      refresh_token: refreshToken,
      scope: String(tokenData.scope || GMAIL_OAUTH_SCOPE)
    });

    // Sincroniza el email de acceso con el Gmail conectado y avisa por correo (no bloquea ni falla).
    void trasConectarGmail(bandId, gmailEmail);

    res.redirect("/?gmail_oauth=conectado");
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error en el callback de Gmail OAuth:", err);
    redirigirConError(/CREDENTIALS_ENCRYPTION_KEY/.test(err?.message || "") ? "servidor_sin_clave_de_cifrado" : "error_interno");
  }
});

// GET /api/gmail-oauth/status
router.get("/status", gmailOAuthRateLimiter, requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const account = await dbGetBandGmailOAuth(bandId);
    res.json(toSafeGmailOAuthResponse(account));
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error consultando estado de Gmail OAuth:", err);
    res.status(500).json({ error: "Error al consultar el estado de conexión de Gmail." });
  }
});

// POST /api/gmail-oauth/disconnect
router.post("/disconnect", gmailOAuthRateLimiter, requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const cuenta = await dbGetBandGmailOAuth(bandId);
    await dbDeleteBandGmailOAuth(bandId);
    // Sin esto el access token cacheado seguía valiendo (hasta ~1 h) para enviar correos tras
    // «Desconectar», y el refresh_token seguía vivo en Google.
    invalidarAccessTokenGmail(bandId);
    if (cuenta?.refresh_token) {
      try {
        await fetch(REVOKE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: cuenta.refresh_token }),
          signal: AbortSignal.timeout(8000)
        });
      } catch (revokeErr) {
        console.warn("[gmailOAuth] No se pudo revocar el token en Google (la cuenta ya está desconectada aquí):", revokeErr);
      }
    }
    res.json({ success: true });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error desconectando Gmail OAuth:", err);
    res.status(500).json({ error: "Error al desconectar la cuenta de Gmail." });
  }
});

export default router;

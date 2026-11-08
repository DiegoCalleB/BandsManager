// OAuth de Instagram (Meta) por banda: sustituye al alta pegando un token a mano. La banda pulsa
// «Conectar con Instagram», Meta le pide consentimiento y el servidor cambia el `code` por un token
// de larga duración (~60 días) que guarda igual que el alta manual (server/services/instagramConexion.ts).
//
// Mismo reparto en dos que Gmail (server/routes/gmailOAuth.ts): /authorize-url va detrás de
// requireAuth y devuelve la URL de Meta como JSON; /callback es una navegación del navegador sin
// cabecera nuestra, así que identifica la banda con el `state` firmado + cookie de nonce
// (server/utils/oauthEstado.ts).
//
// Variables: META_APP_ID, META_APP_SECRET y META_OAUTH_REDIRECT_URI (debe apuntar a
// /api/instagram-oauth/callback y estar dada de alta en «Facebook Login → URI de redireccionamiento
// OAuth válidos» de la app de Meta). Mientras la app esté en modo desarrollo solo conectan las
// cuentas con rol en la app; para otras bandas hace falta la revisión de Meta (instagram_manage_insights).

import express from "express";
import crypto from "crypto";
import { requireAuth } from "../state.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { instagramOAuthRateLimiter } from "../middleware/rateLimiter.js";
import { crearEstadoOAuth, dominioDeRetornoDistinto, leerCookie, ESTADO_VALIDEZ_MS } from "../utils/oauthEstado.js";
import { GRAPH_VERSION, verificarTokenInstagram, guardarConexionInstagram } from "../services/instagramConexion.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";
import { responderError } from "../utils/errorHttp.js";

const router = express.Router();

const AUTHORIZE_ENDPOINT = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const TOKEN_ENDPOINT = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement"];
const NOMBRE_COOKIE_NONCE = "instagram_oauth_nonce";
const RUTA_COOKIE = "/api/instagram-oauth";
const estadoInstagram = crearEstadoOAuth("instagram-oauth");

function oauthConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_OAUTH_REDIRECT_URI);
}

// La vista de métricas vive dentro del panel de fans (pestaña «metrics» por defecto).
const volver = (res: express.Response, resultado: string, motivo?: string) =>
  res.redirect(`/?view=fans&instagram_oauth=${resultado}${motivo ? `&motivo=${encodeURIComponent(motivo)}` : ""}`);

async function pedirToken(parametros: Record<string, string>): Promise<{ access_token?: string } | null> {
  const r = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parametros),
    signal: AbortSignal.timeout(10000)
  });
  if (!r.ok) {
    console.error("Error en el intercambio de token de Instagram OAuth:", r.status, await r.text().catch(() => ""));
    return null;
  }
  return r.json();
}

// GET /api/instagram-oauth/authorize-url
router.get("/authorize-url", instagramOAuthRateLimiter, requireAuth, (req, res) => {
  if (!oauthConfigured()) {
    return res.status(503).json({ error: "El servidor no tiene configurado el OAuth de Instagram (META_APP_ID/META_APP_SECRET/META_OAUTH_REDIRECT_URI). Mientras tanto puedes pegar un token a mano." });
  }
  const dominioCorrecto = dominioDeRetornoDistinto(String(req.headers["x-forwarded-host"] || req.headers.host || ""), process.env.META_OAUTH_REDIRECT_URI);
  if (dominioCorrecto) {
    return res.status(409).json({
      error: `Para conectar Instagram abre la app en https://${dominioCorrecto} (con tu sesión iniciada ahí) y vuelve a pulsar «Conectar con Instagram».`,
      codigo: "dominio_de_retorno_distinto",
      dominio: dominioCorrecto
    });
  }
  try {
    const bandId = getTargetBandId(req);
    const nonce = crypto.randomBytes(16).toString("hex");
    const state = estadoInstagram.firmar(bandId, nonce);
    res.cookie(NOMBRE_COOKIE_NONCE, nonce, {
      httpOnly: true,
      sameSite: "lax", // el callback es una navegación de nivel superior desde Meta: Lax la envía
      secure: process.env.NODE_ENV === "production",
      path: RUTA_COOKIE,
      maxAge: ESTADO_VALIDEZ_MS
    });
    const url = new URL(AUTHORIZE_ENDPOINT);
    url.searchParams.set("client_id", process.env.META_APP_ID!);
    url.searchParams.set("redirect_uri", process.env.META_OAUTH_REDIRECT_URI!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES.join(","));
    url.searchParams.set("state", state);
    res.json({ url: url.toString() });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error generando URL de autorización de Instagram OAuth:", err);
    responderError(res, err, "Error al generar la URL de autorización.");
  }
});

// GET /api/instagram-oauth/callback (público a propósito - ver cabecera)
router.get("/callback", instagramOAuthRateLimiter, async (req, res) => {
  const nonceCookie = leerCookie(req, NOMBRE_COOKIE_NONCE);
  const bandId = estadoInstagram.validarYConsumir(req.query.state, nonceCookie);
  res.clearCookie(NOMBRE_COOKIE_NONCE, { path: RUTA_COOKIE });
  if (!bandId) {
    return volver(res, "error", !nonceCookie && estadoInstagram.estadoVerificable(req.query.state) ? "empieza_y_termina_en_el_mismo_dominio" : "estado_invalido_o_caducado");
  }

  // El usuario canceló o Meta rechazó el consentimiento.
  if (typeof req.query.error === "string") {
    return volver(res, "error", req.query.error === "access_denied" ? "acceso_denegado" : "meta_rechazo_el_acceso");
  }
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) return volver(res, "error", "meta_no_devolvio_codigo");
  if (!oauthConfigured()) return volver(res, "error", "oauth_no_configurado_en_servidor");

  try {
    const credenciales = { client_id: process.env.META_APP_ID!, client_secret: process.env.META_APP_SECRET! };

    // code -> token de corta duración (~1 h) -> token de larga duración (~60 días).
    const corto = await pedirToken({ ...credenciales, redirect_uri: process.env.META_OAUTH_REDIRECT_URI!, code });
    if (!corto?.access_token) return volver(res, "error", "meta_rechazo_el_codigo");
    const largo = await pedirToken({ ...credenciales, grant_type: "fb_exchange_token", fb_exchange_token: corto.access_token });
    // Sin ampliar, el token duraría ~1 h y la conexión "se caería sola": mejor fallar claro.
    const token = largo?.access_token;
    if (!token) return volver(res, "error", "meta_no_amplio_el_token");

    const verificada = await verificarTokenInstagram(token);
    if (!verificada) return volver(res, "error", "sin_cuenta_de_instagram_business");

    await guardarConexionInstagram(bandId, token, verificada.account);
    volver(res, "conectado");
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.error("Error en el callback de Instagram OAuth:", err);
    volver(res, "error", "error_interno");
  }
});

export default router;

// Cliente de la API REST de Gmail para el servidor, con refresh token por banda (OAuth
// "offline"). Existe para que el Agente Enviador cree borradores en Gmail SIN pedir una
// contraseña de aplicación y SIN popup - a diferencia de src/utils/gmail.ts (que abre un popup
// de Firebase Auth en el navegador, imposible en un proceso de servidor sin usuario delante) y
// de emailAgentClient.ts (que habla IMAP/SMTP con la contraseña de aplicación de
// band_email_accounts, el único camino que sigue existiendo para Outlook).
//
// La banda autoriza una vez vía server/routes/gmailOAuth.ts; ese flujo pide access_type=offline
// para que Google devuelva un refresh_token de larga duración, que se guarda en Supabase
// (band_gmail_oauth_accounts) y aquí se cambia por access tokens frescos según hace falta, sin
// que la banda tenga que volver a intervenir.

import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { dbGetBandGmailOAuth, dbMarkGmailNeedsReauth, dbSetGmailHistoryId } from "../db/gmailOAuth.js";
import { EmailAgentError, RespuestaEntrante } from "./emailAgentClient.js";
import { classifyGmailError } from "../utils/emailDeliveryTracker.js";
import { esRespuestaAutomatica } from "../utils/respuestaEntrante.js";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRAFTS_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";
const MESSAGES_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

// Ninguna llamada a este archivo tenía límite de tiempo: un fetch() que Google (o la red de
// Railway) deja colgado sin responder ni cerrar la conexión se queda esperando para siempre. El
// scheduler procesa las bandas en secuencia (agentScheduler.ts), así que UNA sola llamada
// atascada aquí bastaba para dejar el tick() entero sin terminar nunca - y como cada tick nuevo
// se dispara igualmente cada 60s sin esperar al anterior, se iban acumulando llamadas colgadas
// hasta agotar las conexiones disponibles y dejar el Lector (y el Enviador) completamente
// parados para TODAS las bandas, en silencio, sin ningún error que lo delatara. 15s es de sobra
// para cualquier llamada normal a la API de Gmail.
const FETCH_TIMEOUT_MS = 15_000;

function fetchConTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const accessTokenCache = new Map<string, CachedToken>();

/** Olvida el access token cacheado de una banda (al desconectar su Gmail o si Google lo rechaza). */
export function invalidarAccessTokenGmail(bandId: string): void {
  accessTokenCache.delete(bandId);
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

// Cambia el refresh_token guardado por un access_token fresco. Cacheado en memoria por banda
// (con margen de 60s antes de la expiración real) para no pedir uno nuevo en cada borrador si
// el Enviador procesa varios leads seguidos de la misma banda.
async function getValidAccessToken(bandId: string): Promise<string> {
  const cached = accessTokenCache.get(bandId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const account = await dbGetBandGmailOAuth(bandId);
  if (!account) {
    throw new EmailAgentError(`La banda '${bandId}' no tiene conectada una cuenta de Gmail por OAuth.`, "no_token");
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new EmailAgentError("Faltan GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET en el servidor.", "no_token");
  }

  const res = await fetchConTimeout(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token"
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    let revocado = false;
    try {
      revocado = JSON.parse(errBody).error === "invalid_grant";
    } catch { /* cuerpo de error no JSON: no es una revocación */ }
    if (revocado) {
      // Google revocó el permiso (caduca a los 7 días con la app OAuth en modo Testing): reintentar
      // no sirve. Se marca la cuenta para que el planificador pare y la pantalla pida reconectar.
      accessTokenCache.delete(bandId);
      await dbMarkGmailNeedsReauth(bandId);
      throw new EmailAgentError(`Google ha revocado el acceso de Gmail de '${bandId}' (invalid_grant). Hay que reconectar con 'Conectar con Google'.`, "reauth_required");
    }
    throw new EmailAgentError(`No se pudo renovar el token de Gmail para '${bandId}': ${errBody || res.status}`, "api_error");
  }

  const data = await res.json();
  const accessToken = data.access_token as string;
  const expiresInMs = (Number(data.expires_in) || 3600) * 1000;
  accessTokenCache.set(bandId, { accessToken, expiresAt: Date.now() + expiresInMs - 60_000 });

  return accessToken;
}

// Una cuenta marcada para reconectar (Google revocó el permiso) no cuenta como conectada: los
// agentes caen al camino IMAP si lo hay, en vez de fallar cada vez con un token muerto.
export async function tieneGmailOAuthConectado(bandId: string): Promise<boolean> {
  const account = await dbGetBandGmailOAuth(bandId);
  return !!account && !account.needs_reauth_at;
}

// Diagnóstico: a qué cuenta de Gmail pertenece de verdad el access token que se está usando.
// band_gmail_oauth_accounts.gmail_email puede estar vacío (el callback de OAuth en
// server/routes/gmailOAuth.ts pide el userinfo de Google con un scope que no lo cubre, así que
// esa llamada falla en silencio) - esto usa el propio endpoint de perfil de la API de Gmail
// (cubierto por el scope gmail.modify que sí tenemos) para saber con certeza qué buzón se está
// consultando de verdad, sin depender de ese dato.
export async function obtenerEmailDeLaCuentaConectada(bandId: string): Promise<string | null> {
  try {
    const accessToken = await getValidAccessToken(bandId);
    const res = await fetchConTimeout("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.emailAddress || null;
  } catch {
    return null;
  }
}

// Deja el email como BORRADOR real en Gmail vía su API REST (users.drafts.create), sin pasar
// por IMAP - la banda nunca ve una contraseña ni un popup. Misma firma que crearBorrador en
// emailAgentClient.ts a propósito, para que agentEngine.ts pueda elegir entre las dos sin
// duplicar el resto de la lógica de envío.
export async function crearBorradorGmailApi(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ draftPath: string; draftId: string }> {
  const accessToken = await getValidAccessToken(bandId);

  const raw = await new MailComposer({
    to: params.to,
    subject: params.subject,
    text: params.body,
    html: params.html || undefined,
    inReplyTo: params.inReplyTo,
    references: params.inReplyTo
  }).compile().build();

  const res = await fetchConTimeout(DRAFTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: { raw: base64UrlEncode(raw) } })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudo crear el borrador en Gmail (API) para '${bandId}': ${errBody || res.status}`, "api_error");
  }

  const data = await res.json();
  return { draftPath: `Gmail API draft ${data.id}`, draftId: data.id };
}

// Envía el email de verdad vía la API de Gmail (users.messages.send) en vez de dejarlo como
// borrador - lo usa el Agente Enviador cuando la banda activó 'direct_send' en su configuración
// de autonomía (server/db/autonomy.ts) y la plataforma tiene AGENT_EMAIL_MODE=send. Misma firma
// que enviarEmail en emailAgentClient.ts a propósito, para que agentEngine.ts elija entre las
// dos sin duplicar el resto de la lógica de despacho.
export async function enviarEmailGmailApi(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ messageId: string; threadId?: string }> {
  const accessToken = await getValidAccessToken(bandId);

  const raw = await new MailComposer({
    to: params.to,
    subject: params.subject,
    text: params.body,
    html: params.html || undefined,
    inReplyTo: params.inReplyTo,
    references: params.inReplyTo
  }).compile().build();

  const res = await fetchConTimeout(`${MESSAGES_ENDPOINT}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: base64UrlEncode(raw) })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const failureReason = classifyGmailError(errBody, res.status);
    const error = new EmailAgentError(
      `No se pudo enviar el email por Gmail (API) para '${bandId}': ${errBody || res.status}`,
      "api_error"
    );
    // Adjuntar el tipo de fallo para que agentEngine pueda registrarlo
    error.deliveryFailureReason = failureReason;
    throw error;
  }

  const data = await res.json();
  return { messageId: data.id, threadId: data.threadId };
}

// Comprueba si un borrador creado por crearBorradorGmailApi sigue existiendo como borrador.
// Un 404 significa que ya no está en Borradores - lo que confirma que el usuario le dio a "Enviar"
// en Gmail (o lo eliminó). true = sigue como borrador, false = desapareció (se interpreta como enviado).
export async function comprobarBorradorEnviado(bandId: string, draftId: string): Promise<boolean> {
  return (await comprobarBorradorEnviadoConDetalle(bandId, draftId)).existe;
}

// Misma comprobación, pero devolviendo también el status HTTP crudo que respondió Google y el messageId
// para enlazarlo en la bitácora e hilo de conversación.
export async function comprobarBorradorEnviadoConDetalle(bandId: string, draftId: string): Promise<{ existe: boolean; status: number; messageId?: string; cuerpo?: string }> {
  const accessToken = await getValidAccessToken(bandId);
  const res = await fetchConTimeout(`${DRAFTS_ENDPOINT}/${encodeURIComponent(draftId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (res.status === 404) {
    // 404 Not Found: El borrador ya no está en la carpeta de borradores (fue despachado/enviado)
    return { existe: false, status: 404 };
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudo comprobar el borrador '${draftId}' de '${bandId}': ${errBody || res.status}`, "api_error");
  }

  let cuerpo: string | undefined;
  let messageId: string | undefined;
  try {
    const data = await res.json();
    messageId = data?.message?.id;
    const headers = data?.message?.payload?.headers as Array<{ name: string; value: string }> | undefined;
    const to = headers?.find((h) => h.name.toLowerCase() === "to")?.value;
    const subject = headers?.find((h) => h.name.toLowerCase() === "subject")?.value;
    cuerpo = JSON.stringify({ draftId: data?.id, messageId, threadId: data?.message?.threadId, to, subject });
  } catch {
    cuerpo = "no se pudo parsear el cuerpo de la respuesta";
  }

  // Si Google responde 200 OK en /drafts/{draftId}, el borrador TODAVÍA reside en Borradores
  return { existe: true, status: res.status, messageId, cuerpo };
}

// Cuando un borrador desaparece de Borradores hay dos posibilidades: se envió, o se borró sin
// enviar. Un 404 no distingue entre ambas, así que se confirma buscando en Enviados un mensaje
// para ese destinatario en los últimos 30 días. null = no hay ninguno (borrador eliminado).
export async function buscarMensajeEnviadoA(bandId: string, email: string): Promise<{ messageId: string } | null> {
  const destinatario = String(email || "").trim().replace(/["\s]/g, "");
  if (!destinatario) return null;
  const accessToken = await getValidAccessToken(bandId);
  const q = encodeURIComponent(`in:sent to:${destinatario} newer_than:30d`);
  const res = await fetchConTimeout(`${MESSAGES_ENDPOINT}?q=${q}&maxResults=1`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudo buscar en Enviados de '${bandId}': ${errBody || res.status}`, "api_error");
  }
  const data = await res.json();
  const id = data?.messages?.[0]?.id;
  return id ? { messageId: String(id) } : null;
}

// Extrae el primer cuerpo de texto plano de un mensaje de Gmail (formato "full"): o bien viene
// directo en payload.body, o hay que bajar por payload.parts buscando 'text/plain' (los mensajes
// multipart/alternative traen html y texto plano como partes hermanas).
/** Parte MIME de un mensaje de Gmail (`format=full`): lo que se lee para sacar el texto plano. */
interface ParteMensajeGmail {
  mimeType?: string;
  body?: { data?: string };
  parts?: ParteMensajeGmail[];
}

/** Mensaje de Gmail (`format=full`) con lo que se lee de él. */
interface MensajeGmail {
  threadId?: string;
  payload?: ParteMensajeGmail & { headers?: Array<{ name: string; value: string }> };
}

function extraerTextoPlano(payload: ParteMensajeGmail | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }
  for (const part of payload.parts || []) {
    const texto = extraerTextoPlano(part);
    if (texto) return texto;
  }
  return "";
}

// Mapa en memoria para períodos de enfriamiento por banda cuando Google responde 429 (RESOURCE_EXHAUSTED)
const gmailRateLimitCooldownMap: Map<string, number> = new Map();
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5 minutos de enfriamiento

export function isGmailRateLimited(bandId: string): boolean {
  const until = gmailRateLimitCooldownMap.get(bandId);
  if (!until) return false;
  if (Date.now() >= until) {
    gmailRateLimitCooldownMap.delete(bandId);
    return false;
  }
  return true;
}

export function setGmailRateLimitCooldown(bandId: string, durationMs: number = COOLDOWN_DURATION_MS): void {
  const until = Date.now() + durationMs;
  gmailRateLimitCooldownMap.set(bandId, until);
  console.warn(`[Gmail API] Rate limit (429) activado para banda '${bandId}'. Enfriamiento hasta ${new Date(until).toISOString()}.`);
}

export function clearGmailRateLimitCooldown(bandId: string): void {
  gmailRateLimitCooldownMap.delete(bandId);
}

// Helper para extraer un valor de header insensible a mayúsculas/minúsculas
function headerValue(headers: Array<{ name: string; value: string }> | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Un mensaje completo de la API de Gmail (format=full) -> RespuestaEntrante.
export function parsearMensajeGmail(msg: MensajeGmail, id: string): RespuestaEntrante {
  const headers = msg.payload?.headers;
  const fromRaw = headerValue(headers, "From");
  const fromMatch = fromRaw.match(/<([^>]+)>/);
  const fromAddress = (fromMatch ? fromMatch[1] : fromRaw).toLowerCase().trim();
  const fromName = fromRaw.replace(/<.*?>/, "").replace(/"/g, "").trim();
  const toAddress = headerValue(headers, "To");
  const dateHeader = headerValue(headers, "Date");
  const subject = headerValue(headers, "Subject");
  const messageId = headerValue(headers, "Message-ID") || `gmail-${id}`;
  const inReplyTo = headerValue(headers, "In-Reply-To");
  const referencesRaw = headerValue(headers, "References");
  const references = referencesRaw
    ? referencesRaw.split(/\s+/).map((r) => r.trim()).filter(Boolean)
    : undefined;
  const text = extraerTextoPlano(msg.payload).trim();
  const automatico = esRespuestaAutomatica({
    subject, from: fromAddress, text,
    autoSubmitted: headerValue(headers, "Auto-Submitted"), precedence: headerValue(headers, "Precedence"),
    xAutoreply: headerValue(headers, "X-Autoreply") || headerValue(headers, "X-Autorespond"),
    listUnsubscribe: headerValue(headers, "List-Unsubscribe")
  });

  return {
    uid: id,
    messageId,
    from: fromAddress,
    fromName: fromName || undefined,
    to: toAddress || undefined,
    subject,
    text,
    date: dateHeader ? new Date(dateHeader) : null,
    inReplyTo: inReplyTo || undefined,
    references,
    threadId: msg.threadId || undefined,
    ...(automatico ? { automatico: true } : {})
  };
}

// --- Lectura incremental de la bandeja (lo que usa el Agente Lector con Gmail OAuth) ---------
// La lectura anterior pedía "in:inbox newer_than:7d" con un máximo de 25: en un buzón normal
// (newsletters, notificaciones) la respuesta de una sala quedaba fuera de esos 25 y no se veía
// nunca. Aquí se guarda el historyId de Gmail del último estado procesado y se piden solo los
// mensajes añadidos desde entonces, con paginación y sea cual sea el volumen del buzón.

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
/** Tope del escaneo completo (sin cursor): 200 mensajes de los últimos 7 días. */
const MAX_ESCANEO_COMPLETO = 200;

export interface LecturaBandeja {
  mensajes: RespuestaEntrante[];
  /** "incremental": solo lo nuevo desde el cursor. "completa": escaneo de 7 días (primera vez o cursor caducado). */
  modo: "incremental" | "completa";
  /**
   * Guarda el cursor. Se llama SOLO cuando el Lector ha terminado de procesar los mensajes: si el
   * proceso falla a medias el cursor no avanza y la siguiente lectura repite (el Lector ya evita
   * duplicados por Message-ID).
   */
  avanzarCursor: () => Promise<void>;
}

const SIN_LECTURA: LecturaBandeja = { mensajes: [], modo: "completa", avanzarCursor: async () => {} };

async function esLimiteDeGoogle(res: Response): Promise<boolean> {
  if (res.status === 429) return true;
  const cuerpo = await res.clone().text().catch(() => "");
  return cuerpo.includes("RESOURCE_EXHAUSTED");
}

async function listarIdsEscaneoCompleto(bandId: string, accessToken: string): Promise<string[] | null> {
  const ids: string[] = [];
  let pageToken = "";
  do {
    const q = encodeURIComponent("in:inbox newer_than:7d");
    const res = await fetchConTimeout(`${MESSAGES_ENDPOINT}?q=${q}&maxResults=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      if (await esLimiteDeGoogle(res)) { setGmailRateLimitCooldown(bandId); return null; }
      throw new EmailAgentError(`No se pudieron listar los mensajes de '${bandId}' (HTTP ${res.status}).`, "api_error");
    }
    const data: { messages?: Array<{ id: string }>; nextPageToken?: string } = await res.json();
    ids.push(...(data.messages || []).map((m) => m.id));
    pageToken = data.nextPageToken || "";
  } while (pageToken && ids.length < MAX_ESCANEO_COMPLETO);
  return ids.slice(0, MAX_ESCANEO_COMPLETO);
}

/** Ids de mensajes añadidos a la bandeja desde `cursor`; "caducado" si Google ya no conserva ese historial. */
async function listarIdsDesdeCursor(bandId: string, accessToken: string, cursor: string): Promise<string[] | "caducado" | null> {
  const ids = new Set<string>();
  let pageToken = "";
  do {
    const res = await fetchConTimeout(
      `${GMAIL_API}/history?startHistoryId=${encodeURIComponent(cursor)}&historyTypes=messageAdded&labelId=INBOX&maxResults=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (res.status === 404) return "caducado";
    if (!res.ok) {
      if (await esLimiteDeGoogle(res)) { setGmailRateLimitCooldown(bandId); return null; }
      throw new EmailAgentError(`No se pudo leer el historial de la bandeja de '${bandId}' (HTTP ${res.status}).`, "api_error");
    }
    const data: { history?: Array<{ messagesAdded?: Array<{ message?: { id: string; labelIds?: string[] } }> }>; nextPageToken?: string } = await res.json();
    for (const h of data.history || []) {
      for (const a of h.messagesAdded || []) {
        if (a.message?.id && (!a.message.labelIds || a.message.labelIds.includes("INBOX"))) ids.add(a.message.id);
      }
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return [...ids];
}

export async function leerBandejaGmailIncremental(bandId: string): Promise<LecturaBandeja> {
  if (isGmailRateLimited(bandId)) return SIN_LECTURA;
  const accessToken = await getValidAccessToken(bandId);
  const cursor = (await dbGetBandGmailOAuth(bandId))?.gmail_history_id || "";

  // El historyId actual se toma ANTES de leer: lo que llegue mientras se lee queda dentro de la
  // siguiente lectura en vez de perderse entre las dos.
  const perfil = await fetchConTimeout(`${GMAIL_API}/profile`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!perfil.ok) {
    if (await esLimiteDeGoogle(perfil)) { setGmailRateLimitCooldown(bandId); return SIN_LECTURA; }
    throw new EmailAgentError(`No se pudo consultar el perfil de Gmail de '${bandId}' (HTTP ${perfil.status}).`, "api_error");
  }
  const historyIdActual = String((await perfil.json()).historyId || "");

  let modo: LecturaBandeja["modo"] = "incremental";
  let ids = cursor ? await listarIdsDesdeCursor(bandId, accessToken, cursor) : "caducado";
  if (ids === "caducado") {
    modo = "completa";
    ids = await listarIdsEscaneoCompleto(bandId, accessToken);
  }
  if (ids === null) return SIN_LECTURA; // límite de Google: se reintenta en la siguiente lectura

  const mensajes: RespuestaEntrante[] = [];
  for (const id of ids) {
    const res = await fetchConTimeout(`${MESSAGES_ENDPOINT}/${id}?format=full`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      console.warn(`[Gmail API] No se pudo leer mensaje ${id}: ${res.status}`); // p. ej. borrado antes de leerlo
      continue;
    }
    mensajes.push(parsearMensajeGmail(await res.json(), id));
  }
  console.log(`[Gmail API] Lector (${modo}): ${mensajes.length} mensaje(s) de la bandeja de '${bandId}'.`);

  return {
    mensajes,
    modo,
    avanzarCursor: async () => {
      if (historyIdActual && !(await dbSetGmailHistoryId(bandId, historyIdActual))) {
        console.warn(`[Gmail API] No se pudo guardar el cursor de '${bandId}': la próxima lectura repetirá el escaneo de 7 días.`);
      }
    }
  };
}

// Quita la etiqueta UNREAD de los mensajes ya procesados, para que el siguiente tick no los
// vuelva a traer - equivalente de marcarComoLeido (IMAP) para el camino Gmail API.
export async function marcarComoLeidoGmailApi(bandId: string, messageIds: string[]): Promise<void> {
  if (!messageIds || messageIds.length === 0) return;
  const accessToken = await getValidAccessToken(bandId);
  const res = await fetchConTimeout(`${MESSAGES_ENDPOINT}/batchModify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ids: messageIds, removeLabelIds: ["UNREAD"] })
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudieron marcar como leídos los mensajes de '${bandId}': ${errBody || res.status}`, "api_error");
  }
}

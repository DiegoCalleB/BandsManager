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
import { dbGetBandGmailOAuth } from "../db/gmailOAuth.js";
import { EmailAgentError, RespuestaEntrante } from "./emailAgentClient.js";
import { classifyGmailError, isBounceMessage } from "../utils/emailDeliveryTracker.js";

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
    throw new EmailAgentError(`No se pudo renovar el token de Gmail para '${bandId}': ${errBody || res.status}`, "api_error");
  }

  const data = await res.json();
  const accessToken = data.access_token as string;
  const expiresInMs = (Number(data.expires_in) || 3600) * 1000;
  accessTokenCache.set(bandId, { accessToken, expiresAt: Date.now() + expiresInMs - 60_000 });

  return accessToken;
}

export async function tieneGmailOAuthConectado(bandId: string): Promise<boolean> {
  const account = await dbGetBandGmailOAuth(bandId);
  return !!account;
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
export async function enviarEmailGmailApi(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ messageId: string }> {
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
    (error as any).deliveryFailureReason = failureReason;
    throw error;
  }

  const data = await res.json();
  return { messageId: data.id };
}

// Comprueba si un borrador creado por crearBorradorGmailApi sigue existiendo como borrador.
// Un 404 significa que ya no está en Borradores - lo más probable es que la banda le haya dado
// a "Enviar" a mano en Gmail (también podría haberlo borrado sin más, caso raro que como mucho
// deja el lead marcado como enviado por error, corregible a mano). true = sigue como borrador,
// false = desapareció (se interpreta como enviado).
export async function comprobarBorradorEnviado(bandId: string, draftId: string): Promise<boolean> {
  return (await comprobarBorradorEnviadoConDetalle(bandId, draftId)).existe;
}

// Misma comprobación, pero devolviendo también el status HTTP crudo que respondió Google - lo
// que necesita comprobarBorradoresGmailEnviados (agentEngine.ts) para poder registrar, cuando el
// borrador "sigue existiendo", si de verdad se comprobó (200) o si el chequeo en sí falló de un
// modo que terminó interpretándose como "sigue existiendo" sin serlo.
//
// Detalle importante de Gmail API: cuando envías un borrador manualmente desde Gmail, el endpoint
// /drafts/{id} sigue devolviendo 200 durante un tiempo, pero con un messageId diferente del draftId.
// Esto significa que el borrador ha sido enviado (convertido en un message) - interpretamos eso como
// "no existe" (fue enviado).
export async function comprobarBorradorEnviadoConDetalle(bandId: string, draftId: string): Promise<{ existe: boolean; status: number; messageId?: string; cuerpo?: string }> {
  const accessToken = await getValidAccessToken(bandId);
  const res = await fetchConTimeout(`${DRAFTS_ENDPOINT}/${encodeURIComponent(draftId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (res.status === 404) return { existe: false, status: 404 };
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
  } catch (e) {
    cuerpo = "no se pudo parsear el cuerpo de la respuesta";
  }

  // Si tiene messageId diferente del draftId, significa que fue enviado (se convirtió en message)
  const fueEnviado = messageId && messageId !== draftId;
  return { existe: !fueEnviado, status: res.status, messageId, cuerpo };
}

// Extrae el primer cuerpo de texto plano de un mensaje de Gmail (formato "full"): o bien viene
// directo en payload.body, o hay que bajar por payload.parts buscando 'text/plain' (los mensajes
// multipart/alternative traen html y texto plano como partes hermanas).
function extraerTextoPlano(payload: any): string {
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

function headerValue(headers: Array<{ name: string; value: string }> | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Igual que leerRespuestasEntrantes (emailAgentClient.ts) pero vía la API de Gmail en vez de
// IMAP - lo que usa el Agente Lector cuando la banda conectó Gmail por OAuth sin contraseña de
// aplicación, camino que hasta ahora no tenía forma de leer respuestas entrantes en absoluto.
export async function leerRespuestasGmailApi(bandId: string, maxResults = 20): Promise<RespuestaEntrante[]> {
  const accessToken = await getValidAccessToken(bandId);

  const listRes = await fetchConTimeout(`${MESSAGES_ENDPOINT}?q=${encodeURIComponent("is:unread in:inbox")}&maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!listRes.ok) {
    const errBody = await listRes.text().catch(() => "");
    throw new EmailAgentError(`No se pudieron listar los mensajes nuevos de '${bandId}': ${errBody || listRes.status}`, "api_error");
  }
  const listData = await listRes.json();
  const ids: string[] = (listData.messages || []).map((m: any) => m.id);

  const resultados: RespuestaEntrante[] = [];
  for (const id of ids) {
    const msgRes = await fetchConTimeout(`${MESSAGES_ENDPOINT}/${id}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();
    const headers = msg.payload?.headers;
    const fromRaw = headerValue(headers, "From");
    const fromMatch = fromRaw.match(/<([^>]+)>/);
    const fromAddress = (fromMatch ? fromMatch[1] : fromRaw).toLowerCase().trim();
    const dateHeader = headerValue(headers, "Date");

    resultados.push({
      uid: id,
      messageId: headerValue(headers, "Message-ID") || `gmail-${id}`,
      from: fromAddress,
      subject: headerValue(headers, "Subject"),
      text: extraerTextoPlano(msg.payload).trim(),
      date: dateHeader ? new Date(dateHeader) : null
    });
  }

  return resultados;
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

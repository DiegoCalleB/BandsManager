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

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRAFTS_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";
const MESSAGES_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

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

  const res = await fetch(TOKEN_ENDPOINT, {
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

  const res = await fetch(DRAFTS_ENDPOINT, {
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

  const res = await fetch(`${MESSAGES_ENDPOINT}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: base64UrlEncode(raw) })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudo enviar el email por Gmail (API) para '${bandId}': ${errBody || res.status}`, "api_error");
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
  const accessToken = await getValidAccessToken(bandId);
  const res = await fetch(`${DRAFTS_ENDPOINT}/${encodeURIComponent(draftId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (res.status === 404) return false;
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new EmailAgentError(`No se pudo comprobar el borrador '${draftId}' de '${bandId}': ${errBody || res.status}`, "api_error");
  }
  return true;
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

  const listRes = await fetch(`${MESSAGES_ENDPOINT}?q=${encodeURIComponent("is:unread in:inbox")}&maxResults=${maxResults}`, {
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
    const msgRes = await fetch(`${MESSAGES_ENDPOINT}/${id}?format=full`, {
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
  const res = await fetch(`${MESSAGES_ENDPOINT}/batchModify`, {
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

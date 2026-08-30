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
import { EmailAgentError } from "./emailAgentClient.js";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRAFTS_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

const accessTokenCache = new Map<string, CachedToken>();

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
export async function crearBorradorGmailApi(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ draftPath: string }> {
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
  return { draftPath: `Gmail API draft ${data.id}` };
}

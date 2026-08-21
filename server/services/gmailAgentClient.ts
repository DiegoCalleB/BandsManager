// Cliente de Gmail del lado del servidor, para envío/lectura desatendidos por el Agente
// Enviador/Lector - distinto de src/utils/gmail.ts, que es de navegador y está atado a la
// sesión de quien esté logueado en la SPA (no sirve para automatización sin usuario delante).
//
// Port del diseño de lib/gmail_client.py del repo bakandeya-agent-manager: cada banda conecta
// su propia cuenta de Gmail una vez vía OAuth (nunca un buzón compartido), el refresh_token se
// guarda en Supabase (band_gmail_tokens) en vez de en un fichero tokens/{band_id}.json, y antes
// de enviar se verifica que la cuenta conectada coincide con el email oficial de la banda.

import { getSupabase } from "../db/core.js";
import { dbGetBandGmailToken } from "../db/gmailTokens.js";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export class GmailAgentError extends Error {
  constructor(message: string, public code: "no_token" | "identity_mismatch" | "api_error") {
    super(message);
    this.name = "GmailAgentError";
  }
}

async function getAccessToken(bandId: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new GmailAgentError(
      "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET no configurados en el servidor.",
      "no_token"
    );
  }

  const stored = await dbGetBandGmailToken(bandId);
  if (!stored?.refresh_token) {
    throw new GmailAgentError(
      `La banda '${bandId}' no tiene una cuenta de Gmail conectada.`,
      "no_token"
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: stored.refresh_token,
      grant_type: "refresh_token"
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new GmailAgentError(
      `No se pudo refrescar el token de Gmail de '${bandId}': ${errBody || res.status}`,
      "no_token"
    );
  }

  const data = await res.json();
  return data.access_token;
}

// Comprueba que la cuenta de Gmail realmente conectada coincide con el email oficial de la
// banda en registered_bands - mejor no enviar nada que enviar desde la bandeja equivocada.
export async function verificarIdentidadGmail(bandId: string): Promise<{ ok: boolean; emailConectado: string | null; emailOficial: string | null }> {
  const accessToken = await getAccessToken(bandId);

  const profileRes = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!profileRes.ok) {
    throw new GmailAgentError(`No se pudo obtener el perfil de Gmail de '${bandId}'.`, "api_error");
  }
  const profile = await profileRes.json();
  const emailConectado = (profile.emailAddress || "").toLowerCase().trim();

  const sb = getSupabase();
  const { data: bandData } = await sb
    .from("registered_bands")
    .select("email")
    .eq("band_id", bandId)
    .maybeSingle();
  const emailOficial = (bandData?.email || "").toLowerCase().trim();

  return {
    ok: !!emailConectado && !!emailOficial && emailConectado === emailOficial,
    emailConectado: emailConectado || null,
    emailOficial: emailOficial || null
  };
}

function buildRawMessage(params: { to: string; from: string; subject: string; body: string; inReplyTo?: string }): string {
  const headers = [
    `To: ${params.to}`,
    `From: ${params.from}`,
    `Subject: =?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8"
  ];
  if (params.inReplyTo) {
    headers.push(`In-Reply-To: ${params.inReplyTo}`, `References: ${params.inReplyTo}`);
  }
  const message = `${headers.join("\r\n")}\r\n\r\n${params.body}`;
  return Buffer.from(message, "utf-8").toString("base64url");
}

// Envía un email real desde la cuenta de Gmail de la banda. Lanza GmailAgentError si no hay
// token o si la identidad no coincide con el EPK - nunca marca un envío como hecho sin haberlo
// hecho de verdad (bug encontrado en las implementaciones anteriores de este mismo agente).
export async function enviarEmail(bandId: string, params: { to: string; subject: string; body: string; inReplyTo?: string }): Promise<{ messageId: string }> {
  const identidad = await verificarIdentidadGmail(bandId);
  if (!identidad.ok) {
    throw new GmailAgentError(
      `La cuenta de Gmail conectada para '${bandId}' (${identidad.emailConectado || "ninguna"}) no coincide con el email oficial de la banda (${identidad.emailOficial || "sin configurar"}). No se ha enviado nada.`,
      "identity_mismatch"
    );
  }

  const accessToken = await getAccessToken(bandId);
  const raw = buildRawMessage({
    to: params.to,
    from: identidad.emailConectado!,
    subject: params.subject,
    body: params.body,
    inReplyTo: params.inReplyTo
  });

  const sendRes = await fetch(`${GMAIL_API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw })
  });

  if (!sendRes.ok) {
    const errBody = await sendRes.text().catch(() => "");
    throw new GmailAgentError(`Gmail API rechazó el envío para '${bandId}': ${errBody || sendRes.status}`, "api_error");
  }

  const sent = await sendRes.json();
  return { messageId: sent.id };
}

// Lista mensajes no leídos de la bandeja de la banda (para el Agente Lector). Solo lectura -
// no modifica el estado de los mensajes.
export async function leerNoLeidos(bandId: string, maxResults = 10): Promise<Array<{ id: string; from: string; subject: string; snippet: string }>> {
  const accessToken = await getAccessToken(bandId);

  const listRes = await fetch(`${GMAIL_API_BASE}/messages?q=is:unread&maxResults=${maxResults}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!listRes.ok) {
    throw new GmailAgentError(`No se pudo listar mensajes no leídos de '${bandId}'.`, "api_error");
  }
  const list = await listRes.json();
  const messageRefs: Array<{ id: string }> = list.messages || [];

  const results = [];
  for (const ref of messageRefs) {
    const msgRes = await fetch(`${GMAIL_API_BASE}/messages/${ref.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!msgRes.ok) continue;
    const msg = await msgRes.json();
    const headers: Array<{ name: string; value: string }> = msg.payload?.headers || [];
    results.push({
      id: msg.id,
      from: headers.find((h) => h.name === "From")?.value || "",
      subject: headers.find((h) => h.name === "Subject")?.value || "",
      snippet: msg.snippet || ""
    });
  }

  return results;
}

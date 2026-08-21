// Cliente de email del lado del servidor, agnóstico de proveedor, para envío/lectura
// desatendidos por el Agente Enviador/Lector - distinto de src/utils/gmail.ts, que es de
// navegador y está atado a la sesión de quien esté logueado en la SPA (no sirve para
// automatización sin usuario delante).
//
// Habla SMTP (envío) e IMAP (lectura), los protocolos estándar que soportan Gmail, Outlook,
// Yahoo o cualquier dominio propio - en vez de atarse a la API específica de un solo
// proveedor (como hacía la versión anterior, solo-Gmail-vía-OAuth). Cada banda conecta su
// propia cuenta con una contraseña de aplicación (nunca un buzón compartido), y antes de
// enviar se verifica que esa cuenta coincide con el email oficial de la banda.

import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { getSupabase } from "../db/core.js";
import { dbGetBandEmailAccount, BandEmailAccount } from "../db/emailAccounts.js";

export class EmailAgentError extends Error {
  constructor(message: string, public code: "no_token" | "identity_mismatch" | "api_error") {
    super(message);
    this.name = "EmailAgentError";
  }
}

async function getAccount(bandId: string): Promise<BandEmailAccount> {
  const account = await dbGetBandEmailAccount(bandId);
  if (!account) {
    throw new EmailAgentError(`La banda '${bandId}' no tiene una cuenta de email conectada.`, "no_token");
  }
  return account;
}

// Comprueba que la cuenta de email configurada coincide con el email oficial de la banda en
// registered_bands - mejor no enviar nada que enviar desde la bandeja equivocada.
export async function verificarIdentidadEmail(bandId: string): Promise<{ ok: boolean; emailConectado: string | null; emailOficial: string | null }> {
  const account = await getAccount(bandId);
  const emailConectado = (account.email || "").toLowerCase().trim();

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

// Envía un email real por SMTP desde la cuenta de la banda. Lanza EmailAgentError si no hay
// cuenta configurada o si la identidad no coincide con el EPK - nunca marca un envío como
// hecho sin haberlo hecho de verdad.
export async function enviarEmail(bandId: string, params: { to: string; subject: string; body: string; inReplyTo?: string }): Promise<{ messageId: string }> {
  const account = await getAccount(bandId);
  const identidad = await verificarIdentidadEmail(bandId);
  if (!identidad.ok) {
    throw new EmailAgentError(
      `La cuenta de email conectada para '${bandId}' (${identidad.emailConectado || "ninguna"}) no coincide con el email oficial de la banda (${identidad.emailOficial || "sin configurar"}). No se ha enviado nada.`,
      "identity_mismatch"
    );
  }

  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_secure,
    auth: { user: account.email, pass: account.app_password }
  });

  try {
    const info = await transporter.sendMail({
      from: account.email,
      to: params.to,
      subject: params.subject,
      text: params.body,
      inReplyTo: params.inReplyTo,
      references: params.inReplyTo
    });
    return { messageId: info.messageId };
  } catch (err: any) {
    throw new EmailAgentError(`No se pudo enviar el email para '${bandId}': ${err.message || err}`, "api_error");
  }
}

// Lista mensajes no leídos de la bandeja de la banda (para el Agente Lector). Solo lectura -
// no modifica el estado de los mensajes.
export async function leerNoLeidos(bandId: string, maxResults = 10): Promise<Array<{ id: string; from: string; subject: string; snippet: string }>> {
  const account = await getAccount(bandId);

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth: { user: account.email, pass: account.app_password },
    logger: false
  });

  const results: Array<{ id: string; from: string; subject: string; snippet: string }> = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false });
      const toFetch = (uids || []).slice(-maxResults);

      for (const uid of toFetch) {
        const msg = await client.fetchOne(uid, { envelope: true, bodyStructure: true }, { uid: true });
        if (!msg) continue;
        const fromAddr = msg.envelope?.from?.[0];
        results.push({
          id: String(uid),
          from: fromAddr ? `${fromAddr.name || ""} <${fromAddr.address || ""}>`.trim() : "",
          subject: msg.envelope?.subject || "",
          snippet: ""
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    try { await client.logout(); } catch (_) { /* ya cerrada o nunca abierta */ }
    throw new EmailAgentError(`No se pudo leer la bandeja de '${bandId}': ${err.message || err}`, "api_error");
  }

  return results;
}

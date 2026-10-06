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
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
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
export async function enviarEmail(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ messageId: string }> {
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
      html: params.html || undefined,
      inReplyTo: params.inReplyTo,
      references: params.inReplyTo
    });
    return { messageId: info.messageId };
  } catch (err: any) {
    throw new EmailAgentError(`No se pudo enviar el email para '${bandId}': ${err.message || err}`, "api_error");
  }
}

// Deja el email como BORRADOR en la bandeja de la banda en vez de enviarlo, para que una
// persona lo revise (redacción, formato) y decida si lo manda a mano. Es el comportamiento por
// defecto del Agente Enviador mientras el sistema está en pruebas - ver AGENT_EMAIL_MODE en
// agentEngine.ts.
//
// SMTP no tiene borradores (son un concepto de IMAP), así que se construye el mensaje RFC822 con
// MailComposer y se sube con IMAP APPEND. La carpeta de borradores NO se puede hardcodear: en
// Gmail en español es '[Gmail]/Borradores' y en Outlook 'Drafts', así que se localiza por el
// atributo especial '\Drafts' que ImapFlow ya resuelve incluso con nombres traducidos.
export async function crearBorrador(bandId: string, params: { to: string; subject: string; body: string; html?: string; inReplyTo?: string }): Promise<{ draftPath: string }> {
  const account = await getAccount(bandId);
  const identidad = await verificarIdentidadEmail(bandId);
  if (!identidad.ok) {
    throw new EmailAgentError(
      `La cuenta de email conectada para '${bandId}' (${identidad.emailConectado || "ninguna"}) no coincide con el email oficial de la banda (${identidad.emailOficial || "sin configurar"}). No se ha creado ningún borrador.`,
      "identity_mismatch"
    );
  }

  const raw = await new MailComposer({
    from: account.email,
    to: params.to,
    subject: params.subject,
    text: params.body,
    html: params.html || undefined,
    inReplyTo: params.inReplyTo,
    references: params.inReplyTo
  }).compile().build();

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth: { user: account.email, pass: account.app_password },
    logger: false
  });

  try {
    await client.connect();

    const mailboxes = await client.list();
    // Buscar carpeta de borradores: primero por specialUse (Outlook), luego por nombre (Gmail)
    let drafts = (mailboxes || []).find((mb: any) => mb.specialUse === "\\Drafts");
    if (!drafts) {
      // Fallback para Gmail: buscar por nombre
      drafts = (mailboxes || []).find((mb: any) =>
        mb.path === "[Gmail]/Drafts" ||
        mb.path === "Drafts" ||
        mb.name?.toLowerCase() === "drafts"
      );
    }
    if (!drafts) {
      throw new Error("no se encontró la carpeta de borradores (\\Drafts o [Gmail]/Drafts) en la cuenta");
    }

    await client.append(drafts.path, raw, ["\\Draft"]);
    await client.logout();
    return { draftPath: drafts.path };
  } catch (err: any) {
    try { await client.logout(); } catch (_) { /* ya cerrada o nunca abierta */ }
    // Nunca se cae hacia atrás a enviar: si no se pudo dejar el borrador, no ha salido nada.
    throw new EmailAgentError(`No se pudo crear el borrador para '${bandId}': ${err.message || err}`, "api_error");
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

// uid es number para IMAP (ImapFlow) o string para la API de Gmail (gmailApiClient.ts,
// leerRespuestasGmailApi) - mismo shape para que lectorAgent.ts trate ambos caminos igual.
export interface RespuestaEntrante {
  uid: number | string;
  messageId: string;
  from: string;
  subject: string;
  text: string;
  date: Date | null;
  inReplyTo?: string; // Header In-Reply-To para emparejar respuestas con emails originales
}

// Igual que leerNoLeidos, pero trae el CUERPO real del mensaje (parseado con mailparser a
// partir del RFC822 crudo) en vez de solo remitente/asunto - es lo que necesita el Agente
// Lector para emparejar la respuesta con un lead real y dejarla registrada en su hilo, en vez
// de solo contar cuántos mensajes hay sin leer.
export async function leerRespuestasEntrantes(bandId: string, maxResults = 20): Promise<RespuestaEntrante[]> {
  const account = await getAccount(bandId);

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth: { user: account.email, pass: account.app_password },
    logger: false
  });

  const results: RespuestaEntrante[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false });
      const toFetch = (uids || []).slice(-maxResults);

      for (const uid of toFetch) {
        const msg = await client.fetchOne(uid, { envelope: true, source: true }, { uid: true });
        if (!msg || !msg.source) continue;

        const parsed = await simpleParser(msg.source);
        const fromAddress = parsed.from?.value?.[0]?.address || "";
        results.push({
          uid: Number(uid),
          messageId: parsed.messageId || `imap-uid-${uid}`,
          from: fromAddress,
          subject: parsed.subject || "",
          text: (parsed.text || "").trim(),
          date: parsed.date || null,
          inReplyTo: parsed.inReplyTo || undefined
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    try { await client.logout(); } catch (_) { /* ya cerrada o nunca abierta */ }
    throw new EmailAgentError(`No se pudo leer las respuestas entrantes de '${bandId}': ${err.message || err}`, "api_error");
  }

  return results;
}

// Marca mensajes como leídos tras procesarlos con éxito, para que el siguiente tick del
// scheduler (cada 60s) no los vuelva a traer con search({seen:false}). Se llama solo sobre los
// UIDs que ya se emparejaron y persistieron correctamente: uno que falle a mitad se queda sin
// marcar y se reintenta en el siguiente ciclo.
export async function marcarComoLeido(bandId: string, uids: number[]): Promise<void> {
  if (!uids || uids.length === 0) return;
  const account = await getAccount(bandId);

  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: true,
    auth: { user: account.email, pass: account.app_password },
    logger: false
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true });
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err: any) {
    try { await client.logout(); } catch (_) { /* ya cerrada o nunca abierta */ }
    throw new EmailAgentError(`No se pudieron marcar como leídos los mensajes de '${bandId}': ${err.message || err}`, "api_error");
  }
}

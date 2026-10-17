// Avisos por email de lo que ocurre con la cuenta de una banda al conectar su Gmail. Lógica pura
// (a quién se avisa y qué texto lleva); el envío está en services/gmailConexion.ts.
//
// Por qué: conectar un Gmail da permiso de leer y dejar borradores, y además puede CAMBIAR el email
// con el que se entra a la banda. Antes no salía ningún correo: si alguien con la sesión abierta
// conectaba un Gmail ajeno, el titular no se enteraba. El aviso de cambio de acceso va al email
// ANTERIOR, que es el que importa para detectarlo.

import { esEmailValido } from './email.js';
import { escapeHtml } from './html.js';

const normalizar = (e: string) => e.trim().toLowerCase();

export interface EntradaDestinatarios {
  /** Email de acceso de la banda ANTES de conectar el Gmail. */
  emailAnterior: string;
  /** Cuenta de Gmail conectada (puede venir vacía si Google no la devolvió). */
  gmailEmail: string;
  /** Si al conectar se sustituyó el email de acceso de la banda por el Gmail. */
  seCambioElEmailDeAcceso: boolean;
}

/**
 * A quién se manda cada aviso, sin repetidos ni direcciones inválidas.
 *  - Cambió el email de acceso: conexión → Gmail nuevo; cambio de acceso → email anterior (solo).
 *  - No cambió: la conexión se avisa a la cuenta conectada y al email de la banda si es otro.
 */
export function destinatariosDeAvisos(e: EntradaDestinatarios): { conexion: string[]; cambioDeAcceso: string | null } {
  const anterior = esEmailValido(e.emailAnterior) ? normalizar(e.emailAnterior) : '';
  const gmail = esEmailValido(e.gmailEmail) ? normalizar(e.gmailEmail) : '';
  if (e.seCambioElEmailDeAcceso && anterior && anterior !== gmail) {
    return { conexion: gmail ? [gmail] : [], cambioDeAcceso: anterior };
  }
  return { conexion: [...new Set([gmail, anterior].filter(Boolean))], cambioDeAcceso: null };
}

interface Correo { subject: string; html: string }

const envoltorio = (titulo: string, cuerpo: string, appUrl: string) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${titulo}</title></head>
<body style="margin:0;padding:24px 16px;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a2e35;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;">
<div style="font-size:20px;font-weight:800;margin-bottom:16px;">BandManager.io</div>
<h2 style="margin:0 0 14px 0;font-size:18px;">${titulo}</h2>
${cuerpo}
<p style="margin:22px 0 0 0;"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#d86e31;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;">Abrir BandManager</a></p>
</div></body></html>`;

const parrafo = (t: string) => `<p style="margin:0 0 12px 0;font-size:14.5px;line-height:1.6;">${t}</p>`;

export function renderAvisoGmailConectado(d: { nombreBanda: string; gmailEmail: string; appUrl: string }): Correo {
  const banda = escapeHtml(d.nombreBanda);
  const cuenta = d.gmailEmail ? `la cuenta <strong>${escapeHtml(d.gmailEmail)}</strong>` : 'una cuenta de Gmail';
  const cuerpo =
    parrafo(`Se ha conectado ${cuenta} a la banda <strong>${banda}</strong>.`) +
    parrafo('Con este permiso BandManager puede <strong>leer las respuestas de las salas</strong> a tus propuestas y <strong>dejar borradores</strong> en tu Gmail. <strong>Nunca envía nada</strong> sin que tú lo apruebes en la app.') +
    parrafo('<strong>Si no has sido tú</strong>, desconéctala ahora: abre BandManager, ve a Configuración de correo y pulsa «Desconectar». También puedes retirar el acceso desde tu cuenta de Google en <strong>myaccount.google.com/permissions</strong>.');
  return {
    subject: `Gmail conectado a ${d.nombreBanda.replace(/[<>\r\n]/g, ' ').trim()} en BandManager`,
    html: envoltorio('Gmail conectado', cuerpo, d.appUrl),
  };
}

export function renderAvisoEmailDeAccesoCambiado(d: { nombreBanda: string; emailAnterior: string; emailNuevo: string; appUrl: string }): Correo {
  const cuerpo =
    parrafo(`El email con el que se entra a la banda <strong>${escapeHtml(d.nombreBanda)}</strong> ha cambiado de <strong>${escapeHtml(d.emailAnterior)}</strong> a <strong>${escapeHtml(d.emailNuevo)}</strong>, porque se ha conectado ese Gmail.`) +
    parrafo('<strong>Si no has sido tú</strong>, entra cuanto antes en BandManager, cambia tu contraseña y desconecta el Gmail en Configuración de correo. Puedes retirar el permiso también desde <strong>myaccount.google.com/permissions</strong>.');
  return {
    subject: 'Ha cambiado el email de acceso de tu banda en BandManager',
    html: envoltorio('Ha cambiado el email de acceso', cuerpo, d.appUrl),
  };
}

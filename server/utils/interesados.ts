// Lista de novedades de la landing (doble confirmación). Todo aquí es puro, sin red ni BD, para poder probarlo.
// El envío vive en routes/interesados.ts y el acceso a datos en db/interesados.ts.

import crypto from 'node:crypto';
import { escapeHtml } from './html.js';
import { secretoDeTracking } from './trackingSeguro.js';

export type IdiomaInteresado = 'es' | 'en';
export type AccionInteresado = 'confirmar' | 'baja';

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;

/** Email en minúsculas y sin espacios, o null si no tiene pinta de dirección válida. */
export function normalizarEmailInteresado(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

export const idiomaInteresado = (valor: unknown): IdiomaInteresado => (valor === 'en' ? 'en' : 'es');

const firmar = (accion: AccionInteresado, id: string) =>
  crypto.createHmac('sha256', secretoDeTracking()).update(`interesado:${accion}:${id}`).digest('hex').slice(0, 32);

export function firmaInteresadoValida(accion: AccionInteresado, id: string, firma: unknown): boolean {
  if (typeof firma !== 'string' || !/^[0-9a-f]{32}$/.test(firma)) return false;
  return crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmar(accion, id)));
}

export function urlInteresado(base: string, accion: AccionInteresado, id: string): string {
  return `${base}/api/public/interesados/${accion}?i=${encodeURIComponent(id)}&f=${firmar(accion, id)}`;
}

interface Correo {
  asunto: string;
  html: string;
}

const envoltorio = (titulo: string, parrafo: string, boton: { texto: string; url: string } | null, pie: string) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>` +
  `<body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#1a1a1a;"><div style="max-width:480px;margin:0 auto;padding:32px 24px;">` +
  `<h1 style="font-size:22px;margin:0 0 16px;">${escapeHtml(titulo)}</h1>` +
  `<p style="font-size:15px;line-height:1.5;margin:0 0 24px;">${escapeHtml(parrafo)}</p>` +
  (boton
    ? `<p style="margin:0 0 24px;"><a href="${escapeHtml(boton.url)}" style="background:#f2ca50;color:#1a1a1a;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block;">${escapeHtml(boton.texto)}</a></p>`
    : '') +
  `<p style="font-size:12px;color:#666;line-height:1.5;margin:0;">${pie}</p></div></body></html>`;

/** Correo 1: pide confirmar la dirección. Sin este clic no se escribe más. */
export function correoConfirmacion(idioma: IdiomaInteresado, urlConfirmar: string): Correo {
  return idioma === 'en'
    ? {
        asunto: 'Confirm your email to hear from BandManager',
        html: envoltorio(
          'One click and you are in',
          'You asked to hear about BandManager.io. Confirm your email and we will send you news when there is something worth telling. If it was not you, ignore this message and nothing will happen.',
          { texto: 'Confirm my email', url: urlConfirmar },
          'BandManager.io · We only write to you if you confirm.',
        ),
      }
    : {
        asunto: 'Confirma tu email para recibir novedades de BandManager',
        html: envoltorio(
          'Un clic y estás dentro',
          'Pediste recibir información de BandManager.io. Confirma tu email y te escribiremos cuando haya algo que merezca la pena contarte. Si no fuiste tú, ignora este mensaje y no pasará nada.',
          { texto: 'Confirmar mi email', url: urlConfirmar },
          'BandManager.io · Solo te escribimos si confirmas.',
        ),
      };
}

/** Correo 2: bienvenida tras confirmar, con enlace de baja. */
export function correoBienvenida(idioma: IdiomaInteresado, urlApp: string, urlBajaEnlace: string): Correo {
  const baja = (txt: string) => `<a href="${escapeHtml(urlBajaEnlace)}" style="color:#666;">${txt}</a>`;
  return idioma === 'en'
    ? {
        asunto: 'You are in: what BandManager does for your band',
        html: envoltorio(
          'Welcome to BandManager.io',
          'Setlists made for each musician, stems separated by AI, one calendar for all your gigs and rehearsals, and a QR to turn the merch table into a fan list. You can try it free whenever you want.',
          { texto: 'See BandManager', url: urlApp },
          `You get this because you asked for news. ${baja('Unsubscribe')}`,
        ),
      }
    : {
        asunto: 'Ya estás dentro: qué hace BandManager por tu banda',
        html: envoltorio(
          'Bienvenido a BandManager.io',
          'Setlists a medida de cada músico, pistas separadas con IA, un calendario para todos tus bolos y ensayos y un QR que convierte la mesa de merchan en una lista de fans. Puedes probarlo gratis cuando quieras.',
          { texto: 'Ver BandManager', url: urlApp },
          `Recibes esto porque pediste novedades. ${baja('Darme de baja')}`,
        ),
      };
}

/** Página mínima que se muestra al abrir el enlace de confirmar o de baja. */
export function paginaInteresado(mensaje: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>BandManager.io</title></head><body style="font-family:Arial,sans-serif;padding:48px 24px;text-align:center;"><p>${escapeHtml(mensaje)}</p><p><a href="/">BandManager.io</a></p></body></html>`;
}

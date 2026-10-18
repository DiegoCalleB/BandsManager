// Emails de ciclo de vida (onboarding): qué toca enviar a cada usuario y con qué texto.
// Todo aquí es puro (sin red ni BD) para poder probarlo; el envío vive en services/emailsCicloVida.ts.
//
// Se envía como máximo UN email por usuario y ejecución, solo a altas recientes y solo si todavía
// no ha hecho lo que el email le propone. Cada email lleva enlace de baja.

import crypto from 'node:crypto';
import { escapeHtml } from './html.js';
import { secretoDeTracking } from './trackingSeguro.js';

export type TipoEmail = 'primer_concierto' | 'epk';
export type IdiomaEmail = 'es' | 'en';

const DIA_MS = 24 * 60 * 60 * 1000;
/** Pasado este tiempo desde el alta ya no se escribe: evita avisar a cuentas antiguas. */
export const VENTANA_MAX_DIAS = 14;

export interface EntradaElegir {
  creadoEn: string | Date;
  ahora: Date;
  /** Tipos ya enviados a este usuario; 'baja' significa que no quiere más. */
  enviados: ReadonlySet<string>;
  tieneConcierto: boolean;
  tieneEpk: boolean;
}

export function elegirEmail(e: EntradaElegir): TipoEmail | null {
  if (e.enviados.has('baja')) return null;
  const dias = (e.ahora.getTime() - new Date(e.creadoEn).getTime()) / DIA_MS;
  if (!Number.isFinite(dias) || dias < 2 || dias > VENTANA_MAX_DIAS) return null;
  if (!e.tieneConcierto && !e.enviados.has('primer_concierto')) return 'primer_concierto';
  if (!e.tieneEpk && dias >= 5 && !e.enviados.has('epk')) return 'epk';
  return null;
}

export function idiomaDeUsuario(uiPreferences: unknown): IdiomaEmail {
  const idioma = (uiPreferences as { idioma?: unknown } | null | undefined)?.idioma;
  return idioma === 'en' ? 'en' : 'es';
}

/* ------------------------------------------------------------------ baja firmada */

const firmar = (userId: string) =>
  crypto.createHmac('sha256', secretoDeTracking()).update(`baja:${userId}`).digest('hex').slice(0, 32);

export function firmaBajaValida(userId: string, firma: unknown): boolean {
  if (typeof firma !== 'string' || !/^[0-9a-f]{32}$/.test(firma)) return false;
  return crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmar(userId)));
}

export function urlBaja(base: string, userId: string): string {
  return `${base}/api/emails/baja?u=${encodeURIComponent(userId)}&f=${firmar(userId)}`;
}

/* ------------------------------------------------------------------ textos */

interface Textos {
  asunto: string;
  titulo: string;
  cuerpo: string;
  boton: string;
}

function textos(tipo: TipoEmail, idioma: IdiomaEmail, banda: string): Textos {
  const t: Record<TipoEmail, Record<IdiomaEmail, Textos>> = {
    primer_concierto: {
      es: {
        asunto: 'Tu primer concierto en BandManager, en 2 minutos',
        titulo: `${banda} aún no tiene fechas`,
        cuerpo:
          'Añade tu próximo concierto y BandManager te prepara el calendario, la hoja del bolo y el cartel para compartir. Son dos minutos.',
        boton: 'Añadir mi primer concierto',
      },
      en: {
        asunto: 'Your first gig on BandManager, in 2 minutes',
        titulo: `${banda} has no dates yet`,
        cuerpo:
          'Add your next gig and BandManager sets up your calendar, the gig sheet and a poster to share. It takes two minutes.',
        boton: 'Add my first gig',
      },
    },
    epk: {
      es: {
        asunto: 'Tu EPK: la tarjeta de visita que las salas sí leen',
        titulo: 'Deja listo el EPK de tu banda',
        cuerpo:
          'Una biografía corta, fotos y enlaces en una sola página que puedes mandar a cualquier sala. Con ella, escribir a programadores es mucho más fácil.',
        boton: 'Crear mi EPK',
      },
      en: {
        asunto: 'Your EPK: the business card venues actually read',
        titulo: "Get your band's EPK ready",
        cuerpo:
          'A short bio, photos and links on a single page you can send to any venue. It makes writing to bookers much easier.',
        boton: 'Create my EPK',
      },
    },
  };
  return t[tipo][idioma];
}

export interface EntradaPlantilla {
  tipo: TipoEmail;
  idioma: IdiomaEmail;
  nombre: string;
  banda: string;
  base: string;
  userId: string;
}

export function renderizarEmail(e: EntradaPlantilla): { asunto: string; html: string } {
  const t = textos(e.tipo, e.idioma, e.banda || (e.idioma === 'en' ? 'Your band' : 'Tu banda'));
  const enlace = `${e.base}/?utm_source=email&utm_medium=lifecycle&utm_campaign=${e.tipo}`;
  const saludo = e.idioma === 'en' ? `Hi ${e.nombre},` : `Hola ${e.nombre},`;
  const baja =
    e.idioma === 'en'
      ? `You get this because you signed up to BandManager.io. <a href="${escapeHtml(urlBaja(e.base, e.userId))}" style="color:#9aa0a6;">Unsubscribe</a>`
      : `Recibes esto porque te registraste en BandManager.io. <a href="${escapeHtml(urlBaja(e.base, e.userId))}" style="color:#9aa0a6;">Darme de baja</a>`;
  const html = `<!DOCTYPE html>
<html lang="${e.idioma}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(t.asunto)}</title></head>
<body style="margin:0;padding:24px;background:#101216;font-family:Arial,Helvetica,sans-serif;color:#e8eaed;">
  <div style="max-width:520px;margin:0 auto;background:#1a1d23;border-radius:12px;padding:32px;">
    <p style="margin:0 0 8px;color:#9aa0a6;">${escapeHtml(saludo)}</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#f2ca50;">${escapeHtml(t.titulo)}</h1>
    <p style="margin:0 0 24px;line-height:1.5;">${escapeHtml(t.cuerpo)}</p>
    <a href="${escapeHtml(enlace)}" style="display:inline-block;background:#f2ca50;color:#101216;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(t.boton)}</a>
  </div>
  <p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#9aa0a6;text-align:center;">${baja}</p>
</body></html>`;
  return { asunto: t.asunto, html };
}

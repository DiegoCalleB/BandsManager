// Aviso interno al responsable de BandManager cuando alguien se registra o entra en la lista de espera.
// Puro (sin red ni BD) para poder probarlo; el envío vive en services/avisoAltas.ts.

import { escapeHtml } from './html.js';

export type TipoAlta = 'registro' | 'espera' | 'espera_confirmada' | 'b2b' | 'pegatinas';

export interface DatosAlta {
  tipo: TipoAlta;
  email: string;
  /** Nombre de la persona o de la banda, si lo hay. */
  nombre?: string;
  /** De dónde llega: «landing», formulario de músicos, etc. */
  origen?: string;
  /** Texto libre que escribe la persona (por ejemplo, qué necesita una empresa). */
  detalle?: string;
}

const TITULO: Record<TipoAlta, string> = {
  registro: 'Nuevo registro en BandManager',
  espera: 'Nueva persona en la lista de espera (pendiente de confirmar)',
  espera_confirmada: 'Lista de espera: email confirmado',
  b2b: 'Nueva consulta de empresa (planes B2B)',
  pegatinas: 'Pedido de pegatinas de regalo (primera suscripción)',
};

/** Destino de los avisos: `ADMIN_NOTIFY_EMAIL` si está definida; si no, el buzón del proyecto. */
export function destinoAvisoAltas(env: NodeJS.ProcessEnv = process.env): string {
  const valor = (env.ADMIN_NOTIFY_EMAIL || '').trim();
  return valor.includes('@') ? valor : 'bandmanager.pro.io@gmail.com';
}

export function correoAvisoAlta(d: DatosAlta): { asunto: string; html: string } {
  const filas: Array<[string, string]> = [['Email', d.email]];
  if (d.nombre) filas.push(['Nombre', d.nombre]);
  if (d.origen) filas.push(['Origen', d.origen]);
  if (d.detalle) filas.push(['Mensaje', d.detalle]);
  filas.push(['Fecha', new Date().toISOString()]);
  const tabla = filas
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(k)}</td><td style="padding:4px 0;"><strong>${escapeHtml(v)}</strong></td></tr>`)
    .join('');
  return {
    asunto: `${TITULO[d.tipo]}: ${d.email}`.replace(/[\r\n]+/g, ' '),
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;"><h2 style="font-size:17px;margin:0 0 12px;">${escapeHtml(TITULO[d.tipo])}</h2><table>${tabla}</table></div>`,
  };
}

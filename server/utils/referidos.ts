/**
 * Insignia «Hecho con BandManager» y referidos entre bandas. Lógica pura, sin I/O.
 *
 * La insignia solo la llevan los planes gratuitos: es el canal de crecimiento del producto (cada
 * dossier, landing de fans y página de concierto compartida enseña la marca) y a la vez una razón
 * para subir de plan. Los planes de pago la quitan.
 */

export type PlanNormalizado = 'promo' | 'promo_plus' | 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel';

/** Planes de «0€ para siempre» (src/utils/planPermissions.ts). Si cambia un precio, cambia aquí. */
const PLANES_GRATUITOS: ReadonlySet<PlanNormalizado> = new Set(['promo', 'promo_plus', 'ensayo']);

export function esPlanGratuito(plan: PlanNormalizado): boolean {
  return PLANES_GRATUITOS.has(plan);
}

export function debeMostrarInsignia(plan: PlanNormalizado): boolean {
  return esPlanGratuito(plan);
}

/* ------------------------------------------------------------------ códigos */

// Sin 0/O/1/I/L: se dicta por teléfono y se lee en una pegatina.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LONGITUD_CODIGO_REFERIDO = 8;

export function generarCodigoReferido(aleatorio: (n: number) => Uint8Array): string {
  const bytes = aleatorio(LONGITUD_CODIGO_REFERIDO);
  let out = '';
  for (let i = 0; i < LONGITUD_CODIGO_REFERIDO; i++) out += ALFABETO[bytes[i] % ALFABETO.length];
  return out;
}

/**
 * Los códigos hexadecimales del relleno inicial de la migración (A-F y 0-9) también son válidos:
 * se aceptan 8 caracteres alfanuméricos en mayúsculas, sea cual sea su origen.
 */
const PATRON_CODIGO_REFERIDO = /^[A-Z0-9]{8}$/;

export function normalizarCodigoReferido(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const c = valor.trim().toUpperCase();
  return PATRON_CODIGO_REFERIDO.test(c) ? c : null;
}

/* ------------------------------------------------------------------ enlaces */

export type OrigenInsignia = 'epk' | 'fans' | 'concierto';

/**
 * Enlace de la insignia: lleva el código de la banda que invita y la procedencia (UTM), para que
 * una banda nueva quede atribuida a quien le enseñó la herramienta y se sepa qué superficie
 * convierte más.
 */
export function urlInsignia(baseUrl: string, codigo: string | null | undefined, origen: OrigenInsignia): string {
  const u = new URL(`${baseUrl.replace(/\/$/, '')}/`);
  const ref = normalizarCodigoReferido(codigo);
  if (ref) u.searchParams.set('ref', ref);
  u.searchParams.set('utm_source', 'insignia');
  u.searchParams.set('utm_medium', origen);
  u.searchParams.set('utm_campaign', 'hecho_con_bandmanager');
  return u.toString();
}

export function urlInvitacion(baseUrl: string, codigo: string): string {
  const u = new URL(`${baseUrl.replace(/\/$/, '')}/`);
  u.searchParams.set('ref', codigo);
  u.searchParams.set('utm_source', 'invitacion');
  u.searchParams.set('utm_medium', 'banda');
  return u.toString();
}

/* ------------------------------------------------------------------ reglas de atribución */

export type DecisionReferido =
  | { ok: true }
  | { ok: false; motivo: 'sin_codigo' | 'codigo_desconocido' | 'auto_referido' | 'ya_referida' };

/**
 * ¿Se le puede atribuir esta alta nueva a la banda dueña del código? No si el código no existe,
 * si es la propia banda y no si ya viene atribuida a otra (la primera atribución manda: no se
 * puede «robar» un referido ni reescribir la historia).
 */
export function decidirReferido(entrada: {
  codigo: string | null;
  bandaDelCodigo: string | null;
  bandaNueva: string;
  referidoPorActual?: string | null;
}): DecisionReferido {
  if (!entrada.codigo) return { ok: false, motivo: 'sin_codigo' };
  if (!entrada.bandaDelCodigo) return { ok: false, motivo: 'codigo_desconocido' };
  if (entrada.referidoPorActual) return { ok: false, motivo: 'ya_referida' };
  if (mismaBandaId(entrada.bandaDelCodigo, entrada.bandaNueva)) return { ok: false, motivo: 'auto_referido' };
  return { ok: true };
}

/** `band-x`, `reg-x` y `x` son la misma banda (AGENTS.md: ids con y sin prefijo conviven en la BD). */
function mismaBandaId(a: string, b: string): boolean {
  const limpia = (v: string) => v.trim().toLowerCase().replace(/^(band|reg)-/, '');
  return limpia(a) === limpia(b);
}

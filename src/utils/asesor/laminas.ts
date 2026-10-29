// Láminas de una pieza: las imágenes listas para subir de unas stories o un carrusel. Lógica pura
// (qué texto va en cada lámina, medidas y tinta); el pintado vive en `renderLaminas.ts`.
//
// Los colores de aquí son de la obra (lo que se sube a Instagram), no de la interfaz: por eso no
// salen de tokens.css, igual que en el motor de Cartelería.

import { contraste, luminancia } from '../cartel/contraste';
import { deHex } from '../cartel/paleta';
import { TINTAS, PALETAS } from '../cartel/render';
import type { Pieza } from './pieza';

export type FormatoLamina = 'stories' | 'carrusel';

export interface MedidasLamina {
  ancho: number;
  alto: number;
  /** Franjas que tapa la interfaz de Instagram (fracción del alto). */
  seguroArriba: number;
  seguroAbajo: number;
}

export const MEDIDAS: Record<FormatoLamina, MedidasLamina> = {
  stories: { ancho: 1080, alto: 1920, seguroArriba: 0.12, seguroAbajo: 0.16 },
  carrusel: { ancho: 1080, alto: 1350, seguroArriba: 0, seguroAbajo: 0 },
};

export interface Lamina {
  /** 1..total */
  numero: number;
  total: number;
  papel: 'portada' | 'paso' | 'cierre';
  texto: string;
}

export const esFormatoLamina = (f: string): f is FormatoLamina => f === 'stories' || f === 'carrusel';

/**
 * Carrusel: portada con el gancho, una lámina por slide y cierre con la llamada a la acción.
 * Stories: una lámina por pantalla (el gancho abre si la IA no dio pantallas).
 * Solo se pinta el texto grande de cada paso: el `detalle` dice qué foto va detrás, no se escribe.
 */
export function laminasDePieza(p: Pieza): Lamina[] {
  if (!esFormatoLamina(p.formato)) return [];
  const pasos = p.pasos.map((x) => x.titulo).filter(Boolean);
  const textos: Array<Pick<Lamina, 'papel' | 'texto'>> =
    p.formato === 'carrusel'
      ? [{ papel: 'portada', texto: p.gancho }, ...pasos.map((texto) => ({ papel: 'paso' as const, texto })), ...(p.cta ? [{ papel: 'cierre' as const, texto: p.cta }] : [])]
      : (pasos.length ? pasos : [p.gancho]).map((texto, i) => ({ papel: i === 0 ? 'portada' as const : 'paso' as const, texto }));
  return textos.map((t, i) => ({ ...t, numero: i + 1, total: textos.length }));
}

export interface DisenoLaminas {
  fondo: string;
  acento: string;
  /** Tinta del texto: la clara o la oscura del cartel, la que más contraste da sobre el fondo. */
  tinta: string;
}

const luzHex = (h: string) => luminancia(...deHex(h));

export function disenoDe(paleta: { fondo: string; acento: string }): DisenoLaminas {
  const lFondo = luzHex(paleta.fondo);
  const tinta = contraste(luzHex(TINTAS.clara), lFondo) >= contraste(luzHex(TINTAS.oscura), lFondo) ? TINTAS.clara : TINTAS.oscura;
  return { ...paleta, tinta };
}

/** Paletas a elegir: «Tus colores» (si hay logo) y las del cartel. */
export interface OpcionPaleta {
  id: string;
  nombre: string;
  fondo: string;
  acento: string;
}

export function opcionesPaleta(deLogo: { fondo: string; acento: string } | null): OpcionPaleta[] {
  const base = PALETAS.map(({ id, nombre, fondo, acento }) => ({ id, nombre, fondo, acento }));
  return deLogo ? [{ id: 'banda', nombre: 'Tus colores', ...deLogo }, ...base] : base;
}

/** Alturas de la Onda de la lámina (0..1), siempre las mismas para el mismo texto. */
export function alturasOnda(semilla: string, n = 24): number[] {
  let h = 2166136261;
  for (const ch of semilla) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Array.from({ length: n }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2654435761) >>> 0;
    // Envolvente de espectro: más alta en el centro, con ruido.
    const centro = 1 - Math.abs(i / (n - 1) - 0.5) * 1.4;
    return Math.max(0.12, Math.min(1, centro * (0.45 + ((h % 1000) / 1000) * 0.55)));
  });
}

export function nombreArchivoLamina(banda: string, formato: FormatoLamina, numero: number): string {
  const limpio = banda.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'banda';
  return `${limpio}-${formato}-${numero}.png`;
}

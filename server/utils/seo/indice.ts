/** Registro de las guías de SEO por idioma. Añadir una guía = añadirla a uno de los ficheros de contenido. */
import { GUIAS_BOOKING } from './guiasBooking.js';
import { GUIAS_BOOKING_EN } from './guiasBookingEn.js';
import { GUIAS_DIRECTO } from './guiasDirecto.js';
import { GUIAS_DIRECTO_EN } from './guiasDirectoEn.js';
import { GUIAS_NEGOCIO } from './guiasNegocio.js';
import { GUIAS_NEGOCIO_EN } from './guiasNegocioEn.js';
import { RUTAS, type IdiomaSeo } from './rutas.js';
import { TEXTOS } from './textos.js';
import type { GuiaSeo, GuiaSeoEn } from './tipos.js';

export const GUIAS: GuiaSeo[] = [...GUIAS_BOOKING, ...GUIAS_DIRECTO, ...GUIAS_NEGOCIO];
export const GUIAS_EN: GuiaSeoEn[] = [...GUIAS_BOOKING_EN, ...GUIAS_DIRECTO_EN, ...GUIAS_NEGOCIO_EN];

const POR_IDIOMA: Record<IdiomaSeo, GuiaSeo[]> = { es: GUIAS, en: GUIAS_EN };
const POR_SLUG: Record<IdiomaSeo, Map<string, GuiaSeo>> = {
  es: new Map(GUIAS.map((g) => [g.slug, g])),
  en: new Map(GUIAS_EN.map((g) => [g.slug, g])),
};
const EN_DE_ES = new Map(GUIAS_EN.map((g) => [g.slugEs, g.slug]));

export function guiasDe(idioma: IdiomaSeo): GuiaSeo[] {
  return POR_IDIOMA[idioma];
}

export function guiaPorSlug(slug: unknown, idioma: IdiomaSeo = 'es'): GuiaSeo | null {
  return typeof slug === 'string' ? (POR_SLUG[idioma].get(slug) ?? null) : null;
}

/** Slug de la misma guía en el otro idioma, o null si no tiene equivalente. */
export function slugEquivalente(slug: string, idioma: IdiomaSeo): string | null {
  if (idioma === 'es') return EN_DE_ES.get(slug) ?? null;
  return (POR_SLUG.en.get(slug) as GuiaSeoEn | undefined)?.slugEs ?? null;
}

/** Destino de un enlace «Sigue leyendo»: otra guía por su slug, o la plantilla de rider. */
export function enlaceDeRelacionada(clave: string, idioma: IdiomaSeo = 'es'): { ruta: string; titulo: string; resumen: string } | null {
  if (clave === RUTAS[idioma].rider) return { ruta: clave, titulo: TEXTOS[idioma].riderTitulo, resumen: TEXTOS[idioma].riderResumen };
  const g = POR_SLUG[idioma].get(clave);
  return g ? { ruta: RUTAS[idioma].guia(g.slug), titulo: g.h1, resumen: g.descripcion } : null;
}

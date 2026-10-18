/** Registro de las guías de SEO. Añadir una guía = añadirla a uno de los ficheros de contenido. */
import { RUTA_PLANTILLA_RIDER } from '../paginaRider.js';
import { GUIAS_BOOKING } from './guiasBooking.js';
import { GUIAS_DIRECTO } from './guiasDirecto.js';
import { GUIAS_NEGOCIO } from './guiasNegocio.js';
import type { GuiaSeo } from './tipos.js';

export const GUIAS: GuiaSeo[] = [...GUIAS_BOOKING, ...GUIAS_DIRECTO, ...GUIAS_NEGOCIO];

const POR_SLUG = new Map(GUIAS.map((g) => [g.slug, g]));

export function guiaPorSlug(slug: unknown): GuiaSeo | null {
  return typeof slug === 'string' ? (POR_SLUG.get(slug) ?? null) : null;
}

/** Destino de un enlace «Sigue leyendo»: otra guía por su slug, o la plantilla de rider. */
export function enlaceDeRelacionada(clave: string): { ruta: string; titulo: string; resumen: string } | null {
  if (clave === RUTA_PLANTILLA_RIDER) return { ruta: clave, titulo: 'Plantilla de rider técnico', resumen: 'Rellénala, imprímela o guárdala en PDF.' };
  const g = POR_SLUG.get(clave);
  return g ? { ruta: `/guias/${g.slug}`, titulo: g.h1, resumen: g.descripcion } : null;
}

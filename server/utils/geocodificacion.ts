/**
 * Coordenadas de una sala a partir del geocodificador de OpenStreetMap (Nominatim, ODbL): reglas puras, sin red.
 *
 * Primero se busca la sala por nombre y ciudad. Solo se acepta el resultado si cae en España y su dirección menciona la
 * ciudad: un nombre corriente («Sala Roja») puede dar una calle de otro pueblo, y un punto equivocado en el mapa es peor
 * que ninguno. Si no aparece, se usa el punto de la ciudad y se marca como aproximado.
 */
import { normalizarTexto } from './salaCatalogo.js';

export interface PuntoGeo {
  lat: number;
  lon: number;
}

export interface ResultadoNominatim {
  lat?: string;
  lon?: string;
  display_name?: string;
  /** `amenity`, `highway`, `boundary`, `place`... Una calle o un municipio no es una sala. */
  class?: string;
}

/** España peninsular, Baleares, Canarias, Ceuta y Melilla. */
const LIMITES = { latMin: 27, latMax: 44.2, lonMin: -18.5, lonMax: 4.6 };

export const enEspana = (p: PuntoGeo): boolean => p.lat >= LIMITES.latMin && p.lat <= LIMITES.latMax && p.lon >= LIMITES.lonMin && p.lon <= LIMITES.lonMax;

const aPunto = (r: ResultadoNominatim | undefined): PuntoGeo | null => {
  if (!r) return null;
  const p = { lat: Number(r.lat), lon: Number(r.lon) };
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) && enEspana(p) ? p : null;
};

const URL_BASE = 'https://nominatim.openstreetmap.org/search';

/** Dirección de la consulta; `limit=3` para poder descartar un primer resultado que no sea un local. */
export function urlNominatim(consulta: string): string {
  return `${URL_BASE}?${new URLSearchParams({ q: consulta, format: 'jsonv2', countrycodes: 'es', limit: '3', addressdetails: '0' })}`;
}

export const consultaDeSala = (s: { nombre: string; ciudad: string | null }): string => [s.nombre, s.ciudad, 'España'].filter(Boolean).join(', ');
export const consultaDeCiudad = (s: { ciudad: string | null; region: string | null }): string | null =>
  s.ciudad ? [s.ciudad, s.region && s.region !== s.ciudad ? s.region : null, 'España'].filter(Boolean).join(', ') : null;

const CLASES_DE_LOCAL = new Set(['amenity', 'building', 'leisure', 'tourism', 'shop', 'craft', 'office']);

/** El punto de la sala si el resultado es un local de esa ciudad; null si no. */
export function puntoDeLaSala(resultados: ResultadoNominatim[], ciudad: string | null): PuntoGeo | null {
  const ciudadN = normalizarTexto(ciudad ?? '');
  for (const r of resultados) {
    if (!r.class || !CLASES_DE_LOCAL.has(r.class)) continue;
    if (ciudadN && !normalizarTexto(r.display_name ?? '').includes(ciudadN)) continue;
    const p = aPunto(r);
    if (p) return p;
  }
  return null;
}

/** El punto de una ciudad (primer resultado que sea un lugar, no un local). */
export function puntoDeLaCiudad(resultados: ResultadoNominatim[]): PuntoGeo | null {
  for (const r of resultados) {
    const p = aPunto(r);
    if (p) return p;
  }
  return null;
}

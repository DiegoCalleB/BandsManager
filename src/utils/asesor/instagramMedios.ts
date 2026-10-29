/**
 * Publicaciones de Instagram de la banda y cuál corresponde a cada pieza del asesor. Lógica pura,
 * compartida entre cliente y servidor: el servidor pide la lista a Graph y aquí solo se sanea y
 * se empareja por día y formato. Las stories no entran: Instagram las retira a las 24 h y a las
 * 48 h de la lección de métricas ya no se pueden leer.
 */
import { diasEntre } from '../campanaConcierto';
import type { Formato } from './reglasFormato';

export interface MedioInstagram {
  id: string;
  permalink: string;
  /** AAAA-MM-DD en hora de Madrid, que es cuando la banda «lo publicó». */
  fecha: string;
  formato: Formato;
  /** Primeras palabras del texto, para reconocerla de un vistazo. */
  resumen: string;
}

export const MAX_CANDIDATOS = 5;
const MAX_RESUMEN = 70;
const ID_MEDIO = /^[0-9]{5,30}$/;

export const esIdMedio = (v: unknown): v is string => typeof v === 'string' && ID_MEDIO.test(v);

/** Cómo llama Instagram a cada cosa, traducido a los formatos del asesor. null si no se puede medir. */
export function formatoDeMedio(productType: unknown, mediaType: unknown): Formato | null {
  if (productType === 'STORY') return null;
  if (productType === 'REELS') return 'reel';
  if (mediaType === 'CAROUSEL_ALBUM') return 'carrusel';
  if (mediaType === 'IMAGE') return 'post';
  if (mediaType === 'VIDEO') return 'reel';
  return null;
}

const FECHA_MADRID = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' });

/** De «2026-10-28T22:30:00+0000» al día en Madrid (23:30 allí, 28; a las 00:30 ya sería 29). */
export function diaEnMadrid(timestamp: unknown): string | null {
  if (typeof timestamp !== 'string') return null;
  // Graph escribe el desfase sin dos puntos («+0000»), que no todos los motores entienden.
  const d = new Date(timestamp.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
  return Number.isNaN(d.getTime()) ? null : FECHA_MADRID.format(d);
}

/** La respuesta de `/{ig-user-id}/media`, saneada: solo lo medible y con ids válidos. */
export function sanearMedios(raw: unknown): MedioInstagram[] {
  const data = (raw as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  const medios: MedioInstagram[] = [];
  for (const m of data as Array<Record<string, unknown>>) {
    const formato = formatoDeMedio(m?.media_product_type, m?.media_type);
    const fecha = diaEnMadrid(m?.timestamp);
    if (!formato || !fecha || !esIdMedio(m.id)) continue;
    const permalink = typeof m.permalink === 'string' && m.permalink.startsWith('https://www.instagram.com/') ? m.permalink : '';
    const texto = typeof m.caption === 'string' ? m.caption.replace(/\s+/g, ' ').trim() : '';
    medios.push({ id: m.id, permalink, fecha, formato, resumen: texto.length > MAX_RESUMEN ? `${texto.slice(0, MAX_RESUMEN - 1)}…` : texto });
  }
  return medios;
}

/**
 * Las publicaciones que pueden ser esta pieza: el mismo día (o el siguiente, por si se subió de
 * noche) y, primero, las del mismo formato. Nunca decide por la banda: son opciones para elegir.
 */
export function candidatos(pieza: { fecha: string; formato: Formato }, medios: MedioInstagram[]): MedioInstagram[] {
  return medios
    .filter((m) => {
      const d = diasEntre(pieza.fecha, m.fecha);
      return d === 0 || d === 1;
    })
    .sort((a, b) => {
      const mismoFormato = Number(b.formato === pieza.formato) - Number(a.formato === pieza.formato);
      return mismoFormato || diasEntre(pieza.fecha, a.fecha) - diasEntre(pieza.fecha, b.fecha);
    })
    .slice(0, MAX_CANDIDATOS);
}

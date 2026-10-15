// Dónde viven los carteles en Supabase Storage y qué URL se acepta como «de un cartel de esta banda».
//
// `cartel_url` sale en la página pública del bolo y como imagen de vista previa (Open Graph): si se
// aceptara cualquier URL, un cliente manipulado podría colgar ahí una imagen ajena o de otra banda.

import { getBucketName } from '../routes/upload.js';

export function carpetaCartel(bandId: string): string {
  return `carteles/${String(bandId || 'sin-banda').replace(/[^a-zA-Z0-9_-]/g, '_')}/`;
}

export function nombreSeguro(id: string): string {
  return String(id || 'x').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

/** Imágenes de referencia de la banda (las que la IA mira para parecerse a ella). */
export function carpetaReferencias(bandId: string): string {
  return `${carpetaCartel(bandId)}ref/`;
}

/**
 * Ruta dentro del bucket (`carteles/{bandId}/…`) de una URL pública de nuestro Supabase Storage, o
 * null si no es de nuestro bucket, no es de la carpeta de carteles de `bandId` o intenta salirse.
 */
export function rutaDeUrlCartel(
  url: string,
  bandId: string,
  supabaseUrl: string | undefined = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  bucket: string = getBucketName()
): string | null {
  if (!supabaseUrl || typeof url !== 'string') return null;
  let u: URL;
  let base: URL;
  try {
    u = new URL(url);
    base = new URL(supabaseUrl);
  } catch {
    return null;
  }
  if (u.protocol !== base.protocol || u.host !== base.host || u.username || u.password) return null;
  let ruta: string;
  try {
    ruta = decodeURIComponent(u.pathname);
  } catch {
    return null;
  }
  if (ruta.includes('..') || ruta.includes('\\')) return null;
  const prefijo = `/storage/v1/object/public/${bucket}/`;
  const dentro = ruta.startsWith(prefijo) ? ruta.slice(prefijo.length) : null;
  return dentro && dentro.startsWith(carpetaCartel(bandId)) ? dentro : null;
}

/** URL pública de Supabase Storage, de nuestro bucket y dentro de la carpeta de carteles de `bandId`. */
export function esUrlDeCartel(
  url: string,
  bandId: string,
  supabaseUrl: string | undefined = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  bucket: string = getBucketName()
): boolean {
  return rutaDeUrlCartel(url, bandId, supabaseUrl, bucket) !== null;
}

/**
 * Ficheros de `ref/` que ya no usa nadie tras un cambio del ADN y se pueden borrar. Solo toca la
 * subcarpeta de referencias subidas: un cartel anterior usado como referencia (`carteles/{banda}/{bolo}.png`)
 * o un fondo de IA favorito NO se borran, porque son otra cosa que la banda sigue teniendo.
 */
export function referenciasHuerfanas(antes: string[], enUso: string[], bandId: string): string[] {
  const usadas = new Set(enUso.map((u) => rutaDeUrlCartel(u, bandId)).filter((r): r is string => !!r));
  const carpeta = carpetaReferencias(bandId);
  return antes
    .map((u) => rutaDeUrlCartel(u, bandId))
    .filter((r): r is string => !!r && r.startsWith(carpeta) && !usadas.has(r));
}

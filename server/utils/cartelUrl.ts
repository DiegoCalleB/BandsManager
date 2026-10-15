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

/** URL pública de Supabase Storage, de nuestro bucket y dentro de la carpeta de carteles de `bandId`. */
export function esUrlDeCartel(
  url: string,
  bandId: string,
  supabaseUrl: string | undefined = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  bucket: string = getBucketName()
): boolean {
  if (!supabaseUrl || typeof url !== 'string') return false;
  let u: URL;
  let base: URL;
  try {
    u = new URL(url);
    base = new URL(supabaseUrl);
  } catch {
    return false;
  }
  if (u.protocol !== base.protocol || u.host !== base.host || u.username || u.password) return false;
  let ruta: string;
  try {
    ruta = decodeURIComponent(u.pathname);
  } catch {
    return false;
  }
  if (ruta.includes('..') || ruta.includes('\\')) return false;
  return ruta.startsWith(`/storage/v1/object/public/${bucket}/${carpetaCartel(bandId)}`);
}

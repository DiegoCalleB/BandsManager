/**
 * Subida a Supabase Storage, en un solo sitio.
 *
 * Vivía duplicado dentro de concert_to_album.ts. Ahora lo usa también el generador de Reels
 * para que el clip renderizado sobreviva a un redeploy de Railway: el disco del contenedor es
 * efímero, así que un .mp4 que solo vive en `public/clips/` desaparece en cada despliegue.
 *
 * Reutiliza el bucket "band-media" que ya existe y ya tiene sus políticas RLS (lo usan
 * server/routes/upload.ts y concert_to_album.ts) — no hace falta crear nada nuevo en Supabase.
 */

import fs from "fs";
import { getSupabaseClient, getBucketName } from "../routes/upload.js";
import { comoErrorCapturado } from '../../src/utils/errorCapturado.js';

/**
 * Sube un fichero local a Supabase Storage y devuelve su URL pública, o null si Supabase no
 * está configurado, el fichero no existe, o la subida falla. Nunca lanza: subir el fichero a
 * almacenamiento permanente es una mejora, no el resultado en sí — si falla, quien llama debe
 * poder seguir sirviendo el fichero desde el disco local exactamente como hacía antes.
 */
export async function uploadToSupabaseIfAvailable(
  localFilePath: string,
  storageSubPath: string,
  contentType: string = "audio/mpeg"
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !fs.existsSync(localFilePath)) return null;

  try {
    const bucketName = getBucketName();
    const fileBuffer = fs.readFileSync(localFilePath);
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storageSubPath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn('[Supabase Upload Notice] Failed for %s:', storageSubPath, uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageSubPath);

    if (publicUrlData?.publicUrl) {
      console.log('[Supabase Storage] Successfully uploaded: %s -> %s', storageSubPath, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.warn('[Supabase Storage Error] %s:', storageSubPath, err.message || err);
  }
  return null;
}

/**
 * Sube un Buffer en memoria directamente a Supabase Storage y devuelve su URL pública.
 * Evita tener que escribir en disco temporal cuando se descargan streams remotos.
 */
export async function uploadBufferToSupabase(
  buffer: Buffer,
  storageSubPath: string,
  contentType: string = "audio/wav"
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !buffer || buffer.length === 0) return null;

  try {
    const bucketName = getBucketName();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storageSubPath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn('[Supabase Buffer Upload Notice] Failed for %s:', storageSubPath, uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageSubPath);

    if (publicUrlData?.publicUrl) {
      console.log('[Supabase Storage] Stem uploaded directly to permanent storage: %s -> %s', storageSubPath, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    }
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.warn('[Supabase Storage Buffer Error] %s:', storageSubPath, err.message || err);
  }
  return null;
}

/**
 * Genera la ruta aislada por banda y canción para almacenar stems separados de forma permanente.
 */
export function rutaAlmacenamientoStem(bandId: string, stemName: string, songHash: string): string {
  const bandaLimpia = String(bandId || "sin-banda").replace(/[^a-zA-Z0-9_-]/g, "_");
  const hashLimpio = String(songHash || "general").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 16);
  const stemLimpio = String(stemName || "stem").replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `bandas/${bandaLimpia}/stems/${hashLimpio}/${stemLimpio}`;
}

/**
 * Ruta dentro del bucket para un clip de Reels, con la banda como carpeta: así los ficheros de
 * una banda no pisan los de otra, y es fácil borrar los de una banda entera si hiciera falta.
 * Solo se admiten caracteres seguros para no acabar escribiendo fuera de esa carpeta.
 */
export function rutaAlmacenamientoClip(bandId: string, nombreArchivo: string): string {
  const bandaLimpia = String(bandId || "sin-banda").replace(/[^a-zA-Z0-9_-]/g, "_");
  const archivoLimpio = String(nombreArchivo || "clip.mp4").replace(/[^a-zA-Z0-9_.-]/g, "_");
  return `reels/${bandaLimpia}/${archivoLimpio}`;
}

/**
 * Lee un fichero de nuestro bucket por su ruta (sin pasar por la red pública: no hay URL que
 * validar contra SSRF). `maxBytes` corta ficheros enormes. null si no existe, falla o no cabe.
 */
export async function descargarDeAlmacenamiento(ruta: string, maxBytes = 5 * 1024 * 1024): Promise<Buffer | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(getBucketName()).download(ruta);
    if (error || !data) {
      console.warn('[Supabase Storage] No se pudo leer %s:', ruta, error?.message);
      return null;
    }
    if (data.size > maxBytes) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch (errCapturado) {
    console.warn('[Supabase Storage Error] leyendo %s:', ruta, comoErrorCapturado(errCapturado).message);
    return null;
  }
}

/** Borra ficheros de nuestro bucket. Nunca lanza: un huérfano no debe romper la petición. */
export async function borrarDeAlmacenamiento(rutas: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || rutas.length === 0) return;
  try {
    const { error } = await supabase.storage.from(getBucketName()).remove(rutas);
    if (error) console.warn('[Supabase Storage] No se pudo borrar:', error.message);
  } catch (errCapturado) {
    console.warn('[Supabase Storage Error] borrando:', comoErrorCapturado(errCapturado).message);
  }
}

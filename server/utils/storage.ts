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

// Archivos que son públicos por diseño (no necesitan signed URL)
const PUBLIC_FILE_PATTERNS = [
  /^epk\/.*\/logo\./,           // Logos públicos de EPK
  /^bandas\/.*\/cover\./,       // Portadas de canciones
  /^fans\/.*\/avatar\./         // Avatares de fans
];

// Archivos que deben estar protegidos (stems, EPK privado, etc.)
const PRIVATE_FILE_PATTERNS = [
  /^stems\//,                   // Stems isolados
  /^epk\/.*\/(guide|specs)\./,  // Rider técnico privado
  /^audio\//,                   // Audio sin procesar
  /^rehearsals\//               // Grabaciones de ensayos
];

/**
 * Determina si un archivo debe tener URL firmada (privada) o pública.
 */
function isPrivateFile(storageSubPath: string): boolean {
  return PRIVATE_FILE_PATTERNS.some(pattern => pattern.test(storageSubPath));
}

/**
 * Sanitiza URLs para logs: oculta el proyecto Supabase y estructura interna.
 */
function sanitizeUrlForLogging(url: string | null): string {
  if (!url) return "N/A";
  try {
    const urlObj = new URL(url);
    return `[${urlObj.pathname.split('/').pop()}] (signed URL)`;
  } catch {
    return "[secure URL]";
  }
}

/**
 * Sube un fichero local a Supabase Storage y devuelve su URL (pública o firmada según tipo).
 * Para archivos privados: URL firmada con vencimiento 1 hora.
 * Para archivos públicos: URL pública (sin exposición de estructura Supabase).
 * Nunca lanza: subir es una mejora, no el resultado en sí.
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
      console.warn(`[Supabase Upload Notice] Failed for file ${storageSubPath.split('/').pop()}`);
      return null;
    }

    let url: string | null = null;

    if (isPrivateFile(storageSubPath)) {
      // Archivos privados: URL firmada, válida 1 hora
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storageSubPath, 3600); // 1 hora

      if (error) {
        console.warn(`[Supabase Signed URL Error] for ${storageSubPath.split('/').pop()}`);
        return null;
      }
      url = data?.signedUrl || null;
    } else {
      // Archivos públicos: URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storageSubPath);
      url = publicUrlData?.publicUrl || null;
    }

    if (url) {
      console.log(`[Supabase Storage] Successfully uploaded: ${sanitizeUrlForLogging(url)}`);
      return url;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage Error]`, err.message || err);
  }
  return null;
}

/**
 * Sube un Buffer en memoria a Supabase Storage y devuelve su URL (pública o firmada).
 * Igual que uploadToSupabaseIfAvailable pero para streams/buffers sin escribir en disco.
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
      console.warn(`[Supabase Buffer Upload Notice] Failed for ${storageSubPath.split('/').pop()}`);
      return null;
    }

    let url: string | null = null;

    if (isPrivateFile(storageSubPath)) {
      // Archivos privados: URL firmada, válida 1 hora
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storageSubPath, 3600);

      if (error) {
        console.warn(`[Supabase Signed URL Error] for ${storageSubPath.split('/').pop()}`);
        return null;
      }
      url = data?.signedUrl || null;
    } else {
      // Archivos públicos: URL pública
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storageSubPath);
      url = publicUrlData?.publicUrl || null;
    }

    if (url) {
      console.log(`[Supabase Storage] Buffer upload successful: ${sanitizeUrlForLogging(url)}`);
      return url;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage Buffer Error]`, err.message || err);
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

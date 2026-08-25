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
      console.warn(`[Supabase Upload Notice] Failed for ${storageSubPath}:`, uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storageSubPath);

    if (publicUrlData?.publicUrl) {
      console.log(`[Supabase Storage] Successfully uploaded: ${storageSubPath} -> ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (err: any) {
    console.warn(`[Supabase Storage Error] ${storageSubPath}:`, err.message || err);
  }
  return null;
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

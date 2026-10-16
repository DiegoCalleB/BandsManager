// Imágenes de referencia de la banda para la IA: se leen de SU carpeta de nuestro almacenamiento
// (nunca de una URL cualquiera), se comprueba que son JPEG o PNG de verdad y se pasan a Gemini en
// base64. La URL llega ya saneada desde el ADN guardado, pero se vuelve a validar aquí: es la última
// línea antes de leer un fichero.

import { rutaDeUrlCartel } from '../utils/cartelUrl.js';
import { descargarDeAlmacenamiento } from '../utils/storage.js';
import { MAX_REFERENCIAS } from '../../src/utils/cartel/adn.js';

export interface ImagenReferencia {
  mimeType: 'image/jpeg' | 'image/png';
  /** base64, como lo pide inlineData. */
  data: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/** Tipo real por la firma del fichero (no por su extensión ni por lo que diga el cliente). */
export function tipoDeImagen(buf: Buffer): ImagenReferencia['mimeType'] | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  return null;
}

export async function cargarReferencias(
  bandId: string,
  urls: string[],
  leer: (ruta: string, maxBytes: number) => Promise<Buffer | null> = descargarDeAlmacenamiento
): Promise<ImagenReferencia[]> {
  const fuera: ImagenReferencia[] = [];
  for (const url of urls.slice(0, MAX_REFERENCIAS)) {
    const ruta = rutaDeUrlCartel(url, bandId);
    if (!ruta) continue;
    const buf = await leer(ruta, MAX_BYTES);
    const mimeType = buf && tipoDeImagen(buf);
    // Una referencia que falta o no es una imagen no debe tumbar la generación: se salta.
    if (!buf || !mimeType) continue;
    fuera.push({ mimeType, data: buf.toString('base64') });
  }
  return fuera;
}

// Genera el fondo de un cartel con el modelo de imagen de Gemini y lo guarda en Supabase Storage.
// Devuelve null si no hay IA o el modelo no devolvió imagen: quien llama decide qué decirle a la persona.

import { randomUUID } from 'crypto';
import { getAiClient, TIMEOUT_IA_LARGO_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { uploadBufferToSupabase } from '../utils/storage.js';
import { elegirMejorVariante, type VarianteFondo } from './juezCartel.js';
import { isSpendCapOrQuotaError } from '../ai.js';
import { costeImagenEur, type EncuadreFondo, type TextosCartel } from '../utils/promptCartel.js';
import { carpetaCartel } from '../utils/cartelUrl.js';
import { PREFIJO_FONDO_CON_TEXTO, fondoConTexto } from '../../src/utils/cartel/fondoIa.js';
import type { ImagenReferencia } from './referenciasCartel.js';

export const MODELO_IMAGEN_BASE = 'gemini-2.5-flash-image';
export const MODELO_IMAGEN_PRO = 'gemini-3-pro-image-preview';
/** Modelo principal. Se puede bajar al barato con CARTEL_MODELO_IMAGEN sin tocar código. */
export const MODELO_IMAGEN = process.env.CARTEL_MODELO_IMAGEN || MODELO_IMAGEN_PRO;
/** Variantes por cartel; un juez elige la mejor. 1 = sin juez. */
export const VARIANTES_FONDO = Math.min(4, Math.max(1, Number(process.env.CARTEL_VARIANTES) || 3));
/**
 * Tamaño de la imagen del modelo Pro (`1K`, `2K` o `4K`; vacío = el del modelo, 1K). 2K cuesta lo mismo que 1K pero pesa
 * más (varios MB por fondo) y se ve nítido en el A4 de imprenta. Apagado hasta probarlo con la clave real.
 */
export const TAMANO_IMAGEN = ['1K', '2K', '4K'].includes(process.env.CARTEL_TAMANO_IMAGEN ?? '') ? process.env.CARTEL_TAMANO_IMAGEN : undefined;
/** Proporción del fondo de IA: apaisada si va en una ventana del papel, vertical si ocupa todo el cartel. */
export const RELACION_FONDO = '4:3';
export const RELACION_FONDO_SANGRE = '3:4';

/** Cada fondo de IA en su propio fichero: el historial del bolo los conserva para no repagarlos. */
export function rutaFondoIa(bandId: string, conTexto = false): string {
  // `ia-t-`: la ilustración ya lleva el título y la fecha dibujados; el cliente no pinta los suyos encima.
  return `${carpetaCartel(bandId)}${conTexto ? PREFIJO_FONDO_CON_TEXTO : 'ia-'}${randomUUID()}.png`;
}

export { fondoConTexto };

/** Texto solo, o texto + las imágenes de referencia de la banda como partes de la misma petición. */
export function contenidoDeFondo(prompt: string, referencias: ImagenReferencia[]) {
  if (referencias.length === 0) return prompt;
  return [{ role: 'user', parts: [{ text: prompt }, ...referencias.map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } }))] }];
}

async function unaVariante(bandId: string, modelo: string, prompt: string, referencias: ImagenReferencia[], relacion: string): Promise<VarianteFondo | null> {
  const client = getAiClient();
  if (!client) return null;
  const respuesta = await client.models.generateContent({
    model: modelo,
    contents: contenidoDeFondo(prompt, referencias),
    config: {
      responseModalities: ['IMAGE'],
      // Apaisada: el cliente la encaja ENTERA en la ventana del cartel (entre las placas del texto), así que
      // un solo fondo pagado sirve para feed, historia e impresión. Pedir «deja sitio arriba y abajo» en un
      // lienzo vertical no funciona: un modelo de imagen no mide porcentajes y la ilustración salía cortada.
      imageConfig: { aspectRatio: relacion, ...(TAMANO_IMAGEN && modelo !== MODELO_IMAGEN_BASE ? { imageSize: TAMANO_IMAGEN } : {}) },
      abortSignal: AbortSignal.timeout(TIMEOUT_IA_LARGO_MS),
    },
  });
  const parte = respuesta.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!parte?.inlineData?.data) return null;

  // Se apunta el consumo aunque luego falle la subida: la imagen ya se cobró.
  dbRecordAiUsage({
    bandId,
    promptTokens: respuesta.usageMetadata?.promptTokenCount || 0,
    completionTokens: respuesta.usageMetadata?.candidatesTokenCount || 0,
    modelName: modelo,
    estimatedCostEur: costeImagenEur(modelo !== MODELO_IMAGEN_BASE),
  }).catch((err) => console.warn('[Cartel] No se pudo registrar el consumo de IA:', err?.message || err));
  return { mimeType: parte.inlineData.mimeType || 'image/png', data: parte.inlineData.data };
}

/** Pide `n` variantes en paralelo y se queda con las que salieron; si todas fallan, relanza el primer error. */
async function variantes(bandId: string, modelo: string, prompt: string, referencias: ImagenReferencia[], n: number, relacion: string) {
  const r = await Promise.allSettled(Array.from({ length: n }, () => unaVariante(bandId, modelo, prompt, referencias, relacion)));
  const ok = r.flatMap((x) => (x.status === 'fulfilled' && x.value ? [x.value] : []));
  if (ok.length > 0) return ok;
  const fallo = r.find((x): x is PromiseRejectedResult => x.status === 'rejected');
  if (fallo) throw fallo.reason;
  return ok;
}

/** Pide imágenes con el modelo principal y, si no está disponible (no por cupo), con el básico. */
async function pedirImagenes(bandId: string, prompt: string, referencias: ImagenReferencia[], n: number, relacion: string): Promise<VarianteFondo[]> {
  try {
    return await variantes(bandId, MODELO_IMAGEN, prompt, referencias, n, relacion);
  } catch (e) {
    // Sin cupo se avisa tal cual; si es el modelo caro el que no está disponible, se cae al barato.
    if (isSpendCapOrQuotaError(e) || MODELO_IMAGEN === MODELO_IMAGEN_BASE) throw e;
    console.warn('[Cartel] Modelo de imagen principal no disponible, se usa el básico:', (e as Error)?.message || e);
    return variantes(bandId, MODELO_IMAGEN_BASE, prompt, referencias, n, relacion);
  }
}

export async function generarFondoCartel(bandId: string, prompt: string, referencias: ImagenReferencia[] = [], encuadre: EncuadreFondo = 'ventana', textos: TextosCartel | null = null): Promise<{ url: string; textoOk: boolean } | null> {
  const relacion = encuadre === 'sangre' ? RELACION_FONDO_SANGRE : RELACION_FONDO;
  if (!getAiClient()) return null;

  const candidatas = await pedirImagenes(bandId, prompt, referencias, VARIANTES_FONDO, relacion);
  if (candidatas.length === 0) return null;

  const veredicto = await elegirMejorVariante(bandId, candidatas, textos);
  const mejor = candidatas[veredicto.indice];
  const url = await uploadBufferToSupabase(Buffer.from(mejor.data, 'base64'), rutaFondoIa(bandId, !!textos), 'image/png');
  return url ? { url, textoOk: textos ? veredicto.textoOk : true } : null;
}

/** Proporción más cercana de las que el modelo acepta para un fondo (vertical a sangre o apaisado en ventana). */
export const relacionDe = (ancho: number, alto: number) => (alto > ancho * 1.1 ? RELACION_FONDO_SANGRE : RELACION_FONDO);

/**
 * Retoca un fondo ya hecho: UNA imagen nueva (sin variantes, la persona decide) a partir de la actual. Si lleva
 * las letras dibujadas, el juez las lee otra vez para avisar si el retoque las ha estropeado.
 */
export async function retocarFondoCartel(
  bandId: string,
  prompt: string,
  original: ImagenReferencia,
  relacion: string,
  textos: TextosCartel | null
): Promise<{ url: string; textoOk: boolean } | null> {
  if (!getAiClient()) return null;
  const [retocada] = await pedirImagenes(bandId, prompt, [original], 1, relacion);
  if (!retocada) return null;
  const veredicto = textos ? await elegirMejorVariante(bandId, [retocada], textos) : null;
  const url = await uploadBufferToSupabase(Buffer.from(retocada.data, 'base64'), rutaFondoIa(bandId, !!textos), 'image/png');
  return url ? { url, textoOk: veredicto ? veredicto.textoOk : true } : null;
}

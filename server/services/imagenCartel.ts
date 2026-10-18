// Genera el fondo de un cartel con el modelo de imagen de Gemini y lo guarda en Supabase Storage.
// Devuelve null si no hay IA o el modelo no devolvió imagen: quien llama decide qué decirle a la persona.

import { randomUUID } from 'crypto';
import { getAiClient, TIMEOUT_IA_LARGO_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { uploadBufferToSupabase } from '../utils/storage.js';
import { elegirMejorVariante, type VarianteFondo } from './juezCartel.js';
import { isSpendCapOrQuotaError } from '../ai.js';
import { costeImagenEur } from '../utils/promptCartel.js';
import { carpetaCartel } from '../utils/cartelUrl.js';
import type { ImagenReferencia } from './referenciasCartel.js';

export const MODELO_IMAGEN_BASE = 'gemini-2.5-flash-image';
export const MODELO_IMAGEN_PRO = 'gemini-3-pro-image-preview';
/** Modelo principal. Se puede bajar al barato con CARTEL_MODELO_IMAGEN sin tocar código. */
export const MODELO_IMAGEN = process.env.CARTEL_MODELO_IMAGEN || MODELO_IMAGEN_PRO;
/** Variantes por cartel; un juez elige la mejor. 1 = sin juez. */
export const VARIANTES_FONDO = Math.min(4, Math.max(1, Number(process.env.CARTEL_VARIANTES) || 3));
/** Proporción del fondo de IA. */
export const RELACION_FONDO = '4:3';

/** Cada fondo de IA en su propio fichero: el historial del bolo los conserva para no repagarlos. */
export function rutaFondoIa(bandId: string): string {
  return `${carpetaCartel(bandId)}ia-${randomUUID()}.png`;
}

/** Texto solo, o texto + las imágenes de referencia de la banda como partes de la misma petición. */
export function contenidoDeFondo(prompt: string, referencias: ImagenReferencia[]) {
  if (referencias.length === 0) return prompt;
  return [{ role: 'user', parts: [{ text: prompt }, ...referencias.map((r) => ({ inlineData: { mimeType: r.mimeType, data: r.data } }))] }];
}

async function unaVariante(bandId: string, modelo: string, prompt: string, referencias: ImagenReferencia[]): Promise<VarianteFondo | null> {
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
      imageConfig: { aspectRatio: RELACION_FONDO },
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
async function variantes(bandId: string, modelo: string, prompt: string, referencias: ImagenReferencia[], n: number) {
  const r = await Promise.allSettled(Array.from({ length: n }, () => unaVariante(bandId, modelo, prompt, referencias)));
  const ok = r.flatMap((x) => (x.status === 'fulfilled' && x.value ? [x.value] : []));
  if (ok.length > 0) return ok;
  const fallo = r.find((x): x is PromiseRejectedResult => x.status === 'rejected');
  if (fallo) throw fallo.reason;
  return ok;
}

export async function generarFondoCartel(bandId: string, prompt: string, referencias: ImagenReferencia[] = []): Promise<string | null> {
  if (!getAiClient()) return null;

  let candidatas: VarianteFondo[];
  try {
    candidatas = await variantes(bandId, MODELO_IMAGEN, prompt, referencias, VARIANTES_FONDO);
  } catch (e) {
    // Sin cupo se avisa tal cual; si es el modelo caro el que no está disponible, se cae al barato.
    if (isSpendCapOrQuotaError(e) || MODELO_IMAGEN === MODELO_IMAGEN_BASE) throw e;
    console.warn('[Cartel] Modelo de imagen principal no disponible, se usa el básico:', (e as Error)?.message || e);
    candidatas = await variantes(bandId, MODELO_IMAGEN_BASE, prompt, referencias, VARIANTES_FONDO);
  }
  if (candidatas.length === 0) return null;

  const mejor = candidatas[await elegirMejorVariante(bandId, candidatas)];
  return uploadBufferToSupabase(Buffer.from(mejor.data, 'base64'), rutaFondoIa(bandId), 'image/png');
}

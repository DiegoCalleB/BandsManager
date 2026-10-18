// Genera el fondo de un cartel con el modelo de imagen de Gemini y lo guarda en Supabase Storage.
// Devuelve null si no hay IA o el modelo no devolvió imagen: quien llama decide qué decirle a la persona.

import { randomUUID } from 'crypto';
import { getAiClient, TIMEOUT_IA_LARGO_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { uploadBufferToSupabase } from '../utils/storage.js';
import { costeImagenEur } from '../utils/promptCartel.js';
import { carpetaCartel } from '../utils/cartelUrl.js';
import type { ImagenReferencia } from './referenciasCartel.js';

export const MODELO_IMAGEN = 'gemini-2.5-flash-image';
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

export async function generarFondoCartel(bandId: string, prompt: string, referencias: ImagenReferencia[] = []): Promise<string | null> {
  const client = getAiClient();
  if (!client) return null;

  const respuesta = await client.models.generateContent({
    model: MODELO_IMAGEN,
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
  const base64 = parte?.inlineData?.data;
  if (!base64) return null;

  // Se apunta el consumo aunque luego falle la subida: la imagen ya se cobró.
  dbRecordAiUsage({
    bandId,
    promptTokens: respuesta.usageMetadata?.promptTokenCount || 0,
    completionTokens: respuesta.usageMetadata?.candidatesTokenCount || 0,
    modelName: MODELO_IMAGEN,
    estimatedCostEur: costeImagenEur(),
  }).catch((err) => console.warn('[Cartel] No se pudo registrar el consumo de IA:', err?.message || err));

  return uploadBufferToSupabase(Buffer.from(base64, 'base64'), rutaFondoIa(bandId), 'image/png');
}

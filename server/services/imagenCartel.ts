// Genera el fondo de un cartel con el modelo de imagen de Gemini y lo guarda en Supabase Storage.
// Devuelve null si no hay IA o el modelo no devolvió imagen: quien llama decide qué decirle a la persona.

import { randomUUID } from 'crypto';
import { getAiClient, TIMEOUT_IA_LARGO_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { uploadBufferToSupabase } from '../utils/storage.js';
import { costeImagenEur } from '../utils/promptCartel.js';

export const MODELO_IMAGEN = 'gemini-2.5-flash-image';

export function rutaCartel(bandId: string): string {
  const banda = String(bandId || 'sin-banda').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `carteles/${banda}/${randomUUID()}.png`;
}

export async function generarFondoCartel(bandId: string, prompt: string): Promise<string | null> {
  const client = getAiClient();
  if (!client) return null;

  const respuesta = await client.models.generateContent({
    model: MODELO_IMAGEN,
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '4:5' },
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

  return uploadBufferToSupabase(Buffer.from(base64, 'base64'), rutaCartel(bandId), 'image/png');
}

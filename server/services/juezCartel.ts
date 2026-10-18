// Juez de carteles: mira las variantes del fondo y elige la que mejor encaja en un cartel impreso.
// Si el juez falla (sin cupo, respuesta rara), se usa la primera: elegir mal es mejor que no entregar nada.

import { getAiClient, GEMINI_MODEL, TIMEOUT_IA_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { costEurFromTokens } from '../ai.js';

export interface VarianteFondo {
  mimeType: string;
  data: string;
}

const CRITERIO = [
  'You are a veteran poster art director with 30 years designing gig posters for rock, indie, jazz and festival bills.',
  'You receive several candidate illustrations for ONE concert poster, numbered from 0 in the order given.',
  'Pick the single best one. Reward: one strong focal idea, confident printed-look craft (flat inks, texture, restrained palette), the whole subject complete and uncropped, a clean paper-coloured border, and no lettering.',
  'Penalise: AI gloss, plastic smoothness, glow, symmetrical epic clichés, emblems/badges, clip-art icons, cropped or melted subjects, any text or watermark.',
  'Answer ONLY with JSON: {"best": <index>}.',
].join('\n');

/** Índice de la variante ganadora. */
export async function elegirMejorVariante(bandId: string, variantes: VarianteFondo[]): Promise<number> {
  if (variantes.length <= 1) return 0;
  const client = getAiClient();
  if (!client) return 0;
  try {
    const respuesta = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: CRITERIO },
            ...variantes.flatMap((v, i) => [{ text: `Candidate ${i}:` }, { inlineData: { mimeType: v.mimeType, data: v.data } }]),
          ],
        },
      ],
      config: { responseMimeType: 'application/json', abortSignal: AbortSignal.timeout(TIMEOUT_IA_MS) },
    });
    const uso = respuesta.usageMetadata;
    dbRecordAiUsage({
      bandId,
      promptTokens: uso?.promptTokenCount || 0,
      completionTokens: uso?.candidatesTokenCount || 0,
      modelName: GEMINI_MODEL,
      estimatedCostEur: costEurFromTokens('gemini', uso?.promptTokenCount || 0, uso?.candidatesTokenCount || 0),
    }).catch((err) => console.warn('[cartel] No se pudo registrar el consumo del juez:', err?.message || err));
    const parsed = JSON.parse(respuesta.text || '{}') as { best?: unknown };
    const i = Number(parsed.best);
    return Number.isInteger(i) && i >= 0 && i < variantes.length ? i : 0;
  } catch (e) {
    console.warn('[cartel] El juez de variantes falló, se usa la primera:', (e as Error)?.message || e);
    return 0;
  }
}

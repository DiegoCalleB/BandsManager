// Juez de carteles: mira las variantes del fondo y elige la que mejor encaja en un cartel impreso.
// Si el juez falla (sin cupo, respuesta rara), se usa la primera: elegir mal es mejor que no entregar nada.

import { getAiClient, GEMINI_MODEL, TIMEOUT_IA_MS } from '../ai.js';
import { dbRecordAiUsage } from '../db/aiLedger.js';
import { costEurFromTokens } from '../ai.js';
import type { TextosCartel } from '../utils/promptCartel.js';

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

export interface Veredicto {
  indice: number;
  /** Solo si había textos que comprobar: la variante elegida los lleva escritos exactamente. */
  textoOk: boolean;
}

const CRITERIO_TEXTO = (t: TextosCartel) =>
  [
    'The poster must contain EXACTLY these three texts and nothing else written:',
    `1) "${t.nombre}"  2) "${t.fecha}"  3) "${t.lugar}"`,
    'For every candidate, read the lettering and decide text_ok = true only if all three texts are present and every character matches exactly (accents, capitals, digits) and no other words, numbers or small print appear. Prefer a candidate with text_ok = true over any better-looking one with a spelling error.',
    'Answer ONLY with JSON: {"best": <index>, "text_ok": [<boolean per candidate, in order>]}.',
  ].join('\n');

/** Variante ganadora; con textos, además dice si lleva las letras bien escritas. */
export async function elegirMejorVariante(bandId: string, variantes: VarianteFondo[], textos?: TextosCartel | null): Promise<Veredicto> {
  const sinJuez: Veredicto = { indice: 0, textoOk: false };
  // Con textos hay que leerlos aunque solo haya una variante: la persona debe saber si salieron bien.
  if (variantes.length <= 1 && !textos) return { indice: 0, textoOk: !textos };
  const client = getAiClient();
  if (!client) return sinJuez;
  try {
    const respuesta = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: textos ? `${CRITERIO.replace(/Answer ONLY with JSON: .*$/m, '')}\n${CRITERIO_TEXTO(textos)}` : CRITERIO },
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
    const parsed = JSON.parse(respuesta.text || '{}') as { best?: unknown; text_ok?: unknown };
    const oks = Array.isArray(parsed.text_ok) ? parsed.text_ok.map((v) => v === true) : [];
    let i = Number(parsed.best);
    if (!Number.isInteger(i) || i < 0 || i >= variantes.length) i = 0;
    if (textos) {
      // Si la elegida tiene una falta pero otra está bien escrita, gana la que está bien escrita.
      if (!oks[i]) {
        const buena = oks.findIndex(Boolean);
        if (buena >= 0 && buena < variantes.length) i = buena;
      }
      return { indice: i, textoOk: oks[i] === true };
    }
    return { indice: i, textoOk: true };
  } catch (e) {
    console.warn('[cartel] El juez de variantes falló, se usa la primera:', (e as Error)?.message || e);
    return sinJuez;
  }
}

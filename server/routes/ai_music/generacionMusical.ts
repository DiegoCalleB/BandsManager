/**
 * Generación de música con Lyria (Gemini) y MusicGen (Replicate).
 */
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { uploadBufferToSupabase, rutaAlmacenamientoStem } from '../../utils/storage.js';
import { ensurePublicAudioUrl } from './audioPublico.js';
import { fetchReplicateWithRetry } from './diagnosticos.js';
import { comoErrorCapturado } from '../../../src/utils/errorCapturado.js';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Endpoint para Generar Pista de Instrumento con IA (AI Custom Instrument Track Generator)
 * Permite a la banda solicitar un nuevo arreglo musical para un instrumento concreto (ej. Guitarra Solista,
 * Bajo, Sintetizador, Violín, Percusión, etc.) en perfecta armonía con el BPM y Tonalidad de la canción.
 */
/**
 * Llama a un modelo Lyria una vez y extrae audio/texto del stream. Los modelos "preview" a veces
 * responden con éxito (sin lanzar excepción) pero sin ningún part de audio en el stream — un fallo
 * silencioso que antes no dejaba ningún rastro en los logs. Aquí capturamos finishReason/
 * blockReason del propio stream para tener diagnóstico real la próxima vez que pase.
 */
async function callLyriaOnce(
  model: string,
  prompt: string
): Promise<{
  audioBase64: string;
  mimeType: string;
  arrangementNotes: string;
  diagnostics: string;
}> {
  let audioBase64 = '';
  let mimeType = 'audio/wav';
  let arrangementNotes = '';
  let finishReason = '';
  let blockReason = '';

  const lyriaResponse = await ai.models.generateContentStream({
    model,
    contents: prompt,
  });
  for await (const chunk of lyriaResponse) {
    const promptFeedback = (chunk as any).promptFeedback;
    if (promptFeedback?.blockReason)
      blockReason = String(promptFeedback.blockReason);
    const candidate = chunk.candidates?.[0];
    if ((candidate as any)?.finishReason)
      finishReason = String((candidate as any).finishReason);
    const parts = candidate?.content?.parts;
    if (!parts) continue;
    for (const part of parts) {
      if (part.inlineData?.data) {
        if (!audioBase64 && part.inlineData.mimeType)
          mimeType = part.inlineData.mimeType;
        audioBase64 += part.inlineData.data;
      }
      if (part.text && !arrangementNotes) arrangementNotes = part.text;
    }
  }

  const diagnostics =
    [
      blockReason && `blockReason=${blockReason}`,
      finishReason && `finishReason=${finishReason}`,
    ]
      .filter(Boolean)
      .join(' ') || 'sin diagnóstico del stream';

  return { audioBase64, mimeType, arrangementNotes, diagnostics };
}

/** Reintenta un modelo Lyria hasta maxAttempts veces cuando responde sin lanzar error pero sin
 *  audio — la flakiness observada en producción (Lyria "preview" a veces no devuelve el part de
 *  audio a la primera). Lanza si ningún intento trae audio, con el último diagnóstico capturado. */
export async function callLyriaWithRetries(
  model: string,
  prompt: string,
  maxAttempts = 2
) {
  let lastDiagnostics = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await callLyriaOnce(model, prompt);
    if (result.audioBase64) return result;
    lastDiagnostics = result.diagnostics;
    console.warn(
      `[Lyria ${model}] Intento ${attempt}/${maxAttempts} sin audio devuelto (${result.diagnostics}).`
    );
  }
  throw new Error(
    `Lyria ${model} no devolvió audio tras ${maxAttempts} intentos (${lastDiagnostics}).`
  );
}

/**
 * Genera una pista de acompañamiento con MusicGen (Meta, vía Replicate) CONDICIONADA al audio
 * real de la canción — a diferencia de Lyria (que solo recibe texto), este modelo escucha la
 * melodía/acordes/ritmo del audio de referencia y genera algo pensado para encajar con ESA
 * canción concreta, no una composición genérica adivinada desde una descripción. Esto es lo que
 * hace posible el "encaja a la perfección" tipo Moisés que Lyria nunca pudo dar.
 */
export async function generateMusicGenTrack(
  sourceAudioUrl: string,
  instrument: string,
  genreLabel: string,
  bpm: number,
  key: string,
  bandId: string,
  songHash: string,
  requestHost: string | undefined,
  overrideToken?: string
): Promise<{ audioUrl?: string; error?: string }> {
  const rawToken =
    overrideToken ||
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    '';
  const token = rawToken
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^(Token|Bearer)\s+/i, '');
  if (!token) {
    return {
      error: 'No se encontró REPLICATE_API_TOKEN en el entorno del servidor.',
    };
  }

  const effectiveHash =
    songHash ||
    crypto
      .createHash('md5')
      .update(sourceAudioUrl)
      .digest('hex')
      .substring(0, 10);
  let resolvedAudioUrl: string;
  try {
    resolvedAudioUrl = await ensurePublicAudioUrl(
      sourceAudioUrl,
      bandId,
      effectiveHash,
      requestHost
    );
  } catch (resolveErrCapturado) {
    const resolveErr = comoErrorCapturado(resolveErrCapturado);
    return {
      error: `No se pudo preparar el audio de referencia: ${resolveErr?.message || resolveErr}`,
    };
  }

  const prompt = `${instrument}, ${genreLabel}, tight studio arrangement that complements the reference track, ${bpm || 120} BPM, key of ${key || 'Am'}`;
  const reqHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetchReplicateWithRetry(
    'https://api.replicate.com/v1/models/meta/musicgen/predictions',
    {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        input: {
          model_version: 'melody',
          prompt,
          input_audio: resolvedAudioUrl,
          continuation: false,
          duration: 30,
          output_format: 'mp3',
          normalization_strategy: 'peak',
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    console.warn(
      `[MusicGen] Petición inicial falló (${response.status}):`,
      errBody
    );
    return {
      error: `MusicGen respondió ${response.status}: ${errBody.substring(0, 300)}`,
    };
  }

  let prediction = await response.json();
  const predictionId = prediction.id;
  const startTime = Date.now();

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    if (Date.now() - startTime > 240000) {
      return {
        error: `MusicGen superó los 4 minutos de espera (Estado: ${prediction.status}).`,
      };
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (pollRes.ok) {
      prediction = await pollRes.json();
    }
  }

  if (prediction.status !== 'succeeded') {
    const predError = prediction.error
      ? String(prediction.error)
      : 'Sin detalle';
    console.warn(
      `[MusicGen] Predicción no completada (${prediction.status}):`,
      predError
    );
    return {
      error: `MusicGen no completó la generación (${prediction.status}): ${predError}`,
    };
  }

  const rawOutputUrl = Array.isArray(prediction.output)
    ? prediction.output[0]
    : prediction.output;
  if (!rawOutputUrl || typeof rawOutputUrl !== 'string') {
    return { error: 'MusicGen no devolvió una URL de audio válida.' };
  }

  // Persistir de forma permanente en Supabase Storage — la URL de Replicate es efímera y expira.
  try {
    const fileRes = await fetch(rawOutputUrl, {
      signal: AbortSignal.timeout(45000),
    });
    if (fileRes.ok) {
      const buffer = Buffer.from(await fileRes.arrayBuffer());
      const cleanInst = instrument.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `musicgen-${cleanInst}-${Date.now()}.mp3`;
      const storageSubPath = rutaAlmacenamientoStem(
        bandId,
        filename,
        effectiveHash
      );
      const persistedUrl = await uploadBufferToSupabase(
        buffer,
        storageSubPath,
        'audio/mpeg'
      );
      if (persistedUrl) {
        return { audioUrl: persistedUrl };
      }
    }
  } catch (persistErr) {
    console.warn(
      '[MusicGen] No se pudo persistir el resultado en Supabase, se usa la URL efímera de Replicate:',
      persistErr
    );
  }

  return { audioUrl: rawOutputUrl };
}

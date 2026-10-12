/**
 * Motor MVSEP-MDX23 (MDX-Net + Demucs4) en Replicate.
 */
import crypto from 'crypto';
import { ProcessNeuralStemsResult, persistRawStemsMap } from './cacheStems.js';
import { ensurePublicAudioUrl, ensureCompressedAudioForReplicate } from './audioPublico.js';
import { REPLICATE_MODEL_MVSEP_MDX23, REPLICATE_VERSION_MVSEP_MDX23 } from './modelos.js';
import { fetchReplicateWithRetry, parseReplicateError } from './diagnosticos.js';

/**
 * Procesa la separación de stems con el modelo MVSEP-MDX23 (MDX-Net + Demucs4) en Replicate.
 *
 * 1. Inferencia en Replicate con lucataco/mvsep-mdx23-music-separation.
 * 2. Persistencia Inmutable en Supabase Storage.
 */
export async function processMdx23Stems(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string,
  overrideToken?: string
): Promise<ProcessNeuralStemsResult | null> {
  const modelFriendlyName = "MVSEP MDX'23 (MDX-Net + Demucs4)";
  const formatLabel = 'MP3 (MVSEP MDX23 Neural)';

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
      stemsMap: null,
      provider: 'replicate',
      errorType: 'token_missing',
      errorTitle: `Token de Replicate No Configurado para ${modelFriendlyName}`,
      error: `Para procesar audio con ${modelFriendlyName} necesitas configurar REPLICATE_API_TOKEN en tus variables de entorno o en la petición.`,
      actionAdvice:
        'Configura tu token de Replicate en Settings o utiliza el Motor DSP local que es 100% gratuito.',
      errorDetail:
        'Missing REPLICATE_API_TOKEN in server environment or request headers',
      httpStatus: 400,
    };
  }

  if (!audioUrl) {
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'audio_unsupported',
      errorTitle: 'Audio no Suministrado',
      error:
        'No se proporcionó una URL o archivo de audio válido para procesar en Replicate.',
      actionAdvice:
        'Sube o graba una idea de audio primero antes de solicitar la separación.',
      errorDetail: 'audioUrl is empty or null',
      httpStatus: 400,
    };
  }

  const effectiveBandId = bandId || 'sin-banda';
  const effectiveHash =
    songHash ||
    crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);
  const t0 = Date.now();

  const publicUrl = await ensurePublicAudioUrl(
    audioUrl,
    effectiveBandId,
    effectiveHash,
    requestHost
  );
  const resolvedUrl = await ensureCompressedAudioForReplicate(
    publicUrl,
    effectiveBandId,
    effectiveHash
  );
  const tPreloadEnd = Date.now();

  const replicateModel = REPLICATE_MODEL_MVSEP_MDX23;
  const MVSEP_VERSION = REPLICATE_VERSION_MVSEP_MDX23;

  console.log(
    `[MDX23 Neural] Iniciando inferencia en Replicate (${replicateModel} / version: ${MVSEP_VERSION.substring(0, 12)}...) para ${modelFriendlyName}. Audio: ${resolvedUrl.substring(0, 50)}...`
  );

  const tGpuStart = Date.now();
  const reqHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 1. Invocar Replicate usando el endpoint por versión fijada con reintentos automáticos
  let response = await fetchReplicateWithRetry(
    'https://api.replicate.com/v1/predictions',
    {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        version: MVSEP_VERSION,
        input: {
          audio: resolvedUrl,
        },
      }),
    }
  );

  // 2. Si falla por endpoint de versiones con 404/422/400, probar endpoint por modelo slug
  if (
    !response.ok &&
    (response.status === 404 ||
      response.status === 422 ||
      response.status === 400)
  ) {
    console.warn(
      `[MDX23 Neural] Prediction por versión ${MVSEP_VERSION.substring(0, 10)} falló (${response.status}). Probando endpoint por modelo slug...`
    );
    response = await fetchReplicateWithRetry(
      `https://api.replicate.com/v1/models/${replicateModel}/predictions`,
      {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({
          input: { audio: resolvedUrl },
        }),
      }
    );
  }

  if (!response.ok) {
    const errBody = await response.text();
    console.warn(
      `[MDX23 Neural] Petición a Replicate falló (${response.status}):`,
      errBody
    );
    const diag = parseReplicateError(response.status, errBody);
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: diag.errorType,
      errorTitle: `${diag.errorTitle} (${modelFriendlyName})`,
      error: diag.message,
      actionAdvice: diag.actionAdvice,
      errorDetail: `Endpoint Replicate: v1/predictions [version: ${MVSEP_VERSION}]\nResponse (${response.status}): ${errBody}`,
      httpStatus: diag.httpStatus,
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
    if (Date.now() - startTime > 600000) {
      console.warn(
        `[MDX23 Neural] Timeout en Replicate (>600s) para predicción ${predictionId}`
      );
      const lastLogs = String(prediction.logs || '')
        .trim()
        .split('\n')
        .filter(Boolean)
        .slice(-6)
        .join('\n');
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: 'timeout',
        errorTitle: `Tiempo de Espera Excedido en GPU (${modelFriendlyName})`,
        error: `La inferencia en Replicate superó los 10 minutos de espera (Estado: ${prediction.status}).`,
        actionAdvice:
          'Puedes reintentar o separar las pistas con el Motor DSP local.',
        errorDetail: `Prediction ID: ${predictionId}\nStatus: ${prediction.status}\nLogs:\n${lastLogs || 'Sin logs'}`,
        httpStatus: 504,
      };
    }
    await new Promise((r) => setTimeout(r, 1200));
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

  const tGpuEnd = Date.now();

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const predError = String(prediction.error || '');
    const lastLogs = String(prediction.logs || '')
      .trim()
      .split('\n')
      .filter(Boolean)
      .slice(-6)
      .join('\n');
    return {
      stemsMap: null,
      provider: 'replicate',
      errorType: 'gpu_failure',
      errorTitle: `Fallo en el Contenedor GPU (${modelFriendlyName})`,
      error: predError || 'El contenedor finalizó con error.',
      actionAdvice: 'Verifica los logs o usa el Motor DSP local.',
      errorDetail: `Prediction ID: ${predictionId}\nError: ${predError}\nLogs:\n${lastLogs}`,
      httpStatus: 502,
    };
  }

  if (prediction.status === 'succeeded' && prediction.output) {
    const out = prediction.output;
    console.log(
      `[MDX23 Neural] Inferencia completada con éxito en Replicate (${modelFriendlyName}):`,
      Object.keys(out)
    );

    const rawStemsMap: Record<string, string> = {};

    // La versión pinneada de lucataco/mvsep-mdx23-music-separation devuelve el output como
    // array posicional (claves "0".."N"), no como objeto con nombres (vocals/drums/bass/...).
    // Sin este caso, el mapeo por nombre de abajo no encuentra nada y se descartan 6 stems
    // ya generados y cobrados en Replicate. El orden de 6 posiciones de abajo NO es el orden
    // documentado en la ficha del modelo (esa describe el modelo base de 4 stems: bass, drums,
    // vocals, other) — se verificó a oído con una separación real: índice 0 = bajo, 1 = batería,
    // 2 = teclados (con algo de bleed de guitarra), 3 = voz, 4 = arreglos/mezcla residual,
    // 5 = guitarras. Si Replicate cambia de versión del modelo, este orden habría que reverificarlo.
    const outKeys = Object.keys(out);
    const isPositionalArray =
      Array.isArray(out) ||
      (outKeys.length > 0 && outKeys.every((k) => /^\d+$/.test(k)));

    if (isPositionalArray) {
      const values = Array.isArray(out)
        ? out
        : outKeys.sort((a, b) => Number(a) - Number(b)).map((k) => out[k]);
      const positionalLabels: Record<number, string[]> = {
        4: ['Bajo', 'Batería', 'Voz', 'Arreglos'],
        6: ['Bajo', 'Batería', 'Teclados', 'Voz', 'Arreglos', 'Guitarras'],
      };
      const labels = positionalLabels[values.length] || [];
      console.log(
        `[MDX23 Neural] Output posicional (array) de ${values.length} stems detectado. Mapeando por orden: ${labels.join(', ') || 'desconocido, se etiquetará genéricamente'}`
      );
      values.forEach((url: unknown, idx: number) => {
        if (typeof url !== 'string') return;
        const label = labels[idx] || `Pista IA ${idx + 1}`;
        rawStemsMap[label] = url;
      });
    } else {
      const findStemUrl = (searchKeys: string[]): string | undefined => {
        for (const k of searchKeys) {
          if (out[k] && typeof out[k] === 'string') return out[k];
        }
        for (const [k, v] of Object.entries(out)) {
          if (typeof v === 'string') {
            const lowerK = k.toLowerCase();
            if (
              searchKeys.some((target) => lowerK.includes(target.toLowerCase()))
            ) {
              return v;
            }
          }
        }
        return undefined;
      };

      const vocalUrl = findStemUrl([
        'vocals',
        'vocals_url',
        'vocalsuri',
        'vocal',
        'acapella',
        'voz',
      ]);
      const drumsUrl = findStemUrl([
        'drums',
        'drums_url',
        'drumsuri',
        'drum',
        'bateria',
      ]);
      const bassUrl = findStemUrl(['bass', 'bass_url', 'bassuri', 'bajo']);
      const guitarUrl = findStemUrl([
        'guitar',
        'guitars',
        'guitar_url',
        'guitaruri',
        'guitarra',
      ]);
      const pianoUrl = findStemUrl([
        'piano',
        'pianouri',
        'keyboards',
        'teclados',
      ]);
      const otherUrl = findStemUrl([
        'other',
        'other_url',
        'otheruri',
        'instrumental',
        'accompaniment',
        'arreglos',
      ]);

      if (vocalUrl) rawStemsMap['Voz'] = vocalUrl;
      if (drumsUrl) rawStemsMap['Batería'] = drumsUrl;
      if (bassUrl) rawStemsMap['Bajo'] = bassUrl;
      if (guitarUrl) rawStemsMap['Guitarras'] = guitarUrl;
      if (pianoUrl) rawStemsMap['Teclados'] = pianoUrl;
      if (otherUrl) rawStemsMap['Arreglos'] = otherUrl;

      if (!rawStemsMap['Guitarras'] && otherUrl)
        rawStemsMap['Guitarras'] = otherUrl;
      if (!rawStemsMap['Arreglos'] && otherUrl && !rawStemsMap['Teclados'])
        rawStemsMap['Arreglos'] = otherUrl;
    }

    const tSaveStart = Date.now();
    const persistentStemsMap = await persistRawStemsMap(
      rawStemsMap,
      effectiveBandId,
      effectiveHash,
      formatLabel
    );
    const tSaveEnd = Date.now();

    const timingBreakdown = {
      preloadSec: `${((tPreloadEnd - t0) / 1000).toFixed(1)}s`,
      gpuInferenceSec: `${((tGpuEnd - tGpuStart) / 1000).toFixed(1)}s`,
      stemsPersistenceSec: `${((tSaveEnd - tSaveStart) / 1000).toFixed(1)}s`,
      totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`,
    };

    return {
      stemsMap: persistentStemsMap,
      timingBreakdown,
      engine: 'mvsep-mdx23',
    };
  }

  return null;
}

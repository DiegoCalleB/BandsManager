/**
 * Motor HT-Demucs v4 en Replicate.
 */
import crypto from 'crypto';
import { ProcessNeuralStemsResult, persistRawStemsMap } from './cacheStems.js';
import { ensurePublicAudioUrl, ensureCompressedAudioForReplicate } from './audioPublico.js';
import { fetchReplicateWithRetry, parseReplicateError, StemErrorType } from './diagnosticos.js';

/**
 * Procesa la separación de stems con Red Neuronal Demucs v4 (Replicate) si REPLICATE_API_TOKEN está configurado.
 * Devuelve un mapa con { Voz, Batería, Bajo, Guitarras, Teclados, Arreglos } usando audio real de estudio de máxima calidad (WAV).
 * Además, persiste los stems en Supabase Storage de manera permanente y aislada por banda/canción,
 * previniendo errores de reproducción causados por URLs temporales expiradas de Replicate.
 */
export async function processDemucsStems(
  audioUrl: string,
  bandId?: string,
  songHash?: string,
  requestHost?: string,
  overrideToken?: string
): Promise<ProcessNeuralStemsResult | null> {
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
      errorTitle: 'Token de Replicate no Configurado',
      error: 'No se encontró la clave REPLICATE_API_TOKEN en el entorno.',
      actionAdvice:
        'Configura REPLICATE_API_TOKEN en los ajustes del proyecto o variables de entorno.',
      errorDetail: 'Missing environment variable REPLICATE_API_TOKEN',
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

  const t0 = Date.now();
  const effectiveBandId = bandId || 'sin-banda';
  const effectiveHash =
    songHash ||
    crypto.createHash('md5').update(audioUrl).digest('hex').substring(0, 10);

  try {
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

    console.log(
      `[Demucs Neural] Iniciando separación de stems con Demucs v4 en Replicate. URL de entrada: ${resolvedUrl.startsWith('data:') ? 'Data URI (' + resolvedUrl.substring(0, 30) + '...)' : resolvedUrl}`
    );
    const DEMUCS_VERSION =
      '25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953';

    // shifts debe ser >= 1 en el schema de cjwbw/demucs (1 = procesamiento rápido sin shifts adicionales; 0 genera error 422)
    const demucsInput = {
      audio: resolvedUrl,
      model_name: 'htdemucs_6s',
      shifts: 1,
      overlap: 0.25,
      output_format: 'mp3',
    };

    const tGpuStart = Date.now();
    const reqHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 1. Probar primero el endpoint oficial del modelo cjwbw/demucs con reintento automático ante 5xx/429
    let response = await fetchReplicateWithRetry(
      'https://api.replicate.com/v1/models/cjwbw/demucs/predictions',
      {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({ input: demucsInput }),
      }
    );

    let primaryErrText = '';
    // 2. Si falla endpoint oficial por ruta con 404/400/422, probar endpoint por hash de versión
    if (!response.ok) {
      primaryErrText = await response.text();
      console.warn(
        `[Demucs Neural] Replicate model/cjwbw/demucs/predictions falló (${response.status}: ${primaryErrText}). Probando v1/predictions con versión...`
      );
      if (
        response.status === 404 ||
        response.status === 400 ||
        response.status === 422
      ) {
        response = await fetchReplicateWithRetry(
          'https://api.replicate.com/v1/predictions',
          {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify({
              version: DEMUCS_VERSION,
              input: demucsInput,
            }),
          }
        );
      }
    }

    if (!response.ok) {
      const errBody =
        primaryErrText && response.status !== 404
          ? primaryErrText
          : await response.text();
      console.warn(
        'Replicate API request failed definitivamente:',
        response.status,
        errBody
      );
      const diag = parseReplicateError(response.status, errBody);
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: diag.errorType,
        errorTitle: diag.errorTitle,
        error: diag.message,
        actionAdvice: diag.actionAdvice,
        errorDetail: diag.errorDetail,
        httpStatus: diag.httpStatus,
      };
    }

    let prediction = await response.json();
    const predictionId = prediction.id;

    // Polling a Replicate con tiempo límite de 600s (10 minutos) para permitir cold-start y procesado completo
    const startTime = Date.now();
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      prediction.status !== 'canceled'
    ) {
      if (Date.now() - startTime > 600000) {
        console.warn('Demucs separation timeout en Replicate (>600s)...');
        const lastLogs = String(prediction.logs || '')
          .trim()
          .split('\n')
          .filter(Boolean)
          .slice(-4)
          .join(' | ');
        return {
          stemsMap: null,
          provider: 'replicate',
          errorType: 'timeout',
          errorTitle: 'Tiempo de Espera en GPU Excedido (>10 min)',
          error: `La separación en la GPU de Replicate superó los 10 minutos de espera (Estado: ${prediction.status}).`,
          actionAdvice:
            'La máquina de Replicate tardó en inicializar. Vuelve a intentarlo o usa la separación con el Motor DSP local.',
          errorDetail: `Prediction ID: ${predictionId}\nStatus: ${prediction.status}\nLogs: ${lastLogs || 'Sin logs disponibles'}`,
          httpStatus: 504,
        };
      }
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (pollRes.ok) {
        prediction = await pollRes.json();
      } else {
        const pollErr = await pollRes.text().catch(() => '');
        console.warn(
          `[Demucs Neural] Error al consultar predicción ${predictionId} (${pollRes.status}): ${pollErr}`
        );
      }
    }

    const tGpuEnd = Date.now();

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      const predError = prediction.error ? String(prediction.error) : '';
      const predLogs = String(prediction.logs || '').trim();
      const lastLogs = predLogs
        ? predLogs.split('\n').filter(Boolean).slice(-6).join('\n')
        : '';

      let failureType: StemErrorType = 'gpu_failure';
      let failureTitle = `Fallo en el Worker GPU de Replicate (${prediction.status})`;
      let failureAdvice =
        'El contenedor Demucs finalizó inesperadamente. Consulta los logs de GPU abajo o usa el Motor DSP local.';

      if (
        predError.toLowerCase().includes('cuda out of memory') ||
        predLogs.toLowerCase().includes('cuda out of memory')
      ) {
        failureTitle = 'Memoria GPU Insuficiente (CUDA Out of Memory)';
        failureAdvice =
          'El archivo de audio es demasiado largo o complejo para la memoria VRAM de la GPU. Intenta con un fragmento más corto o usa el Motor DSP.';
      } else if (
        predError.toLowerCase().includes('soundfile') ||
        predError.toLowerCase().includes('format') ||
        predError.toLowerCase().includes('codec')
      ) {
        failureType = 'audio_unsupported';
        failureTitle = 'Error de Decodificación de Audio en GPU';
        failureAdvice =
          'El decodificador FFmpeg/Soundfile del contenedor no pudo leer el audio. Prueba a convertir el archivo a MP3 o WAV estándar.';
      }

      let detailedGpuError = `Fallo en el procesamiento GPU de Replicate (${prediction.status}): `;
      if (predError) {
        detailedGpuError += predError;
      }
      if (lastLogs && !predError.includes(lastLogs)) {
        detailedGpuError += `\nLogs de GPU:\n${lastLogs}`;
      }
      if (!predError && !lastLogs) {
        detailedGpuError +=
          'El worker finalizó sin devolver mensaje de error explícito.';
      }

      console.warn(
        '[Demucs Neural] Predicción falló en Replicate:',
        detailedGpuError
      );
      return {
        stemsMap: null,
        provider: 'replicate',
        errorType: failureType,
        errorTitle: failureTitle,
        error: predError || 'El worker finalizó con estado failed.',
        actionAdvice: failureAdvice,
        errorDetail: `Prediction ID: ${predictionId}\nError: ${predError || 'No especificado'}\n\nLogs de GPU:\n${lastLogs || '(vacíos)'}`,
        httpStatus: 502,
      };
    }

    if (prediction.status === 'succeeded' && prediction.output) {
      const out = prediction.output;
      console.log(
        '[Demucs Neural] ¡Separación neuronal de stems completada con éxito en Replicate!',
        Object.keys(out)
      );

      const rawStemsMap: Record<string, string> = {};

      // cjwbw/demucs en Replicate devuelve: bassuri, drumsuri, guitaruri, otheruri, pianouri, vocalsuri
      // Otras versiones pueden devolver: bass, drums, guitar, other, piano, vocals
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
        'vocalsuri',
        'vocals',
        'vocal',
        'vocals_url',
        'vocals_uri',
        'voz',
      ]);
      const drumsUrl = findStemUrl([
        'drumsuri',
        'drums',
        'drum',
        'drums_url',
        'drums_uri',
        'bateria',
      ]);
      const bassUrl = findStemUrl([
        'bassuri',
        'bass',
        'bass_url',
        'bass_uri',
        'bajo',
      ]);
      const guitarUrl = findStemUrl([
        'guitaruri',
        'guitar',
        'guitars',
        'guitar_url',
        'guitar_uri',
        'guitarra',
      ]);
      const pianoUrl = findStemUrl([
        'pianouri',
        'piano',
        'keyboards',
        'piano_url',
        'piano_uri',
        'teclados',
      ]);
      const otherUrl = findStemUrl([
        'otheruri',
        'other',
        'no_vocals',
        'other_url',
        'other_uri',
        'accompaniment',
        'arreglos',
      ]);

      if (vocalUrl) rawStemsMap['Voz'] = vocalUrl;
      if (drumsUrl) rawStemsMap['Batería'] = drumsUrl;
      if (bassUrl) rawStemsMap['Bajo'] = bassUrl;
      if (guitarUrl) rawStemsMap['Guitarras'] = guitarUrl;
      if (pianoUrl) rawStemsMap['Teclados'] = pianoUrl;
      if (otherUrl) rawStemsMap['Arreglos'] = otherUrl;

      // Fallback para modelos de 4 stems
      if (!rawStemsMap['Guitarras'] && otherUrl)
        rawStemsMap['Guitarras'] = otherUrl;
      if (!rawStemsMap['Arreglos'] && pianoUrl)
        rawStemsMap['Arreglos'] = pianoUrl;

      // Persistir permanentemente los stems en Supabase Storage o Disco Local
      const tSaveStart = Date.now();
      const persistentStemsMap = await persistRawStemsMap(
        rawStemsMap,
        effectiveBandId,
        effectiveHash,
        'MP3 (Demucs Neural v4)'
      );
      const tSaveEnd = Date.now();

      const timingBreakdown = {
        preloadSec: `${((tPreloadEnd - t0) / 1000).toFixed(1)}s`,
        gpuInferenceSec: `${((tGpuEnd - tGpuStart) / 1000).toFixed(1)}s`,
        stemsPersistenceSec: `${((tSaveEnd - tSaveStart) / 1000).toFixed(1)}s`,
        totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`,
      };

      console.log(
        `[Demucs Neural Telemetry] ⏱️ Tiempo total: ${timingBreakdown.totalSec} (Preload: ${timingBreakdown.preloadSec}, GPU Replicate: ${timingBreakdown.gpuInferenceSec}, Persistencia Supabase: ${timingBreakdown.stemsPersistenceSec})`
      );

      return {
        stemsMap: persistentStemsMap,
        timingBreakdown,
        engine: 'demucs',
      };
    }
  } catch (err) {
    console.warn('Error invocando modelo neuronal Demucs en Replicate:', err);
  }
  return null;
}

import {
  AudioSeparatorService,
  AudioSeparatorOptions,
  AudioSeparatorResult,
  AudioSeparatorJobStatus
} from './AudioSeparatorService.js';
import { ensurePublicAudioUrl } from '../../routes/ai_music.js';

/**
 * Adaptador para Fal.ai (fal-ai/demucs) en GPU A100.
 * Inferencia ultrarrápida (~10-15s) con $10 de saldo de prueba gratuito sin suscripción ni pagos mínimos.
 */
/**
 * Antes aquí había una clave real escrita (y un endpoint público que la gastaba). Ya no hay
 * clave por defecto: se configura SOLO con FAL_KEY / FAL_API_KEY en el entorno. Se mantiene
 * la constante vacía para que los usos antiguos (`rawFal || ACTIVE_FAL_KEY`) queden en «sin clave».
 */
export const ACTIVE_FAL_KEY = '';

export class FalAiService extends AudioSeparatorService {
  readonly providerName = 'fal' as const;
  readonly defaultEngineName = 'Fal.ai Ultra-Fast GPU (~10-15s)';

  private getApiKey(): string {
    let rawKey = (process.env.FAL_KEY || process.env.FAL_API_KEY || '').trim();
    rawKey = rawKey
      .replace(/^["']|["']$/g, '')
      .replace(/^Key\s+/i, '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    
    // Sin clave en el entorno (o la antigua revocada, 58e0800a...) no hay clave: devuelve ''.
    if (!rawKey || rawKey.startsWith('58e0800a')) {
      return ACTIVE_FAL_KEY;
    }
    return rawKey;
  }

  async processAudio(
    fileUrl: string,
    options: AudioSeparatorOptions = {}
  ): Promise<AudioSeparatorResult> {
    const rawKey = options.falKey || this.getApiKey();
    const falKey = (rawKey || '').trim().replace(/^["']|["']$/g, '');
    const t0 = Date.now();
    const bandId = options.bandId || 'sin-banda';
    const songHash = options.songHash || 'default-hash';

    if (!falKey) {
      return {
        success: false,
        provider: 'fal',
        engine: 'fal',
        engineUsed: 'fal',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'FAL_KEY no configurada',
        error: 'No se encontró la variable FAL_KEY en el entorno del servidor.',
        actionAdvice: 'Crea una cuenta en fal.ai (incluye saldo inicial gratuito) y configura FAL_KEY en Railway.',
        httpStatus: 400
      };
    }

    try {
      const keyPrefix = falKey.substring(0, 8);
      console.log(`[Fal.ai Service] ⚡ Invocando separación ultrarrápida en Fal.ai (A100 GPU) con clave [${keyPrefix}...], longitud: ${falKey.length}...`);
      const resolvedUrl = await ensurePublicAudioUrl(fileUrl, bandId, songHash, options.requestHost);

      let authHeader = falKey;
      if (!authHeader.startsWith('Key ') && !authHeader.startsWith('Bearer ')) {
        authHeader = `Key ${falKey}`;
      }

      let res = await fetch('https://fal.run/fal-ai/demucs', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: resolvedUrl
        }),
        signal: AbortSignal.timeout(180000) // 180s (3 min) para canciones completas y cold-starts
      });

      // Si falla por 401 usando 'Key ', intentamos con 'Bearer ' por si es un Personal Access Token
      if (res.status === 401 && authHeader.startsWith('Key ')) {
        const bearerAuth = `Bearer ${falKey}`;
        const retryRes = await fetch('https://fal.run/fal-ai/demucs', {
          method: 'POST',
          headers: {
            'Authorization': bearerAuth,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            audio_url: resolvedUrl
          }),
          signal: AbortSignal.timeout(180000)
        }).catch(() => null);
        if (retryRes && (retryRes.ok || retryRes.status !== 401)) {
          res = retryRes;
        }
      }

        if (!res.ok) {
        const errText = await res.text().catch(() => '');
        let isLocked = false;
        let isRateLimit = res.status === 429;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.detail && (parsed.detail.includes('TOP_UP') || parsed.detail.includes('locked') || parsed.detail.includes('balance') || parsed.detail.includes('credit'))) {
            isLocked = true;
          }
          if (parsed.detail && (parsed.detail.includes('rate') || parsed.detail.includes('limit') || parsed.detail.includes('429'))) {
            isRateLimit = true;
          }
        } catch {
          if (errText.includes('TOP_UP') || errText.includes('locked') || errText.includes('balance')) {
            isLocked = true;
          }
          if (errText.includes('rate limit') || errText.includes('Rate Limit') || errText.includes('429')) {
            isRateLimit = true;
          }
        }

        // Intento secundario vía queue.fal.run por si el microservicio asíncrono tiene el saldo sincronizado
        if (isLocked) {
          try {
            console.log('[Fal.ai Service] Intentando ruta alternativa de cola queue.fal.run/fal-ai/demucs...');
            const queueRes = await fetch('https://queue.fal.run/fal-ai/demucs', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ audio_url: resolvedUrl }),
              signal: AbortSignal.timeout(60000)
            });

            if (queueRes.ok) {
              const queueData = await queueRes.json();
              const reqId = queueData.request_id;
              if (reqId) {
                const statusUrl = queueData.status_url || `https://queue.fal.run/fal-ai/demucs/requests/${reqId}/status`;
                const responseUrl = queueData.response_url || `https://queue.fal.run/fal-ai/demucs/requests/${reqId}`;
                let queueResult: any = null;
                const pollStart = Date.now();
                while (Date.now() - pollStart < 240000) { // Hasta 4 minutos de polling en cola
                  await new Promise(r => setTimeout(r, 2500));
                  const pollRes = await fetch(statusUrl, {
                    headers: { 'Authorization': authHeader }
                  });
                  if (pollRes.ok) {
                    const pollData = await pollRes.json();
                    if (pollData.status === 'COMPLETED') {
                      const finalRes = await fetch(responseUrl, {
                        headers: { 'Authorization': authHeader }
                      });
                      if (finalRes.ok) {
                        queueResult = await finalRes.json();
                        break;
                      }
                    } else if (pollData.status === 'FAILED') {
                      break;
                    }
                  }
                }
                if (queueResult) {
                  const rawOutputs = queueResult.audio_files || queueResult.output || queueResult.stems || queueResult;
                  const rawStemsMap: Record<string, string> = {};
                  const mapKey = (k: string): string => {
                    const lower = k.toLowerCase();
                    if (lower.includes('vocal') || lower.includes('voice') || lower.includes('voz')) return 'Voz';
                    if (lower.includes('drum') || lower.includes('bateria') || lower.includes('percussion')) return 'Batería';
                    if (lower.includes('bass') || lower.includes('bajo')) return 'Bajo';
                    if (lower.includes('guitar') || lower.includes('guitarra')) return 'Guitarras';
                    if (lower.includes('piano') || lower.includes('keyboard') || lower.includes('teclado') || lower.includes('synth')) return 'Teclados';
                    if (lower.includes('other') || lower.includes('arreglo') || lower.includes('brass') || lower.includes('string')) return 'Arreglos';
                    return k;
                  };
                  if (Array.isArray(rawOutputs)) {
                    rawOutputs.forEach((item: any) => {
                      if (item.stem && (item.url || item.file_url)) rawStemsMap[mapKey(item.stem)] = item.url || item.file_url;
                    });
                  } else if (typeof rawOutputs === 'object') {
                    Object.entries(rawOutputs).forEach(([key, val]: [string, any]) => {
                      if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
                        rawStemsMap[mapKey(key)] = val;
                      } else if (val && typeof val === 'object' && (val.url || val.file_url)) {
                        rawStemsMap[mapKey(key)] = val.url || val.file_url;
                      }
                    });
                  }
                  if (Object.keys(rawStemsMap).length > 0) {
                    const persistentStemsMap = await this.downloadAndPersistStems(rawStemsMap, bandId, songHash, options.requestHost);
                    const totalSec = `${((Date.now() - t0) / 1000).toFixed(1)}s`;
                    return {
                      success: true,
                      provider: 'fal',
                      engine: 'fal',
                      engineUsed: 'fal',
                      isNeural: true,
                      degraded: false,
                      stemsMap: persistentStemsMap,
                      timingBreakdown: { totalSec, gpuInferenceSec: `${((Date.now() - t0) / 1000).toFixed(1)}s` }
                    };
                  }
                }
              }
            }
          } catch (queueErr) {
            console.warn('[Fal.ai Service] Fallo en intento de cola alternativa:', queueErr);
          }
        }

        const friendlyMsg = isLocked
          ? 'Tu cuenta de Fal.ai tiene saldo de $10 pero el gateway mantiene el flag de bloqueo (Reason: TOP_UP). Haz un Run de prueba en fal.ai/models/fal-ai/demucs para desbloquearlo o usa Iris Cloud / Iris Básico.'
          : isRateLimit
          ? 'Límite de peticiones de Fal.ai alcanzado (429 Rate Limit). Puedes esperar unos segundos o usar Iris Básico gratis.'
          : `Fal.ai HTTP ${res.status}: ${errText.substring(0, 300)}`;

        const httpErr = new Error(friendlyMsg);
        (httpErr as any).isLocked = isLocked;
        (httpErr as any).isRateLimit = isRateLimit;
        (httpErr as any).status = res.status;
        (httpErr as any).rawDetail = errText;
        throw httpErr;
      }

      const data = await res.json();
      const rawOutputs = data.audio_files || data.output || data.stems || data;
      if (!rawOutputs) {
        throw new Error('Fal.ai no devolvió archivos de audio procesados.');
      }

      const rawStemsMap: Record<string, string> = {};
      const mapKey = (k: string): string => {
        const lower = k.toLowerCase();
        if (lower.includes('vocal') || lower.includes('voice') || lower.includes('voz')) return 'Voz';
        if (lower.includes('drum') || lower.includes('bateria') || lower.includes('percussion')) return 'Batería';
        if (lower.includes('bass') || lower.includes('bajo')) return 'Bajo';
        if (lower.includes('guitar') || lower.includes('guitarra')) return 'Guitarras';
        if (lower.includes('piano') || lower.includes('keyboard') || lower.includes('teclado') || lower.includes('synth')) return 'Teclados';
        if (lower.includes('other') || lower.includes('arreglo') || lower.includes('brass') || lower.includes('string')) return 'Arreglos';
        return k;
      };

      if (Array.isArray(rawOutputs)) {
        rawOutputs.forEach((item: any) => {
          if (item.stem && (item.url || item.file_url)) {
            rawStemsMap[mapKey(item.stem)] = item.url || item.file_url;
          }
        });
      } else if (typeof rawOutputs === 'object') {
        Object.entries(rawOutputs).forEach(([key, val]: [string, any]) => {
          if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
            rawStemsMap[mapKey(key)] = val;
          } else if (val && typeof val === 'object' && (val.url || val.file_url)) {
            rawStemsMap[mapKey(key)] = val.url || val.file_url;
          }
        });
      }

      if (Object.keys(rawStemsMap).length === 0) {
        throw new Error('Fal.ai no devolvió ningún stem válido.');
      }

      const tGpuEnd = Date.now();
      const persistentStemsMap = await this.downloadAndPersistStems(
        rawStemsMap,
        bandId,
        songHash,
        'MP3 (Fal.ai Demucs GPU)'
      );
      const tSaveEnd = Date.now();

      const timingBreakdown = {
        falAiInferenceSec: `${((tGpuEnd - t0) / 1000).toFixed(1)}s`,
        supabasePersistenceSec: `${((tSaveEnd - tGpuEnd) / 1000).toFixed(1)}s`,
        totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`
      };

      console.log(`[Fal.ai Service] ✅ Separación ultrarrápida completada en ${timingBreakdown.totalSec}`);

      return {
        success: true,
        provider: 'fal',
        engine: 'fal',
        engineUsed: 'Fal.ai Demucs GPU',
        isNeural: true,
        degraded: false,
        stemsMap: persistentStemsMap,
        timingBreakdown
      };
    } catch (err: any) {
      console.error('[Fal.ai Service] Error:', err);
      const isLocked = err?.isLocked || String(err?.message || '').includes('TOP_UP') || String(err?.message || '').includes('locked');
      const isRateLimit = err?.isRateLimit || err?.status === 429 || String(err?.message || '').includes('429');
      const isTimeout = err?.name === 'TimeoutError' || String(err?.message || '').includes('timed out') || String(err?.message || '').includes('timeout');

      const errorTitle = isLocked
        ? 'Saldo de Fal.ai Agotado / Facturación Requerida'
        : isRateLimit
        ? 'Límite de Peticiones de Fal.ai Alcanzado (HTTP 429)'
        : isTimeout
        ? 'Tiempo de Espera en Fal.ai Excedido (>40s)'
        : 'Fallo en Fal.ai API';

      const actionAdvice = isLocked
        ? 'Tu cuenta de Fal.ai se ha quedado sin saldo (TOP_UP). Puedes separar gratis al instante con Iris Básico o recargar en fal.ai/dashboard.'
        : isRateLimit
        ? 'Has alcanzado la cuota de llamadas concurrentes en Fal.ai. Espera unos segundos o usa Iris Básico gratis.'
        : isTimeout
        ? 'Fal.ai tardó más de 40s en responder. Puedes reintentar o usar Iris Básico en 1 segundo.'
        : 'Verifica tu clave FAL_KEY en Railway / .env o separa tus pistas gratis con Iris Básico.';

      return {
        success: false,
        provider: 'fal',
        engine: 'fal',
        engineUsed: 'fal',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle,
        error: err?.message || String(err),
        errorDetail: err?.rawDetail || err?.message,
        actionAdvice,
        httpStatus: err?.status || (isTimeout ? 504 : 502)
      };
    }
  }

  async getJobStatus(jobId: string): Promise<AudioSeparatorJobStatus> {
    return {
      jobId,
      status: 'succeeded',
      progressPct: 100
    };
  }
}

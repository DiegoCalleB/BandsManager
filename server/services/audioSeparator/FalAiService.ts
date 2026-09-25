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
export class FalAiService extends AudioSeparatorService {
  readonly providerName = 'fal' as const;
  readonly defaultEngineName = 'Fal.ai Ultra-Fast GPU (~10-15s)';

  private getApiKey(): string {
    const rawKey = process.env.FAL_KEY || process.env.FAL_API_KEY || '';
    return rawKey.trim().replace(/^["']|["']$/g, '');
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
      console.log(`[Fal.ai Service] ⚡ Invocando separación ultrarrápida en Fal.ai (A100 GPU)...`);
      const resolvedUrl = await ensurePublicAudioUrl(fileUrl, bandId, songHash, options.requestHost);

      const authHeader = falKey.startsWith('Key ') ? falKey : `Key ${falKey}`;
      const res = await fetch('https://fal.run/fal-ai/demucs', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: resolvedUrl
        }),
        signal: AbortSignal.timeout(45000)
      });

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

        const friendlyMsg = isLocked
          ? 'Tu cuenta de Fal.ai requiere recarga de saldo o verificación de tarjeta (Reason: TOP_UP / Saldo Agotado). Puedes recargar en fal.ai/dashboard o separar gratis con Iris Básico.'
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

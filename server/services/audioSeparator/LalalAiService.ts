import { descargarBufferSeguro } from '../../utils/ssrfGuard.js';
import {
  AudioSeparatorService,
  AudioSeparatorOptions,
  AudioSeparatorResult,
  AudioSeparatorJobStatus
} from './AudioSeparatorService.js';

/**
 * Adaptador concreto para la API comercial de LALAL.AI (https://www.lalal.ai/api/).
 * Proporciona separación ultra-rápida (~15s-30s) y de calidad de estudio sin cold-starts de GPU.
 */
export class LalalAiService extends AudioSeparatorService {
  readonly providerName = 'lalalai' as const;
  readonly defaultEngineName = 'LALAL.AI Phoenix Neural';

  private getApiKey(overrideToken?: string): string {
    const rawKey = overrideToken || process.env.LALALAI_API_KEY || process.env.LALAL_API_KEY || '';
    return rawKey.trim().replace(/^["']|["']$/g, '');
  }

  /**
   * Envía un archivo o URL de audio a la API comercial de LALAL.AI para separar Voz, Batería, Bajo, Guitarras, Teclados y Arreglos.
   */
  async processAudio(
    fileUrl: string,
    options: AudioSeparatorOptions = {}
  ): Promise<AudioSeparatorResult> {
    const apiKey = this.getApiKey();
    const t0 = Date.now();
    const bandId = options.bandId || 'sin-banda';
    const songHash = options.songHash || 'default-hash';

    if (!apiKey) {
      return {
        success: false,
        provider: 'lalalai',
        engine: 'lalalai',
        engineUsed: 'lalalai',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Clave LALALAI_API_KEY no configurada',
        error: 'No se encontró la clave LALALAI_API_KEY en las variables de entorno de Railway.',
        actionAdvice: 'Configura LALALAI_API_KEY en el panel de Railway o usa el Motor DSP local o Replicate.',
        httpStatus: 400
      };
    }

    if (!fileUrl) {
      return {
        success: false,
        provider: 'lalalai',
        engine: 'lalalai',
        engineUsed: 'lalalai',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Audio no suministrado',
        error: 'Se requiere una URL de audio válida para LALAL.AI.',
        httpStatus: 400
      };
    }

    try {
      console.log(`[LALAL.AI Service] 🚀 Iniciando separación con LALAL.AI API (License Key: ${apiKey.substring(0, 6)}...) para ${options.songTitle || 'tema'}`);

      // 1. Descargar buffer de audio de la URL o Supabase Storage
      const audioFetch = await descargarBufferSeguro(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        timeoutMs: 45000
      });

      if (!audioFetch) {
        throw new Error('No se pudo descargar el audio para LALAL.AI (URL no segura o error HTTP)');
      }

      const audioBuffer = audioFetch.buffer;

      // 2. Subir buffer directo a LALAL.AI API /upload/
      const uploadRes = await fetch('https://www.lalal.ai/api/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `License ${apiKey}`,
          'Content-Disposition': 'attachment; filename="audio_input.mp3"',
          'Content-Type': 'audio/mpeg'
        },
        body: audioBuffer
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => '');
        throw new Error(`Error en LALAL.AI API /upload/ HTTP ${uploadRes.status}: ${errText}`);
      }

      const uploadData = await uploadRes.json();
      if (uploadData.status === 'error') {
        const errMsg = uploadData.error || uploadData.message || 'Error en la subida a LALAL.AI';
        if (errMsg.toLowerCase().includes('premium license') || errMsg.toLowerCase().includes('license required')) {
          return {
            success: false,
            provider: 'lalalai',
            engine: 'lalalai',
            engineUsed: 'lalalai',
            isNeural: false,
            degraded: true,
            stemsMap: {},
            errorTitle: 'Licencia API Premium Requerida en LALAL.AI',
            error: `LALAL.AI respondió: "${errMsg}". Tu License Key (${apiKey.substring(0, 6)}...) requiere un paquete de acceso API comercial en LALAL.AI.`,
            actionAdvice: 'Usa Iris Studio (Replicate MDX23/Demucs) o Iris Básico (DSP Local gratis) que no requieren un plan de pago comercial en LALAL.AI.',
            httpStatus: 403
          };
        }
        throw new Error(`LALAL.AI Upload Error: ${errMsg}`);
      }

      const fileId = uploadData.id;
      if (!fileId) {
        throw new Error('LALAL.AI no devolvió un ID de archivo válido.');
      }

      // 3. Solicitar separación de stems con /split/
      const splitRes = await fetch('https://www.lalal.ai/api/split/', {
        method: 'POST',
        headers: {
          'Authorization': `License ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `id=${encodeURIComponent(fileId)}&stem=all&filter=1`
      });

      const splitData = await splitRes.json();
      if (splitData.status === 'error') {
        const errMsg = splitData.error || splitData.message || 'Error al solicitar separación en LALAL.AI';
        if (errMsg.toLowerCase().includes('premium license') || errMsg.toLowerCase().includes('license required')) {
          return {
            success: false,
            provider: 'lalalai',
            engine: 'lalalai',
            engineUsed: 'lalalai',
            isNeural: false,
            degraded: true,
            stemsMap: {},
            errorTitle: 'Licencia API Premium Requerida en LALAL.AI',
            error: `LALAL.AI respondió: "${errMsg}". Tu License Key (${apiKey.substring(0, 6)}...) requiere un paquete de minutos de API comercial en LALAL.AI.`,
            actionAdvice: 'Puedes usar Iris Studio (Replicate MDX23/Demucs) o Iris Básico (DSP Local gratis) que no requieren paquete comercial en LALAL.AI.',
            httpStatus: 403
          };
        }
        throw new Error(`LALAL.AI Split Error: ${errMsg}`);
      }

      // 4. Polling de estado en LALAL.AI (/check/)
      let stemsMapRaw: Record<string, string> = {};
      const pollStarted = Date.now();
      const maxWaitMs = 180000;

      while (Date.now() - pollStarted < maxWaitMs) {
        await new Promise(r => setTimeout(r, 2000));
        const checkRes = await fetch('https://www.lalal.ai/api/check/', {
          method: 'POST',
          headers: {
            'Authorization': `License ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `id=${encodeURIComponent(fileId)}`
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.status === 'completed' || checkData.status === 'success' || checkData.results || checkData.stems) {
            stemsMapRaw = this.extractLalalStems(checkData.results || checkData.stems || checkData.output || checkData);
            if (Object.keys(stemsMapRaw).length > 0) break;
          } else if (checkData.status === 'error' || checkData.status === 'failed') {
            throw new Error(`LALAL.AI Error: ${checkData.error || checkData.message || 'Error procesando audio'}`);
          }
        }
      }

      if (Object.keys(stemsMapRaw).length === 0) {
        throw new Error('LALAL.AI no devolvió enlaces de stems procesados en el tiempo límite.');
      }

      // 5. Descargar y Persistir inmutablemente en Supabase Storage
      const tGpuEnd = Date.now();
      const persistentStemsMap = await this.downloadAndPersistStems(
        stemsMapRaw,
        bandId,
        songHash,
        'MP3 (LALAL.AI Phoenix Neural)'
      );
      const tSaveEnd = Date.now();

      const timingBreakdown = {
        lalalAiInferenceSec: `${((tGpuEnd - t0) / 1000).toFixed(1)}s`,
        supabasePersistenceSec: `${((tSaveEnd - tGpuEnd) / 1000).toFixed(1)}s`,
        totalSec: `${((tSaveEnd - t0) / 1000).toFixed(1)}s`
      };

      console.log(`[LALAL.AI Service] ✅ Separación completada exitosamente en ${timingBreakdown.totalSec} (${Object.keys(persistentStemsMap).length} pistas)`);

      return {
        success: true,
        provider: 'lalalai',
        engine: 'lalalai',
        engineUsed: 'LALAL.AI Phoenix Neural',
        isNeural: true,
        degraded: false,
        stemsMap: persistentStemsMap,
        timingBreakdown
      };
    } catch (err: any) {
      console.error('[LALAL.AI Service] Error en la API comercial de LALAL.AI:', err);
      return {
        success: false,
        provider: 'lalalai',
        engine: 'lalalai',
        engineUsed: 'lalalai',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Fallo en la API comercial de LALAL.AI',
        error: err?.message || 'No se pudo completar la separación con LALAL.AI.',
        actionAdvice: 'Comprueba tu paquete de minutos en LALAL.AI o usa Iris Studio (Replicate) o Iris Básico (Gratis).',
        httpStatus: 502
      };
    }
  }

  /**
   * Consulta el estado de un trabajo en LALAL.AI.
   */
  async getJobStatus(jobId: string): Promise<AudioSeparatorJobStatus> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { jobId, status: 'failed', error: 'Missing LALALAI_API_KEY' };
    }

    try {
      const res = await fetch('https://www.lalal.ai/api/check/', {
        method: 'POST',
        headers: {
          'Authorization': `License ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `id=${encodeURIComponent(jobId)}`
      });

      if (!res.ok) {
        return { jobId, status: 'failed', error: `LALAL.AI HTTP ${res.status}` };
      }

      const data = await res.json();
      if (data.status === 'completed' || data.status === 'success' || data.results) {
        const rawStems = this.extractLalalStems(data.results || data.stems || data);
        return {
          jobId,
          status: 'succeeded',
          progressPct: 100,
          result: {
            success: true,
            provider: 'lalalai',
            engine: 'lalalai',
            engineUsed: 'LALAL.AI Phoenix Neural',
            isNeural: true,
            degraded: false,
            stemsMap: Object.fromEntries(
              Object.entries(rawStems).map(([k, v]) => [k, { url: v, formato: 'MP3 (LALAL.AI)', tamano: '3.1 MB' }])
            )
          }
        };
      }

      if (data.status === 'error' || data.status === 'failed') {
        return { jobId, status: 'failed', error: data.error || 'LALAL.AI processing error' };
      }

      return { jobId, status: 'processing', progressPct: data.progress || 50 };
    } catch (err: any) {
      return { jobId, status: 'failed', error: err?.message || String(err) };
    }
  }

  /**
   * Normaliza las claves e instrumentos devueltos por LALAL.AI a los nombres estándar de BandManager.io.
   */
  private extractLalalStems(data: any): Record<string, string> {
    const stems: Record<string, string> = {};
    if (!data) return stems;

    const mapKey = (k: string): string => {
      const lower = (k || '').toLowerCase();
      if (lower.includes('vocal') || lower.includes('voice') || lower.includes('voz')) return 'Voz';
      if (lower.includes('drum') || lower.includes('bateria') || lower.includes('percussion')) return 'Batería';
      if (lower.includes('bass') || lower.includes('bajo')) return 'Bajo';
      if (lower.includes('guitar') || lower.includes('guitarra')) return 'Guitarras';
      if (lower.includes('piano') || lower.includes('keyboard') || lower.includes('teclado') || lower.includes('synth')) return 'Teclados';
      if (lower.includes('other') || lower.includes('arreglo') || lower.includes('brass') || lower.includes('string')) return 'Arreglos';
      return k;
    };

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.stem && (item.url || item.download_url)) {
          stems[mapKey(item.stem)] = item.url || item.download_url;
        }
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, val]: [string, any]) => {
        if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
          stems[mapKey(key)] = val;
        } else if (val && typeof val === 'object' && (val.url || val.download_url)) {
          stems[mapKey(key)] = val.url || val.download_url;
        }
      });
    }

    return stems;
  }
}

import {
  AudioSeparatorService,
  AudioSeparatorOptions,
  AudioSeparatorResult,
  AudioSeparatorJobStatus
} from './AudioSeparatorService.js';
import { processDemucsStems, processMdx23Stems } from '../../routes/ai_music.js';

/**
 * Adaptador concreto para los modelos de separación en Replicate (HT-Demucs v4 y MVSEP-MDX23).
 */
export class ReplicateService extends AudioSeparatorService {
  readonly providerName = 'replicate' as const;
  readonly defaultEngineName = 'Iris Studio (MVSEP-MDX23 / Demucs v4)';

  async processAudio(
    fileUrl: string,
    options: AudioSeparatorOptions = {}
  ): Promise<AudioSeparatorResult> {
    const bandId = options.bandId || 'sin-banda';
    const songHash = options.songHash || 'default-hash';
    const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';

    if (!token) {
      return {
        success: false,
        provider: 'replicate',
        engine: 'replicate',
        engineUsed: 'replicate',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Token de Replicate No Configurado',
        error: 'No se encontró la variable REPLICATE_API_TOKEN en el entorno de Railway.',
        actionAdvice: 'Configura REPLICATE_API_TOKEN o LALALAI_API_KEY en Railway.',
        httpStatus: 400
      };
    }

    try {
      console.log(`[Replicate Service] 🚀 Ejecutando separación neuronal con Replicate...`);
      // 1. Probar MVSEP-MDX23
      const mdxRes = await processMdx23Stems(fileUrl, bandId, songHash, options.requestHost);
      if (mdxRes && mdxRes.stemsMap && Object.keys(mdxRes.stemsMap).length > 0) {
        return {
          success: true,
          provider: 'replicate',
          engine: 'mvsep-mdx23',
          engineUsed: 'Iris Studio (MVSEP-MDX23)',
          isNeural: true,
          degraded: false,
          stemsMap: mdxRes.stemsMap,
          timingBreakdown: mdxRes.timingBreakdown
        };
      }

      // 2. Fallback a HT-Demucs v4
      const demucsRes = await processDemucsStems(fileUrl, bandId, songHash, options.requestHost);
      if (demucsRes && demucsRes.stemsMap && Object.keys(demucsRes.stemsMap).length > 0) {
        return {
          success: true,
          provider: 'replicate',
          engine: 'demucs',
          engineUsed: 'Iris Cloud (HT-Demucs v4)',
          isNeural: true,
          degraded: false,
          stemsMap: demucsRes.stemsMap,
          timingBreakdown: demucsRes.timingBreakdown
        };
      }

      return {
        success: false,
        provider: 'replicate',
        engine: 'replicate',
        engineUsed: 'replicate',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: mdxRes?.errorTitle || demucsRes?.errorTitle || 'Fallo en Replicate',
        error: mdxRes?.error || demucsRes?.error || 'Replicate no devolvió resultados.',
        actionAdvice: mdxRes?.actionAdvice || demucsRes?.actionAdvice || 'Prueba con LALAL.AI o Motor DSP local.',
        httpStatus: 502
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'replicate',
        engine: 'replicate',
        engineUsed: 'replicate',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Error en Replicate Service',
        error: err?.message || String(err),
        httpStatus: 500
      };
    }
  }

  async getJobStatus(jobId: string): Promise<AudioSeparatorJobStatus> {
    const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || '';
    if (!token) return { jobId, status: 'failed', error: 'Missing REPLICATE_API_TOKEN' };

    try {
      const res = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return { jobId, status: 'failed', error: `HTTP ${res.status}` };

      const pred = await res.json();
      if (pred.status === 'succeeded') {
        return { jobId, status: 'succeeded', progressPct: 100 };
      }
      if (pred.status === 'failed' || pred.status === 'canceled') {
        return { jobId, status: 'failed', error: pred.error || 'Replicate prediction failed' };
      }
      return { jobId, status: 'processing', progressPct: pred.status === 'starting' ? 25 : 75 };
    } catch (err: any) {
      return { jobId, status: 'failed', error: err?.message || String(err) };
    }
  }
}

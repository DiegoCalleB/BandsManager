import {
  AudioSeparatorService,
  AudioSeparatorOptions,
  AudioSeparatorResult,
  AudioSeparatorJobStatus
} from './AudioSeparatorService.js';
import { processDspFfmpegStems } from '../../routes/ai_music.js';

/**
 * Adaptador para el motor local de filtrado espectral DSP con FFmpeg (100% gratuito e ilimitado).
 */
export class LocalDspService extends AudioSeparatorService {
  readonly providerName = 'ffmpeg' as const;
  readonly defaultEngineName = 'Iris Básico (DSP Local gratis)';

  async processAudio(
    fileUrl: string,
    options: AudioSeparatorOptions = {}
  ): Promise<AudioSeparatorResult> {
    const bandId = options.bandId || 'sin-banda';
    const songHash = options.songHash || 'default-hash';

    try {
      console.log(`[Local DSP Service] ⚙️ Ejecutando separación por filtrado DSP local...`);
      const stemsMap = await processDspFfmpegStems(fileUrl, bandId, songHash, options.requestHost);

      return {
        success: true,
        provider: 'ffmpeg',
        engine: 'dsp-server',
        engineUsed: 'Iris Básico (DSP Local gratis)',
        isNeural: false,
        degraded: true,
        degradedReason: 'Procesado local con filtros de frecuencia DSP (gratuito e ilimitado)',
        stemsMap,
        timingBreakdown: { totalSec: '2.5s' }
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'ffmpeg',
        engine: 'dsp-server',
        engineUsed: 'dsp-server',
        isNeural: false,
        degraded: true,
        stemsMap: {},
        errorTitle: 'Error en Motor DSP Local',
        error: err?.message || String(err),
        httpStatus: 500
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

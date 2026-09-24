import { AudioSeparatorService } from './AudioSeparatorService.js';
import { LalalAiService } from './LalalAiService.js';
import { ReplicateService } from './ReplicateService.js';
import { LocalDspService } from './LocalDspService.js';

export type SupportedEngine = 'lalalai' | 'mvsep-mdx23' | 'demucs' | 'dsp-server' | 'auto';

/**
 * Factoría para instanciar dinámicamente el adaptador de separación de audio
 * en función de las variables de entorno disponibles (LALALAI_API_KEY vs REPLICATE_API_TOKEN)
 * y la preferencia del usuario.
 */
export class AudioSeparatorFactory {
  private static lalalAiService = new LalalAiService();
  private static replicateService = new ReplicateService();
  private static localDspService = new LocalDspService();

  /**
   * Devuelve la instancia del servicio según el motor solicitado o la disponibilidad de API keys.
   */
  static getService(engine: SupportedEngine = 'auto'): AudioSeparatorService {
    const hasLalalKey = !!(process.env.LALALAI_API_KEY || process.env.LALAL_API_KEY);
    const hasReplicateToken = !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY);

    if (engine === 'lalalai') {
      return this.lalalAiService;
    }

    if (engine === 'mvsep-mdx23' || engine === 'demucs') {
      if (hasReplicateToken) return this.replicateService;
      if (hasLalalKey) return this.lalalAiService;
    }

    if (engine === 'dsp-server') {
      return this.localDspService;
    }

    // Estrategia 'auto': Prioriza LALAL.AI por velocidad (~15s) si está configurado,
    // seguido de Replicate (MDX23/Demucs v4), y finalmente Motor DSP Local.
    if (hasLalalKey) {
      console.log('[AudioSeparatorFactory] 🎯 Seleccionado proveedor preferente: LALAL.AI Commercial API');
      return this.lalalAiService;
    }

    if (hasReplicateToken) {
      console.log('[AudioSeparatorFactory] 🎯 Seleccionado proveedor preferente: Replicate Neural GPU');
      return this.replicateService;
    }

    console.log('[AudioSeparatorFactory] 🎯 Seleccionado proveedor fallback: Motor DSP FFmpeg Local');
    return this.localDspService;
  }
}

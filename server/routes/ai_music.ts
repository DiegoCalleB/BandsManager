// AI Music & Sound Studio: generación de pistas/jingles, separación de stems (Replicate/fal, con
// webhook) y utilidades de audio. Descargas externas siempre vía ssrfGuard (AGENTS.md §2.2).
//
// Router contenedor (ADR 0042): cada grupo de rutas vive en su sub-router de `ai_music/` y los
// motores y diagnósticos en módulos propios. Se reexporta la API pública que usaban los servicios
// de separación y los tests, para que `../routes/ai_music.js` siga siendo un punto de entrada válido.
import express from 'express';
import rutasEstadoStems from './ai_music/rutasEstadoStems.js';
import rutasGeneracion from './ai_music/rutasGeneracion.js';
import rutasWebhooks from './ai_music/rutasWebhooks.js';
import rutaSeparacion from './ai_music/rutaSeparacion.js';

export {
  REPLICATE_MODEL_DEMUCS_V4,
  REPLICATE_MODEL_MVSEP_MDX23,
  REPLICATE_VERSION_MVSEP_MDX23,
  REPLICATE_MODELS,
} from './ai_music/modelos.js';
export { ensurePublicAudioUrl } from './ai_music/audioPublico.js';
export {
  parseFalError,
  fetchReplicateWithRetry,
  type MusicServiceErrorProvider,
  type StemErrorType,
  type ServiceDiagnosticError,
  type ReplicateDiagnosticError,
} from './ai_music/diagnosticos.js';
export { parseGeminiError, parseFfmpegError, parseSupabaseStorageError } from './ai_music/diagnosticosInfra.js';
export {
  stemsMemoryCache,
  inFlightSeparations,
  transcodeBufferToMp3,
  type ProcessNeuralStemsResult,
  type CachedStemsEntry,
} from './ai_music/cacheStems.js';
export { processDemucsStems } from './ai_music/motorDemucs.js';
export { processMdx23Stems } from './ai_music/motorMdx23.js';
export { processNeuralStemsReplicate } from './ai_music/motoresNeuronales.js';
export { processServerStemsFfmpeg } from './ai_music/motorFfmpeg.js';

const router = express.Router();

router.use(rutasGeneracion);
router.use(rutasWebhooks);
router.use(rutaSeparacion);
router.use(rutasEstadoStems);

export default router;

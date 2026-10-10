/**
 * Contratos tipados de las respuestas de la API del Centro de Reels.
 * Existen para no usar `any` al leer el JSON de apiFetch y documentar qué campos consume la UI.
 */
import type { BandSocialAccount } from "../../types";
import type { HighlightClip, OptimalTime } from "../../utils/reelsUtils";
import type { ToneAnalysisData } from "../bandCRM/BandToneModal";
import type { YoutubeVideoMeta } from "./reelsHelpers";

/** Tramo de audio con más volumen (score combinado). */
export interface EnergyWindow {
  start: number;
  end: number;
  score: number;
}

/** Tramo con el desglose por señal (volumen / arranque / ritmo visual). */
export interface ViralWindow {
  start: number;
  end: number;
  energia: number;
  arranque: number;
  dinamismo: number;
  score: number;
  motivo: string;
}

/** Cue de subtítulo estático. */
export interface SubtitleCue {
  text: string;
  start: number;
  end: number;
}

/** Palabra con su marca de tiempo (subtítulos karaoke). */
export interface WordOffset {
  word: string;
  start: number;
  end: number;
}

/** Respuesta de `/api/youtube-meta`. */
export interface YoutubeMetaResponse {
  success?: boolean;
  meta?: YoutubeVideoMeta;
  error?: string;
}

/** Respuesta de `/api/reel-analysis` (análisis guardado). */
export interface SavedReelAnalysisResponse {
  success?: boolean;
  found?: boolean;
  highlights?: HighlightClip[];
  optimalTime?: OptimalTime;
  energyWindows?: EnergyWindow[];
  videoMeta?: { viralWindows?: ViralWindow[]; contentType?: string };
  savedAt?: string;
}

/** Respuesta del análisis IA de un vídeo. */
export interface AnalyzeVideoResponse {
  success?: boolean;
  error?: string;
  message?: string;
  notice?: string;
  highlights?: HighlightClip[];
  optimalTime?: OptimalTime;
  energyWindows?: EnergyWindow[];
  viralWindows?: ViralWindow[];
  contentType?: string;
  videoMeta?: Partial<YoutubeVideoMeta>;
}

/** Respuesta de `/api/bands/tone-dna` y del análisis de tono. */
export interface BandToneResponse {
  success?: boolean;
  data?: ToneAnalysisData;
  savedPermanently?: boolean;
}

/** Respuesta de la reanálisis de un clip. */
export interface ClipReanalysisResponse {
  success?: boolean;
  error?: string;
  generatedByAI?: boolean;
  analysis?: Partial<HighlightClip>;
}

/** Respuesta del corte físico del vídeo. */
export interface CutClipResponse {
  success?: boolean;
  error?: string;
  clipUrl?: string;
  videoBase64?: string;
  fileSize?: number;
  burnedSubtitles?: boolean;
  storedPermanently?: boolean;
  vttContent?: string;
  subtitles?: SubtitleCue[];
  words?: WordOffset[];
  sinTranscripcionReal?: boolean;
}

/** Respuesta de la generación de copy. */
export interface CopyGenerationResponse {
  success?: boolean;
  text?: string;
}

/** Respuesta de `/api/concerts` (solo lo que usa la pegatina de gira). */
export interface ConcertsResponse {
  success?: boolean;
  concerts?: Array<{ fecha?: string; ciudad?: string; lugar?: string }>;
}

/** Respuesta de `/api/posts/sync`. */
export interface SyncPostsResponse {
  success?: boolean;
  error?: string;
  message?: string;
}

/** Respuestas de las cuentas sociales. */
export interface SocialAccountsResponse {
  success?: boolean;
  accounts?: BandSocialAccount[];
  account?: BandSocialAccount;
  error?: string;
}

/** Respuesta de la publicación directa. */
export interface PublishNowResponse {
  success?: boolean;
  error?: string;
}

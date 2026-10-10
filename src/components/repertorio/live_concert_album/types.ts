/**
 * Shared contract of the live-concert-to-album flow.
 * Lives apart from the modal so hooks and views can import it without cycles.
 */

/** One cut (song or spoken interlude) detected inside a live concert recording. */
export interface TrackCutItem {
  index: number;
  title: string;
  start: number; // in seconds
  end: number; // in seconds
  duration: number; // in seconds
  type: "musica" | "dialogo";
  speechTranscription?: string;
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
  audioUrl?: string;
  cueIn?: number;
  cueOut?: number;
  hasApplauseIntro?: boolean;
  hasApplauseOutro?: boolean;
  cueConfidence?: number;
}

/** Setlist generated from a concert; persisted through `/api/setlists` and prepended to the local list. */
export interface ConcertSetlistDraft {
  id: string;
  nombre: string;
  descripcion: string;
  tipoFormato: string;
  duracionTotalEstimadaMinutos: number;
  fechaCreacion: string;
  fechaUltimaEdicion: string;
  items: Array<Record<string, unknown>>;
}

/** Server reply of `/api/concert-to-album/process`. */
export interface ProcessAlbumResponse {
  albumId: string;
  deliverablePath: string;
  tracks: TrackCutItem[];
}

/** Server reply of `/api/concert-to-album/analyze`. */
export interface AnalyzeConcertResponse {
  albumTitle?: string;
  artist?: string;
  tracks?: TrackCutItem[];
  youtubeBlocked?: boolean;
  audioAvailable?: boolean;
}

/** Server reply of the classify-tracks and detect-cues endpoints. */
export interface TracksUpdateResponse {
  tracks?: TrackCutItem[];
}

/** Server reply of `/api/concert-to-album/transcribe-speech`. */
export interface SpeechTranscriptionResponse {
  transcription?: string;
}

/** Server reply of `/api/concert-to-album/transcribe-song`. */
export interface SongTranscriptionResponse {
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
}

/** Server reply of `/api/concert-to-album/preview-snippet`. */
export interface SnippetPreviewResponse {
  audioUrl: string;
}

/** Server reply of `/api/concert-to-album/cookies-status`. */
export interface CookiesStatusResponse {
  hasCookies?: boolean;
}

/** Server reply of `/api/concert-to-album/save-cookies`. */
export interface SaveCookiesResponse {
  success?: boolean;
  error?: string;
}

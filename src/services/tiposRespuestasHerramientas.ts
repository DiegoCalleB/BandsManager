/**
 * Formas de las respuestas del servidor que consumen modales y hooks de herramientas
 * (acordes por pista, búsqueda de banda, ADN de tono, plantillas, Spotify, demo de concierto).
 * Cada tipo describe lo que devuelve la ruta citada; los campos opcionales pueden faltar.
 */
import type { BandContact, Song } from '../types';
import type { LearnedRuleBucket } from '../components/dashboard/agent_autonomy/autonomyTypes';

/** Respuesta de `POST /api/generate-song-chords` (server/routes/repertorio.ts). */
export interface RespuestaAcordesCancion {
  success: boolean;
  cifradoTexto: string;
  guiaSustituto?: Song['guiaSustituto'];
  /** De dónde sale el cifrado: audio real, IA sin audio o plantilla de relleno. */
  chordsSource: 'audio_real' | 'ia_sin_audio' | 'plantilla_generica';
  /** `true` si hay huecos `[?]` o dudas y la letra hay que revisarla de oído. */
  esAproximado?: boolean;
}

/** Datos públicos de una banda hallados por `POST /api/bands/ai-lookup`. */
export type DatosBandaIA = Partial<BandContact> & { imagen_url?: string; icono?: string };

/** Respuesta de `POST /api/bands/ai-lookup`. */
export interface RespuestaBuscarBandaIA {
  success: boolean;
  data?: DatosBandaIA;
}

/** ADN de tono guardado de la banda (`dna_expresion`), solo los campos que lee el cliente. */
export interface AdnTonoGuardado {
  tono_comunicacion?: string;
  vocabulario_clave?: string[];
  reglas_por_categoria_respuesta?: Record<string, LearnedRuleBucket>;
}

/** Respuesta de `GET /api/bands/tone-dna`; `data` es `null` si la banda aún no tiene ADN. */
export interface RespuestaAdnTono {
  success: boolean;
  data: AdnTonoGuardado | null;
}

/** Plantilla de categoría de `GET /api/templates`; `customInstruction` solo se rellena si el mánager la escribió. */
export interface PlantillaCategoria {
  customInstruction?: string;
}

/** Respuesta de `GET /api/templates`. */
export interface RespuestaPlantillas {
  success: boolean;
  templates?: Record<string, PlantillaCategoria>;
}

/** Respuesta de `GET /api/spotify/preview`. */
export interface RespuestaPreviewSpotify {
  success?: boolean;
  previewUrl?: string | null;
  error?: string;
}

/** Pista de un álbum de Spotify (server/services/spotifyService.ts). */
export interface SpotifyTrack {
  id: string;
  name: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number;
  durationFormatted: string;
  durationSeconds: number;
  previewUrl: string | null;
  explicit: boolean;
  spotifyUrl: string;
  uri: string;
  tonalidadEstimada?: string;
  bpmEstimado?: number;
}

/** Álbum, single o recopilatorio de Spotify con sus pistas. */
export interface SpotifyAlbum {
  id: string;
  name: string;
  albumType: 'album' | 'single' | 'compilation';
  releaseDate: string;
  releaseYear: string;
  totalTracks: number;
  coverUrl: string;
  coverUrlMedium: string;
  spotifyUrl: string;
  uri: string;
  genres: string[];
  tracks: SpotifyTrack[];
}

/** Perfil de artista de Spotify. */
export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number;
  imageUrl: string;
  spotifyUrl: string;
  uri: string;
}

/** Respuesta de `GET /api/spotify/artist-discography`; en error el servidor responde `{ error }`. */
export interface RespuestaDiscografiaSpotify {
  success?: boolean;
  discography?: { artist: SpotifyArtist; albums: SpotifyAlbum[] };
  error?: string;
}

/** Respuesta de `POST /api/spotify/import-discography`. */
export interface RespuestaImportarDiscografia {
  success?: boolean;
  totalImported?: number;
  totalUpdated?: number;
  totalSkipped?: number;
  /** Repertorio completo de la banda tras importar. */
  allBandSongs?: Song[];
  error?: string;
}

/** Respuesta de `POST /api/concert-to-album/demo-audio`. */
export interface RespuestaAudioDemo {
  success: boolean;
  filePath?: string;
}

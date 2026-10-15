/**
 * Tipos de la capa de datos del repertorio (`songs`, `setlists`, `setlist_shortcuts`).
 *
 * Una canción existe con dos grafías a la vez: la fila de Supabase (snake_case) y la de la app
 * (camelCase, `Song`). `mapSongRecord` devuelve las dos y `dbUpsertSong` acepta cualquiera.
 */
import type {
  AnalisisAcordes,
  AudioTrack,
  MemberSongNote,
  Setlist,
  SetlistShortcut,
  Song,
  SongAudioIdea,
  SongSubstituteGuide,
  StemsMeta,
} from '../../src/types.js';

/** Columnas de `songs` en snake_case (cada una es el equivalente de un campo camelCase de `Song`). */
export interface ColumnasSong {
  band_id?: string;
  bandId?: string;
  duracion_segundos?: number;
  duracion_minutos?: number;
  bpm_detectado_en?: string;
  tonalidad_detectada_en?: string;
  album_disco?: string;
  orden_album?: number | null;
  energia_manual?: boolean;
  energia_variacion?: number;
  energia_variacion_calculada_en?: string;
  portada_url?: string;
  favorito_general?: boolean;
  estado_tema?: string;
  es_version_covers?: boolean;
  enlace_acordes?: string;
  notas_internas?: string;
  notas_repertorio?: string;
  notas_miembros?: Record<string, string>;
  notas_por_miembro?: MemberSongNote[];
  audio_principal_url?: string;
  audio_url?: string;
  /** JSONB: algunas filas antiguas lo guardaron como texto, por eso se lee con `parseJsonArray`. */
  audio_ideas?: SongAudioIdea[] | string;
  cifrado_texto?: string;
  guia_sustituto?: SongSubstituteGuide;
  stems_meta?: StemsMeta;
  analisis_acordes?: AnalisisAcordes;
  estructura_documento_url?: string;
  estructura_documento_nombre?: string;
  estructura_documento_procesado_en?: string | null;
  estructura_verificada?: boolean;
  created_at?: string;
  updated_at?: string;
  energia_db_promedio?: number | null;
  energia_bpm_detectado?: number | null;
  energia_onset_density?: number | null;
}

/** Canción tal como llega de la base de datos o del cliente: cualquiera de las dos grafías. */
export type FilaSong = Partial<Omit<Song, 'audioIdeas'>> &
  ColumnasSong & { audioIdeas?: SongAudioIdea[] | string };

/** Pistas (stems) de una canción. */
export type PistasSong = AudioTrack[];

/** Fila de `setlists`, o el setlist de la app: ambos nombres de campo. */
export type EntradaSetlist = Partial<Setlist> & {
  tipo_formato?: Setlist['tipoFormato'];
  duracion_total_estimada_minutos?: number;
  duracionTotalEstimadaMinutos?: number;
};

/** Atajo para guardar: camelCase de la app o columnas snake_case. */
export type EntradaAtajo = Partial<SetlistShortcut> & {
  titulo_custom?: string;
  duracion_estimada_minutos?: number | null;
  duracion_estimada_segundos?: number | null;
  nota_tema?: string;
};

/** Error de PostgREST mínimo que mira `isMissingTableOrColumnError`. */
export interface ErrorPostgrest {
  code?: string;
  message?: string;
}

/**
 * Canción ya mapeada por `mapSongRecord`: todos los campos de `Song` más sus columnas en snake_case.
 * Las listas JSONB llegan ya como arrays.
 */
export type SongMapeada = Song &
  Omit<ColumnasSong, 'audio_ideas'> & { audio_ideas: SongAudioIdea[] };

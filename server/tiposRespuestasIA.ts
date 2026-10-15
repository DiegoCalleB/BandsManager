/**
 * Formas de los JSON que devuelve el LLM y que se leen con `safeParseJson<T>`.
 *
 * Son lo que el prompt PIDE, no lo que el modelo garantiza: todo va con `?` y los campos que se usan
 * en cálculos o se guardan se validan con `server/utils/valoresIA.ts` antes de fiarse de ellos.
 */
import type { Song } from '../src/types.js';

/** Respuesta con una lista de salas/recintos (`venues`); el tipo del elemento lo fija cada servicio. */
export interface RespuestaListaVenues<TVenue> {
  venues?: TVenue[];
}

/** Respuesta del radar cultural público: `leads_publicos`. */
export interface RespuestaLeadsPublicos<TLead> {
  leads_publicos?: TLead[];
}

/** Respuesta del cruce de bandas similares con salas: `matches`. */
export interface RespuestaMatchesSalas<TMatch> {
  matches?: TMatch[];
}

/** Ficha de una sala estimada por IA (valoraciones, fotos y logística técnica). */
export interface RespuestaFichaGooglePlaces {
  rating?: number;
  total_reviews?: number;
  fotos?: string[];
  horario_carga?: string;
  resumen_acustica?: string;
  acceso_backline?: string;
  place_id?: string;
}

/** Histórico de la sala en setlist.fm estimado por IA. */
export interface RespuestaHistorialSetlist {
  bandas_similares_recientes?: string[];
  fecha_ultimo_concierto?: string;
  generos_habituales?: string[];
  promotores_frecuentes?: string[];
  referencia_pitch_sugerida?: string;
}

/** Análisis social de una sala (Instagram) estimado por IA. */
export interface RespuestaEngagementSocial {
  instagram_followers?: number;
  engagement_rate?: number;
  promedio_views_reels?: number;
  promociona_bandas_activo?: boolean;
  /** Se espera "alta" | "media" | "baja"; llega como texto libre. */
  calidad_promo_sala?: string;
  resumen_social?: string;
}

/** Demanda de oyentes de Spotify en una ciudad estimada por IA. */
export interface RespuestaAudienciaSpotify {
  oyentes_ciudad?: number;
  afinidad_genero?: number;
  prediccion_entradas?: number;
  top_ciudades_ranking?: number;
  resumen_audiencia?: string;
}

/** Logística de un trayecto de gira estimada por IA. */
export interface RespuestaLogisticaGira {
  distancia_km?: number;
  tiempo_conduccion?: string;
  peajes_estimados?: number;
  coste_total_viaje?: number;
  recomendacion_logistica?: string;
}

/** Variantes de texto para la campaña de un concierto. */
export interface RespuestaVariantesCampana {
  variantes?: unknown[];
}

/** Transcripción de acordes y letra de una canción desde audio. */
export interface RespuestaCifradoIA {
  cifradoTexto?: string;
  guiaSustituto?: Song['guiaSustituto'];
  /** Se espera "alta" | "media" | "baja" | "sin_letra"; llega como texto libre. */
  letraConfianza?: string;
}

/** Idea de arreglo del compositor IA; se devuelve tal cual al cliente si trae título. */
export interface RespuestaIdeaArreglo {
  tituloIdea?: string;
  descripcionArreglo?: string;
  tablaturaOAcordes?: string;
  notasParaBanda?: string;
  [campo: string]: unknown;
}

/** Datos originales de una versión (cover) investigados por IA. Los números pueden llegar como texto. */
export interface RespuestaDatosCover {
  artistaOriginal?: unknown;
  tonalidadOriginal?: unknown;
  bpmOriginal?: unknown;
  energia?: unknown;
  generoRock?: unknown;
  duracionMinutosSegundos?: unknown;
}

/** Elemento con `id` de una lista traducida del EPK (miembros, vídeos, cifras, reseñas). */
export interface ElementoTraducidoEpk {
  id?: string;
  rol?: string;
  bio?: string;
  titulo?: string;
  etiqueta?: string;
  cita?: string;
  tipo?: string;
}

/** Traducción del EPK devuelta por la IA. Cada campo se vuelve a validar con `texto()` al guardarla. */
export interface RespuestaTraduccionEpk {
  biografia?: string;
  textoPie?: string;
  riderTecnico?: string;
  prensaSubtitulo?: string;
  miembros?: ElementoTraducidoEpk[];
  videos?: ElementoTraducidoEpk[];
  cifras?: ElementoTraducidoEpk[];
  resenas?: ElementoTraducidoEpk[];
  datosContratacion?: Record<string, unknown>;
}

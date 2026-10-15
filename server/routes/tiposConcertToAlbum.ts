/**
 * Datos externos que lee el troceador de conciertos (concert_to_album.ts): los capítulos que
 * devuelve yt-dlp y los JSON que responde la IA. Todo opcional: viene de fuera y puede faltar.
 */

/** Capítulo de un vídeo en el `--dump-json` de yt-dlp. */
export interface CapituloYoutube {
  start_time?: number;
  end_time?: number;
  title?: string;
}

/** Pista que propone la IA al analizar el concierto. */
export interface PistaPropuestaIA {
  title?: string;
  start?: number;
  end?: number;
  duration?: number;
  type?: string;
  speechTranscription?: string;
  lyricsWithChords?: string;
  tonalidad?: string;
  bpm?: number;
}

/** JSON del análisis del concierto con IA. */
export interface AnalisisConciertoIA {
  albumTitle?: string;
  tracks?: PistaPropuestaIA[];
}

/** JSON de la clasificación música/diálogo de las pistas con IA. */
export interface ClasificacionPistasIA {
  classified?: { index?: number; type?: string; suggestedTitle?: string }[];
}

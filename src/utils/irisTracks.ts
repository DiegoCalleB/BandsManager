import { Song, SongAudioIdea, AudioTrack } from '../types';

/**
 * Retorna la idea de audio de la canción que cuenta con pistas separadas (stems) por Iris
 * (ya sea por contar con múltiples pistas o tener registrado el motor neuronal/básico de Iris).
 */
export function getSongIrisStemIdea(song?: Song | null): SongAudioIdea | null {
  if (!song || !song.audioIdeas || song.audioIdeas.length === 0) return null;
  return song.audioIdeas.find((idea) => (idea.pistas && idea.pistas.length > 1) || Boolean(idea.stemEngineUsed)) || null;
}

/**
 * Devuelve true si la canción tiene al menos una idea con pistas separadas por Iris.
 */
export function hasIrisStems(song?: Song | null): boolean {
  return Boolean(getSongIrisStemIdea(song));
}

/**
 * Extrae y estandariza el array de pistas de audio desde una idea musical.
 * Si la idea no tiene pistas separadas, genera una pista única con el audio principal.
 */
export function getIdeaTracks(idea: SongAudioIdea): AudioTrack[] {
  if (idea.pistas && idea.pistas.length > 0) {
    return idea.pistas;
  }
  return [
    {
      id: `${idea.id}-track-1`,
      nombre: idea.titulo || 'Pista Principal',
      audioUrl: idea.audioUrl,
      autor: idea.subidoPor,
      instrumento: idea.instrumento,
    },
  ];
}

/** Pistas (stems) que cuelgan de la idea de Iris dentro de una lista de ideas; [] si no hay. */
export function pistasDeIdeas(ideas?: SongAudioIdea[] | null): AudioTrack[] {
  const idea = (ideas || []).find((i) => (i.pistas && i.pistas.length > 1) || Boolean(i.stemEngineUsed));
  return idea ? getIdeaTracks(idea) : [];
}

/**
 * Pistas separadas de una canción, vengan de donde vengan. Manda la idea de Iris (es lo que se
 * edita en directo); `song.pistas` es la copia que guarda el servidor y cubre el caso de que la
 * idea ya no esté. El día que los escritores pasen a la canción solo cambia esta función.
 */
export function pistasDeCancion(song?: Song | null): AudioTrack[] {
  if (!song) return [];
  const deIdeas = pistasDeIdeas(song.audioIdeas);
  return deIdeas.length > 0 ? deIdeas : song.pistas ?? [];
}

/**
 * Único punto por el que una canción cambia de ideas. Los stems son de la canción, así que
 * `song.pistas` se mantiene al día con los de la idea de Iris; si las ideas ya no traen ninguno
 * (se borró la toma) la canción conserva los suyos en vez de perderlos.
 */
export function cancionConIdeas<T extends { audioIdeas?: SongAudioIdea[]; pistas?: AudioTrack[] }>(
  cancion: T,
  ideas: SongAudioIdea[],
): T {
  const deIdeas = pistasDeIdeas(ideas);
  const pistas = deIdeas.length > 0 ? deIdeas : cancion.pistas;
  return { ...cancion, audioIdeas: ideas, ...(pistas ? { pistas } : {}) };
}

import type { AudioTrack, SongAudioIdea } from '../../types';

/**
 * Normaliza las pistas de una idea: devuelve `pistas` o, si la idea es de una sola pista (formato
 * antiguo), sintetiza una pista única con los datos de la propia idea.
 */
export function getIdeaTracks(idea: SongAudioIdea): AudioTrack[] {
  if (idea.pistas && idea.pistas.length > 0) {
    return idea.pistas;
  }
  // Fallback single track
  return [
    {
      id: `${idea.id}-track-1`,
      nombre: idea.titulo || 'Pista Principal',
      audioUrl: idea.audioUrl,
      autor: idea.subidoPor,
      instrumento: idea.instrumento,
      fecha: idea.fecha,
      volumen: 1,
      muted: false,
    },
  ];
}

import { Song, SongAudioIdea, AudioTrack } from '../types';

/**
 * Retorna la idea de audio de la canción que cuenta con pistas separadas (stems) por Iris
 * (ya sea por contar con múltiples pistas o tener registrado el motor neuronal/básico de Iris).
 */
export function getSongIrisStemIdea(song?: Song | null): SongAudioIdea | null {
 if (!song || !song.audioIdeas || song.audioIdeas.length === 0) return null;
 return (
 song.audioIdeas.find(
 idea => (idea.pistas && idea.pistas.length > 1) || Boolean(idea.stemEngineUsed)
 ) || null
 );
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
 instrumento: idea.instrumento
 }
 ];
}

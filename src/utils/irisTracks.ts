import { Song, SongAudioIdea, AudioTrack, StemsMeta } from '../types';

/**
 * Retorna la idea de audio de la canción que cuenta con pistas separadas (stems) por Iris
 * (ya sea por contar con múltiples pistas o tener registrado el motor neuronal/básico de Iris).
 */
export function getSongIrisStemIdea(song?: Song | null): SongAudioIdea | null {
  if (!song || !song.audioIdeas || song.audioIdeas.length === 0) return null;
  return song.audioIdeas.find((idea) => (idea.pistas && idea.pistas.length > 1) || Boolean(idea.stemEngineUsed)) || null;
}

/** ¿Es esta la idea que lleva los stems de Iris (la que la UI trata como "pistas de la canción")? */
export function esIdeaIris(idea: SongAudioIdea): boolean {
  return Boolean((idea.pistas && idea.pistas.length > 1) || idea.stemEngineUsed);
}

/** Pone la idea de Iris la primera y deja las tomas en su orden: los stems no son una toma más. */
export function irisPrimero(ideas: SongAudioIdea[]): SongAudioIdea[] {
  return [...ideas.filter(esIdeaIris), ...ideas.filter((i) => !esIdeaIris(i))];
}

/**
 * Devuelve true si la canción tiene stems separados por Iris (de la canción, o aún en una idea).
 */
export function hasIrisStems(song?: Song | null): boolean {
  return pistasDeCancion(song).length > 1 || Boolean(metaStemsDeCancion(song)?.motor);
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

/** Cómo se separaron los stems según la idea de Iris (motor, neural, degradado, fecha); undefined si no consta. */
export function metaStemsDeIdeas(ideas?: SongAudioIdea[] | null): StemsMeta | undefined {
  const idea = (ideas || []).find((i) => (i.pistas && i.pistas.length > 1) || Boolean(i.stemEngineUsed));
  if (!idea) return undefined;
  const meta: StemsMeta = {
    ...(idea.stemEngineUsed ? { motor: idea.stemEngineUsed } : {}),
    ...(idea.stemIsNeural !== undefined ? { neural: idea.stemIsNeural } : {}),
    ...(idea.stemDegraded !== undefined ? { degradado: idea.stemDegraded } : {}),
    ...(idea.stemProcessedAt ? { procesadoEn: idea.stemProcessedAt } : {}),
  };
  return Object.keys(meta).length > 0 ? meta : undefined;
}

/** Pistas separadas de una canción: manda `song.pistas`; las ideas cubren datos que aún no se migraron. */
export function pistasDeCancion(song?: Song | null): AudioTrack[] {
  if (!song) return [];
  return song.pistas && song.pistas.length > 0 ? song.pistas : pistasDeIdeas(song.audioIdeas);
}

/** Metadatos de la separación: manda `song.stemsMeta`; la idea de Iris cubre lo no migrado. */
export function metaStemsDeCancion(song?: Song | null): StemsMeta | undefined {
  if (!song) return undefined;
  return song.stemsMeta ?? metaStemsDeIdeas(song.audioIdeas);
}

/**
 * Idea a la que dar a los visores que aún piden una toma (modo práctica): la de Iris si existe o,
 * si la toma se borró, una sintética con los stems de la canción. Desaparece con la limpieza.
 */
export function ideaDeStemsDeCancion(song?: Song | null): SongAudioIdea | null {
  if (!song) return null;
  const real = getSongIrisStemIdea(song);
  const pistas = pistasDeCancion(song);
  const meta = metaStemsDeCancion(song);
  // Con toma real (datos aún sin limpiar) se le superpone lo de la canción: la canción manda.
  if (real) return pistas.length > 0 ? { ...real, pistas } : real;
  if (pistas.length === 0) return null;
  return {
    id: `stems-${song.id}`,
    titulo: 'Iris',
    seccion: 'general',
    audioUrl: song.audioPrincipalUrl || pistas[0].audioUrl,
    pistas,
    subidoPor: 'Iris',
    fecha: meta?.procesadoEn || '',
    ...(meta?.motor ? { stemEngineUsed: meta.motor } : {}),
  };
}

/**
 * Único punto por el que una canción cambia de ideas. Los stems son de la canción: `song.pistas`
 * manda y solo si la canción aún no los tiene se copian de la idea de Iris (datos sin limpiar).
 */
export function cancionConIdeas<T extends { audioIdeas?: SongAudioIdea[]; pistas?: AudioTrack[]; stemsMeta?: StemsMeta }>(
  cancion: T,
  ideas: SongAudioIdea[],
): T {
  const deIdeas = pistasDeIdeas(ideas);
  const pistas = cancion.pistas && cancion.pistas.length > 0 ? cancion.pistas : deIdeas.length > 0 ? deIdeas : cancion.pistas;
  const stemsMeta = cancion.stemsMeta ?? metaStemsDeIdeas(ideas);
  return { ...cancion, audioIdeas: ideas, ...(pistas ? { pistas } : {}), ...(stemsMeta ? { stemsMeta } : {}) };
}

/**
 * Escribe las pistas de una idea. Si la idea es la de Iris (los stems de la canción) se guardan en
 * `song.pistas`, sin tocar las tomas; si es una toma normal, en la propia idea. `extra` solo se
 * aplica a tomas (p. ej. el audioUrl principal).
 */
export function cancionConPistas<T extends Song>(
  cancion: T,
  idea: SongAudioIdea,
  pistas: AudioTrack[],
  extra: Partial<SongAudioIdea> = {},
): T {
  const iris = ideaDeStemsDeCancion(cancion);
  if (iris && iris.id === idea.id) return { ...cancion, pistas };
  const ideas = (cancion.audioIdeas || []).map((i) => (i.id === idea.id ? { ...i, pistas, ...extra } : i));
  return cancionConIdeas(cancion, ideas);
}

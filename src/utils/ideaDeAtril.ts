import type { AudioTrack, SongAudioIdea } from '../types';

export interface DatosIdeaDeAtril {
  id: string;
  titulo: string;
  audioUrl: string;
  subidoPor: string;
  instrumento?: string;
  /** Pistas que sonaban al grabar; vacío si se grabó en seco. */
  sobrePistas?: string[];
  offsetSegundos?: number;
  seccion?: SongAudioIdea['seccion'];
  fecha?: string;
}

/** Idea nacida en el Atril: guarda sobre qué pistas se tocó para poder reproducirla alineada. */
export function crearIdeaDeAtril(d: DatosIdeaDeAtril): SongAudioIdea {
  const sobrePistas = d.sobrePistas?.length ? [...new Set(d.sobrePistas)] : undefined;
  return {
    id: d.id,
    titulo: d.titulo,
    seccion: d.seccion ?? 'general',
    audioUrl: d.audioUrl,
    subidoPor: d.subidoPor,
    instrumento: d.instrumento,
    fecha: d.fecha ?? new Date().toISOString(),
    origen: 'atril',
    ...(sobrePistas ? { sobrePistas, offsetSegundos: Number.isFinite(d.offsetSegundos) ? d.offsetSegundos : 0 } : {}),
  };
}

/** Ideas que se pueden oír a la vez que las pistas elegidas (grabadas sobre alguna de ellas, o en seco). */
export function ideasCompatiblesConPistas(ideas: SongAudioIdea[], idsPistas: string[]): SongAudioIdea[] {
  return ideas.filter(
    (i) => i.origen === 'atril' && (!i.sobrePistas || i.sobrePistas.some((id) => idsPistas.includes(id))),
  );
}

/**
 * Stems de la canción que acompañan a una toma (`sobrePistas`), en el orden de la canción.
 * Los ids que ya no existen (stem borrado o canción vuelta a separar) salen en `faltan`.
 */
export function pistasBaseDeIdea(idea: SongAudioIdea, stems: AudioTrack[]): { pistas: AudioTrack[]; faltan: string[] } {
  const ids = idea.sobrePistas ?? [];
  const faltan = ids.filter((id) => !stems.some((s) => s.id === id));
  return { pistas: stems.filter((s) => ids.includes(s.id)), faltan };
}

/** Toma con otro fondo: p. ej. solo la batería. Vacío la deja en seco (sin fondo ni desfase). */
export function ideaConPistasBase(idea: SongAudioIdea, ids: string[]): SongAudioIdea {
  const { sobrePistas: _s, offsetSegundos: _o, ...resto } = idea;
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return resto;
  return { ...resto, sobrePistas: unicos, offsetSegundos: idea.offsetSegundos ?? 0 };
}

/** Tomas de la canción: ideas con audio que no son la separación de Iris. */
export function tomasDeCancion(ideas: SongAudioIdea[] = []): SongAudioIdea[] {
  return ideas.filter((i) => i.audioUrl && !(i.pistas && i.pistas.length > 1) && !i.stemEngineUsed);
}

/** Lo que suena al escuchar una toma: su fondo (stems elegidos) más la propia toma como una pista más. */
export function pistasParaToma(idea: SongAudioIdea, stems: AudioTrack[]): AudioTrack[] {
  const toma: AudioTrack = {
    id: `toma-${idea.id}`,
    nombre: idea.titulo || 'Toma',
    audioUrl: idea.audioUrl,
    instrumento: idea.instrumento,
  } as AudioTrack;
  return [...pistasBaseDeIdea(idea, stems).pistas, toma];
}

/** Reemplaza el fondo de una toma dentro de la lista de ideas (el resto queda intacto). */
export function ideasConFondo(ideas: SongAudioIdea[], ideaId: string, ids: string[]): SongAudioIdea[] {
  return ideas.map((i) => (i.id === ideaId ? ideaConPistasBase(i, ids) : i));
}

import type { SongAudioIdea } from '../types';

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

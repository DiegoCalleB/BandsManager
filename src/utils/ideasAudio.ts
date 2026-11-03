import type { SongAudioIdea } from '../types';

/**
 * `audioIdeas` mezcla dos cosas muy distintas:
 *  - IDEAS de la banda, creadas en Studio (un demo, una melodía, un arreglo…): llevan `votos` / `comentarios`.
 *  - FUENTES de audio que crea el SISTEMA para tener algo que reproducir: «Audio Oficial» (Sync), «Audio Preview
 *    Oficial» (Spotify), «Audio Máster Completo (Estudio)» (subida de disco), «Audio Recortado Directo» (concierto),
 *    «Pistas Separadas» (Iris)… No son ideas de nadie.
 * El contador «N ideas» de la lista contaba las dos y todas las canciones salían con 1 o 2 sin tener ninguna.
 */
export const ORIGENES_AUDIO_SISTEMA = new Set(['Sync', 'Spotify Sync', 'Subida Disco', 'Concierto en Directo', 'Iris Cloud', 'BandManager Royalty-Free']);

export function esIdeaDeUsuario(idea: Pick<SongAudioIdea, 'subidoPor' | 'votos' | 'comentarios'>): boolean {
  if (ORIGENES_AUDIO_SISTEMA.has(idea.subidoPor)) return false;
  return Array.isArray(idea.votos) || Array.isArray(idea.comentarios);
}

export const contarIdeasDeUsuario = (ideas?: SongAudioIdea[] | null): number => (ideas ?? []).filter(esIdeaDeUsuario).length;

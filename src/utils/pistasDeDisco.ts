import type { Song } from '../types';

/** Número de pista de una canción nueva en un disco que ya existe: la siguiente a la mayor (o al total, si no hay números). */
export function siguientePista(existentes: Song[], creadas: Song[] = []): number {
  const todas = [...existentes, ...creadas];
  return Math.max(todas.length, ...todas.map((s) => s.ordenAlbum ?? 0)) + 1;
}

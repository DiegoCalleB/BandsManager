/**
 * Tipos de entrada de las utilidades de notas por miembro de `repertorioUtils.ts`.
 * Aparte porque `repertorioUtils.ts` ya supera las 400 líneas.
 */
import type { MemberSongNote } from '../types';

/** Nota de un miembro tal como puede venir guardada: las antiguas llevaban `id` en vez de `userId`. */
export type NotaDeMiembro = MemberSongNote & { id?: string };

/** Lo que leen de una canción las utilidades de notas por miembro (una `Song` o un borrador suyo). */
export interface CancionConNotas {
  notasMiembros?: Record<string, string>;
  /** Variante snake_case de filas antiguas. */
  notas_miembros?: Record<string, string>;
  notasPorMiembro?: NotaDeMiembro[];
}

/** Usuario o miembro del que se saca la lista de músicos; acepta los nombres de campo de cada origen. */
export interface MiembroDeBandaLike {
  id?: string;
  name?: string;
  nombre?: string;
  username?: string;
  instrument?: string;
  instrumento?: string;
  role?: string;
  avatarColor?: string;
}

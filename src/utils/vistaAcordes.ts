import { keyToChromaticIndex, parseRootNote } from './chordUtils';
import { notasDelAcorde } from './teoriaArmonica';

const SOST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type VistaAcorde = 'guitarra' | 'teclado' | 'bajo';

export interface NotasParaDibujar {
  raiz: number;
  /** Clases de nota (0-11) que suenan: raíz, 3.ª, 5.ª y 7.ª si la lleva. */
  notas: number[];
  quinta: number;
  /** Nota del bajo en un acorde con inversión («C/E»), si la hay. */
  bajo: number | null;
}

/** «Sol#m7», «Am», «C/E» → las notas que lo forman (calculadas, valen para cualquier acorde). */
export function notasParaDibujar(acorde: string): NotasParaDibujar | null {
  const p = parseRootNote(acorde);
  if (!p) return null;
  const pc = keyToChromaticIndex(p.root);
  if (pc === null) return null;
  const n = notasDelAcorde(SOST[pc] + p.suffix);
  if (!n) return null;
  const notas = [n.raiz, n.tercera, n.quinta, /7|Δ|maj/i.test(p.suffix) ? n.septima : null].filter((x): x is number => x !== null);
  const slash = acorde.indexOf('/');
  const bajo = slash === -1 ? null : keyToChromaticIndex(acorde.slice(slash + 1));
  return { raiz: n.raiz, notas: [...new Set(notas)], quinta: n.quinta, bajo };
}

/** Cuerdas del bajo de 4, de grave a aguda, con la clase de nota de la cuerda al aire. */
export const CUERDAS_BAJO = [
  { nombre: 'E', pc: 4 },
  { nombre: 'A', pc: 9 },
  { nombre: 'D', pc: 2 },
  { nombre: 'G', pc: 7 },
] as const;

export interface PosicionBajo { cuerda: number; traste: number; rol: 'raiz' | 'quinta' | 'octava' }

/** Raíz en la cuerda más grave que la alcance antes del traste 7, su quinta y su octava (patrón básico de bajista). */
export function posicionesDeBajo(acorde: string): PosicionBajo[] | null {
  const n = notasParaDibujar(acorde);
  if (!n) return null;
  const raizNota = n.bajo ?? n.raiz;
  const fretEn = (cuerda: number, pc: number) => (pc - CUERDAS_BAJO[cuerda].pc + 12) % 12;
  const cuerdaRaiz = fretEn(0, raizNota) <= 7 ? 0 : 1;
  const trasteRaiz = fretEn(cuerdaRaiz, raizNota);
  const quintaPc = (raizNota + (n.quinta - n.raiz + 12) % 12) % 12;
  const pos: PosicionBajo[] = [{ cuerda: cuerdaRaiz, traste: trasteRaiz, rol: 'raiz' }];
  if (cuerdaRaiz + 1 < 4) {
    pos.push({ cuerda: cuerdaRaiz + 1, traste: fretEn(cuerdaRaiz + 1, quintaPc), rol: 'quinta' });
    if (cuerdaRaiz + 2 < 4) pos.push({ cuerda: cuerdaRaiz + 2, traste: fretEn(cuerdaRaiz + 2, raizNota), rol: 'octava' });
  }
  return pos;
}

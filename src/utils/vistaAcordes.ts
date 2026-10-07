import { keyToChromaticIndex, parseRootNote } from './chordUtils';
import { notasDelAcorde, analizarArmonia, type Funcion, type Tonalidad } from './teoriaArmonica';
import { acordesDelCifrado } from './alineacionAcordes';
import { infoDeAcordeVisible, type InfoChip } from './armoniaVisor';
import { normalizarAcorde } from './lineaTiempoAcordes';

const SOST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type VistaAcorde = 'guitarra' | 'teclado' | 'bajo';

export interface NotasParaDibujar {
  raiz: number;
  /** Clases de nota (0-11) que suenan: raíz, 3.ª, 5.ª y 7.ª si la lleva. */
  notas: number[];
  tercera: number | null;
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
  return { raiz: n.raiz, notas: [...new Set(notas)], tercera: n.tercera, quinta: n.quinta, bajo };
}

/** Cuerdas del bajo de 4, de grave a aguda, con la clase de nota de la cuerda al aire y su altura absoluta (E1 = 28). */
export const CUERDAS_BAJO = [
  { nombre: 'E', pc: 4, base: 28 },
  { nombre: 'A', pc: 9, base: 33 },
  { nombre: 'D', pc: 2, base: 38 },
  { nombre: 'G', pc: 7, base: 43 },
] as const;

export type RolBajo = 'raiz' | 'tercera' | 'quinta' | 'octava' | 'paso';
export interface NotaBajo { cuerda: number; traste: number; rol: RolBajo; pitch: number }

/** Color (token) de cada función armónica, para pintar los diagramas igual que los acordes de la canción. */
export const COLOR_FUNCION: Record<Funcion, string> = {
  T: 'var(--ok)', S: 'var(--acc)', D: 'var(--tentative)', M: 'var(--ink-2)', X: 'var(--ink-2)',
};

const TRASTES_MAX = 12;

function posicionDe(pitch: number, centro: number): { cuerda: number; traste: number } | null {
  let mejor: { cuerda: number; traste: number } | null = null;
  for (let c = 0; c < CUERDAS_BAJO.length; c++) {
    const traste = pitch - CUERDAS_BAJO[c].base;
    if (traste < 0 || traste > TRASTES_MAX) continue;
    if (!mejor || Math.abs(traste - centro) < Math.abs(mejor.traste - centro)) mejor = { cuerda: c, traste };
  }
  return mejor;
}

const pitchSobre = (pc: number, minimo: number) => minimo + (((pc - minimo) % 12) + 12) % 12;

/**
 * Línea de bajo de un compás sobre el acorde: raíz – 3.ª – 5.ª y, al final, una nota de paso que
 * llega por semitono al acorde siguiente (si se conoce; si no, la octava). Es el «walking» básico.
 */
export function lineaDeBajo(acorde: string, siguiente?: string | null): NotaBajo[] | null {
  const n = notasParaDibujar(acorde);
  if (!n) return null;
  const raizPc = n.bajo ?? n.raiz;
  const pitchRaiz = pitchSobre(raizPc, 28);
  const notas: Array<{ pitch: number; rol: RolBajo }> = [{ pitch: pitchRaiz, rol: 'raiz' }];
  let ultimo = pitchRaiz;
  if (n.tercera !== null) { ultimo = pitchSobre(n.tercera, ultimo + 1); notas.push({ pitch: ultimo, rol: 'tercera' }); }
  ultimo = pitchSobre(n.quinta, ultimo + 1);
  notas.push({ pitch: ultimo, rol: 'quinta' });
  const sig = siguiente ? notasParaDibujar(siguiente) : null;
  if (sig && sig.raiz !== n.raiz) {
    const candidatos = [(sig.raiz + 11) % 12, (sig.raiz + 1) % 12].map((pc) => {
      const p = pitchSobre(pc, pitchRaiz - 3);
      return Math.abs(p - ultimo) <= Math.abs(p - 12 - ultimo) ? p : p - 12;
    });
    const paso = candidatos.sort((a, b) => Math.abs(a - ultimo) - Math.abs(b - ultimo))[0];
    notas.push({ pitch: Math.max(28, paso), rol: 'paso' });
  } else {
    notas.push({ pitch: pitchRaiz + 12, rol: 'octava' });
  }
  const salida: NotaBajo[] = [];
  let centro = 2;
  for (const { pitch, rol } of notas) {
    const pos = posicionDe(pitch, centro);
    if (!pos) return null;
    if (rol === 'raiz') centro = pos.traste + 2;
    salida.push({ ...pos, rol, pitch });
  }
  return salida;
}

export interface ContextoAcorde { info: InfoChip | null; siguiente: string | null }

/**
 * Para cada acorde distinto del cifrado visible: su grado y función en la tonalidad y el acorde que más veces
 * le sigue (para la nota de paso del bajo). Todo con los nombres tal como se ven.
 */
export function contextoDeAcordes(textoVisible: string, acordes: string[], tonalidad: Tonalidad | null, transpose = 0): Map<string, ContextoAcorde> {
  const clave = (a: string) => normalizarAcorde(a) ?? a;
  const visible = new Map(acordes.map((a) => [clave(a), a]));
  const seq = acordesDelCifrado(textoVisible).map(clave).filter((k) => visible.has(k));
  const cuentas = new Map<string, Map<string, number>>();
  seq.forEach((k, i) => {
    const sig = seq[i + 1];
    if (!sig || sig === k) return;
    const m = cuentas.get(k) ?? new Map<string, number>();
    m.set(sig, (m.get(sig) ?? 0) + 1);
    cuentas.set(k, m);
  });
  const salida = new Map<string, ContextoAcorde>();
  for (const a of acordes) {
    const k = clave(a);
    const m = cuentas.get(k);
    const mejor = m ? [...m.entries()].sort((x, y) => y[1] - x[1])[0][0] : null;
    const siguiente = mejor ? visible.get(mejor) ?? null : null;
    salida.set(a, { info: tonalidad ? infoDeAcordeVisible(a, tonalidad, transpose, siguiente) : null, siguiente });
  }
  return salida;
}

/** Tonalidad de la canción a partir de su cifrado (para el modo en vivo, que no tiene el análisis completo). */
export function tonalidadDelCifrado(cifrado: string, tonalidadFicha?: string | null): Tonalidad | null {
  const tramos = acordesDelCifrado(cifrado).map((acorde, i) => ({ t0: i, t1: i + 1, acorde }));
  return analizarArmonia(tramos, tonalidadFicha ?? null)?.tonalidad ?? null;
}

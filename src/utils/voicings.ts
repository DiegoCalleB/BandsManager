import { notasParaDibujar } from './vistaAcordes';

/**
 * Cómo se toca un acorde según el nivel de quien lo toca:
 *  · basico — lo mínimo que suena bien (guitarra: power chord · bajo: la raíz · piano: tríada).
 *  · normal — el acorde completo de siempre (guitarra: forma abierta o cejilla · bajo: línea de un compás · piano: con 7.ª).
 *  · pro    — inversiones y nota de paso hacia el acorde siguiente, con el intervalo de cada nota.
 */
export type NivelAcorde = 'basico' | 'normal' | 'pro';

export const NIVELES: NivelAcorde[] = ['basico', 'normal', 'pro'];
export const ETIQUETA_NIVEL: Record<NivelAcorde, string> = { basico: 'Básico', normal: 'Normal', pro: 'Pro' };
export const AYUDA_NIVEL: Record<NivelAcorde, string> = {
  basico: 'Power chords en guitarra, solo la raíz en el bajo y tríadas en el piano.',
  normal: 'El acorde completo, con 7.ª si la lleva.',
  pro: 'Inversiones, intervalos y nota de paso hacia el acorde siguiente.',
};

/** Afinación estándar de la guitarra (de la 6.ª a la 1.ª cuerda) como altura MIDI. */
export const CUERDAS_GUITARRA = [40, 45, 50, 55, 59, 64] as const;
const ULTIMO_TRASTE = 15;

/** Etiqueta de intervalo (en semitonos sobre la raíz): lo que lee un músico de jazz en un diagrama. */
const INTERVALO: Record<number, string> = {
  0: '1', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7',
};
export const etiquetaIntervalo = (pc: number, raiz: number): string => INTERVALO[(((pc - raiz) % 12) + 12) % 12];

/** Una nota colocada en un mástil de guitarra. */
export interface NotaGuitarra {
  /** 0 = 6.ª cuerda (la más grave) … 5 = 1.ª. */
  cuerda: number;
  traste: number;
  /** Clase de nota (0-11). */
  pc: number;
  /** Intervalo sobre la raíz del acorde («1», «♭3», «5», «♭7»…). */
  intervalo: string;
}

export interface FormaGuitarra {
  /** Una entrada por cuerda (6.ª → 1.ª): traste, 0 = al aire, -1 = no se toca. */
  trastes: number[];
  notas: NotaGuitarra[];
  /** Traste más grave de la forma (para rotular «traste 5» si no es posición abierta). */
  base: number;
  /** «Power chord», «Fundamental», «1.ª inversión»… */
  nombre: string;
  /** Posición de la inversión dentro de la lista (0 = fundamental); en power chord, 0. */
  inversion: number;
  /** Cuerda por la que empieza (la más grave que suena), para colocar la nota de paso. */
  graveCuerda: number;
}

const modulo = (n: number) => ((n % 12) + 12) % 12;

function formaDesde(trastes: number[], raiz: number, nombre: string, inversion: number): FormaGuitarra {
  const notas: NotaGuitarra[] = [];
  trastes.forEach((t, cuerda) => {
    if (t < 0) return;
    const pc = modulo(CUERDAS_GUITARRA[cuerda] + t);
    notas.push({ cuerda, traste: t, pc, intervalo: etiquetaIntervalo(pc, raiz) });
  });
  const tocadas = notas.map((n) => n.traste).filter((t) => t > 0);
  return {
    trastes,
    notas,
    base: tocadas.length ? Math.min(...tocadas) : 1,
    nombre,
    inversion,
    graveCuerda: notas[0]?.cuerda ?? 0,
  };
}

/** Power chord: raíz, 5.ª y octava. Se toca desde la 6.ª o la 5.ª cuerda, la que deje la mano más cerca de la cejuela. */
export function powerChord(acorde: string): FormaGuitarra | null {
  const n = notasParaDibujar(acorde);
  if (!n) return null;
  const raiz = n.bajo ?? n.raiz;
  const enSexta = modulo(raiz - 4);
  const enQuinta = modulo(raiz - 9);
  const trastes = enSexta <= enQuinta
    ? [enSexta, enSexta + 2, enSexta + 2, -1, -1, -1]
    : [-1, enQuinta, enQuinta + 2, enQuinta + 2, -1, -1];
  return formaDesde(trastes, n.raiz, 'Power chord', 0);
}

const NOMBRE_INVERSION = ['Fundamental', '1.ª inversión', '2.ª inversión', '3.ª inversión'];

function* permutaciones<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) { yield items; return; }
  for (let i = 0; i < items.length; i++) {
    const resto = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutaciones(resto)) yield [items[i], ...p];
  }
}

/** Grupos de cuerdas contiguas donde caben las voces: de las más agudas (las que mejor suenan) a las más graves. */
const GRUPOS_3 = [[2, 3, 4], [3, 4, 5], [1, 2, 3]];
const GRUPOS_4 = [[2, 3, 4, 5], [1, 2, 3, 4]];

/**
 * Todas las inversiones del acorde (tríada o cuatriada) en cuerdas contiguas, cada una en la posición más cercana a la
 * cejuela. La primera es la fundamental; la inversión se nombra por la nota que queda en el bajo.
 */
export function inversionesGuitarra(acorde: string): FormaGuitarra[] {
  const n = notasParaDibujar(acorde);
  if (!n) return [];
  const tonos = n.notas; // raíz, 3.ª, 5.ª y 7.ª si la lleva, sin repetir
  const grupos = tonos.length >= 4 ? GRUPOS_4 : GRUPOS_3;
  const mejorPorInversion = new Map<number, { trastes: number[]; coste: number }>();

  for (const grupo of grupos) {
    for (const orden of permutaciones(tonos.map((_, i) => i))) {
      // orden[k] = índice del tono que va en la cuerda grupo[k] (k = 0 es la más grave del grupo).
      const opciones = orden.map((idxTono, k) => {
        const base = modulo(tonos[idxTono] - CUERDAS_GUITARRA[grupo[k]]);
        return [base, base + 12].filter((f) => f <= ULTIMO_TRASTE);
      });
      const combos = opciones.reduce<number[][]>((acc, fr) => acc.flatMap((c) => fr.map((f) => [...c, f])), [[]]);
      for (const frets of combos) {
        const pisadas = frets.filter((f) => f > 0);
        if (pisadas.length && Math.max(...pisadas) - Math.min(...pisadas) > 3) continue;
        const trastes = [-1, -1, -1, -1, -1, -1];
        grupo.forEach((cuerda, k) => { trastes[cuerda] = frets[k]; });
        const inversion = orden[0]; // el tono grave decide la inversión
        const coste = Math.max(...frets) * 10 + frets.reduce((a, b) => a + b, 0) + (grupo[0] === 2 || grupo[0] === 3 ? 0 : 5);
        const previo = mejorPorInversion.get(inversion);
        if (!previo || coste < previo.coste) mejorPorInversion.set(inversion, { trastes, coste });
      }
    }
  }
  return [...mejorPorInversion.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([inversion, { trastes }]) => formaDesde(trastes, n.raiz, NOMBRE_INVERSION[inversion] ?? `${inversion}.ª inversión`, inversion));
}

/**
 * Nota de paso cromática hacia el acorde siguiente: el semitono por debajo de su raíz (la que más se usa).
 * null si no hay siguiente o si no cambia la raíz (no hay a dónde ir).
 */
export function notaDePasoHacia(acorde: string, siguiente?: string | null): { pc: number; desde: 'abajo' | 'arriba'; alternativa: number } | null {
  if (!siguiente) return null;
  const a = notasParaDibujar(acorde);
  const s = notasParaDibujar(siguiente);
  if (!a || !s || a.raiz === s.raiz) return null;
  return { pc: modulo(s.raiz - 1), desde: 'abajo', alternativa: modulo(s.raiz + 1) };
}

/**
 * Dónde pisar la nota de paso con la forma elegida: en la cuerda libre (o la más grave de la forma) donde el traste queda
 * más cerca de la mano, para que el diagrama no se estire hasta el traste 9.
 */
export function pasoEnGuitarra(forma: FormaGuitarra, pc: number): NotaGuitarra | null {
  const pisadas = forma.notas.filter((n) => n.traste > 0);
  if (!forma.notas.length) return null;
  const centro = pisadas.length ? pisadas.reduce((a, n) => a + n.traste, 0) / pisadas.length : 1;
  const ocupadas = new Set(forma.notas.map((n) => n.cuerda));
  let mejor: NotaGuitarra | null = null;
  let distancia = Infinity;
  for (let cuerda = 0; cuerda < 6; cuerda++) {
    if (ocupadas.has(cuerda) && cuerda !== forma.graveCuerda) continue;
    const base = modulo(pc - CUERDAS_GUITARRA[cuerda]);
    for (const traste of [base, base + 12]) {
      if (traste > ULTIMO_TRASTE || traste === 0) continue;
      const d = Math.abs(traste - centro) + (cuerda === forma.graveCuerda ? 0 : 0.5);
      if (d < distancia) { distancia = d; mejor = { cuerda, traste, pc, intervalo: 'paso' }; }
    }
  }
  return mejor;
}

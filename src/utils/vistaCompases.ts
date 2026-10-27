import type { Cuadricula } from './cuadriculaCompases';

/**
 * Vista «Compases» del Atril (estilo Chordify / Moises): una casilla por tiempo, el acorde escrito
 * solo donde cambia, varios compases por fila según el ancho y la letra transcrita debajo de su
 * compás. Todo puro: el componente solo pinta.
 */

export interface CasillaTiempo {
  /** Acorde que suena en este tiempo ('N' = sin acorde). */
  acorde: string;
  /** Aquí empieza un acorde nuevo: se escribe su nombre en grande. */
  cambia: boolean;
  /** Primer tiempo de un compás que sigue con el acorde anterior: se recuerda en tenue. */
  recuerda: boolean;
  /** Instante (s) en que empieza el tiempo: tocar la casilla salta ahí. */
  t0: number;
}

export interface CompasVista {
  n: number;
  t0: number;
  bloque: number;
  casillas: CasillaTiempo[];
  /** Letra que se canta en este compás (vacía si no hay). */
  letra: string;
}

export interface FilaCompases {
  /** Bloque al que pertenece la fila; la primera fila de cada bloque lleva su etiqueta. */
  bloque: number;
  primeraDelBloque: boolean;
  compases: CompasVista[];
}

/** Ancho mínimo de una casilla de tiempo (px): por debajo, «F#m7b5» no cabe sin cortarse. */
export const ANCHO_MIN_TIEMPO = 40;
const HUECO_COMPAS = 8;

/**
 * Cuántos compases caben por fila. Solo divisores de una frase (1, 2, 4, 8): con 3 por fila una
 * frase de 4 compases se parte y se pierde la lectura por frases.
 */
export function compasesPorFila(anchoDisponible: number, tiemposPorCompas: number): number {
  const anchoCompas = tiemposPorCompas * ANCHO_MIN_TIEMPO + HUECO_COMPAS;
  let mejor = 1;
  for (const n of [2, 4, 8]) if (n * anchoCompas <= anchoDisponible) mejor = n;
  return mejor;
}

/** Casillas de un compás: el nombre solo aparece cuando el acorde cambia (como en un cifrado de barras). */
export function casillasDeCompas(acordes: string[], t0: number, duracionPulso: number, previo: string | null): CasillaTiempo[] {
  let anterior = previo;
  return acordes.map((acorde, i) => {
    const cambia = acorde !== 'N' && acorde !== anterior;
    const recuerda = i === 0 && !cambia && acorde !== 'N';
    anterior = acorde;
    return { acorde, cambia, recuerda, t0: Math.max(0, t0 + i * duracionPulso) };
  });
}

/**
 * Reparte la letra de cada línea transcrita por sus compases. Whisper da tiempos por línea, no por
 * palabra: cada palabra se coloca en proporción a su longitud dentro de la línea, que basta para
 * saber en qué compás cae.
 */
export function letraPorCompas(c: Cuadricula, lineas: Array<{ t0: number; t1: number; texto: string }> | undefined): string[] {
  const porCompas: string[][] = c.compases.map(() => []);
  if (!lineas?.length) return porCompas.map(() => '');
  // Último compás que empieza antes de t (vale igual para compases regulares y de duración real).
  const indiceEn = (t: number) => {
    let lo = 0, hi = c.compases.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (c.compases[m].t0 <= t) lo = m; else hi = m - 1;
    }
    return lo;
  };
  for (const l of lineas) {
    const palabras = l.texto.trim().split(/\s+/).filter(Boolean);
    if (!palabras.length) continue;
    const total = palabras.reduce((a, p) => a + p.length + 1, 0);
    const dur = Math.max(0, l.t1 - l.t0);
    let acumulado = 0;
    for (const p of palabras) {
      // El instante de la palabra es el de su primera letra.
      porCompas[indiceEn(l.t0 + (acumulado / total) * dur)].push(p);
      acumulado += p.length + 1;
    }
  }
  return porCompas.map((p) => p.join(' '));
}

/** Filas de la vista: cada bloque (A, B…) empieza fila nueva, para que las secciones queden alineadas. */
export function filasDeCompases(c: Cuadricula, porFila: number, letras: string[] = []): FilaCompases[] {
  const filas: FilaCompases[] = [];
  const barra = c.tiemposPorCompas * c.duracionPulso;
  let previo: string | null = null;
  for (const b of c.bloques) {
    const delBloque = c.compases.slice(b.desde - 1, b.hasta);
    for (let i = 0; i < delBloque.length; i += porFila) {
      const compases = delBloque.slice(i, i + porFila).map((k) => {
        const casillas = casillasDeCompas(k.acordes, c.inicioRejilla + (k.n - 1) * barra, c.duracionPulso, previo);
        // Con pulsos reales cada casilla empieza en su pulso, no en un múltiplo del pulso medio.
        if (k.pulsos) casillas.forEach((x, j) => (x.t0 = k.pulsos![j] ?? x.t0));
        previo = k.acordes[k.acordes.length - 1] ?? previo;
        return { n: k.n, t0: k.t0, bloque: b.indice, casillas, letra: letras[k.n - 1] ?? '' };
      });
      filas.push({ bloque: b.indice, primeraDelBloque: i === 0, compases });
    }
  }
  return filas;
}

export interface EtiquetaCompas {
  /** Casilla (0…) donde empieza el nombre y cuántas ocupa hasta el siguiente cambio. */
  desde: number;
  largo: number;
  acorde: string;
  /** Recordatorio del acorde que viene de antes: se pinta en tenue. */
  tenue: boolean;
}

/** Nombres del compás: cada uno se extiende por las casillas vacías que le siguen, así «F#m7b5» no se corta. */
export function etiquetasDeCompas(casillas: CasillaTiempo[]): EtiquetaCompas[] {
  const etiquetas: EtiquetaCompas[] = [];
  casillas.forEach((k, i) => {
    if (k.cambia || k.recuerda) etiquetas.push({ desde: i, largo: 1, acorde: k.acorde, tenue: !k.cambia });
    else if (etiquetas.length && k.acorde !== 'N') etiquetas[etiquetas.length - 1].largo++;
  });
  return etiquetas;
}

/** Nombre de cada sección en las píldoras: «A», «B», «A 2»… para distinguir las que se repiten. */
export function nombresDeBloques(c: Cuadricula): string[] {
  const vistas: Record<string, number> = {};
  return c.bloques.map((b) => {
    vistas[b.letra] = (vistas[b.letra] ?? 0) + 1;
    return vistas[b.letra] === 1 ? b.letra : `${b.letra} ${vistas[b.letra]}`;
  });
}

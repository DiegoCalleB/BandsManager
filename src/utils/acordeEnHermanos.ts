import type { SegmentoAcordeAnalizado } from '../types';
import type { Cuadricula } from './cuadriculaCompases';
import { indiceSegmentoEn, ponerAcordeEnRango } from './lineaTiempoAcordes';

/** Qué se corrigió: en qué compás y tiempo, y cómo sonaba el resto de ese compás antes de corregirlo. */
export interface AcordePuesto {
  /** Número de compás (1…). */
  compas: number;
  /** Tiempo dentro del compás (0 = primero). */
  tiempo: number;
  /** Acordes de ese tiempo hasta el final del compás, tal como estaban antes. */
  antes: string[];
  /** Lo que escribió el usuario. */
  acorde: string;
}

export interface RangoAcorde {
  t0: number;
  t1: number;
}

/** Instante en que empieza el tiempo `j` de un compás (con pulsos reales si la rejilla los tiene). */
function instanteDeTiempo(c: Cuadricula['compases'][number], j: number): number {
  return c.pulsos?.[j] ?? c.t0 + (j * (c.t1 - c.t0)) / Math.max(1, c.acordes.length);
}

/**
 * Los demás compases donde se puede poner el mismo acorde: los de los bloques de la misma letra
 * (misma progresión: verso A, estribillo B…) cuyo final de compás sonaba igual que el que se
 * acaba de corregir. Los tramos ya corregidos a mano no se tocan.
 */
export function compasesHermanos(cuadricula: Cuadricula, segmentos: SegmentoAcordeAnalizado[], puesto: AcordePuesto): RangoAcorde[] {
  const origen = cuadricula.compases.find((c) => c.n === puesto.compas);
  if (!origen) return [];
  const letra = cuadricula.bloques[origen.bloque]?.letra;
  const salida: RangoAcorde[] = [];
  for (const c of cuadricula.compases) {
    if (c.n === puesto.compas || cuadricula.bloques[c.bloque]?.letra !== letra) continue;
    const cola = c.acordes.slice(puesto.tiempo);
    if (cola.length !== puesto.antes.length || cola.some((a, i) => a !== puesto.antes[i])) continue;
    const t0 = instanteDeTiempo(c, puesto.tiempo);
    const i = indiceSegmentoEn(segmentos, t0 + 1e-3);
    if (i >= 0 && segmentos[i].editado) continue;
    salida.push({ t0, t1: c.t1 });
  }
  return salida;
}

/**
 * Pone el mismo acorde en todos esos rangos de una vez.
 * @returns Los tramos nuevos y en cuántos rangos cambió algo.
 */
export function ponerAcordeEnHermanos(segmentos: SegmentoAcordeAnalizado[], rangos: RangoAcorde[], acorde: string): { segmentos: SegmentoAcordeAnalizado[]; cambiados: number } {
  let actual = segmentos;
  let cambiados = 0;
  for (const r of rangos) {
    const siguiente = ponerAcordeEnRango(actual, r.t0, r.t1, acorde);
    if (siguiente) { actual = siguiente; cambiados++; }
  }
  return { segmentos: actual, cambiados };
}

import type { SegmentoAcordeAnalizado } from '../types';
import { moverFrontera } from './lineaTiempoAcordes';

/** Un cambio de acorde que el usuario acaba de mover: qué cambio era y cuánto se desplazó. */
export interface Movimiento {
  acorde: string;
  previo: string;
  /** Segundos que se movió (positivo = más tarde). */
  delta: number;
  /** Instante en que quedó el cambio movido. */
  t0: number;
}

export interface RangoTiempo {
  desde: number;
  hasta: number;
}

/** Qué frontera cambió entre `antes` y `despues` (la primera que difiere), o null si ninguna. */
export function movimientoHecho(antes: SegmentoAcordeAnalizado[], despues: SegmentoAcordeAnalizado[]): Movimiento | null {
  for (let j = 1; j < despues.length && j < antes.length; j++) {
    const delta = despues[j].t0 - antes[j].t0;
    if (Math.abs(delta) > 1e-6) return { acorde: despues[j].acorde, previo: despues[j - 1].acorde, delta, t0: despues[j].t0 };
  }
  return null;
}

/** Índices de los demás cambios del rango que son el mismo cambio (mismo acorde entrando tras el mismo previo). */
export function cambiosHermanos(segmentos: SegmentoAcordeAnalizado[], mov: Movimiento, rango: RangoTiempo, excepto: number): number[] {
  const hermanos: number[] = [];
  for (let k = 1; k < segmentos.length; k++) {
    const s = segmentos[k];
    if (Math.abs(s.t0 - excepto) < 1e-6 || s.t0 < rango.desde || s.t0 >= rango.hasta) continue;
    if (s.acorde === mov.acorde && segmentos[k - 1].acorde === mov.previo) hermanos.push(k);
  }
  return hermanos;
}

/**
 * Aplica el mismo desplazamiento a los cambios hermanos del rango (un bloque entero que llega siempre
 * antes o después del pulso se arregla de una vez). Devuelve los tramos y cuántos cambios se movieron.
 */
export function moverHermanos(segmentos: SegmentoAcordeAnalizado[], mov: Movimiento, rango: RangoTiempo, excepto: number): { segmentos: SegmentoAcordeAnalizado[]; movidos: number } {
  let actual = segmentos;
  let movidos = 0;
  for (const k of cambiosHermanos(segmentos, mov, rango, excepto)) {
    const siguiente = moverFrontera(actual, k, actual[k].t0 + mov.delta);
    if (siguiente !== actual) { actual = siguiente; movidos++; }
  }
  return { segmentos: actual, movidos };
}

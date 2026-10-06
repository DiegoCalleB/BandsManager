import type { SegmentoAcordeAnalizado } from '../types';

/** Índice del segmento que contiene el instante `t` (s), o -1 si no hay ninguno. Búsqueda binaria. */
export function indiceSegmentoEn(segmentos: SegmentoAcordeAnalizado[], t: number): number {
  let lo = 0;
  let hi = segmentos.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = segmentos[mid];
    if (t < s.t0) hi = mid - 1;
    else if (t >= s.t1) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/** Siguiente segmento con acorde real (salta los «N» sin acorde claro), o -1. */
export function siguienteAcordeReal(segmentos: SegmentoAcordeAnalizado[], desde: number): number {
  for (let i = Math.max(0, desde + 1); i < segmentos.length; i++) {
    if (segmentos[i].acorde !== 'N') return i;
  }
  return -1;
}

export interface RangoBucle {
  desde: number; // s
  hasta: number; // s
}

/** Bucle que cubre desde el segmento `a` hasta el `b` (en cualquier orden), ambos incluidos. */
export function rangoBucle(segmentos: SegmentoAcordeAnalizado[], a: number, b: number): RangoBucle | null {
  if (!segmentos[a] || !segmentos[b]) return null;
  const i = Math.min(a, b);
  const j = Math.max(a, b);
  return { desde: segmentos[i].t0, hasta: segmentos[j].t1 };
}

/**
 * Si el cursor ha pasado el final del bucle devuelve el instante al que hay que volver; si no, null.
 * Margen de 20 ms para no quedarse corto por el redondeo del reloj del audio.
 */
export function saltoDeBucle(bucle: RangoBucle | null, t: number): number | null {
  if (!bucle) return null;
  return t >= bucle.hasta - 0.02 ? bucle.desde : null;
}

/** Cambia un acorde a mano y marca el segmento como editado (la edición manda sobre el análisis). */
export function corregirAcorde(
  segmentos: SegmentoAcordeAnalizado[],
  indice: number,
  acorde: string
): SegmentoAcordeAnalizado[] {
  return segmentos.map((s, i) => (i === indice ? { ...s, acorde, confianza: 1, editado: true } : s));
}

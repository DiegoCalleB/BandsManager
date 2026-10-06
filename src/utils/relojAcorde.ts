/**
 * Estado del «reloj» de un acorde del cifrado en el instante `t`: cuánto ha transcurrido de su
 * duración (entre su instante y el del acorde siguiente) y cuánto falta para el cambio.
 */

/** Último tramo en el que se avisa del cambio (s): el mismo que usa el aro grande de la cabecera. */
export const AVISO_CAMBIO = 0.8;

export interface EstadoReloj {
  /** 0-1: fracción transcurrida del acorde. */
  progreso: number;
  /** Segundos que faltan para el siguiente acorde. */
  restante: number;
  /** true en el último tramo: «ya viene el cambio». */
  avisando: boolean;
}

export function estadoReloj(tiempos: number[], k: number, t: number, duracionTotal: number): EstadoReloj | null {
  const inicio = tiempos[k];
  if (inicio === undefined) return null;
  const fin = tiempos[k + 1] ?? Math.max(duracionTotal, inicio + 0.5);
  const dur = Math.max(fin - inicio, 0.001);
  const progreso = Math.min(1, Math.max(0, (t - inicio) / dur));
  const restante = Math.max(0, fin - t);
  return { progreso, restante, avisando: restante <= AVISO_CAMBIO };
}

/** Grados (0-360) del barrido del reloj para un progreso 0-1. */
export const gradosDeProgreso = (progreso: number): number => Math.round(Math.min(1, Math.max(0, progreso)) * 3600) / 10;

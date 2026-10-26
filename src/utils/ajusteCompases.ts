import type { AjusteCompases, Cuadricula, MotivoSinCuadricula } from './cuadriculaCompases';

/** Correcciones rápidas de la rejilla de compases: puro, para que el componente solo pinte. */

const PAUSA_MAX_MS = 2000;
const TOQUES_MAX = 8;

/** Añade un toque (ms) al ritmo que lleva el músico; si pasó una pausa larga, empieza de cero. */
export function sumarToque(toques: number[], ahora: number): number[] {
  const previos = toques.length && ahora - toques[toques.length - 1] > PAUSA_MAX_MS ? [] : toques;
  return [...previos, ahora].slice(-TOQUES_MAX);
}

/** BPM de los toques (mediana de los intervalos, resistente a un toque flojo); null con menos de 3 toques. */
export function bpmDeToques(toques: number[]): number | null {
  if (toques.length < 3) return null;
  const dt = toques.slice(1).map((t, i) => t - toques[i]).sort((a, b) => a - b);
  const mediana = dt[Math.floor(dt.length / 2)];
  const bpm = 60000 / mediana;
  return bpm >= 40 && bpm <= 240 ? Math.round(bpm * 10) / 10 : null;
}

/** Ajuste que desplaza la rejilla `pulsos` tiempos (negativo = antes): el compás 1 se mueve sin tocar el tempo. */
export function desplazar(c: Cuadricula, previo: AjusteCompases, pulsos: number): AjusteCompases {
  return { ...previo, inicio: c.inicioRejilla + pulsos * c.duracionPulso };
}

/** Ajuste que dobla o parte el tempo (el error más común: el detector coge la mitad o el doble). */
export function escalarTempo(c: Cuadricula, previo: AjusteCompases, factor: 0.5 | 2): AjusteCompases | null {
  const bpm = c.bpm * factor;
  return bpm >= 40 && bpm <= 240 ? { ...previo, bpm: Math.round(bpm * 10) / 10, inicio: c.inicioRejilla } : null;
}

const MOTIVOS: Record<MotivoSinCuadricula, string> = {
  "sin-bpm": "No hay BPM ni pulso medido. Toca el pulso con «Tap» (3 toques o más) o pon el BPM en la ficha.",
  "pista-corta": "La pista dura menos de 8 s: no da para dibujar compases.",
  "pocos-compases": "Con este BPM salen menos de 4 compases. Prueba ½× / 2× o «Tap».",
};
const CAUSAS = {
  "pocos-acordes": "Hay muy pocos cambios de acorde para fijar el compás, así que va aproximado.",
  "no-encaja": "Los cambios de acorde no caen en un compás regular, así que va aproximado.",
} as const;

/**
 * Explica en una línea por qué no hay compases o por qué son aproximados.
 * @returns Texto o null si la rejilla es firme.
 */
export function mensajeCompases(motivo: MotivoSinCuadricula | undefined, cuadricula: Cuadricula | null): string | null {
  if (!cuadricula) return motivo ? MOTIVOS[motivo] : null;
  return cuadricula.aproximada && cuadricula.causa ? `${CAUSAS[cuadricula.causa]} Corrígelos con los botones.` : null;
}

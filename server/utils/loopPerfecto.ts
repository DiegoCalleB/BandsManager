/**
 * Dónde cerrar el bucle de un Reel.
 *
 * El cruce de `planearRenderClip` mezcla el final con el principio, pero si el corte cae en mitad
 * de un golpe fuerte y el bucle vuelve a empezar en un hueco (o al revés), se nota el salto de
 * energía aunque la imagen enlace. Aquí se elige, dentro de un margen pequeño, la duración cuyo
 * final se parece más en nivel de volumen al punto donde el bucle vuelve a arrancar.
 */
import type { PuntoEnergia } from "./audioEnergy.js";
import { FUNDIDO_LOOP_SEG, MIN_DURACION_LOOP_SEG } from "./clipFiltros.js";

const PASO_SEG = 0.1;
/** Ventana de volumen que se compara a cada lado del empalme. */
const VENTANA_SEG = 0.4;
/** Lo que cuesta alejarse de la duración pedida, en dB por segundo: a igualdad de empalme gana el corte más cercano. */
const COSTE_DB_POR_SEG = 4;

function nivelMedio(curva: PuntoEnergia[], desde: number, hasta: number): number | null {
  const puntos = curva.filter((p) => p.t >= desde && p.t < hasta);
  if (!puntos.length) return null;
  return puntos.reduce((s, p) => s + p.db, 0) / puntos.length;
}

export interface OpcionesLoop {
  /** Segundo del fichero donde empieza el clip. */
  inicio: number;
  /** Duración pedida por el usuario. */
  duracion: number;
  /** Cuánto se puede alargar o acortar. Tiene que caber en el margen que se descargó. */
  margen?: number;
  /** Último segundo del que hay material en el fichero. */
  finDisponible?: number;
}

/**
 * Duración (s) con la que el final del clip mejor enlaza con su principio. Si no hay curva de
 * volumen o ninguna candidata es mejor que la pedida, devuelve la pedida.
 */
export function elegirDuracionDeLoop(curva: PuntoEnergia[], o: OpcionesLoop): number {
  const margen = o.margen ?? 1.5;
  // El bucle vuelve a arrancar justo después de la cabeza que se funde: ahí es donde debe enlazar.
  const referencia = nivelMedio(curva, o.inicio + FUNDIDO_LOOP_SEG, o.inicio + FUNDIDO_LOOP_SEG + VENTANA_SEG);
  if (referencia === null) return o.duracion;

  let mejor = o.duracion;
  let mejorCoste = Infinity;
  for (let delta = -margen; delta <= margen + 1e-9; delta += PASO_SEG) {
    const d = Math.round((o.duracion + delta) * 10) / 10;
    if (d < MIN_DURACION_LOOP_SEG + 2 * FUNDIDO_LOOP_SEG) continue;
    const fin = o.inicio + d;
    if (o.finDisponible !== undefined && fin > o.finDisponible) continue;
    const nivelFinal = nivelMedio(curva, fin - VENTANA_SEG, fin);
    if (nivelFinal === null) continue;
    const coste = Math.abs(nivelFinal - referencia) + COSTE_DB_POR_SEG * Math.abs(delta);
    if (coste < mejorCoste - 1e-9) {
      mejorCoste = coste;
      mejor = d;
    }
  }
  return mejor;
}

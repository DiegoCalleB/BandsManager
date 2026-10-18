/**
 * Rejilla de pulsos y compases de un tramo, para montar al ritmo real de la canción.
 *
 * El BPM y los onsets salen de `audioKey.ts` (flujo espectral). Aquí solo se coloca la rejilla:
 * con el periodo fijado por el BPM, la fase es la que hace coincidir más onsets con un pulso.
 * Compás = cada 4 pulsos desde el primero (4/4; la fase del compás es aproximada).
 */

/** Tolerancia para contar un onset como "en el pulso" al buscar la fase. */
const TOLERANCIA_FASE_SEG = 0.06;
const PASOS_FASE = 50;
/** Cuántos flashes como mucho: cada uno añade un término a la expresión de ffmpeg. */
const MAX_FLASHES = 40;
const DURACION_FLASH_SEG = 0.12;

export interface Rejilla {
  /** Pulsos en segundos relativos al inicio del tramo. */
  pulsos: number[];
  /** Primer pulso de cada compás (4/4). */
  compases: number[];
}

/**
 * @param onsets segundos absolutos del fichero
 * @param desde  inicio del tramo en el fichero
 * @param hasta  fin del tramo en el fichero
 */
export function rejillaDeBeats(onsets: number[], bpm: number | null, desde: number, hasta: number): Rejilla {
  if (!bpm || bpm <= 0 || onsets.length === 0 || hasta <= desde) return { pulsos: [], compases: [] };
  const periodo = 60 / bpm;

  // Cada onset cercano a un pulso suma más cuanto más cerca está: con solo contar coincidencias,
  // todas las fases a menos de la tolerancia empatan y ganaría la primera, no la centrada.
  let mejorFase = 0;
  let mejorPuntuacion = -1;
  for (let i = 0; i < PASOS_FASE; i++) {
    const fase = (i / PASOS_FASE) * periodo;
    let puntuacion = 0;
    for (const t of onsets) {
      const resto = (((t - fase) % periodo) + periodo) % periodo;
      const distancia = Math.min(resto, periodo - resto);
      if (distancia <= TOLERANCIA_FASE_SEG) puntuacion += TOLERANCIA_FASE_SEG - distancia;
    }
    if (puntuacion > mejorPuntuacion) {
      mejorPuntuacion = puntuacion;
      mejorFase = fase;
    }
  }

  const pulsos: number[] = [];
  for (let t = mejorFase + Math.ceil((desde - mejorFase) / periodo) * periodo; t <= hasta + 1e-9; t += periodo) {
    pulsos.push(Math.round((t - desde) * 1000) / 1000);
  }
  return { pulsos, compases: pulsos.filter((_, i) => i % 4 === 0) };
}

/** El pulso más cercano a `t` si está a menos de `tolerancia`; si no, `t` tal cual. */
export function ajustarAlBeat(t: number, pulsos: number[], tolerancia = 0.25): number {
  let mejor = t;
  let distancia = tolerancia;
  for (const p of pulsos) {
    const d = Math.abs(p - t);
    if (d <= distancia) {
      distancia = d;
      mejor = p;
    }
  }
  return mejor;
}

/**
 * Filtro `eq` que da un golpe de luz breve en cada instante de `golpes` (segundos del clip).
 * `eval=frame` es imprescindible: sin él ffmpeg evalúa la expresión una sola vez (en t=0) y
 * aclara el vídeo ENTERO, que es lo que hacía el beat-drop anterior.
 */
export function expresionFlash(golpes: number[]): string {
  const elegidos = golpes.slice(0, MAX_FLASHES);
  if (!elegidos.length) return "";
  const suma = elegidos.map((t) => `between(t,${t.toFixed(3)},${(t + DURACION_FLASH_SEG).toFixed(3)})`).join("+");
  return `eq=brightness='if(${suma},0.07,0)':contrast='if(${suma},1.10,1)':eval=frame`;
}

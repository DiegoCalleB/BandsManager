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

/** Primer «1» de verdad: en una rejilla del audio el compás 1 puede ser una anacrusa completada hacia atrás. */
const primerUno = (c: Cuadricula) => (c.inicioRejilla < 0 && c.compases.length > 1 ? c.compases[1].t0 : c.compases[0]?.t0 ?? c.inicioRejilla);

/** Ajuste que desplaza la rejilla `pulsos` tiempos (negativo = antes): el compás 1 se mueve sin tocar el tempo. */
export function desplazar(c: Cuadricula, previo: AjusteCompases, pulsos: number): AjusteCompases {
  if (!c.delAudio) return { ...previo, inicio: c.inicioRejilla + pulsos * c.duracionPulso };
  // Con pulsos reales se salta al pulso vecino de verdad, no a un múltiplo del pulso medio.
  const todos = c.compases.flatMap((k) => k.pulsos ?? []);
  const uno = primerUno(c);
  const i = todos.reduce((mejor, t, j) => (Math.abs(t - uno) < Math.abs(todos[mejor] - uno) ? j : mejor), 0);
  return { ...previo, inicio: todos[Math.min(todos.length - 1, Math.max(0, i + pulsos))] ?? uno };
}

/** Ajuste que dobla o parte el tempo (el error más común: el detector coge la mitad o el doble). */
export function escalarTempo(c: Cuadricula, previo: AjusteCompases, factor: 0.5 | 2): AjusteCompases | null {
  const bpm = c.bpm * factor;
  return bpm >= 40 && bpm <= 240 ? { ...previo, bpm: Math.round(bpm * 10) / 10, inicio: c.delAudio ? primerUno(c) : c.inicioRejilla } : null;
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

/**
 * Valida el ajuste que llega del cliente y lo deja limpio (solo claves conocidas y en rango).
 * @returns El ajuste saneado (vacío = sin ajuste) o el error a mostrar.
 */
export function validarAjusteCompases(crudo: unknown): { ajuste: AjusteCompases } | { error: string } {
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return { error: 'El ajuste de compases no es válido.' };
  const { bpm, inicio, tiempos } = crudo as Record<string, unknown>;
  const ajuste: AjusteCompases = {};
  if (bpm !== undefined) {
    if (typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm < 40 || bpm > 240) return { error: 'El BPM debe estar entre 40 y 240.' };
    ajuste.bpm = Math.round(bpm * 10) / 10;
  }
  if (inicio !== undefined) {
    if (typeof inicio !== 'number' || !Number.isFinite(inicio) || inicio < 0 || inicio > 36000) return { error: 'El inicio del compás 1 no es válido.' };
    ajuste.inicio = Math.round(inicio * 1000) / 1000;
  }
  if (tiempos !== undefined) {
    if (tiempos !== 3 && tiempos !== 4) return { error: 'Los tiempos por compás deben ser 3 o 4.' };
    ajuste.tiempos = tiempos;
  }
  return { ajuste };
}

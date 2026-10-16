/**
 * Ducking del Atril: la canción baja un instante mientras suena un acorde de muestra y vuelve sola.
 * Es un factor 0-1 global; quien reproduce la canción (stems o audio principal) lo multiplica a su volumen.
 */
const NIVEL_BAJO = 0.3;
const RAMPA_VUELTA = [0.55, 0.8, 1];
const PASO_RAMPA_MS = 60;

let factor = 1;
let temporizador: ReturnType<typeof setTimeout> | undefined;
const oyentes = new Set<() => void>();

const poner = (f: number): void => {
  factor = f;
  oyentes.forEach((fn) => fn());
};

/** Multiplicador actual del volumen de la canción (1 = sin ducking). */
export const factorDucking = (): number => factor;

/** Avisa cada vez que cambia el factor; devuelve la función para dejar de escuchar. */
export function suscribirDucking(fn: () => void): () => void {
  oyentes.add(fn);
  return () => { oyentes.delete(fn); };
}

/** Baja la canción `ms` milisegundos y la devuelve a su volumen con una rampa corta (si se repite, reinicia la cuenta). */
export function bajarCancion(ms: number): void {
  clearTimeout(temporizador);
  poner(NIVEL_BAJO);
  const subir = (i: number): void => {
    poner(RAMPA_VUELTA[i]);
    if (i < RAMPA_VUELTA.length - 1) temporizador = setTimeout(() => subir(i + 1), PASO_RAMPA_MS);
  };
  temporizador = setTimeout(() => subir(0), ms);
}

/** `window` con el constructor prefijado de Safari antiguo, sin recurrir a `any`. */
type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Constructor de `AudioContext` del navegador (con el prefijo `webkit` de Safari antiguo).
 * @returns La clase, o `undefined` si no hay navegador (SSR/tests) o no soporta Web Audio.
 */
export const getAudioContextClass = (): typeof AudioContext | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
};

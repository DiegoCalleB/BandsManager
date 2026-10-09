import type { AudioTrack } from '../../types';

/**
 * Color por pista del mezclador de Song Studio (guiño a Iris, diosa del arcoíris).
 * Funciones puras sin dependencias de React: se pueden probar y reutilizar fuera del modal.
 */

// Guiño a Iris (diosa del arcoíris): cada pista se colorea recorriendo el arcoíris en orden
// (rojo, naranja, amarillo, verde, azul, violeta). Por defecto sigue la posición en la
// lista, pero en cuanto el usuario reordena pistas a mano, cada una"congela" su color en
// tr.colorHue para que se lo lleve consigo al moverse — a partir de ahí el arcoíris ya no sale
// perfectamente en orden, y eso es justo lo esperado: gana la posición que elige el usuario.
export const RAINBOW_HUE_STEPS = [355, 28, 50, 135, 215, 280]; // Rojo, Naranja, Amarillo, Verde, Azul, Violeta
// Convierte HSL a hex para poder seguir usando el truco de"hex + 2 dígitos de alpha" que ya
// usa WaveformTrack internamente (color +'40', color +'50'...) sin tener que tocar ese componente.
export const hslToHex = (h: number, s: number, l: number): string => {
  const sat = s / 100,
    light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};
export const getTrackRainbowColor = (tr: AudioTrack, fallbackIndex: number, alphaHex?: string): string => {
  const hue = typeof tr.colorHue === 'number' ? tr.colorHue : RAINBOW_HUE_STEPS[fallbackIndex % RAINBOW_HUE_STEPS.length];
  const hex = hslToHex(hue, 60, 68);
  return alphaHex ? `${hex}${alphaHex}` : hex;
};

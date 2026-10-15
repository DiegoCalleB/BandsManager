// «Tus colores»: una paleta de cartel (fondo + acento) sacada de una imagen, normalmente el logo.
// `paletaDePixeles` es pura (se prueba sin DOM); `paletaDeImagen` la alimenta desde un canvas.
//
// Un logo suele ser un color vivo sobre transparente o blanco: se ignoran los píxeles transparentes
// y los casi blancos/negros/grises, se agrupan los demás por tono y se coge el grupo dominante.
//   fondo  = ese color, oscurecido o aclarado lo justo para que el texto claro/oscuro se lea
//   acento = el siguiente grupo de otro tono; si solo hay uno, su complementario suavizado

import { contraste, luminancia } from './contraste';

type RGB = [number, number, number];

export interface PaletaBanda {
  fondo: string;
  acento: string;
}

export const aHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
export const deHex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function aHsl([r, g, b]: RGB): [number, number, number] {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

function deHsl(h: number, s: number, l: number): RGB {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

const distanciaTono = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

const LUZ_TINTA_CLARA = 0.89;
const MARGEN = 4.8; // por encima del 4,5 que se exige, por el suavizado de las letras

/**
 * Lleva la luminosidad del fondo hasta donde la tinta clara llega a ≥ 4,8:1, oscureciendo poco a
 * poco: así un amarillo se queda en un ocre profundo y un azul apenas se toca. La tinta clara es la
 * que mejor aguanta una foto o un velo, por eso se prefiere a una oscura sobre un fondo claro.
 */
function ajustarFondo(h: number, s: number, l: number): RGB {
  const sat = Math.max(0.35, Math.min(0.85, s));
  let lum = Math.min(l, 0.45);
  for (let rgb = deHsl(h, sat, lum); lum > 0.06; rgb = deHsl(h, sat, (lum -= 0.015))) {
    if (contraste(LUZ_TINTA_CLARA, luminancia(...rgb)) >= MARGEN) return rgb;
  }
  return deHsl(h, sat, 0.06);
}

export function paletaDePixeles(datos: Uint8ClampedArray, paso = 3): PaletaBanda | null {
  // 24 sectores de tono de 15° con su peso, su saturación y su luminosidad medios.
  const SECTORES = 24;
  const grupos = Array.from({ length: SECTORES }, () => ({ peso: 0, s: 0, l: 0, hx: 0, hy: 0 }));
  let validos = 0;
  for (let i = 0; i < datos.length; i += 4 * paso) {
    if (datos[i + 3] < 200) continue; // transparente: es el hueco del logo, no su color
    const [h, s, l] = aHsl([datos[i], datos[i + 1], datos[i + 2]]);
    if (s < 0.22 || l < 0.1 || l > 0.92) continue; // grises, blancos y negros: no dan carácter
    const g = grupos[Math.floor(h / (360 / SECTORES)) % SECTORES];
    const w = s * (1 - Math.abs(l - 0.5)); // los colores vivos y de tono medio pesan más
    g.peso += w;
    g.s += s * w;
    g.l += l * w;
    // El tono se promedia como vector: 359° y 1° están juntos.
    g.hx += Math.cos((h * Math.PI) / 180) * w;
    g.hy += Math.sin((h * Math.PI) / 180) * w;
    validos++;
  }
  if (validos < 20) return null;

  const ordenados = grupos
    .filter((g) => g.peso > 0)
    .map((g) => ({ peso: g.peso, s: g.s / g.peso, l: g.l / g.peso, h: ((Math.atan2(g.hy, g.hx) * 180) / Math.PI + 360) % 360 }))
    .sort((a, b) => b.peso - a.peso);
  const principal = ordenados[0];
  if (!principal) return null;

  const fondo = ajustarFondo(principal.h, principal.s, principal.l);
  const segundo = ordenados.find((g) => distanciaTono(g.h, principal.h) >= 40 && g.peso >= principal.peso * 0.15);
  const acento = segundo
    ? deHsl(segundo.h, Math.max(0.55, segundo.s), 0.62)
    : deHsl((principal.h + 180) % 360, 0.65, 0.62); // sin segundo color: el complementario, claro

  return { fondo: aHex(fondo), acento: aHex(acento) };
}

/** Luminancia relativa de un `#rrggbb` (para comprobar contraste en tests y en el render). */
export const luzDeHex = (h: string) => luminancia(...deHex(h));

const LADO = 96;

/** Paleta de una imagen ya cargada. null si no se puede leer (CORS) o no tiene colores aprovechables. */
export function paletaDeImagen(img: HTMLImageElement): PaletaBanda | null {
  try {
    const c = document.createElement('canvas');
    const k = Math.min(1, LADO / Math.max(img.width, img.height));
    c.width = Math.max(1, Math.round(img.width * k));
    c.height = Math.max(1, Math.round(img.height * k));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return paletaDePixeles(ctx.getImageData(0, 0, c.width, c.height).data, 1);
  } catch (e) {
    console.warn('[Cartel] No se pudo leer la imagen para sacar la paleta (¿CORS?):', e);
    return null;
  }
}

// Cómo cabe la ilustración de IA en la ventana del cartel (el hueco entre las placas de papel).
// Pura: recibe medidas y devuelve qué trozo de la imagen se pinta y dónde.
//
// Normal: «cover» (llena la ventana y recorta lo que sobra, centrado). Si recortar quitara demasiado
// de la imagen —una ilustración vertical de antes, en una ventana apaisada— se pinta ENTERA y centrada,
// con papel a los lados: es mejor un margen que cortar el motivo por la mitad.

import type { Rect } from './layout';

export interface Encaje {
  /** Trozo de la imagen que se pinta. */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Dónde se pinta en el cartel. */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** Como mucho este tanto de la imagen puede quedar fuera al llenar la ventana. */
export const MAX_CORTE = 0.3;

export function encajarImagen(anchoImg: number, altoImg: number, ventana: Rect, maxCorte = MAX_CORTE): Encaje {
  const kCover = Math.max(ventana.w / anchoImg, ventana.h / altoImg);
  // Lo que se ve de la imagen en cada eje al llenar la ventana (1 = entera).
  const visible = Math.min(1, ventana.w / (anchoImg * kCover), ventana.h / (altoImg * kCover));
  if (1 - visible <= maxCorte) {
    const sw = ventana.w / kCover;
    const sh = ventana.h / kCover;
    return { sx: (anchoImg - sw) / 2, sy: (altoImg - sh) / 2, sw, sh, dx: ventana.x, dy: ventana.y, dw: ventana.w, dh: ventana.h };
  }
  const k = Math.min(ventana.w / anchoImg, ventana.h / altoImg);
  const dw = anchoImg * k;
  const dh = altoImg * k;
  return { sx: 0, sy: 0, sw: anchoImg, sh: altoImg, dx: ventana.x + (ventana.w - dw) / 2, dy: ventana.y + (ventana.h - dh) / 2, dw, dh };
}

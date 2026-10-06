export interface PosicionMenu {
  top?: number;
  bottom?: number;
  right: number;
  maxHeight: number;
}

/**
 * Dónde pintar un menú desplegable con `position: fixed` respecto a su botón, sin suponer su alto:
 * se abre hacia el lado con más sitio, anclado por el borde pegado al botón, y se limita su alto al
 * espacio disponible (el menú hace scroll por dentro si no cabe entero).
 */
export function posicionMenu(
  boton: { top: number; bottom: number; right: number },
  ventana: { ancho: number; alto: number },
): PosicionMenu {
  const abajo = ventana.alto - boton.bottom - 14;
  const arriba = boton.top - 14;
  const haciaAbajo = abajo >= 280 || abajo >= arriba;
  return {
    ...(haciaAbajo ? { top: boton.bottom + 6 } : { bottom: ventana.alto - boton.top + 6 }),
    right: Math.max(8, ventana.ancho - boton.right),
    maxHeight: Math.max(140, haciaAbajo ? abajo : arriba),
  };
}

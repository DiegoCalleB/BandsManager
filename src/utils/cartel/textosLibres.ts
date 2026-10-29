// Textos sueltos de la persona («Entrada 8 €», «Con Los Toros»): hasta tres líneas que se colocan en el centro del
// cartel y se mueven, escalan, cambian de letra y de color como cualquier otro bloque. Puro, como el layout.

import { LIBRES } from './ajustesFinos';
import type { LayoutCartel, Medidor } from './layoutBase';

export const MAX_LIBRES = LIBRES.length;
export const MAX_TEXTO_LIBRE = 40;

/** Añade al layout las líneas de los textos sueltos. Cada uno encoge hasta caber en el 84 % del ancho. */
export function anadirLibres(L: LayoutCartel, libres: string[] | undefined, medir: Medidor): LayoutCartel {
  if (!libres?.some((t) => t.trim())) return L;
  const u = L.ancho / 1080;
  const lineas = [...L.lineas];
  libres.slice(0, MAX_LIBRES).forEach((t, i) => {
    const texto = t.trim();
    if (!texto) return;
    let px = Math.round(66 * u);
    while (px > 14 * u && medir(texto, px, 800) > L.ancho * 0.84) px -= 1;
    lineas.push({ texto, x: L.ancho / 2, y: L.alto * 0.44 + i * px * 1.35, px, peso: 800, alinear: 'center', bloque: LIBRES[i], libre: true });
  });
  return { ...L, lineas };
}

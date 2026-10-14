/** Rejilla de 12 columnas: el último widget de cada fila se estira hasta el borde para no dejar huecos. */

const COLUMNAS = 12;

/** Literales completos: Tailwind solo genera las clases que aparecen escritas tal cual. */
const CLASE_COLUMNAS: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

export function claseColumnas(columnas: number): string {
  return CLASE_COLUMNAS[Math.min(COLUMNAS, Math.max(1, Math.round(columnas)))] ?? CLASE_COLUMNAS[COLUMNAS];
}

/**
 * Columnas que ocupa cada widget al pintarlo. La rejilla reparte en orden: si el siguiente no cabe,
 * salta de fila. Al cerrar una fila, su último widget se lleva las columnas que sobraban.
 * No cambia lo guardado: solo cómo se pinta.
 */
export function columnasRellenando(anchos: number[]): number[] {
  const columnas = anchos.map((a) => Math.min(COLUMNAS, Math.max(1, a)));
  let inicioFila = 0;
  let usadas = 0;
  anchos.forEach((_, i) => {
    if (usadas + columnas[i] > COLUMNAS) {
      columnas[i - 1] += COLUMNAS - usadas;
      inicioFila = i;
      usadas = 0;
    }
    usadas += columnas[i];
  });
  if (anchos.length > inicioFila) columnas[anchos.length - 1] += COLUMNAS - usadas;
  return columnas;
}

// Auto-ajuste de tamaño de fuente + reparto en páginas del repertorio imprimible
// (PdfExportModal.tsx). Sustituye la elección manual de 3 tamaños fijos ("gigante"/"grande"/
// "compacto"): el sistema ahora mide la altura real del contenido (inyectada como `measureFn`,
// igual patrón que textFit.ts, para poder testear sin depender de un DOM real) y decide, en este
// orden:
//   1. El tamaño de título más grande de `candidateTitleFontPt` (probados de mayor a menor) tal
//      que el repertorio COMPLETO quepa en una sola página.
//   2. Si ni el tamaño más pequeño de la lista cabe en una página, se calcula el nº mínimo de
//      páginas necesario AL TAMAÑO MÍNIMO — pero el tamaño final no se queda ahí sin más: se
//      busca el candidato más grande que TODAVÍA quepa en ese mismo nº de páginas, para
//      aprovechar el espacio de esas páginas con letra más grande en vez de dejarlas a medias.
//      Sin este segundo paso, un repertorio que a 17pt ocupa, digamos, 1.2 páginas (se redondea a
//      2) se quedaría en letra mínima con cada página medio vacía, cuando un tamaño mayor (que
//      siga necesitando solo 2 páginas) aprovecharía mucho mejor el papel.
//   3. Con el tamaño y el nº de páginas ya fijados, el reparto de canciones entre páginas es
//      EQUILIBRADO por altura (no "llenar la primera al máximo y dejar el resto en la última") —
//      cada corte busca, por bisección, el máximo de items que no exceda ni el objetivo de
//      reparto (altura total / nº de páginas) ni el alto real disponible de una página.
// Los sets suelen verse desde ~2 metros en un escenario: nunca se baja del tamaño mínimo de la
// lista de candidatos solo para caber en menos páginas — se prefiere partir en más páginas.

export interface AutoFitOptions {
  /** Tamaños de título candidatos en pt, de mayor a menor. El último es el mínimo legible a
   *  distancia de escenario — nunca se encoge por debajo de él. */
  candidateTitleFontPt: number[];
  /** Alto disponible en px para el CUERPO de canciones de una página (ya descontados header,
   *  footer, padding y márgenes). */
  pageAvailableHeightPx: number;
}

export interface AutoFitResult {
  /** Tamaño de título elegido (uno de `candidateTitleFontPt`). */
  titleFontPt: number;
  /** Cuántos items (consecutivos, en el orden original) va en cada página. Suma = totalItems. */
  pageItemCounts: number[];
}

/**
 * `measureFn(titleFontPt, fromIndex, toIndexExclusive)` devuelve la altura en px que ocuparían
 * los items en ese rango [fromIndex, toIndexExclusive) si se renderizaran a `titleFontPt`.
 */
export type MeasureRangeFn = (titleFontPt: number, fromIndex: number, toIndexExclusive: number) => number;

export function computeAutoFitPlan(
  totalItems: number,
  measureFn: MeasureRangeFn,
  opts: AutoFitOptions
): AutoFitResult {
  const { candidateTitleFontPt, pageAvailableHeightPx } = opts;
  const minFontPt = candidateTitleFontPt[candidateTitleFontPt.length - 1];

  if (totalItems === 0) {
    return { titleFontPt: candidateTitleFontPt[0], pageItemCounts: [0] };
  }

  // 1. El repertorio completo, ¿cabe en una sola página a alguno de los tamaños candidatos? En
  // el tamaño MÍNIMO se admite un pequeño margen de tolerancia (MIN_SIZE_OVERFLOW_TOLERANCE):
  // sin él, un repertorio que casi cabe pero se pasa por poco (p.ej. una única canción con mucha
  // nota que no llegó a caber del todo) saltaría a una segunda hoja entera para esa canción sola
  // — justo el caso que se pidió evitar. En los tamaños mayores no se da tolerancia: si no caben
  // sin más, hay margen real para probar un tamaño menor antes de aceptar cualquier desborde.
  const MIN_SIZE_OVERFLOW_TOLERANCE = 0.08;
  for (const pt of candidateTitleFontPt) {
    const limit = pt === minFontPt ? pageAvailableHeightPx * (1 + MIN_SIZE_OVERFLOW_TOLERANCE) : pageAvailableHeightPx;
    if (measureFn(pt, 0, totalItems) <= limit) {
      return { titleFontPt: pt, pageItemCounts: [totalItems] };
    }
  }

  // 2. Ni al tamaño mínimo cabe en una página: ese tamaño fija el nº MÍNIMO de páginas
  // necesario. No usarlo tal cual todavía — primero se busca, de mayor a menor, el candidato más
  // grande que SIGA necesitando ese mismo nº de páginas (nunca más), para aprovechar el espacio
  // de esas páginas con la letra más grande posible en vez de quedarse siempre en el mínimo.
  const totalHeightAtMin = measureFn(minFontPt, 0, totalItems);
  const pageCount = Math.max(2, Math.ceil(totalHeightAtMin / pageAvailableHeightPx));

  let titleFontPt = minFontPt;
  let totalHeight = totalHeightAtMin;
  for (const pt of candidateTitleFontPt) {
    const h = pt === minFontPt ? totalHeightAtMin : measureFn(pt, 0, totalItems);
    const neededPages = Math.max(1, Math.ceil(h / pageAvailableHeightPx));
    if (neededPages <= pageCount) {
      titleFontPt = pt;
      totalHeight = h;
      break; // candidateTitleFontPt va de mayor a menor: el primero que cumpla es el más grande posible
    }
  }

  // 3. Con el tamaño y el nº de páginas ya fijados, reparto equilibrado por altura: cada corte
  // busca, por bisección, el máximo de items que no exceda ni el objetivo de reparto (altura
  // total / nº páginas) ni el alto real disponible de una página.
  const targetPerPage = Math.min(totalHeight / pageCount, pageAvailableHeightPx);

  const pageItemCounts: number[] = [];
  let cursor = 0;
  for (let p = 0; p < pageCount - 1 && cursor < totalItems; p++) {
    const remaining = totalItems - cursor;
    // best arranca en 1 para garantizar avanzar siempre al menos un item por página, incluso si
    // ni uno solo cabe cómodo en el objetivo (evita un bucle que nunca consuma `remaining`).
    let lo = 1;
    let hi = remaining;
    let best = 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (measureFn(titleFontPt, cursor, cursor + mid) <= targetPerPage) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    pageItemCounts.push(best);
    cursor += best;
  }
  if (cursor < totalItems) {
    pageItemCounts.push(totalItems - cursor);
  }

  // 4. Red de seguridad: el reparto equilibrado por altura puede aun así dejar la ÚLTIMA página
  // con muy pocos items (p.ej. una sola canción con muchas notas, que no cupo en el objetivo de
  // la página anterior y se queda sola en la siguiente) — una hoja entera casi vacía por un
  // resto pequeño. Si fusionarla con la penúltima página SIGUE cabiendo dentro del alto REAL
  // disponible (no el objetivo equilibrado, que es más estricto), se fusionan; se repite por si
  // el resultado vuelve a quedar disperso. Nunca se fusiona si no cabe de verdad: eso generaría
  // un desborde real de la página en la impresión.
  const SPARSE_LAST_PAGE_RATIO = 0.4;
  while (pageItemCounts.length > 1) {
    const lastCount = pageItemCounts[pageItemCounts.length - 1];
    const avgCount = totalItems / pageItemCounts.length;
    if (lastCount >= avgCount * SPARSE_LAST_PAGE_RATIO) break;

    const secondLastCount = pageItemCounts[pageItemCounts.length - 2];
    const mergedStart = totalItems - lastCount - secondLastCount;
    const mergedHeight = measureFn(titleFontPt, mergedStart, totalItems);
    if (mergedHeight > pageAvailableHeightPx) break;

    pageItemCounts.splice(pageItemCounts.length - 2, 2, secondLastCount + lastCount);
  }

  return { titleFontPt, pageItemCounts };
}

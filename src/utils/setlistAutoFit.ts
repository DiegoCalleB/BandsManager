// Auto-ajuste de tamaño de fuente + reparto en páginas del repertorio imprimible
// (PdfExportModal.tsx). Sustituye la elección manual de 3 tamaños fijos ("gigante"/"grande"/
// "compacto"): el sistema ahora mide la altura real del contenido (inyectada como `measureFn`,
// igual patrón que textFit.ts, para poder testear sin depender de un DOM real) y decide, en este
// orden:
//   1. El tamaño de título más grande de `candidateTitleFontPt` (probados de mayor a menor) tal
//      que el repertorio COMPLETO quepa en una sola página.
//   2. Si ni el tamaño más pequeño de la lista cabe en una página, el repertorio se reparte en
//      el mínimo número de páginas necesario, EQUILIBRADAS por altura (no "llenar la primera al
//      máximo y dejar el resto en la última") — cada corte busca, por bisección, el máximo de
//      items que no exceda ni el objetivo de reparto (altura total / nº de páginas) ni el alto
//      real disponible de una página.
// Los sets suelen verse desde ~2 metros en un escenario: nunca se baja del tamaño mínimo de la
// lista de candidatos solo para caber en una página — se prefiere partir en más páginas.

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

  // 1. El repertorio completo, ¿cabe en una sola página a alguno de los tamaños candidatos?
  for (const pt of candidateTitleFontPt) {
    if (measureFn(pt, 0, totalItems) <= pageAvailableHeightPx) {
      return { titleFontPt: pt, pageItemCounts: [totalItems] };
    }
  }

  // 2. Ni al tamaño mínimo cabe en una página: repartir en el mínimo nº de páginas necesario,
  // equilibradas por altura. targetPerPage es el reparto "ideal" (altura total / nº páginas);
  // nunca se supera además el alto real disponible de una página.
  const totalHeight = measureFn(minFontPt, 0, totalItems);
  const pageCount = Math.max(2, Math.ceil(totalHeight / pageAvailableHeightPx));
  const targetPerPage = Math.min(totalHeight / pageCount, pageAvailableHeightPx);

  const pageItemCounts: number[] = [];
  let cursor = 0;
  for (let p = 0; p < pageCount - 1 && cursor < totalItems; p++) {
    const remaining = totalItems - cursor;
    // Bisección: mayor `count` tal que los items [cursor, cursor+count) quepan en targetPerPage.
    // best arranca en 1 para garantizar avanzar siempre al menos un item por página, incluso si
    // ni uno solo cabe cómodo en el objetivo (evita un bucle que nunca consuma `remaining`).
    let lo = 1;
    let hi = remaining;
    let best = 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (measureFn(minFontPt, cursor, cursor + mid) <= targetPerPage) {
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

  return { titleFontPt: minFontPt, pageItemCounts };
}

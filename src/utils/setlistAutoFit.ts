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
  /** Tamaños de título candidatos en pt, de mayor a menor. El último es el mínimo "ideal",
   *  pensado para leerse cómodamente a distancia de escenario (~2m). El reparto en VARIAS
   *  páginas (paso 2 y siguientes) nunca baja de aquí. */
  candidateTitleFontPt: number[];
  /** Alto disponible en px para el CUERPO de canciones de una página (ya descontados header,
   *  footer, padding y márgenes). */
  pageAvailableHeightPx: number;
  /** Tamaño de ÚLTIMO RECURSO, más pequeño que el mínimo "ideal" de `candidateTitleFontPt` —
   *  aceptado explícitamente por el usuario como trade-off (letra algo más pequeña a cambio de
   *  ver el repertorio entero de un vistazo). Se prueba SOLO después de que ningún candidato
   *  normal quepa en una sola página: si con este tamaño de emergencia SÍ cabe, se prefiere
   *  sobre repartir en 2+ páginas al tamaño mínimo ideal. Si tampoco cabe con él, el algoritmo
   *  sigue su curso normal (reparto en varias páginas, siempre al tamaño ideal — nunca usa este
   *  tamaño para repartir en más de 1 página, solo como último intento de caber en 1 sola).
   *  Opcional: si se omite, el comportamiento es idéntico al anterior. */
  emergencyFontPt?: number;
}

export interface AutoFitResult {
  /** Tamaño de título elegido (uno de `candidateTitleFontPt`). */
  titleFontPt: number;
  /** Cuántos items (consecutivos, en el orden original) va en cada página. Suma = totalItems. */
  pageItemCounts: number[];
  /**
   * Presente SOLO cuando el resultado principal usó `emergencyFontPt` para caber en 1 sola
   * página — es la decisión AMBIGUA que un músico real dudaría al montar el repertorio a mano
   * ("¿lo aprieto en una hoja o lo reparto en dos con letra más grande?"). Contiene la
   * alternativa de repartir en varias páginas al tamaño ideal (nunca por debajo del mínimo
   * legible), para que la UI pueda ofrecer ambas opciones y dejar elegir al usuario en vez de
   * decidir por él en el único caso donde de verdad hay una disyuntiva real.
   */
  alternativePlan?: { titleFontPt: number; pageItemCounts: number[] };
}

/**
 * `measureFn(titleFontPt, fromIndex, toIndexExclusive)` devuelve la altura en px que ocuparían
 * los items en ese rango [fromIndex, toIndexExclusive) si se renderizaran a `titleFontPt`.
 */
export type MeasureRangeFn = (titleFontPt: number, fromIndex: number, toIndexExclusive: number) => number;

// Pasos 2-4 del algoritmo (ver cabecera del archivo): dado que NINGÚN tamaño candidato (ideal)
// cabe en una sola página, decide cuántas páginas hacen falta al tamaño mínimo, sube el tamaño
// tanto como se pueda sin necesitar más páginas, reparte equilibrado por altura y aplica la red
// de seguridad/rebalanceo de la última página dispersa. Extraído a función propia porque hace
// falta calcularlo DOS veces cuando hay un `emergencyFontPt` que sí permite 1 sola página: una
// vez como resultado principal (si se prefiere 1 hoja) y otra como `alternativePlan` (repartido
// en varias hojas al tamaño ideal) para que la UI pueda ofrecer ambas opciones.
function computeMultiPagePlan(
  totalItems: number,
  measureFn: MeasureRangeFn,
  candidateTitleFontPt: number[],
  pageAvailableHeightPx: number
): AutoFitResult {
  const minFontPt = candidateTitleFontPt[candidateTitleFontPt.length - 1];

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
  // Se permite una pequeña tolerancia (5px) en el merge para absorber variaciones por notas
  // particularmente pesadas — el mismo espíritu que MIN_SIZE_OVERFLOW_TOLERANCE_PX, pero aquí
  // midiendo dos páginas juntas, no una sola.
  const SPARSE_LAST_PAGE_RATIO = 0.4;
  const MERGE_TOLERANCE_PX = 5;
  const mergeLimitPx = pageAvailableHeightPx + MERGE_TOLERANCE_PX;
  while (pageItemCounts.length > 1) {
    const lastIdx = pageItemCounts.length - 1;
    const lastCount = pageItemCounts[lastIdx];
    const avgCount = totalItems / pageItemCounts.length;
    // Si la última página tiene solo 1 item, SIEMPRE intentar mejorar (nunca dejar una
    // canción sola en una página). Si tiene más, solo actuar si es dispersa (< 40% del promedio).
    if (lastCount > 1 && lastCount >= avgCount * SPARSE_LAST_PAGE_RATIO) break;

    const secondLastCount = pageItemCounts[lastIdx - 1];
    const mergedStart = totalItems - lastCount - secondLastCount;
    const mergedHeight = measureFn(titleFontPt, mergedStart, totalItems);
    if (mergedHeight <= mergeLimitPx) {
      // Cabe todo junto en la penúltima página: fusionar sin más.
      pageItemCounts.splice(lastIdx - 1, 2, secondLastCount + lastCount);
      continue;
    }

    // No cabe fusionado del todo — con solo 2 páginas totales esto es EXACTAMENTE probar si
    // cabe el repertorio entero en 1 sola hoja, que ya sabemos que no (por eso hay 2 páginas):
    // el merge de arriba nunca podría activarse en ese caso, dejando la canción pesada sola
    // para siempre. La alternativa real es REBALANCEAR: buscar, entre las dos páginas juntas,
    // el punto de corte que deje el MÁXIMO nº de canciones posible en la última página (no el
    // que más iguale la ALTURA — con una canción muy pesada, igualar altura sigue dejando pocas
    // canciones en la última página; lo que de verdad evita "canción sola" es maximizar cuántas
    // caben ahí), exigiendo siempre que ambas páginas quepan dentro del alto real disponible.
    const combinedCount = secondLastCount + lastCount;
    let bestSplit = secondLastCount;
    for (let firstPageCount = 1; firstPageCount < combinedCount; firstPageCount++) {
      const h2 = measureFn(titleFontPt, mergedStart + firstPageCount, totalItems);
      if (h2 > mergeLimitPx) continue; // la última página aún desborda: probar con menos items ahí
      const h1 = measureFn(titleFontPt, mergedStart, mergedStart + firstPageCount);
      if (h1 > mergeLimitPx) break; // la primera ya desborda; con más items ahí, peor todavía
      bestSplit = firstPageCount; // primer split (de menor a mayor) que cabe en ambas: el que
      break;                      // deja más canciones posible en la última página
    }

    if (bestSplit === secondLastCount) break; // no se encontró un reparto mejor: parar
    pageItemCounts[lastIdx - 1] = bestSplit;
    pageItemCounts[lastIdx] = combinedCount - bestSplit;
    break; // el rebalanceo ya es el óptimo local para este par de páginas
  }

  return { titleFontPt, pageItemCounts };
}

export function computeAutoFitPlan(
  totalItems: number,
  measureFn: MeasureRangeFn,
  opts: AutoFitOptions
): AutoFitResult {
  const { candidateTitleFontPt, pageAvailableHeightPx, emergencyFontPt } = opts;
  const minFontPt = candidateTitleFontPt[candidateTitleFontPt.length - 1];

  if (totalItems === 0) {
    return { titleFontPt: candidateTitleFontPt[0], pageItemCounts: [0] };
  }

  // 1. El repertorio completo, ¿cabe en una sola página a alguno de los tamaños candidatos? En
  // el tamaño MÍNIMO se admite un margen de tolerancia MÍNIMO, en PÍXELES ABSOLUTOS (no un
  // porcentaje): solo para absorber el ruido de redondeo/subpíxel inevitable entre cómo se MIDE el
  // contenido (un iframe oculto) y cómo lo pinta de verdad el motor de impresión del navegador —
  // nunca para "colar" un desborde real de varias filas. Un % (el diseño original usaba un 8%) es
  // peligroso: en una hoja de ~1000px de alto son ~80px de margen — de sobra para que una canción
  // entera "quepa" sobre el papel según nuestra medición pero desborde de verdad al imprimir,
  // generando exactamente la hoja-extra-casi-vacía que este mecanismo se creó para evitar. Con un
  // tope absoluto de unos pocos píxeles, si de verdad no cabe, se prefiere repartir en más páginas
  // (paso 2) — que además ahora reparte de forma equilibrada, no deja una canción sola. En los
  // tamaños mayores no se da ninguna tolerancia: si no caben sin más, hay margen real para probar
  // un tamaño menor antes de aceptar cualquier desborde.
  const MIN_SIZE_OVERFLOW_TOLERANCE_PX = 3;
  for (const pt of candidateTitleFontPt) {
    const limit = pt === minFontPt ? pageAvailableHeightPx + MIN_SIZE_OVERFLOW_TOLERANCE_PX : pageAvailableHeightPx;
    if (measureFn(pt, 0, totalItems) <= limit) {
      return { titleFontPt: pt, pageItemCounts: [totalItems] };
    }
  }

  // 1b. Ningún tamaño "ideal" cupo en una sola página. Antes de resignarse a repartir en varias
  // páginas, probar el tamaño de EMERGENCIA (si se proporcionó) — más pequeño que el mínimo
  // ideal, aceptado explícitamente como trade-off: preferible una letra algo más pequeña que ver
  // el repertorio entero de un vistazo, a saltar de hoja por un margen pequeño (p.ej. 1-2
  // canciones de más). Cuando SÍ cabe así, esto es justo la decisión AMBIGUA que un músico real
  // dudaría al montar el repertorio a mano — así que en vez de decidir en silencio, se calcula
  // TAMBIÉN la alternativa de repartir en varias páginas al tamaño ideal (`alternativePlan`),
  // para que la UI pueda ofrecer ambas opciones y sea el usuario quien elija.
  if (emergencyFontPt !== undefined && emergencyFontPt < minFontPt) {
    if (measureFn(emergencyFontPt, 0, totalItems) <= pageAvailableHeightPx + MIN_SIZE_OVERFLOW_TOLERANCE_PX) {
      const alternativePlan = computeMultiPagePlan(totalItems, measureFn, candidateTitleFontPt, pageAvailableHeightPx);
      return { titleFontPt: emergencyFontPt, pageItemCounts: [totalItems], alternativePlan };
    }
  }

  return computeMultiPagePlan(totalItems, measureFn, candidateTitleFontPt, pageAvailableHeightPx);
}

/**
 * Intenta encajar el repertorio en EXACTAMENTE (como máximo) `forcedPageCount` páginas — se usa
 * para igualar entre miembros de la banda: si el repertorio del cantante cabe en 1 hoja pero el
 * del guitarrista necesita 2 (porque sus notas personales son más largas), no tiene sentido que
 * uno tenga 1 hoja y otro 2 para el MISMO repertorio — un músico real, montando cada hoja a mano,
 * intentaría apretar la del guitarrista para que también quepa en 1. Se prueba cada tamaño de
 * candidato (de mayor a menor) con el reparto equilibrado habitual pero apuntando a
 * `forcedPageCount` páginas en vez de al mínimo que le tocaría a este miembro solo, aceptando algo
 * más de tolerancia que en el caso normal (`maxOverflowTolerance`) porque aquí ya sabemos que ese
 * nº de páginas es alcanzable para este repertorio en general — pero SIEMPRE verificando la altura
 * real de cada página resultante contra ese límite, nunca a ciegas. Si ni con la tolerancia máxima
 * se logra, devuelve `null` — nunca se fuerza un desborde real de la hoja ni se pierde contenido:
 * el llamador debe quedarse con el plan independiente original de ese miembro en ese caso.
 */
export function tryFitInPageCount(
  totalItems: number,
  measureFn: MeasureRangeFn,
  opts: AutoFitOptions & { forcedPageCount: number; maxOverflowTolerance: number }
): AutoFitResult | null {
  const { candidateTitleFontPt, pageAvailableHeightPx, forcedPageCount, maxOverflowTolerance } = opts;
  if (totalItems === 0) {
    return { titleFontPt: candidateTitleFontPt[0], pageItemCounts: [0] };
  }
  if (forcedPageCount <= 0) return null;

  const limit = pageAvailableHeightPx * (1 + maxOverflowTolerance);

  for (const pt of candidateTitleFontPt) {
    const totalHeight = measureFn(pt, 0, totalItems);
    const targetPerPage = totalHeight / forcedPageCount;

    const pageItemCounts: number[] = [];
    let cursor = 0;
    for (let p = 0; p < forcedPageCount - 1 && cursor < totalItems; p++) {
      const remaining = totalItems - cursor;
      let lo = 1;
      let hi = remaining;
      let best = 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (measureFn(pt, cursor, cursor + mid) <= targetPerPage) {
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

    // El reparto equilibrado, con un objetivo por página más generoso al buscar menos páginas de
    // las que le tocarían a este tamaño en solitario, puede acabar necesitando MÁS páginas de las
    // pedidas — en ese caso este tamaño de fuente no vale para el nº de páginas objetivo.
    if (pageItemCounts.length > forcedPageCount) continue;

    // Verificación real: cada página resultante debe caber dentro del límite con tolerancia — no
    // basta con que el reparto lo haya intentado, hay que comprobar la altura real de cada una.
    let fits = true;
    let c = 0;
    for (const count of pageItemCounts) {
      if (measureFn(pt, c, c + count) > limit) {
        fits = false;
        break;
      }
      c += count;
    }
    if (fits) {
      return { titleFontPt: pt, pageItemCounts };
    }
  }

  return null;
}

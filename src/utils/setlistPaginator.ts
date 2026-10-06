// Motor de maquetación del repertorio imprimible (PdfExportModal.tsx). Sustituyó a un
// auto-ajuste anterior que repartía solo CANCIONES y dejaba fuera los bloques ("Bloque 2",
// "Bis"): el encabezado que caía justo en un corte de página desaparecía de la hoja.
//
// Aquí el reparto es por ITEMS (canciones, bloques, interludios), con alturas medidas una a una
// (las filas son bloques apilados, así que sus alturas se suman). Decide, en este orden:
//   1. Cuántas hojas: la primera cantidad de hojas cuyo tamaño de letra máximo llega a la
//      letra "cómoda" (comfortFontPt). Si ninguna llega, la primera que supera el mínimo legible.
//   2. Qué tamaño de letra: el mayor (de minFontPt..maxFontPt, de 1 en 1pt) con el que el
//      repertorio cabe en esas hojas. La misma letra en todas las hojas — como un editor.
//   3. Dónde se corta: reparto EQUILIBRADO (ninguna hoja con 2 temas sueltos) y respetando la
//      estructura: nunca se acaba una hoja con un encabezado de bloque colgando, y se prefiere
//      cortar justo antes de un bloque nuevo.
//   4. Cuánto aire entre filas: el hueco que sobra en cada hoja se reparte entre las filas (con
//      un tope proporcional a la letra); lo que aún sobre lo absorbe el centrado vertical.
// No toca el DOM: la altura de las filas llega inyectada (`heightsAt`), igual que en textFit.ts.

export type ItemKind = "song" | "header" | "bis" | "other";

export interface PaginateInput {
  kinds: ItemKind[];
  /** Alto en px de cada item a esa letra (mismo orden y largo que `kinds`). */
  heightsAt: (fontPt: number) => number[];
  /** Alto útil de una hoja para el cuerpo (ya descontados cabecera y pie). */
  availableHeightPx: number;
  /** Mínimo legible a distancia de escenario. */
  minFontPt: number;
  /** A partir de aquí la letra se considera cómoda: no se parte en más hojas para subirla. */
  comfortFontPt: number;
  /** Techo de letra (por anchura del título más largo, o el tope de diseño). */
  maxFontPt: number;
  /** Último recurso por debajo del mínimo, solo si nada cabe ni con `maxPages` hojas. */
  floorFontPt?: number;
  maxPages?: number;
  /** Tolerancia de redondeo de subpíxel al comprobar que una hoja cabe. */
  tolerancePx?: number;
  /**
   * Fracción del alto útil que el contenido puede ocupar al elegir la letra (0-1). Con 0.9 queda
   * un 10 % de aire para repartir entre las filas: un setlist al 100 % se ve apretado. Si con
   * ese margen no cabe ni a la letra mínima, se reintenta con la hoja entera.
   */
  fillTarget?: number;
  /**
   * Nº de hojas impuesto por el usuario. El motor busca la letra más grande que quepa en
   * exactamente esas hojas, aunque baje del mínimo legible (hasta `FORCED_FLOOR_FONT_PT`).
   */
  forcedPages?: number;
}

export interface PlannedPage {
  /** Rango de items [from, to) de la hoja. */
  from: number;
  to: number;
  usedPx: number;
  /** Hueco libre de la hoja tras sumar sus alturas. */
  freePx: number;
  /** Aire extra por hueco entre filas (px) para llenar la hoja sin estirarla. */
  rowGapPx: number;
}

export interface PaginatedPlan {
  fontPt: number;
  pages: PlannedPage[];
}

const BREAK_MID_SECTION_PENALTY = 0.12;
const BREAK_BEFORE_OTHER_PENALTY = 0.05;
/** El aire entre filas nunca pasa de esta fracción de la letra: más se vería estirado. */
const MAX_GAP_FRACTION_OF_FONT = 0.55;

/** Con hojas impuestas se acepta letra pequeña antes que dejar temas fuera. */
const FORCED_FLOOR_FONT_PT = 9;
/** Con hojas impuestas el usuario pide aprovechar la hoja: menos aire reservado que en auto. */
const FORCED_FILL_TARGET = 0.96;

const ptToPx = (pt: number) => (pt * 96) / 72;

/** Reparte `heights` en exactamente `pageCount` hojas; null si no cabe. */
export function partitionItems(
  kinds: ItemKind[],
  heights: number[],
  pageCount: number,
  capacityPx: number,
  tolerancePx = 0.5,
): { from: number; to: number }[] | null {
  const n = heights.length;
  if (n === 0) return pageCount === 1 ? [{ from: 0, to: 0 }] : null;
  if (pageCount > n) return null;
  const prefix = [0];
  for (const h of heights) prefix.push(prefix[prefix.length - 1] + h);
  const cap = capacityPx + tolerancePx;
  if (heights.some((h) => h > cap)) return null;
  if (pageCount === 1) {
    return prefix[n] <= cap ? [{ from: 0, to: n }] : null;
  }
  const target = prefix[n] / pageCount;

  // Corte ANTES del item i (0 < i < n): coste estructural, o Infinity si está prohibido.
  const breakCost = (i: number): number => {
    const prev = kinds[i - 1];
    if (prev === "header" || prev === "bis") return Infinity; // encabezado colgando al final
    const next = kinds[i];
    if (next === "header" || next === "bis") return 0; // corte limpio, antes de un bloque
    if (next === "other") return BREAK_BEFORE_OTHER_PENALTY;
    return BREAK_MID_SECTION_PENALTY;
  };

  // dp[k][i]: coste mínimo de repartir los i primeros items en k hojas.
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[][] = Array.from({ length: pageCount + 1 }, () =>
    new Array(n + 1).fill(INF),
  );
  const from: number[][] = Array.from({ length: pageCount + 1 }, () =>
    new Array(n + 1).fill(-1),
  );
  dp[0][0] = 0;
  for (let k = 1; k <= pageCount; k++) {
    for (let i = k; i <= n; i++) {
      for (let j = k - 1; j < i; j++) {
        if (dp[k - 1][j] === INF) continue;
        const used = prefix[i] - prefix[j];
        if (used > cap) continue;
        const cut = j > 0 ? breakCost(j) : 0;
        if (cut === INF) continue;
        // Desviación respecto al reparto ideal, normalizada: penaliza las hojas casi vacías.
        const dev = (used - target) / capacityPx;
        const cost = dp[k - 1][j] + dev * dev + cut;
        if (cost < dp[k][i]) {
          dp[k][i] = cost;
          from[k][i] = j;
        }
      }
    }
  }
  if (dp[pageCount][n] === INF) return null;
  const ranges: { from: number; to: number }[] = [];
  let i = n;
  for (let k = pageCount; k >= 1; k--) {
    const j = from[k][i];
    ranges.unshift({ from: j, to: i });
    i = j;
  }
  return ranges;
}

export function planPages(input: PaginateInput): PaginatedPlan {
  if (input.forcedPages) return planPagesAt(input, FORCED_FILL_TARGET).plan;
  const fill = input.fillTarget ?? 0.9;
  const roomy = planPagesAt(input, fill);
  if (roomy.legible || fill >= 1) return roomy.plan;
  return planPagesAt(input, 1).plan;
}

/** `legible`: se encontró un reparto a letra >= minFontPt (no se tuvo que bajar al suelo). */
function planPagesAt(
  input: PaginateInput,
  fill: number,
): { plan: PaginatedPlan; legible: boolean } {
  const {
    kinds,
    heightsAt,
    availableHeightPx: fullHeightPx,
    minFontPt,
    comfortFontPt,
    maxFontPt,
    floorFontPt = minFontPt,
    tolerancePx = 0.5,
  } = input;
  const availableHeightPx = fullHeightPx * fill;
  const n = kinds.length;
  const maxPages = Math.max(1, Math.min(input.maxPages ?? 8, Math.max(1, n)));
  const cache = new Map<number, number[]>();
  const heights = (pt: number) => {
    let h = cache.get(pt);
    if (!h) {
      h = heightsAt(pt);
      cache.set(pt, h);
    }
    return h;
  };
  const split = (pt: number, pages: number) =>
    partitionItems(kinds, heights(pt), pages, availableHeightPx, tolerancePx);

  // Mayor letra entera de [lo, hi] con la que cabe en `pages` hojas (la altura crece con la
  // letra, así que la factibilidad es monótona y basta una bisección).
  const bestFontFor = (pages: number, lo: number, hi: number): number | null => {
    if (hi < lo || !split(lo, pages)) return null;
    let a = lo;
    let b = Math.max(lo, Math.floor(hi));
    while (a < b) {
      const mid = Math.ceil((a + b) / 2);
      if (split(mid, pages)) a = mid;
      else b = mid - 1;
    }
    return a;
  };

  const buildPlan = (
    chosen: { pages: number; fontPt: number },
    legible: boolean,
  ): { plan: PaginatedPlan; legible: boolean } => {
    const h = heights(chosen.fontPt);
    const ranges =
      split(chosen.fontPt, chosen.pages) ??
      // Último recurso defensivo: una hoja por cada reparto posible, sin garantía de que quepa.
      partitionItems(kinds, h, chosen.pages, Number.POSITIVE_INFINITY) ??
      [{ from: 0, to: n }];

    // El aire entre filas se reparte solo dentro del `fillTarget`; el resto de la hoja queda como
    // margen simétrico arriba y abajo (centrado vertical), así el pie nunca queda pegado.
    const pages: PlannedPage[] = ranges.map(({ from, to }) => {
      let used = 0;
      for (let i = from; i < to; i++) used += h[i];
      const free = Math.max(0, availableHeightPx - used);
      const rows = to - from;
      const gaps = Math.max(1, rows - 1);
      const rowGapPx = Math.min(free / gaps, ptToPx(chosen.fontPt) * MAX_GAP_FRACTION_OF_FONT);
      return { from, to, usedPx: used, freePx: free, rowGapPx: rows > 1 ? rowGapPx : 0 };
    });
    return { plan: { fontPt: chosen.fontPt, pages }, legible };
  };

  const top = Math.max(minFontPt, Math.floor(maxFontPt));
  if (input.forcedPages) {
    const pages = Math.min(Math.max(1, Math.floor(input.forcedPages)), Math.max(1, n));
    const lo = Math.min(FORCED_FLOOR_FONT_PT, minFontPt);
    const f = bestFontFor(pages, lo, top);
    const forced = { pages, fontPt: f ?? lo };
    return buildPlan(forced, f !== null);
  }
  let chosen: { pages: number; fontPt: number } | null = null;
  let firstLegible: { pages: number; fontPt: number } | null = null;
  for (let pages = 1; pages <= maxPages; pages++) {
    const f = bestFontFor(pages, minFontPt, top);
    if (f === null) continue;
    if (!firstLegible) firstLegible = { pages, fontPt: f };
    if (f >= Math.min(comfortFontPt, top)) {
      chosen = { pages, fontPt: f };
      break;
    }
  }
  chosen = chosen ?? firstLegible;
  const legible = chosen !== null;

  if (!chosen) {
    // Ni a la letra mínima cabe en `maxPages`: bajar del mínimo antes que perder temas.
    const f = bestFontFor(maxPages, Math.min(floorFontPt, minFontPt), minFontPt - 1);
    chosen = { pages: maxPages, fontPt: f ?? Math.min(floorFontPt, minFontPt) };
  }

  return buildPlan(chosen, legible);
}

/**
 * Letra máxima (pt) con la que el título más ancho sigue cabiendo en una línea de `rowWidthPx`.
 * `measureAtPx(100)` es el ancho en px del título más largo (con su número) a 100px de letra.
 */
export function maxFontPtForWidth(
  widthAt100px: number,
  rowWidthPx: number,
  extraPx = 0,
): number {
  if (widthAt100px <= 0) return Number.POSITIVE_INFINITY;
  const px = ((rowWidthPx - extraPx) / widthAt100px) * 100;
  return (px * 72) / 96;
}

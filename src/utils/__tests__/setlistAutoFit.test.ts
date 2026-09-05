import { describe, it, expect } from 'vitest';
import { computeAutoFitPlan, MeasureRangeFn } from '../setlistAutoFit';

const CANDIDATES = [28, 25, 22, 19, 17];

/** Altura proporcional: cada item ocupa `perItemHeight[titleFontPt]` px, sin importar cuál sea. */
function makeUniformMeasure(perItemHeight: Record<number, number>): MeasureRangeFn {
  return (titleFontPt, from, to) => (to - from) * perItemHeight[titleFontPt];
}

describe('computeAutoFitPlan', () => {
  it('usa el tamaño más grande cuando todo cabe en una página a ese tamaño', () => {
    const measure = makeUniformMeasure({ 28: 10, 25: 9, 22: 8, 19: 7, 17: 6 });
    const result = computeAutoFitPlan(20, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.titleFontPt).toBe(28);
    expect(result.pageItemCounts).toEqual([20]);
  });

  it('encoge al siguiente tamaño candidato si el más grande no cabe pero el siguiente sí', () => {
    const measure = makeUniformMeasure({ 28: 30, 25: 20, 22: 15, 19: 12, 17: 10 });
    // 20 items * 30px = 600 > 400 (no cabe a 28pt); 20*20=400 <= 400 (sí cabe a 25pt)
    const result = computeAutoFitPlan(20, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 400 });
    expect(result.titleFontPt).toBe(25);
    expect(result.pageItemCounts).toEqual([20]);
  });

  it('reparte en varias páginas al tamaño mínimo cuando ni ese tamaño cabe en una página', () => {
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
    // 30 items * 60px = 1800px de contenido total; página de 500px -> ceil(1800/500) = 4 páginas.
    const result = computeAutoFitPlan(30, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.titleFontPt).toBe(17);
    expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(30);
    expect(result.pageItemCounts.length).toBeGreaterThanOrEqual(4);
  });

  it('reparte de forma equilibrada, no todo en la primera página y poco en la última', () => {
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
    const result = computeAutoFitPlan(40, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    const counts = result.pageItemCounts;
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    // Con altura uniforme por item, un reparto equilibrado no debería diferir en más de 1-2 items
    // entre la página más llena y la más vacía.
    expect(max - min).toBeLessThanOrEqual(2);
  });

  it('nunca genera una página vacía', () => {
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
    const result = computeAutoFitPlan(37, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.pageItemCounts.every(c => c > 0)).toBe(true);
    expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(37);
  });

  it('maneja un repertorio vacío sin lanzar', () => {
    const measure: MeasureRangeFn = () => 0;
    const result = computeAutoFitPlan(0, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.pageItemCounts).toEqual([0]);
  });

  it('avanza al menos un item por página aunque uno solo ya exceda el objetivo de reparto', () => {
    // Cada item, individualmente, ya excede pageAvailableHeightPx al tamaño mínimo.
    const measure = makeUniformMeasure({ 28: 1000, 25: 900, 22: 800, 19: 700, 17: 600 });
    const result = computeAutoFitPlan(5, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.titleFontPt).toBe(17);
    expect(result.pageItemCounts.every(c => c >= 1)).toBe(true);
    expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(5);
  });
});

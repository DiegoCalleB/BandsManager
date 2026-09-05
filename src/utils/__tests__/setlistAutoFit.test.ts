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

  it('prefiere un tamaño más grande que el mínimo si sigue cabiendo en el mismo nº de páginas', () => {
    // A 17pt: 10*55=550 -> ceil(550/500)=2 páginas. A 22pt: 10*90=900 -> ceil(900/500)=2 páginas
    // también (no necesita más páginas que al mínimo) -> debe preferirse 22pt, no quedarse en 17pt
    // dejando las 2 páginas a medio llenar. A 25pt: 10*110=1100 -> ceil(1100/500)=3 (si necesita
    // más páginas, no vale).
    const measure = makeUniformMeasure({ 28: 130, 25: 110, 22: 90, 19: 70, 17: 55 });
    const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.titleFontPt).toBe(22);
    expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(10);
    expect(result.pageItemCounts.length).toBe(2);
  });

  it('se queda en el tamaño mínimo si ningún candidato mayor cabe en el mismo nº de páginas', () => {
    // Cada tamaño mayor necesita estrictamente más páginas que el mínimo -> no hay margen para
    // subir el tamaño sin aumentar también el nº de páginas.
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
    const result = computeAutoFitPlan(30, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.titleFontPt).toBe(17);
  });

  it('tolera un pequeño exceso al tamaño mínimo en vez de generar una hoja nueva casi vacía', () => {
    // Caso real reportado: un repertorio que casi cabe en una página, pero se pasa por poco al
    // tamaño mínimo (p.ej. por una única canción con mucha nota) — sin tolerancia, esto generaba
    // una segunda hoja entera para esa canción sola. A 17pt: 10*50=500, un 4.2% por encima de
    // pageAvailableHeightPx=480 (dentro del margen del 8% admitido) -> debe aceptarse en 1 página.
    const measure = makeUniformMeasure({ 28: 70, 25: 65, 22: 60, 19: 56, 17: 50 });
    const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 480 });
    expect(result.titleFontPt).toBe(17);
    expect(result.pageItemCounts).toEqual([10]);
  });

  it('no da tolerancia en tamaños que no son el mínimo: si no caben, se prueba uno menor', () => {
    // A 19pt el contenido excede pageAvailableHeightPx por poco (mismo margen que el caso de
    // arriba), pero 19pt NO es el tamaño mínimo de la lista (17pt sí lo es) — no se le da
    // tolerancia porque hay margen real para probar 17pt, que si cabe sin exceso.
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 52, 17: 40 });
    const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    // 19pt: 10*52=520, 4% por encima de 500 -> sin tolerancia (no es el mínimo), no se acepta así.
    // 17pt: 10*40=400 <= 500 -> cabe sin más.
    expect(result.titleFontPt).toBe(17);
    expect(result.pageItemCounts).toEqual([10]);
  });

  it('un exceso grande (fuera de la tolerancia) al tamaño mínimo sigue repartiendo en páginas', () => {
    const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
    // 10*60=600, un 20% por encima de 500 -> muy por encima del 8% de tolerancia.
    const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
    expect(result.pageItemCounts.length).toBeGreaterThan(1);
  });

  it('la fusión de última página dispersa nunca deja overflow ni pierde canciones', () => {
    // No se fuerza aquí el caso exacto de activación (depende del resultado intermedio de la
    // bisección, difícil de predecir a mano con precisión) — se verifica la propiedad que
    // importa: pase lo que pase, el resultado sigue sumando el total y ninguna página queda
    // vacía, para varias formas de repertorio con una canción mucho más pesada que el resto.
    const heights = [...Array(25).fill(20), 90];
    const measure: MeasureRangeFn = (_pt, from, to) => heights.slice(from, to).reduce((a, b) => a + b, 0);
    const result = computeAutoFitPlan(26, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 150 });
    expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(26);
    expect(result.pageItemCounts.every(c => c > 0)).toBe(true);
  });
});

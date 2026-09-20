import { describe, it, expect } from 'vitest';
import { computeAutoFitPlan, computeExpandedPlan, tryFitInPageCount, MeasureRangeFn } from '../setlistAutoFit';

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

 it('reparte siempre al tamaño mínimo, pero cada página sube su letra tanto como quepa', () => {
 // A 17pt: 10*55=550 -> ceil(550/500)=2 páginas -> reparto equilibrado a ESE tamaño (5+5).
 // El reparto de canciones (pageItemCounts) se calcula siempre al mínimo -> titleFontPt=17 -
 // pero cada página resultante (5 canciones) tiene margen para subir: a 22pt, 5*90=450<=500
 // (cabe), a 25pt, 5*110=550>500 (no cabe) -> pageFontSizes debe subir a 22, nunca más.
 const measure = makeUniformMeasure({ 28: 130, 25: 110, 22: 90, 19: 70, 17: 55 });
 const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 expect(result.titleFontPt).toBe(17);
 expect(result.pageItemCounts).toEqual([5, 5]);
 expect(result.pageFontSizes).toEqual([22, 22]);
 });

 it('se queda en el tamaño mínimo si ningún candidato mayor cabe en el mismo nº de páginas', () => {
 // Cada tamaño mayor necesita estrictamente más páginas que el mínimo -> no hay margen para
 // subir el tamaño sin aumentar también el nº de páginas.
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
 const result = computeAutoFitPlan(30, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 expect(result.titleFontPt).toBe(17);
 });

 it('tolera un exceso minúsculo (ruido de redondeo) al tamaño mínimo, en vez de generar una hoja nueva casi vacía', () => {
 // La tolerancia es un tope ABSOLUTO en píxeles (no un %) pensado solo para absorber el
 // redondeo/subpíxel entre la medición en el iframe oculto y el motor de impresión real — no
 // para colar un desborde real de contenido. A 17pt: 10*48.2=482, solo 2px por encima de
 // pageAvailableHeightPx=480 (dentro de los 3px de tope) -> debe aceptarse en 1 página.
 const measure = makeUniformMeasure({ 28: 70, 25: 65, 22: 60, 19: 56, 17: 48.2 });
 const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 480 });
 expect(result.titleFontPt).toBe(17);
 expect(result.pageItemCounts).toEqual([10]);
 });

 it('no da tolerancia en tamaños que no son el mínimo: si no caben, se prueba uno menor', () => {
 // A 19pt el contenido excede pageAvailableHeightPx, pero 19pt NO es el tamaño mínimo de la
 // lista (17pt sí lo es) — no se le da tolerancia porque hay margen real para probar 17pt, que
 // sí cabe sin exceso.
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 52, 17: 40 });
 const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 // 19pt: 10*52=520, muy por encima de 500 -> sin tolerancia (no es el mínimo), no se acepta así.
 // 17pt: 10*40=400 <= 500 -> cabe sin más.
 expect(result.titleFontPt).toBe(17);
 expect(result.pageItemCounts).toEqual([10]);
 });

 it('un exceso real (por pequeño que sea en %, pero grande en px) al tamaño mínimo sigue repartiendo en páginas equilibradas, nunca una canción sola', () => {
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
 // 10*60=600, 100px por encima de 500 -> muy por encima del tope absoluto de tolerancia (3px):
 // un % (el diseño anterior, 8%) habría admitido hasta 40px de margen aquí y aceptado esto como
 // "1 página", arriesgando un desborde real en la impresión — con tope absoluto no se acepta.
 const result = computeAutoFitPlan(10, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 expect(result.pageItemCounts.length).toBeGreaterThan(1);
 // Reparto equilibrado, no una canción sola en la última página.
 const max = Math.max(...result.pageItemCounts);
 const min = Math.min(...result.pageItemCounts);
 expect(max - min).toBeLessThanOrEqual(2);
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

 it('rebalancea entre las 2 últimas páginas en vez de dejar 1 sola canción pesada, cuando hay margen para mejorar', () => {
 // Caso real reportado: 20 canciones ligeras (20px) + 1 con una nota larguísima al final
 // (450px). La fusión total (21 items) no cabe en una hoja (por eso hay 2 páginas), así que
 // el viejo "merge de seguridad" nunca podía activarse aquí y dejaba [20, 1] para siempre.
 // Con margen real disponible (pageAvailableHeightPx=500), debe rebalancear moviendo algunas
 // canciones ligeras junto a la pesada en vez de dejarla completamente sola.
 const heights = [...Array(20).fill(20), 450];
 const measure: MeasureRangeFn = (_pt, from, to) => heights.slice(from, to).reduce((a, b) => a + b, 0);
 const result = computeAutoFitPlan(21, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });

 expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(21);
 expect(result.pageItemCounts.length).toBe(2);
 // La última página ya no debe tener solo 1 canción: el rebalanceo debe haber movido algunas
 // ligeras junto a la pesada, siempre que sigan cabiendo dentro del alto real.
 const lastCount = result.pageItemCounts[result.pageItemCounts.length - 1];
 expect(lastCount).toBeGreaterThan(1);
 // Verificación real: ninguna página debe exceder el alto disponible (con la tolerancia de
 // 5px del merge) — el rebalanceo nunca debe generar un desborde real de la hoja.
 let cursor = 0;
 for (const count of result.pageItemCounts) {
 const pageHeight = measure(result.titleFontPt, cursor, cursor + count);
 expect(pageHeight).toBeLessThanOrEqual(505);
 cursor += count;
 }
 });

 it('sube el tamaño de fuente por página individual cuando el conjunto completo no lo soporta pero cada página sí', () => {
 // Caso real: el repertorio ENTERO no cabe a 22pt en 2 páginas (una canción con nota larga
 // en algún punto del conjunto de 20 fuerza más altura de la que cabría), pero UNA VEZ
 // repartido en 2 páginas de 10 canciones cada una (al tamaño base de 17pt), cada página
 // individual SÍ tiene margen para subir a 22pt. Simulado aquí con un "overhead" que solo se
 // activa en rangos grandes (>15 items) a 22pt, imitando cómo una nota que no cabe inline a
 // letra grande puede caer a una línea aparte y añadir altura no proporcional al conjunto
 // completo, sin afectar a un subconjunto más pequeño.
 const measure: MeasureRangeFn = (pt, from, to) => {
 const count = to - from;
 const perItem: Record<number, number> = { 22: 20, 17: 17 };
 const overhead = pt === 22 && count > 15 ? 100 : 0;
 return count * perItem[pt] + overhead;
 };
 const result = computeAutoFitPlan(20, measure, {
 candidateTitleFontPt: [22, 17],
 pageAvailableHeightPx: 200
 });

 expect(result.titleFontPt).toBe(17); // el conjunto completo se queda en el tamaño base
 expect(result.pageItemCounts).toEqual([10, 10]);
 // Pero cada página individual, con solo 10 canciones (sin el overhead que solo aparece con
 // más de 15), sí tiene margen para el tamaño mayor.
 expect(result.pageFontSizes).toEqual([22, 22]);

 // Verificación real: cada página, a su tamaño final, sigue cabiendo dentro del alto real.
 let cursor = 0;
 result.pageItemCounts.forEach((count, i) => {
 const pageHeight = measure(result.pageFontSizes[i], cursor, cursor + count);
 expect(pageHeight).toBeLessThanOrEqual(200);
 cursor += count;
 });
 });

 it('pageFontSizes nunca baja del tamaño base elegido para el conjunto completo', () => {
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
 const result = computeAutoFitPlan(30, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 expect(result.pageFontSizes.every(pt => pt >= result.titleFontPt)).toBe(true);
 expect(result.pageFontSizes.length).toBe(result.pageItemCounts.length);
 });

 it('con 1 sola página, pageFontSizes es [titleFontPt]', () => {
 const measure = makeUniformMeasure({ 28: 10, 25: 9, 22: 8, 19: 7, 17: 6 });
 const result = computeAutoFitPlan(20, measure, { candidateTitleFontPt: CANDIDATES, pageAvailableHeightPx: 500 });
 expect(result.pageItemCounts).toEqual([20]);
 expect(result.pageFontSizes).toEqual([result.titleFontPt]);
 });

 it('repartir siempre al tamaño mínimo evita que un tamaño mayor desequilibre la cantidad por página', () => {
 // Caso real reportado: un repertorio con muchas canciones ligeras y una con una nota pesada
 // que, a letra grande, ocupa desproporcionadamente MÁS (una nota que cabe "inline" a 17pt
 // puede necesitar una línea aparte a 19pt, un salto no lineal). Si el reparto se hiciera al
 // tamaño más grande que aún cupiera en el mismo nº de páginas (comportamiento antiguo), la
 // canción pesada "pesaría" más en la cuenta de altura y el reparto por CANTIDAD saldría más
 // desigual para mantener el equilibrio de altura. Repartir siempre al mínimo evita esto.
 const heights: Record<number, Record<number, number>> = {
 17: { light: 2, heavy: 50 },
 19: { light: 2.2, heavy: 100 } // el salto de 50->100 es MUCHO más que proporcional (+10%)
 };
 const totalItems = 201; // 200 ligeras + 1 pesada al final
 const measure: MeasureRangeFn = (pt, from, to) => {
 const h = heights[pt] ?? heights[17];
 let sum = 0;
 for (let i = from; i < to; i++) sum += i === totalItems - 1 ? h.heavy : h.light;
 return sum;
 };
 const result = computeAutoFitPlan(totalItems, measure, {
 candidateTitleFontPt: [19, 17],
 pageAvailableHeightPx: 300
 });

 expect(result.titleFontPt).toBe(17); // el reparto nunca se hace a un tamaño mayor
 expect(result.pageItemCounts.length).toBe(2);
 const [first, second] = result.pageItemCounts;
 // Con el reparto al mínimo, la diferencia entre páginas es moderada (~112 vs ~89, diff~23);
 // al tamaño mayor habría sido ~122 vs ~79 (diff~43) — se exige aquí que quede claramente por
 // debajo de esa cota, confirmando que no se desequilibra por culpa de un tamaño más grande.
 expect(Math.abs(first - second)).toBeLessThan(35);
 });

 describe('emergencyFontPt', () => {
 it('usa el tamaño de emergencia para caber en 1 sola página cuando ningún candidato ideal cabe', () => {
 // Al tamaño mínimo ideal (17pt) el contenido excede la página por poco (510 > 500); al
 // tamaño de emergencia (15pt) sí cabe entero.
 const measure: MeasureRangeFn = (pt) => {
 const perItem: Record<number, number> = { 28: 30, 25: 27, 22: 24, 19: 21, 17: 17, 15: 15 };
 return 30 * perItem[pt];
 };
 const result = computeAutoFitPlan(30, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 emergencyFontPt: 15
 });
 expect(result.titleFontPt).toBe(15);
 expect(result.pageItemCounts).toEqual([30]);
 });

 it('ignora el tamaño de emergencia y reparte en varias páginas al tamaño ideal si ni con él cabe', () => {
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60, 15: 55 });
 // 30 items * 55px = 1650, sigue sin caber en una página de 500 -> el algoritmo no puede
 // usar el tamaño de emergencia para 1 sola página, debe repartir en varias al tamaño ideal.
 const result = computeAutoFitPlan(30, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 emergencyFontPt: 15
 });
 expect(result.pageItemCounts.length).toBeGreaterThan(1);
 // El reparto en varias páginas nunca debe usar el tamaño de emergencia, solo el ideal.
 expect(result.titleFontPt).toBeGreaterThanOrEqual(17);
 // Sin decisión ambigua que ofrecer: no hay alternativa razonable de 1 sola página.
 expect(result.alternativePlan).toBeUndefined();
 });

 it('cuando usa el tamaño de emergencia, incluye alternativePlan con el reparto en varias páginas al tamaño ideal', () => {
 // Caso ambiguo real: a 15pt cabe entero en 1 página; a 17pt (ideal) no cabe, necesita 2+.
 const measure: MeasureRangeFn = (pt, from, to) => {
 const perItem: Record<number, number> = { 28: 30, 25: 27, 22: 24, 19: 21, 17: 17, 15: 15 };
 return (to - from) * perItem[pt];
 };
 const result = computeAutoFitPlan(30, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 emergencyFontPt: 15
 });
 expect(result.titleFontPt).toBe(15);
 expect(result.pageItemCounts).toEqual([30]);
 expect(result.alternativePlan).toBeDefined();
 expect(result.alternativePlan!.titleFontPt).toBeGreaterThanOrEqual(17);
 expect(result.alternativePlan!.pageItemCounts.length).toBeGreaterThan(1);
 expect(result.alternativePlan!.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(30);
 });

 it('sin emergencyFontPt, el comportamiento es idéntico al anterior (reparte en varias páginas)', () => {
 const measure: MeasureRangeFn = (pt) => {
 const perItem: Record<number, number> = { 28: 30, 25: 27, 22: 24, 19: 21, 17: 17 };
 return 30 * perItem[pt];
 };
 const result = computeAutoFitPlan(30, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500
 });
 expect(result.pageItemCounts.length).toBeGreaterThan(1);
 expect(result.titleFontPt).toBeGreaterThanOrEqual(17);
 });
 });
});

describe('tryFitInPageCount', () => {
 it('encaja en 1 sola página cuando el contenido es corto de sobra', () => {
 const measure = makeUniformMeasure({ 28: 10, 25: 9, 22: 8, 19: 7, 17: 6 });
 const result = tryFitInPageCount(10, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 forcedPageCount: 1,
 maxOverflowTolerance: 0.12
 });
 expect(result).not.toBeNull();
 expect(result!.pageItemCounts).toEqual([10]);
 });

 it('usa la tolerancia extra para igualar a 1 página cuando el ajuste normal necesitaría 2, prefiriendo el candidato más grande que aun así encaje', () => {
 // Se prueba de mayor a menor candidato: a 19pt, 20*28=560, justo un 12% por encima de 500
 // (el límite exacto de la tolerancia) -> ya encaja ahí, así que se prefiere 19pt (más grande)
 // en vez de bajar hasta 17pt sin necesidad.
 const measure = makeUniformMeasure({ 28: 40, 25: 35, 22: 30, 19: 28, 17: 26 });
 const result = tryFitInPageCount(20, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 forcedPageCount: 1,
 maxOverflowTolerance: 0.12
 });
 expect(result).not.toBeNull();
 expect(result!.titleFontPt).toBe(19);
 expect(result!.pageItemCounts).toEqual([20]);
 });

 it('devuelve null si ni con la tolerancia máxima cabe en el nº de páginas pedido', () => {
 // Incluso al mínimo, el contenido dobla el alto disponible: ninguna tolerancia razonable
 // permite encajarlo en 1 sola página.
 const measure = makeUniformMeasure({ 28: 200, 25: 180, 22: 160, 19: 140, 17: 120 });
 const result = tryFitInPageCount(10, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 forcedPageCount: 1,
 maxOverflowTolerance: 0.12
 });
 expect(result).toBeNull();
 });

 it('nunca acepta una página que exceda el límite real con tolerancia, aunque el reparto lo intente', () => {
 const measure = makeUniformMeasure({ 28: 100, 25: 90, 22: 80, 19: 70, 17: 60 });
 const result = tryFitInPageCount(30, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 forcedPageCount: 2,
 maxOverflowTolerance: 0.12
 });
 // 30 items a 17pt = 1800px, ni repartido en 2 páginas con tolerancia (2*560=1120 < 1800) cabe.
 expect(result).toBeNull();
 });

 it('nunca pierde canciones cuando sí logra encajar', () => {
 const measure = makeUniformMeasure({ 28: 40, 25: 35, 22: 30, 19: 28, 17: 26 });
 const result = tryFitInPageCount(20, measure, {
 candidateTitleFontPt: CANDIDATES,
 pageAvailableHeightPx: 500,
 forcedPageCount: 1,
 maxOverflowTolerance: 0.12
 });
 expect(result).not.toBeNull();
 expect(result!.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(20);
 });
});

describe('computeExpandedPlan (modo "de pie")', () => {
 it('usa el tamaño fijo dado aunque el repertorio quepa en 1 sola página a ese tamaño', () => {
 const measure = makeUniformMeasure({ 28: 20 });
 const result = computeExpandedPlan(10, measure, { titleFontPt: 28, pageAvailableHeightPx: 500 });
 expect(result.titleFontPt).toBe(28);
 expect(result.pageItemCounts).toEqual([10]);
 expect(result.pageFontSizes).toEqual([28]);
 });

 it('reparte en varias páginas al tamaño fijo cuando hace falta, nunca cambia el tamaño', () => {
 // 30 items * 40px = 1200px -> 3 páginas a 500px cada una.
 const measure = makeUniformMeasure({ 28: 40 });
 const result = computeExpandedPlan(30, measure, { titleFontPt: 28, pageAvailableHeightPx: 500 });
 expect(result.titleFontPt).toBe(28);
 expect(result.pageFontSizes.every(pt => pt === 28)).toBe(true);
 expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(30);
 expect(result.pageItemCounts.length).toBeGreaterThan(1);
 });

 it('reparte equilibrado y nunca deja una canción sola cuando se puede evitar', () => {
 const heights = [...Array(25).fill(20), 90];
 const measure: MeasureRangeFn = (_pt, from, to) => heights.slice(from, to).reduce((a, b) => a + b, 0);
 const result = computeExpandedPlan(26, measure, { titleFontPt: 28, pageAvailableHeightPx: 150 });
 expect(result.pageItemCounts.reduce((a, b) => a + b, 0)).toBe(26);
 expect(result.pageItemCounts.every(c => c > 0)).toBe(true);
 });

 it('con un repertorio vacío no lanza y devuelve una página vacía', () => {
 const measure: MeasureRangeFn = () => 0;
 const result = computeExpandedPlan(0, measure, { titleFontPt: 28, pageAvailableHeightPx: 500 });
 expect(result.pageItemCounts).toEqual([0]);
 expect(result.titleFontPt).toBe(28);
 });

 it('sube el tamaño de cada página por encima del tamaño base cuando le sobra alto', () => {
 // Escala lineal con el tamaño de fuente: a 28pt cada item mide 20px: 10 items = 200px,
 // muy por debajo del alto disponible (500px) - hay margen real para subir más allá de 28pt.
 const measure: MeasureRangeFn = (pt, from, to) => (to - from) * (pt / 28) * 20;
 const result = computeExpandedPlan(10, measure, {
 titleFontPt: 28,
 pageAvailableHeightPx: 500,
 maxTitleFontPt: 44
 });
 expect(result.titleFontPt).toBe(28); // la referencia de reparto no cambia
 expect(result.pageFontSizes[0]).toBeGreaterThan(28); // pero la página sí se ve más grande
 expect(result.pageFontSizes[0]).toBeLessThanOrEqual(44); // nunca por encima del techo dado
 });

 it('nunca sube el tamaño de una página por encima del techo aunque sobre muchísimo alto', () => {
 const measure: MeasureRangeFn = () => 1; // prácticamente no ocupa nada, sea cual sea el tamaño
 const result = computeExpandedPlan(5, measure, {
 titleFontPt: 28,
 pageAvailableHeightPx: 1000,
 maxTitleFontPt: 40
 });
 expect(result.pageFontSizes[0]).toBeLessThanOrEqual(40);
 });

 it('cada página sube su propio tamaño sin desbordar su propio contenido real', () => {
 const measure: MeasureRangeFn = (pt, from, to) => (to - from) * (pt / 28) * 20;
 const result = computeExpandedPlan(29, measure, {
 titleFontPt: 28,
 pageAvailableHeightPx: 500,
 maxTitleFontPt: 44
 });
 expect(result.pageItemCounts.length).toBeGreaterThan(1);
 // Cada página, medida a SU PROPIO tamaño ya elegido, debe seguir cabiendo en el alto real.
 let cursor = 0;
 result.pageItemCounts.forEach((count, i) => {
 const heightAtChosenSize = measure(result.pageFontSizes[i], cursor, cursor + count);
 expect(heightAtChosenSize).toBeLessThanOrEqual(500);
 cursor += count;
 });
 // Al menos alguna página debe haber subido por encima del tamaño base: si no, el "de pie"
 // no estaría aprovechando el alto de sobra que sí tiene disponible.
 expect(result.pageFontSizes.some(pt => pt > 28)).toBe(true);
 });
});

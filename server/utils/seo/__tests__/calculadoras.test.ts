import { describe, expect, it } from 'vitest';
import { calcCacheMinimo, calcSlotSetlist, scriptCalculadoras } from '../calculadoras.js';
import { guiaPorSlug } from '../indice.js';
import { renderizarGuia } from '../render.js';

describe('calcCacheMinimo', () => {
  it('suma gastos y valor del tiempo (ejemplo de la guía)', () => {
    const r = calcCacheMinimo({ miembros: 4, gastos: 120, horas: 10, valorHora: 10 });
    expect(r).toMatchObject({ gastos: 120, tiempo: 400, total: 520, porMiembro: 130, soloGastos: 120 });
  });
  it('no revienta con campos vacíos, negativos o cero miembros', () => {
    const r = calcCacheMinimo({ miembros: 0, gastos: -5, horas: Number.NaN, valorHora: 10 });
    expect(r.total).toBe(0);
    expect(Number.isFinite(r.porMiembro)).toBe(true);
  });
});

describe('calcSlotSetlist', () => {
  it('coincide con la tabla de la guía del setlist', () => {
    const tabla: Array<[number, number, number]> = [[30, 5, 7], [45, 8, 11], [60, 12, 15], [75, 15, 20], [90, 18, 24]];
    for (const [slot, de4, de3] of tabla) {
      expect(calcSlotSetlist({ slot, media: 4 }).temas, `${slot} min con temas de 4`).toBe(de4);
      expect(calcSlotSetlist({ slot, media: 3 }).temas, `${slot} min con temas de 3`).toBe(de3);
    }
  });
  it('nunca devuelve negativos', () => {
    expect(calcSlotSetlist({ slot: 3, media: 4 }).temas).toBe(0);
  });
});

describe('cifras del gráfico de «cuánto cobrar»', () => {
  const g = guiaPorSlug('cuanto-cobrar-por-un-concierto')!;
  const grafico = g.secciones.find((s) => s.grafico)!.grafico!;
  const asistentes = grafico.ejeX.etiquetas.map(Number);
  const valores = (nombre: string) => grafico.series.find((s) => s.nombre === nombre)!.valores;
  it('taquilla y mixto salen de las fórmulas del texto', () => {
    expect(valores('Taquilla')).toEqual(asistentes.map((a) => a * 8 * 0.7));
    expect(valores('Mixto')).toEqual(asistentes.map((a) => 200 + Math.max(0, a - 40) * 4));
  });
  it('la taquilla supera el mínimo de 520 € hacia las 93 personas y el mixto lo alcanza con 120', () => {
    expect(Math.ceil(520 / 5.6)).toBe(93);
    expect(200 + (120 - 40) * 4).toBe(520);
    expect(calcCacheMinimo({ miembros: 4, gastos: 120, horas: 10, valorHora: 10 }).total).toBe(520);
  });
});

describe('script de las calculadoras', () => {
  const guia = guiaPorSlug('cuanto-cobrar-por-un-concierto')!;
  const html = renderizarGuia(guia, 'https://bandmanager.io', 'es');
  const js = html.match(/<script>(.*?)<\/script>/s)?.[1] ?? '';

  it('la página lleva el formulario y un único script autosuficiente', () => {
    expect(html).toContain('data-calc="cache-minimo"');
    expect(html.match(/<script>/g)).toHaveLength(1);
    expect(js).not.toMatch(/cov_|__name|import /);
    expect(() => new Function('document', js)).not.toThrow();
  });

  it('el script calcula en un DOM simulado con las mismas cifras probadas', () => {
    const salidas: Record<string, string> = {};
    const campos = [['miembros', '4'], ['gastos', '120'], ['horas', '10'], ['valorHora', '10']].map(([name, value]) => ({ name, value }));
    const resultados = ['total', 'porMiembro', 'soloGastos'].map((k) => ({ getAttribute: () => k, set textContent(v: string) { salidas[k] = v; } }));
    const form = {
      getAttribute: () => 'cache-minimo',
      querySelectorAll: (q: string) => (q === 'input' ? campos : resultados),
      addEventListener: () => undefined,
    };
    new Function('document', js)({ querySelectorAll: () => [form] });
    expect(salidas.total.replace(/\D/g, "")).toBe('520');
    expect(salidas.porMiembro.replace(/\D/g, "")).toBe('130');
  });

  it('sin calculadoras no hay script', () => {
    expect(scriptCalculadoras([], 'es')).toBe('');
  });
});

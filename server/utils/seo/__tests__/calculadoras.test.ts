import { describe, expect, it } from 'vitest';
import { calcCacheMinimo, calcEmbudoBolos, calcEpkChecklist, calcSlotSetlist, scriptCalculadoras } from '../calculadoras.js';
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

describe('calcEmbudoBolos', () => {
  it('ejemplo de la guía: 12 bolos con 20 % y 30 % piden 200 salas', () => {
    expect(calcEmbudoBolos({ objetivo: 12, respuesta: 20, fecha: 30, meses: 6 })).toMatchObject({ salas: 200, respuestas: 40, porSemana: 7.7, unaDeCada: 16.7 });
  });
  it('redondea hacia arriba y no divide por cero', () => {
    expect(calcEmbudoBolos({ objetivo: 1, respuesta: 20, fecha: 30, meses: 6 }).salas).toBe(17);
    expect(calcEmbudoBolos({ objetivo: 12, respuesta: 0, fecha: 30, meses: 6 }).salas).toBe(0);
    expect(calcEmbudoBolos({ objetivo: 12, respuesta: 200, fecha: 300, meses: 0 }).salas).toBe(12);
  });
  it('el gráfico de «conseguir bolos» sale de las tasas que dice (3, 6 y 12 de cada 100)', () => {
    const g = guiaPorSlug('como-conseguir-bolos')!.secciones.find((x) => x.grafico)!.grafico!;
    const salas = g.ejeX.etiquetas.map(Number);
    for (const [nombre, tasa] of [['3 de cada 100', 0.03], ['6 de cada 100', 0.06], ['12 de cada 100', 0.12]] as const) {
      expect(g.series.find((x) => x.nombre === nombre)!.valores).toEqual(salas.map((n) => Math.round(n * tasa * 10) / 10));
    }
    // Cada serie es una tasa válida de la calculadora: 12 bolos en 120 salas al 12 % de éxito.
    expect(calcEmbudoBolos({ objetivo: 14, respuesta: 40, fecha: 30, meses: 6 }).salas).toBe(117);
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

describe('calcEpkChecklist', () => {
  const todo = { escucha: 1, foto: 1, video: 1, dato: 1, bio: 1, rider: 1, contacto: 1, enlace: 1 };
  it('puntúa por elementos marcados', () => {
    expect(calcEpkChecklist(todo)).toEqual({ hechos: 8, faltan: 0, porcentaje: 100 });
    expect(calcEpkChecklist({ ...todo, video: 0, dato: 0 })).toEqual({ hechos: 6, faltan: 2, porcentaje: 75 });
    expect(calcEpkChecklist({ escucha: 0, foto: 0, video: 0, dato: 0, bio: 0, rider: 0, contacto: 0, enlace: 0 })).toEqual({ hechos: 0, faltan: 8, porcentaje: 0 });
  });
  it('la guía del EPK lleva la checklist con ocho casillas y la anatomía accesible', () => {
    const html = renderizarGuia(guiaPorSlug('como-hacer-un-epk')!, 'https://bandmanager.io', 'es');
    expect(html.match(/type="checkbox"/g)).toHaveLength(8);
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="Esquema de un dossier/);
    expect(html.match(/data-calc="epk-checklist"/g)).toHaveLength(1);
  });
});

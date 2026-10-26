import { describe, it, expect } from 'vitest';
import { casillasDeCompas, compasesPorFila, etiquetasDeCompas, filasDeCompases, letraPorCompas, nombresDeBloques } from '../vistaCompases';
import type { Cuadricula } from '../cuadriculaCompases';

// 8 compases de 4/4 a 120 BPM (2 s por compás), dos bloques A y B.
const compas = (n: number, acordes: string[], bloque: number) => ({ n, t0: (n - 1) * 2, t1: n * 2, bloque, acordes });
const cuadricula: Cuadricula = {
  bpm: 120, tiemposPorCompas: 4, duracionPulso: 0.5, inicioRejilla: 0, calidad: 0.9, aproximada: false,
  compases: [
    compas(1, ['E', 'E', 'E', 'E'], 0), compas(2, ['E', 'E', 'A', 'A'], 0), compas(3, ['D', 'D', 'D', 'D'], 0), compas(4, ['D', 'D', 'E', 'B7'], 0),
    compas(5, ['A', 'A', 'A', 'A'], 1), compas(6, ['A', 'A', 'A', 'A'], 1), compas(7, ['N', 'N', 'E', 'E'], 1), compas(8, ['E', 'E', 'E', 'E'], 1),
  ],
  bloques: [
    { indice: 0, letra: 'A', desde: 1, hasta: 4, t0: 0, t1: 8 },
    { indice: 1, letra: 'B', desde: 5, hasta: 8, t0: 8, t1: 16 },
  ],
};

describe('compasesPorFila', () => {
  it('2 en un móvil, 4 en tablet, 8 en pantalla ancha; nunca 3', () => {
    expect(compasesPorFila(358, 4)).toBe(2);
    expect(compasesPorFila(720, 4)).toBe(4);
    expect(compasesPorFila(1400, 4)).toBe(8);
    expect(compasesPorFila(500, 4)).toBe(2); // cabrían 3, pero partirían la frase
    expect(compasesPorFila(150, 4)).toBe(1);
  });
  it('en 3/4 los compases son más estrechos y caben más', () => {
    expect(compasesPorFila(520, 3)).toBe(4);
  });
});

describe('casillasDeCompas', () => {
  it('varios cambios dentro de un compás: el nombre aparece solo donde cambia', () => {
    const c = casillasDeCompas(['D', 'D', 'E', 'B7'], 6, 0.5, 'D');
    expect(c.map((x) => x.cambia)).toEqual([false, false, true, true]);
    expect(c[0].recuerda).toBe(true); // empieza compás con el acorde de antes: se recuerda en tenue
    expect(c.map((x) => x.t0)).toEqual([6, 6.5, 7, 7.5]);
  });
  it('los silencios no se escriben ni se recuerdan', () => {
    const c = casillasDeCompas(['N', 'N', 'E', 'E'], 0, 0.5, 'A');
    expect(c.map((x) => x.cambia)).toEqual([false, false, true, false]);
    expect(c[0].recuerda).toBe(false);
  });
  it('un tiempo antes del inicio del audio salta al segundo 0', () => {
    expect(casillasDeCompas(['E', 'E'], -0.7, 0.5, null).map((x) => x.t0)).toEqual([0, 0]);
  });
});

describe('filasDeCompases', () => {
  it('cada sección empieza fila y se marca su primera fila', () => {
    const f = filasDeCompases(cuadricula, 8);
    expect(f.map((x) => x.compases.map((c) => c.n))).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]]);
    expect(f.map((x) => x.primeraDelBloque)).toEqual([true, true]);
    const dos = filasDeCompases(cuadricula, 2);
    expect(dos).toHaveLength(4);
    expect(dos.map((x) => x.primeraDelBloque)).toEqual([true, false, true, false]);
  });
  it('el acorde que continúa entre compases no se repite como cambio', () => {
    const [primera] = filasDeCompases(cuadricula, 4);
    expect(primera.compases[0].casillas[0].cambia).toBe(true); // E al empezar
    expect(primera.compases[2].casillas[0].cambia).toBe(true); // A → D
    const cuarto = primera.compases[3].casillas;
    expect(cuarto[0].cambia).toBe(false);
    expect(cuarto[0].recuerda).toBe(true);
  });
});

describe('letraPorCompas', () => {
  it('reparte cada línea por los compases en que se canta', () => {
    const l = letraPorCompas(cuadricula, [
      { t0: 0.2, t1: 4.2, texto: 'toca igual se revienta' },
      { t0: 8.1, t1: 9.5, texto: 'producción' },
    ]);
    expect(l).toHaveLength(8);
    expect(l[0]).toBe('toca igual');
    expect(l[1]).toBe('se revienta');
    expect(l[4]).toBe('producción');
    expect(l[2]).toBe('');
  });
  it('sin letra, compases vacíos', () => {
    expect(letraPorCompas(cuadricula, undefined).every((x) => x === '')).toBe(true);
  });
});

describe('etiquetasDeCompas', () => {
  it('cada nombre ocupa las casillas hasta el siguiente cambio', () => {
    const e = etiquetasDeCompas(casillasDeCompas(['F#m7b5', 'F#m7b5', 'F#m7b5', 'B7'], 0, 0.5, null));
    expect(e).toEqual([
      { desde: 0, largo: 3, acorde: 'F#m7b5', tenue: false },
      { desde: 3, largo: 1, acorde: 'B7', tenue: false },
    ]);
  });
  it('el recordatorio va en tenue y los silencios cortan la etiqueta', () => {
    const e = etiquetasDeCompas(casillasDeCompas(['A', 'A', 'N', 'N'], 0, 0.5, 'A'));
    expect(e).toEqual([{ desde: 0, largo: 2, acorde: 'A', tenue: true }]);
  });
});

describe('nombresDeBloques', () => {
  it('numera las secciones que se repiten', () => {
    expect(nombresDeBloques({ ...cuadricula, bloques: [...cuadricula.bloques, { indice: 2, letra: 'A', desde: 9, hasta: 12, t0: 16, t1: 24 }] })).toEqual(['A', 'B', 'A 2']);
  });
});

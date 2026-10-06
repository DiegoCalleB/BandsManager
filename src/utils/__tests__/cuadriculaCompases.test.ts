import { describe, it, expect } from 'vitest';
import { construirCuadricula, posicionEnCuadricula, progresoDeTramo } from '../cuadriculaCompases';

/** Progresión que cambia cada compás de 4 tiempos, empezando en `inicio` s. */
function cancion(bpm: number, compases: string[], inicio = 0, tiempos = 4) {
  const barra = (60 / bpm) * tiempos;
  return compases.map((acorde, i) => ({ t0: inicio + i * barra, t1: inicio + (i + 1) * barra, acorde, confianza: 0.9 }));
}
const ciclo = (acordes: string[], veces: number) => Array.from({ length: veces }, () => acordes).flat();

describe('construirCuadricula', () => {
  it('encuentra el desfase: la música no empieza en el segundo 0', () => {
    const segs = cancion(120, ciclo(['Am', 'F', 'C', 'G'], 4), 0.8);
    const c = construirCuadricula(segs, 120, 33)!;
    expect(c.bpm).toBe(120);
    expect(c.tiemposPorCompas).toBe(4);
    expect(c.calidad).toBeGreaterThan(0.9);
    // un inicio de compás cae en 0,8 s (+ múltiplos de 2 s)
    const resto = ((c.inicioRejilla - 0.8) % 2 + 2) % 2;
    expect(Math.min(resto, 2 - resto)).toBeLessThan(0.08);
  });

  it('corrige un BPM de ficha que está a la mitad del real', () => {
    const segs = cancion(120, ciclo(['Em', 'C', 'G', 'D'], 4), 0);
    // a 60 BPM solo la mitad de los cambios cae en un inicio de compás: a 120 caen todos
    expect(construirCuadricula(segs, 60, 33)!.bpm).toBe(120);
  });

  it('limitación documentada: con la ficha al DOBLE del tempo real no se puede corregir', () => {
    // a 160 BPM (el doble de 80) los cambios de acorde caen igual de bien en la rejilla: no hay
    // forma de distinguirlos solo con acordes, así que se respeta la ficha.
    const segs = cancion(80, ciclo(['G', 'D', 'Em', 'C'], 4), 0);
    expect(construirCuadricula(segs, 160, 49)!.bpm).toBe(160);
  });

  it('respeta el BPM de la ficha cuando encaja', () => {
    expect(construirCuadricula(cancion(100, ciclo(['A', 'E', 'F#m', 'D'], 4)), 100, 40)!.bpm).toBe(100);
  });

  it('detecta compás de 3 tiempos', () => {
    const segs = cancion(150, ciclo(['G', 'D', 'Em', 'C'], 5), 0, 3);
    expect(construirCuadricula(segs, 150, 5 * 4 * (60 / 150) * 3)!.tiemposPorCompas).toBe(3);
  });

  it('los bloques agrupan 4 compases y repiten letra cuando la progresión se repite (A A B A)', () => {
    const A = ['Am', 'F', 'C', 'G'];
    const B = ['F', 'G', 'Am', 'Am'];
    const segs = cancion(120, [...A, ...A, ...B, ...A], 0);
    const c = construirCuadricula(segs, 120, 32)!;
    expect(c.bloques.map((b) => b.letra)).toEqual(['A', 'A', 'B', 'A']);
    expect(c.bloques[0]).toMatchObject({ desde: 1, hasta: 4 });
    expect(c.compases).toHaveLength(16);
    expect(c.compases[8].bloque).toBe(2);
  });

  it('una progresión de 8 compases que se repite entera da bloques de 8, no de 4', () => {
    const P = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E'];
    const segs = cancion(120, [...P, ...P, ...P], 0);
    const c = construirCuadricula(segs, 120, 48)!;
    expect(c.bloques).toHaveLength(3);
    expect(c.bloques.every((b) => b.letra === 'A')).toBe(true);
    expect(c.bloques[0]).toMatchObject({ desde: 1, hasta: 8 });
  });

  it('si los acordes no caen en pulsos, no inventa compases', () => {
    // cambios cada 1,37 s con un BPM de 120 (pulso 0,5 s): no encajan
    const segs = Array.from({ length: 12 }, (_, i) => ({ t0: i * 1.37, t1: (i + 1) * 1.37, acorde: i % 2 ? 'C' : 'G', confianza: 0.9 }));
    expect(construirCuadricula(segs, 120, 16.4)).toBeNull();
  });

  it('sin BPM, con BPM absurdo o sin cambios suficientes → null', () => {
    const segs = cancion(120, ciclo(['Am', 'F', 'C', 'G'], 4));
    expect(construirCuadricula(segs, undefined, 33)).toBeNull();
    expect(construirCuadricula(segs, 5, 33)).toBeNull();
    expect(construirCuadricula(cancion(120, ['Am', 'F']), 120, 4)).toBeNull();
  });
});

describe('posicionEnCuadricula', () => {
  const segs = cancion(120, ciclo(['Am', 'F', 'C', 'G'], 4), 0);
  const c = construirCuadricula(segs, 120, 33)!;

  it('da compás, tiempo y fracción del pulso', () => {
    expect(posicionEnCuadricula(c, 0.1)).toMatchObject({ compas: 1, tiempo: 1 });
    expect(posicionEnCuadricula(c, 1.1)).toMatchObject({ compas: 1, tiempo: 3 });
    expect(posicionEnCuadricula(c, 2.1)).toMatchObject({ compas: 2, tiempo: 1 });
    expect(posicionEnCuadricula(c, 2.25)!.fraccionPulso).toBeCloseTo(0.5, 1);
    expect(posicionEnCuadricula(c, 9)).toMatchObject({ compas: 5, bloque: 1 });
  });
});

describe('progresoDeTramo', () => {
  it('progreso y segundos restantes para el aro de cuenta atrás', () => {
    expect(progresoDeTramo(10, 14, 11)).toEqual({ progreso: 0.25, restante: 3 });
    expect(progresoDeTramo(10, 14, 9).progreso).toBe(0);
    expect(progresoDeTramo(10, 14, 20)).toEqual({ progreso: 1, restante: 0 });
  });
});

describe('construirCuadricula con el pulso medido en el audio', () => {
  const segs = cancion(120, ciclo(['Am', 'F', 'C', 'G'], 4), 0.8);

  it('manda sobre un BPM de ficha equivocado', () => {
    const c = construirCuadricula(segs, 97, 33, { bpm: 120, fase: 0.8, confianza: 0.8 })!;
    expect(c.bpm).toBe(120);
    expect(c.tiemposPorCompas).toBe(4);
    expect(c.compases.length).toBeGreaterThanOrEqual(15);
    const resto = ((c.inicioRejilla - 0.8) % 2 + 2) % 2;
    expect(Math.min(resto, 2 - resto)).toBeLessThan(0.05);
  });

  it('resuelve el doble de tempo que la ficha no podía distinguir (ficha 60 con el pulso en 120)', () => {
    const c = construirCuadricula(segs, 60, 33, { bpm: 120, fase: 0.8, confianza: 0.8 })!;
    expect(c.bpm).toBe(120);
  });

  it('con poca confianza en el pulso se vuelve al BPM de la ficha', () => {
    const c = construirCuadricula(segs, 120, 33, { bpm: 97, fase: 0, confianza: 0.2 })!;
    expect(c.bpm).toBe(120);
  });
});

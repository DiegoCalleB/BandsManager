import { describe, it, expect } from 'vitest';
import { bpmDeToques, desplazar, escalarTempo, mensajeCompases, sumarToque, validarAjusteCompases } from '../ajusteCompases';
import type { Cuadricula } from '../cuadriculaCompases';

const c = { bpm: 120, duracionPulso: 0.5, inicioRejilla: -0.25 } as Cuadricula;

describe('tap tempo', () => {
  it('saca el BPM de los toques y aguanta un toque flojo', () => {
    expect(bpmDeToques([0, 500, 1000, 1500])).toBe(120);
    expect(bpmDeToques([0, 500, 1020, 1500, 2000])).toBe(120);
  });
  it('necesita 3 toques y un tempo creíble', () => {
    expect(bpmDeToques([0, 500])).toBeNull();
    expect(bpmDeToques([0, 100, 200])).toBeNull();
  });
  it('una pausa larga reinicia la cuenta y se guardan los últimos 8', () => {
    expect(sumarToque([0, 500, 1000], 5000)).toEqual([5000]);
    expect(sumarToque(Array.from({ length: 8 }, (_, i) => i * 500), 4000)).toHaveLength(8);
  });
});

describe('correcciones', () => {
  it('desplazar mueve el compás 1 por tiempos sin cambiar el tempo', () => {
    expect(desplazar(c, { tiempos: 3 }, 1)).toEqual({ tiempos: 3, inicio: 0.25 });
    expect(desplazar(c, {}, -2).inicio).toBeCloseTo(-1.25);
  });
  it('mitad/doble respetan el rango y conservan el inicio de compás', () => {
    expect(escalarTempo(c, {}, 2)).toEqual({ bpm: 240, inicio: -0.25 });
    expect(escalarTempo(c, {}, 0.5)!.bpm).toBe(60);
    expect(escalarTempo({ ...c, bpm: 200 } as Cuadricula, {}, 2)).toBeNull();
  });
});

describe('mensajeCompases', () => {
  it('motivo exacto sin rejilla; aviso solo si es aproximada', () => {
    expect(mensajeCompases('sin-bpm', null)).toContain('Tap');
    expect(mensajeCompases(undefined, null)).toBeNull();
    const base = { bpm: 120, tiemposPorCompas: 4, duracionPulso: 0.5, inicioRejilla: 0, calidad: 1, compases: [], bloques: [] };
    expect(mensajeCompases(undefined, { ...base, aproximada: true, causa: 'no-encaja' })).toContain('aproximado');
    expect(mensajeCompases(undefined, { ...base, aproximada: false })).toBeNull();
  });
});

describe('correcciones sobre una rejilla del audio', () => {
  const pulsos = [0.5, 1.1, 1.6, 2.2, 2.7, 3.3, 3.8, 4.4, 4.9];
  const real = {
    bpm: 110, tiemposPorCompas: 4, duracionPulso: 0.55, inicioRejilla: 0.5, calidad: 1, aproximada: false, delAudio: true, bloques: [],
    compases: [{ n: 1, t0: 0.5, t1: 2.7, bloque: 0, acordes: [], pulsos: pulsos.slice(0, 4) }, { n: 2, t0: 2.7, t1: 4.9, bloque: 0, acordes: [], pulsos: pulsos.slice(4, 8) }],
  } as Cuadricula;

  it('◀ ▶ saltan al pulso vecino de verdad', () => {
    expect(desplazar(real, {}, 1).inicio).toBe(1.1);
    expect(desplazar(real, {}, -1).inicio).toBe(0.5);
  });

  it('½× conserva el «1» que había', () => {
    expect(escalarTempo(real, {}, 0.5)).toEqual({ bpm: 55, inicio: 0.5 });
  });
});

describe('validarAjusteCompases', () => {
  it('deja pasar un ajuste válido, redondeado, y descarta claves desconocidas', () => {
    expect(validarAjusteCompases({ bpm: 120.04, inicio: 1.23456, tiempos: 3, otra: 1 })).toEqual({ ajuste: { bpm: 120, inicio: 1.235, tiempos: 3 } });
    expect(validarAjusteCompases({})).toEqual({ ajuste: {} });
  });
  it('rechaza lo que no es creíble', () => {
    for (const malo of [null, [], 'x', { bpm: 20 }, { bpm: '120' }, { inicio: -1 }, { inicio: NaN }, { tiempos: 5 }]) {
      expect(validarAjusteCompases(malo)).toHaveProperty('error');
    }
  });
});

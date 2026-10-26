import { describe, it, expect } from 'vitest';
import { bpmDeToques, desplazar, escalarTempo, mensajeCompases, sumarToque } from '../ajusteCompases';
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

import { describe, it, expect, vi } from 'vitest';
import { programarClic, pulsosPendientes } from '../clicMetronomo';

describe('pulsosPendientes', () => {
  it('devuelve los pulsos que caen dentro del horizonte', () => {
    // 120 bpm = 0,5 s por pulso
    expect(pulsosPendientes(1, 1, 0.1, 0.5)).toEqual([1]);
    expect(pulsosPendientes(1, 1, 1.2, 0.5)).toEqual([1, 1.5, 2]);
  });
  it('no devuelve nada si el próximo pulso queda fuera o el tempo no es válido', () => {
    expect(pulsosPendientes(2, 1, 0.1, 0.5)).toEqual([]);
    expect(pulsosPendientes(1, 1, 1, 0)).toEqual([]);
    expect(pulsosPendientes(1, 1, 1, NaN)).toEqual([]);
  });
  it('acota el trabajo si el timer se quedó dormido mucho tiempo', () => {
    expect(pulsosPendientes(0, 1000, 0.1, 0.5).length).toBeLessThanOrEqual(64);
  });
});

describe('programarClic', () => {
  const falso = () => {
    const osc = { type: '', frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
    const gain = { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    const ctx = { createOscillator: () => osc, createGain: () => gain, destination: {} } as unknown as AudioContext;
    return { ctx, osc, gain };
  };
  it('el acento es más agudo y más fuerte que el pulso normal', () => {
    const a = falso(); programarClic(a.ctx, 1, true, 1);
    const n = falso(); programarClic(n.ctx, 1, false, 1);
    expect(a.osc.frequency.value).toBeGreaterThan(n.osc.frequency.value);
    expect(a.gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeGreaterThan(n.gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]);
    expect(a.osc.start).toHaveBeenCalledWith(1);
  });
  it('con volumen 0 no revienta la rampa exponencial (nunca llega a 0)', () => {
    const a = falso(); programarClic(a.ctx, 0, true, 0);
    expect(a.gain.gain.exponentialRampToValueAtTime.mock.calls[0][0]).toBeGreaterThan(0);
  });
});

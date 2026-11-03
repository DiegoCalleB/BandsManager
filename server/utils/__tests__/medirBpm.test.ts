import { describe, it, expect } from 'vitest';
import { bpmDesdePulsos } from '../medirBpm';

/** Pulsos de un tema a `bpm` fijo, cuantizados a tramas de 20 ms como los que da la red. */
const pulsos = (bpm: number, n = 80, t0 = 1.03) => Array.from({ length: n }, (_, i) => Math.round((t0 + (i * 60) / bpm) / 0.02) * 0.02);

describe('bpmDesdePulsos', () => {
  it.each([60, 66, 68, 72, 80, 92, 100, 120, 128, 138, 146, 160, 172, 190])('mide %i BPM con error menor de 0,5 BPM pese a la cuantización de 20 ms', (bpm) => {
    expect(Math.abs((bpmDesdePulsos(pulsos(bpm)) as number) - bpm)).toBeLessThan(0.5);
  });

  it('la mediana de intervalos fallaba aquí (130,4 por 128; 176,5 por 172) y el ajuste no', () => {
    const p = pulsos(128);
    const intervalos = p.slice(1).map((t, i) => t - p[i]).sort((a, b) => a - b);
    const porMediana = 60 / intervalos[Math.floor(intervalos.length / 2)];
    expect(Math.abs(porMediana - 128)).toBeGreaterThan(Math.abs((bpmDesdePulsos(p) as number) - 128));
  });

  it('aguanta pulsos que la red no marcó (huecos)', () => {
    const p = pulsos(120).filter((_, i) => i % 9 !== 4);
    expect(Math.abs((bpmDesdePulsos(p) as number) - 120)).toBeLessThan(0.6);
  });

  it('ignora marcas espurias fuera de pulso', () => {
    const p = pulsos(100);
    const conRuido = [...p, ...p.filter((_, i) => i % 11 === 3).map((t) => t + 0.17)].sort((a, b) => a - b);
    expect(Math.abs((bpmDesdePulsos(conRuido) as number) - 100)).toBeLessThan(1.5);
  });

  it('con tempo que cambia da el tempo medio', () => {
    const t: number[] = [];
    for (let x = 1, k = 0; k < 120; k++) { t.push(x); x += 60 / (110 + (18 * k) / 120); }
    const bpm = bpmDesdePulsos(t) as number;
    expect(bpm).toBeGreaterThan(116);
    expect(bpm).toBeLessThan(122);
  });

  it('sin pulsos suficientes o con intervalos imposibles no se inventa un BPM', () => {
    expect(bpmDesdePulsos([])).toBeNull();
    expect(bpmDesdePulsos([1, 2, 3])).toBeNull();
    expect(bpmDesdePulsos(Array.from({ length: 30 }, (_, i) => i * 0.05))).toBeNull(); // 1200 BPM
    expect(bpmDesdePulsos(Array.from({ length: 30 }, (_, i) => i * 3))).toBeNull(); // 20 BPM
  });
});

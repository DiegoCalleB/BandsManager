import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('canción real: «Going Down» en directo (Greek Theatre)', () => {
  // 594 pulsos que midió Beat This! sobre el audio real (6:18, directo con deriva de ±1 BPM y un final con aplausos
  // y marcas espurias a partir de ~330 s). La banda la toca a 93; el detector antiguo guardaba 91.
  const real: number[] = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'pulsos-going-down.json'), 'utf8'));

  it('sale 93 al redondear, y el final ruidoso no lo mueve', () => {
    const entera = bpmDesdePulsos(real) as number;
    const sinFinal = bpmDesdePulsos(real.filter((t) => t < 330)) as number;
    expect(Math.round(entera)).toBe(93);
    expect(Math.abs(entera - sinFinal)).toBeLessThan(0.3);
  });
});

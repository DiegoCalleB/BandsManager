import { describe, it, expect } from 'vitest';
import { detectarAcordesDesdePcm, SegmentoAcorde } from '../chordDetection';

const SR = 11025;
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Frecuencia de una nota por semitonos desde La4 (440 Hz). */
const freq = (semitonosDesdeLa4: number) => 440 * Math.pow(2, semitonosDesdeLa4 / 12);

/** Triada con 4 armónicos que decaen (timbre de cuerda/teclado) más bajo en la raíz. */
function acorde(raiz: number, tipo: 'maj' | 'min', seg: number): Float32Array {
  const n = Math.round(seg * SR);
  const out = new Float32Array(n);
  const ints = tipo === 'maj' ? [0, 4, 7] : [0, 3, 7];
  // C4 está a -9 semitonos de A4.
  const notas = ints.map((i) => -9 + ((raiz + i) % 12) + (raiz + i >= 12 ? 0 : 0));
  const bajo = -9 + raiz - 12;
  const voces = [...notas, bajo];
  for (const v of voces) {
    const f0 = freq(v);
    for (let h = 1; h <= 4; h++) {
      const amp = (v === bajo ? 0.5 : 0.3) / h;
      for (let i = 0; i < n; i++) out[i] += amp * Math.sin((2 * Math.PI * f0 * h * i) / SR);
    }
  }
  return out;
}

function concatenar(trozos: Float32Array[]): Float32Array {
  const total = trozos.reduce((a, t) => a + t.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const t of trozos) { out.set(t, o); o += t.length; }
  return out;
}

/** Fracción del tiempo en la que el acorde detectado coincide con la verdad. */
function aciertoPorTiempo(detectado: SegmentoAcorde[], verdad: { acorde: string; t0: number; t1: number }[]): number {
  let ok = 0, total = 0;
  for (const v of verdad) {
    for (let t = v.t0 + 0.4; t < v.t1 - 0.4; t += 0.1) {
      total++;
      const seg = detectado.find((s) => t >= s.t0 && t < s.t1);
      if (seg?.acorde === v.acorde) ok++;
    }
  }
  return total === 0 ? 0 : ok / total;
}

const prog = (raices: [number, 'maj' | 'min'][], segPorAcorde = 2) => {
  const trozos = raices.map(([r, t]) => acorde(r, t, segPorAcorde));
  const verdad = raices.map(([r, t], i) => ({
    acorde: `${NOTAS[r]}${t === 'min' ? 'm' : ''}`, t0: i * segPorAcorde, t1: (i + 1) * segPorAcorde,
  }));
  return { pcm: concatenar(trozos), verdad };
};

describe('detectarAcordesDesdePcm', () => {
  it('reconoce C - G - Am - F con tiempos correctos', () => {
    const { pcm, verdad } = prog([[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']]);
    const det = detectarAcordesDesdePcm(pcm, SR);
    expect(det.map((s) => s.acorde)).toEqual(['C', 'G', 'Am', 'F']);
    expect(aciertoPorTiempo(det, verdad)).toBeGreaterThan(0.9);
    // Los cortes caen cerca de los 2, 4 y 6 s reales.
    [2, 4, 6].forEach((t, i) => expect(Math.abs(det[i].t1 - t)).toBeLessThan(0.45));
  });

  it('es invariante a transposición (Em - C - G - D)', () => {
    const { pcm, verdad } = prog([[4, 'min'], [0, 'maj'], [7, 'maj'], [2, 'maj']]);
    const det = detectarAcordesDesdePcm(pcm, SR);
    expect(aciertoPorTiempo(det, verdad)).toBeGreaterThan(0.9);
  });

  it('con la tonalidad conocida no empeora', () => {
    const { pcm, verdad } = prog([[9, 'min'], [5, 'maj'], [0, 'maj'], [7, 'maj']]);
    const det = detectarAcordesDesdePcm(pcm, SR, { tonalidad: 'Am' });
    expect(aciertoPorTiempo(det, verdad)).toBeGreaterThan(0.9);
  });

  it('no inventa acordes en el silencio', () => {
    const det = detectarAcordesDesdePcm(new Float32Array(SR * 4), SR);
    expect(det.every((s) => s.acorde === 'N')).toBe(true);
  });

  it('devuelve [] con audio demasiado corto', () => {
    expect(detectarAcordesDesdePcm(new Float32Array(100), SR)).toEqual([]);
  });

  it('los segmentos son contiguos, ordenados y sin solapes', () => {
    const { pcm } = prog([[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']]);
    const det = detectarAcordesDesdePcm(pcm, SR);
    for (let i = 1; i < det.length; i++) expect(det[i].t0).toBeGreaterThanOrEqual(det[i - 1].t1 - 1e-6);
    det.forEach((s) => expect(s.t1).toBeGreaterThan(s.t0));
  });
});

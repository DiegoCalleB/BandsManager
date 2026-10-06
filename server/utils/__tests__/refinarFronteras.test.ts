import { describe, it, expect } from 'vitest';
import { detectarAcordesDesdePcm } from '../chordDetection';
import { refinarFronterasConAtaques } from '../refinarFronteras';

const SR = 11025;
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Acordes que arrancan con un ataque (decaimiento exponencial) en tiempos NO múltiplos del salto del detector. */
function sintetizar(cambios: { t: number; notas: number[] }[], dur: number) {
  const out = new Float32Array(Math.round(dur * SR));
  cambios.forEach((c, k) => {
    const fin = k + 1 < cambios.length ? cambios[k + 1].t : dur;
    const i0 = Math.round(c.t * SR), i1 = Math.round(fin * SR);
    for (let i = i0; i < i1; i++) {
      const s = (i - i0) / SR;
      const env = 0.35 + 0.65 * Math.exp(-s * 6);
      let v = 0;
      for (const n of c.notas) for (let h = 1; h <= 3; h++) v += Math.sin((2 * Math.PI * midi(n) * h * i) / SR) / h;
      out[i] += env * v * 0.15;
    }
  });
  return out;
}

describe('refinarFronterasConAtaques', () => {
  const C = [48, 52, 55], G = [43, 47, 50], Am = [45, 48, 52], F = [41, 45, 48];
  const reales = [0, 2.13, 4.27, 6.4, 8.53];
  const pcm = sintetizar([
    { t: reales[0], notas: C }, { t: reales[1], notas: G }, { t: reales[2], notas: Am }, { t: reales[3], notas: F },
  ], 8.53);

  const error = (segs: { t0: number }[]) => {
    const errs = reales.slice(1, 4).map((r) => Math.min(...segs.map((s) => Math.abs(s.t0 - r))));
    return errs.reduce((a, b) => a + b, 0) / errs.length;
  };

  it('acerca las fronteras al ataque real', () => {
    const segs = detectarAcordesDesdePcm(pcm, SR, { tonalidad: "C" });
    expect(segs.length).toBeGreaterThanOrEqual(4);
    expect(error(segs)).toBeLessThan(0.08);
  });

  it('no mueve nada sin ataque claro y mantiene los segmentos contiguos', () => {
    const base = [
      { t0: 0, t1: 3, acorde: 'C', confianza: 1 },
      { t0: 3, t1: 6, acorde: 'G', confianza: 1 },
    ];
    const tono = new Float32Array(6 * SR).map((_, i) => 0.2 * Math.sin((2 * Math.PI * 220 * i) / SR));
    const r = refinarFronterasConAtaques(base, tono, SR);
    expect(r[0].t1).toBe(r[1].t0);
    expect(r[1].t0).toBe(3);
  });
});

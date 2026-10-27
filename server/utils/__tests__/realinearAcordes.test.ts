import { describe, it, expect } from 'vitest';
import { realinearFronteras } from '../realinearAcordes';
import { refinarFronterasConAtaques } from '../refinarFronteras';

const SR = 11025;
const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Acordes sostenidos con ataque suave, más una «caja» de ruido fuerte cada 0,5 s desfasada de los cambios. */
function sintetizar(cambios: { t: number; notas: number[] }[], dur: number, bateria: boolean) {
  const out = new Float32Array(Math.round(dur * SR));
  cambios.forEach((c, k) => {
    const fin = k + 1 < cambios.length ? cambios[k + 1].t : dur;
    for (let i = Math.round(c.t * SR); i < Math.round(fin * SR); i++) {
      let v = 0;
      for (const n of c.notas) for (let h = 1; h <= 3; h++) v += Math.sin((2 * Math.PI * midi(n) * h * i) / SR) / h;
      out[i] += v * 0.12;
    }
  });
  if (bateria) {
    let semilla = 7;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647) * 2 - 1;
    for (let g = 0.37; g < dur; g += 0.5) {
      for (let i = Math.round(g * SR); i < Math.min(out.length, Math.round((g + 0.12) * SR)); i++) {
        out[i] += azar() * 0.9 * Math.exp(-(i / SR - g) * 30);
      }
    }
  }
  return out;
}

describe('realinearFronteras', () => {
  const C = [48, 52, 55], G = [43, 47, 50], Am = [45, 48, 52], F = [41, 45, 48];
  const reales = [0, 2.13, 4.27, 6.4];
  const acordes = ['C', 'G', 'Am', 'F'];
  const dur = 8.53;
  const pcm = sintetizar(reales.map((t, k) => ({ t, notas: [C, G, Am, F][k] })), dur, true);
  // Fronteras gruesas del detector: desfasadas ±0,17 s, como las que dejan sus ventanas de 370 ms.
  const gruesas = (desfase: number[]) =>
    reales.map((t, k) => ({ t0: k === 0 ? 0 : t + desfase[k], t1: k + 1 < reales.length ? reales[k + 1] + desfase[k + 1] : dur, acorde: acordes[k], confianza: 0.8 }));
  const error = (segs: { t0: number }[]) => reales.slice(1).map((r, k) => Math.abs(segs[k + 1].t0 - r));

  it('corrige fronteras adelantadas o retrasadas aunque haya batería fuerte', () => {
    const { segmentos, confirmadas } = realinearFronteras(gruesas([0, -0.17, 0.17, -0.12]), pcm, SR);
    for (const e of error(segmentos)) expect(e).toBeLessThan(0.1);
    expect(confirmadas.size).toBe(3);
  });

  it('el flujo de la mezcla solo, con esa batería, se equivoca más', () => {
    const flujo = refinarFronterasConAtaques(gruesas([0, -0.17, 0.17, -0.12]), pcm, SR);
    const arm = realinearFronteras(gruesas([0, -0.17, 0.17, -0.12]), pcm, SR).segmentos;
    const media = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    expect(media(error(arm))).toBeLessThan(media(error(flujo)));
  });

  it('deja los segmentos contiguos y no toca los silencios', () => {
    const base = gruesas([0, 0.1, 0.1, 0.1]);
    base[1].acorde = 'N';
    const { segmentos } = realinearFronteras(base, pcm, SR);
    segmentos.slice(1).forEach((s, k) => expect(s.t0).toBe(segmentos[k].t1));
    expect(segmentos[1].t0).toBe(base[1].t0);
  });
});

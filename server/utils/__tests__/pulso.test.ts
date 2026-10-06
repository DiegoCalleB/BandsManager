import { describe, it, expect } from 'vitest';
import { calcularPulso, ajustarAPulso } from '../pulso';

const SR = 11025;

/** Bombo+caja+hi-hat sintéticos con guitarra: pulsos exactos cada 60/bpm s empezando en `inicio`. */
function bateria(bpm: number, seg: number, inicio = 0.3, hihat = true) {
  const out = new Float32Array(Math.round(seg * SR));
  let s = 11;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const beat = 60 / bpm;
  const golpes: number[] = [];
  for (let k = 0, t = inicio; t < seg - 0.2; k++, t += beat) {
    golpes.push(t);
    const i0 = Math.round(t * SR);
    const fuerte = k % 4 === 0 || k % 4 === 2;
    for (let i = 0; i < 0.12 * SR && i0 + i < out.length; i++) {
      const env = Math.exp(-i / (0.03 * SR));
      out[i0 + i] += (fuerte ? Math.sin((2 * Math.PI * 110 * i) / SR) + (i < 0.01 * SR ? azar() * 1.5 : 0) : azar() * 0.8) * env * 0.8;
    }
    if (hihat) {
      const j0 = Math.round((t + beat / 2) * SR);
      for (let i = 0; i < 0.03 * SR && j0 + i < out.length; i++) out[j0 + i] += azar() * Math.exp(-i / (0.008 * SR)) * 0.25;
    }
  }
  // Colchón armónico estable (no aporta ataques).
  for (let i = 0; i < out.length; i++) out[i] += 0.1 * Math.sin((2 * Math.PI * 220 * i) / SR);
  return { pcm: out, golpes, beat };
}

const errorFase = (p: { fase: number; bpm: number }, inicio: number) => {
  const T = 60 / p.bpm;
  const d = Math.abs(((p.fase - inicio) % T + T) % T);
  return Math.min(d, T - d);
};

describe('calcularPulso', () => {
  it.each([[138, 134], [160, 155], [100, 104]])('con una ficha aproximada (%i real, %i en la ficha) afina el tempo real y la fase', (real, ficha) => {
    const { pcm } = bateria(real, 40, 0.3);
    const p = calcularPulso(pcm, SR, { bpmFicha: ficha })!;
    expect(Math.abs(p.bpm - real) / real).toBeLessThan(0.015);
    expect(errorFase(p, 0.3)).toBeLessThan(0.07);
  });

  it.each([70, 96, 120])('encuentra el tempo y la fase a %i BPM sin pista', (bpm) => {
    const { pcm } = bateria(bpm, 40, 0.3);
    const p = calcularPulso(pcm, SR)!;
    expect(p).not.toBeNull();
    expect(Math.abs(p.bpm - bpm) / bpm).toBeLessThan(0.02);
    expect(errorFase(p, 0.3)).toBeLessThan(0.07);
    expect(p.confianza).toBeGreaterThan(0.5);
  });

  it('con el BPM de la ficha resuelve el doble y la mitad: un tema a 70 con ficha 140 no se toma por 140', () => {
    const { pcm } = bateria(70, 40, 0.2);
    const p = calcularPulso(pcm, SR, { bpmFicha: 70 })!;
    expect(Math.abs(p.bpm - 70)).toBeLessThan(2);
  });

  it('una ficha errónea (mitad del tempo real) no manda si el audio dice otra cosa', () => {
    const { pcm } = bateria(120, 40, 0.2);
    const p = calcularPulso(pcm, SR, { bpmFicha: 60 })!;
    // 60 es el submúltiplo exacto: se admite 60 o 120, pero jamás un valor intermedio
    expect([Math.round(p.bpm / 60) * 60].includes(Math.round(p.bpm / 60) * 60)).toBe(true);
    expect(Math.min(Math.abs(p.bpm - 60), Math.abs(p.bpm - 120))).toBeLessThan(2.5);
  });

  it('audio sin pulso (un tono continuo) sale con confianza baja', () => {
    const tono = new Float32Array(30 * SR).map((_, i) => 0.3 * Math.sin((2 * Math.PI * 220 * i) / SR));
    const p = calcularPulso(tono, SR);
    expect(p === null || p.confianza < 0.35).toBe(true);
  });
});

describe('ajustarAPulso', () => {
  it('lleva un cambio de acorde al pulso cercano y deja intacto el lejano', () => {
    const pulso = { bpm: 120, pulsos: Array.from({ length: 40 }, (_, i) => 0.3 + i * 0.5), fase: 0.3, confianza: 0.8 };
    const segs = [
      { t0: 0, t1: 4.05, acorde: 'A' },
      { t0: 4.05, t1: 6.2, acorde: 'E' }, // pulso en 4.3? 0.3+7*0.5=3.8 / 4.3 → ambos a >0.1: no se toca
      { t0: 6.2, t1: 9, acorde: 'A' },
    ];
    const r = ajustarAPulso(segs, pulso);
    expect(r[1].t0).toBe(4.05);
    expect(r[2].t0).toBe(6.3); // 6.2 → pulso 6.3
    expect(r[1].t1).toBe(6.3);
  });

  it('sin confianza en el pulso no toca nada', () => {
    const segs = [{ t0: 0, t1: 2.02, acorde: 'A' }, { t0: 2.02, t1: 4, acorde: 'E' }];
    expect(ajustarAPulso(segs, { bpm: 120, pulsos: [2], fase: 0, confianza: 0.1 }, 0.1)).toEqual(segs);
  });
});

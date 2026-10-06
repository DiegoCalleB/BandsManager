import { describe, it, expect } from 'vitest';
import { detectarAcordesDesdePcm } from '../chordDetection';
import { motivoAnalisisPocoFiable } from '../analisisAcordes';

/**
 * Audio sintético que se parece a una canción de rock real, no a un tono limpio: power chords
 * distorsionados (raíz + quinta + octava, tercera apenas), bajo, batería (ruido percusivo) y una
 * voz que no sigue los acordes. Con el detector anterior (solo croma completo) esto daba
 * 0-38 % y, sobre una canción real de 3 min, un único acorde de principio a fin.
 */
const SR = 11025;
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiAFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function rock(prog: [number, 'maj' | 'min'][], bpm: number, repeticiones: number, op: { ruido?: number; voz?: number; bajo?: number; distorsion?: number } = {}) {
  const { ruido = 0.5, voz = 0.35, bajo: ampBajo = 0.5, distorsion = 8 } = op;
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const beat = 60 / bpm;
  const barra = beat * 4;
  const out = new Float32Array(Math.round(prog.length * repeticiones * barra * SR));
  const verdad: { acorde: string; t0: number; t1: number }[] = [];
  let t = 0;
  for (let r = 0; r < repeticiones; r++) {
    for (const [raiz, tipo] of prog) {
      const n = Math.round(barra * SR);
      const ini = Math.round(t * SR);
      const rootMidi = 45 + ((raiz - 9 + 12) % 12);
      const guitarra = new Float32Array(n);
      for (const [semi, amp] of [[0, 1], [7, 0.8], [12, 0.8], [(tipo === 'min' ? 3 : 4) + 12, 0.25]] as [number, number][]) {
        const f0 = midiAFreq(rootMidi + 12 + semi);
        for (let h = 1; h <= 5; h++) for (let i = 0; i < n; i++) guitarra[i] += (amp / h) * Math.sin((2 * Math.PI * f0 * h * i) / SR);
      }
      for (let i = 0; i < n; i++) guitarra[i] = Math.tanh(distorsion * guitarra[i] * 0.4) * 0.6;
      const fb = midiAFreq(rootMidi);
      for (let i = 0; i < n; i++) {
        const pos = (i / SR) % beat;
        const nb = Math.floor(i / SR / beat) % 4;
        let bat = 0;
        if (pos < 0.08) bat += ruido * (azar() * 2 - 1) * Math.exp(-pos * 40) * (nb % 2 === 1 ? 1 : 0.6);
        if (pos % (beat / 2) < 0.02) bat += 0.15 * ruido * (azar() * 2 - 1);
        const vf = midiAFreq(69 + [0, 3, 5, 7, 10][Math.floor((i / SR) * 1.7) % 5]);
        const v = voz * (Math.sin((2 * Math.PI * vf * i) / SR) + 0.4 * Math.sin((4 * Math.PI * vf * i) / SR));
        out[ini + i] += guitarra[i] + ampBajo * Math.sin((2 * Math.PI * fb * i) / SR) + bat + v;
      }
      verdad.push({ acorde: NOTAS[raiz] + (tipo === 'min' ? 'm' : ''), t0: t, t1: t + barra });
      t += barra;
    }
  }
  return { pcm: out, verdad };
}

function acierto(det: { t0: number; t1: number; acorde: string }[], verdad: { acorde: string; t0: number; t1: number }[]) {
  let ok = 0;
  let total = 0;
  for (const v of verdad) {
    for (let x = v.t0 + 0.3; x < v.t1 - 0.3; x += 0.1) {
      total++;
      if (det.find((s) => x >= s.t0 && x < s.t1)?.acorde === v.acorde) ok++;
    }
  }
  return ok / total;
}

describe('detección sobre rock denso (guitarras distorsionadas + batería + voz)', () => {
  it('A-E-F#m-D a 138 BPM con la tonalidad conocida: >90 % y sin colapsar en un acorde', () => {
    const { pcm, verdad } = rock([[9, 'maj'], [4, 'maj'], [6, 'min'], [2, 'maj']], 138, 6);
    const det = detectarAcordesDesdePcm(pcm, SR, { tonalidad: 'A' });
    expect(acierto(det, verdad)).toBeGreaterThan(0.9);
    expect(det.length).toBeGreaterThanOrEqual(20); // 24 cambios reales
  });

  it('sin tonalidad indicada la estima del audio y resuelve mayor/menor en power chords', () => {
    const { pcm, verdad } = rock([[6, 'min'], [2, 'maj'], [9, 'maj'], [4, 'maj']], 100, 5);
    expect(acierto(detectarAcordesDesdePcm(pcm, SR), verdad)).toBeGreaterThan(0.9);
  });

  it('con el bajo muy flojo o ausente sigue acertando (el croma completo + la tonalidad compensan)', () => {
    const { pcm, verdad } = rock([[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']], 120, 5, { bajo: 0 });
    expect(acierto(detectarAcordesDesdePcm(pcm, SR, { tonalidad: 'C' }), verdad)).toBeGreaterThan(0.85);
  });

  it('Em-C-G-D a 150 BPM (rock)', () => {
    const { pcm, verdad } = rock([[4, 'min'], [0, 'maj'], [7, 'maj'], [2, 'maj']], 150, 5);
    expect(acierto(detectarAcordesDesdePcm(pcm, SR, { tonalidad: 'Em' }), verdad)).toBeGreaterThan(0.9);
  });
});

describe('motivoAnalisisPocoFiable: no se guarda un resultado increíble', () => {
  const seg = (acorde: string, t0: number, t1: number) => ({ t0, t1, acorde });

  it('un solo acorde de 0:00 a 3:07 (el fallo real visto en producción) se rechaza', () => {
    expect(motivoAnalisisPocoFiable([seg('E', 0, 187)], 187)).toMatch(/solo encontró un acorde/);
  });

  it('todo «N» o casi todo «N» se rechaza', () => {
    expect(motivoAnalisisPocoFiable([seg('N', 0, 60)], 60)).toMatch(/No se detectaron acordes/);
    expect(motivoAnalisisPocoFiable([seg('C', 0, 10), seg('N', 10, 100)], 100)).toMatch(/mayor parte/);
  });

  it('una canción normal se acepta', () => {
    const segs = Array.from({ length: 40 }, (_, i) => seg(['C', 'G', 'Am', 'F'][i % 4], i * 4, (i + 1) * 4));
    expect(motivoAnalisisPocoFiable(segs, 160)).toBeNull();
  });

  it('un tema corto con pocos acordes no se rechaza por poco cambio', () => {
    expect(motivoAnalisisPocoFiable([seg('Am', 0, 10), seg('G', 10, 20)], 20)).toBeNull();
  });
});

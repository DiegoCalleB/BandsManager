import { describe, it, expect } from 'vitest';
import { calcularCromaDesdePcm, detectarTonalidadDesdeCroma } from '../audioKey.js';

const SAMPLE_RATE = 11025;

/** Genera un tono puro de `freq` Hz, suficiente para llenar varios frames de análisis (~5s). */
function generarTonoPuro(freq: number, duracionSeg = 5, sampleRate = SAMPLE_RATE): Float32Array {
  const n = Math.round(duracionSeg * sampleRate);
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pcm[i] = 0.5 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return pcm;
}

const PERFIL_MAYOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const PERFIL_MENOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function rotarPerfil(perfil: number[], raiz: number): number[] {
  const n = perfil.length;
  return Array.from({ length: n }, (_, i) => perfil[(i - raiz + n) % n]);
}

describe('calcularCromaDesdePcm', () => {
  it('un tono puro de 440Hz (La) da su energía sobre todo en la clase de La', () => {
    const pcm = generarTonoPuro(440);
    const croma = calcularCromaDesdePcm(pcm, SAMPLE_RATE);
    expect(croma).not.toBeNull();
    const indiceLa = 9; // C,C#,D,D#,E,F,F#,G,G#,A,A#,B
    const maxIndice = croma!.indexOf(Math.max(...croma!));
    expect(maxIndice).toBe(indiceLa);
  });

  it('un tono puro de 261.63Hz (Do) da su energía sobre todo en la clase de Do', () => {
    const pcm = generarTonoPuro(261.63);
    const croma = calcularCromaDesdePcm(pcm, SAMPLE_RATE);
    expect(croma).not.toBeNull();
    const maxIndice = croma!.indexOf(Math.max(...croma!));
    expect(maxIndice).toBe(0);
  });

  it('demasiado corto para un solo frame de análisis devuelve null', () => {
    const pcm = new Float32Array(100);
    expect(calcularCromaDesdePcm(pcm, SAMPLE_RATE)).toBeNull();
  });

  it('silencio total no inventa una tonalidad: devuelve null', () => {
    const pcm = new Float32Array(Math.round(5 * SAMPLE_RATE));
    expect(calcularCromaDesdePcm(pcm, SAMPLE_RATE)).toBeNull();
  });

  it('el croma siempre suma 1 (normalizado) cuando hay señal', () => {
    const pcm = generarTonoPuro(220);
    const croma = calcularCromaDesdePcm(pcm, SAMPLE_RATE)!;
    const suma = croma.reduce((a, b) => a + b, 0);
    expect(suma).toBeGreaterThan(0.99);
    expect(suma).toBeLessThan(1.01);
  });
});

describe('detectarTonalidadDesdeCroma', () => {
  it('un croma que calca el perfil mayor de Sol detecta "G"', () => {
    const croma = rotarPerfil(PERFIL_MAYOR, 7); // Sol = índice 7
    const total = croma.reduce((a, b) => a + b, 0);
    const resultado = detectarTonalidadDesdeCroma(croma.map((v) => v / total));
    expect(resultado).not.toBeNull();
    expect(resultado!.tonalidad).toBe('G');
    expect(resultado!.confianza).toBeGreaterThan(0.9);
  });

  it('un croma que calca el perfil menor de La detecta "Am"', () => {
    const croma = rotarPerfil(PERFIL_MENOR, 9); // La = índice 9
    const total = croma.reduce((a, b) => a + b, 0);
    const resultado = detectarTonalidadDesdeCroma(croma.map((v) => v / total));
    expect(resultado).not.toBeNull();
    expect(resultado!.tonalidad).toBe('Am');
  });

  it('un croma completamente plano (sin tónica clara) no inventa una tonalidad: devuelve null', () => {
    const croma = new Array(12).fill(1 / 12);
    expect(detectarTonalidadDesdeCroma(croma)).toBeNull();
  });

  it('un vector con longitud distinta de 12 devuelve null en vez de lanzar', () => {
    expect(detectarTonalidadDesdeCroma([1, 2, 3])).toBeNull();
  });

  it('siempre devuelve un margen no negativo entre el mejor candidato y el segundo', () => {
    const croma = rotarPerfil(PERFIL_MAYOR, 0);
    const total = croma.reduce((a, b) => a + b, 0);
    const resultado = detectarTonalidadDesdeCroma(croma.map((v) => v / total));
    expect(resultado).not.toBeNull();
    expect(resultado!.margen).toBeGreaterThanOrEqual(0);
  });
});

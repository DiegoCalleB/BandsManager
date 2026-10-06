// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import {
  crearGeneradorDeterminista,
  prepararEventos,
  asignarVoces,
  clasificarGolpePercusion,
  normalizarPico,
  type BufferDeAudio
} from '../instrumentSynth';
import { MelodicNoteEvent } from '../../types';

describe('crearGeneradorDeterminista', () => {
  it('la misma semilla produce siempre la misma secuencia', () => {
    const a = crearGeneradorDeterminista(42);
    const b = crearGeneradorDeterminista(42);
    const secuenciaA = [a(), a(), a(), a()];
    const secuenciaB = [b(), b(), b(), b()];
    expect(secuenciaA).toEqual(secuenciaB);
  });

  it('semillas distintas producen secuencias distintas', () => {
    const a = crearGeneradorDeterminista(1);
    const b = crearGeneradorDeterminista(2);
    expect(a()).not.toBe(b());
  });

  it('siempre devuelve un número entre 0 (incluido) y 1 (excluido)', () => {
    const rng = crearGeneradorDeterminista(999);
    for (let i = 0; i < 200; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('prepararEventos', () => {
  const base: MelodicNoteEvent[] = [
    { tiempo: 0, nota: 'E4', duracionBeats: 1, velocidad: 0.9 },
    { tiempo: 2, nota: 'G4', duracionBeats: 0.5, velocidad: 0.5 }
  ];

  it('convierte beats a segundos absolutos según el bpm', () => {
    // A 120 BPM, 1 beat = 0.5s. Sin jitter (comprobamos con tolerancia el margen máximo).
    const preparados = prepararEventos(base, { instrument: 'handpan', bpm: 120, totalLength: 20, semilla: 1 });
    expect(preparados[0].tiempo).toBeCloseTo(0, 1);
    expect(preparados[1].tiempo).toBeCloseTo(1, 1); // 2 beats * 0.5s = 1s
  });

  it('es determinista: misma semilla, mismo resultado exacto', () => {
    const a = prepararEventos(base, { instrument: 'violin', bpm: 100, totalLength: 20, semilla: 7 });
    const b = prepararEventos(base, { instrument: 'violin', bpm: 100, totalLength: 20, semilla: 7 });
    expect(a).toEqual(b);
  });

  it('una semilla distinta cambia el resultado (para poder pedir "otra variación")', () => {
    const a = prepararEventos(base, { instrument: 'violin', bpm: 100, totalLength: 20, semilla: 1 });
    const b = prepararEventos(base, { instrument: 'violin', bpm: 100, totalLength: 20, semilla: 2 });
    expect(a).not.toEqual(b);
  });

  it('ordena los eventos por tiempo aunque lleguen desordenados', () => {
    const desordenados: MelodicNoteEvent[] = [
      { tiempo: 3, nota: 'G4', duracionBeats: 1 },
      { tiempo: 0, nota: 'E4', duracionBeats: 1 }
    ];
    const preparados = prepararEventos(desordenados, { instrument: 'guitarra', bpm: 120, totalLength: 20, semilla: 1 });
    expect(preparados[0].nota).toBe('E4');
    expect(preparados[1].nota).toBe('G4');
  });

  it('nunca desplaza una nota más allá del jitter máximo configurado del instrumento', () => {
    // La percusión tiene el jitter más ajustado (6ms): comprobamos el límite en muchas semillas.
    for (let semilla = 0; semilla < 50; semilla++) {
      const preparados = prepararEventos(
        [{ tiempo: 4, nota: 'C2', duracionBeats: 1 }],
        { instrument: 'percusion', bpm: 120, totalLength: 20, semilla }
      );
      const tiempoBase = 4 * (60 / 120);
      expect(Math.abs(preparados[0].tiempo - tiempoBase)).toBeLessThanOrEqual(0.006 + 1e-9);
    }
  });

  it('descarta un evento cuyo tiempo humanizado cae fuera de la duración total', () => {
    const preparados = prepararEventos(
      [{ tiempo: 39.999, nota: 'E4', duracionBeats: 1 }],
      // 40 beats a 120bpm = 20s exactos: este evento cae justo en el borde o más allá.
      { instrument: 'violin', bpm: 120, totalLength: 20, semilla: 3 }
    );
    expect(preparados.every((e) => e.tiempo < 20)).toBe(true);
  });

  it('acota la intensidad humanizada al rango 0.15–1', () => {
    for (let semilla = 0; semilla < 50; semilla++) {
      const preparados = prepararEventos(
        [{ tiempo: 0, nota: 'E4', duracionBeats: 1, velocidad: 1 }, { tiempo: 1, nota: 'E4', duracionBeats: 1, velocidad: 0.16 }],
        { instrument: 'percusion', bpm: 120, totalLength: 20, semilla }
      );
      for (const ev of preparados) {
        expect(ev.velocidad).toBeGreaterThanOrEqual(0.15);
        expect(ev.velocidad).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('asignarVoces', () => {
  it('reutiliza la misma voz para notas consecutivas que no se solapan', () => {
    const eventos = [
      { tiempo: 0, duracion: 1 },
      { tiempo: 1, duracion: 1 },
      { tiempo: 2, duracion: 1 }
    ];
    const asignacion = asignarVoces(eventos, 6);
    expect(asignacion).toEqual([0, 0, 0]);
  });

  it('reparte un acorde (notas simultáneas) en voces distintas', () => {
    const eventos = [
      { tiempo: 0, duracion: 2 },
      { tiempo: 0, duracion: 2 },
      { tiempo: 0, duracion: 2 }
    ];
    const asignacion = asignarVoces(eventos, 6);
    expect(new Set(asignacion).size).toBe(3);
  });

  it('cuando no hay voces libres, roba la que antes queda libre en vez de fallar', () => {
    const eventos = [
      { tiempo: 0, duracion: 5 },
      { tiempo: 0.1, duracion: 5 },
      { tiempo: 0.2, duracion: 5 } // con solo 2 voces, esta tiene que robar una
    ];
    const asignacion = asignarVoces(eventos, 2);
    expect(asignacion).toHaveLength(3);
    expect(asignacion.every((v) => v === 0 || v === 1)).toBe(true);
  });

  it('devuelve un índice por cada evento de entrada', () => {
    const eventos = Array.from({ length: 20 }, (_, i) => ({ tiempo: i * 0.1, duracion: 0.05 }));
    expect(asignarVoces(eventos, 6)).toHaveLength(20);
  });
});

describe('clasificarGolpePercusion', () => {
  it('clasifica las tres alturas exactas del validador', () => {
    expect(clasificarGolpePercusion(36)).toBe('grave'); // C2
    expect(clasificarGolpePercusion(43)).toBe('medio'); // G2
    expect(clasificarGolpePercusion(48)).toBe('agudo'); // C3
  });

  it('clasifica por proximidad cuando la nota no cae exacta', () => {
    expect(clasificarGolpePercusion(39)).toBe('grave'); // dist 3 a grave, 4 a medio
    expect(clasificarGolpePercusion(40)).toBe('medio'); // dist 4 a grave, 3 a medio
    expect(clasificarGolpePercusion(46)).toBe('agudo'); // dist 3 a medio, 2 a agudo
  });

  it('no falla con alturas muy fuera de rango: se queda con la más cercana', () => {
    expect(clasificarGolpePercusion(0)).toBe('grave');
    expect(clasificarGolpePercusion(127)).toBe('agudo');
  });
});

describe('normalizarPico', () => {
  function crearBuffer(canales: number[][]): BufferDeAudio {
    const datos = canales.map((c) => Float32Array.from(c));
    return {
      numberOfChannels: datos.length,
      getChannelData: (canal: number) => datos[canal]
    };
  }

  it('escala todo el buffer para que el pico absoluto llegue exactamente al objetivo', () => {
    const buffer = crearBuffer([[0.1, -0.5, 0.3]]);
    normalizarPico(buffer, 0.9);
    const datos = buffer.getChannelData(0);
    expect(Math.max(...Array.from(datos).map(Math.abs))).toBeCloseTo(0.9, 5);
    // Conserva las proporciones relativas entre muestras.
    expect(datos[1] / datos[0]).toBeCloseTo(-5, 5);
  });

  it('también amplifica una señal floja, no solo atenúa una fuerte', () => {
    const buffer = crearBuffer([[0.01, -0.02]]);
    normalizarPico(buffer, 0.9);
    expect(Math.abs(buffer.getChannelData(0)[1])).toBeCloseTo(0.9, 5);
  });

  it('usa el pico de TODOS los canales, no solo el primero', () => {
    // El pico real está en el canal derecho (0.8); si solo mirara el izquierdo (0.2),
    // el resultado saturaría muy por encima del objetivo.
    const buffer = crearBuffer([[0.2, -0.1], [0.8, -0.3]]);
    normalizarPico(buffer, 0.9);
    const izq = buffer.getChannelData(0);
    const der = buffer.getChannelData(1);
    const picoFinal = Math.max(...Array.from(izq).map(Math.abs), ...Array.from(der).map(Math.abs));
    expect(picoFinal).toBeCloseTo(0.9, 5);
  });

  it('no toca un buffer en silencio (evita dividir por cero)', () => {
    const buffer = crearBuffer([[0, 0, 0]]);
    normalizarPico(buffer, 0.9);
    expect(Array.from(buffer.getChannelData(0))).toEqual([0, 0, 0]);
  });

  it('usa -1 dBFS (0.891) como objetivo por defecto', () => {
    const buffer = crearBuffer([[0.5]]);
    normalizarPico(buffer);
    expect(buffer.getChannelData(0)[0]).toBeCloseTo(0.891, 3);
  });
});

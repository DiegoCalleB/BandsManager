// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { parseTonalidad, tonalidadesSonFiables, evaluarTransicionArmonica } from '../harmonicAnalysis';
import { Song } from '../../types';

describe('harmonicAnalysis', () => {
  describe('parseTonalidad', () => {
    it('reconoce notación española, mayor y menor', () => {
      expect(parseTonalidad('Do')).toEqual({ pitchClass: 0, isMinor: false });
      expect(parseTonalidad('Mim')).toEqual({ pitchClass: 4, isMinor: true });
      expect(parseTonalidad('Lam')).toEqual({ pitchClass: 9, isMinor: true });
      expect(parseTonalidad('Sol')).toEqual({ pitchClass: 7, isMinor: false });
      expect(parseTonalidad('Re menor')).toEqual({ pitchClass: 2, isMinor: true });
    });

    it('reconoce notación inglesa con alteraciones', () => {
      expect(parseTonalidad('Am')).toEqual({ pitchClass: 9, isMinor: true });
      expect(parseTonalidad('E')).toEqual({ pitchClass: 4, isMinor: false });
      expect(parseTonalidad('F#m')).toEqual({ pitchClass: 6, isMinor: true });
      expect(parseTonalidad('Bb')).toEqual({ pitchClass: 10, isMinor: false });
      expect(parseTonalidad('G')).toEqual({ pitchClass: 7, isMinor: false });
    });

    it('no confunde notas españolas de 2-3 letras con notas inglesas de 1 letra', () => {
      // "Do" no debe leerse como "D" + "o" residual
      expect(parseTonalidad('Do')?.pitchClass).toBe(0);
      // "Re" no debe leerse como "R"
      expect(parseTonalidad('Re')?.pitchClass).toBe(2);
    });

    it('devuelve null para texto vacío o irreconocible', () => {
      expect(parseTonalidad('')).toBeNull();
      expect(parseTonalidad(undefined)).toBeNull();
      expect(parseTonalidad('xyz')).toBeNull();
    });
  });

  describe('tonalidadesSonFiables', () => {
    it('false cuando la mayoría está en el fallback (Mim)', () => {
      const songs: Song[] = [
        { id: '1', titulo: 'A', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Mim', bpm: 120 },
        { id: '2', titulo: 'B', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Mim', bpm: 120 },
        { id: '3', titulo: 'C', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Sol', bpm: 120 }
      ];
      expect(tonalidadesSonFiables(songs)).toBe(false);
    });

    it('true cuando hay variedad real de tonalidades', () => {
      const songs: Song[] = [
        { id: '1', titulo: 'A', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Do', bpm: 120 },
        { id: '2', titulo: 'B', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Sol', bpm: 120 },
        { id: '3', titulo: 'C', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Mim', bpm: 120 },
        { id: '4', titulo: 'D', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Re', bpm: 120 }
      ];
      expect(tonalidadesSonFiables(songs)).toBe(true);
    });

    it('false con muy pocas canciones con tonalidad, aunque no coincidan', () => {
      const songs: Song[] = [
        { id: '1', titulo: 'A', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Do', bpm: 120 },
        { id: '2', titulo: 'B', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Sol', bpm: 120 }
      ];
      expect(tonalidadesSonFiables(songs)).toBe(false);
    });
  });

  describe('evaluarTransicionArmonica', () => {
    it('identica para la misma tonalidad exacta', () => {
      const a = parseTonalidad('Do')!;
      const b = parseTonalidad('Do')!;
      expect(evaluarTransicionArmonica(a, b)).toBe('identica');
    });

    it('compatible para relativas mayor/menor (Do <-> Lam)', () => {
      const doM = parseTonalidad('Do')!;
      const laM = parseTonalidad('Lam')!;
      expect(evaluarTransicionArmonica(doM, laM)).toBe('compatible');
    });

    it('compatible para una quinta adyacente (Do -> Sol)', () => {
      const doM = parseTonalidad('Do')!;
      const solM = parseTonalidad('Sol')!;
      expect(evaluarTransicionArmonica(doM, solM)).toBe('compatible');
    });

    it('compatible para una subida de tono (mismo modo, 1-2 semitonos)', () => {
      const doM = parseTonalidad('Do')!;
      const reM = parseTonalidad('Re')!;
      expect(evaluarTransicionArmonica(doM, reM)).toBe('compatible');
    });

    it('choque para un tritono (Do -> Fa#)', () => {
      const doM = parseTonalidad('Do')!;
      const fasM = parseTonalidad('F#')!;
      expect(evaluarTransicionArmonica(doM, fasM)).toBe('choque');
    });
  });
});

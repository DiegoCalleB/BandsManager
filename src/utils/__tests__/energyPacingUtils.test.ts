// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { getEnergyInfo, analyzeSetlistEnergy, calcularCurvaEnergiaIdeal } from '../energyPacingUtils';
import { Song, SetlistItem } from '../../types';

describe('energyPacingUtils', () => {
  it('getEnergyInfo asigna correctamente la categoría según el valor numérico', () => {
    expect(getEnergyInfo(6).category).toBe('balada');
    expect(getEnergyInfo(12).category).toBe('media');
    expect(getEnergyInfo(18).category).toBe('alta');
    expect(getEnergyInfo(20).category).toBe('explosiva');
  });

  it('getEnergyInfo deduce energía según BPM cuando no tiene energía asignada', () => {
    const songLenta: Song = { id: 's1', titulo: 'Balada', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 80 };
    const songCanera: Song = { id: 's2', titulo: 'Rock', duracion: '3:00', duracionSegundos: 180, tonalidad: 'E', bpm: 150 };

    expect(getEnergyInfo(songLenta).category).toBe('balada');
    expect(getEnergyInfo(songCanera).category).toBe('alta');
  });

  it('analyzeSetlistEnergy detecta valles de energía consecutiva (3+ baladas)', () => {
    const songs: Song[] = [
      { id: 's1', titulo: 'Balada 1', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 70, energia: 6 },
      { id: 's2', titulo: 'Balada 2', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 75, energia: 6 },
      { id: 's3', titulo: 'Balada 3', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 80, energia: 6 },
      { id: 's4', titulo: 'Hit', duracion: '3:00', duracionSegundos: 180, tonalidad: 'E', bpm: 150, energia: 20 }
    ];

    const items: SetlistItem[] = [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i2', tipoItem: 'cancion', songId: 's2' },
      { id: 'i3', tipoItem: 'cancion', songId: 's3' },
      { id: 'i4', tipoItem: 'cancion', songId: 's4' }
    ];

    const result = analyzeSetlistEnergy(items, songs);

    expect(result.warnings.some(w => w.message.includes('Valle detectado'))).toBe(true);
    expect(result.lowEnergyCount).toBe(3);
    expect(result.explosiveCount).toBe(1);
  });

  it('analyzeSetlistEnergy detecta un show In Crescendo', () => {
    const songs: Song[] = [
      { id: 's1', titulo: 'Intro Suave', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 80, energia: 6 },
      { id: 's2', titulo: 'Medio Tempo', duracion: '3:00', duracionSegundos: 180, tonalidad: 'G', bpm: 110, energia: 12 },
      { id: 's3', titulo: 'Cañera', duracion: '3:00', duracionSegundos: 180, tonalidad: 'D', bpm: 140, energia: 18 },
      { id: 's4', titulo: 'Traca Final', duracion: '3:00', duracionSegundos: 180, tonalidad: 'E', bpm: 160, energia: 20 }
    ];

    const items: SetlistItem[] = [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i2', tipoItem: 'cancion', songId: 's2' },
      { id: 'i3', tipoItem: 'cancion', songId: 's3' },
      { id: 'i4', tipoItem: 'cancion', songId: 's4' }
    ];

    const result = analyzeSetlistEnergy(items, songs);

    expect(result.profileType).toBe('in_crescendo');
    expect(result.warnings.some(w => w.message.includes('Cierre potente'))).toBe(true);
  });

  describe('calcularCurvaEnergiaIdeal', () => {
    const songs: Song[] = [
      { id: 's1', titulo: 'A', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 90, energia: 6 },
      { id: 's2', titulo: 'B', duracion: '3:00', duracionSegundos: 180, tonalidad: 'G', bpm: 110, energia: 10 },
      { id: 's3', titulo: 'C', duracion: '3:00', duracionSegundos: 180, tonalidad: 'D', bpm: 130, energia: 14 },
      { id: 's4', titulo: 'D', duracion: '3:00', duracionSegundos: 180, tonalidad: 'E', bpm: 150, energia: 18 },
      { id: 's5', titulo: 'E', duracion: '3:00', duracionSegundos: 180, tonalidad: 'E', bpm: 160, energia: 16 }
    ];
    const items: SetlistItem[] = songs.map((s, i) => ({ id: `i${i + 1}`, tipoItem: 'cancion', songId: s.id }));

    it('devuelve un valor por cada punto, dentro del rango real de energías del setlist', () => {
      const { points } = analyzeSetlistEnergy(items, songs);
      const ideal = calcularCurvaEnergiaIdeal(points);

      expect(ideal.length).toBe(points.length);
      const min = Math.min(...songs.map(s => s.energia!));
      const max = Math.max(...songs.map(s => s.energia!));
      ideal.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(min);
        expect(v).toBeLessThanOrEqual(max);
      });
    });

    it('el clímax cae cerca del final, no al principio', () => {
      const { points } = analyzeSetlistEnergy(items, songs);
      const ideal = calcularCurvaEnergiaIdeal(points);
      const maxIndex = ideal.indexOf(Math.max(...ideal));
      expect(maxIndex).toBeGreaterThanOrEqual(Math.floor(ideal.length * 0.6));
    });

    it('se aplana si el repertorio no tiene variación real de energía', () => {
      const flatSongs: Song[] = [
        { id: 'f1', titulo: 'A', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 120, energia: 10 },
        { id: 'f2', titulo: 'B', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 120, energia: 10 },
        { id: 'f3', titulo: 'C', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 120, energia: 11 }
      ];
      const flatItems: SetlistItem[] = flatSongs.map((s, i) => ({ id: `fi${i + 1}`, tipoItem: 'cancion', songId: s.id }));
      const { points } = analyzeSetlistEnergy(flatItems, flatSongs);
      const ideal = calcularCurvaEnergiaIdeal(points);

      expect(new Set(ideal).size).toBe(1);
    });

    it('con menos de 2 canciones, no falla y devuelve un valor plano', () => {
      const oneSong: Song[] = [{ id: 'o1', titulo: 'Sola', duracion: '3:00', duracionSegundos: 180, tonalidad: 'Am', bpm: 100, energia: 12 }];
      const oneItem: SetlistItem[] = [{ id: 'oi1', tipoItem: 'cancion', songId: 'o1' }];
      const { points } = analyzeSetlistEnergy(oneItem, oneSong);
      const ideal = calcularCurvaEnergiaIdeal(points);

      expect(ideal).toEqual([12]);
    });
  });
});

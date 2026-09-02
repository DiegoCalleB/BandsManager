import { describe, it, expect } from 'vitest';
import { getEnergyInfo, analyzeSetlistEnergy } from '../energyPacingUtils';
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

    expect(result.warnings.some(w => w.message.includes('valle de energía'))).toBe(true);
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
    expect(result.warnings.some(w => w.message.includes('remata'))).toBe(true);
  });
});

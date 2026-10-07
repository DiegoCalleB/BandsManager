import { describe, it, expect } from 'vitest';
import { carpetaDeIdea, ficheroDeToma, limitarOffset, offsetInicial, tituloDeToma } from '../grabarIdea';
import type { SongAudioIdea } from '../../types';

describe('grabarIdea', () => {
  it('carpeta de Storage por canción', () => {
    expect(carpetaDeIdea('abc')).toBe('ideas/abc');
  });

  it('offsetInicial usa la latencia reportada y, sin ella, un valor por plataforma', () => {
    expect(offsetInicial(120)).toBe(0.12);
    expect(offsetInicial(0, 'Mozilla iPhone')).toBe(0.2);
    expect(offsetInicial(0, 'Android 14')).toBe(0.16);
    expect(offsetInicial(0, 'Windows')).toBe(0.09);
  });

  it('limitarOffset acota a ±1 s, a pasos de 10 ms, y tolera basura', () => {
    expect(limitarOffset(5)).toBe(1);
    expect(limitarOffset(-5)).toBe(-1);
    expect(limitarOffset(0.1234)).toBe(0.12);
    expect(limitarOffset(NaN)).toBe(0);
  });

  it('tituloDeToma numera solo las ideas del Atril', () => {
    const ideas = [{ origen: 'atril' }, { origen: 'subida' }, {}] as SongAudioIdea[];
    expect(tituloDeToma('Bajo', ideas)).toBe('Idea 2 · Bajo');
    expect(tituloDeToma(undefined, [])).toBe('Idea 1');
  });

  it('ficheroDeToma elige extensión según el mime del navegador', () => {
    expect(ficheroDeToma('audio/mp4')).toEqual({ extension: 'm4a', tipo: 'audio/mp4' });
    expect(ficheroDeToma('audio/webm;codecs=opus').extension).toBe('webm');
  });
});

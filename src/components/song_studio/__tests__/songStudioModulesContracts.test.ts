import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import SongStudioModal, { getIdeaTracks, MOISES_PRESETS_CONFIG } from '../../SongStudioModal';
import { useSongStudio } from '../SongStudioContext';
import { getTrackRainbowColor, hslToHex } from '../trackColors';
import { getSongMainAudioUrl } from '../songAudioSource';
import { getAudioContextClass } from '../audioContext';
import type { AudioTrack, Song, SongAudioIdea } from '../../../types';

const hooks = import.meta.glob('../hooks/*.ts', { eager: true });
const views = import.meta.glob('../SongStudio*.tsx', { eager: true });

const exportedFunctions = (moduleExports: Record<string, unknown>) =>
  Object.values(moduleExports).filter((value) => typeof value === 'function');

describe('SongStudioModal: contratos tras la modularización', () => {
  it('mantiene el export por defecto y los exports históricos del contenedor', () => {
    expect(typeof SongStudioModal).toBe('function');
    expect(typeof getIdeaTracks).toBe('function');
    expect(MOISES_PRESETS_CONFIG['6_stems'].stems.length).toBeGreaterThan(0);
  });

  it('el contenedor queda por debajo de 400 líneas (AGENTS.md §5.6)', async () => {
    const raw = (await import('../../SongStudioModal?raw')) as { default: string };
    expect(raw.default.split('\n').length).toBeLessThan(400);
  });

  it.each(Object.entries(hooks))('%s exporta al menos un hook', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it.each(Object.entries(views))('%s exporta al menos un componente', (_path, moduleExports) => {
    expect(exportedFunctions(moduleExports as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it('useSongStudio falla rápido fuera del proveedor', () => {
    const SinProveedor = () => {
      useSongStudio();
      return null;
    };
    expect(() => renderToString(createElement(SinProveedor))).toThrow(/SongStudioProvider/);
  });
});

describe('getIdeaTracks', () => {
  const idea = { id: 'i1', titulo: 'Riff', audioUrl: 'a.mp3', subidoPor: 'ana', fecha: '1/1', instrumento: 'Guitarra' } as SongAudioIdea;

  it('sintetiza una pista única para ideas con formato antiguo', () => {
    const [pista] = getIdeaTracks(idea);
    expect(pista).toMatchObject({ id: 'i1-track-1', nombre: 'Riff', audioUrl: 'a.mp3', volumen: 1, muted: false });
  });

  it('devuelve las pistas propias cuando existen', () => {
    const pistas = [{ id: 'p1' }] as AudioTrack[];
    expect(getIdeaTracks({ ...idea, pistas })).toBe(pistas);
  });
});

describe('getTrackRainbowColor', () => {
  it('recorre el arcoíris por posición y es estable', () => {
    const pista = {} as AudioTrack;
    expect(getTrackRainbowColor(pista, 0)).toBe(getTrackRainbowColor(pista, 6));
    expect(getTrackRainbowColor(pista, 0)).not.toBe(getTrackRainbowColor(pista, 1));
  });

  it('respeta el tono congelado por el usuario y el canal alfa', () => {
    expect(getTrackRainbowColor({ colorHue: 120 } as AudioTrack, 3, '40')).toBe(`${hslToHex(120, 60, 68)}40`);
  });

  it('hslToHex devuelve un color hexadecimal de 7 caracteres', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
  });
});

describe('getSongMainAudioUrl', () => {
  it('prefiere el audio principal, cae al campo heredado y nunca devuelve undefined', () => {
    expect(getSongMainAudioUrl({ audioPrincipalUrl: 'nuevo.mp3', audioUrl: 'viejo.mp3' } as unknown as Song)).toBe('nuevo.mp3');
    expect(getSongMainAudioUrl({ audioUrl: 'viejo.mp3' } as unknown as Song)).toBe('viejo.mp3');
    expect(getSongMainAudioUrl({} as Song)).toBe('');
  });
});

describe('getAudioContextClass', () => {
  it('devuelve undefined si el navegador no soporta Web Audio (sin lanzar)', () => {
    expect(() => getAudioContextClass()).not.toThrow();
  });
});

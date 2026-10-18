// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Setlist, Song } from '../../types';

vi.mock('../../utils/audioStorage', () => ({
  resolveAudioUrl: vi.fn(async (u: string) => `resuelta:${u}`),
}));

import { useStagePlayer } from '../useStagePlayer';

const cancion = (id: string, extra: Partial<Song> = {}) =>
  ({ id, audioPrincipalUrl: `${id}.mp3`, duracionSegundos: 100, ...extra }) as unknown as Song;
const setlist = {
  id: 'sl',
  items: [
    { id: 'i0', tipoItem: 'cancion', songId: 's1' },
    { id: 'i1', tipoItem: 'bloque', duracionEstimadaSegundos: 45 },
    { id: 'i2', tipoItem: 'cancion', songId: 's2' },
  ],
} as unknown as Setlist;
const songs = [cancion('s1'), cancion('s2', { audioPrincipalUrl: undefined, duracionSegundos: 0, duracion: '3:00' })];
const parse = (t: string) => {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};

describe('useStagePlayer (carga del ítem activo)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sin índice no hay url ni tiempo', () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    expect(result.current.stagePlayingIndex).toBeNull();
    expect(result.current.stageResolvedUrl).toBe('');
    expect(result.current.stageCurrentTime).toBe(0);
  });

  it('una canción con audio resuelve la url y toma su duración', async () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.setStagePlayingIndex(0));
    await waitFor(() => expect(result.current.stageResolvedUrl).toBe('resuelta:s1.mp3'));
    expect(result.current.stageItemDuration).toBe(100);
  });

  it('un bloque sin audio usa su duración estimada y vacía la url anterior', async () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.setStagePlayingIndex(0));
    await waitFor(() => expect(result.current.stageResolvedUrl).toBe('resuelta:s1.mp3'));
    act(() => result.current.setStagePlayingIndex(1));
    expect(result.current.stageItemDuration).toBe(45);
    expect(result.current.stageResolvedUrl).toBe('');
  });

  it('una canción sin audio usa la duración en mm:ss', () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.setStagePlayingIndex(2));
    expect(result.current.stageItemDuration).toBe(180);
    expect(result.current.stageResolvedUrl).toBe('');
  });

  it('cambiar de índice reinicia el tiempo; volver a null también', () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.setStagePlayingIndex(0));
    act(() => result.current.setStageCurrentTime(33));
    expect(result.current.stageCurrentTime).toBe(33);
    act(() => result.current.setStagePlayingIndex(1));
    expect(result.current.stageCurrentTime).toBe(0);
    act(() => result.current.setStageCurrentTime(7));
    act(() => result.current.setStagePlayingIndex(null));
    expect(result.current.stageCurrentTime).toBe(0);
    expect(result.current.stageResolvedUrl).toBe('');
  });

  it('Siguiente avanza y arranca la reproducción', () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.handleStageNext());
    expect(result.current.stagePlayingIndex).toBe(0);
    expect(result.current.stageIsPlaying).toBe(true);
    act(() => result.current.handleStageNext());
    expect(result.current.stagePlayingIndex).toBe(1);
  });

  it('al terminar la última pista se detiene', () => {
    const { result } = renderHook(() => useStagePlayer(setlist, songs, parse));
    act(() => result.current.setStagePlayingIndex(2));
    act(() => result.current.handleStageAudioEnded());
    expect(result.current.stagePlayingIndex).toBeNull();
    expect(result.current.stageIsPlaying).toBe(false);
  });
});

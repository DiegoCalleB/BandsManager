// @vitest-environment happy-dom
/**
 * Comportamiento del "Setlist Debut" que crea el asistente de configuración inicial.
 * Regresión: los items se creaban con `type: "song"` en vez de `tipoItem: "cancion"`, así que
 * el repertorio (que filtra por `tipoItem`) no los reconocía como temas.
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../../../../types';

const createSetlist = vi.hoisted(() => vi.fn((_datos: unknown) => Promise.resolve({ success: true })));
const createSong = vi.hoisted(() => vi.fn(() => Promise.resolve({ success: true })));
vi.mock('../../../../../services/api', () => ({ api: { createSetlist, createSong } }));

import { useMusicSetlistStep } from '../useMusicSetlistStep';

const usuario = { id: 'u1', name: 'Ana', username: 'ana', band_id: 'band-propia', bandName: 'Banda de Ana' } as User;

describe('useMusicSetlistStep · handleGenerateSetlist', () => {
  it('crea un setlist de la banda activa cuyos items son canciones con su duración', async () => {
    const { result } = renderHook(() =>
      useMusicSetlistStep({
        bandName: 'Banda de Ana', currentUser: usuario, logoUrl: '', localBandName: 'Banda de Ana',
        genre: 'rock', onSongsImported: vi.fn(), activeBandId: 'band-propia',
      }),
    );
    act(() => {
      result.current.setManualSongs([
        { id: 's1', titulo: 'Uno', tonalidad: 'Mi', bpm: 100, duracion: '4:05', album: '' },
        { id: 's2', titulo: 'Dos', tonalidad: 'La', bpm: 90, duracion: '', album: '' },
      ]);
    });
    await act(async () => { await result.current.handleGenerateSetlist(45); });

    expect(createSetlist).toHaveBeenCalledTimes(1);
    const datos = createSetlist.mock.calls[0][0] as { band_id: string; duracionTotalEstimadaMinutos: number; items: Array<Record<string, unknown>> };
    expect(datos.band_id).toBe('band-propia');
    expect(datos.duracionTotalEstimadaMinutos).toBe(45);
    expect(datos.items.map((i) => [i.tipoItem, i.songId, i.duracionEstimadaSegundos])).toEqual([
      ['cancion', 's1', 245],
      ['cancion', 's2', 210],
    ]);
    expect(datos.items.every((i) => !('type' in i))).toBe(true);
    expect(result.current.createdSetlistName).toBe('Setlist Debut (45 min)');
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheActiveStageSetlist, getStageOfflineCache, clearStageOfflineCache } from '../stageOfflineCache';
import { Setlist, Song } from '../../types';

describe('stageOfflineCache: Cacheado persistente para directos sin internet', () => {
  let storage: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, val: string) => {
      storage[key] = val;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
  };

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockSetlist: Setlist = {
    id: 'setlist-directo-1',
    nombre: 'Setlist Gira 2026',
    tipoFormato: 'festival',
    items: [
      { id: 'i1', tipoItem: 'cancion', songId: 's1' },
      { id: 'i2', tipoItem: 'bloque', bloqueSubtipo: 'chapa', tituloCustom: 'Saludo' },
      { id: 'i3', tipoItem: 'cancion', songId: 's2' },
    ],
  };

  const mockSongs: Song[] = [
    {
      id: 's1',
      titulo: 'Canción Clave',
      cifradoTexto: '[Intro]\n[Do] [Sol]',
      bpm: 128,
      tonalidad: 'Do',
    },
    {
      id: 's2',
      titulo: 'Canción Cierre',
      cifradoTexto: '[Verso]\n[Lam] [Fa]',
      bpm: 140,
      tonalidad: 'Lam',
    },
    {
      id: 's3_no_en_setlist',
      titulo: 'Tema descartado',
      bpm: 90,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda en caché solo las canciones usadas en el setlist con sus letras y cifrados', () => {
    const success = cacheActiveStageSetlist(mockSetlist, mockSongs, 'band-test');
    expect(success).toBe(true);

    const cached = getStageOfflineCache('band-test');
    expect(cached).not.toBeNull();
    expect(cached?.setlist.nombre).toBe('Setlist Gira 2026');
    expect(cached?.totalSongsCount).toBe(2);
    expect(cached?.songs.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(cached?.songs[0].cifradoTexto).toContain('[Do] [Sol]');
  });

  it('devuelve null de forma segura si no existe caché o está corrupto', () => {
    expect(getStageOfflineCache('banda_inexistente')).toBeNull();

    localStorage.setItem('bandmanager_stage_offline_corrupto', 'invalid_json{');
    expect(getStageOfflineCache('corrupto')).toBeNull();
  });

  it('limpia el caché correctamente cuando se solicita', () => {
    cacheActiveStageSetlist(mockSetlist, mockSongs, 'band-test');
    expect(getStageOfflineCache('band-test')).not.toBeNull();

    clearStageOfflineCache('band-test');
    expect(getStageOfflineCache('band-test')).toBeNull();
  });
});

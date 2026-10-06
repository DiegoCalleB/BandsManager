// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { Setlist, Song } from '../types';

export interface StageOfflineCachePayload {
  setlist: Setlist;
  songs: Song[];
  cachedAt: string;
  totalSongsCount: number;
}

const STAGE_CACHE_PREFIX = 'bandmanager_stage_offline_';

/**
 * Guarda en almacenamiento local persistente el setlist activo y las canciones completas
 * (letras, acordes cifradoTexto, tonalidades, duraciones y BPM) para garantizar que el
 * músico pueda tocar en recintos subterráneos, sótanos o festivales sin cobertura ni wifi.
 */
export function cacheActiveStageSetlist(
  setlist: Setlist | null,
  songs: Song[],
  bandId?: string
): boolean {
  if (typeof localStorage === 'undefined' || !setlist || !setlist.items || setlist.items.length === 0) {
    return false;
  }

  try {
    const key = `${STAGE_CACHE_PREFIX}${bandId || 'default'}`;
    
    // Filtramos solo las canciones que pertenecen al setlist para no saturar la cuota
    const relevantSongIds = new Set(
      setlist.items
        .filter(it => it.tipoItem === 'cancion' && it.songId)
        .map(it => it.songId as string)
    );

    const relevantSongs = songs.filter(s => relevantSongIds.has(s.id));

    const payload: StageOfflineCachePayload = {
      setlist,
      songs: relevantSongs,
      cachedAt: new Date().toISOString(),
      totalSongsCount: relevantSongs.length
    };

    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[StageOfflineCache] No se pudo guardar el setlist en caché offline:', err);
    return false;
  }
}

/**
 * Recupera el último setlist y catálogo cacheados para el modo escenario sin conexión.
 */
export function getStageOfflineCache(bandId?: string): StageOfflineCachePayload | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const key = `${STAGE_CACHE_PREFIX}${bandId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StageOfflineCachePayload;
    if (!parsed || !parsed.setlist || !Array.isArray(parsed.setlist.items)) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[StageOfflineCache] Error al leer el caché offline de escenario:', err);
    return null;
  }
}

/**
 * Limpia el caché offline de escenario si el usuario lo desea.
 */
export function clearStageOfflineCache(bandId?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const key = `${STAGE_CACHE_PREFIX}${bandId || 'default'}`;
    localStorage.removeItem(key);
  } catch {
    // Ignorado
  }
}

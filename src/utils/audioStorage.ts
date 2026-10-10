/**
 * Audio Storage & Utility Helpers for BandManager
 * Handles IndexedDB persistence for large audio files (MP3/WAV/M4A),
 * Google Drive URL parsing into playable audio streams,
 * and audio file helpers.
 */

import { getAuthHeaders } from '../services/api';

const DB_NAME = 'BandManagerAudioDB';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

let cachedDb: IDBDatabase | null = null;

// Reset cachedDb when the page becomes hidden or is unloaded, to avoid holding closing connections
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && cachedDb) {
      try {
        cachedDb.close();
      } catch {
        // ignore
      }
      cachedDb = null;
    }
  });

  window.addEventListener('pagehide', () => {
    if (cachedDb) {
      try {
        cachedDb.close();
      } catch {
        // ignore
      }
      cachedDb = null;
    }
  });
}

function openAudioDB(): Promise<IDBDatabase> {
  if (cachedDb) {
    try {
      // Check if connection is still usable
      const tx = cachedDb.transaction(STORE_NAME, 'readonly');
      tx.abort();
      return Promise.resolve(cachedDb);
    } catch {
      try {
        cachedDb.close();
      } catch {
        // ignore
      }
      cachedDb = null;
    }
  }

  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        cachedDb = db;

        db.onclose = () => {
          cachedDb = null;
        };

        db.onversionchange = () => {
          try {
            db.close();
          } catch {
            // ignore
          }
          cachedDb = null;
        };

        db.onerror = () => {
          cachedDb = null;
        };

        resolve(db);
      };

      request.onerror = () => {
        cachedDb = null;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };

      request.onblocked = () => {
        cachedDb = null;
      };
    } catch (err) {
      cachedDb = null;
      reject(err);
    }
  });
}

/**
 * Execute an IDB operation with automatic retry if the database was closing or tab hidden
 */
async function executeIDBOperation<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  let attempts = 0;
  let lastError: any = null;

  while (attempts < 3) {
    attempts++;
    try {
      const db = await openAudioDB();
      return await new Promise<T>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, mode);
          const store = tx.objectStore(STORE_NAME);
          let finished = false;

          tx.onerror = () => {
            if (!finished) {
              finished = true;
              reject(tx.error || new Error('Transaction error'));
            }
          };

          tx.onabort = () => {
            if (!finished) {
              finished = true;
              reject(tx.error || new Error('Transaction aborted (Database closing or hidden)'));
            }
          };

          op(store).then(
            (result) => {
              if (mode === 'readonly') {
                if (!finished) {
                  finished = true;
                  resolve(result);
                }
              } else {
                tx.oncomplete = () => {
                  if (!finished) {
                    finished = true;
                    resolve(result);
                  }
                };
              }
            },
            (err) => {
              if (!finished) {
                finished = true;
                reject(err);
              }
            }
          );
        } catch (txErr) {
          reject(txErr);
        }
      });
    } catch (err: any) {
      lastError = err;
      if (cachedDb) {
        try {
          cachedDb.close();
        } catch {
          // ignore
        }
        cachedDb = null;
      }

      const isClosingOrHidden =
        err &&
        (err.name === 'InvalidStateError' ||
          err.name === 'AbortError' ||
          String(err.message || '')
            .toLowerCase()
            .includes('closing') ||
          String(err.message || '')
            .toLowerCase()
            .includes('closed') ||
          String(err.message || '')
            .toLowerCase()
            .includes('hidden') ||
          String(err.message || '')
            .toLowerCase()
            .includes('database'));

      if (isClosingOrHidden && attempts < 3) {
        // Wait exponentially and retry with fresh connection
        await new Promise((r) => setTimeout(r, 80 * attempts));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('IndexedDB operation failed after retries');
}

/**
 * Save audio blob or base64 string in IndexedDB
 */
export async function saveAudioToStorage(id: string, audioData: string | Blob): Promise<string> {
  try {
    return await executeIDBOperation('readwrite', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.put(audioData, id);
        req.onsuccess = () => resolve(id);
        req.onerror = () => reject(req.error || new Error('Failed to put item in IndexedDB'));
      });
    });
  } catch (err) {
    console.warn('Error saving audio to IndexedDB, fallback required:', err);
    throw err;
  }
}

/**
 * Retrieve audio from IndexedDB as Data URL or Object URL
 */
export async function getAudioFromStorage(id: string): Promise<string | null> {
  try {
    return await executeIDBOperation('readonly', (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => {
          const val = req.result;
          if (!val) {
            resolve(null);
            return;
          }
          if (typeof val === 'string') {
            resolve(val);
          } else if (val instanceof Blob) {
            const objectUrl = URL.createObjectURL(val);
            resolve(objectUrl);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error || new Error('Failed to get item from IndexedDB'));
      });
    });
  } catch (err) {
    console.warn('Error getting audio from IndexedDB:', err);
    return null;
  }
}

/**
 * Convert Google Drive share link to direct stream URL
 */
export function parseGoogleDriveAudioUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If it's already a direct download link or raw data/blob URL, return as is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.includes('uc?export=download')) {
    return trimmed;
  }

  // Extract ID from /file/d/ID/view or ?id=ID
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return trimmed;
}

/**
 * Check if URL is Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com');
}

/**
 * Helper to convert File to Base64 String
 */

/**
 * Uploads a file to the backend server and returns the static URL.
 * Falls back safely to IndexedDB / DataURL if server upload fails or endpoint is unreachable.
 */
export async function uploadFileToServer(
  file: File,
  options?: { bandId?: string; category?: string; folder?: string } | string
): Promise<string> {
  const opts = typeof options === 'string' ? { bandId: options } : options || {};

  try {
    const authHeaders = getAuthHeaders() as Record<string, string>;
    const formData = new FormData();
    formData.append('file', file);
    if (opts.bandId) formData.append('bandId', opts.bandId);
    if (opts.category) formData.append('category', opts.category);
    if (opts.folder) formData.append('folder', opts.folder);

    const headers: Record<string, string> = { ...authHeaders };
    delete headers['Content-Type'];
    delete headers['content-type'];
    if (opts.bandId) headers['x-band-id'] = opts.bandId;

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.url) return data.url;
    } else {
      console.warn(`/api/upload returned status ${response.status}, trying fallback`);
    }
  } catch (formDataErr) {
    console.warn('FormData upload failed, trying base64 fallback:', formDataErr);
  }

  try {
    const base64 = await fileToBase64(file);
    const authHeaders = getAuthHeaders() as Record<string, string>;
    const headers: Record<string, string> = {
      ...authHeaders,
      'Content-Type': 'application/json',
    };
    if (opts.bandId) headers['x-band-id'] = opts.bandId;

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filename: file.name,
        base64,
        bandId: opts.bandId,
        category: opts.category,
        folder: opts.folder,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.url) return data.url;
    }
  } catch (err) {
    console.warn('Server upload failed, falling back to local storage:', err);
  }

  // Fallback: ONLY use IndexedDB for audio tracks (not for images/documents like logo/dossier/rider)
  const isDocOrImage =
    opts.category === 'logo' ||
    opts.category === 'dossier' ||
    opts.category === 'rider' ||
    opts.category === 'epk' ||
    file.type.startsWith('image/') ||
    file.type.includes('pdf');

  if (!isDocOrImage) {
    try {
      const fileKey = `track_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await saveAudioToStorage(fileKey, file);
      return `indexeddb:${fileKey}`;
    } catch (idbErr) {
      console.warn('IndexedDB fallback failed, returning base64 DataURL:', idbErr);
    }
  }

  return await fileToBase64(file);
}

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Safely fetches an audio URL as a Blob, handling IndexedDB keys, base64 data URLs,
 * Blob URLs, and external HTTP/HTTPS streams safely without scheme errors.
 */
export async function getAudioBlobFromUrl(url: string): Promise<Blob> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    throw new Error('Invalid or empty audio URL provided');
  }
  const resolved = await resolveAudioUrl(url.trim());
  if (!resolved || !resolved.trim()) {
    throw new Error('Could not resolve audio URL');
  }

  const trimmedResolved = resolved.trim();

  // Handle base64 data URLs directly without fetch()
  if (trimmedResolved.startsWith('data:')) {
    const parts = trimmedResolved.split(',');
    if (parts.length < 2) {
      throw new Error('Invalid data URL format');
    }
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'audio/mpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // Handle blob or http/https URLs via fetch
  const res = await fetch(trimmedResolved);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status} fetching audio`);
  }
  return await res.blob();
}

/**
 * Safely fetches an audio URL as an ArrayBuffer, handling IndexedDB keys, base64 data URLs,
 * Blob URLs, and external HTTP/HTTPS streams safely without scheme errors.
 */
export async function getAudioArrayBufferFromUrl(url: string): Promise<ArrayBuffer> {
  const blob = await getAudioBlobFromUrl(url);
  return await blob.arrayBuffer();
}

/**
 * Resolve an audio URL string, supporting IndexedDB stored audio keys (indexeddb:key)
 * and Google Drive stream URLs.
 */
export async function resolveAudioUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('indexeddb:')) {
    const idbKey = trimmed.replace('indexeddb:', '');
    const idbAudio = await getAudioFromStorage(idbKey);
    return idbAudio || '';
  }

  return parseGoogleDriveAudioUrl(trimmed);
}

/**
 * Safely saves the songs catalog to localStorage by persisting large data URLs
 * to IndexedDB first and keeping lightweight references in localStorage,
 * preventing'Setting the value exceeded the quota' errors.
 */
/** Pasa a IndexedDB las pistas con audio inline (data:/blob:) y deja la referencia `indexeddb:`. */
async function sanearPistas(pistas: any[] | undefined): Promise<any[]> {
  return Promise.all(
    (pistas || []).map(async (pista: any) => {
      let trackUrl = pista.audioUrl || '';
      if (trackUrl.startsWith('data:audio') || trackUrl.startsWith('blob:')) {
        const key = `audio_track_${pista.id || Date.now()}`;
        try {
          const blob = await getAudioBlobFromUrl(trackUrl);
          await saveAudioToStorage(key, blob);
          trackUrl = `indexeddb:${key}`;
        } catch (err) {
          console.warn('Failed saving track audio to IndexedDB:', err);
        }
      }
      return { ...pista, audioUrl: trackUrl };
    })
  );
}

export async function saveSongsToLocalStorageSafely(songs: any[], bandId?: string): Promise<void> {
  if (!songs || !Array.isArray(songs)) return;

  try {
    const sanitizedSongs = await Promise.all(
      songs.map(async (song) => {
        let principalUrl = song.audioPrincipalUrl || '';

        // If principal audio is a large base64 data URL, store in IndexedDB
        if (principalUrl.startsWith('data:audio') && principalUrl.length > 10000) {
          const key = `audio_song_${song.id}`;
          try {
            await saveAudioToStorage(key, principalUrl);
            principalUrl = `indexeddb:${key}`;
          } catch (err) {
            console.warn('Failed saving song audio to IndexedDB:', err);
          }
        }

        let coverUrl = song.portadaUrl || '';
        // If cover image is a large base64 data URL, store in IndexedDB
        if (coverUrl.startsWith('data:image') && coverUrl.length > 10000) {
          const key = `image_cover_${song.id}`;
          try {
            await saveAudioToStorage(key, coverUrl);
            coverUrl = `indexeddb:${key}`;
          } catch (err) {
            console.warn('Failed saving cover image to IndexedDB:', err);
          }
        }

        // Process audio ideas and multitrack pistas
        const sanitizedIdeas = await Promise.all(
          (song.audioIdeas || []).map(async (idea: any) => {
            let ideaUrl = idea.audioUrl || '';
            if (ideaUrl.startsWith('data:audio') || ideaUrl.startsWith('blob:')) {
              const key = `audio_idea_${idea.id || Date.now()}`;
              try {
                const blob = await getAudioBlobFromUrl(ideaUrl);
                await saveAudioToStorage(key, blob);
                ideaUrl = `indexeddb:${key}`;
              } catch (err) {
                console.warn('Failed saving idea audio to IndexedDB:', err);
              }
            }

            const sanitizedPistas = await sanearPistas(idea.pistas);

            return {
              ...idea,
              audioUrl: ideaUrl,
              pistas: sanitizedPistas.length > 0 ? sanitizedPistas : idea.pistas,
            };
          })
        );

        // Los stems de la canción llevan las mismas URLs que los de las ideas: mismas claves.
        const pistasCancion = Array.isArray(song.pistas) && song.pistas.length > 0 ? await sanearPistas(song.pistas) : song.pistas;

        return {
          ...song,
          audioPrincipalUrl: principalUrl,
          portadaUrl: coverUrl,
          audioIdeas: sanitizedIdeas,
          ...(pistasCancion ? { pistas: pistasCancion } : {}),
        };
      })
    );

    const clean = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase();
    const finalSongs = sanitizedSongs;
    const key = `band_songs_${clean || 'default'}`;
    localStorage.setItem(key, JSON.stringify(finalSongs));
    // NOTE: Removed bandmanager_songs_catalog setItem() to ensure multi-tenant data isolation.
    // Band data is persisted to Supabase API (band_id validated server-side), not localStorage.
    // React state is the source of truth; band-scoped localStorage is an anti-pattern.
  } catch (e) {
    console.warn('Could not save songs catalog to localStorage:', e);
  }
}

/**
 * Safely saves the setlists array to localStorage by moving large speech audio data URLs
 * to IndexedDB.
 */
export async function saveSetlistsToLocalStorageSafely(setlists: any[], bandId?: string): Promise<void> {
  if (!setlists || !Array.isArray(setlists)) return;

  try {
    const sanitizedSetlists = await Promise.all(
      setlists.map(async (setlist) => {
        const sanitizedItems = await Promise.all(
          (setlist.items || []).map(async (item: any) => {
            let itemAudioUrl = item.audioUrl || '';
            if (itemAudioUrl.startsWith('data:audio') && itemAudioUrl.length > 10000) {
              const key = `audio_setlist_item_${item.id}`;
              try {
                await saveAudioToStorage(key, itemAudioUrl);
                itemAudioUrl = `indexeddb:${key}`;
              } catch (err) {
                console.warn('Failed saving setlist item audio to IndexedDB:', err);
              }
            }
            return {
              ...item,
              audioUrl: itemAudioUrl,
            };
          })
        );

        return {
          ...setlist,
          items: sanitizedItems,
        };
      })
    );

    const clean = (bandId || '').replace(/^(band|reg)-/, '').toLowerCase();
    const finalSetlists = sanitizedSetlists;
    const key = `band_setlists_${clean || 'default'}`;
    localStorage.setItem(key, JSON.stringify(finalSetlists));
    // NOTE: Removed bandmanager_setlists setItem() for multi-tenant safety.
    // Setlist data is persisted to Supabase API (band_id validated), not localStorage.
  } catch (e) {
    console.warn('Could not save setlists to localStorage:', e);
  }
}

// Song & Setlist calculation utilities

export interface SongLike {
  id: string;
  titulo: string;
  duracion?: string; // "3:30"
  duracionSegundos?: number; // 210
  bpm?: number;
  tonalidad?: string;
}

export interface SetlistItemLike {
  id: string;
  tipoItem?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number;
  songId?: string;
}

/**
 * Parses "MM:SS" string into total seconds (e.g., "3:30" -> 210)
 */
export function parseMmSsToSeconds(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 1) {
    const parsed = parseInt(parts[0], 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const min = parseInt(parts[0], 10) || 0;
  const sec = parseInt(parts[1], 10) || 0;
  return min * 60 + sec;
}

/**
 * Formats total seconds into "M:SS" or "MM:SS" (e.g., 210 -> "3:30")
 */
export function formatSecondsToMmSs(totalSeconds: number): string {
  if (totalSeconds <= 0 || isNaN(totalSeconds)) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates setlist total duration (in seconds) and average BPM
 */
export function calculateSetlistStats(
  items: SetlistItemLike[],
  songMap: Map<string, SongLike> | Record<string, SongLike>
): { totalDurationSeconds: number; averageBpm: number; songCount: number } {
  let totalDurationSeconds = 0;
  let bpmSum = 0;
  let bpmCount = 0;
  let songCount = 0;

  const getSong = (id: string) => {
    if (songMap instanceof Map) return songMap.get(id);
    return songMap[id];
  };

  items.forEach(item => {
    if (item.songId) {
      const song = getSong(item.songId);
      if (song) {
        songCount++;
        const songSecs = song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210;
        totalDurationSeconds += songSecs;
        if (song.bpm && song.bpm > 0) {
          bpmSum += song.bpm;
          bpmCount++;
        }
      }
    } else {
      // Non-song item (intro, presentation, break)
      const itemSecs = item.duracionEstimadaSegundos ?? ((item.duracionEstimadaMinutos || 0) * 60);
      totalDurationSeconds += itemSecs;
    }
  });

  return {
    totalDurationSeconds,
    averageBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0,
    songCount
  };
}

/**
 * Sorts songs by given criteria: tempo (BPM), tonality, title, or duration
 */
export type SongSortField = 'bpm' | 'tonalidad' | 'titulo' | 'duracion';
export type SortOrder = 'asc' | 'desc';

export function sortSongs<T extends SongLike>(
  songs: T[],
  sortBy: SongSortField,
  order: SortOrder = 'asc'
): T[] {
  const sorted = [...songs].sort((a, b) => {
    if (sortBy === 'bpm') {
      const bpmA = a.bpm || 0;
      const bpmB = b.bpm || 0;
      return bpmA - bpmB;
    }
    if (sortBy === 'duracion') {
      const secA = a.duracionSegundos || parseMmSsToSeconds(a.duracion);
      const secB = b.duracionSegundos || parseMmSsToSeconds(b.duracion);
      return secA - secB;
    }
    if (sortBy === 'tonalidad') {
      const keyA = (a.tonalidad || '').toLowerCase();
      const keyB = (b.tonalidad || '').toLowerCase();
      return keyA.localeCompare(keyB);
    }
    if (sortBy === 'titulo') {
      return a.titulo.localeCompare(b.titulo);
    }
    return 0;
  });

  return order === 'desc' ? sorted.reverse() : sorted;
}

export interface BandMemberOption {
  id: string;
  name: string;
  instrument: string;
  avatarColor?: string;
}

export const DEFAULT_BAND_MEMBERS: BandMemberOption[] = [
  { id: 'usr-diego', name: 'Diego', instrument: 'Trompeta / Voz', avatarColor: '#10b981' },
  { id: 'usr-filgue', name: 'Filgue', instrument: 'Batería / Beatbox', avatarColor: '#3b82f6' },
  { id: 'usr-jon', name: 'Jon', instrument: 'Guitarra / Sintes', avatarColor: '#f59e0b' },
  { id: 'usr-jose', name: 'Jose', instrument: 'Bajo / Coros', avatarColor: '#8b5cf6' },
  { id: 'usr-raul', name: 'Raúl', instrument: 'Violín / Vientos', avatarColor: '#ec4899' }
];

/**
 * Returns clean band member list from users or fallback defaults, plus any custom members found in song notes
 */
export function resolveBandMembers(users?: any[], extraNotes?: Record<string, string>): BandMemberOption[] {
  const memberMap = new Map<string, BandMemberOption>();

  // 1. If users array provided with valid members
  if (Array.isArray(users) && users.length > 0) {
    users.forEach(u => {
      const name = u.name || u.nombre || u.username || 'Músico';
      const id = u.id || `usr-${name.toLowerCase().replace(/\s+/g, '-')}`;
      const instrument = u.instrument || u.instrumento || u.role || 'Instrumento';
      memberMap.set(name.toLowerCase(), {
        id,
        name,
        instrument,
        avatarColor: u.avatarColor || '#6366f1'
      });
    });
  }

  // 2. If no members or fewer than 2, enrich with default Bakandeya members
  if (memberMap.size === 0) {
    DEFAULT_BAND_MEMBERS.forEach(m => {
      memberMap.set(m.name.toLowerCase(), m);
    });
  }

  // 3. If there are custom keys in extraNotes that aren't yet in memberMap, add them
  if (extraNotes) {
    Object.keys(extraNotes).forEach(key => {
      const cleanKey = key.trim();
      if (!cleanKey) return;
      const lower = cleanKey.toLowerCase();
      if (!memberMap.has(lower)) {
        // Could be an ID or name
        memberMap.set(lower, {
          id: `custom-${cleanKey}`,
          name: cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1),
          instrument: 'Músico / Invitado',
          avatarColor: '#14b8a6'
        });
      }
    });
  }

  return Array.from(memberMap.values());
}

/**
 * Retrieves the specific note for a member on a given song
 */
export function getSongMemberNote(song?: any, memberKey?: string, memberName?: string): string {
  if (!song) return '';
  const notesMap = song.notasMiembros || song.notas_miembros || {};

  if (memberKey && notesMap[memberKey]) return notesMap[memberKey];
  if (memberName && notesMap[memberName]) return notesMap[memberName];
  if (memberName && notesMap[memberName.toLowerCase()]) return notesMap[memberName.toLowerCase()];

  // Check in notasPorMiembro array if exists
  if (Array.isArray(song.notasPorMiembro)) {
    const found = song.notasPorMiembro.find((n: any) => 
      (memberKey && n.userId === memberKey) || 
      (memberName && n.memberName && n.memberName.toLowerCase() === memberName.toLowerCase())
    );
    if (found && found.nota) return found.nota;
  }

  return '';
}


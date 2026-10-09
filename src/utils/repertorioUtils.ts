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
  bloqueSubtipo?: string;
  duracionEstimadaMinutos?: number;
  duracionEstimadaSegundos?: number;
  songId?: string;
}

/**
 * Parses "MM:SS" string into total seconds (e.g., "3:30" -> 210)
 */
export function parseMmSsToSeconds(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
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
  if (totalSeconds <= 0 || isNaN(totalSeconds)) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculates setlist total duration (in seconds) and average BPM
 */
export function calculateSetlistStats(
  items: SetlistItemLike[],
  songMap: Map<string, SongLike> | Record<string, SongLike>,
): {
  totalDurationSeconds: number;
  averageBpm: number;
  songCount: number;
  eventCount: number;
  blockCount: number;
} {
  let totalDurationSeconds = 0;
  let bpmSum = 0;
  let bpmCount = 0;
  let songCount = 0;
  let eventCount = 0;
  let blockCount = 0;

  const getSong = (id: string) => {
    if (songMap instanceof Map) return songMap.get(id);
    return songMap[id];
  };

  items.forEach((item) => {
    if (item.songId) {
      const song = getSong(item.songId);
      if (song) {
        songCount++;
        const songSecs =
          song.duracionSegundos || parseMmSsToSeconds(song.duracion) || 210;
        totalDurationSeconds += songSecs;
        if (song.bpm && song.bpm > 0) {
          bpmSum += song.bpm;
          bpmCount++;
        }
      }
    } else if (item.tipoItem === "bloque" && item.bloqueSubtipo === "header") {
      // Section headers organise the show but take no stage time of their own
      blockCount++;
    } else {
      // Non-song item (intro, presentation, break)
      eventCount++;
      const itemSecs =
        item.duracionEstimadaSegundos ??
        (item.duracionEstimadaMinutos || 0) * 60;
      totalDurationSeconds += itemSecs;
    }
  });

  return {
    totalDurationSeconds,
    averageBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 0,
    songCount,
    eventCount,
    blockCount,
  };
}

/**
 * Sorts songs by given criteria: tempo (BPM), tonality, title, or duration
 */
export type SongSortField = "bpm" | "tonalidad" | "titulo" | "duracion";
export type SortOrder = "asc" | "desc";

export function sortSongs<T extends SongLike>(
  songs: T[],
  sortBy: SongSortField,
  order: SortOrder = "asc",
): T[] {
  const sorted = [...songs].sort((a, b) => {
    if (sortBy === "bpm") {
      const bpmA = a.bpm || 0;
      const bpmB = b.bpm || 0;
      return bpmA - bpmB;
    }
    if (sortBy === "duracion") {
      const secA = a.duracionSegundos || parseMmSsToSeconds(a.duracion);
      const secB = b.duracionSegundos || parseMmSsToSeconds(b.duracion);
      return secA - secB;
    }
    if (sortBy === "tonalidad") {
      const keyA = (a.tonalidad || "").toLowerCase();
      const keyB = (b.tonalidad || "").toLowerCase();
      return keyA.localeCompare(keyB);
    }
    if (sortBy === "titulo") {
      return a.titulo.localeCompare(b.titulo);
    }
    return 0;
  });

  return order === "desc" ? sorted.reverse() : sorted;
}

export interface BandMemberOption {
  id: string;
  name: string;
  instrument: string;
  avatarColor?: string;
}

// Fallback genérico usado por resolveBandMembers cuando una banda todavía no tiene
// miembros/usuarios cargados: nombres de puesto, no de una persona real, para no filtrar la
// formación de Bakandeya (banda de demo de la propia app) al resto de bandas (ver el mismo
// bug ya corregido para "accesos rápidos" en RepertorioSetlists.tsx).
export const DEFAULT_BAND_MEMBERS: BandMemberOption[] = [
  {
    id: "miembro-1",
    name: "Voz",
    instrument: "Voz Principal",
    avatarColor: "var(--ok)",
  },
  {
    id: "miembro-2",
    name: "Guitarra",
    instrument: "Guitarra",
    avatarColor: "#3b82f6",
  },
  {
    id: "miembro-3",
    name: "Bajo",
    instrument: "Bajo",
    avatarColor: "var(--acc)",
  },
  {
    id: "miembro-4",
    name: "Batería",
    instrument: "Batería",
    avatarColor: "var(--acc)",
  },
  {
    id: "miembro-5",
    name: "Teclados",
    instrument: "Teclados / Sintes",
    avatarColor: "#ec4899",
  },
];

/**
 * Returns clean band member list from users or fallback defaults, plus any custom members found in song notes
 */
export function resolveBandMembers(
  users?: any[],
  extraNotes?: Record<string, string>,
): BandMemberOption[] {
  const memberMap = new Map<string, BandMemberOption>();

  // 1. If users array provided with valid members
  if (Array.isArray(users) && users.length > 0) {
    users.forEach((u) => {
      const name = u.name || u.nombre || u.username || "Músico";
      const id = u.id || `usr-${name.toLowerCase().replace(/\s+/g, "-")}`;
      const instrument =
        u.instrument || u.instrumento || u.role || "Instrumento";
      memberMap.set(name.toLowerCase(), {
        id,
        name,
        instrument,
        avatarColor: u.avatarColor || "#6366f1",
      });
    });
  }

  // 2. If there are custom keys in extraNotes that aren't yet in memberMap, add them
  if (extraNotes) {
    Object.keys(extraNotes).forEach((key) => {
      const cleanKey = key.trim();
      if (!cleanKey) return;
      const lower = cleanKey.toLowerCase();
      if (!memberMap.has(lower)) {
        // Could be an ID or name
        memberMap.set(lower, {
          id: `custom-${cleanKey}`,
          name: cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1),
          instrument: "Músico / Invitado",
          avatarColor: "#14b8a6",
        });
      }
    });
  }

  return Array.from(memberMap.values());
}

/**
 * Retrieves the specific note for a member on a given song
 */
export function getSongMemberNote(
  song?: any,
  memberKey?: string,
  memberName?: string,
): string {
  if (!song) return "";
  const notesMap = song.notasMiembros || song.notas_miembros || {};

  if (memberKey && notesMap[memberKey]) return notesMap[memberKey];
  if (memberName && notesMap[memberName]) return notesMap[memberName];
  if (memberName && notesMap[memberName.toLowerCase()])
    return notesMap[memberName.toLowerCase()];

  // Check in notasPorMiembro array if exists
  if (Array.isArray(song.notasPorMiembro)) {
    const cleanMemberName = (memberName || "").toLowerCase().trim();
    const found = song.notasPorMiembro.find((n: any) => {
      if (memberKey && (n.userId === memberKey || n.id === memberKey))
        return true;
      if (!n.memberName) return false;
      const target = String(n.memberName).toLowerCase().trim();
      return (
        target === cleanMemberName ||
        (cleanMemberName.length > 2 &&
          target.length > 2 &&
          (cleanMemberName.includes(target) ||
            target.includes(cleanMemberName)))
      );
    });
    if (found && found.nota) return found.nota;
  }

  return "";
}

export type ReadinessLevel = "aprendiendo" | "casi_lista" | "lista";

export const READINESS_LEVELS: {
  value: ReadinessLevel;
  label: string;
  icon: string;
  colorClass: string;
}[] = [
  {
    value: "aprendiendo",
    label: "Aprendiendo",
    icon: "🌱",
    colorClass: "text-[var(--acc)]/80 bg-[var(--acc)]/10",
  },
  {
    value: "casi_lista",
    label: "Casi lista",
    icon: "🔶",
    colorClass: "text-[var(--acc)]/80 bg-[var(--acc)]/10",
  },
  {
    value: "lista",
    label: "Lista para directo",
    icon: "✅",
    colorClass: "text-[var(--ok)] bg-[var(--ok)]/10",
  },
];

/** Nivel de preparación de UN miembro concreto con una canción (null = todavía no ha opinado). */
export function getMemberReadiness(
  song?: any,
  memberKey?: string,
  memberName?: string,
): ReadinessLevel | null {
  if (!song || !Array.isArray(song.notasPorMiembro)) return null;
  const found = song.notasPorMiembro.find(
    (n: any) =>
      (memberKey && n.userId === memberKey) ||
      (memberName &&
        n.memberName &&
        n.memberName.toLowerCase() === memberName.toLowerCase()),
  );
  return found?.estadoPreparacion || null;
}

function findMemberNote(song: any, memberKey?: string, memberName?: string): any | undefined {
  if (!song || !Array.isArray(song.notasPorMiembro)) return undefined;
  return song.notasPorMiembro.find(
    (n: any) =>
      (memberKey && n.userId === memberKey) ||
      (memberName && n.memberName && n.memberName.toLowerCase() === memberName.toLowerCase()),
  );
}

/** ¿Este miembro quiere ver la tonalidad de esta canción en su hoja? */
export function isSongTonoMarkedForMember(song?: any, memberKey?: string, memberName?: string): boolean {
  return findMemberNote(song, memberKey, memberName)?.mostrarTono === true;
}

/** ¿Este miembro quiere ver el BPM? Las marcas antiguas (solo `mostrarTono`) cubrían tono y BPM,
 * así que sin `mostrarBpm` explícito se hereda de `mostrarTono`. */
export function isSongBpmMarkedForMember(song?: any, memberKey?: string, memberName?: string): boolean {
  const n = findMemberNote(song, memberKey, memberName);
  return (n?.mostrarBpm ?? n?.mostrarTono) === true;
}

/** ¿Este miembro marcó esta canción para ver tono y/o BPM en su hoja impresa? */
export function isSongMarkedForMember(song?: any, memberKey?: string, memberName?: string): boolean {
  return (
    isSongTonoMarkedForMember(song, memberKey, memberName) ||
    isSongBpmMarkedForMember(song, memberKey, memberName)
  );
}

/** Devuelve la canción con las marcas "ver tono" y "ver BPM" de ese miembro puestas o quitadas,
 * sin tocar nota ni nivel de preparación. No muta; si no hay cambio devuelve la misma canción. */
export function withSongFlagsForMember<T extends { notasPorMiembro?: any[] }>(
  song: T,
  memberKey: string | undefined,
  memberName: string,
  flags: { tono: boolean; bpm: boolean },
): T {
  if (
    isSongTonoMarkedForMember(song, memberKey, memberName) === flags.tono &&
    isSongBpmMarkedForMember(song, memberKey, memberName) === flags.bpm
  )
    return song;
  const list: any[] = Array.isArray(song.notasPorMiembro) ? [...song.notasPorMiembro] : [];
  const idx = list.findIndex(
    (n) =>
      (memberKey && n.userId === memberKey) ||
      (n.memberName && n.memberName.toLowerCase() === memberName.toLowerCase()),
  );
  if (idx < 0 && !flags.tono && !flags.bpm) return song;
  const base =
    idx >= 0
      ? list[idx]
      : { userId: memberKey, memberName, nota: "", updatedAt: new Date().toISOString() };
  const { mostrarTono: _t, mostrarBpm: _b, ...rest } = base;
  const next: any = { ...rest };
  if (flags.tono) next.mostrarTono = true;
  if (flags.bpm) next.mostrarBpm = true;
  else if (flags.tono) next.mostrarBpm = false;
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  return { ...song, notasPorMiembro: list };
}

/** Atajo: marca/desmarca tono y BPM a la vez. */
export function withSongMarkedForMember<T extends { notasPorMiembro?: any[] }>(
  song: T,
  memberKey: string | undefined,
  memberName: string,
  marked: boolean,
): T {
  return withSongFlagsForMember(song, memberKey, memberName, { tono: marked, bpm: marked });
}

/** Devuelve el array notasPorMiembro actualizado con el nuevo nivel de preparación de un miembro,
 * sin tocar la nota de texto libre que ya tuviera. Quien llama debe guardar el resultado (p.ej.
 * onUpdateSong({ ...song, notasPorMiembro: nuevoArray })) — esta función no muta nada. */
export function withMemberReadiness(
  song: any,
  memberKey: string | undefined,
  memberName: string,
  estado: ReadinessLevel,
): any[] {
  const existing: any[] = Array.isArray(song?.notasPorMiembro)
    ? [...song.notasPorMiembro]
    : [];
  const idx = existing.findIndex(
    (n: any) =>
      (memberKey && n.userId === memberKey) ||
      (!memberKey &&
        n.memberName &&
        n.memberName.toLowerCase() === memberName.toLowerCase()),
  );
  if (idx >= 0) {
    existing[idx] = {
      ...existing[idx],
      estadoPreparacion: estado,
      updatedAt: new Date().toISOString(),
    };
  } else {
    existing.push({
      userId: memberKey,
      memberName,
      nota: "",
      estadoPreparacion: estado,
      updatedAt: new Date().toISOString(),
    });
  }
  return existing;
}

/** Resumen agregado de preparación de la banda para una canción: cuántos miembros han marcado
 * cada nivel, sobre el total de miembros de la banda (no solo los que ya opinaron). */
export function getReadinessSummary(
  song: any,
  totalMembers: number,
): {
  lista: number;
  casiLista: number;
  aprendiendo: number;
  sinOpinar: number;
  total: number;
} {
  const notas: any[] = Array.isArray(song?.notasPorMiembro)
    ? song.notasPorMiembro
    : [];
  const lista = notas.filter((n) => n.estadoPreparacion === "lista").length;
  const casiLista = notas.filter(
    (n) => n.estadoPreparacion === "casi_lista",
  ).length;
  const aprendiendo = notas.filter(
    (n) => n.estadoPreparacion === "aprendiendo",
  ).length;
  const opinaron = lista + casiLista + aprendiendo;
  return {
    lista,
    casiLista,
    aprendiendo,
    sinOpinar: Math.max(0, totalMembers - opinaron),
    total: totalMembers,
  };
}

/**
 * Formatea segundos como "X min" o "Xm Ys" (duración total de un setlist)
 */
export function formatSecondsToMinutes(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

/**
 * Duración legible de un ítem no-canción del setlist (chapa, presentación, bis...)
 */
export function formatItemDuration(item: SetlistItemLike): string {
  if (item.duracionEstimadaSegundos) {
    const m = Math.floor(item.duracionEstimadaSegundos / 60);
    const s = item.duracionEstimadaSegundos % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  }
  if (item.duracionEstimadaMinutos) {
    return `${item.duracionEstimadaMinutos} min`;
  }
  return "0 min";
}

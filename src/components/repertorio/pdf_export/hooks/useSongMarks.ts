/**
 * Marcas por miembro sobre las canciones (qué toca cada uno) y su edición masiva.
 * Extraído de PdfExportModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction } from "react";
import { Setlist, Song } from "../../../../types";
import { BandMemberOption, isSongMarkedForMember, withSongMarkedForMember } from "../../../../utils/repertorioUtils";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SongMarksParams {
  currentPreviewMember: BandMemberOption;
  markedSongs: Record<string, string[]>;
  setMarkedSongs: Dispatch<SetStateAction<Record<string, string[]>>>;
  onUpdateSong: (updatedSong: Song) => void;
  activeSetlist: Setlist;
  songs: Song[];
}

/**
 * Marcas por miembro sobre las canciones (qué toca cada uno) y su edición masiva.
 * @param params Estado y callbacks del contenedor ({@link SongMarksParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSongMarks({ currentPreviewMember, markedSongs, setMarkedSongs, onUpdateSong, activeSetlist, songs }: SongMarksParams) {
  // Marcas "ver tono/BPM" del músico en vista: viven en cada canción (notasPorMiembro.mostrarTono),
  // igual que cuando las pone el propio músico desde sus notas. markedSongs (ajustes de la banda)
  // solo se lee por compatibilidad con lo guardado antes.
  const isMarked = (song: Song) =>
    isSongMarkedForMember(song, currentPreviewMember.id, currentPreviewMember.name) ||
    (markedSongs[currentPreviewMember.id] ?? []).includes(song.id);

  const setMark = (song: Song, marked: boolean) => {
    // Un marcado antiguo (en ajustes) se retira de ahí para que desmarcar funcione de verdad.
    if (!marked && (markedSongs[currentPreviewMember.id] ?? []).includes(song.id)) {
      setMarkedSongs((m) => ({
        ...m,
        [currentPreviewMember.id]: (m[currentPreviewMember.id] ?? []).filter((id) => id !== song.id),
      }));
    }
    const next = withSongMarkedForMember(song, currentPreviewMember.id, currentPreviewMember.name, marked);
    if (next !== song) onUpdateSong?.(next);
  };

  const setAllMarks = (marked: boolean) => {
    activeSetlist.items.forEach((it) => {
      if (it.tipoItem !== "cancion" || !it.songId) return;
      const song = songs.find((x) => x.id === it.songId);
      if (song) setMark(song, marked);
    });
  };

  const markedCountForMember = () =>
    activeSetlist.items.filter((it) => {
      if (it.tipoItem !== "cancion" || !it.songId) return false;
      const song = songs.find((x) => x.id === it.songId);
      return !!song && isMarked(song);
    }).length;

  return { markedCountForMember, setAllMarks, isMarked, setMark };
}

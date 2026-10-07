import type { Song } from "../types";
import { Atril } from "./Atril";

interface SongChordsViewerModalProps {
  song: Song;
  onClose: () => void;
  onUpdateSong: (updated: Song) => void;
}

/** @deprecated Fachada del Atril en modo Estudiar. Los sitios de uso migran a <Atril> de uno en uno (Fase 3). */
export function SongChordsViewerModal({ song, onClose, onUpdateSong }: SongChordsViewerModalProps) {
  return <Atril cancion={song} modo="Estudiar" onClose={onClose} onUpdateSong={onUpdateSong} />;
}

/**
 * Comprobación de la unión entre dos temas del repertorio: escucharla, diagnosticarla y ajustarla.
 * Contenedor: guarda de apertura + controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import type { Song, SetlistItem } from "../../types";
import { SongTransitionProvider } from "./song_transition/SongTransitionProvider";
import { SongTransitionView } from "./song_transition/SongTransitionView";
import { useSongTransitionController } from "./song_transition/hooks/useSongTransitionController";
import type { ResolvedSongTransitionProps } from "./song_transition/types";

interface SongTransitionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  songA: Song | null;
  songB: Song | null;
  itemA?: SetlistItem | null;
  itemB?: SetlistItem | null;
  indexA: number;
  indexB: number;
  totalItemsCount?: number;
  onNavigateTransition?: (newIndexA: number, newIndexB: number) => void;
  onInsertInterludio?: (afterItemId: string) => void;
  onSwapSongs?: (indexA: number, indexB: number) => void;
  onUpdateSong?: (song: Song) => void;
}

/**
 * Cuerpo del modal, montado solo con los dos temas presentes: así sus hooks se llaman siempre en el
 * mismo orden y la detección de audio no arranca con el modal cerrado.
 */
function SongTransitionPreview(props: ResolvedSongTransitionProps) {
  const controller = useSongTransitionController(props);
  return (
    <SongTransitionProvider value={{ ...controller, ...props }}>
      <SongTransitionView />
    </SongTransitionProvider>
  );
}

/**
 * Modal de comprobación de transición.
 * @param props Apertura, los dos temas con sus posiciones y las acciones sobre el repertorio.
 * @returns El modal, o nada si está cerrado o falta alguno de los temas.
 */
export function SongTransitionPreviewModal({
  isOpen,
  songA,
  songB,
  totalItemsCount = 0,
  ...props
}: SongTransitionPreviewModalProps) {
  if (!isOpen || !songA || !songB) return null;
  return <SongTransitionPreview {...props} songA={songA} songB={songB} totalItemsCount={totalItemsCount} />;
}

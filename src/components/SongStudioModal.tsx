/**
 * Punto de entrada de Song Studio. Solo cablea: el controlador compone el estado y la lógica,
 * el contexto los reparte y `SongStudioLayout` pinta. Cada responsabilidad vive en `song_studio/`.
 */
import { SongStudioProvider } from './song_studio/SongStudioProvider';
import { SongStudioLayout } from './song_studio/SongStudioLayout';
import { useSongStudioController } from './song_studio/hooks/useSongStudioController';
import type { Song, ThemeColors, User } from '../types';

interface SongStudioModalProps {
  song: Song;
  colors: ThemeColors;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
  currentUser?: User;
  initialOpenIrisModal?: boolean;
}

// Contrato público histórico: otros módulos importan estos símbolos desde aquí.
/* eslint-disable react-refresh/only-export-components */
export { getIdeaTracks } from './song_studio/ideaTracks';
export { MOISES_AVAILABLE_STEMS, MOISES_PRESETS_CONFIG } from './song_studio/moisesStems';
export type { MoisesSeparationPreset, MoisesStemOption } from './song_studio/moisesStems';

/**
 * Estudio de ideas de audio de una canción: grabación, mezclador multipista, Iris e IA.
 * @param props.song Canción abierta (la fuente de verdad la tiene el padre).
 * @param props.onUpdateSong Persiste los cambios de la canción.
 * @param props.initialOpenIrisModal Abre el selector de stems de Iris al montar (atajo «Procesar con Iris»).
 */
export default function SongStudioModal({
  song,
  colors,
  onClose,
  onUpdateSong,
  currentUsername = 'Tu Nombre',
  currentUser,
  initialOpenIrisModal = false,
}: SongStudioModalProps) {
  const studio = useSongStudioController({ song, onUpdateSong, currentUsername, initialOpenIrisModal });
  const contextValue = { ...studio, song, colors, onClose, onUpdateSong, currentUsername, currentUser };

  return (
    <SongStudioProvider value={contextValue}>
      <SongStudioLayout />
    </SongStudioProvider>
  );
}

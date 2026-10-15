/**
 * Modal "Concierto en directo → álbum": orquesta controlador, contexto y maqueta.
 * Toda la lógica vive en `live_concert_album/` (hooks por subdominio + vistas) por AGENTS.md §5.6.
 */
import React from 'react';
import type { ThemeColors } from '../../types';
import { useLiveConcertAlbumController } from './live_concert_album/hooks/useLiveConcertAlbumController';
import { LiveConcertAlbumLayout } from './live_concert_album/LiveConcertAlbumLayout';
import { LiveConcertAlbumProvider } from './live_concert_album/LiveConcertAlbumProvider';
import type { ConcertSetlistDraft, TrackCutItem } from './live_concert_album/types';

export type { TrackCutItem };

interface LiveConcertToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  bandName?: string;
  colors: ThemeColors;
  onSaveAlbumToCatalog: (albumTitle: string, tracks: TrackCutItem[]) => void;
  onSaveSetlist?: (newSetlist: ConcertSetlistDraft) => void;
}

/**
 * Convierte un concierto en directo en un disco: ingesta, análisis IA, edición de cortes y exportación.
 * @param props Visibilidad, banda activa y callbacks de guardado en catálogo/setlists.
 * @returns El modal o `null` si está cerrado.
 */
export const LiveConcertToAlbumModal: React.FC<LiveConcertToAlbumModalProps> = ({
  isOpen,
  onClose,
  bandName = 'Nuestra Banda',
  colors,
  onSaveAlbumToCatalog,
  onSaveSetlist,
}) => {
  const studio = useLiveConcertAlbumController({ bandName, isOpen, onSaveSetlist, onSaveAlbumToCatalog });

  if (!isOpen) return null;

  return (
    <LiveConcertAlbumProvider value={{ ...studio, isOpen, onClose, bandName, colors }}>
      <LiveConcertAlbumLayout />
    </LiveConcertAlbumProvider>
  );
};

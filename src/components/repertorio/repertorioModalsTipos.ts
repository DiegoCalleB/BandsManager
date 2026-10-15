/**
 * Estados de los modales de Repertorio que RepertorioModalsContainer recibe ya construidos por
 * los hooks de la vista (useRepertorioDialogs, useShareModal, useRepertorioPlaybackAndModals…).
 */
import type { Setlist, SetlistItem, Song } from '../../types';

/** Alta o edición de un setlist en curso. */
export interface SetlistModalData {
  isOpen: boolean;
  setlistToEdit: Setlist | null;
}

/** Contenido del modal de compartir una canción o un setlist. */
export interface ShareModalData {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  text: string;
  itemType: 'song' | 'setlist';
}

/** Par de temas consecutivos cuya transición se está escuchando. */
export interface TransitionPreviewData {
  isOpen: boolean;
  songA: Song | null;
  songB: Song | null;
  itemA: SetlistItem | null;
  itemB: SetlistItem | null;
  indexA: number;
  indexB: number;
}

/** Métricas del setlist activo (ver `useSetlistSync`). */
export interface MetricasSetlistActivo {
  totalSeconds: number;
  formattedTime: string;
  songCount: number;
  eventCount: number;
  blockCount: number;
  avgBpm: number;
}

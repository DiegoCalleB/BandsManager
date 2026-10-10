/**
 * Contexto del flujo concierto→álbum: reparte el estado y las acciones del controlador a las vistas.
 * Existe para que cada vista lea solo lo que usa, sin encadenar decenas de props desde el modal.
 */
import { createContext, useContext } from 'react';
import type { ThemeColors } from '../../../types';
import type { useLiveConcertAlbumController } from './hooks/useLiveConcertAlbumController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type LiveConcertAlbumController = ReturnType<typeof useLiveConcertAlbumController>;

/** Props del modal que las vistas también necesitan. */
export interface LiveConcertAlbumHostProps {
  isOpen: boolean;
  onClose: () => void;
  bandName: string;
  colors: ThemeColors;
}

/** Valor del contexto: controlador + props del anfitrión. */
export type LiveConcertAlbumContextValue = LiveConcertAlbumController & LiveConcertAlbumHostProps;

export const LiveConcertAlbumContext = createContext<LiveConcertAlbumContextValue | null>(null);

/**
 * Lee el contexto del flujo concierto→álbum.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link LiveConcertAlbumProvider} (error de programación, falla rápido).
 */
export function useLiveConcertAlbum(): LiveConcertAlbumContextValue {
  const value = useContext(LiveConcertAlbumContext);
  if (!value) throw new Error('useLiveConcertAlbum debe usarse dentro de <LiveConcertAlbumProvider>');
  return value;
}

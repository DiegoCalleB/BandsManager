/**
 * Contexto de Song Studio (solo tipos, contexto y hook; el proveedor vive en SongStudioProvider.tsx): reparte el estado y las acciones del controlador a las vistas del estudio.
 * Existe para que cada vista lea solo lo que usa, en vez de recibir decenas de props encadenadas.
 */
import { createContext, useContext } from 'react';
import type { Song, ThemeColors, User } from '../../types';
import type { useSongStudioController } from './hooks/useSongStudioController';

/** Todo lo que expone el controlador del estudio (inferido de su retorno, siempre sincronizado). */
export type SongStudioController = ReturnType<typeof useSongStudioController>;

/** Props del modal que las vistas también necesitan. */
export interface SongStudioHostProps {
  song: Song;
  colors: ThemeColors;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername: string;
  currentUser?: User;
}

/** Valor del contexto: controlador + props del anfitrión. */
export type SongStudioContextValue = SongStudioController & SongStudioHostProps;

export const SongStudioContext = createContext<SongStudioContextValue | null>(null);

/**
 * Lee el contexto de Song Studio.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link SongStudioProvider} (error de programación, falla rápido).
 */
export function useSongStudio(): SongStudioContextValue {
  const value = useContext(SongStudioContext);
  if (!value) throw new Error('useSongStudio debe usarse dentro de <SongStudioProvider>');
  return value;
}

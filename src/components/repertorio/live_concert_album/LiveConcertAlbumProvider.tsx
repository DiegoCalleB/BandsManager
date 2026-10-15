import type { ReactNode } from 'react';
import { LiveConcertAlbumContext, type LiveConcertAlbumContextValue } from './LiveConcertAlbumContext';

/**
 * Proveedor del contexto concierto→álbum.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function LiveConcertAlbumProvider({ value, children }: { value: LiveConcertAlbumContextValue; children: ReactNode }) {
  return <LiveConcertAlbumContext.Provider value={value}>{children}</LiveConcertAlbumContext.Provider>;
}

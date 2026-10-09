import type { ReactNode } from 'react';
import { SongStudioContext, type SongStudioContextValue } from './SongStudioContext';

/**
 * Proveedor del contexto de Song Studio.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function SongStudioProvider({ value, children }: { value: SongStudioContextValue; children: ReactNode }) {
  return <SongStudioContext.Provider value={value}>{children}</SongStudioContext.Provider>;
}

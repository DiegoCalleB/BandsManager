import type { ReactNode } from 'react';
import { TourManagerContext,type TourManagerContextValue } from './TourManagerContext';

/**
 * Proveedor del contexto del gestor de giras.
 * @param props.value Valor completo (controlador + props).
 */
export function TourManagerProvider({ value, children }: { value: TourManagerContextValue; children: ReactNode }) {
  return <TourManagerContext.Provider value={value}>{children}</TourManagerContext.Provider>;
}

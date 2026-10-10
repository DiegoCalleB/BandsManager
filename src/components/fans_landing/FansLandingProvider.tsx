import type { ReactNode } from 'react';
import { FansLandingContext,type FansLandingContextValue } from './FansLandingContext';

/**
 * Proveedor del contexto de la landing de fans.
 * @param props.value Valor completo (controlador + props de la landing).
 */
export function FansLandingProvider({ value, children }: { value: FansLandingContextValue; children: ReactNode }) {
  return <FansLandingContext.Provider value={value}>{children}</FansLandingContext.Provider>;
}

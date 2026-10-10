import type { ReactNode } from 'react';
import { BandSwitcherContext,type BandSwitcherContextValue } from './BandSwitcherContext';

/**
 * Proveedor del contexto del selector de bandas.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function BandSwitcherProvider({ value, children }: { value: BandSwitcherContextValue; children: ReactNode }) {
  return <BandSwitcherContext.Provider value={value}>{children}</BandSwitcherContext.Provider>;
}

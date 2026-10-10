import type { ReactNode } from 'react';
import { FansPanelContext,type FansPanelContextValue } from './FansPanelContext';

/**
 * Proveedor del contexto del panel de fans.
 * @param props.value Valor completo (controlador + props del panel).
 */
export function FansPanelProvider({ value, children }: { value: FansPanelContextValue; children: ReactNode }) {
  return <FansPanelContext.Provider value={value}>{children}</FansPanelContext.Provider>;
}

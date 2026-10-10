import type { ReactNode } from 'react';
import { ReelsCenterContext, type ReelsCenterContextValue } from './ReelsCenterContext';

/**
 * Proveedor del contexto del Centro de Reels.
 * @param props.value Valor completo (controlador + props de la pantalla).
 */
export function ReelsCenterProvider({ value, children }: { value: ReelsCenterContextValue; children: ReactNode }) {
  return <ReelsCenterContext.Provider value={value}>{children}</ReelsCenterContext.Provider>;
}

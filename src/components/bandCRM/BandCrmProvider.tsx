import type { ReactNode } from 'react';
import { BandCrmContext, type BandCrmContextValue } from './BandCrmContext';

/**
 * Proveedor del contexto del CRM de bandas.
 * @param props.value Valor completo (controlador + props de la pantalla).
 */
export function BandCrmProvider({ value, children }: { value: BandCrmContextValue; children: ReactNode }) {
  return <BandCrmContext.Provider value={value}>{children}</BandCrmContext.Provider>;
}

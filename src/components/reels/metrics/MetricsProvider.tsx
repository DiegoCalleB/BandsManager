import type { ReactNode } from 'react';
import { MetricsContext, type MetricsContextValue } from './MetricsContext';

/**
 * Proveedor del contexto de métricas.
 * @param props.value Valor completo (controlador + props de la vista).
 */
export function MetricsProvider({ value, children }: { value: MetricsContextValue; children: ReactNode }) {
  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>;
}

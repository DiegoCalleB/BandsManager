import type { ReactNode } from 'react';
import { CalendarContext, type CalendarContextValue } from './CalendarContext';

/**
 * Proveedor del contexto del Calendario.
 * @param props.value Valor completo (controlador + props de la pantalla).
 */
export function CalendarProvider({ value, children }: { value: CalendarContextValue; children: ReactNode }) {
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

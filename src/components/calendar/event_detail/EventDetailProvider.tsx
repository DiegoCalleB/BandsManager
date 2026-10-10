import type { ReactNode } from 'react';
import { EventDetailContext,type EventDetailContextValue } from './EventDetailContext';

/**
 * Proveedor del contexto de la ficha de evento.
 * @param props.value Valor completo (controlador + props del modal).
 */
export function EventDetailProvider({ value, children }: { value: EventDetailContextValue; children: ReactNode }) {
  return <EventDetailContext.Provider value={value}>{children}</EventDetailContext.Provider>;
}

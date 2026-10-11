import type { ReactNode } from 'react';
import { BookingCrmContext, type BookingCrmContextValue } from './BookingCrmContext';

/**
 * Proveedor del contexto del CRM de booking.
 * @param props.value Valor completo (controlador + props de la pantalla).
 */
export function BookingCrmProvider({ value, children }: { value: BookingCrmContextValue; children: ReactNode }) {
  return <BookingCrmContext.Provider value={value}>{children}</BookingCrmContext.Provider>;
}

/**
 * Contexto del CRM de booking: reparte estado y acciones del controlador a las vistas de la pantalla.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar decenas de props desde el contenedor.
 */
import { createContext, useContext } from 'react';
import type { BookingCRMProps } from '../../BookingCRM';
import type { useBookingCrmController } from './hooks/useBookingCrmController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type BookingCrmController = ReturnType<typeof useBookingCrmController>;

/** Valor del contexto: controlador + props de la pantalla (con sus valores por defecto ya resueltos). */
export type BookingCrmContextValue = BookingCrmController & BookingCRMProps;

export const BookingCrmContext = createContext<BookingCrmContextValue | null>(null);

/**
 * Lee el contexto del CRM de booking.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link BookingCrmProvider} (error de programación, falla rápido).
 */
export function useBookingCrm(): BookingCrmContextValue {
  const value = useContext(BookingCrmContext);
  if (!value) throw new Error('useBookingCrm debe usarse dentro de <BookingCrmProvider>');
  return value;
}

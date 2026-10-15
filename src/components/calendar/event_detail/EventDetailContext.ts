/**
 * Contexto de la ficha de evento del calendario: reparte props y estado local a las pestañas y bloques.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar ~70 props desde el modal.
 */
import { createContext, useContext } from 'react';
import type { CalendarEventDetailModalProps } from '../CalendarEventDetailModal';
import type { useEventDetailController } from './hooks/useEventDetailController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type EventDetailController = ReturnType<typeof useEventDetailController>;

/** Valor del contexto: controlador + props del modal. */
export type EventDetailContextValue = EventDetailController & CalendarEventDetailModalProps;

export const EventDetailContext = createContext<EventDetailContextValue | null>(null);

/**
 * Lee el contexto de la ficha de evento.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link EventDetailProvider} (error de programación, falla rápido).
 */
export function useEventDetail(): EventDetailContextValue {
  const value = useContext(EventDetailContext);
  if (!value) throw new Error('useEventDetail debe usarse dentro de <EventDetailProvider>');
  return value;
}

/**
 * Contexto del Calendario: reparte el estado y las acciones del controlador a las vistas.
 * Existe para que cada vista lea solo lo que usa, sin encadenar decenas de props desde la pantalla.
 */
import { createContext, useContext } from 'react';
import type { CalendarViewProps } from './calendarTypes';
import type { useCalendarController } from './hooks/useCalendarController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type CalendarController = ReturnType<typeof useCalendarController>;

/** Valor del contexto: controlador + props de la pantalla (con sus valores por defecto ya resueltos). */
export type CalendarContextValue = CalendarController & CalendarViewProps;

export const CalendarContext = createContext<CalendarContextValue | null>(null);

/**
 * Lee el contexto del Calendario.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link CalendarProvider} (error de programación, falla rápido).
 */
export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext);
  if (!value) throw new Error('useCalendar debe usarse dentro de <CalendarProvider>');
  return value;
}

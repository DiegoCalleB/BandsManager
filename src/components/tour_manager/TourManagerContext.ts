/**
 * Contexto del gestor de giras: reparte el estado del controlador y las props a las vistas.
 */
import { createContext, useContext } from 'react';
import type { TourManagerProps } from '../TourManager';
import type { useTourManagerController } from './hooks/useTourManagerController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type TourManagerController = ReturnType<typeof useTourManagerController>;

/** Valor del contexto: controlador + props del gestor (con sus valores por defecto aplicados). */
export type TourManagerContextValue = TourManagerController & TourManagerProps;

export const TourManagerContext = createContext<TourManagerContextValue | null>(null);

/**
 * Lee el contexto del gestor de giras.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link TourManagerProvider} (error de programación, falla rápido).
 */
export function useTourManager(): TourManagerContextValue {
  const value = useContext(TourManagerContext);
  if (!value) throw new Error('useTourManager debe usarse dentro de <TourManagerProvider>');
  return value;
}

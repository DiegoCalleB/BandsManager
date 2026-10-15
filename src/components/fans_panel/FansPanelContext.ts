/**
 * Contexto del panel de fans: reparte el estado del controlador y las props a las vistas.
 */
import { createContext, useContext } from 'react';
import type { FansPanelProps } from '../FansPanel';
import type { useFansPanelController } from './hooks/useFansPanelController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type FansPanelController = ReturnType<typeof useFansPanelController>;

/** Valor del contexto: controlador + props del panel (con sus valores por defecto aplicados). */
export type FansPanelContextValue = FansPanelController & FansPanelProps;

export const FansPanelContext = createContext<FansPanelContextValue | null>(null);

/**
 * Lee el contexto del panel de fans.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link FansPanelProvider} (error de programación, falla rápido).
 */
export function useFansPanel(): FansPanelContextValue {
  const value = useContext(FansPanelContext);
  if (!value) throw new Error('useFansPanel debe usarse dentro de <FansPanelProvider>');
  return value;
}

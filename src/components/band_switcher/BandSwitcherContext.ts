/**
 * Contexto del selector de bandas: reparte el estado del controlador y las props a las vistas.
 */
import { createContext, useContext } from 'react';
import type { BandSwitcherModalProps } from '../BandSwitcherModal';
import type { useBandSwitcherController } from './hooks/useBandSwitcherController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type BandSwitcherController = ReturnType<typeof useBandSwitcherController>;

/** Valor del contexto: controlador + props del modal. */
export type BandSwitcherContextValue = BandSwitcherController & BandSwitcherModalProps;

export const BandSwitcherContext = createContext<BandSwitcherContextValue | null>(null);

/**
 * Lee el contexto del selector de bandas.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link BandSwitcherProvider} (error de programación, falla rápido).
 */
export function useBandSwitcher(): BandSwitcherContextValue {
  const value = useContext(BandSwitcherContext);
  if (!value) throw new Error('useBandSwitcher debe usarse dentro de <BandSwitcherProvider>');
  return value;
}

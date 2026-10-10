/**
 * Contexto de la landing pública de fans: reparte el estado del controlador y las props a las vistas.
 * Existe para que cada bloque lea solo lo que usa, sin encadenar decenas de props.
 */
import { createContext, useContext } from 'react';
import type { FansLandingProps } from '../FansLanding';
import type { useFansLandingController } from './hooks/useFansLandingController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type FansLandingController = ReturnType<typeof useFansLandingController>;

/** Valor del contexto: controlador + props de la landing. */
export type FansLandingContextValue = FansLandingController & FansLandingProps;

export const FansLandingContext = createContext<FansLandingContextValue | null>(null);

/**
 * Lee el contexto de la landing de fans.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link FansLandingProvider} (error de programación, falla rápido).
 */
export function useFansLanding(): FansLandingContextValue {
  const value = useContext(FansLandingContext);
  if (!value) throw new Error('useFansLanding debe usarse dentro de <FansLandingProvider>');
  return value;
}

/**
 * Contexto de la aplicación: reparte el estado del controlador a la puerta de entrada y al armazón.
 */
import { createContext,useContext } from 'react';
import type { useAppController } from './hooks/useAppController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type AppContextValue = ReturnType<typeof useAppController>;

export const AppContext = createContext<AppContextValue | null>(null);

/**
 * Lee el contexto de la aplicación.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link AppProvider} (error de programación, falla rápido).
 */
export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return value;
}

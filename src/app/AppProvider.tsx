import type { ReactNode } from 'react';
import { AppContext,type AppContextValue } from './AppContext';

/**
 * Proveedor del contexto de la aplicación.
 * @param props.value Valor completo del controlador.
 */
export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

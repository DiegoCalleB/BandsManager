import type { ReactNode } from "react";
import { GooglePlacesExplorerContext,type GooglePlacesExplorerContextValue } from "./GooglePlacesExplorerContext";

/**
 * Proveedor del contexto del explorador de lugares.
 * @param props.value Valor completo (controlador + props).
 */
export function GooglePlacesExplorerProvider({ value, children }: { value: GooglePlacesExplorerContextValue; children: ReactNode }) {
  return <GooglePlacesExplorerContext.Provider value={value}>{children}</GooglePlacesExplorerContext.Provider>;
}

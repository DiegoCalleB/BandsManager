import type { ReactNode } from "react";
import { AtrilContext,type AtrilContextValue } from "./AtrilContext";

/**
 * Proveedor del contexto del Atril.
 * @param props.value Valor completo (controlador + props).
 */
export function AtrilProvider({ value, children }: { value: AtrilContextValue; children: ReactNode }) {
  return <AtrilContext.Provider value={value}>{children}</AtrilContext.Provider>;
}

import type { ReactNode } from "react";
import { LeadsTableContext,type LeadsTableContextValue } from "./LeadsTableContext";

/**
 * Proveedor del contexto de la tabla de leads.
 * @param props.value Valor completo (controlador + props).
 */
export function LeadsTableProvider({ value, children }: { value: LeadsTableContextValue; children: ReactNode }) {
  return <LeadsTableContext.Provider value={value}>{children}</LeadsTableContext.Provider>;
}

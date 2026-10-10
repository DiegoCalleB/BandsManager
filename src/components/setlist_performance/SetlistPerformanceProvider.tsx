import type { ReactNode } from "react";
import { SetlistPerformanceContext,type SetlistPerformanceContextValue } from "./SetlistPerformanceContext";

/**
 * Proveedor del contexto del visor de repertorio.
 * @param props.value Valor completo (controlador + props).
 */
export function SetlistPerformanceProvider({ value, children }: { value: SetlistPerformanceContextValue; children: ReactNode }) {
  return <SetlistPerformanceContext.Provider value={value}>{children}</SetlistPerformanceContext.Provider>;
}

import type { ReactNode } from "react";
import { SongTransitionContext, type SongTransitionContextValue } from "./SongTransitionContext";

/**
 * Proveedor del contexto de la comprobación de transición.
 * @param props.value Valor completo (controlador + props).
 */
export function SongTransitionProvider({
  value,
  children,
}: {
  value: SongTransitionContextValue;
  children: ReactNode;
}) {
  return <SongTransitionContext.Provider value={value}>{children}</SongTransitionContext.Provider>;
}

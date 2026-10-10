import type { ReactNode } from "react";
import { UserProfileContext,type UserProfileContextValue } from "./UserProfileContext";

/**
 * Proveedor del contexto del perfil de usuario.
 * @param props.value Valor completo (controlador + props).
 */
export function UserProfileProvider({ value, children }: { value: UserProfileContextValue; children: ReactNode }) {
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

/**
 * Contexto del perfil de usuario: reparte el estado del controlador y las props a las vistas.
 */
import { createContext,useContext } from "react";
import type { ResolvedUserProfileProps } from "../UserProfileModal";
import type { useUserProfileController } from "./hooks/useUserProfileController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type UserProfileController = ReturnType<typeof useUserProfileController>;

/** Valor del contexto: controlador + props del perfil (con sus valores por defecto aplicados). */
export type UserProfileContextValue = UserProfileController & ResolvedUserProfileProps;

export const UserProfileContext = createContext<UserProfileContextValue | null>(null);

/**
 * Lee el contexto del perfil de usuario.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link UserProfileProvider} (error de programación, falla rápido).
 */
export function useUserProfile(): UserProfileContextValue {
  const value = useContext(UserProfileContext);
  if (!value) throw new Error("useUserProfile debe usarse dentro de <UserProfileProvider>");
  return value;
}

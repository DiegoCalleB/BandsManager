/**
 * Contexto del explorador de lugares: reparte el estado del controlador y las props a las vistas.
 */
import { createContext,useContext } from "react";
import type { GooglePlacesExplorerModalProps } from "../GooglePlacesExplorerModal";
import type { useGooglePlacesExplorerController } from "./hooks/useGooglePlacesExplorerController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type GooglePlacesExplorerController = ReturnType<typeof useGooglePlacesExplorerController>;

/** Valor del contexto: controlador + props del modal. */
export type GooglePlacesExplorerContextValue = GooglePlacesExplorerController & GooglePlacesExplorerModalProps;

export const GooglePlacesExplorerContext = createContext<GooglePlacesExplorerContextValue | null>(null);

/**
 * Lee el contexto del explorador de lugares.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link GooglePlacesExplorerProvider} (error de programación, falla rápido).
 */
export function useGooglePlacesExplorer(): GooglePlacesExplorerContextValue {
  const value = useContext(GooglePlacesExplorerContext);
  if (!value) throw new Error("useGooglePlacesExplorer debe usarse dentro de <GooglePlacesExplorerProvider>");
  return value;
}

/**
 * Contexto del Atril: reparte el estado del controlador y las props a las vistas.
 */
import { createContext, useContext } from "react";
import type { ResolvedAtrilProps } from "../Atril";
import type { useAtrilController } from "./hooks/useAtrilController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type AtrilController = ReturnType<typeof useAtrilController>;

/** Valor del contexto: controlador + props del Atril (con sus valores por defecto aplicados). */
export type AtrilContextValue = AtrilController & ResolvedAtrilProps;

export const AtrilContext = createContext<AtrilContextValue | null>(null);

/**
 * Lee el contexto del Atril.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link AtrilProvider} (error de programación, falla rápido).
 */
export function useAtril(): AtrilContextValue {
  const value = useContext(AtrilContext);
  if (!value) throw new Error("useAtril debe usarse dentro de <AtrilProvider>");
  return value;
}

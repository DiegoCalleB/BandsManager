/**
 * Contexto del visor de repertorio en directo: reparte el estado del controlador y las props a las vistas.
 */
import { createContext,useContext } from "react";
import type { SetlistItem } from "../../types";
import type { SetlistPerformanceViewProps } from "../SetlistPerformanceView";
import type { useSetlistPerformanceController } from "./hooks/useSetlistPerformanceController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type SetlistPerformanceController = ReturnType<typeof useSetlistPerformanceController>;

/** Valor del contexto: controlador + props del visor. */
export type SetlistPerformanceContextValue = SetlistPerformanceController & SetlistPerformanceViewProps;

export const SetlistPerformanceContext = createContext<SetlistPerformanceContextValue | null>(null);

/**
 * Lee el contexto del visor de repertorio.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link SetlistPerformanceProvider} (error de programación, falla rápido).
 */
export function useSetlistPerformance(): SetlistPerformanceContextValue {
  const value = useContext(SetlistPerformanceContext);
  if (!value) throw new Error("useSetlistPerformance debe usarse dentro de <SetlistPerformanceProvider>");
  return value;
}

/**
 * Elemento actual del repertorio para las vistas que solo existen cuando hay uno
 * (la vista raíz resuelve antes el caso "repertorio vacío").
 * @returns El elemento actual, nunca `undefined`.
 * @throws Error si no hay elemento actual (error de programación, falla rápido).
 */
export function useActivePerformanceItem(): SetlistItem {
  const { currentItem } = useSetlistPerformance();
  if (!currentItem) throw new Error("useActivePerformanceItem requiere un elemento actual en el repertorio");
  return currentItem;
}

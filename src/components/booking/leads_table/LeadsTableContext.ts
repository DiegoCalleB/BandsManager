/**
 * Contexto de la tabla de leads: reparte el estado del controlador y las props a las vistas.
 */
import { createContext,useContext } from "react";
import type { ResolvedLeadsTableProps } from "../LeadsTable";
import type { useLeadsTableController } from "./hooks/useLeadsTableController";

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type LeadsTableController = ReturnType<typeof useLeadsTableController>;

/** Valor del contexto: controlador + props de la tabla (con sus valores por defecto aplicados). */
export type LeadsTableContextValue = LeadsTableController & ResolvedLeadsTableProps;

export const LeadsTableContext = createContext<LeadsTableContextValue | null>(null);

/**
 * Lee el contexto de la tabla de leads.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link LeadsTableProvider} (error de programación, falla rápido).
 */
export function useLeadsTable(): LeadsTableContextValue {
  const value = useContext(LeadsTableContext);
  if (!value) throw new Error("useLeadsTable debe usarse dentro de <LeadsTableProvider>");
  return value;
}

/**
 * Insignia de intención comercial del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadIntentBadgeProps {
  lead: Lead;
}

/**
 * Insignia de intención comercial del lead.
 * @returns Sección de interfaz.
 */
export function LeadIntentBadge({ lead }: LeadIntentBadgeProps) {
    const intent = lead.ultima_intencion;
    if (!intent) return null;

    if (intent === "confirmar_fecha" || intent === "proponer_fechas") {
      return (
  <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] ">
    <ShowIcon inline emoji="📅" />Pide fechas
  </span>
      );
    }
    if (intent === "pedir_cache") {
      return (
  <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] ">
    <ShowIcon inline emoji="💰" />Negociación caché
  </span>
      );
    }
    if (intent === "pedir_info_tecnica") {
      return (
  <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] ">
    <ShowIcon inline emoji="🎛️" />Pide rider
  </span>
      );
    }
    if (intent === "rechazo_programacion_llena") {
      return (
  <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] ">
    <ShowIcon inline emoji="⏳" />Prog. Llena
  </span>
      );
    }
    if (intent === "derivar_contacto") {
      return (
  <span className="inline-flex items-center gap-1 text-micro font-mono px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] ">
    <ShowIcon inline emoji="📋" />Deriva contacto
  </span>
      );
    }
    return null;

}

/**
 * Insignia de temperatura del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Flame } from "lucide-react";
import { Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadTemperatureBadgeProps {
  lead: Lead;
}

/**
 * Insignia de temperatura del lead.
 * @returns Sección de interfaz.
 */
export function LeadTemperatureBadge({ lead }: LeadTemperatureBadgeProps) {
    const temp = lead.temperatura_lead;
    if (temp === "muy_caliente" || lead.ultimo_sentimiento === "muy_positivo") {
      return (
  <span
    className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-bold bg-[var(--ok)]/20 text-[var(--ink)] shrink-0 shadow-xs"
    title="Lead muy receptivo / Cierre inminente"
  >
    <Flame className="w-2.5 h-2.5 text-[var(--ok)] fill-emerald-400" />
    <span>Muy Caliente</span>
  </span>
      );
    }
    if (
      temp === "caliente" ||
      (lead.ultimo_sentimiento_score && lead.ultimo_sentimiento_score >= 0.4)
    ) {
      return (
  <span
    className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-bold bg-[var(--acc)]/20 text-[var(--ink)] shrink-0 shadow-xs"
    title="Interés alto"
  >
    <Flame className="w-2.5 h-2.5 text-[var(--acc)]" />
    <span>Caliente</span>
  </span>
      );
    }
    if (temp === "tibio") {
      return (
  <span
    className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-medium bg-[var(--acc)]/15 text-[var(--ink)] shrink-0"
    title="En evaluación / Interés templado"
  >
    <span><ShowIcon inline emoji="🌤️" />Tibio</span>
  </span>
      );
    }
    if (temp === "frio" || temp === "congelado") {
      return (
  <span
    className="inline-flex items-center gap-1 text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-medium bg-[var(--sunken)] text-[var(--ink-2)] shrink-0"
    title="Sin respuesta o baja tracción"
  >
    <span><ShowIcon inline emoji="❄️" />Frío</span>
  </span>
      );
    }
    return null;

}

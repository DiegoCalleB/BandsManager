/**
 * Caja de inteligencia de la tarjeta: fechas, economía, resumen y playbook.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Calendar,Coins,Zap } from "lucide-react";
import { Lead } from "../../../types";
import { ShowIcon } from "../../ui/ShowIcon";
import { useLeadsTable } from "./LeadsTableContext";

/** Datos propios de cada instancia (el resto sale del contexto del flujo). */
export interface LeadCardIntelligenceProps {
  hasIntelligence: boolean;
  lead: Lead;
}

/**
 * Caja de inteligencia de la tarjeta: fechas, economía, resumen y playbook.
 * @returns Sección de interfaz.
 */
export function LeadCardIntelligence({ hasIntelligence, lead }: LeadCardIntelligenceProps) {
  const { onSelectLead } = useLeadsTable();
  return (
    <>
      {/* Intelligence & Deal Box (Fechas, Economía, Resumen o Playbook) */}
      {hasIntelligence && (
  <div className="bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)] space-y-2 text-xs">
    {/* Entidades Detectadas: Fechas y Economía */}
    {((lead.fechas_propuestas_sala &&
      lead.fechas_propuestas_sala.length > 0) ||
      lead.condiciones_economicas_detectadas) && (
      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[var(--hair)]/70">
      {lead.fechas_propuestas_sala &&
        lead.fechas_propuestas_sala.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--ink)] text-micro font-mono font-semibold"
            title={`Fechas propuestas por la sala: ${lead.fechas_propuestas_sala.join(", ")}`}
          >
            <Calendar className="w-3 h-3 text-[var(--acc)] shrink-0" />
            <span>
              {lead.fechas_propuestas_sala
                .slice(0, 2)
                .join(", ")}
            </span>
          </span>
        )}
      {lead.condiciones_economicas_detectadas?.cifra && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--ok)]/15 text-[var(--ink)] text-micro font-mono font-semibold"
          title={`Condiciones económicas: ${lead.condiciones_economicas_detectadas.tipo || ""} ${lead.condiciones_economicas_detectadas.detalles || ""}`}
        >
          <Coins className="w-3 h-3 text-[var(--ok)] shrink-0" />
          <span>
            {lead.condiciones_economicas_detectadas.cifra}
          </span>
        </span>
      )}
      </div>
    )}

    {/* Resumen Ejecutivo / Último Mensaje */}
    {(lead.ultimo_analisis_resumen ||
      lead.ultimo_mensaje_recibido) && (
      <p className="text-xs text-[var(--ink-2)] line-clamp-2 leading-relaxed italic">
      "
      {lead.ultimo_analisis_resumen ||
        lead.ultimo_mensaje_recibido}
      "
      </p>
    )}

    {/* Tactical Playbook Chip */}
    {lead.estrategia_playbook && (
      <div className="p-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-micro text-[var(--ink)] flex items-center justify-between gap-1">
      <span className="truncate font-medium flex items-center gap-1">
        <Zap className="w-3 h-3 text-[var(--acc)] shrink-0" />
        <span>{lead.estrategia_playbook.titulo}</span>
      </span>
      {lead.estrategia_playbook.propuesta_rapida && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectLead(lead);
          }}
          className="text-micro font-bold bg-[var(--acc)] text-[var(--on-acc)] px-1.5 py-0.5 rounded shrink-0 hover:bg-[var(--acc)] cursor-pointer shadow-xs"
          title="Ver propuesta táctica en ficha"
        >
          Playbook <ShowIcon inline emoji="⚡" />
        </button>
      )}
      </div>
    )}
  </div>
      )}
    </>
  );
}

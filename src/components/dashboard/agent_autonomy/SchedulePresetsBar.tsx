/**
 * Presets de horario y acciones rápidas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Clock, Sparkles } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Presets de horario y acciones rápidas.
 * @returns Sección de interfaz.
 */
export function SchedulePresetsBar() {
  const { isAdmin, applyPresetRecommendedBooking, applyPresetCommercial, applyPresetAllDay } = useAgentAutonomy();
  return (
    <>
      {/* Presets & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--acc)]" />
          <span className="text-xs font-sans font-bold text-[var(--ink)]">
            Ventanas de Ejecución Comercial:
          </span>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              type="button"
              onClick={applyPresetRecommendedBooking}
              className="items-center gap-1.5/10/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sugerir mejores días (M-X-J)</span>
            </Button>
            <button
              type="button"
              onClick={applyPresetCommercial}
              className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans font-bold transition-ui cursor-pointer active:scale-[0.97]"
            >
              <ShowIcon inline emoji="🏢" />Laborables L-V
            </button>
            <button
              type="button"
              onClick={applyPresetAllDay}
              className="px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans transition-ui cursor-pointer active:scale-[0.97]"
            >
              <ShowIcon inline emoji="⚡" />Toda la semana (7d)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

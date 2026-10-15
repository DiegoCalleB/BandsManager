/**
 * Pie del modal: aviso de cambios y botones de cerrar/guardar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CheckCircle2, Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "../../ui";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Pie del modal: aviso de cambios y botones de cerrar/guardar.
 * @returns Sección de interfaz.
 */
export function AutonomyFooter() {
  const { bandId, onClose, isAdmin, handleSave, isSaving, isLoading, savedSuccess } = useAgentAutonomy();
  return (
    <>
      {/* Modal Footer */}
      <div
      className={`p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 ${"bg-[var(--sunken)]"}`}
      >
      <div className="flex items-center gap-2 text-xs font-sans text-[var(--ink-2)]">
        <ShieldCheck className="w-4 h-4 text-[var(--ok)]" />
        <span>
          Aislamiento Multi-Tenant:{" "}
          <strong className="text-[var(--ink)]">{bandId}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--surface)]/80 text-[var(--ink-2)] text-xs font-sans font-bold hover:bg-[var(--surface)]/70 transition-colors cursor-pointer"
        >
          Cerrar
        </button>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--acc-ink)]" />
                <span>Guardando ajustes…</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[var(--acc-ink)]" />
                <span>¡Configuración guardada!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </Button>
        )}
      </div>
      </div>
    </>
  );
}

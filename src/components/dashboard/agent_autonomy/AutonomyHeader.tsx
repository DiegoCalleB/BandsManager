/**
 * Cabecera del modal de autonomía de agentes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bot, Lock, ShieldCheck, X } from "lucide-react";
import { IconButton } from "../../ui";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Cabecera del modal de autonomía de agentes.
 * @returns Sección de interfaz.
 */
export function AutonomyHeader() {
  const { bandName, isAdmin, onClose } = useAgentAutonomy();
  return (
    <>
      {/* Modal Header */}
      <div
      className={`p-4 sm:p-5 flex items-center justify-between shrink-0 ${"bg-[var(--sunken)]"}`}
      >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20  text-[var(--ink)]">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold font-display text-[var(--ink)]">
              Panel de control de agentes IA
            </h3>
            <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--ink)] font-bold">
              {bandName}
            </span>
            {isAdmin ? (
              <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ink-2)] flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3 h-3" /> Mánager / Admin
              </span>
            ) : (
              <span className="text-micro font-sans px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ink-3)]/60 text-[var(--ink)] flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" /> Modo lectura (Músico)
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5">
            Centraliza la autonomía de envío, horarios comerciales y
            pautas de redacción para los agentes de Supabase.
          </p>
        </div>
      </div>

      <IconButton
        label="Cerrar"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </IconButton>
      </div>
    </>
  );
}

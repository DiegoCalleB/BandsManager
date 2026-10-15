/**
 * Aviso de la regla no negociable de aprobación humana.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShieldCheck } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Aviso de la regla no negociable de aprobación humana.
 * @returns Sección de interfaz.
 */
export function RedLineNotice() {
  const { bandName } = useAgentAutonomy();
  return (
    <>
      {/* REGLA NO NEGOCIABLE NOTICE */}
      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink)] text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <strong className="font-bold text-[var(--acc)]/70">
            Garantía de Control Humano (Cierre Inviolable):
          </strong>
          <p className="text-[var(--ink-2)] text-xs">
            Incluso con la máxima autonomía,{" "}
            <strong className="text-[var(--ink)]">
              ningún trato o contrato se da por cerrado ni ningún
              email final de confirmación se envía sin la validación
              previa del mánager
            </strong>{" "}
            o un miembro de {bandName}.
          </p>
        </div>
      </div>
    </>
  );
}

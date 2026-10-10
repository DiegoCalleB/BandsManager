/**
 * Aviso de solo lectura para usuarios que no son administradores.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Lock } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Aviso de solo lectura para usuarios que no son administradores.
 * @returns Sección de interfaz.
 */
export function ReadOnlyBanner() {
  const { isAdmin } = useAgentAutonomy();
  return (
    <>
      {/* Read-Only Banner for Non-Admins */}
      {!isAdmin && (
      <div className="p-3 bg-[var(--sunken)] text-[var(--acc-ink)] text-xs flex items-center gap-2 px-5">
        <Lock className="w-4 h-4 text-[var(--acc)] shrink-0" />
        <span>
          Estás en modo <strong>Solo lectura</strong>. Solo los miembros
          con rol de Administrador o Mánager pueden modificar los
          parámetros de los agentes.
        </span>
      </div>
      )}
    </>
  );
}

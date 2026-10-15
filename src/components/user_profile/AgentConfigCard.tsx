/**
 * Acceso al panel de agentes de IA de la banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bot,ChevronDown } from "lucide-react";
import { useUserProfile } from "./UserProfileContext";

/**
 * Acceso al panel de agentes de IA de la banda.
 * @returns Sección de interfaz.
 */
export function AgentConfigCard() {
  const { currentUser, isPromoUser, setShowAgentConfig } = useUserProfile();
  return (
    <>
      {currentUser.band_id && !isPromoUser && (
        <div className="pt-3 ">
          <button
            type="button"
            onClick={() => setShowAgentConfig(true)}
            className={`w-full p-2.5 rounded-[var(--r-m)] text-left transition-ui cursor-pointer flex items-center justify-between gap-2 ${"bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]"}`}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[var(--acc)]" />
              <span className="text-xs font-sans font-semibold">
                Configuración de agentes IA (Autonomía, horarios y email)
              </span>
            </div>
            <span className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1">
              <span>Abrir</span>
              <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
            </span>
          </button>
        </div>
      )}
    </>
  );
}

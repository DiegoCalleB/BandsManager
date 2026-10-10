/**
 * Navegación por pestañas de la configuración de autonomía.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity, Clock, Mail, MessageSquare, Sliders, Sparkles } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Navegación por pestañas de la configuración de autonomía.
 * @returns Sección de interfaz.
 */
export function AutonomyTabNav() {
  const { setActiveTab, activeTab, emailAccountConnected, auditLogs } = useAgentAutonomy();
  return (
    <>
      {/* Tab Navigation */}
      <div
      className={`flex px-4 sm:px-5 gap-2 shrink-0 overflow-x-auto ${"bg-[var(--sunken)]/60"}`}
      >
      <button
        type="button"
        onClick={() => setActiveTab("autonomy")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "autonomy"
            ? "text-[var(--acc)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span>1. Autonomía</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("response_strategies")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "response_strategies"
            ? "text-[var(--acc)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <MessageSquare className="w-4 h-4 text-[var(--tentative)]" />
        <span>2. Estrategias de respuesta</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("email_dispatch")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "email_dispatch"
            ? "text-[var(--acc)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <Mail className="w-4 h-4 text-[var(--ink-2)]" />
        <span>3. Email y buzón</span>
        {emailAccountConnected && (
          <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--ok)] inline-block"></span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("schedules")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "schedules"
            ? "text-[var(--acc)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>4. Horarios</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("tone")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "tone"
            ? "text-[var(--acc)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>5. Tono y identidad</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("audit_logs")}
        className={`py-3 px-3.5 text-xs font-sans font-bold flex items-center gap-2 transition-ui cursor-pointer whitespace-nowrap ${
          activeTab === "audit_logs"
            ? "text-[var(--ok)]"
            : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
      >
        <Activity className="w-4 h-4 text-[var(--ok)]" />
        <span>6. Auditoría</span>
        {auditLogs.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro bg-[var(--ok)]/20 text-[var(--ink)] font-sans">
            {auditLogs.length}
          </span>
        )}
      </button>
      </div>
    </>
  );
}

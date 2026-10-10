/**
 * Monitor del estado de los agentes programados en GitHub Actions.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Activity } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Monitor del estado de los agentes programados en GitHub Actions.
 * @returns Sección de interfaz.
 */
export function AgentStatusMonitor() {
  const { horasEnviador, diasEnviador } = useAgentAutonomy();
  return (
    <>
      {/* Monitor de Estado de Agentes de Supabase (GitHub Actions) */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-sans font-bold text-[var(--ok)] flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Estado en Tiempo Real de
            Agentes (Supabase Engine)
          </h4>
          <span className="text-micro font-sans text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded font-bold">
            Sistemas operativos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--ok)]" />
              <div>
                <div className="text-xs font-sans font-bold text-[var(--ink)]">
                  Agente scout (búsqueda)
                </div>
                <div className="text-micro text-[var(--ink-2)] font-sans">
                  Rastreo de salas y contactos
                </div>
              </div>
            </div>
            <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] px-2 py-0.5 rounded font-bold">
              Listo
            </span>
          </div>

          <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--ok)]" />
              <div>
                <div className="text-xs font-sans font-bold text-[var(--ink)]">
                  Agente Redactor (Gemini)
                </div>
                <div className="text-micro text-[var(--ink-2)] font-sans">
                  Generador de propuestas y pitches
                </div>
              </div>
            </div>
            <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--ok-soft)] px-2 py-0.5 rounded font-bold">
              Activo
            </span>
          </div>

          <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-[var(--r-pill)] ${horasEnviador.length > 0 && diasEnviador.length > 0 ? "bg-[var(--ok)]" : "bg-[var(--acc)]"}`}
              />
              <div>
                <div className="text-xs font-sans font-bold text-[var(--ink)]">
                  Agente Enviador (Gmail API)
                </div>
                <div className="text-micro text-[var(--ink-2)] font-sans">
                  {diasEnviador.length}d/sem · {horasEnviador.length}
                  h/día
                </div>
              </div>
            </div>
            <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--sunken)] px-2 py-0.5 rounded font-bold">
              {horasEnviador.length > 0 && diasEnviador.length > 0
                ? "Programado"
                : "Pausado"}
            </span>
          </div>

          <div className="p-3 rounded-[var(--r-s)] bg-[var(--surface)]/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-[var(--r-pill)] bg-[var(--tentative)]" />
              <div>
                <div className="text-xs font-sans font-bold text-[var(--ink)]">
                  Agente lector (clasificador)
                </div>
                <div className="text-micro text-[var(--ink-2)] font-sans">
                  Revisa la bandeja cada minuto, sin horario
                </div>
              </div>
            </div>
            <span className="text-micro font-sans text-[var(--ink-2)] bg-[var(--bg)]/60 px-2 py-0.5 rounded font-bold">
              En Escucha
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

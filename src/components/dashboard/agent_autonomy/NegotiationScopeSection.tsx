/**
 * Alcance de la negociación autónoma de los agentes.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bot } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Alcance de la negociación autónoma de los agentes.
 * @returns Sección de interfaz.
 */
export function NegotiationScopeSection() {
  const { isAdmin, setConfig, config } = useAgentAutonomy();
  return (
    <>
      {/* 2. ALCANCE DE NEGOCIACIÓN */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <Bot className="w-4 h-4" /> 2. Alcance de negociación del
            mánager IA
          </h4>
          <span className="text-micro text-[var(--ink-2)] font-sans">
            ¿Qué temas puede tratar el agente?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({
                ...config,
                negotiationDepth: "outreach_only",
              })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.negotiationDepth === "outreach_only"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <span className="text-micro font-sans font-bold text-[var(--acc)]">
                Nivel A
              </span>
              <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                Solo “Llamada a la puerta”
              </h5>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-snug">
                El agente solo saluda y envía el Dossier EPK. En
                cuanto la sala responde con dudas de precio o fecha,
                el bot se detiene.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({
                ...config,
                negotiationDepth: "filter_conditions",
              })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.negotiationDepth === "filter_conditions"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <span className="text-micro font-sans font-bold text-[var(--ink-2)]">
                Nivel B
              </span>
              <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                Filtro de requisitos y fechas
              </h5>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-snug">
                Responde sobre disponibilidad de calendario y rider
                técnico. Confirma si la sala ofrece taquilla/caché
                dentro de tus límites.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({
                ...config,
                negotiationDepth: "advanced_negotiation",
              })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.negotiationDepth === "advanced_negotiation"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <span className="text-micro font-sans font-bold text-[var(--tentative)]">
                Nivel C
              </span>
              <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                Negociador hasta Pre-Cierre
              </h5>
              <p className="text-xs text-[var(--ink-2)] font-sans leading-snug">
                Propone fechas alternativas ante solapamientos y
                formula contraofertas en tu rango de caché. Deja el
                trato listo para tu firma.
              </p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

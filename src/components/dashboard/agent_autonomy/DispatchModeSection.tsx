/**
 * Modo de envío: borrador, aprobación humana o envío automático.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Bot, Clock, FileEdit, Send } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Modo de envío: borrador, aprobación humana o envío automático.
 * @returns Sección de interfaz.
 */
export function DispatchModeSection() {
  const { isAdmin, setConfig, config } = useAgentAutonomy();
  return (
    <>
      {/* 1. MODO DE ENVÍO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <Send className="w-4 h-4" /> 1. Autonomía de envío (Modo
            de despacho)
          </h4>
          <span className="text-micro text-[var(--ink-2)] font-sans">
            ¿Cuándo se envían los correos?
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Draft Only */}
          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({ ...config, dispatchLevel: "draft_only" })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.dispatchLevel === "draft_only"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FileEdit className="w-5 h-5 text-[var(--acc)]" />
                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-bold">
                  100% Manual
                </span>
              </div>
              <div>
                <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                  Borrador y aprobación
                </h5>
                <p className="text-xs text-[var(--ink-2)] font-sans mt-1 leading-snug">
                  Todos los correos generados se guardan como borrador
                  en la pestaña{" "}
                  <strong className="text-[var(--ink)]">
                    Pendiente de aprobación
                  </strong>
                  . Requiere clic directo.
                </p>
              </div>
            </div>
            <div className="text-micro font-sans font-semibold text-[var(--acc)]/90 pt-2 ">
              Ideal para empezar con la app.
            </div>
          </button>

          {/* Scheduled Window */}
          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({
                ...config,
                dispatchLevel: "scheduled_window",
              })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.dispatchLevel === "scheduled_window"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 text-[var(--acc)]" />
                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-bold">
                  Ventana Horaria
                </span>
              </div>
              <div>
                <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                  Envío en horario comercial
                </h5>
                <p className="text-xs text-[var(--ink-2)] font-sans mt-1 leading-snug">
                  El agente prepara la respuesta y avisa. Si en 3
                  horas no la cancelas, el sistema la envía
                  automáticamente dentro de las horas configuradas.
                </p>
              </div>
            </div>
            <div className="text-micro font-sans font-semibold text-[var(--ink-2)]/90 pt-2 ">
              Agiliza respuestas sin bloquear.
            </div>
          </button>

          {/* Autonomous First Contact */}
          <button
            type="button"
            disabled={!isAdmin}
            onClick={() =>
              setConfig({
                ...config,
                dispatchLevel: "autonomous_first_contact",
              })
            }
            className={`p-4 rounded-[var(--r-m)] text-left transition-ui flex flex-col justify-between gap-3 ${
              !isAdmin
                ? "opacity-80 cursor-default"
                : "cursor-pointer"
            } ${
              config.dispatchLevel === "autonomous_first_contact"
                ? "bg-[var(--acc)]/20 text-[var(--ink)] ring-1 ring-[var(--acc)]/50"
                : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Bot className="w-5 h-5 text-[var(--acc)]" />
                <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--ok)]/20 text-[var(--ink)] font-bold">
                  Autónomo inicial
                </span>
              </div>
              <div>
                <h5 className="text-sm font-bold font-display text-[var(--ink)]">
                  Pitch inicial automático
                </h5>
                <p className="text-xs text-[var(--ink-2)] font-sans mt-1 leading-snug">
                  El primer contacto de presentación (Scout) se envía
                  directamente a salas compatibles. Las respuestas
                  posteriores pasan a borrador.
                </p>
              </div>
            </div>
            <div className="text-micro font-sans font-semibold text-[var(--ok)]/90 pt-2 ">
              Máxima velocidad de prospección.
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

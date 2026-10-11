/**
 * Checklist de arranque que solo se muestra mientras falte algo por configurar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Check, CheckCircle2 } from "lucide-react";
import { useAgentAutonomy } from "./AgentAutonomyContext";

/**
 * Checklist de arranque que solo se muestra mientras falte algo por configurar.
 * @returns Sección de interfaz.
 */
export function StartupChecklistCard() {
  const { emailAccountConnected, startupChecklist, setActiveTab } = useAgentAutonomy();
  return (
    <>
      {/* Checklist de arranque: solo se muestra mientras falte algo por hacer - una vez
 todo listo desaparece sola, para no molestar a un mánager que ya lo configuró
 todo. Las tres señales se comprueban de verdad (ver startupChecklist arriba),
 no son un adorno - por eso solo hay tres y no más: cualquier señal que no se
 pudiera verificar con fiabilidad (como los Hilos de Ejemplo) se dejó fuera en
 vez de fingir que se comprueba. */}
      {!emailAccountConnected ||
      !startupChecklist.toneTrained ||
      !startupChecklist.templateCustomized ? (
        <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--ok)]/10 space-y-2.5">
          <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--ok)]" /> Lo
            mínimo para que el Redactor escriba bien
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("email_dispatch")}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
            >
              <span
                className={`text-xs font-sans flex items-center gap-1.5 ${emailAccountConnected ? "text-[var(--ink-2)] line-through" : "text-[var(--ink-2)]"}`}
              >
                {emailAccountConnected ? (
                  <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-[var(--r-pill)] shrink-0" />
                )}
                Conectar el buzón de la banda
              </span>
              {!emailAccountConnected && (
                <span className="text-micro text-[var(--ok)] group-hover:underline shrink-0">
                  Ir ➔
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tone")}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
            >
              <span
                className={`text-xs font-sans flex items-center gap-1.5 ${startupChecklist.toneTrained ? "text-[var(--ink-2)] line-through" : "text-[var(--ink-2)]"}`}
              >
                {startupChecklist.toneTrained ? (
                  <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-[var(--r-pill)] shrink-0" />
                )}
                Entrenar el ADN de voz de la banda
              </span>
              {!startupChecklist.toneTrained && (
                <span className="text-micro text-[var(--ok)] group-hover:underline shrink-0">
                  Ir ➔
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tone")}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
            >
              <span
                className={`text-xs font-sans flex items-center gap-1.5 ${startupChecklist.templateCustomized ? "text-[var(--ink-2)] line-through" : "text-[var(--ink-2)]"}`}
              >
                {startupChecklist.templateCustomized ? (
                  <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-[var(--r-pill)] shrink-0" />
                )}
                Personalizar al menos una plantilla de categoría
              </span>
              {!startupChecklist.templateCustomized && (
                <span className="text-micro text-[var(--ok)] group-hover:underline shrink-0">
                  Ir ➔
                </span>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

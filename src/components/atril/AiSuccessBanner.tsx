/**
 * Aviso de éxito de las acciones de IA.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Sparkles } from "lucide-react";
import { useAtril } from "./AtrilContext";

/**
 * Aviso de éxito de las acciones de IA.
 * @returns Sección de interfaz.
 */
export function AiSuccessBanner() {
  const { aiSuccessMsg, setAiSuccessMsg } = useAtril();
  return (
    <>
      {aiSuccessMsg && (
        <div
          className={` px-4 py-2 text-xs font-sans flex items-center justify-between animate-in fade-in ${
            aiSuccessMsg.startsWith("⚠️")
              ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
              : "bg-[var(--ok-soft)]/40 text-[var(--ink-2)]"
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles
              className={`w-4 h-4 shrink-0 ${aiSuccessMsg.startsWith("⚠️") ? "text-[var(--acc)]" : "text-[var(--ok)]"}`}
            />
            {aiSuccessMsg}
          </span>
          <button
            onClick={() => setAiSuccessMsg(null)}
            className={
              aiSuccessMsg.startsWith("⚠️")
                ? "text-[var(--acc)] hover:text-[var(--ink)]"
                : "text-[var(--ok)] hover:text-[var(--ink)]"
            }
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Indicador de que el asistente está escribiendo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Guitar, RefreshCw } from "lucide-react";
import { useChat } from "./ChatContext";

/**
 * Indicador de que el asistente está escribiendo.
 * @returns Sección de interfaz.
 */
export function ChatLoadingIndicator() {
  const { isLoading } = useChat();
  return (
    <>
      {isLoading && (
        <div className="flex gap-3 max-w-[80%] self-start">
          <div
            className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center ${'bg-[var(--tentative)]/5 text-[var(--tentative)]'}`}
          >
            <Guitar className="w-3.5 h-3.5" />
          </div>
          <div
            className={`p-3.5 rounded-[var(--r-m)] rounded-tl-none text-xs font-sans flex items-center gap-2 ${'bg-[var(--surface)] text-[var(--ink-2)]'}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 animate-spin ${'text-[var(--tentative)]'}`} /> Analizando base de datos Supabase…
          </div>
        </div>
      )}
    </>
  );
}

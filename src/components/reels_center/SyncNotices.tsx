/**
 * Avisos de éxito o error de la sincronización de reels.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useReelsCenter } from "./ReelsCenterContext";

/**
 * Avisos de éxito o error de la sincronización de reels.
 * @returns Sección de interfaz.
 */
export function SyncNotices() {
  const { syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage } = useReelsCenter();
  return (
    <>
      {/* Notificaciones de Sincronización */}
      {syncSuccessMessage && (
      <div
      className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 bg-[var(--ok)]/10 text-[var(--ok)]`}
      >
      <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
      <span className="flex-1 font-sans text-micro">
        {syncSuccessMessage}
      </span>
      <button
        onClick={() => setSyncSuccessMessage("")}
        className="text-micro hover:opacity-80 font-bold px-1 font-sans"
      >
        ×
      </button>
      </div>
      )}
      {syncErrorMessage && (
      <div
      className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 bg-[var(--alert)]/10 text-[var(--alert)]`}
      >
      <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
      <span className="flex-1 font-sans text-micro">
        {syncErrorMessage}
      </span>
      <button
        onClick={() => setSyncErrorMessage("")}
        className="text-micro hover:opacity-80 font-bold px-1 font-sans"
      >
        ×
      </button>
      </div>
      )}
    </>
  );
}

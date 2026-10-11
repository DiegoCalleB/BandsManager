/**
 * Avisos de éxito o error de la sincronización de conciertos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, CheckSquare } from "lucide-react";
import { useCalendar } from "../CalendarContext";

/**
 * Avisos de éxito o error de la sincronización de conciertos.
 * @returns Sección de interfaz.
 */
export function CalendarSyncNotices() {
  const { syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage } = useCalendar();
  return (
    <>
      {/* Sync Notifications */}
      {syncSuccessMessage && (
        <div className="mb-4 p-2 px-3 rounded-[var(--r-s)] text-micro flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 bg-[var(--surface)]/15 text-[var(--ok)]">
          <CheckSquare className="w-4 h-4 text-[var(--ok)] shrink-0" />
          <span className="flex-1 font-sans text-micro">{syncSuccessMessage}</span>
          <button onClick={() => setSyncSuccessMessage('')} className="text-micro hover:opacity-80 font-bold px-1 font-sans">
            ×
          </button>
        </div>
      )}
      {syncErrorMessage && (
        <div
          className={`mb-4 p-2 px-3 rounded-[var(--r-s)] text-micro flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${'bg-[var(--alert)]/15 text-[var(--ink)]'}`}
        >
          <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
          <span className="flex-1 font-sans text-micro">{syncErrorMessage}</span>
          <button onClick={() => setSyncErrorMessage('')} className="text-micro hover:opacity-80 font-bold px-1 font-sans">
            ×
          </button>
        </div>
      )}
    </>
  );
}

/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShieldCheck } from "lucide-react";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function ClosingChecklistTab() {
  const { getCurrentRoadbook, selectedDateKey, selectedConcert, handleToggleCierreItem, setModalActiveTab, setShowEventFichaModal } = useCalendar();
  return (
    <>
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-micro">
        {(() => {
          const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
          const items = currentRb.cierreMaterial || [];
          const checkedCount = items.filter((i) => i.checked).length;
          const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[var(--acc)] text-micro flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 5. Cierre Material ({checkedCount}/{items.length})
                </span>
                <span
                  className={`text-micro font-mono font-bold px-1.5 py-0.5 rounded ${progress === 100 ? 'bg-[var(--ok)]/20 text-[var(--ink)]' : 'bg-[var(--acc)]/20 text-[var(--ink)]'}`}
                >
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-[var(--sunken)] rounded-[var(--r-pill)] h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-ui duration-300 ${progress === 100 ? 'bg-[var(--ok)]' : 'bg-[var(--acc)]'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCierreItem(item.id, selectedDateKey)}
                    className={`p-1.5 rounded flex items-center gap-2 cursor-pointer transition-colors ${
                      item.checked
                        ? 'bg-[var(--ok-soft)]/70 text-[var(--ink-2)] line-through'
                        : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sunken)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {}}
                      className="rounded text-[var(--acc)] h-3 w-3 cursor-pointer"
                    />
                    <span className="flex-1 truncate text-micro">{item.item}</span>
                    <span className="text-micro font-mono px-1 rounded bg-[var(--sunken)] text-[var(--ink-2)] shrink-0">
                      {item.categoria}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalActiveTab('cierre');
                  setShowEventFichaModal(true);
                }}
                className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-micro font-mono font-bold bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Checklist cierre completo</span>
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );
}

/**
 * Selector de eventos cuando el día tiene más de uno.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useCalendar } from "../CalendarContext";

/**
 * Selector de eventos cuando el día tiene más de uno.
 * @returns Sección de interfaz.
 */
export function DayEventSelector() {
  const { hasMultipleDayEvents, dayEventsList, activeDayEventId, setSelectedEventId } = useCalendar();
  return (
    <>
      {/* Selector de eventos si el día tiene más de uno */}
      {hasMultipleDayEvents && (
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 pb-1 mb-2">
          <span className="text-micro font-sans text-[var(--ink-2)] shrink-0 mr-1">Ver evento:</span>
          {dayEventsList.map((evt) => {
            const isActive = evt.id === activeDayEventId;
            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedEventId(evt.id)}
                className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-sans font-bold transition-ui cursor-pointer shrink-0 ${
                  isActive
                    ? evt.kind === 'concert'
                      ? 'bg-[var(--acc)]text-[var(--ink)]'
                      : 'bg-[var(--ok)]text-[var(--ink)]'
                    : 'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70'
                }`}
              >
                {evt.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Selector entre varios eventos del mismo día.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useCalendar } from "../CalendarContext";

/**
 * Selector entre varios eventos del mismo día.
 * @returns Sección de interfaz.
 */
export function MultiDayEventSelector() {
  const { hasMultipleDayEvents, dayEventsList, activeDayEventId, setSelectedEventId } = useCalendar();
  return (
    <>
      {/* Selector de eventos: cuando el día tiene más de uno (2 conciertos, o concierto + ensayo),
 el panel de arriba solo muestra uno a la vez. Estos chips dejan entrar a cada uno. */}
      {hasMultipleDayEvents && (
        <div className="flex flex-wrap gap-1.5 mb-4 -mt-2">
          {dayEventsList.map((evt) => {
            const isActive = evt.id === activeDayEventId;
            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => setSelectedEventId(evt.id)}
                className={`px-2 py-1 rounded-[var(--r-pill)] text-micro font-mono font-bold transition-colors cursor-pointer ${
                  isActive
                    ? evt.kind === 'concert'
                      ? 'bg-[var(--acc)]/30 text-[var(--ink)]'
                      : 'bg-[var(--ok)]/30 text-[var(--ink)]'
                    : 'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
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

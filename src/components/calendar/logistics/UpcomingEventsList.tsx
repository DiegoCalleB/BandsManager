/**
 * Atajo GPS y lista de próximos eventos con filtros.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MapPin } from "lucide-react";
import DirectionsCard from "../../DirectionsCard";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useCalendar } from "../CalendarContext";
import { isStitchLight } from "../calendarTheme";

/** Filtros de la lista de próximos eventos. */
const FILTROS: { id: ReturnType<typeof useCalendar>['upcomingFilter']; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'conciertos', label: 'Bolos' },
  { id: 'campañas', label: 'Campañas' },
];

/**
 * Atajo GPS y lista de próximos eventos con filtros.
 * @returns Sección de interfaz.
 */
export function UpcomingEventsList() {
  const { upcomingCalendarEvents, upcomingFilter, setUpcomingFilter, textMuted, setSelectedDate, setViewDate, textSub } = useCalendar();
  return (
    <>
      <div
        className={`w-full text-left mt-4 pt-3 space-y-2.5 ${'border-t border-[var(--hair)]'}`}
      >
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Próximas Fechas ({upcomingCalendarEvents.length})</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1">
            {FILTROS.map((f) => (
              <Button
                variant={upcomingFilter === f.id ? "selected" : "ghost"}
                size="xs"
                key={f.id}
                onClick={() => setUpcomingFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {upcomingCalendarEvents.filter((evt) => {
            if (upcomingFilter === 'conciertos') return evt.type === 'concierto';
            if (upcomingFilter === 'ensayos') return evt.type === 'ensayo';
            if (upcomingFilter === 'campañas') return evt.type === 'campaña';
            return true;
          }).length === 0 ? (
            <p className={`text-micro italic text-center py-4 ${textMuted}`}>Ninguna fecha con ese filtro.</p>
          ) : (
            upcomingCalendarEvents
              .filter((evt) => {
                if (upcomingFilter === 'conciertos') return evt.type === 'concierto';
                if (upcomingFilter === 'ensayos') return evt.type === 'ensayo';
                if (upcomingFilter === 'campañas') return evt.type === 'campaña';
                return true;
              })
              .map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => {
                    if (evt.fecha) {
                      const p = evt.fecha.split('-');
                      if (p.length === 3) {
                        setSelectedDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
                        setViewDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, 1));
                      }
                    }
                  }}
                  className="p-2.5 rounded-[var(--r-m)] flex items-start gap-3 transition-ui cursor-pointer bg-[var(--sunken)] hover:bg-[var(--hair)]"
                >
                  {/* Insignia de calendario: día arriba, mes abajo */}
                  <div className="w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 bg-[var(--surface)]">
                    <span className="text-base font-bold leading-none tabular-nums text-[var(--ink)]">{evt.day}</span>
                    <span className="text-micro font-semibold mt-0.5 text-[var(--acc-ink)]">{evt.month}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-semibold capitalize ${
                          evt.type === 'ensayo'
                            ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                            : 'bg-[var(--acc-soft)] text-[var(--acc-ink)]'
                        }`}
                      >
                        {evt.type === 'campaña' ? 'Posible bolo' : evt.type}
                      </span>
                      {evt.bandName && (
                        <span
                          className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] font-semibold bg-[var(--surface)] text-[var(--ink-2)] truncate max-w-[110px]"
                          title={evt.bandName}
                        >
                          {evt.bandName}
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-[var(--ink)] mt-1 line-clamp-2">{evt.title}</div>
                    {evt.direccion && <p className={`text-micro font-sans ${textSub} mt-0.5`}><ShowIcon inline emoji="📍" />{evt.direccion}</p>}
                    {evt.type !== 'campaña' ? (
                      <div className="mt-1 flex justify-center">
                        <DirectionsCard
                          query={evt.locationQuery}
                          locationName={evt.salaOrLugar}
                          address={evt.direccion || evt.ciudad}
                          isStitchLight={isStitchLight}
                        />
                      </div>
                    ) : (
                      <p className="text-micro text-[var(--ink-2)] mt-0.5 line-clamp-2">{evt.salaOrLugar}</p>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Tarjeta de la agenda del día seleccionado con el detalle del evento activo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useCalendar } from "../CalendarContext";
import { ConcertDetailCard } from "./ConcertDetailCard";
import { DayAgendaHeader } from "./DayAgendaHeader";
import { DayEventSelector } from "./DayEventSelector";
import { RehearsalDetailCard } from "./RehearsalDetailCard";

/**
 * Tarjeta de la agenda del día seleccionado con el detalle del evento activo.
 * @returns Sección de interfaz.
 */
export function SelectedDayAgenda() {
  const { dayEventsList } = useCalendar();
  return (
    <>
      <div
        id="calendar-selected-day-banner"
        className="mt-3.5 p-3 sm:p-4 rounded-[var(--r-l)] transition-ui duration-200 bg-[var(--sunken)]/60 border border-[var(--hair)]/40"
      >
        <DayAgendaHeader />

        {/* Contenido de eventos del día */}
        {dayEventsList.length > 0 && (
          <div className="mt-3 space-y-2.5">
            <DayEventSelector />

            <ConcertDetailCard />

            <RehearsalDetailCard />
          </div>
        )}
      </div>
    </>
  );
}

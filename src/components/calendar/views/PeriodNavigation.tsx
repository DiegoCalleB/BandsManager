/**
 * Botones de mes anterior/siguiente/hoy y título del periodo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui";
import { useCalendar } from "../CalendarContext";

/**
 * Botones de mes anterior/siguiente/hoy y título del periodo.
 * @returns Sección de interfaz.
 */
export function PeriodNavigation() {
  const { handlePrevMonth, handleNextMonth, handleGoToday, textTitle, calendarViewMode, monthNames, currentMonth, nextMonth, currentYear, nextMonthYear, getWeekDays, selectedDate } = useCalendar();
  return (
    <>
      {/* Left: Navigation Buttons + Month/Period Title (Rock-solid, never jumps) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="neutral"
            size="xs"
            onClick={handlePrevMonth}
            title="Meses anteriores (o desliza a la derecha)"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="xs"
            onClick={handleNextMonth}
            title="Meses siguientes (o desliza a la izquierda)"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="neutral"
            size="xs"
            onClick={handleGoToday}
            className="shrink-0"
            title="Ir al mes y día actual"
          >
            Hoy
          </Button>
        </div>

        <h2 className={`text-base sm:text-lg lg:text-xl font-bold font-display truncate min-w-0 ${textTitle}`}>
          {calendarViewMode === '2m' ? (
            <>
              {monthNames[currentMonth]} - {monthNames[nextMonth]}{' '}
              <span className="text-[var(--ink-2)] font-sans text-base">
                {currentYear === nextMonthYear ? currentYear : `${currentYear}/${nextMonthYear}`}
              </span>
            </>
          ) : calendarViewMode === 'week' ? (
            (() => {
              const week = getWeekDays(selectedDate);
              const first = week[0];
              const last = week[6];
              return (
                <>
                  Semana {first.getDate()} {monthNames[first.getMonth()].slice(0, 3)} - {last.getDate()}{' '}
                  {monthNames[last.getMonth()].slice(0, 3)}{' '}
                  <span className="text-[var(--ink-2)] font-sans text-base">{last.getFullYear()}</span>
                </>
              );
            })()
          ) : calendarViewMode === 'agenda' ? (
            <>
              Agenda{' '}
              <span className="text-[var(--ink-2)] font-sans text-base">
                {monthNames[currentMonth]} {currentYear}
              </span>
            </>
          ) : (
            <>
              {monthNames[currentMonth]} <span className="text-[var(--ink-2)] font-sans text-base">{currentYear}</span>
            </>
          )}
        </h2>
      </div>
    </>
  );
}

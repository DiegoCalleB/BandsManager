/**
 * Maqueta del calendario: rejilla mensual, agenda del día, barra lateral y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { CalendarConflictsBanner } from "../CalendarConflictsBanner";
import { useCalendar } from "../CalendarContext";
import { CalendarLegend } from "./CalendarLegend";
import { CalendarOverlays } from "./CalendarOverlays";
import { CalendarSearchBar } from "./CalendarSearchBar";
import { CalendarSyncNotices } from "./CalendarSyncNotices";
import { CalendarTitleBar } from "./CalendarTitleBar";
import { MonthGrids } from "./MonthGrids";
import { MonthNavigationBar } from "./MonthNavigationBar";
import { SelectedDayAgenda } from "./SelectedDayAgenda";

/**
 * Maqueta del calendario: rejilla mensual, agenda del día, barra lateral y modales.
 * @returns Sección de interfaz.
 */
export function CalendarLayout() {
  const { calendarContainerRef, isCalendarFullscreen, colors, choquesCalendario, setSelectedDate } = useCalendar();
  return (
    <>
      <div
      ref={calendarContainerRef}
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${'text-[var(--ink)] bg-[var(--sunken)]'} font-sans items-stretch w-full max-w-full overflow-x-clip ${
      isCalendarFullscreen ? 'fixed inset-0 z-[9999] p-4 sm:p-6 overflow-y-auto' : ''
      }`}
    >
      {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
      <div className={`${colors.card} p-6 flex flex-col justify-between lg:col-span-2`}>
      <div className="max-lg:contents">
        {/* Header */}
        <CalendarTitleBar />

        <CalendarSearchBar />

        {/* Month Navigation & Band Selector */}
        <MonthNavigationBar />
      </div>

      <CalendarSyncNotices />

      <CalendarConflictsBanner
        choques={choquesCalendario}
        onSelectDate={(fecha) => {
          const [y, m, d] = fecha.split('-').map(Number);
          if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
        }}
      />

      <MonthGrids />

      {/* SELECTED DAY AGENDA CARD - Inmediatamente visible bajo el calendario */}
      <SelectedDayAgenda />

      <CalendarLegend />
      </div>

      <CalendarOverlays />
    </div>
    </>
  );
}

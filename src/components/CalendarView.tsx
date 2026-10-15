/**
 * Calendario de la banda: conciertos, ensayos y reuniones con agenda, ficha y logística.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `calendar/` (AGENTS.md §5.6).
 */
import { CalendarProvider } from './calendar/CalendarProvider';
import { getDetailedDateInfo, type CalendarViewProps } from './calendar/calendarTypes';
import { useCalendarController } from './calendar/hooks/useCalendarController';
import { CalendarLayout } from './calendar/views/CalendarLayout';

// Re-export histórico: otros módulos importan `getDetailedDateInfo` desde la pantalla.
// eslint-disable-next-line react-refresh/only-export-components
export { getDetailedDateInfo };

/**
 * Pantalla "Calendario" de la banda activa.
 * @param props Eventos, callbacks de persistencia y contexto de banda/usuario.
 * @returns La pantalla completa con su contexto.
 */
export default function CalendarView({
  campaigns = [],
  activeCampaign = null,
  currentBandId = '',
  currentBandName = '',
  currentBandLogo = '',
  availableBands = [],
  bandUsers = [],
  isPromoPlan: isPromoPlanProp,
  ...props
}: CalendarViewProps) {
  const controller = useCalendarController({
    isPromoPlanProp,
    currentUser: props.currentUser,
    availableBands,
    currentBandId,
    currentBandName,
    currentBandLogo,
    concerts: props.concerts,
    rehearsals: props.rehearsals,
    bandUsers,
    campaigns,
    initialSelectedDate: props.initialSelectedDate,
    initialSelectedEventId: props.initialSelectedEventId,
    onDeleteConcert: props.onDeleteConcert,
    onDeleteRehearsal: props.onDeleteRehearsal,
    onShowNotification: props.onShowNotification,
  });

  return (
    <CalendarProvider
      value={{
        ...controller,
        ...props,
        campaigns,
        activeCampaign,
        currentBandId,
        currentBandName,
        currentBandLogo,
        availableBands,
        bandUsers,
        isPromoPlan: controller.isPromoPlan,
      }}
    >
      <CalendarLayout />
    </CalendarProvider>
  );
}

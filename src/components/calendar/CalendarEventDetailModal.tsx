/**
 * Ficha emergente de un evento del calendario (concierto o ensayo): resumen, logística, contactos,
 * merchandising, post-show y checklist de cierre. Orquesta controlador, contexto y maqueta; la lógica
 * vive en `event_detail/` (AGENTS.md §5.6).
 */
import type { Concert, Rehearsal, KeyContactItem, MerchBoloItem, MerchControlBolo, Setlist, Song } from '../../types';
import type { BandIdentity, ChronologicalEvent, RoadbookInfo } from './calendarTypes';
import type { WeatherAlert } from '../../services/weatherService';
import { useEventDetailController } from './event_detail/hooks/useEventDetailController';
import { EventDetailProvider } from './event_detail/EventDetailProvider';
import { EventDetailLayout } from './event_detail/EventDetailLayout';

export interface CalendarEventDetailModalProps {
  showEventFichaModal: boolean;
  setShowEventFichaModal: (show: boolean) => void;
  selectedConcert: Concert | null;
  selectedRehearsal: Rehearsal | null;
  allChronologicalEvents: ChronologicalEvent[];
  currentEventIndex: number;
  handleNavigateChronologicalEvent: (direction: 'prev' | 'next') => void;
  activeBandId?: string;
  currentBandId?: string;
  getBandIdentity: (bandId?: string, fallbackName?: string) => BandIdentity;
  isStitchLight?: boolean;
  isPromoPlan?: boolean;
  modalActiveTab: 'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre';
  setModalActiveTab: (tab: 'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre') => void;
  selectedDateKey: string;
  allRoadbooks: Record<string, RoadbookInfo>;
  getCurrentRoadbook: (dateKey: string, concert?: Concert | null) => RoadbookInfo;
  updateRoadbookField: (dateKey: string, partial: Partial<RoadbookInfo>) => void;
  getDefaultRoadbook: (concert?: Concert | null) => RoadbookInfo;
  handleToggleCierreItem: (itemId: string, dateKey: string) => void;
  handleToggleAllCierreItems: (dateKey: string, checkAll: boolean) => void;
  handleAddCierreItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteCierreItem: (itemId: string, dateKey: string) => void;
  handleAddKeyContact: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteKeyContact: (contactId: string, dateKey: string) => void;
  openWhatsAppContact: (contact: KeyContactItem, dateStr: string, venueName: string) => void;
  handleUpdateMerchItem: (dateKey: string, itemId: string, updates: Partial<MerchBoloItem>) => void;
  handleAddMerchItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteMerchItem: (dateKey: string, itemId: string) => void;
  handleUpdateMerchTotals: (dateKey: string, updates: Partial<MerchControlBolo>) => void;
  handleCopyMerchSummary: (roadbook: RoadbookInfo, dateKey: string, concert?: Concert | null) => void;
  setViewingConcert?: (concert: Concert | null) => void;
  setViewingRehearsal?: (rehearsal: Rehearsal | null) => void;
  setShowReminderModal: (show: boolean) => void;
  handleDeleteEventFromModal: (eventId: string, isConcert: boolean) => void;
  deletingEventConfirmId: string | null;
  setDeletingEventConfirmId: (id: string | null) => void;
  newContactNombre: string;
  setNewContactNombre: (val: string) => void;
  newContactRol: string;
  setNewContactRol: (val: string) => void;
  newContactEmail: string;
  setNewContactEmail: (val: string) => void;
  newMerchNombre: string;
  setNewMerchNombre: (val: string) => void;
  newMerchTalla: string;
  setNewMerchTalla: (val: string) => void;
  newMerchPrecio: number;
  setNewMerchPrecio: (val: number) => void;
  setlists: Setlist[];
  songs: Song[];
  activeTutorial: string | null;
  setActiveTutorial: (tut: string | null) => void;
  handleOpenDirectoEscenarioFromModal: (dateKey: string) => void;
  modalWeatherAlerts?: WeatherAlert[];
  handleShareEventWhatsApp?: (event: Concert | Rehearsal, isConcert: boolean) => void;
  handleNotifyBandMembers?: (event: Concert | Rehearsal, isConcert: boolean) => void;
  handleCopyEventFicha?: (event: Concert | Rehearsal, isConcert: boolean) => void;
}

/**
 * Ficha de evento del calendario; no renderiza nada mientras está cerrada.
 * @param props Evento seleccionado, hoja de ruta, merchandising y callbacks de la pantalla de calendario.
 * @returns La ficha con su contexto o `null` si está cerrada.
 */
export const CalendarEventDetailModal: React.FC<CalendarEventDetailModalProps> = (props) => {
  const controller = useEventDetailController({
    modalWeatherAlerts: props.modalWeatherAlerts ?? [],
    currentEventIndex: props.currentEventIndex,
    handleNavigateChronologicalEvent: props.handleNavigateChronologicalEvent,
    selectedConcert: props.selectedConcert,
    selectedRehearsal: props.selectedRehearsal,
    selectedDateKey: props.selectedDateKey,
    getBandIdentity: props.getBandIdentity,
    allChronologicalEvents: props.allChronologicalEvents,
    deletingEventConfirmId: props.deletingEventConfirmId,
    getCurrentRoadbook: props.getCurrentRoadbook,
  });

  if (!props.showEventFichaModal) return null;

  return (
    <EventDetailProvider value={{ ...controller, ...props }}>
      <EventDetailLayout />
    </EventDetailProvider>
  );
};

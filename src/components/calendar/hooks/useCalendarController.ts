/**
 * Compone todos los hooks del calendario y expone el estado y los handlers que consumen las vistas.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { useModuleTutorial } from "../../../hooks/useModuleTutorial";
import { BookingCampaign, Concert, Rehearsal } from "../../../types";
import { normalizePlan } from "../../../utils/planPermissions";
import type { CalendarBand, CalendarUser, CalendarViewProps } from "../calendarTypes";
import { useBandMembers } from "./useBandMembers";
import { useCalendarBands } from "./useCalendarBands";
import { useCalendarDates } from "./useCalendarDates";
import { useCalendarFeed } from "./useCalendarFeed";
import { useCalendarFilters } from "./useCalendarFilters";
import { useCalendarFullscreen } from "./useCalendarFullscreen";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { useCalendarViewPrefs } from "./useCalendarViewPrefs";
import { useConcertSyncMessages } from "./useConcertSyncMessages";
import { useCreateEventForm } from "./useCreateEventForm";
import { useEventFicha } from "./useEventFicha";
import { useEventInlineEdit } from "./useEventInlineEdit";
import { useEventReminder } from "./useEventReminder";
import { useEventShareActions } from "./useEventShareActions";
import { useRunOfShowAndGear } from "./useRunOfShowAndGear";
import { useSelectedEventDetails } from "./useSelectedEventDetails";
import { useUpcomingEvents } from "./useUpcomingEvents";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface CalendarControllerParams {
  isPromoPlanProp: boolean;
  currentUser?: CalendarUser;
  availableBands: CalendarBand[];
  currentBandId: string;
  currentBandName: string;
  currentBandLogo: string;
  concerts: Concert[];
  rehearsals: Rehearsal[];
  bandUsers: { id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string; }[];
  campaigns: BookingCampaign[];
  initialSelectedDate: string;
  initialSelectedEventId: string;
  onDeleteConcert: CalendarViewProps["onDeleteConcert"];
  onDeleteRehearsal: CalendarViewProps["onDeleteRehearsal"];
  onShowNotification: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Compone todos los hooks del calendario y expone el estado y los handlers que consumen las vistas.
 * @param params Estado y callbacks del contenedor ({@link CalendarControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCalendarController({ isPromoPlanProp, currentUser, availableBands, currentBandId, currentBandName, currentBandLogo, concerts, rehearsals, bandUsers, campaigns, initialSelectedDate, initialSelectedEventId, onDeleteConcert, onDeleteRehearsal, onShowNotification }: CalendarControllerParams) {
  const isPromoPlan =
    isPromoPlanProp ??
    (normalizePlan(currentUser?.plan) === 'promo' ||
      Boolean(
        availableBands.find(
          (b) => (b.band_id === currentBandId || b.id === currentBandId) && normalizePlan(b.plan) === 'promo'
        )
      ));

  const { openTutorial } = useModuleTutorial('calendario');

  const realToday = new Date();

  const [viewDate, setViewDate] = useState<Date>(() => new Date(realToday.getFullYear(), realToday.getMonth(), 1));

  const [selectedDate, setSelectedDate] = useState<Date>(() => realToday);

  // Cuando un día tiene varios eventos (2 conciertos, o concierto + ensayo), este id dice cuál se
  // ve en el panel de detalle. Sin esto, el panel siempre mostraba el primero del array y el resto
  // era invisible salvo el pequeño acceso directo de"editar ficha" en las chapas del día.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [copiedQrId, setCopiedQrId] = useState<string | null>(null);

  const [, setCopiedEventModalId] = useState<string | null>(null);

  const [deletingEventConfirmId, setDeletingEventConfirmId] = useState<string | null>(null);

  // Convocatoria form state
  const [, setConvocatoriaTipo] = useState<'completa' | 'parcial'>('completa');

  const [, setConvocadosIds] = useState<string[]>([]);

  const { activeBandId, effectiveBandsList, filterBandMode, isSameBandId, getEventBandName, activeBandName, getBandIdentity, isMultiBandUser, setFilterBandMode } = useCalendarBands({ currentBandId, currentBandName, currentBandLogo, availableBands, concerts, rehearsals, currentUser });

  const { matchesConvocatoria, setSelectedBandIdForNewEvent, effectiveBandMembers } = useBandMembers({ activeBandId, currentUser, bandUsers });

  const { setShowSyncModal, showMobileSearch, setShowMobileSearch, setShowCalMoreMenu, showCalMoreMenu, showSyncModal, host, webCalFeed, rutaFeed } = useCalendarFeed({ effectiveBandsList, activeBandId });

  const { calendarViewMode, viewConfigRef, setCalendarViewMode, setTwoMonthsMode, devicePrefs, currentDeviceType, setShowViewConfigPopover, showViewConfigPopover, setSelectedConfigDevice, selectedConfigDevice, isSavingPref, handleSetDefaultMonthsForDevice, configToast } = useCalendarViewPrefs({ currentUser });

  const { todayStr, monthNames, selectedDateKey, currentMonth, nextMonth, currentYear, nextMonthYear, getWeekDays, getCampaignsForDate } = useCalendarDates({ viewDate, campaigns, selectedDate });

  const { filteredConcerts, filteredRehearsals, calendarSearchTerm, setCalendarSearchTerm, activeBandConcerts, activeBandRehearsals, choquesCalendario, diasConChoque } = useCalendarFilters({ concerts, filterBandMode, isSameBandId, activeBandId, matchesConvocatoria, getEventBandName, rehearsals, initialSelectedDate, setSelectedDate, setViewDate, initialSelectedEventId, setSelectedEventId });

  const { setShowCreateModal, availableSetlists, setShowAddEventDropdown, showAddEventDropdown, setConcIsPosible, setModalActiveTab, setConcCiudad, setConcAforo, setConcNotas, activeTab, setActiveTab, showCreateModal, modalActiveTab, availableSongs } = useCreateEventForm({ setSelectedBandIdForNewEvent, activeBandId, setConvocatoriaTipo, setConvocadosIds, effectiveBandMembers });

  const { calendarContainerRef, isCalendarFullscreen, toggleCalendarFullscreen, setActiveStageInitialMode, setActiveStageSetlist, activeStageSetlist, activeStageInitialMode } = useCalendarFullscreen();

  const { showEventFichaModal, setShowEventFichaModal, handleSelectEvent, allChronologicalEvents, activeChronoIndex, goToAdjacentEvent, modalWeatherAlerts } = useEventFicha({ filteredConcerts, filteredRehearsals, setSelectedDate, setSelectedEventId, selectedEventId });

  const { upcomingCalendarEvents, upcomingFilter, setUpcomingFilter } = useUpcomingEvents({ filteredConcerts, todayStr, monthNames, getEventBandName, filteredRehearsals, campaigns, activeBandName });

  const { handlePrevMonth, handleNextMonth, handleGoToday, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, slideDirection, dragOffset } = useCalendarNavigation({ calendarViewMode, setSelectedDate, setViewDate, selectedDate, viewDate });

  const { setSyncSuccessMessage, syncSuccessMessage, syncErrorMessage, setSyncErrorMessage } = useConcertSyncMessages();

  const { setViewingConcert, setViewingRehearsal, viewingConcert, editDraft, setEditDraft, viewingRehearsal, editRehearsalDraft, setEditRehearsalDraft } = useEventInlineEdit();

  const { selectedConcert, selectedRehearsal, textTitle, textSub, textMuted, weekdays, getEventsForDateStr, dayEventsList, hasMultipleDayEvents, activeDayEventId, selectedEventDetails, selectedEventTitle, assignedSetlist, currentSetlistId } = useSelectedEventDetails({ filteredConcerts, filteredRehearsals, selectedDateKey, selectedEventId, availableSetlists });

  const { setShowReminderModal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, showReminderModal, reminderNotes, reminderSendPush, setReminderSendPush, reminderSendEmail, setReminderSendEmail, reminderSending, reminderSuccessMsg, reminderErrorMsg, handleSendEventReminder } = useEventReminder({ selectedConcert, selectedRehearsal, selectedDate, monthNames, effectiveBandMembers, currentUser, onShowNotification });

  const { currentRunOfShow, currentGear, handleToggleRunOfShow, handleAddRunOfShow, handleDeleteRunOfShow, handleToggleGear, handleAddGear, handleDeleteGear, newRunTime, setNewRunTime, newRunActivity, setNewRunActivity, newGearLabel, setNewGearLabel } = useRunOfShowAndGear({ showEventFichaModal, setSelectedEventId, initialSelectedEventId, filteredConcerts, selectedDateKey, filteredRehearsals, currentBandId });

  const { allRoadbooks, getDefaultRoadbook, getCurrentRoadbook, updateRoadbookField, handleToggleCierreItem, handleToggleAllCierreItems, handleAddCierreItem, handleDeleteCierreItem, newCierreItemText, setNewCierreItemText, newCierreItemCat, setNewCierreItemCat, showAddContactForm, setShowAddContactForm, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactTelefono, setNewContactTelefono, newContactEmail, setNewContactEmail, newContactNotas, setNewContactNotas, handleAddKeyContact, handleDeleteKeyContact, openWhatsAppContact, handleUpdateMerchItem, handleAddMerchItem, handleDeleteMerchItem, handleUpdateMerchTotals, handleCopyMerchSummary, showAddMerchForm, setShowAddMerchForm, newMerchNombre, setNewMerchNombre, newMerchCategoria, setNewMerchCategoria, newMerchTalla, setNewMerchTalla, newMerchPrecio, setNewMerchPrecio, newMerchStockInicial, setNewMerchStockInicial, merchCopiedToast, saveRoadbook, handleDeleteEventFromModal, handleShareEventWhatsApp, handleNotifyBandMembers, handleCopyEventFicha } = useEventShareActions({ selectedConcert, getBandIdentity, monthNames, isPromoPlan, setCopiedEventModalId, onShowNotification, setShowReminderModal, onDeleteConcert, onDeleteRehearsal, setDeletingEventConfirmId, setShowEventFichaModal, setSelectedEventId });

  return { selectedConcert, getBandIdentity, monthNames, isPromoPlan, setCopiedEventModalId, setShowReminderModal, setDeletingEventConfirmId, setShowEventFichaModal, setSelectedEventId, calendarContainerRef, isCalendarFullscreen, filteredConcerts, filteredRehearsals, openTutorial, setShowAddEventDropdown, showAddEventDropdown, setConcIsPosible, setShowCreateModal, setShowSyncModal, showMobileSearch, setShowMobileSearch, setShowCalMoreMenu, showCalMoreMenu, calendarSearchTerm, setCalendarSearchTerm, handlePrevMonth, handleNextMonth, handleGoToday, textTitle, calendarViewMode, currentMonth, nextMonth, currentYear, nextMonthYear, getWeekDays, selectedDate, viewConfigRef, setCalendarViewMode, setTwoMonthsMode, devicePrefs, currentDeviceType, setShowViewConfigPopover, showViewConfigPopover, toggleCalendarFullscreen, setSelectedConfigDevice, selectedConfigDevice, isSavingPref, handleSetDefaultMonthsForDevice, configToast, isMultiBandUser, filterBandMode, setFilterBandMode, activeBandName, activeBandConcerts, activeBandRehearsals, syncSuccessMessage, setSyncSuccessMessage, syncErrorMessage, setSyncErrorMessage, choquesCalendario, setSelectedDate, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, slideDirection, dragOffset, diasConChoque, viewDate, selectedEventId, handleSelectEvent, realToday, textSub, textMuted, weekdays, getEventsForDateStr, getCampaignsForDate, setModalActiveTab, setViewingConcert, setViewingRehearsal, dayEventsList, selectedRehearsal, hasMultipleDayEvents, activeDayEventId, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, selectedDateKey, selectedEventDetails, selectedEventTitle, activeBandId, getEventBandName, setConcCiudad, setConcAforo, setConcNotas, activeTab, setActiveTab, currentRunOfShow, currentGear, handleToggleRunOfShow, handleAddRunOfShow, handleDeleteRunOfShow, handleToggleGear, handleAddGear, handleDeleteGear, newRunTime, setNewRunTime, newRunActivity, setNewRunActivity, newGearLabel, setNewGearLabel, copiedQrId, setCopiedQrId, assignedSetlist, upcomingCalendarEvents, upcomingFilter, setUpcomingFilter, setViewDate, currentSetlistId, availableSetlists, setActiveStageInitialMode, setActiveStageSetlist, showCreateModal, effectiveBandsList, effectiveBandMembers, viewingConcert, editDraft, setEditDraft, viewingRehearsal, editRehearsalDraft, setEditRehearsalDraft, showSyncModal, host, webCalFeed, rutaFeed, showReminderModal, reminderNotes, reminderSendPush, setReminderSendPush, reminderSendEmail, setReminderSendEmail, reminderSending, reminderSuccessMsg, reminderErrorMsg, handleSendEventReminder, showEventFichaModal, allChronologicalEvents, activeChronoIndex, goToAdjacentEvent, modalActiveTab, deletingEventConfirmId, availableSongs, modalWeatherAlerts, activeStageSetlist, activeStageInitialMode, allRoadbooks, getDefaultRoadbook, getCurrentRoadbook, updateRoadbookField, handleToggleCierreItem, handleToggleAllCierreItems, handleAddCierreItem, handleDeleteCierreItem, newCierreItemText, setNewCierreItemText, newCierreItemCat, setNewCierreItemCat, showAddContactForm, setShowAddContactForm, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactTelefono, setNewContactTelefono, newContactEmail, setNewContactEmail, newContactNotas, setNewContactNotas, handleAddKeyContact, handleDeleteKeyContact, openWhatsAppContact, handleUpdateMerchItem, handleAddMerchItem, handleDeleteMerchItem, handleUpdateMerchTotals, handleCopyMerchSummary, showAddMerchForm, setShowAddMerchForm, newMerchNombre, setNewMerchNombre, newMerchCategoria, setNewMerchCategoria, newMerchTalla, setNewMerchTalla, newMerchPrecio, setNewMerchPrecio, newMerchStockInicial, setNewMerchStockInicial, merchCopiedToast, saveRoadbook, handleDeleteEventFromModal, handleShareEventWhatsApp, handleNotifyBandMembers, handleCopyEventFicha };
}

/**
 * Barra lateral de logística, modales de alta/edición/recordatorio/ficha y modo escenario.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import type { User } from "../../../types";
import { SetlistPerformanceView } from "../../SetlistPerformanceView";
import { useCalendar } from "../CalendarContext";
import { CalendarCreateEventModal } from "../CalendarCreateEventModal";
import { CalendarEditConcertModal } from "../CalendarEditConcertModal";
import { CalendarEditRehearsalModal } from "../CalendarEditRehearsalModal";
import { CalendarEventDetailModal } from "../CalendarEventDetailModal";
import { CalendarReminderModal } from "../CalendarReminderModal";
import { CalendarSyncModal } from "../CalendarSyncModal";
import { isStitchLight } from "../calendarTheme";
import { LogisticsSidebar } from "../logistics/LogisticsSidebar";

/**
 * Barra lateral de logística, modales de alta/edición/recordatorio/ficha y modo escenario.
 * @returns Sección de interfaz.
 */
export function CalendarOverlays() {
  const { selectedDate, selectedDateKey, selectedConcert, selectedRehearsal, monthNames, activeBandId, activeBandName, getBandIdentity, isPromoPlan, currentUser, setShowCreateModal, setShowEventFichaModal, setShowReminderModal, setViewingConcert, setViewingRehearsal, onDeleteConcert, onDeleteRehearsal, setReminderNotes, setModalActiveTab, allRoadbooks, getCurrentRoadbook, updateRoadbookField, getDefaultRoadbook, handleToggleCierreItem, handleToggleAllCierreItems, handleAddCierreItem, handleDeleteCierreItem, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactEmail, setNewContactEmail, handleAddKeyContact, handleDeleteKeyContact, openWhatsAppContact, handleUpdateMerchItem, handleAddMerchItem, handleDeleteMerchItem, handleUpdateMerchTotals, handleCopyMerchSummary, newMerchNombre, setNewMerchNombre, newMerchTalla, setNewMerchTalla, newMerchPrecio, setNewMerchPrecio, setSelectedDate, onUpdateConcert, onUpdateRehearsal, availableSetlists, setActiveStageSetlist, showCreateModal, effectiveBandsList, effectiveBandMembers, onAddRehearsal, onAddConcert, setSyncSuccessMessage, viewingConcert, editDraft, setEditDraft, viewingRehearsal, editRehearsalDraft, setEditRehearsalDraft, showSyncModal, setShowSyncModal, host, webCalFeed, rutaFeed, showReminderModal, reminderNotes, reminderSendPush, setReminderSendPush, reminderSendEmail, setReminderSendEmail, reminderSending, reminderSuccessMsg, reminderErrorMsg, handleSendEventReminder, showEventFichaModal, allChronologicalEvents, activeChronoIndex, goToAdjacentEvent, modalActiveTab, handleDeleteEventFromModal, deletingEventConfirmId, setDeletingEventConfirmId, availableSongs, modalWeatherAlerts, handleShareEventWhatsApp, handleNotifyBandMembers, handleCopyEventFicha, activeStageSetlist, activeStageInitialMode } = useCalendar();
  return (
    <>
      {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
      <LogisticsSidebar />

      {/* UNIFIED CREATE EVENT MODAL (Concierto | Ensayo | Reunión) */}
      <CalendarCreateEventModal
      showCreateModal={showCreateModal}
      setShowCreateModal={setShowCreateModal}
      selectedDate={selectedDate}
      isStitchLight={isStitchLight}
      effectiveBandsList={effectiveBandsList}
      activeBandId={activeBandId}
      activeBandName={activeBandName}
      effectiveBandMembers={effectiveBandMembers}
      onAddRehearsal={onAddRehearsal}
      onAddConcert={onAddConcert}
      setSyncSuccessMessage={setSyncSuccessMessage}
      availableSetlists={availableSetlists}
      />
      {/* EDIT CONCERT MODAL (Ficha del Concierto) */}
      <CalendarEditConcertModal
      viewingConcert={viewingConcert}
      setViewingConcert={setViewingConcert}
      editDraft={editDraft}
      setEditDraft={setEditDraft}
      isStitchLight={isStitchLight}
      onUpdateConcert={onUpdateConcert}
      onDeleteConcert={onDeleteConcert}
      setSyncSuccessMessage={setSyncSuccessMessage}
      availableSetlists={availableSetlists}
      />

      {/* EDIT REHEARSAL MODAL (Ficha del Ensayo) */}
      <CalendarEditRehearsalModal
      viewingRehearsal={viewingRehearsal}
      setViewingRehearsal={setViewingRehearsal}
      editRehearsalDraft={editRehearsalDraft}
      setEditRehearsalDraft={setEditRehearsalDraft}
      isStitchLight={isStitchLight}
      onUpdateRehearsal={onUpdateRehearsal}
      onDeleteRehearsal={onDeleteRehearsal}
      setSyncSuccessMessage={setSyncSuccessMessage}
      availableSetlists={availableSetlists}
      />

      {/* Modal de Sincronización Automática */}
      <CalendarSyncModal
      isOpen={showSyncModal}
      onClose={() => setShowSyncModal(false)}
      isStitchLight={isStitchLight}
      activeBandId={activeBandId}
      host={host}
      webCalFeed={webCalFeed}
      rutaFeed={rutaFeed}
      />

      {/* Modal de Enviar Recordatorio */}
      <CalendarReminderModal
      isOpen={showReminderModal}
      onClose={() => setShowReminderModal(false)}
      isStitchLight={isStitchLight}
      selectedConcert={selectedConcert}
      selectedRehearsal={selectedRehearsal}
      selectedDate={selectedDate}
      monthNames={monthNames}
      effectiveBandMembers={effectiveBandMembers}
      reminderNotes={reminderNotes}
      setReminderNotes={setReminderNotes}
      reminderSendPush={reminderSendPush}
      setReminderSendPush={setReminderSendPush}
      reminderSendEmail={reminderSendEmail}
      setReminderSendEmail={setReminderSendEmail}
      reminderSending={reminderSending}
      reminderSuccessMsg={reminderSuccessMsg}
      reminderErrorMsg={reminderErrorMsg}
      handleSendEventReminder={handleSendEventReminder}
      />

      {/* Ficha Modal Emergente y Centrada del Evento */}
      <CalendarEventDetailModal
      showEventFichaModal={showEventFichaModal}
      setShowEventFichaModal={setShowEventFichaModal}
      selectedConcert={selectedConcert}
      selectedRehearsal={selectedRehearsal}
      allChronologicalEvents={allChronologicalEvents}
      currentEventIndex={activeChronoIndex}
      handleNavigateChronologicalEvent={(dir) => goToAdjacentEvent(dir === 'next' ? 1 : -1)}
      activeBandId={activeBandId}
      currentBandId={activeBandId}
      getBandIdentity={getBandIdentity}
      isStitchLight={isStitchLight}
      isPromoPlan={isPromoPlan}
      modalActiveTab={modalActiveTab}
      setModalActiveTab={setModalActiveTab}
      selectedDateKey={selectedDateKey}
      allRoadbooks={allRoadbooks}
      getCurrentRoadbook={getCurrentRoadbook}
      updateRoadbookField={updateRoadbookField}
      getDefaultRoadbook={getDefaultRoadbook}
      handleToggleCierreItem={handleToggleCierreItem}
      handleToggleAllCierreItems={handleToggleAllCierreItems}
      handleAddCierreItem={handleAddCierreItem}
      handleDeleteCierreItem={handleDeleteCierreItem}
      handleAddKeyContact={handleAddKeyContact}
      handleDeleteKeyContact={handleDeleteKeyContact}
      openWhatsAppContact={openWhatsAppContact}
      handleUpdateMerchItem={handleUpdateMerchItem}
      handleAddMerchItem={handleAddMerchItem}
      handleDeleteMerchItem={handleDeleteMerchItem}
      handleUpdateMerchTotals={handleUpdateMerchTotals}
      handleCopyMerchSummary={handleCopyMerchSummary}
      setViewingConcert={setViewingConcert}
      setViewingRehearsal={setViewingRehearsal}
      setShowReminderModal={setShowReminderModal}
      handleDeleteEventFromModal={handleDeleteEventFromModal}
      deletingEventConfirmId={deletingEventConfirmId}
      setDeletingEventConfirmId={setDeletingEventConfirmId}
      newContactNombre={newContactNombre}
      setNewContactNombre={setNewContactNombre}
      newContactRol={newContactRol}
      setNewContactRol={setNewContactRol}
      newContactEmail={newContactEmail}
      setNewContactEmail={setNewContactEmail}
      newMerchNombre={newMerchNombre}
      setNewMerchNombre={setNewMerchNombre}
      newMerchTalla={newMerchTalla}
      setNewMerchTalla={setNewMerchTalla}
      newMerchPrecio={Number(newMerchPrecio) || 0}
      setNewMerchPrecio={(v) => setNewMerchPrecio(String(v))}
      setlists={availableSetlists}
      songs={availableSongs}
      activeTutorial={null}
      setActiveTutorial={() => {}}
      handleOpenDirectoEscenarioFromModal={(dk) => {
        const parts = dk.split('-');
        if (parts.length === 3) {
          setSelectedDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
        }
      }}
      modalWeatherAlerts={modalWeatherAlerts}
      handleShareEventWhatsApp={handleShareEventWhatsApp}
      handleNotifyBandMembers={handleNotifyBandMembers}
      handleCopyEventFicha={handleCopyEventFicha}
      />

      {/* Vista de Directo / Modo Escenario asociado a la fecha del calendario */}
      {activeStageSetlist && (
      <SetlistPerformanceView
        setlist={activeStageSetlist}
        songs={availableSongs}
        initialMode={activeStageInitialMode}
        onClose={() => setActiveStageSetlist(null)}
        currentUser={currentUser as User | undefined}
      />
      )}
    </>
  );
}

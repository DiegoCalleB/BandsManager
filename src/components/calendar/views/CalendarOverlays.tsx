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
import { CalendarSidebarLogistics } from "../CalendarSidebarLogistics";
import { CalendarSyncModal } from "../CalendarSyncModal";
import { isStitchLight } from "../calendarTheme";

/**
 * Barra lateral de logística, modales de alta/edición/recordatorio/ficha y modo escenario.
 * @returns Sección de interfaz.
 */
export function CalendarOverlays() {
  const { colors, textTitle, textSub, textMuted, selectedDate, selectedDateKey, selectedEventDetails, selectedEventTitle, selectedConcert, selectedRehearsal, hasMultipleDayEvents, dayEventsList, activeDayEventId, setSelectedEventId, monthNames, weekdays, onNavigate, currentBandId, activeBandId, activeBandName, getEventBandName, getBandIdentity, getCampaignsForDate, isPromoPlan, currentUser, setShowCreateModal, setShowEventFichaModal, setShowReminderModal, setViewingConcert, setViewingRehearsal, onDeleteConcert, onDeleteRehearsal, setReminderNotes, setReminderSuccessMsg, setReminderErrorMsg, setConcCiudad, setConcAforo, setConcNotas, setModalActiveTab, activeTab, setActiveTab, allRoadbooks, getCurrentRoadbook, updateRoadbookField, getDefaultRoadbook, handleToggleCierreItem, handleToggleAllCierreItems, handleAddCierreItem, handleDeleteCierreItem, newCierreItemText, setNewCierreItemText, newCierreItemCat, setNewCierreItemCat, showAddContactForm, setShowAddContactForm, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactTelefono, setNewContactTelefono, newContactEmail, setNewContactEmail, newContactNotas, setNewContactNotas, handleAddKeyContact, handleDeleteKeyContact, openWhatsAppContact, handleUpdateMerchItem, handleAddMerchItem, handleDeleteMerchItem, handleUpdateMerchTotals, handleCopyMerchSummary, showAddMerchForm, setShowAddMerchForm, newMerchNombre, setNewMerchNombre, newMerchCategoria, setNewMerchCategoria, newMerchTalla, setNewMerchTalla, newMerchPrecio, setNewMerchPrecio, newMerchStockInicial, setNewMerchStockInicial, merchCopiedToast, currentRunOfShow, currentGear, handleToggleRunOfShow, handleAddRunOfShow, handleDeleteRunOfShow, handleToggleGear, handleAddGear, handleDeleteGear, newRunTime, setNewRunTime, newRunActivity, setNewRunActivity, newGearLabel, setNewGearLabel, copiedQrId, setCopiedQrId, assignedSetlist, setSelectedDate, upcomingCalendarEvents, upcomingFilter, setUpcomingFilter, setViewDate, currentSetlistId, onUpdateConcert, onUpdateRehearsal, availableSetlists, setActiveStageInitialMode, setActiveStageSetlist, saveRoadbook, showCreateModal, effectiveBandsList, effectiveBandMembers, onAddRehearsal, onAddConcert, setSyncSuccessMessage, viewingConcert, editDraft, setEditDraft, viewingRehearsal, editRehearsalDraft, setEditRehearsalDraft, showSyncModal, setShowSyncModal, host, webCalFeed, rutaFeed, showReminderModal, reminderNotes, reminderSendPush, setReminderSendPush, reminderSendEmail, setReminderSendEmail, reminderSending, reminderSuccessMsg, reminderErrorMsg, handleSendEventReminder, showEventFichaModal, allChronologicalEvents, activeChronoIndex, goToAdjacentEvent, modalActiveTab, handleDeleteEventFromModal, deletingEventConfirmId, setDeletingEventConfirmId, availableSongs, modalWeatherAlerts, handleShareEventWhatsApp, handleNotifyBandMembers, handleCopyEventFicha, activeStageSetlist, activeStageInitialMode } = useCalendar();
  return (
    <>
      {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
      <CalendarSidebarLogistics
      colors={colors}
      isStitchLight={isStitchLight}
      textTitle={textTitle}
      textSub={textSub}
      textMuted={textMuted}
      selectedDate={selectedDate}
      selectedDateKey={selectedDateKey}
      selectedEventDetails={selectedEventDetails}
      selectedEventTitle={selectedEventTitle}
      selectedConcert={selectedConcert}
      selectedRehearsal={selectedRehearsal}
      hasMultipleDayEvents={hasMultipleDayEvents}
      dayEventsList={dayEventsList}
      activeDayEventId={activeDayEventId}
      setSelectedEventId={setSelectedEventId}
      monthNames={monthNames}
      weekdays={weekdays}
      onNavigate={onNavigate}
      currentBandId={currentBandId}
      activeBandId={activeBandId}
      activeBandName={activeBandName}
      getEventBandName={getEventBandName}
      getBandIdentity={getBandIdentity}
      getCampaignsForDate={getCampaignsForDate}
      isPromoPlan={isPromoPlan}
      currentUser={currentUser}
      setShowCreateModal={setShowCreateModal}
      setShowEventFichaModal={setShowEventFichaModal}
      setShowReminderModal={setShowReminderModal}
      setViewingConcert={setViewingConcert}
      setViewingRehearsal={setViewingRehearsal}
      onDeleteConcert={onDeleteConcert}
      onDeleteRehearsal={onDeleteRehearsal}
      setReminderNotes={setReminderNotes}
      setReminderSuccessMsg={setReminderSuccessMsg}
      setReminderErrorMsg={setReminderErrorMsg}
      setConcCiudad={setConcCiudad}
      setConcAforo={setConcAforo}
      setConcNotas={setConcNotas}
      setModalActiveTab={setModalActiveTab}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      allRoadbooks={allRoadbooks}
      getCurrentRoadbook={getCurrentRoadbook}
      updateRoadbookField={updateRoadbookField}
      getDefaultRoadbook={getDefaultRoadbook}
      handleToggleCierreItem={handleToggleCierreItem}
      handleToggleAllCierreItems={handleToggleAllCierreItems}
      handleAddCierreItem={handleAddCierreItem}
      handleDeleteCierreItem={handleDeleteCierreItem}
      newCierreItemText={newCierreItemText}
      setNewCierreItemText={setNewCierreItemText}
      newCierreItemCat={newCierreItemCat}
      setNewCierreItemCat={setNewCierreItemCat}
      showAddContactForm={showAddContactForm}
      setShowAddContactForm={setShowAddContactForm}
      newContactNombre={newContactNombre}
      setNewContactNombre={setNewContactNombre}
      newContactRol={newContactRol}
      setNewContactRol={setNewContactRol}
      newContactTelefono={newContactTelefono}
      setNewContactTelefono={setNewContactTelefono}
      newContactEmail={newContactEmail}
      setNewContactEmail={setNewContactEmail}
      newContactNotas={newContactNotas}
      setNewContactNotas={setNewContactNotas}
      handleAddKeyContact={handleAddKeyContact}
      handleDeleteKeyContact={handleDeleteKeyContact}
      openWhatsAppContact={openWhatsAppContact}
      handleUpdateMerchItem={handleUpdateMerchItem}
      handleAddMerchItem={handleAddMerchItem}
      handleDeleteMerchItem={handleDeleteMerchItem}
      handleUpdateMerchTotals={handleUpdateMerchTotals}
      handleCopyMerchSummary={handleCopyMerchSummary}
      showAddMerchForm={showAddMerchForm}
      setShowAddMerchForm={setShowAddMerchForm}
      newMerchNombre={newMerchNombre}
      setNewMerchNombre={setNewMerchNombre}
      newMerchCategoria={newMerchCategoria}
      setNewMerchCategoria={setNewMerchCategoria}
      newMerchTalla={newMerchTalla}
      setNewMerchTalla={setNewMerchTalla}
      newMerchPrecio={newMerchPrecio}
      setNewMerchPrecio={setNewMerchPrecio}
      newMerchStockInicial={newMerchStockInicial}
      setNewMerchStockInicial={setNewMerchStockInicial}
      merchCopiedToast={merchCopiedToast}
      currentRunOfShow={currentRunOfShow}
      currentGear={currentGear}
      handleToggleRunOfShow={handleToggleRunOfShow}
      handleAddRunOfShow={handleAddRunOfShow}
      handleDeleteRunOfShow={handleDeleteRunOfShow}
      handleToggleGear={handleToggleGear}
      handleAddGear={handleAddGear}
      handleDeleteGear={handleDeleteGear}
      newRunTime={newRunTime}
      setNewRunTime={setNewRunTime}
      newRunActivity={newRunActivity}
      setNewRunActivity={setNewRunActivity}
      newGearLabel={newGearLabel}
      setNewGearLabel={setNewGearLabel}
      copiedQrId={copiedQrId}
      setCopiedQrId={setCopiedQrId}
      assignedSetlist={assignedSetlist}
      setSelectedDate={setSelectedDate}
      upcomingCalendarEvents={upcomingCalendarEvents}
      upcomingFilter={upcomingFilter}
      setUpcomingFilter={setUpcomingFilter}
      setViewDate={setViewDate}
      currentSetlistId={currentSetlistId}
      onUpdateConcert={onUpdateConcert}
      onUpdateRehearsal={onUpdateRehearsal}
      availableSetlists={availableSetlists}
      setActiveStageInitialMode={setActiveStageInitialMode}
      setActiveStageSetlist={setActiveStageSetlist}
      saveRoadbook={saveRoadbook}
      />

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

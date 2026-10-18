/**
 * Cuadrículas del mes (una o dos) con cambio de mes por gesto o rueda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AnimatePresence, motion } from "motion/react";
import { getCachedEventWeatherAlerts } from "../../../services/weatherService";
import { useCalendar } from "../CalendarContext";
import { CalendarViewsContainer } from "../CalendarViewsContainer";
import { isStitchLight } from "../calendarTheme";

/**
 * Cuadrículas del mes (una o dos) con cambio de mes por gesto o rueda.
 * @returns Sección de interfaz.
 */
export function MonthGrids() {
  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, slideDirection, calendarViewMode, currentYear, currentMonth, dragOffset, diasConChoque, calendarSearchTerm, viewDate, selectedDate, setSelectedDate, selectedEventId, setSelectedEventId, handleSelectEvent, realToday, textTitle, textSub, textMuted, monthNames, weekdays, nextMonthYear, nextMonth, getEventsForDateStr, getCampaignsForDate, getBandIdentity, setShowCreateModal, setShowEventFichaModal, setModalActiveTab, setViewingConcert, setViewingRehearsal, onDeleteConcert, onDeleteRehearsal, onNavigate, allRoadbooks, getDefaultRoadbook, filteredConcerts, filteredRehearsals, concerts, rehearsals, isPromoPlan, onShowNotification } = useCalendar();
  return (
    <>
      {/* Month Grids Container (Single or Dual) con soporte para cambiar de mes deslizando (Touch/Mouse/Trackpad) */}
      <div
        className="relative overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing rounded-[var(--r-l)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={`${calendarViewMode}-${currentYear}-${currentMonth}`}
            custom={slideDirection}
            variants={{
              enter: (direction: 'left' | 'right' | null) => ({
                x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
                opacity: 0.85,
              }),
              center: {
                x: 0,
                opacity: 1,
              },
              exit: (direction: 'left' | 'right' | null) => ({
                x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
                opacity: 0.85,
              }),
            }}
            initial={slideDirection ? 'enter' : false}
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={dragOffset !== 0 ? { transform: `translateX(${dragOffset}px)` } : undefined}
            className={`flex flex-col ${calendarViewMode === '2m' ? 'xl:flex-row gap-6' : 'gap-4'} transition-transform duration-75`}
          >
            <CalendarViewsContainer
              diasConChoque={diasConChoque}
              calendarViewMode={calendarViewMode}
              calendarSearchTerm={calendarSearchTerm}
              viewDate={viewDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedEventId={selectedEventId}
              setSelectedEventId={setSelectedEventId}
              handleSelectEvent={handleSelectEvent}
              realToday={realToday}
              isStitchLight={isStitchLight}
              textTitle={textTitle}
              textSub={textSub}
              textMuted={textMuted}
              monthNames={monthNames}
              weekdays={weekdays}
              currentYear={currentYear}
              currentMonth={currentMonth}
              nextMonthYear={nextMonthYear}
              nextMonth={nextMonth}
              getEventsForDateStr={getEventsForDateStr}
              getCampaignsForDate={getCampaignsForDate}
              getBandIdentity={getBandIdentity}
              getCachedEventWeatherAlerts={getCachedEventWeatherAlerts}
              setShowCreateModal={setShowCreateModal}
              setShowEventFichaModal={setShowEventFichaModal}
              setModalActiveTab={setModalActiveTab}
              setViewingConcert={setViewingConcert}
              setViewingRehearsal={setViewingRehearsal}
              onDeleteConcert={onDeleteConcert}
              onDeleteRehearsal={onDeleteRehearsal}
              onNavigate={onNavigate}
              allRoadbooks={allRoadbooks}
              getDefaultRoadbook={getDefaultRoadbook}
              filteredConcerts={filteredConcerts}
              filteredRehearsals={filteredRehearsals}
              concerts={concerts}
              rehearsals={rehearsals}
              isPromoPlan={isPromoPlan}
              onShowNotification={onShowNotification}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

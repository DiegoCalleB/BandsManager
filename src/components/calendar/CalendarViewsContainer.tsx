import React from 'react';
import {
  Calendar,
  Mic,
  Clock,
  MapPin,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
  Ticket,
  Target,
  Guitar,
  Handshake,
  Drum,
  AlertTriangle,
  Eye,
  Users,
  List,
  CheckCircle2,
} from 'lucide-react';
import { Concert, Rehearsal, BookingCampaign, ThemeColors } from '../../types';
import { RoadbookInfo } from './calendarTypes';
import { CalendarWeatherBadge } from './AnimatedWeatherIcon';
import { WeatherAlert } from '../../services/weatherService';
import { HolidayDateWarning } from '../common/HolidayDateWarning';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, IconButton } from '../ui';

export interface CalendarViewsContainerProps {
  calendarViewMode: '1m' | '2m' | 'week' | 'agenda';
  calendarSearchTerm: string;
  viewDate: Date;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  handleSelectEvent: (evt: { id: string; fecha: string }) => void;
  realToday: Date;
  isStitchLight: boolean;
  textTitle: string;
  textSub: string;
  textMuted: string;
  monthNames: string[];
  weekdays: string[];
  currentYear: number;
  currentMonth: number;
  nextMonthYear: number;
  nextMonth: number;
  getEventsForDateStr: (dateStr: string) => any;
  getCampaignsForDate: (dateKey: string) => BookingCampaign[];
  getBandIdentity: (bandId?: string, fallback?: string) => any;
  getCachedEventWeatherAlerts: (city: string, dateStr: string) => WeatherAlert[];
  setShowCreateModal: (type: 'rehearsal' | 'concert' | 'reunion' | null) => void;
  setShowEventFichaModal: (show: boolean) => void;
  setModalActiveTab: (tab: any) => void;
  setViewingConcert: (c: Concert | null) => void;
  setViewingRehearsal: (r: Rehearsal | null) => void;
  onDeleteConcert?: (id: string) => void;
  onDeleteRehearsal?: (id: string) => void;
  onNavigate?: (view: string, options?: any) => void;
  allRoadbooks: Record<string, RoadbookInfo>;
  getDefaultRoadbook: (c?: Concert | null) => RoadbookInfo;
  filteredConcerts: Concert[];
  filteredRehearsals: Rehearsal[];
  concerts: Concert[];
  rehearsals: Rehearsal[];
  isPromoPlan: boolean;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function CalendarViewsContainer(props: CalendarViewsContainerProps) {
  const {
    calendarViewMode,
    calendarSearchTerm,
    viewDate,
    selectedDate,
    setSelectedDate,
    selectedEventId,
    setSelectedEventId,
    handleSelectEvent,
    realToday,
    isStitchLight,
    textTitle,
    textSub,
    textMuted,
    monthNames,
    weekdays,
    currentYear,
    currentMonth,
    nextMonthYear,
    nextMonth,
    getEventsForDateStr,
    getCampaignsForDate,
    getBandIdentity,
    getCachedEventWeatherAlerts,
    setShowCreateModal,
    setShowEventFichaModal,
    setModalActiveTab,
    setViewingConcert,
    setViewingRehearsal,
    onDeleteConcert,
    onDeleteRehearsal,
    onNavigate,
    allRoadbooks,
    getDefaultRoadbook,
    filteredConcerts,
    filteredRehearsals,
    concerts,
    rehearsals,
    isPromoPlan,
    onShowNotification,
  } = props;

  const fullWeekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const todayStr = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;
  const [agendaFilterPast, setAgendaFilterPast] = React.useState<'all' | 'future' | 'past'>('future');

  const getWeekDays = (baseDate: Date) => {
    const current = new Date(baseDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const renderMonthGrid = (year: number, month: number, showMonthHeader: boolean = false) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ empty: true, day: 0 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ empty: false, day: d });
    }

    const isThisRealMonth = realToday.getFullYear() === year && realToday.getMonth() === month;

    return (
      <div key={`month-grid-${year}-${month}`} className="flex-1 min-w-[280px] bg-[var(--sunken)]/40 p-2 sm:p-3 rounded-[var(--r-l)] border border-[var(--hair)]/40">
        {showMonthHeader && (
          <div
            className={`text-center font-bold font-display text-micro mb-2 pb-1 ${
              'text-[var(--acc)]'
            }`}
          >
            {monthNames[month]} {year}
          </div>
        )}

        {/* Weekday Labels */}
        <div
          className={`grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-micro font-mono mb-1.5 sm:mb-2.5 font-bold ${textSub} bg-[var(--sunken)]/70 p-1.5 sm:p-2 rounded-[var(--r-m)] border border-[var(--hair)]/30`}
        >
          {weekdays.map((day) => (
            <div key={day} className="py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((cell, index) => {
            if (cell.empty) {
              return <div key={`empty-${year}-${month}-${index}`} className="aspect-auto min-h-[48px] sm:min-h-[72px] bg-transparent rounded-[var(--r-s)]" />;
            }

            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
            const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(formattedDate);
            const dayCampaigns = getCampaignsForDate(formattedDate);
            const hasConcert = dayConcerts.length > 0;
            const hasRehearsal = dayRehearsals.length > 0;
            const hasCampaign = dayCampaigns.length > 0;
            const activeDateCampaign = dayCampaigns.find((c) => c.isActive) || dayCampaigns[0];
            const dayEvents: Array<Concert | Rehearsal> = [...dayConcerts, ...dayRehearsals];
            const dayWeatherAlerts = dayConcerts.flatMap((c) => getCachedEventWeatherAlerts(c.ciudad, formattedDate));
            const primaryAlert = dayWeatherAlerts[0];

            const isSelected =
              selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === cell.day;

            const isToday = isThisRealMonth && cell.day === realToday.getDate();

            let borderAndBgClass = '';
            if (isSelected) {
              borderAndBgClass = 'bg-[var(--acc-soft)] text-[var(--ink)] ring-2 ring-[var(--acc)] z-10 border border-[var(--acc)]';
            } else if (hasConcert && hasRehearsal) {
              borderAndBgClass = 'bg-[var(--acc-soft)]/60 text-[var(--ink)] border border-[var(--acc)]/40 hover:bg-[var(--acc-soft)]';
            } else if (hasConcert || hasCampaign) {
              borderAndBgClass = 'bg-[var(--acc-soft)]/40 text-[var(--ink)] border border-[var(--acc)]/30 hover:bg-[var(--acc-soft)]/70';
            } else if (hasRehearsal) {
              borderAndBgClass = 'bg-[var(--ok-soft)]/50 text-[var(--ink)] border border-[var(--ok)]/30 hover:bg-[var(--ok-soft)]';
            } else {
              borderAndBgClass = 'bg-[var(--surface)]/30 text-[var(--ink)] border border-[var(--hair)]/30 hover:bg-[var(--sunken)]';
            }

            return (
              <button
                key={`day-${year}-${month}-${cell.day}`}
                onClick={() => {
                  setSelectedDate(new Date(year, month, cell.day));
                  if (dayEvents.length > 0) {
                    setSelectedEventId(dayEvents[0].id);
                    setShowEventFichaModal(true);
                  }
                }}
                className={`relative min-w-0 w-full min-h-[48px] sm:min-h-[72px] lg:min-h-[80px] p-1 sm:p-1.5 rounded-[var(--r-s)] flex flex-col justify-between transition-ui duration-150 cursor-pointer overflow-hidden ${borderAndBgClass}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`flex size-6 items-center justify-center rounded-[var(--r-pill)] text-xs font-semibold tabular-nums ${
                      isToday ? 'bg-[var(--acc)] text-[var(--on-acc)]' : ''
                    }`}
                  >
                    {cell.day}
                  </span>
                  <div className="flex items-center gap-1">
                    {primaryAlert && <CalendarWeatherBadge alert={primaryAlert} compact />}
                    
                  </div>
                </div>

                {/* Mini Badges / Event Indicators con texto claro y legible */}
                <div className="w-full space-y-0.5 sm:space-y-1 overflow-hidden">
                  {dayConcerts.slice(0, 2).map((c) => {
                    const bandInfo = getBandIdentity(c.band_id, (c as any).bandName || (c as any).band_name);
                    const venueLabel = c.sala || c.ciudad || 'Concierto';
                    const isPosible = Boolean(c.is_posible || (c as any).isPosible);
                    return (
                      <div
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(c);
                        }}
                        className={`text-micro sm:text-micro font-sans font-semibold truncate px-1 sm:px-1.5 py-0.5 rounded-[var(--r-s)] flex items-center gap-1 transition-ui ${
                          isSelected
                            ? 'bg-[var(--sunken)]/25 text-[var(--ink)] font-bold'
                            : isPosible
                              ? 'bg-[var(--acc)]/25 text-[var(--ink)] hover:bg-[var(--acc)]/35 hover:text-[var(--ink)] '
                              : 'bg-[var(--acc)]/25 text-[var(--ink)] hover:bg-[var(--acc)]/35 hover:text-[var(--ink)] '
                        }`}
                        title={`${isPosible ? 'Posible Concierto' : 'Concierto'} [${bandInfo.name}]: ${c.sala} (${c.ciudad})${c.cache ? ` · Caché: ${c.cache}€` : ''}`}
                      >
                        {isPosible ? <Target className="size-3 shrink-0" aria-hidden="true" /> : <Guitar className="size-3 shrink-0" aria-hidden="true" />}
                        <span className="truncate font-extrabold tracking-tight">{venueLabel}</span>
                        {c.ciudad && c.sala && (
                          <span className="hidden md:inline opacity-75 text-micro shrink-0 font-normal">· {c.ciudad}</span>
                        )}
                      </div>
                    );
                  })}
                  {dayRehearsals.slice(0, dayConcerts.length > 0 ? 1 : 2).map((r) => {
                    const isReu = r.tipo_evento === 'reunion';
                    const bandInfo = getBandIdentity(r.band_id, (r as any).bandName || (r as any).band_name);
                    const rehearsalLabel = isReu
                      ? r.asunto || 'Reunión'
                      : r.lugar
                          .split(',')[0]
                          .replace(/Rehearsal|Studios/gi, '')
                          .trim() || 'Ensayo';
                    return (
                      <div
                        key={r.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectEvent(r);
                        }}
                        className={`text-micro sm:text-micro font-sans font-semibold truncate px-1 sm:px-1.5 py-0.5 rounded-[var(--r-s)] flex items-center gap-1 transition-ui ${
                          isSelected
                            ? 'bg-[var(--sunken)]/25 text-[var(--ink)] font-bold'
                            : isReu
                              ? 'bg-[var(--acc)]/25 text-[var(--ink)] hover:bg-[var(--acc)]/35 hover:text-[var(--ink)] '
                              : 'bg-[var(--ok)]/25 text-[var(--ink)] hover:bg-[var(--ok)]/35 hover:text-[var(--ink)] '
                        }`}
                        title={isReu ? `Reunión [${bandInfo.name}]: ${r.asunto || r.lugar}` : `Ensayo [${bandInfo.name}]: ${r.lugar}`}
                      >
                        {isReu ? <Handshake className="size-3 shrink-0" aria-hidden="true" /> : <Drum className="size-3 shrink-0" aria-hidden="true" />}
                        <span className="truncate font-extrabold tracking-tight">{rehearsalLabel}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > (dayConcerts.length > 0 ? 2 : 2) && (
                    <div className="text-micro sm:text-micro font-mono text-center font-bold text-[var(--acc)] opacity-90">
                      +{dayEvents.length - 2} más
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Week View (Google Calendar Style: 7 días detallados con logos de banda)
  const renderWeekView = () => {
    const weekDays = getWeekDays(selectedDate);
    return (
      <div className="w-full flex flex-col gap-3">
        {/* Selector de días de la semana con badges */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((d, idx) => {
            const isToday = realToday.toDateString() === d.toDateString();
            const isSelected = selectedDate.toDateString() === d.toDateString();
            const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const { concerts: cList, rehearsals: rList } = getEventsForDateStr(dayStr);
            const totalEvents = cList.length + rList.length;

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-center p-2 rounded-[var(--r-m)] transition-ui cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                    : isToday
                      ? 'bg-[var(--acc)]/15 text-[var(--ink)] font-bold'
                      : 'bg-[var(--sunken)] text-[var(--ink)] '
                } hover:brightness-95`}
              >
                <span className="text-micro font-mono opacity-80">{fullWeekdays[idx].slice(0, 3)}</span>
                <span className="text-sm sm:text-base font-bold font-mono my-0.5">{d.getDate()}</span>
                {totalEvents > 0 && (
                  <span
                    className={`text-micro px-1.5 py-0.2 rounded-[var(--r-pill)] font-mono font-bold ${
                      isSelected ? 'bg-[var(--surface)] text-inherit' : 'bg-[var(--acc)]/20 text-[var(--ink)]'
                    }`}
                  >
                    {totalEvents} {totalEvents === 1 ? 'evt' : 'evts'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 7 Columnas de la semana estilo Google Calendar */}
        <div className="w-full overflow-x-auto shrink-0 pb-2">
          <div className="grid grid-cols-7 gap-2 min-w-[700px] lg:min-w-0 min-h-[420px]">
            {weekDays.map((d, idx) => {
              const isToday = realToday.toDateString() === d.toDateString();
              const isSelected = selectedDate.toDateString() === d.toDateString();
              const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(dayStr);
              const campaigns = getCampaignsForDate(dayStr);

              return (
                <div
                  key={`col-${dayStr}`}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col rounded-[var(--r-m)] p-2 sm:p-2.5 transition-ui min-w-0 ${
                    isSelected
                      ? 'bg-[var(--acc)] ring-1 ring-[var(--acc)]'
                      : isToday
                        ? 'bg-[var(--acc-soft)]/40 '
                        : 'bg-[var(--sunken)] '
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--hair)]/50">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-[var(--acc)]' : isToday ? 'text-[var(--acc)]' : 'text-[var(--ink-2)]'}`}
                      >
                        {fullWeekdays[idx].slice(0, 3)} {d.getDate()}
                      </span>
                      {(() => {
                        const dIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const cCity = dayConcerts.find((c) => c.ciudad)?.ciudad;
                        if (!cCity) return null;
                        const wAlerts = getCachedEventWeatherAlerts(cCity, dIso);
                        return wAlerts[0] ? <CalendarWeatherBadge alert={wAlerts[0]} compact /> : null;
                      })()}
                      {isToday && <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] shrink-0" />}
                    </div>
                    <IconButton
                      label="Añadir evento a este día"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(d);
                        setShowCreateModal('concert');
                      }}
                      className="shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </IconButton>
                  </div>

                  {/* Lista de eventos del día */}
                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[360px]">
                    {dayConcerts.map((c) => {
                      const bandInfo = getBandIdentity(c.band_id, (c as any).bandName || (c as any).band_name);
                      const isEvtSelected = selectedEventId === c.id;
                      const isPosible = Boolean(c.is_posible || (c as any).isPosible);
                      return (
                        <div
                          key={c.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEvent(c);
                          }}
                          className={`p-2 rounded-[var(--r-m)] cursor-pointer transition-ui text-left min-w-0 ${
                            isEvtSelected
                              ? isPosible
                                ? 'bg-[var(--acc)]/25 ring-1 ring-[var(--acc)]/50'
                                : 'bg-[var(--acc)]/25 ring-1 ring-[var(--acc)]/50'
                              : isPosible
                                ? 'bg-[var(--acc)]/30 hover:bg-[var(--acc)]/30 text-[var(--ink)]'
                                : 'bg-[var(--acc)]/30 hover:bg-[var(--acc)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 min-w-0">
                            {bandInfo.logoUrl ? (
                              <img
                                src={bandInfo.logoUrl}
                                alt={bandInfo.name}
                                className={`w-4 h-4 rounded-[var(--r-pill)] object-contain bg-[var(--sunken)] p-0.5 shrink-0 ${isPosible ? '' : ''}`}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                  if (fb) (fb as HTMLElement).classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span
                              className={`fallback-initials w-4 h-4 rounded-[var(--r-pill)] shrink-0 flex items-center justify-center text-micro font-bold ${bandInfo.palette.badge} ${bandInfo.logoUrl ? 'hidden' : ''}`}
                            >
                              {bandInfo.initials}
                            </span>
                            <span
                              className={`text-micro font-bold ${isPosible ? 'text-[var(--acc)]' : 'text-[var(--acc)]'} truncate`}
                              title={bandInfo.name}
                            >
                              {bandInfo.name}
                            </span>
                            {isPosible && (
                              <span className="ml-auto text-micro font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--acc)]/30 text-[var(--ink)] ">
                                Posible
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-[var(--ink)] truncate flex items-center gap-1">
                            <span>{isPosible ? '🎯' : '🎸'}</span>
                            <span className="truncate">{c.sala}</span>
                          </div>
                          {c.ciudad && <div className="text-micro text-[var(--acc)]/80 truncate"><ShowIcon inline emoji="📍" />{c.ciudad}</div>}
                          <HolidayDateWarning date={c.fecha} city={c.ciudad} compact className="mt-1" />
                          {((c as any).hora || (c.fecha.includes('T') ? c.fecha.split('T')[1].slice(0, 5) : '')) && (
                            <div className="text-micro font-mono text-[var(--ink-2)] mt-1">
                              <ShowIcon inline emoji="🕒" />{(c as any).hora || (c.fecha.includes('T') ? c.fecha.split('T')[1].slice(0, 5) : '')}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayRehearsals.map((r) => {
                      const isReu = r.tipo_evento === 'reunion';
                      const bandInfo = getBandIdentity(r.band_id, (r as any).bandName || (r as any).band_name);
                      const isEvtSelected = selectedEventId === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEvent(r);
                          }}
                          className={`p-2 rounded-[var(--r-m)] cursor-pointer transition-ui text-left min-w-0 ${
                            isEvtSelected
                              ? isReu
                                ? 'bg-[var(--acc)]/25 ring-1 ring-[var(--acc)]/50'
                                : 'bg-[var(--ok)]/25 ring-1 ring-[var(--ok)]/50'
                              : isReu
                                ? 'bg-[var(--acc)]/30 hover:bg-[var(--acc)]/30'
                                : 'bg-[var(--ok)]/30 hover:bg-[var(--ok)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 min-w-0">
                            {bandInfo.logoUrl ? (
                              <img
                                src={bandInfo.logoUrl}
                                alt={bandInfo.name}
                                className={`w-4 h-4 rounded-[var(--r-pill)] object-contain bg-[var(--sunken)] p-0.5 shrink-0 ${isReu ? '' : ''}`}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                  if (fb) (fb as HTMLElement).classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span
                              className={`fallback-initials w-4 h-4 rounded-[var(--r-pill)] shrink-0 flex items-center justify-center text-micro font-bold ${bandInfo.palette.badge} ${bandInfo.logoUrl ? 'hidden' : ''}`}
                            >
                              {bandInfo.initials}
                            </span>
                            <span
                              className={`text-micro font-bold truncate ${isReu ? 'text-[var(--acc)]' : 'text-[var(--ok)]'}`}
                              title={bandInfo.name}
                            >
                              {bandInfo.name}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[var(--ink)] truncate flex items-center gap-1">
                            <span>{isReu ? '🤝' : '🥁'}</span>
                            <span className="truncate">{isReu ? r.asunto || 'Reunión' : r.lugar}</span>
                          </div>
                          {r.hora && <div className="text-micro font-mono text-[var(--ink-2)] mt-1"><ShowIcon inline emoji="🕒" />{r.hora}</div>}
                        </div>
                      );
                    })}
                    {campaigns.map((camp) => (
                      <div
                        key={camp.id}
                        className="p-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/25 text-micro text-[var(--ink)]"
                      >
                        <ShowIcon inline emoji="🎯" />{camp.name}
                      </div>
                    ))}

                    {dayConcerts.length === 0 && dayRehearsals.length === 0 && campaigns.length === 0 && (
                      <div className="h-24 flex flex-col items-center justify-center text-center p-2 rounded border-dashed text-[var(--ink-2)]">
                        <span className="text-micro">Sin eventos</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Agenda View (Google Calendar Style: lista cronológica de eventos con logos e información detallada)
  const renderAgendaView = () => {
    const allEventsList: Array<{
      date: Date;
      dateStr: string;
      type: 'concert' | 'rehearsal';
      event: Concert | Rehearsal;
      isPast: boolean;
    }> = [];

    // Usamos filteredConcerts y filteredRehearsals para respetar búsqueda por texto y banda activa
    filteredConcerts.forEach((c) => {
      const d = new Date(c.fecha + (c.fecha.includes('T') ? '' : 'T12:00:00'));
      if (!isNaN(d.getTime())) {
        const dateOnlyStr = c.fecha.split('T')[0];
        const isPast = dateOnlyStr < todayStr;

        // Filtrar según el selector de pasado / futuro de la agenda si no está en "all"
        if (agendaFilterPast === 'future' && isPast) return;
        if (agendaFilterPast === 'past' && !isPast) return;

        // Si hay búsqueda por texto o filtro pasados, mostramos sin restricción de mes. Si no, rango del bimestre
        if (calendarSearchTerm.trim() || agendaFilterPast !== 'all') {
          allEventsList.push({ date: d, dateStr: dateOnlyStr, type: 'concert', event: c, isPast });
        } else {
          const startRange = new Date(currentYear, currentMonth, 1);
          const endRange = new Date(currentYear, currentMonth + 2, 0);
          if (d >= startRange && d <= endRange) {
            allEventsList.push({ date: d, dateStr: dateOnlyStr, type: 'concert', event: c, isPast });
          }
        }
      }
    });

    filteredRehearsals.forEach((r) => {
      const d = new Date(r.fecha + (r.fecha.includes('T') ? '' : 'T12:00:00'));
      if (!isNaN(d.getTime())) {
        const dateOnlyStr = r.fecha.split('T')[0];
        const isPast = dateOnlyStr < todayStr;

        if (agendaFilterPast === 'future' && isPast) return;
        if (agendaFilterPast === 'past' && !isPast) return;

        if (calendarSearchTerm.trim() || agendaFilterPast !== 'all') {
          allEventsList.push({ date: d, dateStr: dateOnlyStr, type: 'rehearsal', event: r, isPast });
        } else {
          const startRange = new Date(currentYear, currentMonth, 1);
          const endRange = new Date(currentYear, currentMonth + 2, 0);
          if (d >= startRange && d <= endRange) {
            allEventsList.push({ date: d, dateStr: dateOnlyStr, type: 'rehearsal', event: r, isPast });
          }
        }
      }
    });

    allEventsList.sort((a, b) => a.date.getTime() - b.date.getTime());

    const groupedByDate: { [dateStr: string]: typeof allEventsList } = {};
    allEventsList.forEach((item) => {
      if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
      groupedByDate[item.dateStr].push(item);
    });

    const dateKeys = Object.keys(groupedByDate).sort();

    return (
      <div className="w-full flex flex-col gap-4">
        {/* Agenda Sub-Header con Filtro de Pasados / Futuros y Añadir Evento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hair)]/80">
          <div className="flex items-center gap-2 flex-wrap">
            <List className="w-4 h-4 text-[var(--acc)]" />
            <span className="text-xs font-mono font-bold text-[var(--ink-2)]">
              Agenda Cronológica ({allEventsList.length} eventos)
            </span>
            {calendarSearchTerm.trim() && (
              <span className="text-micro font-mono px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--ink)] ">
                Filtrado por: "{calendarSearchTerm}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de periodo para ver conciertos pasados y futuros en la agenda */}
            <div
              className={`flex items-center rounded-[var(--r-m)] p-0.5 text-xs font-mono font-bold ${
                'bg-[var(--sunken)] text-[var(--ink)]'
              }`}
            >
              <button
                type="button"
                onClick={() => setAgendaFilterPast('all')}
                className={`px-2.5 py-1 rounded transition-ui cursor-pointer ${
                  agendaFilterPast === 'all'
                    ? 'bg-[var(--surface)] text-[var(--ink)] '
                    : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setAgendaFilterPast('future')}
                className={`px-2.5 py-1 rounded transition-ui cursor-pointer ${
                  agendaFilterPast === 'future'
                    ? 'bg-[var(--surface)] text-[var(--ink)] '
                    : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                Próximos
              </button>
              <button
                type="button"
                onClick={() => setAgendaFilterPast('past')}
                className={`px-2.5 py-1 rounded transition-ui cursor-pointer flex items-center gap-1 ${
                  agendaFilterPast === 'past'
                    ? 'bg-[var(--surface)] text-[var(--ink)] '
                    : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                <span>Pasados / Realizados</span>
              </button>
            </div>

            <Button
              variant="primary"
              size="xs"
              onClick={() => setShowCreateModal('concert')}
              className="items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir evento</span>
            </Button>
          </div>
        </div>

        {dateKeys.length === 0 ? (
          <div className="p-8 text-center rounded-[var(--r-l)] border-dashed bg-[var(--surface)]/40">
            <Calendar className="w-8 h-8 text-[var(--ink-2)] mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--ink-2)]">Nada apuntado en este periodo</p>
            <p className="text-xs text-[var(--ink-2)] mt-1">
              {agendaFilterPast === 'past'
                ? 'No se han encontrado conciertos pasados registrados.'
                : 'Usa el botón "Añadir Evento", cambia el filtro a Todos o ajusta la búsqueda por palabras clave.'}
            </p>
            {agendaFilterPast !== 'all' && (
              <Button
                variant="neutral"
                size="xs"
                onClick={() => setAgendaFilterPast('all')}
                className="mt-3"
              >
                Ver todos los eventos
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dateKeys.map((dateStr) => {
              const items = groupedByDate[dateStr];
              const d = new Date(dateStr + 'T12:00:00');
              const isToday = realToday.toDateString() === d.toDateString();
              const isSelected = selectedDate.toDateString() === d.toDateString();
              const dayName = fullWeekdays[(d.getDay() + 6) % 7];
              const isDatePast = dateStr < todayStr;

              return (
                <div
                  key={dateStr}
                  className={`rounded-[var(--r-m)] transition-ui p-3 ${
                    isSelected
                      ? 'bg-[var(--sunken)]/90 ring-1 ring-[var(--acc)]/30'
                      : isToday
                        ? 'bg-[var(--sunken)]/70 '
                        : isDatePast
                          ? 'bg-[var(--sunken)]/50 opacity-95'
                          : 'bg-[var(--sunken)]/40 '
                  } bg-[var(--acc)]/10 hover:brightness-95`}
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[var(--hair)]/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isToday
                            ? 'bg-[var(--ink)] text-[var(--bg)] font-bold'
                            : isDatePast
                              ? 'bg-[var(--surface)]/80 text-[var(--ink-2)]'
                              : 'bg-[var(--surface)] text-[var(--ink-2)]'
                        }`}
                      >
                        {dayName}, {d.getDate()} de {monthNames[d.getMonth()]} {d.getFullYear() !== currentYear ? d.getFullYear() : ''}
                      </span>
                      {isToday && (
                        <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] " />
                          Hoy
                        </span>
                      )}
                      {isDatePast && !isToday && (
                        <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ink)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[var(--ok)]" />
                          <span>Realizado</span>
                        </span>
                      )}
                    </div>
                    <IconButton
                      label="Añadir a esta fecha"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedDate(d);
                        setShowCreateModal('concert');
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>

                  <div className="flex flex-col gap-2">
                    {items.map(({ type, event: evt, isPast }) => {
                      const isConcert = type === 'concert';
                      const c = isConcert ? (evt as Concert) : null;
                      const r = !isConcert ? (evt as Rehearsal) : null;
                      const isReu = r?.tipo_evento === 'reunion';
                      const bandInfo = getBandIdentity(evt.band_id, (evt as any).bandName || (evt as any).band_name);
                      const isEvtSelected = selectedEventId === evt.id;

                      return (
                        <div
                          key={evt.id}
                          onClick={() => handleSelectEvent(evt)}
                          className={`flex items-center justify-between p-2.5 rounded-[var(--r-m)] cursor-pointer transition-ui ${
                            isEvtSelected
                              ? 'bg-[var(--acc)]/20 ring-1 ring-[var(--acc)]/50'
                              : isConcert
                                ? isPast
                                  ? 'bg-[var(--acc)]/15 hover:bg-[var(--acc)]/20'
                                  : 'bg-[var(--acc)]/20 hover:bg-[var(--acc)]/20'
                                : isReu
                                  ? 'bg-[var(--acc)]/20 hover:bg-[var(--acc)]/20'
                                  : 'bg-[var(--ok)]/20 hover:bg-[var(--ok)]/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo o iniciales de la banda */}
                            {bandInfo.logoUrl ? (
                              <img
                                src={bandInfo.logoUrl}
                                alt={bandInfo.name}
                                className="w-8 h-8 rounded-[var(--r-pill)] object-contain bg-[var(--sunken)] p-0.5 shrink-0 shadow-xs"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                  if (fb) (fb as HTMLElement).classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span
                              className={`fallback-initials w-8 h-8 rounded-[var(--r-pill)] shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${bandInfo.palette.badge} ${bandInfo.logoUrl ? 'hidden' : ''}`}
                            >
                              {bandInfo.initials}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-bold font-mono px-1.5 py-0.2 rounded ${
                                    isConcert
                                      ? isPast
                                        ? 'bg-[var(--acc)]/15 text-[var(--ink)] '
                                        : 'bg-[var(--acc)]/20 text-[var(--ink)] '
                                      : isReu
                                        ? 'bg-[var(--acc)]/20 text-[var(--ink)] '
                                        : 'bg-[var(--ok)]/20 text-[var(--ink)] '
                                  }`}
                                >
                                  {isConcert ? 'Concierto' : isReu ? 'Reunión' : 'Ensayo'}
                                </span>
                                {isPast && (
                                  <span className="text-micro font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--ok)]/20 text-[var(--ink)] flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Realizado</span>
                                  </span>
                                )}
                                <span className="text-xs font-bold text-[var(--ink)] truncate">{bandInfo.name}</span>
                              </div>
                              <div className="text-xs text-[var(--ink-2)] font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>
                                  {isConcert
                                    ? `${c?.sala}${c?.ciudad ? ` (${c?.ciudad})` : ''}`
                                    : isReu
                                      ? r?.asunto || 'Reunión de coordinación'
                                      : r?.lugar}
                                </span>
                                {isConcert &&
                                  c?.ciudad &&
                                  (() => {
                                    const alerts = getCachedEventWeatherAlerts(c.ciudad, dateStr);
                                    return alerts[0] ? <CalendarWeatherBadge alert={alerts[0]} /> : null;
                                  })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {((evt as any).hora ||
                              ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : '')) && (
                              <span className="text-xs font-mono text-[var(--ink-2)] flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--ink-2)]" />
                                {(evt as any).hora ||
                                  ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : '')}
                              </span>
                            )}

                            {/* Botón directo de Editar para ver y editar conciertos pasados o futuros */}
                            <Button
                              variant="neutral"
                              size="xs"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isConcert && c) {
                                  setViewingConcert(c);
                                } else if (r) {
                                  setViewingRehearsal(r);
                                }
                              }}
                              className="items-center gap-1"
                              title={isPast ? 'Editar datos, notas o caché del bolo realizado' : 'Editar evento'}
                            >
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                            </Button>

                            <ChevronRight className="w-4 h-4 text-[var(--ink-2)]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {calendarViewMode === 'week' ? (
        renderWeekView()
      ) : calendarViewMode === 'agenda' ? (
        renderAgendaView()
      ) : (
        <div className={`flex flex-col ${calendarViewMode === '2m' ? 'xl:flex-row' : ''} gap-6`}>
          {renderMonthGrid(currentYear, currentMonth, calendarViewMode === '2m')}
          {calendarViewMode === '2m' && renderMonthGrid(nextMonthYear, nextMonth, true)}
        </div>
      )}
    </>
  );
}

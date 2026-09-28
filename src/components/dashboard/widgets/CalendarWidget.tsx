import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  CalendarDays,
  ArrowRight,
  Music,
  Users,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Concert, Rehearsal, ThemeColors } from '../../../types';
import { CalendarWidgetViewMode } from '../../../types/dashboardWidgets';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

export interface CalendarWidgetProps {
  concerts: Concert[];
  rehearsals: Rehearsal[];
  activeBandName?: string;
  colors: ThemeColors;
  agendaFilterMode: 'active' | 'all';
  onSetAgendaFilterMode: (mode: 'active' | 'all') => void;
  onNavigate?: (view: string, options?: any) => void;
  viewMode?: CalendarWidgetViewMode;
  onChangeViewMode?: (mode: CalendarWidgetViewMode) => void;
  filterType?: 'all' | 'concierto' | 'ensayo';
  onChangeFilterType?: (type: 'all' | 'concierto' | 'ensayo') => void;
  isEditMode?: boolean;
}

export function CalendarWidget({
  concerts,
  rehearsals,
  activeBandName = 'Banda',
  agendaFilterMode,
  onSetAgendaFilterMode,
  onNavigate,
  viewMode: initialViewMode = 'list',
  onChangeViewMode,
  filterType: initialFilterType = 'all',
  onChangeFilterType,
  isEditMode = false,
}: CalendarWidgetProps) {
  const [internalViewMode, setInternalViewMode] = useState<CalendarWidgetViewMode>(initialViewMode);
  const [internalFilterType, setInternalFilterType] = useState<'all' | 'concierto' | 'ensayo'>(initialFilterType);

  // State for mini_month view mode navigation
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const viewMode = onChangeViewMode ? initialViewMode : internalViewMode;
  const filterType = onChangeFilterType ? initialFilterType : internalFilterType;

  const handleSetViewMode = (mode: CalendarWidgetViewMode) => {
    if (onChangeViewMode) onChangeViewMode(mode);
    else setInternalViewMode(mode);
  };

  const handleSetFilterType = (type: 'all' | 'concierto' | 'ensayo') => {
    if (onChangeFilterType) onChangeFilterType(type);
    else setInternalFilterType(type);
  };

  // Filter concerts & rehearsals according to agendaFilterMode ('all' vs'active')
  const displayConcerts = React.useMemo(() => {
    if (agendaFilterMode === 'active') {
      return concerts.filter((c) => {
        if (!c.band_id && !c.bandName) return true;
        const bId = (c.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
        const bName = (c.bandName || '').trim().toLowerCase();
        const activeName = (activeBandName || '').trim().toLowerCase();
        return bId === 'bakandeya' || (bName && activeName && bName === activeName);
      });
    }
    return concerts;
  }, [concerts, agendaFilterMode, activeBandName]);

  const displayRehearsals = React.useMemo(() => {
    if (agendaFilterMode === 'active') {
      return rehearsals.filter((r) => {
        if (!r.band_id && !r.bandName) return true;
        const rId = (r.band_id || '').replace(/^(band|reg)-/, '').toLowerCase();
        const rName = (r.bandName || '').trim().toLowerCase();
        const activeName = (activeBandName || '').trim().toLowerCase();
        return rId === 'bakandeya' || (rName && activeName && rName === activeName);
      });
    }
    return rehearsals;
  }, [rehearsals, agendaFilterMode, activeBandName]);

  // Build normalized upcoming events list
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents: Array<{
    id: string;
    type: 'concierto' | 'ensayo';
    title: string;
    dateStr: string;
    day: string;
    month: string;
    time?: string;
    location: string;
    badge: string;
    bandName?: string;
    details?: string;
  }> = [];

  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  if (filterType === 'all' || filterType === 'concierto') {
    displayConcerts.forEach((c) => {
      const parts = c.fecha ? c.fecha.split('-') : [];
      const day = parts[2] || '15';
      const monthIdx = parts[1] ? parseInt(parts[1], 10) - 1 : 7;
      const month = monthNames[monthIdx] || 'AGO';

      upcomingEvents.push({
        id: c.id,
        type: 'concierto',
        title: c.sala || c.ciudad || 'Concierto en Vivo',
        dateStr: c.fecha,
        day,
        month,
        time: (c as any).hora || undefined,
        location: [c.sala, c.ciudad].filter(Boolean).join('•') || 'Por determinar',
        badge: c.contrato_firmado ? 'Contrato Firmado' : 'Programado',
        bandName: (c as any).bandName || activeBandName,
        details: c.cache ? `Caché: ${c.cache}€` : undefined,
      });
    });
  }

  if (filterType === 'all' || filterType === 'ensayo') {
    displayRehearsals.forEach((r) => {
      if (r.fecha && r.fecha < todayStr && r.estado === 'completado') return;
      const parts = r.fecha ? r.fecha.split('-') : [];
      const day = parts[2] || '10';
      const monthIdx = parts[1] ? parseInt(parts[1], 10) - 1 : 7;
      const month = monthNames[monthIdx] || 'AGO';

      upcomingEvents.push({
        id: r.id,
        type: 'ensayo',
        title: r.lugar ? `Ensayo en ${r.lugar}` : 'Ensayo General',
        dateStr: r.fecha,
        day,
        month,
        time: r.hora || '18:00',
        location: r.lugar || 'Local de Ensayo',
        badge: r.estado === 'completado' ? 'Completado' : 'Programado',
        bandName: (r as any).bandName || activeBandName,
        details: `Horario: ${r.hora || '18:00'}`,
      });
    });
  }

  upcomingEvents.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  // Calendar month calculation helpers for mini_month view
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Starting day of week (0 = Monday in ES)
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  // Create event map for calendar days
  const eventsByDayMap = new Map<string, typeof upcomingEvents>();
  upcomingEvents.forEach((evt) => {
    const list = eventsByDayMap.get(evt.dateStr) || [];
    list.push(evt);
    eventsByDayMap.set(evt.dateStr, list);
  });

  const fullMonthName = currentMonthDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const cardContainerBg = isStitchLight
    ? 'bg-white border border-zinc-200 shadow-xs'
    : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm';
  const subCardBg = isStitchLight
    ? 'bg-zinc-50 border border-zinc-200/80 text-zinc-900 hover:border-indigo-400'
    : 'bg-[#121214] border border-neutral-800/90 text-neutral-100 hover:border-amber-500/40';
  const textTitleColor = isStitchLight ? 'text-zinc-900' : 'text-neutral-100';
  const textSubColor = isStitchLight ? 'text-zinc-500' : 'text-neutral-400';
  const dividerColor = isStitchLight ? 'border-zinc-200' : 'border-neutral-800/80';
  const accentColor = isStitchLight ? 'text-indigo-600' : 'text-amber-400';

  return (
    <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] transition-all space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--ink)] flex items-center gap-2">Agenda</h3>
            <p className="text-xs text-[var(--ink-2)]">
              {agendaFilterMode === 'all' ? 'Eventos de todas las bandas' : `Eventos de ${activeBandName}`}
            </p>
          </div>
        </div>

        {/* View mode buttons & Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-[var(--r-pill)] p-1 gap-1 bg-[var(--sunken)]">
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`p-1.5 text-xs font-semibold rounded-[var(--r-pill)] transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'list' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              title="Vista Lista Próximos"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('mini_month')}
              className={`p-1.5 text-xs font-semibold rounded-[var(--r-pill)] transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'mini_month' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              title="Vista Mensual Compacta"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Mes</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('weekly_grid')}
              className={`p-1.5 text-xs font-semibold rounded-[var(--r-pill)] transition-colors flex items-center gap-1 cursor-pointer ${
                viewMode === 'weekly_grid' ? 'bg-[var(--acc)] text-[var(--on-acc)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
              title="Vista Agenda Semanal"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Semana</span>
            </button>
          </div>

          {/* Band Scope Toggle */}
          {onSetAgendaFilterMode && (
            <button
              type="button"
              onClick={() => onSetAgendaFilterMode(agendaFilterMode === 'all' ? 'active' : 'all')}
              className={`px-2.5 py-1 text-[11px] rounded-[var(--r-pill)] transition-colors cursor-pointer flex items-center gap-1 ${
                agendaFilterMode === 'all'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-semibold'
                  : 'bg-[var(--sunken)] text-[var(--ink-2)] font-medium'
              }`}
              title={agendaFilterMode === 'all' ? 'Ver solo eventos de la banda activa' : 'Ver eventos de todas las bandas'}
            >
              <Users className="w-3 h-3" />
              <span>{agendaFilterMode === 'all' ? 'Todas las bandas' : activeBandName || 'Banda activa'}</span>
            </button>
          )}

          {/* Filter Type Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetFilterType('all')}
              className={`px-2.5 py-1 text-[11px] rounded-[var(--r-pill)] transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[var(--sunken)] text-[var(--acc-ink)] font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleSetFilterType('concierto')}
              className={`px-2.5 py-1 text-[11px] rounded-[var(--r-pill)] transition-colors cursor-pointer ${
                filterType === 'concierto'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Bolos
            </button>
            <button
              type="button"
              onClick={() => handleSetFilterType('ensayo')}
              className={`px-2.5 py-1 text-[11px] rounded-[var(--r-pill)] transition-colors cursor-pointer ${
                filterType === 'ensayo'
                  ? 'bg-[var(--ok-soft)] text-[var(--ok)] font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Ensayos
            </button>
          </div>

          {/* Nav to full calendar */}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('calendario')}
              className="text-xs text-[var(--acc-ink)] hover:underline font-semibold flex items-center gap-1 cursor-pointer ml-1"
            >
              <span>Ver Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: LISTA PRÓXIMAS FECHAS */}
      {viewMode === 'list' && (
        <>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingEvents.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    onNavigate &&
                    onNavigate('calendario', {
                      selectedEventId: item.id,
                      selectedDate: item.dateStr,
                    })
                  }
                  className="p-3.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:brightness-110 transition-[filter,transform] flex items-start gap-3 cursor-pointer hover:scale-[1.01]"
                >
                  <div className="w-11 h-11 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-base font-bold leading-none text-[var(--acc-ink)] tabular-nums">{item.day}</span>
                    <span className="text-[9px] font-semibold tracking-wide text-[var(--acc-ink)]/80 mt-0.5">{item.month}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-[var(--r-pill)] font-semibold tracking-wide ${
                          item.type === 'concierto' ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)]' : 'bg-[var(--ok-soft)] text-[var(--ok)]'
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.bandName && <span className="text-[9px] text-[var(--acc-ink)]/70 truncate max-w-[100px]">{item.bandName}</span>}
                    </div>

                    <h4 className="text-sm font-semibold mt-1 text-[var(--ink)] truncate">{item.title}</h4>

                    <p className="text-xs text-[var(--ink-2)] truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[var(--sunken)] rounded-[var(--r-m)]">
              <Calendar className="w-8 h-8 text-[var(--ink-2)] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[var(--ink-2)]">Todavía no hay nada en la agenda</p>
              <p className="text-xs text-[var(--ink-2)] mt-1">Añade un bolo o un ensayo y aquí aparece lo próximo.</p>
            </div>
          )}
        </>
      )}

      {/* VISTA 2: CALENDARIO MENSUAL COMPACTO */}
      {viewMode === 'mini_month' && (
        <div className="space-y-3">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-[var(--r-m)]">
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
              className="p-1.5 text-[var(--ink-2)] hover:text-[var(--acc)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold capitalize text-[var(--ink-2)]">{fullMonthName}</span>
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
              className="p-1.5 text-[var(--ink-2)] hover:text-[var(--acc)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="text-[10px] text-[var(--ink-3)] font-bold py-1">
                {d}
              </div>
            ))}

            {/* Empty slots for start padding */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 min-h-[36px]" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dayPadded = String(dayNum).padStart(2, '0');
              const monthPadded = String(month + 1).padStart(2, '0');
              const dateKey = `${year}-${monthPadded}-${dayPadded}`;
              const dayEvents = eventsByDayMap.get(dateKey) || [];
              const isToday = dateKey === todayStr;
              const isSelected = selectedDayStr === dateKey;

              const hasConcert = dayEvents.some((e) => e.type === 'concierto');
              const hasRehearsal = dayEvents.some((e) => e.type === 'ensayo');

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedDayStr(dateKey === selectedDayStr ? null : dateKey)}
                  className={`p-1.5 min-h-[38px] rounded-[var(--r-s)] text-xs flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[var(--acc)]/20 text-[var(--ink)] font-bold'
                      : isToday
                        ? 'bg-[var(--acc)]/10 text-[var(--acc)] font-bold'
                        : dayEvents.length > 0
                          ? 'bg-[var(--sunken)] text-[var(--ink)] hover:bg-[var(--surface)]'
                          : 'bg-[var(--sunken)]/50 text-[var(--ink-2)] hover:bg-[var(--sunken)]'
                  }`}
                >
                  <span className="leading-none">{dayNum}</span>

                  {/* Indicators for events */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {hasConcert && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isStitchLight ? 'bg-indigo-500' : 'bg-amber-400'} shadow-xs`}
                        title="Concierto"
                      />
                    )}
                    {hasRehearsal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs" title="Ensayo" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details for selected day if clicked */}
          {selectedDayStr && (
            <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] text-xs font-sans space-y-2">
              <div className="flex items-center justify-between text-[var(--ink-2)] pb-1.5">
                <span className="font-bold text-[var(--acc)]/70">Eventos para {selectedDayStr}:</span>
                <button type="button" onClick={() => setSelectedDayStr(null)} className="text-[var(--ink-2)] hover:text-[var(--ink-2)]">
                  ✕
                </button>
              </div>
              {(eventsByDayMap.get(selectedDayStr) || []).length > 0 ? (
                (eventsByDayMap.get(selectedDayStr) || []).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() =>
                      onNavigate &&
                      onNavigate('calendario', {
                        selectedEventId: evt.id,
                        selectedDate: evt.dateStr,
                      })
                    }
                    className="p-2 rounded-[var(--r-s)] bg-[var(--sunken)] hover:bg-[var(--surface)] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          evt.type === 'concierto' ? 'bg-[var(--acc)]/20 text-[var(--acc)]/70' : 'bg-[var(--ok)]/20 text-[var(--ink-2)]'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <p className="font-bold text-[var(--ink-2)] mt-1">{evt.title}</p>
                      <p className="text-[var(--ink-2)] text-[11px]">{evt.location}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                  </div>
                ))
              ) : (
                <p className="text-[var(--ink-2)] italic">No hay eventos programados para este día.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: AGENDA SEMANAL COMPACTA */}
      {viewMode === 'weekly_grid' && (
        <div className="space-y-3">
          <p className="text-xs font-sans text-[var(--ink-2)]">Próximos 7 días de actividad programada:</p>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const date = new Date();
              date.setDate(date.getDate() + idx);
              const dateStr = date.toISOString().split('T')[0];
              const dayName = date.toLocaleDateString('es-ES', {
                weekday: 'short',
              });
              const dayNum = date.getDate();
              const dayEvts = eventsByDayMap.get(dateStr) || [];

              return (
                <div
                  key={dateStr}
                  className={`p-2.5 rounded-[var(--r-m)] text-xs flex flex-col justify-between min-h-[90px] transition-all ${
                    dayEvts.length > 0 ? 'bg-[var(--surface)]' : 'bg-[var(--sunken)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="uppercase text-[10px] text-[var(--ink-2)] font-bold">{dayName}</span>
                    <span className="font-bold text-[var(--acc)]">{dayNum}</span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayEvts.map((e) => (
                      <div
                        key={e.id}
                        onClick={() =>
                          onNavigate &&
                          onNavigate('calendario', {
                            selectedEventId: e.id,
                            selectedDate: e.dateStr,
                          })
                        }
                        className={`text-[9px] p-1 rounded font-bold truncate cursor-pointer ${
                          e.type === 'concierto' ? 'bg-[var(--acc)]/20 text-[var(--acc)]/70' : 'bg-[var(--ok)]/20 text-[var(--ink-2)]'
                        }`}
                        title={`${e.type.toUpperCase()}: ${e.title}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvts.length === 0 && (
                      <span className={`text-[10px] ${isStitchLight ? 'text-zinc-400' : 'text-neutral-600'} block text-center py-2`}>
                        Libre
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

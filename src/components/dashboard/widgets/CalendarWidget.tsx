import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, List, Grid, CalendarDays, ArrowRight, Music, Users, MapPin, Clock, Sparkles } from 'lucide-react';
import { Concert, Rehearsal, ThemeColors } from '../../../types';
import { CalendarWidgetViewMode } from '../../../types/dashboardWidgets';

export interface CalendarWidgetProps {
  concerts: Concert[];
  rehearsals: Rehearsal[];
  activeBandName?: string;
  colors: ThemeColors;
  isStitchLight?: boolean;
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
  colors,
  isStitchLight = false,
  agendaFilterMode,
  onSetAgendaFilterMode,
  onNavigate,
  viewMode: initialViewMode = 'list',
  onChangeViewMode,
  filterType: initialFilterType = 'all',
  onChangeFilterType,
  isEditMode = false
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

  // Filter concerts & rehearsals according to agendaFilterMode ('all' vs 'active')
  const displayConcerts = React.useMemo(() => {
    if (agendaFilterMode === 'active') {
      return concerts.filter(c => {
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
      return rehearsals.filter(r => {
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
    displayConcerts.forEach(c => {
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
        location: [c.sala, c.ciudad].filter(Boolean).join(' • ') || 'Por determinar',
        badge: c.contrato_firmado ? 'Contrato Firmado' : 'Programado',
        bandName: (c as any).bandName || activeBandName,
        details: c.cache ? `Caché: ${c.cache}€` : undefined
      });
    });
  }

  if (filterType === 'all' || filterType === 'ensayo') {
    displayRehearsals.forEach(r => {
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
        details: `Horario: ${r.hora || '18:00'}`
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
  upcomingEvents.forEach(evt => {
    const list = eventsByDayMap.get(evt.dateStr) || [];
    list.push(evt);
    eventsByDayMap.set(evt.dateStr, list);
  });

  const fullMonthName = currentMonthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-slate-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } transition-all space-y-4`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              Agenda & Calendario
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              {agendaFilterMode === 'all' ? 'Eventos de todas las bandas' : `Eventos de ${activeBandName}`}
            </p>
          </div>
        </div>

        {/* View mode buttons & Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className={`flex items-center rounded-xl p-1 gap-1 border ${
            isStitchLight ? 'bg-slate-100 border-slate-200' : 'bg-stone-900 border-stone-800'
          }`}>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={`p-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Vista Lista Próximos"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('mini_month')}
              className={`p-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'mini_month'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Vista Mensual Compacta"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[10px]">Mes</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('weekly_grid')}
              className={`p-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'weekly_grid'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
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
              className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all border cursor-pointer flex items-center gap-1 ${
                agendaFilterMode === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 font-medium'
              }`}
              title={agendaFilterMode === 'all' ? 'Ver solo eventos de la banda activa' : 'Ver eventos de todas las bandas'}
            >
              <Users className="w-3 h-3" />
              <span>{agendaFilterMode === 'all' ? 'Todas las bandas' : (activeBandName || 'Banda activa')}</span>
            </button>
          )}

          {/* Filter Type Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetFilterType('all')}
              className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all border cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-800 text-amber-300 border-amber-500/40 font-bold'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleSetFilterType('concierto')}
              className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all border cursor-pointer ${
                filterType === 'concierto'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              Bolos
            </button>
            <button
              type="button"
              onClick={() => handleSetFilterType('ensayo')}
              className={`px-2 py-1 text-[10px] font-mono rounded-lg transition-all border cursor-pointer ${
                filterType === 'ensayo'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
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
              className="text-xs font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer ml-1"
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
                  onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: item.id, selectedDate: item.dateStr })}
                  className="p-3.5 rounded-xl bg-[#121214] border border-neutral-800/90 hover:border-amber-500/40 transition-all flex items-start gap-3 cursor-pointer hover:scale-[1.01]"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#1c1b1b] text-neutral-100 flex flex-col items-center justify-center shrink-0 border border-neutral-800 shadow-xs">
                    <span className="text-base font-mono font-black leading-none text-amber-400">
                      {item.day}
                    </span>
                    <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-amber-300 mt-0.5">
                      {item.month}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                        item.type === 'concierto'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {item.type}
                      </span>
                      {item.bandName && (
                        <span className="text-[9px] font-mono text-amber-300/80 truncate max-w-[100px]">
                          {item.bandName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold font-display tracking-wide mt-1 text-neutral-100 truncate">
                      {item.title}
                    </h4>

                    <p className="text-xs font-mono text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#121214] rounded-xl border border-neutral-800/60">
              <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-300">No hay eventos próximos en la agenda</p>
              <p className="text-xs text-neutral-500 mt-1">Añade conciertos o ensayos desde el módulo de Calendario.</p>
            </div>
          )}
        </>
      )}

      {/* VISTA 2: CALENDARIO MENSUAL COMPACTO */}
      {viewMode === 'mini_month' && (
        <div className="space-y-3">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between bg-[#121214] p-2.5 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date(year, month - 1, 1))}
              className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-mono font-bold capitalize text-amber-300">
              {fullMonthName}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonthDate(new Date(year, month + 1, 1))}
              className="p-1.5 text-neutral-400 hover:text-amber-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-[10px] text-neutral-500 font-bold py-1 uppercase">{d}</div>
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

              const hasConcert = dayEvents.some(e => e.type === 'concierto');
              const hasRehearsal = dayEvents.some(e => e.type === 'ensayo');

              return (
                <button
                  type="button"
                  key={dateKey}
                  onClick={() => setSelectedDayStr(dateKey === selectedDayStr ? null : dateKey)}
                  className={`p-1.5 min-h-[38px] rounded-lg border text-xs flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-xs'
                      : isToday
                      ? 'bg-stone-800 border-amber-500/40 text-amber-400 font-black'
                      : dayEvents.length > 0
                      ? 'bg-[#121214] border-neutral-700/80 text-neutral-100 hover:border-amber-500/30'
                      : 'bg-[#121214]/50 border-neutral-800/40 text-neutral-400 hover:bg-stone-900'
                  }`}
                >
                  <span className="leading-none">{dayNum}</span>

                  {/* Indicators for events */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {hasConcert && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-xs" title="Concierto" />}
                    {hasRehearsal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" title="Ensayo" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details for selected day if clicked */}
          {selectedDayStr && (
            <div className="p-3 bg-[#121214] rounded-xl border border-amber-500/30 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-neutral-300 pb-1.5 border-b border-neutral-800">
                <span className="font-bold text-amber-300">Eventos para {selectedDayStr}:</span>
                <button type="button" onClick={() => setSelectedDayStr(null)} className="text-neutral-500 hover:text-neutral-300">✕</button>
              </div>
              {(eventsByDayMap.get(selectedDayStr) || []).length > 0 ? (
                (eventsByDayMap.get(selectedDayStr) || []).map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: evt.id, selectedDate: evt.dateStr })}
                    className="p-2 rounded-lg bg-stone-900 border border-neutral-800 hover:border-amber-500/40 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        evt.type === 'concierto' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {evt.type}
                      </span>
                      <p className="font-bold text-neutral-100 mt-1">{evt.title}</p>
                      <p className="text-neutral-400 text-[11px]">{evt.location}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                  </div>
                ))
              ) : (
                <p className="text-neutral-400 italic">No hay eventos programados para este día.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* VISTA 3: AGENDA SEMANAL COMPACTA */}
      {viewMode === 'weekly_grid' && (
        <div className="space-y-3">
          <p className="text-xs font-mono text-neutral-400">Próximos 7 días de actividad programada:</p>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const date = new Date();
              date.setDate(date.getDate() + idx);
              const dateStr = date.toISOString().split('T')[0];
              const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
              const dayNum = date.getDate();
              const dayEvts = eventsByDayMap.get(dateStr) || [];

              return (
                <div
                  key={dateStr}
                  className={`p-2.5 rounded-xl border text-xs font-mono flex flex-col justify-between min-h-[90px] transition-all ${
                    dayEvts.length > 0
                      ? 'bg-[#121214] border-amber-500/40'
                      : 'bg-[#121214]/60 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                    <span className="uppercase text-[10px] text-neutral-400 font-bold">{dayName}</span>
                    <span className="font-bold text-amber-400">{dayNum}</span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayEvts.map(e => (
                      <div
                        key={e.id}
                        onClick={() => onNavigate && onNavigate('calendario', { selectedEventId: e.id, selectedDate: e.dateStr })}
                        className={`text-[9px] p-1 rounded font-bold truncate cursor-pointer ${
                          e.type === 'concierto' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                        title={`${e.type.toUpperCase()}: ${e.title}`}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvts.length === 0 && (
                      <span className="text-[10px] text-neutral-600 block text-center py-2">Libre</span>
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

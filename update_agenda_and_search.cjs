const fs = require('fs');

const path = 'src/components/CalendarView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update renderAgendaView to use filteredConcerts and filteredRehearsals, support past filter, show "Realizado" badge and "Editar" button.
const targetAgendaOld = `  // Render Agenda View (Google Calendar Style: lista cronológica de eventos con logos e información detallada)
  const renderAgendaView = () => {
    const allEventsList: Array<{
      date: Date;
      dateStr: string;
      type: 'concert' | 'rehearsal';
      event: Concert | Rehearsal;
    }> = [];

    const startRange = new Date(currentYear, currentMonth, 1);
    const endRange = new Date(currentYear, currentMonth + 2, 0);

    concerts.forEach(c => {
      const d = new Date(c.fecha);
      if (!isNaN(d.getTime()) && d >= startRange && d <= endRange) {
        allEventsList.push({
          date: d,
          dateStr: c.fecha.split('T')[0],
          type: 'concert',
          event: c
        });
      }
    });

    rehearsals.forEach(r => {
      const d = new Date(r.fecha);
      if (!isNaN(d.getTime()) && d >= startRange && d <= endRange) {
        allEventsList.push({
          date: d,
          dateStr: r.fecha.split('T')[0],
          type: 'rehearsal',
          event: r
        });
      }
    });

    allEventsList.sort((a, b) => a.date.getTime() - b.date.getTime());

    const groupedByDate: { [dateStr: string]: typeof allEventsList } = {};
    allEventsList.forEach(item => {
      if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
      groupedByDate[item.dateStr].push(item);
    });

    const dateKeys = Object.keys(groupedByDate).sort();

    return (
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-[#d1b375]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Agenda Cronológica ({allEventsList.length} eventos programados)
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal('concert')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#d1b375] text-stone-950 hover:bg-[#d1b375]/90 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Evento</span>
          </button>
        </div>

        {dateKeys.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">No hay eventos en este periodo</p>
            <p className="text-xs text-slate-500 mt-1">Usa el botón "Añadir Evento" o cambia de mes para ver otras fechas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dateKeys.map(dateStr => {
              const items = groupedByDate[dateStr];
              const d = new Date(dateStr + 'T12:00:00');
              const isToday = realToday.toDateString() === d.toDateString();
              const isSelected = selectedDate.toDateString() === d.toDateString();
              const dayName = fullWeekdays[(d.getDay() + 6) % 7];

              return (
                <div
                  key={dateStr}
                  className={\`rounded-xl border transition-all p-3 \${
                    isSelected
                      ? 'bg-slate-900/90 border-amber-500/60 ring-1 ring-amber-500/30'
                      : isToday
                      ? 'bg-slate-900/70 border-amber-500/40'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className={\`text-xs font-mono font-bold px-2 py-0.5 rounded \${
                        isToday ? 'bg-amber-500 text-stone-950 font-black' : 'bg-slate-800 text-slate-300'
                      }\`}>
                        {dayName}, {d.getDate()} de {monthNames[d.getMonth()]}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Hoy
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDate(d);
                        setShowCreateModal('concert');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      title="Añadir a esta fecha"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {items.map(({ type, event: evt }) => {
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
                          className={\`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-all \${
                            isEvtSelected
                              ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                              : isConcert
                              ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/80 hover:bg-amber-900/20'
                              : isReu
                              ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-400/80 hover:bg-indigo-900/20'
                              : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/80 hover:bg-emerald-900/20'
                          }\`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo o iniciales de la banda */}
                            {bandInfo.logoUrl ? (
                              <img
                                src={bandInfo.logoUrl}
                                alt={bandInfo.name}
                                className="w-8 h-8 rounded-full object-contain bg-black/60 p-0.5 shrink-0 border border-white/20 shadow-xs"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                  if (fb) (fb as HTMLElement).classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={\`fallback-initials w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black shadow-xs \${bandInfo.palette.badge} \${bandInfo.logoUrl ? 'hidden' : ''}\`}>
                              {bandInfo.initials}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={\`text-xs font-bold font-mono px-1.5 py-0.2 rounded border \${
                                  isConcert
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : isReu
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }\`}>
                                  {isConcert ? '🎸 Concierto' : isReu ? '🤝 Reunión' : '🥁 Ensayo'}
                                </span>
                                <span className="text-xs font-bold text-white truncate">
                                  {bandInfo.name}
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{isConcert ? \`\${c?.sala}\${c?.ciudad ? \` (\${c?.ciudad})\` : ''}\` : isReu ? (r?.asunto || 'Reunión de coordinación') : r?.lugar}</span>
                                {isConcert && c?.ciudad && (() => {
                                  const alerts = getCachedEventWeatherAlerts(c.ciudad, dateStr);
                                  return alerts[0] ? <CalendarWeatherBadge alert={alerts[0]} /> : null;
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {((evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : '')) && (
                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {((evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : ''))}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-500" />
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
  };`;

const replAgendaNew = `  // Render Agenda View (Google Calendar Style: lista cronológica de eventos con logos e información detallada)
  const renderAgendaView = () => {
    const allEventsList: Array<{
      date: Date;
      dateStr: string;
      type: 'concert' | 'rehearsal';
      event: Concert | Rehearsal;
      isPast: boolean;
    }> = [];

    // Usamos filteredConcerts y filteredRehearsals para respetar búsqueda por texto y banda activa
    filteredConcerts.forEach(c => {
      const d = new Date(c.fecha + (c.fecha.includes('T') ? '' : 'T12:00:00'));
      if (!isNaN(d.getTime())) {
        const dateOnlyStr = c.fecha.split('T')[0];
        const isPast = dateOnlyStr < todayStr;
        
        // Filtrar según el selector de pasado / futuro de la agenda si no está en 'all'
        if (agendaFilterPast === 'future' && isPast) return;
        if (agendaFilterPast === 'past' && !isPast) return;

        // Si hay búsqueda por texto, mostramos sin restricción de mes. Si no hay búsqueda, limitamos al rango de vista o permitimos ver todo si se selecciona ver pasados
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

    filteredRehearsals.forEach(r => {
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
    allEventsList.forEach(item => {
      if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
      groupedByDate[item.dateStr].push(item);
    });

    const dateKeys = Object.keys(groupedByDate).sort();

    return (
      <div className="w-full flex flex-col gap-4">
        {/* Agenda Sub-Header con Filtro de Pasados / Futuros y Añadir Evento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <List className="w-4 h-4 text-[#d1b375]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Agenda Cronológica ({allEventsList.length} eventos)
            </span>
            {calendarSearchTerm.trim() && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Filtrado por: "{calendarSearchTerm}"
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de periodo para ver conciertos pasados y futuros en la agenda */}
            <div className={\`flex items-center rounded-lg p-0.5 border text-xs font-mono font-bold \${
              isStitchLight ? "bg-slate-200 border-slate-300 text-slate-800" : "bg-neutral-900 border-zinc-800 text-neutral-300"
            }\`}>
              <button
                type="button"
                onClick={() => setAgendaFilterPast('all')}
                className={\`px-2.5 py-1 rounded transition-all cursor-pointer \${
                  agendaFilterPast === 'all'
                    ? isStitchLight ? "bg-white text-slate-900 shadow-xs" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
                }\`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setAgendaFilterPast('future')}
                className={\`px-2.5 py-1 rounded transition-all cursor-pointer \${
                  agendaFilterPast === 'future'
                    ? isStitchLight ? "bg-white text-slate-900 shadow-xs" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
                }\`}
              >
                Próximos
              </button>
              <button
                type="button"
                onClick={() => setAgendaFilterPast('past')}
                className={\`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1 \${
                  agendaFilterPast === 'past'
                    ? isStitchLight ? "bg-white text-slate-900 shadow-xs" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
                }\`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Pasados / Realizados</span>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal('concert')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#d1b375] text-stone-950 hover:bg-[#d1b375]/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Evento</span>
            </button>
          </div>
        </div>

        {dateKeys.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/40">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-400">No hay eventos en este periodo</p>
            <p className="text-xs text-slate-500 mt-1">
              {agendaFilterPast === 'past'
                ? "No se han encontrado conciertos pasados registrados."
                : "Usa el botón \\"Añadir Evento\\", cambia el filtro a 'Todos' o ajusta la búsqueda por palabras clave."}
            </p>
            {agendaFilterPast !== 'all' && (
              <button
                onClick={() => setAgendaFilterPast('all')}
                className="mt-3 px-3 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-all border border-amber-500/30"
              >
                Ver todos los eventos
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {dateKeys.map(dateStr => {
              const items = groupedByDate[dateStr];
              const d = new Date(dateStr + 'T12:00:00');
              const isToday = realToday.toDateString() === d.toDateString();
              const isSelected = selectedDate.toDateString() === d.toDateString();
              const dayName = fullWeekdays[(d.getDay() + 6) % 7];
              const isDatePast = dateStr < todayStr;

              return (
                <div
                  key={dateStr}
                  className={\`rounded-xl border transition-all p-3 \${
                    isSelected
                      ? 'bg-slate-900/90 border-amber-500/60 ring-1 ring-amber-500/30'
                      : isToday
                      ? 'bg-slate-900/70 border-amber-500/40'
                      : isDatePast
                      ? 'bg-slate-950/50 border-slate-800/50 opacity-95'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={\`text-xs font-mono font-bold px-2 py-0.5 rounded \${
                        isToday ? 'bg-amber-500 text-stone-950 font-black' : isDatePast ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-800 text-slate-300'
                      }\`}>
                        {dayName}, {d.getDate()} de {monthNames[d.getMonth()]} {d.getFullYear() !== currentYear ? d.getFullYear() : ''}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Hoy
                        </span>
                      )}
                      {isDatePast && !isToday && (
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Realizado</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDate(d);
                        setShowCreateModal('concert');
                      }}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      title="Añadir a esta fecha"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
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
                          className={\`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-all \${
                            isEvtSelected
                              ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                              : isConcert
                              ? isPast
                                ? 'bg-amber-950/15 border-amber-500/20 hover:border-amber-400/60 hover:bg-amber-900/20'
                                : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/80 hover:bg-amber-900/20'
                              : isReu
                              ? 'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-400/80 hover:bg-indigo-900/20'
                              : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/80 hover:bg-emerald-900/20'
                          }\`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo o iniciales de la banda */}
                            {bandInfo.logoUrl ? (
                              <img
                                src={bandInfo.logoUrl}
                                alt={bandInfo.name}
                                className="w-8 h-8 rounded-full object-contain bg-black/60 p-0.5 shrink-0 border border-white/20 shadow-xs"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                  if (fb) (fb as HTMLElement).classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={\`fallback-initials w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black shadow-xs \${bandInfo.palette.badge} \${bandInfo.logoUrl ? 'hidden' : ''}\`}>
                              {bandInfo.initials}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={\`text-xs font-bold font-mono px-1.5 py-0.2 rounded border \${
                                  isConcert
                                    ? isPast
                                      ? 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : isReu
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }\`}>
                                  {isConcert ? '🎸 Concierto' : isReu ? '🤝 Reunión' : '🥁 Ensayo'}
                                </span>
                                {isPast && (
                                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Realizado</span>
                                  </span>
                                )}
                                <span className="text-xs font-bold text-white truncate">
                                  {bandInfo.name}
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{isConcert ? \`\${c?.sala}\${c?.ciudad ? \` (\${c?.ciudad})\` : ''}\` : isReu ? (r?.asunto || 'Reunión de coordinación') : r?.lugar}</span>
                                {isConcert && c?.ciudad && (() => {
                                  const alerts = getCachedEventWeatherAlerts(c.ciudad, dateStr);
                                  return alerts[0] ? <CalendarWeatherBadge alert={alerts[0]} /> : null;
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            {((evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : '')) && (
                              <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-neutral-500" />
                                {((evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) : ''))}
                              </span>
                            )}
                            
                            {/* Botón directo de Editar para ver y editar conciertos pasados o futuros */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isConcert && c) {
                                  setViewingConcert(c);
                                } else if (r) {
                                  setViewingRehearsal(r);
                                }
                              }}
                              className="px-2 py-1 text-[11px] font-mono font-bold rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                              title={isPast ? "Editar datos, notas o caché del bolo realizado" : "Editar evento"}
                            >
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                            </button>

                            <ChevronRight className="w-4 h-4 text-slate-500" />
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
  };`;

if (!content.includes(targetAgendaOld)) {
  console.error("targetAgendaOld not found in CalendarView.tsx");
  process.exit(1);
}

content = content.replace(targetAgendaOld, replAgendaNew);

// 2. Add Search Bar to the calendar toolbar right above or alongside month navigation
const targetNavHeader = `          {/* Month Navigation & Band Selector */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-3 pt-2">
      {/* Left: Navigation Buttons + Month/Period Title (Rock-solid, never jumps) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">`;

const replNavHeader = `          {/* Quick Search Bar across calendar events (Palabras clave, sala, ciudad, banda, evento) */}
          <div className="mt-3 pt-2">
            <div className="flex items-center gap-2">
              <div className={\`relative flex-1 flex items-center rounded-xl border transition-all \${
                isStitchLight
                  ? "bg-white border-slate-300 focus-within:border-sky-500 shadow-xs"
                  : "bg-neutral-900/90 border-zinc-800 focus-within:border-amber-500/80 shadow-inner"
              }\`}>
                <Search className="w-4 h-4 ml-3 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={calendarSearchTerm}
                  onChange={(e) => setCalendarSearchTerm(e.target.value)}
                  placeholder="Buscar evento, sala, ciudad, artista, notas (ej. Joy Eslava, Madrid, acústico)..."
                  className={\`w-full px-2.5 py-1.5 text-xs font-sans bg-transparent outline-none \${
                    isStitchLight ? "text-slate-900 placeholder:text-slate-400" : "text-neutral-100 placeholder:text-neutral-500"
                  }\`}
                />
                {calendarSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCalendarSearchTerm('')}
                    className="p-1 mr-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {calendarSearchTerm && (
                <div className="text-[11px] font-mono shrink-0 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {filteredConcerts.length + filteredRehearsals.length} resultados
                </div>
              )}
            </div>
          </div>

          {/* Month Navigation & Band Selector */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-3 pt-2">
      {/* Left: Navigation Buttons + Month/Period Title (Rock-solid, never jumps) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">`;

if (!content.includes(targetNavHeader)) {
  console.error("targetNavHeader not found in CalendarView.tsx");
  process.exit(1);
}

content = content.replace(targetNavHeader, replNavHeader);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated CalendarView.tsx with Agenda Editing and Search Bar!");

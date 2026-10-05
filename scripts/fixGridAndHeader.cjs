const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace from `// Render month grid function` down to `{/* Month Navigation & Band Selector */}`
const startMarker = "// Render month grid function";
const endMarker = "{/* Month Navigation & Band Selector */}";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found!");
  process.exit(1);
}

const replacement = `// Render month grid function
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
      <div key={\`month-grid-\${year}-\${month}\`} className="flex-1 min-w-[280px]">
        {showMonthHeader && (
          <div className={\`text-center font-bold font-display uppercase tracking-wider text-[10px] mb-3 pb-1 \${
            isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'
          }\`}>
            {monthNames[month]} {year}
          </div>
        )}

        {/* Weekday Labels */}
        <div className={\`grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono mb-2.5 font-bold uppercase \${textSub} bg-slate-950/60 p-2 rounded-xl border border-slate-800/80\`}>
          {weekdays.map(day => (
            <div key={day} className="py-0.5 tracking-wider">{day}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell, index) => {
            if (cell.empty) {
              return <div key={\`empty-\${year}-\${month}-\${index}\`} className="aspect-square bg-transparent rounded-lg" />;
            }

            const formattedDate = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(cell.day).padStart(2, '0')}\`;
            const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(formattedDate);
            const dayCampaigns = getCampaignsForDate(formattedDate);
            const hasConcert = dayConcerts.length > 0;
            const dayRehearsalsOnly = dayRehearsals.filter(r => r.tipo_evento !== 'reunion');
            const dayReunions = dayRehearsals.filter(r => r.tipo_evento === 'reunion');
            const hasRehearsal = dayRehearsalsOnly.length > 0;
            const hasReunion = dayReunions.length > 0;
            const hasCampaign = dayCampaigns.length > 0;
            const dayEvents: Array<Concert | Rehearsal> = [...dayConcerts, ...dayRehearsals];

            const isSelected = selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === month &&
              selectedDate.getDate() === cell.day;

            const isToday = isThisRealMonth && cell.day === realToday.getDate();

            // Stylish border logic for non-selected vs event vs selected days
            let borderAndBgClass = "";
            if (isSelected) {
              borderAndBgClass = isStitchLight
                ? 'bg-sky-500 text-white font-extrabold border-2 border-sky-300 shadow-xl shadow-sky-500/20 scale-[1.05] z-20'
                : 'bg-amber-500 text-slate-950 font-black border-2 border-amber-300 shadow-xl shadow-amber-500/25 scale-[1.05] z-20';
            } else if (isToday) {
              borderAndBgClass = 'bg-amber-500/15 text-amber-300 font-bold border-2 border-amber-500/80 shadow-md shadow-amber-500/10 hover:border-amber-400 z-10';
            } else if (hasConcert && hasRehearsal) {
              borderAndBgClass = 'bg-gradient-to-br from-amber-950/40 to-emerald-950/40 border border-amber-500/50 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 text-white';
            } else if (hasConcert) {
              borderAndBgClass = 'bg-amber-950/20 border border-amber-500/40 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 text-amber-200';
            } else if (hasRehearsal) {
              borderAndBgClass = 'bg-emerald-950/20 border border-emerald-500/40 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 text-emerald-200';
            } else if (hasReunion) {
              borderAndBgClass = 'bg-indigo-950/25 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10 text-indigo-200';
            } else if (hasCampaign) {
              borderAndBgClass = 'bg-purple-950/30 border border-purple-500/50 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/20 text-purple-200';
            } else {
              borderAndBgClass = isStitchLight
                ? 'bg-white border border-slate-200 hover:border-sky-400 hover:bg-slate-50 text-slate-800 shadow-xs'
                : 'bg-slate-900/80 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/80 hover:shadow-md hover:shadow-amber-500/10 text-slate-200 shadow-xs';
            }

            return (
              <button
                key={\`day-\${year}-\${month}-\${cell.day}\`}
                onClick={() => handleSelectDate(year, month, cell.day)}
                className={\`relative aspect-square p-1 sm:p-1.5 rounded-xl flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden \${borderAndBgClass}\`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={\`text-[11px] sm:text-xs font-mono font-bold \${isSelected ? 'text-stone-950 font-black' : isToday ? 'text-amber-400' : ''}\`}>
                    {cell.day}
                  </span>
                  {isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-ping" />
                  )}
                </div>

                {/* Mini Badges / Event Indicators */}
                <div className="w-full space-y-0.5 overflow-hidden">
                  {dayConcerts.slice(0, 1).map(c => (
                    <div
                      key={c.id}
                      className={\`text-[8px] sm:text-[9px] font-mono font-bold truncate px-1 py-0.5 rounded \${
                        isSelected ? 'bg-stone-950/20 text-stone-950' : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      }\`}
                      title={\`Concierto: \${c.sala} (\${c.ciudad})\`}
                    >
                      🎸 {c.ciudad || c.sala}
                    </div>
                  ))}
                  {dayRehearsals.slice(0, 1).map(r => {
                    const isReu = r.tipo_evento === 'reunion';
                    return (
                      <div
                        key={r.id}
                        className={\`text-[8px] sm:text-[9px] font-mono font-bold truncate px-1 py-0.5 rounded \${
                          isSelected
                            ? 'bg-stone-950/20 text-stone-950'
                            : isReu
                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                            : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                        }\`}
                        title={isReu ? \`Reunión: \${r.asunto || r.lugar}\` : \`Ensayo: \${r.lugar}\`}
                      >
                        {isReu ? '🤝' : '🥁'} {isReu ? (r.asunto || 'Reunión') : (r.lugar.split(',')[0])}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[8px] font-mono text-center opacity-80">
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

  return (
    <div className={\`grid grid-cols-1 lg:grid-cols-3 gap-6 \${isStitchLight ? 'text-slate-800' : 'text-[#e5e2e1]'} font-sans items-stretch w-full max-w-full overflow-x-hidden\`}>
      {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
      <div className={\`\${colors.card} p-6 flex flex-col justify-between lg:col-span-2\`}>
        <div>
          {/* Header */}
          <div className={\`pb-4 mb-4 border-b \${isStitchLight ? "border-slate-200" : "border-zinc-800"}\`}>
            {/* Top title & Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className={\`text-[10px] font-mono uppercase tracking-widest \${isStitchLight ? "text-sky-500 font-bold" : "text-[#f2ca50]"}\`}>
                  Calendario de Directos, Ensayos y Reuniones
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold mt-1 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1" title="Eventos visibles vs Total">
                    <Calendar className="w-3 h-3" /> {filteredConcerts.length + filteredRehearsals.length}/{concerts.length + rehearsals.length}
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1 border border-emerald-500/20" title="Directos y conciertos públicos">
                    <Mic className="w-3 h-3 text-emerald-400" /> {filteredConcerts.length} directos
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 flex items-center gap-1 border border-purple-500/20" title="Ensayos de banda">
                    <DoorClosed className="w-3 h-3 text-purple-400" /> {filteredRehearsals.filter(r => r.tipo_evento !== 'reunion').length} ensayos
                  </span>
                  {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center gap-1 border border-indigo-500/20" title="Reuniones de coordinación">
                      <span>🤝</span> {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length} reuniones
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <ModuleTutorialTrigger
                  moduleId="calendario"
                  onClick={openTutorial}
                  label="Guía rápida"
                />

                {/* Unified Add Event Button (Prevents button clutter) */}
                <div className="relative inline-block text-left">
                  <button
                    id="create-event-unified-btn"
                    onClick={() => setShowAddEventDropdown(!showAddEventDropdown)}
                    className={\`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs \${
                      isStitchLight
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-[#d1b375] hover:bg-[#e2c486] text-stone-950 font-bold"
                    }\`}
                    title="Añadir Concierto, Ensayo o Reunión"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Evento</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
                  </button>

                  {showAddEventDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAddEventDropdown(false)} />
                      <div className={\`absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl z-50 py-1.5 border overflow-hidden animate-in fade-in duration-150 backdrop-blur-md \${
                        isStitchLight ? "bg-white/95 border-slate-200 text-slate-800" : "bg-neutral-900/95 border-zinc-800 text-neutral-100"
                      }\`}>
                        <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800/40 mb-1">
                          Añadir al Calendario
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('concert'); }}
                          className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-amber-500/15 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <span>🎸</span>
                          <span>+ Concierto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('rehearsal'); }}
                          className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <span>🥁</span>
                          <span>+ Ensayo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('reunion'); }}
                          className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-indigo-500/15 hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <span>🤝</span>
                          <span>+ Reunión</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {!isPromoPlan && (
                  <button
                    id="export-ics-btn"
                    onClick={() => setShowSyncModal(true)}
                    className={\`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs \${
                      isStitchLight
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300/80"
                        : "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30"
                    }\`}
                    title="Sincronizar automáticamente con Google Calendar, Apple Calendar o Outlook"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Sincronizar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

code = code.slice(0, startIndex) + replacement + code.slice(endIndex);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed grid and header replacement.');

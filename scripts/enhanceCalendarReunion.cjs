const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update showCreateModal state
code = code.replace(
  /const \[showCreateModal, setShowCreateModal\] = useState<'rehearsal' \| 'concert' \| null>\(null\);/,
  `const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | 'reunion' | null>(null);
  const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

  // Form fields for new Reunion
  const [reuHora, setReuHora] = useState('19:30 - 20:30');
  const [reuLugar, setReuLugar] = useState('Online (Google Meet)');
  const [reuAsunto, setReuAsunto] = useState('Coordinación de gira y tareas');
  const [reuEnlace, setReuEnlace] = useState('');
  const [reuNotas, setReuNotas] = useState('1. Repasar próximas fechas y logística.\\n2. Presupuestos y gastos.\\n3. Nuevos temas del repertorio.');
  const [reuEstado, setReuEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');`
);

// 2. Update handleSaveRehearsalEdit
code = code.replace(
  /const handleSaveRehearsalEdit = \([\s\S]*?setViewingRehearsal\(null\);[\s\S]*?setTimeout\(\(\) => setSyncSuccessMessage\(''\), 5000\);\s*};/,
  `const handleSaveRehearsalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRehearsal || !editRehearsalDraft) return;
    const isReu = editRehearsalDraft.tipo_evento === 'reunion';
    onUpdateRehearsal(viewingRehearsal.id, {
      fecha: editRehearsalDraft.fecha,
      hora: editRehearsalDraft.hora?.trim() || '',
      lugar: editRehearsalDraft.lugar?.trim() || (isReu ? 'Online' : 'Local de Ensayo'),
      tipo_evento: editRehearsalDraft.tipo_evento || 'ensayo',
      asunto: editRehearsalDraft.asunto?.trim() || undefined,
      enlace_reunion: editRehearsalDraft.enlace_reunion?.trim() || undefined,
      estado: editRehearsalDraft.estado || 'programado',
      notas: editRehearsalDraft.notas?.trim() || '',
      convocatoria_tipo: editRehearsalDraft.convocatoria_tipo,
      convocados_ids: editRehearsalDraft.convocados_ids,
      setlistId: editRehearsalDraft.setlistId || undefined
    });
    setViewingRehearsal(null);
    setSyncSuccessMessage(\`¡\${isReu ? 'Reunión' : 'Ensayo'} \${isReu ? (editRehearsalDraft.asunto || 'actualizada') : \`en \${editRehearsalDraft.lugar}\`} actualizada!\`);
    setTimeout(() => setSyncSuccessMessage(''), 5000);
  };`
);

// 3. Add handleSaveNewReunion
const reunionFunc = `  const handleSaveNewReunion = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedDate = \`\${selectedDate.getFullYear()}-\${String(selectedDate.getMonth() + 1).padStart(2, '0')}-\${String(selectedDate.getDate()).padStart(2, '0')}\`;
    const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
    const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
    const newReunion: Rehearsal = {
      id: \`reu-\${Date.now()}\`,
      fecha: formattedDate,
      hora: reuHora.trim() || '19:30 - 20:30',
      lugar: reuLugar.trim() || 'Online (Google Meet)',
      tipo_evento: 'reunion',
      asunto: reuAsunto.trim() || 'Reunión de Banda',
      enlace_reunion: reuEnlace.trim() || undefined,
      asistentes: convocatoriaTipo === 'completa' ? ['Banda Completa'] : selectedMembers.map(m => m.name),
      notas: reuNotas.trim() || 'Orden del día',
      estado: reuEstado,
      band_id: targetBand.band_id,
      bandName: targetBand.bandName,
      convocatoria_tipo: convocatoriaTipo,
      convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
      convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map(m => m.name) : undefined,
    };

    if (onAddRehearsal) {
      onAddRehearsal(newReunion);
      setSyncSuccessMessage(\`¡Reunión de \${targetBand.bandName} convocada para el \${formattedDate}!\`);
      setTimeout(() => setSyncSuccessMessage(''), 5000);
    }
    setShowCreateModal(null);
  };`;

if (!code.includes('handleSaveNewReunion')) {
  code = code.replace(
    /const handleSaveNewConcert = \(e: React.FormEvent\) => {/,
    `${reunionFunc}\n\n  const handleSaveNewConcert = (e: React.FormEvent) => {`
  );
}

// 4. Update upcomingCalendarEvents mapping for rehearsals & reunions
code = code.replace(
  /filteredRehearsals\.forEach\(r => {[\s\S]*?list\.push\({[\s\S]*?type: 'ensayo',[\s\S]*?badge: r\.estado === 'completado' \? 'Completado' : 'Programado'[\s\S]*?}\);[\s\S]*?}\);/,
  `filteredRehearsals.forEach(r => {
    if (!r.fecha || r.fecha < todayStr) return;
    const parts = r.fecha.split('-');
    if (parts.length !== 3) return;
    const day = parts[2];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';
    const isReu = r.tipo_evento === 'reunion';

    list.push({
      id: r.id,
      type: (isReu ? 'reunion' : 'ensayo') as any,
      title: isReu ? (r.asunto || 'Reunión de Banda') : (r.lugar ? \`Ensayo en \${r.lugar}\` : 'Ensayo General'),
      fecha: r.fecha,
      day,
      month,
      salaOrLugar: isReu ? (r.lugar || 'Online') : (r.lugar || 'Local de Ensayo'),
      ciudad: undefined,
      direccion: undefined,
      locationQuery: isReu ? (r.lugar && !r.lugar.toLowerCase().includes('online') && !r.lugar.toLowerCase().includes('http') ? r.lugar : undefined) : \`\${r.lugar || 'Local de Ensayo'}, Madrid\`,
      bandName: getEventBandName(r),
      badge: isReu ? (r.estado === 'completado' ? 'Realizada' : 'Convocada') : (r.estado === 'completado' ? 'Completado' : 'Programado')
    });
  });`
);

// 5. Update top counter
code = code.replace(
  /<DoorClosed className="w-3 h-3 text-purple-400" \/> \{filteredRehearsals\.length\} ensayos/,
  `<DoorClosed className="w-3 h-3 text-purple-400" /> {filteredRehearsals.filter(r => r.tipo_evento !== 'reunion').length} ensayos
          </span>
          {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length > 0 && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center gap-1 border border-indigo-500/20" title="Reuniones de coordinación y banda">
              <span>🤝</span> {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length} reuniones`
);

// 6. Update action buttons (Replace separate + Ensayo and + Concierto with unified + Evento)
const oldButtonsRegex = /<button[\s\S]*?id="create-rehearsal-btn"[\s\S]*?<\/button>\s*<button[\s\S]*?id="create-concert-btn"[\s\S]*?<\/button>/;
const newUnifiedButton = `<div className="relative inline-block text-left">
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
              <div className={\`absolute right-0 mt-1.5 w-44 rounded-xl shadow-2xl z-50 py-1.5 border overflow-hidden animate-in fade-in duration-150 backdrop-blur-md \${
                isStitchLight ? "bg-white/95 border-slate-200 text-slate-800" : "bg-neutral-900/95 border-zinc-800 text-neutral-100"
              }\`}>
                <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800/40 mb-1">
                  Tipo de Evento
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('concert'); }}
                  className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-amber-500/15 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <span>🎸</span>
                  <span>Concierto</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('rehearsal'); }}
                  className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>🥁</span>
                  <span>Ensayo</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('reunion'); }}
                  className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-indigo-500/15 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <span>🤝</span>
                  <span>Reunión</span>
                </button>
              </div>
            </>
          )}
        </div>`;

if (oldButtonsRegex.test(code)) {
  code = code.replace(oldButtonsRegex, newUnifiedButton);
  console.log('Action buttons replaced with unified + Evento button.');
} else {
  console.warn('Old buttons regex not matched!');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Enhancements part 1 applied successfully.');

const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'CalendarView.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update showCreateModal state and add reunion fields
const stateOld = `  // Creation Modals state\n  const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | null>(null);`;
const stateNew = `  // Creation Modals state
  const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | 'reunion' | null>(null);
  const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

  // Form fields for new Reunion
  const [reuHora, setReuHora] = useState('19:30 - 20:30');
  const [reuLugar, setReuLugar] = useState('Online (Google Meet)');
  const [reuAsunto, setReuAsunto] = useState('Coordinación de gira y tareas');
  const [reuEnlace, setReuEnlace] = useState('');
  const [reuNotas, setReuNotas] = useState('1. Repasar próximas fechas y logística.\\n2. Presupuestos y gastos.\\n3. Nuevos temas del repertorio.');
  const [reuEstado, setReuEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');`;

if (content.includes(stateOld)) {
  content = content.replace(stateOld, stateNew);
  console.log('1. Updated showCreateModal and added reunion state.');
} else {
  console.warn('1. State pattern not matched!');
}

// 2. Update handleSaveRehearsalEdit to include reunion fields
const editRehearsalOld = `  const handleSaveRehearsalEdit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!viewingRehearsal || !editRehearsalDraft) return;
  onUpdateRehearsal(viewingRehearsal.id, {
  fecha: editRehearsalDraft.fecha,
  hora: editRehearsalDraft.hora?.trim() || '',
  lugar: editRehearsalDraft.lugar?.trim() || 'Local de Ensayo',
  estado: editRehearsalDraft.estado || 'programado',
  notas: editRehearsalDraft.notas?.trim() || '',
  convocatoria_tipo: editRehearsalDraft.convocatoria_tipo,
  convocados_ids: editRehearsalDraft.convocados_ids,
  setlistId: editRehearsalDraft.setlistId || undefined
  });
  setViewingRehearsal(null);
  setSyncSuccessMessage(\`¡Ensayo en \${editRehearsalDraft.lugar} actualizado!\`);
  setTimeout(() => setSyncSuccessMessage(''), 5000);
  };`;

const editRehearsalNew = `  const handleSaveRehearsalEdit = (e: React.FormEvent) => {
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
  };`;

if (content.includes(editRehearsalOld)) {
  content = content.replace(editRehearsalOld, editRehearsalNew);
  console.log('2. Updated handleSaveRehearsalEdit.');
} else {
  console.warn('2. handleSaveRehearsalEdit pattern not matched directly, checking normalized...');
  // try replacing with regex
  const regexReh = /const handleSaveRehearsalEdit = \([\s\S]*?setSyncSuccessMessage\('', 5000\);\s*};/;
  if (regexReh.test(content)) {
    content = content.replace(regexReh, editRehearsalNew.trim());
    console.log('2. Updated handleSaveRehearsalEdit via regex.');
  }
}

// 3. Add handleSaveNewReunion right after handleSaveNewRehearsal
const newReunionHandler = `  const handleSaveNewReunion = (e: React.FormEvent) => {
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

const rehSaveAnchor = `setShowCreateModal(null);\n  };\n\n  const handleSaveNewConcert`;
if (content.includes(rehSaveAnchor)) {
  content = content.replace(rehSaveAnchor, `setShowCreateModal(null);\n  };\n\n${newReunionHandler}\n\n  const handleSaveNewConcert`);
  console.log('3. Added handleSaveNewReunion.');
} else {
  console.warn('3. handleSaveNewRehearsal anchor not matched!');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Base changes written to CalendarView.tsx');

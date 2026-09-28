import React, { useState, useEffect } from 'react';
import { Concert, Rehearsal } from '../../types';
import { ModalPortal } from '../common/ModalPortal';

interface CalendarCreateEventModalProps {
  showCreateModal: 'rehearsal' | 'concert' | 'reunion' | null;
  setShowCreateModal: (v: 'rehearsal' | 'concert' | 'reunion' | null) => void;
  selectedDate: Date;
  isStitchLight?: boolean;
  effectiveBandsList: Array<{ band_id: string; bandName: string }>;
  activeBandId: string;
  activeBandName: string;
  effectiveBandMembers: Array<{ id: string; name: string; instrument?: string }>;
  onAddRehearsal?: (rehearsal: Rehearsal) => void;
  onAddConcert?: (concert: Concert) => void;
  setSyncSuccessMessage?: (msg: string) => void;
  availableSetlists?: any[];
}

export const CalendarCreateEventModal: React.FC<CalendarCreateEventModalProps> = ({
  showCreateModal,
  setShowCreateModal,
  selectedDate,
  isStitchLight = false,
  effectiveBandsList,
  activeBandId,
  activeBandName,
  effectiveBandMembers,
  onAddRehearsal,
  onAddConcert,
  setSyncSuccessMessage,
  availableSetlists = [],
}) => {
  const [selectedBandIdForNewEvent, setSelectedBandIdForNewEvent] = useState(activeBandId);
  const [convocatoriaTipo, setConvocatoriaTipo] = useState<'completa' | 'parcial'>('completa');
  const [convocadosIds, setConvocadosIds] = useState<string[]>([]);

  // Reunion fields
  const [reuHora, setReuHora] = useState('19:30 - 20:30');
  const [reuLugar, setReuLugar] = useState('Online (Google Meet)');
  const [reuAsunto, setReuAsunto] = useState('Coordinación de gira y tareas');
  const [reuEnlace, setReuEnlace] = useState('');
  const [reuNotas, setReuNotas] = useState(
    '1. Repasar próximas fechas y logística.\n2. Presupuestos y gastos.\n3. Nuevos temas del repertorio.'
  );
  const [reuEstado, setReuEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');

  // Rehearsal fields
  const [rehTime, setRehTime] = useState('18:00 - 21:00');
  const [rehLugar, setRehLugar] = useState('Locales de Ensayo');
  const [rehNotas, setRehNotas] = useState('Ensayo general de repertorio directo');
  const [rehEstado, setRehEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');
  const [rehSetlistId, setRehSetlistId] = useState<string>('');

  // Concert fields
  const [concCiudad, setConcCiudad] = useState('Madrid');
  const [concSala, setConcSala] = useState('');
  const [concCache, setConcCache] = useState('1200');
  const [concAforo, setConcAforo] = useState('300');
  const [concContrato, setConcContrato] = useState(true);
  const [concEstadoPago, setConcEstadoPago] = useState<'pendiente' | 'pagado' | 'anticipo'>('pendiente');
  const [concTipo, setConcTipo] = useState<'propio' | 'festival' | 'privado'>('propio');
  const [concNotas, setConcNotas] = useState('Concierto agendado desde el calendario');
  const [concIdioma, setConcIdioma] = useState('');
  const [concSetlistId, setConcSetlistId] = useState<string>('');
  const [concIsPosible, setConcIsPosible] = useState(false);

  useEffect(() => {
    if (showCreateModal) {
      setSelectedBandIdForNewEvent(activeBandId);
      setConvocatoriaTipo('completa');
      setConvocadosIds(effectiveBandMembers.map((m) => m.id));
    }
  }, [showCreateModal, activeBandId, effectiveBandMembers]);

  if (!showCreateModal) return null;

  const formattedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const handleSaveNewReunion = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBand = effectiveBandsList.find((b) => b.band_id === selectedBandIdForNewEvent) || {
      band_id: activeBandId,
      bandName: activeBandName,
    };
    const selectedMembers = effectiveBandMembers.filter((m) => convocadosIds.includes(m.id));

    const newReunion: Rehearsal = {
      id: `reu-${Date.now()}`,
      fecha: formattedDateStr,
      hora: reuHora.trim() || '19:30 - 20:30',
      lugar: reuLugar.trim() || 'Online (Google Meet)',
      tipo_evento: 'reunion',
      asunto: reuAsunto.trim() || 'Reunión de Banda',
      enlace_reunion: reuEnlace.trim() || undefined,
      asistentes: convocatoriaTipo === 'completa' ? ['Banda Completa'] : selectedMembers.map((m) => m.name),
      notas: reuNotas.trim() || 'Orden del día',
      estado: reuEstado,
      band_id: targetBand.band_id,
      bandName: targetBand.bandName,
      convocatoria_tipo: convocatoriaTipo,
      convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
      convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map((m) => m.name) : undefined,
    };

    if (onAddRehearsal) {
      onAddRehearsal(newReunion);
      if (setSyncSuccessMessage) {
        setSyncSuccessMessage(`¡Reunión de ${targetBand.bandName} convocada para el ${formattedDateStr}!`);
        setTimeout(() => setSyncSuccessMessage(''), 5000);
      }
    }
    setShowCreateModal(null);
  };

  const handleSaveNewRehearsal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBand = effectiveBandsList.find((b) => b.band_id === selectedBandIdForNewEvent) || {
      band_id: activeBandId,
      bandName: activeBandName,
    };
    const selectedMembers = effectiveBandMembers.filter((m) => convocadosIds.includes(m.id));

    const newRehearsal: Rehearsal = {
      id: `reh-${Date.now()}`,
      fecha: formattedDateStr,
      hora: rehTime.trim() || '18:00 - 21:00',
      lugar: rehLugar.trim() || 'Locales de Ensayo',
      asistentes: convocatoriaTipo === 'completa' ? ['Banda Completa'] : selectedMembers.map((m) => m.name),
      notas: rehNotas.trim() || 'Ensayo general',
      estado: rehEstado,
      band_id: targetBand.band_id,
      bandName: targetBand.bandName,
      convocatoria_tipo: convocatoriaTipo,
      convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
      convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map((m) => m.name) : undefined,
      setlistId: rehSetlistId || undefined,
    };

    if (onAddRehearsal) {
      onAddRehearsal(newRehearsal);
      if (setSyncSuccessMessage) {
        setSyncSuccessMessage(`¡Ensayo de ${targetBand.bandName} creado para el ${formattedDateStr}!`);
        setTimeout(() => setSyncSuccessMessage(''), 5000);
      }
    }
    setShowCreateModal(null);
  };

  const handleSaveNewConcert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBand = effectiveBandsList.find((b) => b.band_id === selectedBandIdForNewEvent) || {
      band_id: activeBandId,
      bandName: activeBandName,
    };
    const selectedMembers = effectiveBandMembers.filter((m) => convocadosIds.includes(m.id));

    const newConcert: Concert = {
      id: `conc-${Date.now()}`,
      fecha: formattedDateStr,
      ciudad: concCiudad.trim() || 'Madrid',
      sala: concSala.trim() || 'Sala Directo',
      cache: Number(concCache) || 0,
      aforo_vendido: 0,
      aforo_total: Number(concAforo) || 200,
      contrato_firmado: concContrato,
      estado_pago: concEstadoPago,
      notas: concNotas.trim(),
      tipo: concTipo,
      is_posible: concIsPosible,
      band_id: targetBand.band_id,
      bandName: targetBand.bandName,
      convocatoria_tipo: convocatoriaTipo,
      convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
      convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map((m) => m.name) : undefined,
      idioma: concIdioma || undefined,
      setlistId: concSetlistId || undefined,
    };

    if (onAddConcert) {
      onAddConcert(newConcert);
      if (setSyncSuccessMessage) {
        setSyncSuccessMessage(
          `¡Concierto de ${targetBand.bandName} en ${newConcert.sala} (${newConcert.ciudad}) creado para el ${formattedDateStr}!`
        );
        setTimeout(() => setSyncSuccessMessage(''), 5000);
      }
    }
    setShowCreateModal(null);
  };

  return (
    <ModalPortal isOpen={true} onClose={() => setShowCreateModal(null)}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto ${
            isStitchLight ? 'bg-white text-slate-900' : 'bg-[#181818] text-neutral-100'
          }`}
        >
          <button
            onClick={() => setShowCreateModal(null)}
            className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            ✕
          </button>

          {/* Segmented Event Type Selector */}
          <div className="flex items-center justify-between gap-1 p-1 bg-black/30 rounded-xl mb-5 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal('concert');
                setConcIsPosible(false);
              }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                showCreateModal === 'concert' && !concIsPosible
                  ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>🎸</span>
              <span>Concierto</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal('rehearsal')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                showCreateModal === 'rehearsal'
                  ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>🎙️</span>
              <span>Ensayo</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal('reunion')}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                showCreateModal === 'reunion' ? 'bg-purple-500 text-white shadow-md font-black' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>💬</span>
              <span>Reunión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal('concert');
                setConcIsPosible(true);
              }}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                showCreateModal === 'concert' && concIsPosible
                  ? 'bg-orange-500 text-stone-950 shadow-md font-black'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>❓</span>
              <span>Posible</span>
            </button>
          </div>

          <h3 className="text-base font-mono font-bold mb-1 flex items-center gap-2">
            {showCreateModal === 'rehearsal' && <span className="text-emerald-400">🎙️ Convocar Ensayo</span>}
            {showCreateModal === 'reunion' && <span className="text-purple-400">💬 Convocatoria de Reunión</span>}
            {showCreateModal === 'concert' && concIsPosible && <span className="text-orange-400">❓ Fecha Posible / Pre-reserva</span>}
            {showCreateModal === 'concert' && !concIsPosible && <span className="text-amber-400">🎸 Agendar Concierto Confirmado</span>}
          </h3>
          <p className="text-[11px] font-mono text-neutral-400 mb-4">
            Fecha: <strong className="text-white">{formattedDateStr}</strong>
          </p>

          {/* Form for REUNION */}
          {showCreateModal === 'reunion' && (
            <form onSubmit={handleSaveNewReunion} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Proyecto / Banda</label>
                <select
                  value={selectedBandIdForNewEvent}
                  onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                >
                  {effectiveBandsList.map((b) => (
                    <option key={b.band_id} value={b.band_id}>
                      {b.bandName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Asunto de la Reunión</label>
                <input
                  type="text"
                  value={reuAsunto}
                  onChange={(e) => setReuAsunto(e.target.value)}
                  placeholder="Ej: Repaso de repertorio y presupuestos"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Horario</label>
                  <input
                    type="text"
                    value={reuHora}
                    onChange={(e) => setReuHora(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Lugar / Plataforma</label>
                  <input
                    type="text"
                    value={reuLugar}
                    onChange={(e) => setReuLugar(e.target.value)}
                    placeholder="Online (Meet, Zoom, etc)"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Enlace de Videollamada (Opcional)</label>
                <input
                  type="text"
                  value={reuEnlace}
                  onChange={(e) => setReuEnlace(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abc"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Orden del Día / Notas</label>
                <textarea
                  value={reuNotas}
                  onChange={(e) => setReuNotas(e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(null)}
                  className="px-3 py-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-[11px] font-mono font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer shadow-md"
                >
                  Convocar Reunión
                </button>
              </div>
            </form>
          )}

          {/* Form for REHEARSAL */}
          {showCreateModal === 'rehearsal' && (
            <form onSubmit={handleSaveNewRehearsal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Proyecto / Banda</label>
                <select
                  value={selectedBandIdForNewEvent}
                  onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                >
                  {effectiveBandsList.map((b) => (
                    <option key={b.band_id} value={b.band_id}>
                      {b.bandName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Horario</label>
                  <input
                    type="text"
                    value={rehTime}
                    onChange={(e) => setRehTime(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Local / Ubicación</label>
                  <input
                    type="text"
                    value={rehLugar}
                    onChange={(e) => setRehLugar(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {availableSetlists.length > 0 && (
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Repertorio Asociado</label>
                  <select
                    value={rehSetlistId}
                    onChange={(e) => setRehSetlistId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  >
                    <option value="">Sin repertorio específico</option>
                    {availableSetlists.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre || s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Objetivos del Ensayo / Notas</label>
                <textarea
                  value={rehNotas}
                  onChange={(e) => setRehNotas(e.target.value)}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(null)}
                  className="px-3 py-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-[11px] font-mono font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-all cursor-pointer shadow-md font-bold"
                >
                  Guardar Ensayo
                </button>
              </div>
            </form>
          )}

          {/* Form for CONCERT */}
          {showCreateModal === 'concert' && (
            <form onSubmit={handleSaveNewConcert} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">Proyecto / Banda</label>
                <select
                  value={selectedBandIdForNewEvent}
                  onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                    isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                  }`}
                >
                  {effectiveBandsList.map((b) => (
                    <option key={b.band_id} value={b.band_id}>
                      {b.bandName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Ciudad / Municipio</label>
                  <input
                    type="text"
                    value={concCiudad}
                    onChange={(e) => setConcCiudad(e.target.value)}
                    placeholder="Ej: Madrid"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Sala / Espacio</label>
                  <input
                    type="text"
                    value={concSala}
                    onChange={(e) => setConcSala(e.target.value)}
                    placeholder="Ej: Sala El Sol"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Caché Acordado (€)</label>
                  <input
                    type="number"
                    value={concCache}
                    onChange={(e) => setConcCache(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Aforo del Espacio</label>
                  <input
                    type="number"
                    value={concAforo}
                    onChange={(e) => setConcAforo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  />
                </div>
              </div>

              {availableSetlists.length > 0 && (
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">Setlist Programado</label>
                  <select
                    value={concSetlistId}
                    onChange={(e) => setConcSetlistId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-hidden ${
                      isStitchLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
                    }`}
                  >
                    <option value="">Seleccionar repertorio...</option>
                    {availableSetlists.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre || s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(null)}
                  className="px-3 py-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-[11px] font-mono font-bold rounded-xl transition-all cursor-pointer shadow-md ${
                    concIsPosible
                      ? 'bg-orange-500 hover:bg-orange-400 text-stone-950 font-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black'
                  }`}
                >
                  {concIsPosible ? 'Guardar Pre-reserva' : 'Guardar Concierto'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

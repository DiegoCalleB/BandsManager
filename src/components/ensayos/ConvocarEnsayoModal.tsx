import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Disc3, FileText, CheckSquare, Plus, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Rehearsal, ThemeColors, Setlist } from '../../types';
import { ModalPortal } from '../common/ModalPortal';

interface ConvocarEnsayoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rehearsal: Partial<Rehearsal>) => void;
  colors?: ThemeColors;
  setlists?: Setlist[];
  bandUsers?: Array<{ id: string; name: string; instrument?: string }>;
  currentBandId?: string;
  initialRehearsal?: Rehearsal | null;
}

export function ConvocarEnsayoModal({
  isOpen,
  onClose,
  onSave,
  colors,
  setlists = [],
  bandUsers = [],
  currentBandId,
  initialRehearsal
}: ConvocarEnsayoModalProps) {
  const isEditing = Boolean(initialRehearsal);

  const [fecha, setFecha] = useState(
    initialRehearsal?.fecha || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [hora, setHora] = useState(initialRehearsal?.hora || '19:30');
  const [horaFin, setHoraFin] = useState(initialRehearsal?.horaFin || '21:30');
  const [lugar, setLugar] = useState(initialRehearsal?.lugar || 'Local de Ensayo');
  const [setlistId, setSetlistId] = useState(initialRehearsal?.setlistId || '');
  const [notas, setNotas] = useState(initialRehearsal?.notas || '');
  const [duracionEstimadaMin, setDuracionEstimadaMin] = useState(
    initialRehearsal?.duracionEstimadaMin || 120
  );

  const [convocadosIds, setConvocadosIds] = useState<string[]>(
    initialRehearsal?.convocados_ids || bandUsers.map(u => u.id)
  );

  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [objetivos, setObjetivos] = useState<Array<{ id: string; texto: string; completado: boolean }>>(
    initialRehearsal?.objetivos || [
      { id: 'obj-1', texto: 'Afinar la dinámica y transiciones entre temas', completado: false },
      { id: 'obj-2', texto: 'Repasar los coros y segundas voces', completado: false }
    ]
  );

  const hasAdvanced = Boolean(
    initialRehearsal?.notas ||
    initialRehearsal?.horaFin ||
    (initialRehearsal?.objetivos && initialRehearsal.objetivos.length > 2)
  );

  const [showAdvanced, setShowAdvanced] = useState(hasAdvanced);

  if (!isOpen) return null;

  const toggleConvocado = (userId: string) => {
    setConvocadosIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddObjetivo = () => {
    if (!nuevoObjetivo.trim()) return;
    setObjetivos(prev => [
      ...prev,
      { id: `obj-${Date.now()}`, texto: nuevoObjetivo.trim(), completado: false }
    ]);
    setNuevoObjetivo('');
  };

  const handleRemoveObjetivo = (id: string) => {
    setObjetivos(prev => prev.filter(o => o.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora || !lugar) {
      alert('Por favor rellena fecha, hora y lugar del ensayo.');
      return;
    }

    const convocadosNombres = bandUsers
      .filter(u => convocadosIds.includes(u.id))
      .map(u => u.name);

    const data: Partial<Rehearsal> = {
      ...(initialRehearsal || {}),
      id: initialRehearsal?.id || `reh-${Date.now()}`,
      band_id: currentBandId,
      fecha,
      hora,
      horaFin,
      lugar,
      notas,
      estado: initialRehearsal?.estado || 'programado',
      setlistId: setlistId || undefined,
      convocatoria_tipo: convocadosIds.length === bandUsers.length ? 'completa' : 'parcial',
      convocados_ids: convocadosIds,
      convocados_nombres: convocadosNombres,
      asistentes: convocadosNombres,
      duracionEstimadaMin: Number(duracionEstimadaMin) || 120,
      objetivos,
      agenda: initialRehearsal?.agenda || []
    };

    onSave(data);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-[#141413] border border-[#2a2825] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#22211F]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {isEditing ? 'Editar Ensayo Convocado' : 'Convocar Nuevo Ensayo'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Sincronizado automáticamente con tu Calendario
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs font-sans">
            {/* Essential Row: Date & Start Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1">
                  Fecha <span className="text-amber-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1918] border border-[#2a2825] text-zinc-100 text-xs focus:border-amber-400 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-200 mb-1">
                  Hora de Inicio <span className="text-amber-400">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1a1918] border border-[#2a2825] text-zinc-100 text-xs focus:border-amber-400 outline-none font-medium"
                />
              </div>
            </div>

            {/* Lugar / Local */}
            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1">
                Lugar / Local de Ensayo <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Local 4 - Rock Palace, Madrid"
                  value={lugar}
                  onChange={e => setLugar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a1918] border border-[#2a2825] text-zinc-100 text-xs focus:border-amber-400 outline-none font-medium"
                />
              </div>
            </div>

            {/* Setlist Asociado */}
            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1">
                Repertorio a Repasar (Opcional)
              </label>
              <div className="relative">
                <Disc3 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-400" />
                <select
                  value={setlistId}
                  onChange={e => setSetlistId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1a1918] border border-[#2a2825] text-zinc-100 text-xs focus:border-amber-400 outline-none cursor-pointer font-medium"
                >
                  <option value="">Sin setlist específico (ensayo libre)</option>
                  {setlists.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.items?.length || 0} temas)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Collapsible Accordion: Advanced Rehearsal Options */}
            <div className="rounded-2xl border border-[#2a2825] bg-[#1a1918]/60 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowAdvanced(prev => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-xs transition-colors hover:bg-neutral-800/60 cursor-pointer text-zinc-300"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Más opciones de ensayo</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    (Horario fin, músicos, objetivos...)
                  </span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showAdvanced && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-white/5">
                  {/* Hora Fin & Duración */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Hora Fin Estimada</label>
                      <input
                        type="time"
                        value={horaFin}
                        onChange={e => setHoraFin(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#141413] border border-[#2a2825] text-zinc-100 text-xs outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Duración (Minutos)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={duracionEstimadaMin}
                        onChange={e => setDuracionEstimadaMin(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#141413] border border-[#2a2825] text-zinc-100 text-xs outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Músicos Convocados */}
                  {bandUsers.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Músicos Convocados</label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-[#141413] border border-[#2a2825]">
                        {bandUsers.map(u => {
                          const isSelected = convocadosIds.includes(u.id);
                          return (
                            <button
                              type="button"
                              key={u.id}
                              onClick={() => toggleConvocado(u.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                  : 'bg-neutral-800/60 text-neutral-400 hover:border-neutral-700'
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              <span>{u.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Objetivos */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-neutral-400">Objetivos de la Sesión</label>
                      <span className="text-[10px] text-neutral-500">{objetivos.length} asignados</span>
                    </div>

                    <div className="space-y-1 mb-2">
                      {objetivos.map(obj => (
                        <div
                          key={obj.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#141413] border border-[#2a2825] text-xs text-zinc-200"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="truncate">{obj.texto}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveObjetivo(obj.id)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Pulir la intro..."
                        value={nuevoObjetivo}
                        onChange={e => setNuevoObjetivo(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObjetivo();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[#141413] border border-[#2a2825] text-xs text-zinc-100 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddObjetivo}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notas Generales */}
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Notas / Material a llevar</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Traer juego nuevo de cuerdas..."
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#141413] border border-[#2a2825] text-zinc-100 text-xs outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#22211F]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
              >
                {isEditing ? 'Guardar Cambios' : 'Convocar Ensayo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}


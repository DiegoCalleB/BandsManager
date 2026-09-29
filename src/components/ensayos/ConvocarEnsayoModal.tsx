import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Disc3,
  FileText,
  CheckSquare,
  Plus,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  initialRehearsal,
}: ConvocarEnsayoModalProps) {
  const isEditing = Boolean(initialRehearsal);

  const [fecha, setFecha] = useState(initialRehearsal?.fecha || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [hora, setHora] = useState(initialRehearsal?.hora || '19:30');
  const [horaFin, setHoraFin] = useState(initialRehearsal?.horaFin || '21:30');
  const [lugar, setLugar] = useState(initialRehearsal?.lugar || 'Local de Ensayo');
  const [setlistId, setSetlistId] = useState(initialRehearsal?.setlistId || '');
  const [notas, setNotas] = useState(initialRehearsal?.notas || '');
  const [duracionEstimadaMin, setDuracionEstimadaMin] = useState(initialRehearsal?.duracionEstimadaMin || 120);

  const [convocadosIds, setConvocadosIds] = useState<string[]>(initialRehearsal?.convocados_ids || bandUsers.map((u) => u.id));

  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [objetivos, setObjetivos] = useState<Array<{ id: string; texto: string; completado: boolean }>>(
    initialRehearsal?.objetivos || [
      { id: 'obj-1', texto: 'Afinar la dinámica y transiciones entre temas', completado: false },
      { id: 'obj-2', texto: 'Repasar los coros y segundas voces', completado: false },
    ]
  );

  const hasAdvanced = Boolean(
    initialRehearsal?.notas || initialRehearsal?.horaFin || (initialRehearsal?.objetivos && initialRehearsal.objetivos.length > 2)
  );

  const [showAdvanced, setShowAdvanced] = useState(hasAdvanced);

  if (!isOpen) return null;

  const toggleConvocado = (userId: string) => {
    setConvocadosIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleAddObjetivo = () => {
    if (!nuevoObjetivo.trim()) return;
    setObjetivos((prev) => [...prev, { id: `obj-${Date.now()}`, texto: nuevoObjetivo.trim(), completado: false }]);
    setNuevoObjetivo('');
  };

  const handleRemoveObjetivo = (id: string) => {
    setObjetivos((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !hora || !lugar) {
      alert('Por favor rellena fecha, hora y lugar del ensayo.');
      return;
    }

    const convocadosNombres = bandUsers.filter((u) => convocadosIds.includes(u.id)).map((u) => u.name);

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
      agenda: initialRehearsal?.agenda || [],
    };

    onSave(data);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 animate-fade-in overflow-y-auto">
        <div className="bg-[var(--surface)] w-full max-w-xl rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-[var(--ink)]">
                  {isEditing ? 'Editar Ensayo Convocado' : 'Convocar Nuevo Ensayo'}
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">Sincronizado automáticamente con tu Calendario</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs font-sans">
            {/* Essential Row: Date & Start Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
                  Fecha <span className="text-[var(--acc)]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink)] text-xs font-sans focus: outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
                  Hora de Inicio <span className="text-[var(--acc)]">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-xs focus:ring-1 focus:ring-[var(--ink-3)] outline-none font-medium"
                />
              </div>
            </div>

            {/* Lugar / Local */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
                Lugar / Local de Ensayo <span className="text-[var(--acc)]">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--ink-2)]" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Local 4 - Rock Palace, Madrid"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-xs focus:ring-1 focus:ring-[var(--ink-3)] outline-none font-medium"
                />
              </div>
            </div>

            {/* Setlist Asociado */}
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Repertorio a Repasar (Opcional)</label>
              <div className="relative">
                <Disc3 className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--acc)]" />
                <select
                  value={setlistId}
                  onChange={(e) => setSetlistId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink)] text-xs focus: outline-none cursor-pointer"
                >
                  <option value="">Sin setlist específico (ensayo libre)</option>
                  {setlists.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.items?.length || 0} temas)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Collapsible Accordion: Advanced Rehearsal Options */}
            <div className="rounded-[var(--r-l)] bg-[var(--surface)]/60 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-xs transition-colors hover:bg-[var(--sunken)] cursor-pointer text-[var(--ink-2)]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span className="font-semibold">Más opciones de ensayo</span>
                  <span className="text-[10px] text-[var(--ink-2)] font-normal">(Horario fin, músicos, objetivos...)</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-[var(--ink-2)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-2)]" />}
              </button>

              {showAdvanced && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-[var(--hair)]/5">
                  {/* Hora Fin & Duración */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--ink-2)] mb-1">Hora Fin Estimada</label>
                      <input
                        type="time"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-xs outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--ink-2)] mb-1">Duración (Minutos)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={duracionEstimadaMin}
                        onChange={(e) => setDuracionEstimadaMin(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-xs outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                      />
                    </div>
                  </div>

                  {/* Músicos Convocados */}
                  {bandUsers.length > 0 && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--ink-2)] mb-1">Músicos Convocados</label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-[var(--r-m)] bg-[var(--sunken)] ">
                        {bandUsers.map((u) => {
                          const isSelected = convocadosIds.includes(u.id);
                          return (
                            <button
                              type="button"
                              key={u.id}
                              onClick={() => toggleConvocado(u.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-m)] text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--acc)]/20 text-[var(--acc)] font-bold'
                                  : 'bg-[var(--surface)] text-[var(--ink-2)] '
                              } hover:brightness-95`}
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
                      <label className="text-[11px] font-semibold text-[var(--ink-2)]">Objetivos de la Sesión</label>
                      <span className="text-[10px] text-[var(--ink-2)]">{objetivos.length} asignados</span>
                    </div>

                    <div className="space-y-1 mb-2">
                      {objetivos.map((obj) => (
                        <div
                          key={obj.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink-2)]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)] shrink-0" />
                            <span className="truncate">{obj.texto}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveObjetivo(obj.id)}
                            className="text-[var(--ink-2)] hover:text-[var(--alert)] p-0.5 shrink-0"
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
                        onChange={(e) => setNuevoObjetivo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObjetivo();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-xs text-[var(--ink-2)] outline-none focus:ring-1 focus:ring-[var(--ink-3)]"
                      />
                      <button
                        type="button"
                        onClick={handleAddObjetivo}
                        className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Notas Generales */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--ink-2)] mb-1">Notas / Material a llevar</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Traer juego nuevo de cuerdas..."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      className="w-full p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)] text-[var(--ink-2)] text-xs outline-none focus:ring-1 focus:ring-[var(--ink-3)] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--acc)]/60 text-[var(--ink)] hover:bg-[var(--acc)] transition-all cursor-pointer active:scale-95"
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

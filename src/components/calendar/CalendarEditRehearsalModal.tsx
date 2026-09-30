import React from 'react';
import { Rehearsal } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { Music, Trash2 } from 'lucide-react';
import { ShowIcon } from '../ui/ShowIcon';

interface CalendarEditRehearsalModalProps {
  viewingRehearsal: Rehearsal | null;
  setViewingRehearsal: (r: Rehearsal | null) => void;
  editRehearsalDraft: Rehearsal | null;
  setEditRehearsalDraft: React.Dispatch<React.SetStateAction<Rehearsal | null>>;
  isStitchLight?: boolean;
  onUpdateRehearsal: (id: string, updatedFields: Partial<Rehearsal>) => void;
  onDeleteRehearsal?: (id: string) => void;
  setSyncSuccessMessage?: (msg: string) => void;
  availableSetlists?: any[];
}

export const CalendarEditRehearsalModal: React.FC<CalendarEditRehearsalModalProps> = ({
  viewingRehearsal,
  setViewingRehearsal,
  editRehearsalDraft,
  setEditRehearsalDraft,
  isStitchLight = false,
  onUpdateRehearsal,
  onDeleteRehearsal,
  setSyncSuccessMessage,
  availableSetlists = [],
}) => {
  if (!viewingRehearsal || !editRehearsalDraft) return null;

  const handleSaveRehearsalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingRehearsal || !editRehearsalDraft) return;

    onUpdateRehearsal(viewingRehearsal.id, {
      fecha: editRehearsalDraft.fecha,
      hora: editRehearsalDraft.hora?.trim() || '18:00 - 21:00',
      lugar: editRehearsalDraft.lugar?.trim() || 'Locales de Ensayo',
      asunto: editRehearsalDraft.asunto?.trim() || undefined,
      enlace_reunion: editRehearsalDraft.enlace_reunion?.trim() || undefined,
      notas: editRehearsalDraft.notas?.trim() || '',
      estado: editRehearsalDraft.estado,
      setlistId: editRehearsalDraft.setlistId || undefined,
    });

    setViewingRehearsal(null);
    if (setSyncSuccessMessage) {
      setSyncSuccessMessage(`¡${editRehearsalDraft.tipo_evento === 'reunion' ? 'Reunión' : 'Ensayo'} actualizado!`);
      setTimeout(() => setSyncSuccessMessage(''), 5000);
    }
  };

  const isReunion = editRehearsalDraft.tipo_evento === 'reunion';

  return (
    <ModalPortal isOpen={true} onClose={() => setViewingRehearsal(null)}>
      <div className="fixed inset-0 bg-[var(--scrim)]/70 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-[var(--r-l)] p-6 relative my-auto max-h-[90vh] overflow-y-auto ${
            'bg-[var(--surface)] text-[var(--ink)]'
          }`}
        >
          <button
            onClick={() => setViewingRehearsal(null)}
            className="absolute top-4 right-4 p-1 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
          >
            ✕
          </button>

          <h3 className="text-base font-mono font-bold mb-1 flex items-center gap-2">
            {isReunion ? (
              <span className="text-[var(--acc)]"><ShowIcon inline emoji="💬" />Editar Reunión</span>
            ) : (
              <span className="text-[var(--ok)]"><ShowIcon inline emoji="🎙️" />Editar ensayo</span>
            )}
          </h3>
          <p className="text-xs font-mono text-[var(--ink-2)] mb-4">
            Modificando fecha: <strong className="text-[var(--ink)]">{editRehearsalDraft.fecha}</strong>
          </p>

          <form onSubmit={handleSaveRehearsalEdit} className="space-y-3.5">
            {isReunion && (
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Asunto de la Reunión</label>
                <input aria-label="Asunto de la Reunión"
                  type="text"
                  value={editRehearsalDraft.asunto || ''}
                  onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, asunto: e.target.value } : prev))}
                  required
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Fecha</label>
                <input aria-label="Fecha"
                  type="date"
                  value={editRehearsalDraft.fecha}
                  onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, fecha: e.target.value } : prev))}
                  required
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none font-mono ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Horario</label>
                <input aria-label="Horario"
                  type="text"
                  value={editRehearsalDraft.hora}
                  onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, hora: e.target.value } : prev))}
                  required
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">
                {isReunion ? 'Plataforma / Lugar' : 'Local / Ubicación'}
              </label>
              <input
                type="text"
                value={editRehearsalDraft.lugar}
                onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, lugar: e.target.value } : prev))}
                required
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
            </div>

            {isReunion && (
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Enlace de Videollamada</label>
                <input
                  type="text"
                  value={editRehearsalDraft.enlace_reunion || ''}
                  onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, enlace_reunion: e.target.value } : prev))}
                  placeholder="https://meet.google.com/xyz"
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
            )}

            {!isReunion && availableSetlists.length > 0 && (
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[var(--ok)]">
                    <Music className="w-3 h-3" />
                    <span>Repertorio Asociado</span>
                  </span>
                </label>
                <select aria-label="Repertorio Asociado"
                  value={editRehearsalDraft.setlistId || ''}
                  onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, setlistId: e.target.value } : prev))}
                  className={`w-full px-2 py-1.5 text-micro rounded-[var(--r-m)] outline-none font-mono ${
                    'bg-[var(--sunken)] text-[var(--ink)] '
                  }`}
                >
                  <option value="">-- Sin repertorio específico --</option>
                  {availableSetlists.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} • {s.items?.length ?? 0} temas
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Estado</label>
              <select aria-label="Estado"
                value={editRehearsalDraft.estado}
                onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, estado: e.target.value as any } : prev))}
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              >
                <option value="programado">Programado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">
                {isReunion ? 'Orden del Día / Notas' : 'Objetivos / Notas'}
              </label>
              <textarea
                value={editRehearsalDraft.notas || ''}
                onChange={(e) => setEditRehearsalDraft((prev) => (prev ? { ...prev, notas: e.target.value } : prev))}
                rows={2}
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--hair)]">
              {onDeleteRehearsal && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar est${isReunion ? 'a reunión' : 'e ensayo'} del calendario?`)) {
                      onDeleteRehearsal(viewingRehearsal.id);
                      setViewingRehearsal(null);
                    }
                  }}
                  className="px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-mono bg-[var(--alert)]/10 text-[var(--alert)] hover:bg-[var(--alert)]/20 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setViewingRehearsal(null)}
                  className="px-2 py-1 text-micro font-mono rounded-[var(--r-pill)] text-[var(--ink-2)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-[var(--r-pill)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] transition-ui cursor-pointer font-bold"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

import React from 'react';
import { Concert } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { HolidayDateWarning } from '../common/HolidayDateWarning';
import { Music, MapPin, Ticket, Flame, Trash2 } from 'lucide-react';

interface CalendarEditConcertModalProps {
  viewingConcert: Concert | null;
  setViewingConcert: (v: Concert | null) => void;
  editDraft: Concert | null;
  setEditDraft: React.Dispatch<React.SetStateAction<Concert | null>>;
  isStitchLight?: boolean;
  onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
  onDeleteConcert?: (id: string) => void;
  setSyncSuccessMessage?: (msg: string) => void;
  availableSetlists?: any[];
}

export const CalendarEditConcertModal: React.FC<CalendarEditConcertModalProps> = ({
  viewingConcert,
  setViewingConcert,
  editDraft,
  setEditDraft,
  isStitchLight = false,
  onUpdateConcert,
  onDeleteConcert,
  setSyncSuccessMessage,
  availableSetlists = [],
}) => {
  if (!viewingConcert || !editDraft) return null;

  const handleSaveConcertEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingConcert || !editDraft) return;

    onUpdateConcert(viewingConcert.id, {
      ciudad: editDraft.ciudad.trim() || 'Madrid',
      sala: editDraft.sala.trim() || 'Sala Directo',
      fecha: editDraft.fecha,
      direccion: editDraft.direccion?.trim() || undefined,
      cache: Number(editDraft.cache) || 0,
      aforo_vendido: Number(editDraft.aforo_vendido) || 0,
      aforo_total: Number(editDraft.aforo_total) || 0,
      contrato_firmado: editDraft.contrato_firmado,
      estado_pago: editDraft.estado_pago,
      tipo: editDraft.tipo,
      is_posible: editDraft.is_posible,
      notas: editDraft.notas?.trim() || '',
      idioma: editDraft.idioma || undefined,
      setlistId: editDraft.setlistId || undefined,
      entradasUrl: editDraft.entradasUrl?.trim() || undefined,
      entradasLugarFisico: editDraft.entradasLugarFisico?.trim() || undefined,
      precioEntradaEstimado: Number(editDraft.precioEntradaEstimado) || undefined,
      asistencia_propia: Number(editDraft.asistencia_propia) || 0,
      asistencia_otras_bandas: Number(editDraft.asistencia_otras_bandas) || 0,
      bandas_compartidas: Array.isArray(editDraft.bandas_compartidas)
        ? editDraft.bandas_compartidas
        : typeof editDraft.bandas_compartidas === 'string'
          ? (editDraft.bandas_compartidas as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      post_show_review: editDraft.post_show_review?.trim() || '',
      es_hito_destacado: Boolean(editDraft.es_hito_destacado),
    });

    setViewingConcert(null);
    if (setSyncSuccessMessage) {
      setSyncSuccessMessage(`¡Concierto de ${editDraft.sala} (${editDraft.ciudad}) actualizado!`);
      setTimeout(() => setSyncSuccessMessage(''), 5000);
    }
  };

  return (
    <ModalPortal isOpen={true} onClose={() => setViewingConcert(null)}>
      <div className="fixed inset-0 bg-[var(--scrim)]/70 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-[var(--r-l)] p-6 relative my-auto max-h-[90vh] overflow-y-auto ${
            'bg-[var(--surface)] text-[var(--ink)]'
          }`}
        >
          <button
            onClick={() => setViewingConcert(null)}
            className="absolute top-4 right-4 p-1 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
          >
            ✕
          </button>

          <h3 className="text-base font-mono font-bold mb-1 flex items-center gap-2">
            <span className="text-[var(--acc)]">🎸 Editar Concierto</span>
          </h3>
          <p className="text-xs font-mono text-[var(--ink-2)] mb-4">
            Modificando fecha: <strong className="text-[var(--ink)]">{editDraft.fecha}</strong>
          </p>

          <form onSubmit={handleSaveConcertEdit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Ciudad</label>
                <input
                  type="text"
                  value={editDraft.ciudad}
                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, ciudad: e.target.value } : prev))}
                  required
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Sala / Evento</label>
                <input
                  type="text"
                  value={editDraft.sala}
                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, sala: e.target.value } : prev))}
                  required
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Fecha</label>
              <input
                type="date"
                value={editDraft.fecha}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, fecha: e.target.value } : prev))}
                required
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none font-mono ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Dirección Exacta</label>
              <input
                type="text"
                value={editDraft.direccion || ''}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, direccion: e.target.value } : prev))}
                placeholder="ej. Calle Jardines 3, Madrid"
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
            </div>

            <HolidayDateWarning date={new Date(editDraft.fecha)} city={editDraft.ciudad} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Caché (€)</label>
                <input
                  type="number"
                  value={editDraft.cache}
                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, cache: Number(e.target.value) } : prev))}
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none font-mono ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                />
              </div>
              <div>
                <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Estado de Pago</label>
                <select
                  value={editDraft.estado_pago}
                  onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, estado_pago: e.target.value as any } : prev))}
                  className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                    'bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="anticipo">Anticipo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1 text-[var(--acc)]">
                  <Music className="w-3 h-3" />
                  <span>Repertorio / Setlist</span>
                </span>
              </label>
              <select
                value={editDraft.setlistId || ''}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, setlistId: e.target.value } : prev))}
                className={`w-full px-2 py-1.5 text-micro rounded-[var(--r-m)] outline-none font-mono ${
                  'bg-[var(--sunken)] text-[var(--ink)] '
                }`}
              >
                <option value="">-- Sin repertorio asignado --</option>
                {availableSetlists.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.tipoFormato ? `(${s.tipoFormato.replace('_', ' ')})` : ''} • {s.items?.length ?? 0} temas
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 py-1 px-2 rounded-[var(--r-m)] bg-[var(--acc)]/20 ">
              <input
                type="checkbox"
                id="editConcIsPosibleCheck"
                checked={Boolean(editDraft.is_posible)}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, is_posible: e.target.checked } : prev))}
                className="rounded text-[var(--acc)] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <label
                htmlFor="editConcIsPosibleCheck"
                className="text-micro font-mono cursor-pointer select-none font-bold text-[var(--acc)] flex items-center gap-1"
              >
                🎯 Concierto Posible / En negociación
              </label>
            </div>

            <div>
              <label className="block text-micro font-mono text-[var(--ink-2)] mb-1">Notas y Logística</label>
              <textarea
                value={editDraft.notas || ''}
                onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, notas: e.target.value } : prev))}
                rows={2}
                className={`w-full px-2 py-1 text-micro rounded-[var(--r-m)] outline-none ${
                  'bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--hair)]">
              {onDeleteConcert && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Eliminar este concierto del calendario?')) {
                      onDeleteConcert(viewingConcert.id);
                      setViewingConcert(null);
                    }
                  }}
                  className="px-2.5 py-1 rounded-[var(--r-m)] text-micro font-mono bg-[var(--alert)]/10 text-[var(--alert)] hover:bg-[var(--alert)]/20 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setViewingConcert(null)}
                  className="px-2 py-1 text-micro font-mono rounded-[var(--r-m)] text-[var(--ink-2)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] transition-ui cursor-pointer font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

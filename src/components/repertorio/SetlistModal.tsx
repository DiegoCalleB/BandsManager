import React, { useState, useEffect } from 'react';
import { X, Layers, Check } from 'lucide-react';
import { Setlist, ThemeColors } from '../../types';
import { ModalPortal } from '../common/ModalPortal';
import { ShowIcon } from '../ui/ShowIcon';
import { Input, Select, Textarea } from '../ui';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

interface SetlistModalProps {
  isOpen: boolean;
  setlistToEdit: Setlist | null;
  colors: ThemeColors;
  onClose: () => void;
  onSave: (setlistData: { id?: string; nombre: string; descripcion: string; tipoFormato: Setlist['tipoFormato'] }) => void;
}

export function SetlistModal({ isOpen, setlistToEdit, colors, onClose, onSave }: SetlistModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoFormato, setTipoFormato] = useState<Setlist['tipoFormato']>('festival');

  useEffect(() => {
    if (setlistToEdit) {
      setNombre(setlistToEdit.nombre || '');
      setDescripcion(setlistToEdit.descripcion || '');
      setTipoFormato(setlistToEdit.tipoFormato || 'festival');
    } else {
      setNombre('Festival Verano 2026');
      setDescripcion('Repertorio optimizado para directo de alta energía');
      setTipoFormato('festival');
    }
  }, [setlistToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({
      id: setlistToEdit?.id,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipoFormato,
    });
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/75 overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-md p-5 sm:p-6 rounded-[var(--r-xl)] ${
            'bg-[var(--surface)] text-[var(--ink)]'
          } my-auto max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex justify-between items-center pb-3.5 border-b border-[var(--hair)]/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc-ink)] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">{setlistToEdit ? 'Editar Repertorio' : 'Crear Nuevo Repertorio'}</h3>
                <p className="text-xs text-[var(--ink-2)] font-normal">Configura los detalles principales de tu setlist</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-sans">
            <div>
              <label className="block text-[var(--ink-2)] font-semibold mb-1">Nombre del repertorio *</label>
              <Input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Festival Rumba y Rock 2026"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-2)] font-semibold mb-1">Formato de concierto</label>
              <Select aria-label="Formato de concierto"
                value={tipoFormato}
                onChange={(e) => setTipoFormato(e.target.value as any)}
                wrapperClassName="w-full"
              >
                <option value="festival">Festival (45-60m caña directa)</option>
                <option value="sala_larga">Sala / show largo (90-120m)</option>
                <option value="acustico">Acústico / Íntimo</option>
                <option value="ensayo">Ensayo / local</option>
                <option value="otro">Otro formato</option>
              </Select>
            </div>

            <div>
              <label className="block text-[var(--ink-2)] font-semibold mb-1">Notas de escenario / descripción</label>
              <Textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="ej. Repertorio de ritmo alto pensado para festivales…"
                className="w-full"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-[var(--r-pill)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] transition-transform active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{setlistToEdit ? 'Guardar Cambios' : 'Crear Repertorio'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

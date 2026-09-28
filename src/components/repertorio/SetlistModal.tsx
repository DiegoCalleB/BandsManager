import React, { useState, useEffect } from 'react';
import { X, Layers, Check } from 'lucide-react';
import { Setlist, ThemeColors } from '../../types';
import { ModalPortal } from '../common/ModalPortal';

interface SetlistModalProps {
  isOpen: boolean;
  setlistToEdit: Setlist | null;
  colors: ThemeColors;
  isStitchLight: boolean;
  onClose: () => void;
  onSave: (setlistData: { id?: string; nombre: string; descripcion: string; tipoFormato: Setlist['tipoFormato'] }) => void;
}

export function SetlistModal({
  isOpen,
  setlistToEdit,
  colors,
  isStitchLight,
  onClose,
  onSave,
}: SetlistModalProps) {
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
        <div className={`w-full max-w-md p-5 sm:p-6 rounded-3xl shadow-2xl border ${
          isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16161a] border-neutral-800 text-zinc-100'
        } my-auto max-h-[90vh] overflow-y-auto`}>
          <div className="flex justify-between items-center pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {setlistToEdit ? 'Editar Repertorio' : 'Crear Nuevo Repertorio'}
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal">
                  Configura los detalles principales de tu setlist
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-sans">
            <div>
              <label className="block text-zinc-200 font-semibold mb-1">Nombre del Repertorio *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Festival Rumba & Rock 2026"
                className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs focus:outline-none ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' : 'bg-neutral-900 text-white border-neutral-800 focus:border-amber-500/50'
                }`}
              />
            </div>

            <div>
              <label className="block text-zinc-200 font-semibold mb-1">Formato de Concierto</label>
              <select
                value={tipoFormato}
                onChange={(e) => setTipoFormato(e.target.value as any)}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs focus:outline-none cursor-pointer ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-zinc-200 border-neutral-800'
                }`}
              >
                <option value="festival">🔥 Festival (45-60m Caña Directa)</option>
                <option value="sala_larga">🎸 Sala / Show Largo (90-120m)</option>
                <option value="acustico">🌙 Acústico / Íntimo</option>
                <option value="ensayo">🥁 Ensayo / Local</option>
                <option value="otro">📋 Otro Formato</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-200 font-semibold mb-1">Notas de Escenario / Descripción</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="ej. Repertorio de ritmo alto pensado para festivales..."
                className={`w-full p-3 rounded-xl border font-medium text-xs focus:outline-none ${
                  isStitchLight ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500' : 'bg-neutral-900 text-white border-neutral-800 focus:border-amber-500/50'
                }`}
              />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
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


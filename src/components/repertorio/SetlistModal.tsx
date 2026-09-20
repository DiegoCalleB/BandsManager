import React, { useState, useEffect } from'react';
import { X, Layers, Check } from'lucide-react';
import { Setlist, ThemeColors } from'../../types';
import { ModalPortal } from'../common/ModalPortal';

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
 setNombre(setlistToEdit.nombre ||'');
 setDescripcion(setlistToEdit.descripcion ||'');
 setTipoFormato(setlistToEdit.tipoFormato ||'festival');
 } else {
 setNombre('Festival Verano 2026');
 setDescripcion('Repertorio optimizado para directo de alta energía');
 setTipoFormato('festival');
 }
 }, [setlistToEdit]);

 // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
 // guard vivía antes de ellos, así que abrir/cerrar el modal cambiaba cuántos hooks corrían.
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
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-md p-5 rounded-[var(--r-l)] shadow-2xl ${colors.card} text-[var(--ink)] my-auto max-h-[90vh] overflow-y-auto`}>
 <div className="flex justify-between items-center pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <Layers className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-sm font-bold font-mono uppercase text-[var(--ink)]">
 {setlistToEdit ?'Editar Repertorio' :'Crear Nuevo Repertorio desde Cero'}
 </h3>
 </div>
 <button onClick={onClose} className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs font-mono">
 <div>
 <label className="block text-[var(--ink-2)] font-bold mb-1">Nombre del Repertorio / Setlist *</label>
 <input
 type="text"
 required
 value={nombre}
 onChange={(e) => setNombre(e.target.value)}
 placeholder="ej. Festival Rumba & Rock 2026"
 className={`w-full p-2.5 rounded-[var(--r-m)] focus:outline-none focus:border-[var(--acc)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div>
 <label className="block text-[var(--ink-2)] font-bold mb-1">Formato / Tipo de Concierto</label>
 <select
 value={tipoFormato}
 onChange={(e) => setTipoFormato(e.target.value as any)}
 className={`w-full p-2.5 rounded-[var(--r-m)] focus:outline-none focus:border-[var(--acc)] cursor-pointer ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="festival">🔥 Festival (45-60m Caña Directa)</option>
 <option value="sala_larga">🎸 Sala / Show Largo (90-120m)</option>
 <option value="acustico">🌙 Acústico / Intimo</option>
 <option value="ensayo">🥁 Ensayo / Local</option>
 <option value="otro">📋 Otro</option>
 </select>
 </div>

 <div>
 <label className="block text-[var(--ink-2)] font-bold mb-1">Descripción / Notas de Escenario</label>
 <textarea
 rows={3}
 value={descripcion}
 onChange={(e) => setDescripcion(e.target.value)}
 placeholder="ej. Setlist pensado para festivales con ritmo alto sin pausas..."
 className={`w-full p-2.5 rounded-[var(--r-m)] focus:outline-none focus:border-[var(--acc)] ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-3 border-t border-[var(--hair)] flex justify-end gap-2">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--ink)] transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-1.5"
 >
 <Check className="w-4 h-4 stroke-[3]" />
 <span>{setlistToEdit ?'Guardar Cambios' :'Crear Repertorio'}</span>
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 );
}

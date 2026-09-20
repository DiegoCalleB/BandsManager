import React, { useState } from'react';
import { X, Calendar, Clock, MapPin, Users, Disc3, FileText, CheckSquare, Plus, Sparkles } from'lucide-react';
import { Rehearsal, ThemeColors, Setlist } from'../../types';
import { ModalPortal } from'../common/ModalPortal';

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
 const [hora, setHora] = useState(initialRehearsal?.hora ||'19:30');
 const [horaFin, setHoraFin] = useState(initialRehearsal?.horaFin ||'21:30');
 const [lugar, setLugar] = useState(initialRehearsal?.lugar ||'Local de Ensayo');
 const [setlistId, setSetlistId] = useState(initialRehearsal?.setlistId ||'');
 const [notas, setNotas] = useState(initialRehearsal?.notas ||'');
 const [duracionEstimadaMin, setDuracionEstimadaMin] = useState(
 initialRehearsal?.duracionEstimadaMin || 120
 );

 const [convocadosIds, setConvocadosIds] = useState<string[]>(
 initialRehearsal?.convocados_ids || bandUsers.map(u => u.id)
 );

 const [nuevoObjetivo, setNuevoObjetivo] = useState('');
 const [objetivos, setObjetivos] = useState<Array<{ id: string; texto: string; completado: boolean }>>(
 initialRehearsal?.objetivos || [
 { id:'obj-1', texto:'Afinar la dinámica y transiciones entre temas', completado: false },
 { id:'obj-2', texto:'Repasar los coros y segundas voces', completado: false }
 ]
 );

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
 estado: initialRehearsal?.estado ||'programado',
 setlistId: setlistId || undefined,
 convocatoria_tipo: convocadosIds.length === bandUsers.length ?'completa' :'parcial',
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
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
 <div className="bg-[var(--surface)] border-[var(--hair)] w-full max-w-xl rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
 {/* Header */}
 <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--surface)]">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Calendar className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-display font-bold text-[var(--ink)]">
 {isEditing ?'Editar Ensayo Convocado' :'Convocar Nuevo Ensayo'}
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-mono">
 Sincronizado automáticamente con tu Calendario
 </p>
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
 <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
 {/* Fecha y Horarios */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Fecha
 </label>
 <input
 type="date"
 required
 value={fecha}
 onChange={e => setFecha(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs font-mono focus: outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Hora Inicio
 </label>
 <input
 type="time"
 required
 value={hora}
 onChange={e => setHora(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs font-mono focus: outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Hora Fin (Estimada)
 </label>
 <input
 type="time"
 value={horaFin}
 onChange={e => setHoraFin(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs font-mono focus: outline-none"
 />
 </div>
 </div>

 {/* Lugar y Duración */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="sm:col-span-2">
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Lugar / Local
 </label>
 <div className="relative">
 <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--ink-2)]" />
 <input
 type="text"
 required
 placeholder="Ej: Local 4 - Rock Palace, Madrid"
 value={lugar}
 onChange={e => setLugar(e.target.value)}
 className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs focus: outline-none"
 />
 </div>
 </div>
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Duración (Min)
 </label>
 <input
 type="number"
 min="15"
 max="480"
 step="15"
 value={duracionEstimadaMin}
 onChange={e => setDuracionEstimadaMin(Number(e.target.value))}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs font-mono focus: outline-none"
 />
 </div>
 </div>

 {/* Setlist Asociado */}
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Repertorio / Setlist a Repasar (Opcional)
 </label>
 <div className="relative">
 <Disc3 className="w-3.5 h-3.5 absolute left-3 top-3 text-[var(--acc)]" />
 <select
 value={setlistId}
 onChange={e => setSetlistId(e.target.value)}
 className="w-full pl-9 pr-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs focus: outline-none cursor-pointer"
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

 {/* Músicos Convocados */}
 {bandUsers.length > 0 && (
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Músicos Convocados
 </label>
 <div className="flex flex-wrap gap-2 p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)]">
 {bandUsers.map(u => {
 const isSelected = convocadosIds.includes(u.id);
 return (
 <button
 type="button"
 key={u.id}
 onClick={() => toggleConvocado(u.id)}
 className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)]/60/20 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] border-transparent hover:'
 }`}
 >
 <Users className="w-3 h-3" />
 <span>{u.name}</span>
 {u.instrument && (
 <span className="text-[10px] text-[var(--ink-2)]">({u.instrument})</span>
 )}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Objetivos del Ensayo */}
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-mono font-bold text-[var(--ink-2)] uppercase">
 Objetivos Principales de la Sesión
 </label>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 {objetivos.length} definidos
 </span>
 </div>

 <div className="space-y-1.5 mb-2">
 {objetivos.map(obj => (
 <div
 key={obj.id}
 className="flex items-center justify-between gap-2 p-2 rounded-[var(--r-s)] bg-[var(--surface)] border-[var(--hair)] text-xs text-[var(--ink)]"
 >
 <div className="flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]/60" />
 <span>{obj.texto}</span>
 </div>
 <button
 type="button"
 onClick={() => handleRemoveObjetivo(obj.id)}
 className="text-[var(--ink-2)] hover:text-[var(--alert)] p-0.5"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>

 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Ej: Dejar pulida la nueva canción o probar el intro..."
 value={nuevoObjetivo}
 onChange={e => setNuevoObjetivo(e.target.value)}
 onKeyDown={e => {
 if (e.key ==='Enter') {
 e.preventDefault();
 handleAddObjetivo();
 }
 }}
 className="flex-1 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-xs text-[var(--ink)] outline-none focus:"
 />
 <button
 type="button"
 onClick={handleAddObjetivo}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" /> Añadir
 </button>
 </div>
 </div>

 {/* Notas Generales */}
 <div>
 <label className="block text-xs font-mono font-bold text-[var(--ink-2)] uppercase mb-1.5">
 Notas / Material a Llevar
 </label>
 <textarea
 rows={2}
 placeholder="Ej: Traer juego nuevo de cuerdas, cables XLR y la tarjeta de sonido..."
 value={notas}
 onChange={e => setNotas(e.target.value)}
 className="w-full p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)] text-xs outline-none focus: resize-none"
 />
 </div>

 {/* Footer Buttons */}
 <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--surface)]">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-mono font-bold text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2 rounded-[var(--r-m)] text-xs font-mono font-bold bg-[var(--acc)]/60 text-[var(--ink)] hover:bg-[var(--acc)] transition-all cursor-pointer shadow-md shadow-amber-400/20 active:scale-95"
 >
 {isEditing ?'Guardar Cambios' :'Convocar Ensayo'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 );
}

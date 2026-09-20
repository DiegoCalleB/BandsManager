import React, { useState, useRef } from'react';
import { X, Upload, Disc3, CheckCircle2, Music, Users, Plus, ChevronDown, ChevronUp } from'lucide-react';
import { ThemeColors, Song } from'../../types';
import { BandMemberOption, resolveBandMembers, getSongMemberNote } from'../../utils/repertorioUtils';
import { formatSongTitle } from'../../utils/formatSongTitle';
import { ModalPortal } from'../common/ModalPortal';

interface SongModalProps {
 isOpen: boolean;
 editingSong: Song | null;
 colors: ThemeColors;
 isStitchLight: boolean;
 onClose: () => void;
 onSave: (e: React.FormEvent<HTMLFormElement>) => void;
 albumsList?: string[];
 defaultAlbum?: string;
 defaultAlbumForNewSong?: string;
 bandMembers?: BandMemberOption[];
}

export function SongModal({
 isOpen,
 editingSong,
 colors,
 isStitchLight,
 onClose,
 onSave,
 albumsList = [],
 defaultAlbum ='',
 defaultAlbumForNewSong ='',
 bandMembers = []
}: SongModalProps) {
 const effectiveDefaultAlbum = defaultAlbumForNewSong || defaultAlbum ||'';
 const resolvedMembers = resolveBandMembers(bandMembers, editingSong?.notasMiembros);

 const [minutos, setMinutos] = useState<number>(() =>
 editingSong ? Math.floor(editingSong.duracionSegundos / 60) : 3
 );
 const [segundos, setSegundos] = useState<number>(() =>
 editingSong ? editingSong.duracionSegundos % 60 : 30
 );
 const [detectedDurationMsg, setDetectedDurationMsg] = useState<string>('');
 const [selectedAlbum, setSelectedAlbum] = useState<string>(() => {
 const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum ||'';
 if (!albumVal) return'';
 return albumsList.includes(albumVal) ? albumVal :'__CUSTOM__';
 });
 const [customAlbumInput, setCustomAlbumInput] = useState<string>(() => {
 const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum ||'';
 return albumsList.includes(albumVal) ?'' : albumVal;
 });
 const [audioFileUrl, setAudioFileUrl] = useState<string>(editingSong?.audioPrincipalUrl || (editingSong as any)?.audioUrl ||'');
 const [audioFileName, setAudioFileName] = useState<string>('');

 // Member notes state
 const [showMemberNotesSection, setShowMemberNotesSection] = useState<boolean>(true);
 const [memberNotesState, setMemberNotesState] = useState<Record<string, string>>(() => {
 const initial: Record<string, string> = {};
 resolvedMembers.forEach(m => {
 initial[m.name.toLowerCase()] = getSongMemberNote(editingSong, m.id, m.name);
 });
 return initial;
 });

 const fileInputRef = useRef<HTMLInputElement>(null);

 // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
 // guard vivía antes de ellos, así que abrir/cerrar el modal cambiaba cuántos hooks corrían.
 if (!isOpen) return null;

 const handleMemberNoteChange = (name: string, text: string) => {
 setMemberNotesState(prev => ({
 ...prev,
 [name.toLowerCase()]: text
 }));
 };

 const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setAudioFileName(file.name);
 const objectUrl = URL.createObjectURL(file);
 setAudioFileUrl(objectUrl);

 // Auto-detect duration from audio metadata
 const tempAudio = new Audio(objectUrl);
 tempAudio.onloadedmetadata = () => {
 if (tempAudio.duration && !isNaN(tempAudio.duration)) {
 const totalSecs = Math.round(tempAudio.duration);
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 setMinutos(mins);
 setSegundos(secs);
 setDetectedDurationMsg(`✓ Duración detectada del audio: ${mins}m ${secs}s`);
 }
 };
 };

 const finalAlbumValue = selectedAlbum ==='__CUSTOM__' ? customAlbumInput : selectedAlbum;

 // La energía se almacena como número (1-20). Mapeamos el valor guardado al tramo
 // más cercano de los cuatro que ofrece el selector.
 const energiaDefault = (() => {
 const raw = Number(editingSong?.energia);
 if (!editingSong || !Number.isFinite(raw) || raw <= 0) return'18';
 if (raw <= 8) return'6';
 if (raw <= 14) return'12';
 if (raw <= 18) return'18';
 return'20';
 })();

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-lg p-5 rounded-[var(--r-l)] my-auto max-h-[90vh] flex flex-col overflow-hidden ${colors.card}`}>
 <div className="flex justify-between items-center pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <Music className="w-5 h-5 text-[var(--ok)]" />
 <h3 className={`text-sm font-bold font-sans ${colors.text}`}>
 {editingSong ?'Editar Canción' :'Añadir Nueva Canción al Catálogo'}
 </h3>
 </div>
 <button onClick={onClose} className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer p-1">
 <X className="w-4 h-4" />
 </button>
 </div>

 <form onSubmit={onSave} className="space-y-3 text-[10px] font-sans flex flex-col flex-1 overflow-hidden pt-3">
 <input type="hidden" name="audioPrincipalUrl" value={audioFileName ?'' : audioFileUrl} />
 <input type="hidden" name="albumDisco" value={finalAlbumValue} />

 <div className="space-y-3 overflow-y-auto pr-1 flex-1 pb-2">
 {/* Audio File Upload Box with Auto Duration Detection */}
 <div className={`p-3 rounded-[var(--r-m)] border-dashed transition-all ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/90'
 }`}>
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <Upload className="w-4 h-4 text-[var(--ok)]" />
 <span className="font-bold text-xs text-[var(--ink)]">Subir Fichero de Audio (mp3, wav, m4a)</span>
 </div>
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="px-2.5 py-1 text-[10px] rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-extrabold cursor-pointer transition-transform active:scale-95"
 >
 Examinar...
 </button>
 </div>
 <input
 ref={fileInputRef}
 name="audioFile"
 type="file"
 accept="audio/*"
 onChange={handleAudioFileChange}
 className="hidden"
 />
 {audioFileName && (
 <div className="mt-2 text-xs text-[var(--ink-2)] flex items-center gap-1.5 font-sans">
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span className="truncate">Archivo: {audioFileName}</span>
 </div>
 )}
 {detectedDurationMsg && (
 <div className="mt-1 text-[11px] font-bold text-[var(--ok)]">
 {detectedDurationMsg}
 </div>
 )}
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-[var(--ink-2)]">Título de la Canción *</label>
 <span className="text-[10px] text-[var(--acc)] font-medium">✨ Formato Nombres Propios automático</span>
 </div>
 <input
 name="titulo"
 type="text"
 required
 defaultValue={editingSong ? formatSongTitle(editingSong.titulo) :''}
 onBlur={(e) => {
 if (e.target.value) {
 e.target.value = formatSongTitle(e.target.value);
 }
 }}
 className={`w-full p-2.5 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Brisa y Cacharros"
 />
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[var(--ink-2)] mb-1">
 Tonalidad / Clave
 {editingSong?.tonalidadDetectadaEn && (
 <span className="ml-1.5 text-[10px] font-normal text-[var(--acc)]/80" title="Detectado automáticamente por Iris desde el audio — corrígelo si no coincide">
 · detectado con Iris
 </span>
 )}
 </label>
 <input
 name="tonalidad"
 type="text"
 defaultValue={editingSong?.tonalidad ||''}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Lam / Am"
 />
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">
 BPM / Tempo
 {editingSong?.bpmDetectadoEn && (
 <span className="ml-1.5 text-[10px] font-normal text-[var(--acc)]/80" title="Detectado automáticamente por Iris desde el audio — corrígelo si no coincide">
 · detectado con Iris
 </span>
 )}
 </label>
 <input
 name="bpm"
 type="number"
 defaultValue={editingSong?.bpm || 120}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. 128"
 />
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Duración (Min:Seg)</label>
 <div className="flex gap-1 items-center">
 <input
 name="duracionMin"
 type="number"
 min="0"
 value={minutos}
 onChange={(e) => setMinutos(parseInt(e.target.value) || 0)}
 className={`w-1/2 p-2 rounded-[var(--r-s)] focus:outline-none text-center font-bold text-[var(--ok)] ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="Min"
 />
 <span className="text-[var(--ink-2)] font-bold">:</span>
 <input
 name="duracionSeg"
 type="number"
 min="0"
 max="59"
 value={segundos}
 onChange={(e) => setSegundos(parseInt(e.target.value) || 0)}
 className={`w-1/2 p-2 rounded-[var(--r-s)] focus:outline-none text-center font-bold text-[var(--ok)] ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="Seg"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[var(--ink-2)] mb-1 flex items-center gap-1">
 <Disc3 className="w-3 h-3 text-[var(--ok)]" />
 <span>Álbum / Disco</span>
 </label>
 <select
 value={selectedAlbum}
 onChange={(e) => setSelectedAlbum(e.target.value)}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none cursor-pointer font-bold ${
 'bg-[var(--surface)] text-[var(--ok)]'
 }`}
 >
 <option value="">Sin Disco (Single)</option>
 {albumsList.filter(a => a && a !=='todos' && a !=='Singles / Sin Disco').map((alb) => (
 <option key={alb} value={alb}>💿 {alb}</option>
 ))}
 <option value="__CUSTOM__">+ Nuevo Álbum (Escribir nombre)...</option>
 </select>

 {selectedAlbum ==='__CUSTOM__' && (
 <input
 type="text"
 value={customAlbumInput}
 onChange={(e) => setCustomAlbumInput(e.target.value)}
 placeholder="Escribe el nombre del nuevo disco..."
 className={`w-full mt-1.5 p-2 rounded-[var(--r-s)] focus:outline-none border-[var(--hair)]/50 ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 )}
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Género / Estilo</label>
 <input
 name="genero"
 type="text"
 defaultValue={editingSong?.genero ||''}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Rock Rumba"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[var(--ink-2)] mb-1">Tipo de Tema</label>
 <select
 name="tipo"
 defaultValue={editingSong?.tipo ||'propio'}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="propio">Propio / Original</option>
 <option value="cover">Cover / Versión</option>
 <option value="instrumental">Instrumental / Intro</option>
 </select>
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Estado de Madurez</label>
 <select
 name="estadoTema"
 defaultValue={editingSong?.estadoTema ||'listo'}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="listo">⚡ Listo para Directo</option>
 <option value="ensayando">🎸 En Ensayo / Montaje</option>
 <option value="componiendo">💡 Idea / En Composición</option>
 <option value="descartado">📦 Descartada / Archivo</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[var(--ink-2)] mb-1">Energía / Intensidad</label>
 {/* La energía se guarda como número (1-20) en la BD, así que el selector
 emite números en vez de etiquetas de texto. */}
 <select
 name="energia"
 defaultValue={energiaDefault}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="20">💣 Explosiva / Clímax (Hit)</option>
 <option value="18">🔥 Alta (Traca / Caña)</option>
 <option value="12">🎵 Media (Groove / Ritmo)</option>
 <option value="6">🌙 Balada / Acústica</option>
 </select>
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Voz Principal</label>
 <input
 name="cantantePrincipal"
 type="text"
 defaultValue={editingSong?.cantantePrincipal ||''}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Voz Principal"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[var(--ink-2)] mb-1">Afinación Instrumentos</label>
 <input
 name="afinacion"
 type="text"
 defaultValue={editingSong?.afinacion ||'E Standard'}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Drop D, Eb Standard"
 />
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Enlace a Partitura / Acordes</label>
 <input
 name="enlaceAcordes"
 type="url"
 defaultValue={editingSong?.enlaceAcordes ||''}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="https://drive.google.com/..."
 />
 </div>
 </div>

 <div>
 <label className="block text-[var(--ink-2)] mb-1">Notas Internas / Ejecución</label>
 <textarea
 name="notasInternas"
 rows={2}
 defaultValue={editingSong?.notasInternas ||''}
 className={`w-full p-2.5 rounded-[var(--r-s)] focus:outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 placeholder="ej. Intro solo con viento, estribillo fuerte..."
 />
 </div>

 {/* Notas para Repertorio por Miembro de la Banda */}
 <input type="hidden" name="notasMiembrosJson" value={JSON.stringify(memberNotesState)} />
 
 <div className={`rounded-[var(--r-m)] transition-all overflow-hidden ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/90'
 }`}>
 <button
 type="button"
 onClick={() => setShowMemberNotesSection(p => !p)}
 className={`w-full p-3 flex items-center justify-between font-sans text-xs font-bold transition-colors cursor-pointer ${
 'hover:bg-[var(--surface)]/80 text-[var(--ok)]'
 }`}
 >
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4" />
 <span>Notas para Repertorio por Miembro ({resolvedMembers.length})</span>
 </div>
 {showMemberNotesSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>

 {showMemberNotesSection && (
 <div className="p-3 pt-0 space-y-3 border-t border-[var(--hair)]">
 <p className="text-[10px] text-[var(--ink-2)] font-sans mt-2">
 Añade notas personalizadas para cada músico. Se imprimirán bajo esta canción en la hoja individual de cada miembro:
 </p>

 <div>
 <label className="block text-[var(--ink-2)] text-[10px] mb-1 font-sans">
 📌 Nota General de Repertorio
 </label>
 <input
 name="notasRepertorio"
 type="text"
 defaultValue={editingSong?.notasRepertorio ||''}
 placeholder="ej. Entrar directos sin intro..."
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none text-xs ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="space-y-2.5 pt-1">
 {resolvedMembers.map((member) => {
 const memberKey = member.name.toLowerCase();
 return (
 <div key={member.id || member.name} className="space-y-1">
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
 <span
 className="w-2 h-2 rounded-full inline-block"
 style={{ backgroundColor: member.avatarColor ||'#6366f1' }}
 />
 {member.name}
 <span className="text-[var(--ink-2)] font-normal">({member.instrument})</span>
 </span>
 </div>
 <input
 type="text"
 value={memberNotesState[memberKey] ||''}
 onChange={(e) => handleMemberNoteChange(member.name, e.target.value)}
 placeholder={`Notas específicas para ${member.name} (${member.instrument})...`}
 className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none text-xs ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 </div>

 <div className="pt-3 border-t flex justify-end gap-2 shrink-0 bg-transparent">
 <button
 type="button"
 onClick={onClose}
 className="px-3 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] transition-transform active:scale-95 cursor-pointer"
 >
 Guardar Canción
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 );
}


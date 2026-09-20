import React, { useState } from'react';
import { Sparkles, X, Wand2, Music, Check, User, Mic, FileText, Plus, Disc } from'lucide-react';
import { ModalPortal } from'../common/ModalPortal';
import { Song, SongAudioIdea } from'../../types';

interface SongStudioAiComposerModalProps {
 isOpen: boolean;
 onClose: () => void;
 song: Song;
 onAddIdea: (newIdea: SongAudioIdea) => void;
 currentUsername: string;
}

export const SongStudioAiComposerModal: React.FC<SongStudioAiComposerModalProps> = ({
 isOpen,
 onClose,
 song,
 onAddIdea,
 currentUsername,
}) => {
 const [estiloMusico, setEstiloMusico] = useState<string>('Productor y Arreglista General');
 const [objetivoIdea, setObjetivoIdea] = useState<string>('Nuevo Riff o Puente Instrumental');
 const [seccionCancion, setSeccionCancion] = useState<string>('Estribillo');
 const [tiempoMinuto, setTiempoMinuto] = useState<string>('01:00');
 const [promptUsuario, setPromptUsuario] = useState<string>('');
 const [isGenerating, setIsGenerating] = useState<boolean>(false);
 const [generatedIdea, setGeneratedIdea] = useState<any | null>(null);

 if (!isOpen) return null;

 const handleGenerateIdea = async () => {
 setIsGenerating(true);
 setGeneratedIdea(null);
 try {
 const token = localStorage.getItem('token') ||'';
 const res = await fetch('/api/ai-composer-arrangement', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({
 titulo: song.titulo,
 tonalidad: song.tonalidad,
 bpm: song.bpm,
 estiloMusico,
 objetivoIdea,
 seccionCancion,
 tiempoMinuto,
 promptUsuario,
 cifradoTexto: song.cifradoTexto
 })
 });

 const data = await res.json();
 if (data.success && data.idea) {
 setGeneratedIdea(data.idea);
 } else {
 alert(data.error ||'Error al generar idea con IA.');
 }
 } catch (err) {
 console.error('Error generating AI arrangement:', err);
 alert('Error de conexión al generar arreglo con IA.');
 } finally {
 setIsGenerating(false);
 }
 };

 const handleAcceptAndAddIdea = () => {
 if (!generatedIdea) return;

 const ideaTextContent = `📝 ARREGLO DE MÚSICO IA (${generatedIdea.instrumentoRol || estiloMusico}) [${seccionCancion} - ${tiempoMinuto}]:\n\n${generatedIdea.descripcionArreglo}\n\nTablatura / Acordes:\n${generatedIdea.tablaturaOAcordes ||'N/A'}\n\nNotas para la banda:\n${generatedIdea.notasParaBanda ||'Ninguna'}`;

 // Create a data url or text-based mock audio for the idea description container if no audio file
 const blob = new Blob([ideaTextContent], { type:'text/plain;charset=utf-8' });
 const url = URL.createObjectURL(blob);

 const newIdea: SongAudioIdea = {
 id: `idea-ai-${Date.now()}`,
 titulo: generatedIdea.tituloIdea || `Idea IA (${seccionCancion} ${tiempoMinuto})`,
 seccion: (seccionCancion.toLowerCase().replace(/\s+/g,'-') as any) ||'general',
 audioUrl: url,
 fecha: new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
 subidoPor: currentUsername ||'Músico IA Pro',
 instrumento: generatedIdea.instrumentoRol ||'Arreglo IA',
 comentarios: [
 {
 id: `c-${Date.now()}`,
 autor:'🤖 Asistente IA',
 texto: ideaTextContent,
 fecha: new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })
 }
 ],
 pistas: [
 {
 id: `track-${Date.now()}-1`,
 nombre: generatedIdea.tituloIdea || `${seccionCancion} (${tiempoMinuto})`,
 audioUrl: url,
 autor:'Músico IA',
 instrumento: generatedIdea.instrumentoRol ||'Sugerencia',
 fecha: new Date().toLocaleDateString('es-ES'),
 volumen: 1,
 muted: false
 }
 ]
 };

 onAddIdea(newIdea);
 onClose();
 alert(`¡Idea de arreglo"${newIdea.titulo}" añadida al estudio con éxito!`);
 };

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className="w-full max-w-2xl rounded-[var(--r-l)] bg-zinc-950 p-6 space-y-5 text-[var(--ink)] shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
 <Sparkles className="w-5 h-5 animate-pulse" />
 </div>
 <div>
 <h3 className="text-base font-bold text-[var(--ink)]">Asistente Compositor IA (Músico Virtual)</h3>
 <p className="text-xs text-indigo-300 font-mono">Aporta arreglos, riffs y creatividad como un músico de sesión real</p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-indigo-950/30 text-xs text-indigo-200 space-y-1">
 <p className="font-semibold flex items-center gap-1.5">
 <Wand2 className="w-3.5 h-3.5 text-indigo-400" /> Creación de Ideas Avanzadas
 </p>
 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
 ¿Te has quedado estancado en el local de ensayo? Nuestro músico virtual analiza la tonalidad ({song.tonalidad ||'Sin definir'}), el tempo ({song.bpm} BPM) y los acordes de"{song.titulo}" para proponerte arreglos profesionales, melodías, puentes o variaciones armónicas originales.
 </p>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Rol del Músico IA</label>
 <select
 value={estiloMusico}
 onChange={(e) => setEstiloMusico(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-indigo-500 font-mono"
 >
 <option value="Productor y Arreglista General">Productor y Arreglista General</option>
 <option value="Guitarrista Líder (Solos y Riffs)">Guitarrista Líder (Solos y Riffs)</option>
 <option value="Bajista de Sesión (Grooves y Líneas)">Bajista de Sesión (Grooves y Líneas)</option>
 <option value="Teclista / Sintetizador (Atmósferas)">Teclista / Sintetizador (Atmósferas)</option>
 <option value="Letrista y Co-autor (Ganchos y Letra)">Letrista y Co-autor (Ganchos y Letra)</option>
 </select>
 </div>

 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Objetivo del Arreglo</label>
 <select
 value={objetivoIdea}
 onChange={(e) => setObjetivoIdea(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-indigo-500 font-mono"
 >
 <option value="Nuevo Riff o Puente Instrumental">Nuevo Riff o Puente Instrumental</option>
 <option value="Variación Armónica para el Estribillo">Variación Armónica para el Estribillo</option>
 <option value="Línea Melódica de Gancho (Hook)">Línea Melódica de Gancho (Hook)</option>
 <option value="Corte Rítmico o Transición Sorpresa">Corte Rítmico o Transición Sorpresa</option>
 <option value="Outro Épico o Final de Canción">Outro Épico o Final de Canción</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Parte de la Canción</label>
 <select
 value={seccionCancion}
 onChange={(e) => setSeccionCancion(e.target.value)}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-indigo-500 font-mono"
 >
 <option value="Intro">Intro</option>
 <option value="Verso">Verso</option>
 <option value="Pre-estribillo">Pre-estribillo</option>
 <option value="Estribillo">Estribillo</option>
 <option value="Puente">Puente (Bridge)</option>
 <option value="Solo / Instrumental">Solo / Instrumental</option>
 <option value="Outro">Outro</option>
 <option value="General">Toda la Canción (General)</option>
 </select>
 </div>

 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">Minuto / Compás aprox.</label>
 <input
 type="text"
 value={tiempoMinuto}
 onChange={(e) => setTiempoMinuto(e.target.value)}
 placeholder="Ej: 01:15 o Compás 12"
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-indigo-500 font-mono"
 />
 </div>
 </div>

 <div>
 <label className="text-xs font-mono text-[var(--ink-2)] block mb-1">
 Instrucción o inspiración libre para el músico IA (Opcional)
 </label>
 <textarea
 value={promptUsuario}
 onChange={(e) => setPromptUsuario(e.target.value)}
 placeholder="Ej: Quiero que el puente tenga tensión al estilo rock alternativo de los 90, con acordes suspendidos y notas de bajo cromáticas..."
 rows={2}
 className="w-full px-3 py-2 rounded-[var(--r-m)] bg-black text-xs text-[var(--ink)] focus:outline-none focus:border-indigo-500 font-mono resize-none"
 />
 </div>

 <button
 type="button"
 onClick={handleGenerateIdea}
 disabled={isGenerating}
 className="w-full py-3 rounded-[var(--r-m)] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-[var(--ink)] font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
 >
 {isGenerating ? (
 <>
 <Sparkles className="w-4 h-4 animate-spin" />
 <span>El Músico IA está componiendo el arreglo...</span>
 </>
 ) : (
 <>
 <Wand2 className="w-4 h-4" />
 <span>Generar Idea y Arreglo Profesional</span>
 </>
 )}
 </button>

 {/* GENERATED IDEA PREVIEW CARD */}
 {generatedIdea && (
 <div className="mt-4 p-4 rounded-[var(--r-m)] bg-indigo-950/20 space-y-3 animate-in fade-in duration-200">
 <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-mono text-[10px] uppercase font-bold">
 {generatedIdea.instrumentoRol}
 </span>
 <h4 className="font-bold text-sm text-[var(--ink)]">{generatedIdea.tituloIdea}</h4>
 </div>
 <span className="text-[10px] text-[var(--ink-2)] font-mono">Sugerencia IA Lista</span>
 </div>

 <div className="text-xs text-[var(--ink-2)] space-y-2">
 <div>
 <strong className="text-indigo-300 font-mono block text-[11px] mb-0.5">Propuesta de Arreglo:</strong>
 <p className="leading-relaxed whitespace-pre-line bg-black/40 p-2.5 rounded-[var(--r-s)] font-sans text-[var(--ink-2)]">
 {generatedIdea.descripcionArreglo}
 </p>
 </div>

 {generatedIdea.tablaturaOAcordes && (
 <div>
 <strong className="text-[var(--acc)]/70 font-mono block text-[11px] mb-0.5">Tablatura / Acordes / Guía:</strong>
 <pre className="p-2 rounded-[var(--r-s)] bg-black text-[11px] font-mono text-[var(--ink)] overflow-x-auto">
 {generatedIdea.tablaturaOAcordes}
 </pre>
 </div>
 )}

 {generatedIdea.notasParaBanda && (
 <div>
 <strong className="text-[var(--ink-2)] font-mono block text-[11px] mb-0.5">Consejo de Estudio:</strong>
 <p className="text-[11px] text-[var(--ink)]/90 italic">"{generatedIdea.notasParaBanda}"
 </p>
 </div>
 )}
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={handleGenerateIdea}
 disabled={isGenerating}
 className="px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-xs font-mono font-bold text-[var(--ink-2)] transition-all cursor-pointer"
 >
 🔄 Probar otra idea
 </button>
 <button
 type="button"
 onClick={handleAcceptAndAddIdea}
 className="px-4 py-2 rounded-[var(--r-m)] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-mono font-bold text-[var(--ink)] flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>Añadir como Nueva Idea al Tema</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};

import React, { useState, useEffect, useRef } from'react';
import {
 X,
 Play,
 Pause,
 RotateCcw,
 Sparkles,
 Edit3,
 Save,
 Printer,
 Music2,
 Sliders,
 ChevronDown,
 ChevronUp,
 FileText,
 UserCheck,
 Zap,
 Info,
 Wand2,
 Copy,
 Check,
 ListMusic,
 Share2,
 MessageSquare,
 Upload
} from'lucide-react';
import { Song, SongSubstituteGuide } from'../types';
import { formatSongTitle } from'../utils/formatSongTitle';
import { ShareModal } from'./ShareModal';
import { ModalPortal } from'./common/ModalPortal';
import { formatSongShareText } from'../utils/shareUtils';
import { SongStudioStructureUploadModal } from'./song_studio/SongStudioStructureUploadModal';
import {
 processChordText,
 extractUniqueChords,
 GUITAR_CHORD_DATABASE,
 GuitarChordShape,
 transposeChordToken,
 parseRootNote
} from'../utils/chordUtils';

interface SongChordsViewerModalProps {
 song: Song;
 onClose: () => void;
 onUpdateSong: (updated: Song) => void;
}

export function SongChordsViewerModal({
 song,
 onClose,
 onUpdateSong
}: SongChordsViewerModalProps) {
 const [activeTab, setActiveTab] = useState<'chords' |'substitute' |'edit'>('chords');
 const [notation, setNotation] = useState<'ES' |'EN'>('ES');
 const [transpose, setTranspose] = useState<number>(0);
 
 // Auto-scroll state
 const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
 const [scrollSpeed, setScrollSpeed] = useState<number>(2); // 1 = slow, 3 = fast
 const scrollContainerRef = useRef<HTMLDivElement>(null);

 // Show Chord Diagrams drawer/panel
 const [showChordDiagrams, setShowChordDiagrams] = useState<boolean>(true);

 // Edit form state
 const [cifradoTexto, setCifradoTexto] = useState<string>(
 song.cifradoTexto || getSampleCifrado(song)
 );
 const [guiaSustituto, setGuiaSustituto] = useState<SongSubstituteGuide>(
 song.guiaSustituto || getSampleSubstituteGuide(song)
 );

 // AI Generation loading state
 const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
 const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
 const [copiedText, setCopiedText] = useState<boolean>(false);
 const [showShareModal, setShowShareModal] = useState<boolean>(false);
 const [showStructureUploadModal, setShowStructureUploadModal] = useState<boolean>(false);

 // El estado de edición solo se inicializa desde `song` al montar (useState no vuelve a leer
 // sus argumentos). Cuando la subida de estructura o la generación con IA actualizan `song`
 // desde fuera del formulario de edición, había que cerrar y reabrir el modal para verlo:
 // este efecto sincroniza el estado local en cuanto cambian los valores reales de la canción.
 useEffect(() => {
 setCifradoTexto(song.cifradoTexto || getSampleCifrado(song));
 setGuiaSustituto(song.guiaSustituto || getSampleSubstituteGuide(song));
 }, [song.cifradoTexto, song.guiaSustituto]);

 // Auto-scroll timer effect
 useEffect(() => {
 let interval: any = null;
 if (isAutoScrolling) {
 interval = setInterval(() => {
 if (scrollContainerRef.current) {
 const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
 if (scrollTop + clientHeight >= scrollHeight - 5) {
 setIsAutoScrolling(false);
 } else {
 scrollContainerRef.current.scrollTop += scrollSpeed * 0.8;
 }
 }
 }, 50);
 } else {
 clearInterval(interval);
 }
 return () => clearInterval(interval);
 }, [isAutoScrolling, scrollSpeed]);

 // Handle AI chord generation
 const handleGenerateWithAi = async () => {
 try {
 setIsGeneratingAi(true);
 setAiSuccessMsg(null);

 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') ||'';
 const headers: Record<string, string> = {'Content-Type':'application/json' };
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }

 const response = await fetch('/api/generate-song-chords', {
 method:'POST',
 headers,
 body: JSON.stringify({
 songId: song.id,
 titulo: song.titulo,
 tonalidad: song.tonalidad,
 bpm: song.bpm,
 afinacion: song.afinacion,
 notasInternas: song.notasInternas,
 esVersionCovers: song.esVersionCovers,
 artista: song.albumDisco,
 audioUrl: song.audioPrincipalUrl || undefined
 })
 });

 const data = await response.json();
 if (!response.ok || !data.success) {
 throw new Error(data.error ||'Error al generar acordes con IA');
 }

 setCifradoTexto(data.cifradoTexto);
 if (data.guiaSustituto) {
 setGuiaSustituto(data.guiaSustituto);
 }

 const updatedSong: Song = {
 ...song,
 cifradoTexto: data.cifradoTexto,
 guiaSustituto: data.guiaSustituto
 };
 onUpdateSong(updatedSong);

 // Igual que en el análisis automático: el mensaje debe distinguir una transcripción
 // real, una propuesta honesta de la IA (aproximada o no) y la plantilla de relleno
 // genérica cuando la IA falla del todo, en vez de llamar"éxito" a las tres por igual.
 if (data.chordsSource ==='audio_real') {
 setAiSuccessMsg('✓ Letra y acordes transcritos del audio real');
 } else if (data.chordsSource ==='ia_sin_audio' && !data.esAproximado) {
 setAiSuccessMsg('✓ Cifrado propuesto por IA a partir del título y la tonalidad');
 } else if (data.chordsSource ==='ia_sin_audio' && data.esAproximado) {
 setAiSuccessMsg('⚠️ Acordes aproximados de memoria, sin confirmar: verifícalos de oído');
 } else {
 setAiSuccessMsg('⚠️ La IA no respondió: se ha puesto un cifrado de plantilla genérico, revísalo');
 }
 setTimeout(() => setAiSuccessMsg(null), 5000);
 } catch (err: any) {
 console.error('Error generating with AI:', err);
 setAiSuccessMsg(`⚠️ ${err.message ||'No se pudieron generar los acordes'}`);
 setTimeout(() => setAiSuccessMsg(null), 5000);
 } finally {
 setIsGeneratingAi(false);
 }
 };

 // Save manual edit changes
 const handleSaveEdits = () => {
 const updatedSong: Song = {
 ...song,
 cifradoTexto,
 guiaSustituto
 };

 // Save to server
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') ||'';
 const headers: Record<string, string> = {'Content-Type':'application/json' };
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }

 fetch(`/api/songs/${song.id}`, {
 method:'PUT',
 headers,
 body: JSON.stringify(updatedSong)
 }).catch(err => console.error('Error saving song chords:', err));

 onUpdateSong(updatedSong);
 setActiveTab('chords');
 setAiSuccessMsg('¡Cambios guardados con éxito!');
 setTimeout(() => setAiSuccessMsg(null), 3000);
 };

 // Process text according to current transpose and notation
 const processedText = processChordText(cifradoTexto, transpose, notation);
 const uniqueChords = extractUniqueChords(processedText);

 // Copy chords to clipboard
 const handleCopyChords = () => {
 navigator.clipboard.writeText(processedText);
 setCopiedText(true);
 setTimeout(() => setCopiedText(false), 2000);
 };

 return (
 <ModalPortal isOpen={true} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
 <div className="relative bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-[var(--ink)] my-auto">

 {/* CLOSE BUTTON — fixed to the modal's top-right corner, independent of header actions */}
 <button
 type="button"
 onClick={onClose}
 className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-[var(--sunken)] hover:bg-rose-500/30 text-[var(--ink-2)] hover:text-[var(--ink-2)] transition cursor-pointer"
 title="Cerrar"
 >
 <X className="w-5 h-5" />
 </button>

 {/* MODAL HEADER */}
 <div className="bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-purple-950/40 p-4 pr-12 border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--acc)]">
 <Music2 className="w-6 h-6" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">{formatSongTitle(song.titulo)}</h2>
 {song.esVersionCovers && (
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">
 Cover
 </span>
 )}
 </div>
 <div className="flex items-center gap-3 text-xs text-[var(--ink-2)] font-mono mt-0.5">
 <span>Tonalidad: <strong className="text-[var(--acc)]">{song.tonalidad ||'Mim'}</strong></span>
 <span>•</span>
 <span>Tempo: <strong className="text-emerald-400">{song.bpm || 120} BPM</strong></span>
 {song.afinacion && (
 <>
 <span>•</span>
 <span>Afinación: <strong className="text-purple-300">{song.afinacion}</strong></span>
 </>
 )}
 {song.duracion && (
 <>
 <span>•</span>
 <span>Duración: <strong className="text-[var(--ink-2)]">{song.duracion}</strong></span>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-1.5">
 {/* AI Generate — the main action, keeps its label */}
 <button
 type="button"
 onClick={handleGenerateWithAi}
 disabled={isGeneratingAi}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-purple-600 hover:bg-purple-500 text-[var(--ink)] font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-950/50 disabled:opacity-50"
 title={song.audioPrincipalUrl ?'Reanalizar escuchando el audio real de la canción' :'Generar cifrado y guía con IA (sin audio disponible)'}
 >
 <Wand2 className={`w-4 h-4 text-purple-200 ${isGeneratingAi ?'animate-spin' :''}`} />
 <span>{isGeneratingAi ?'Generando...' :'IA Cifrado'}</span>
 </button>

 {/* Secondary actions — icon-only to keep the header clean */}
 <button
 type="button"
 onClick={() => setShowStructureUploadModal(true)}
 className="p-2 rounded-[var(--r-m)] bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 transition cursor-pointer"
 title="Subir PDF, imagen o Word con acordes - IA extrae automáticamente"
 >
 <Upload className="w-4 h-4" />
 </button>

 <button
 type="button"
 onClick={() => setShowShareModal(true)}
 className="p-2 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-emerald-500/20 text-[var(--ink-2)] hover:text-[var(--ink-2)] transition cursor-pointer"
 title="Compartir canción y acordes por WhatsApp o App"
 >
 <MessageSquare className="w-4 h-4" />
 </button>

 <button
 type="button"
 onClick={() => window.print()}
 className="p-2 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
 title="Imprimir Cifrado"
 >
 <Printer className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* TOOLBAR CONTROLS BAR (LaCuerda / Ultimate Guitar Toolbar) */}
 <div className="bg-[var(--surface)]/80 px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
 
 {/* TABS SELECTOR */}
 <div className="flex items-center bg-[var(--sunken)] p-1 rounded-[var(--r-m)]">
 <button
 type="button"
 onClick={() => setActiveTab('chords')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 transition cursor-pointer ${
 activeTab ==='chords'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <FileText className="w-3.5 h-3.5" />
 <span>Letra y Acordes</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('substitute')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 transition cursor-pointer ${
 activeTab ==='substitute'
 ?'bg-purple-600 text-[var(--ink)] shadow'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <UserCheck className="w-3.5 h-3.5" />
 <span>Ficha Sustituto URGENTE</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveTab('edit')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] font-bold flex items-center gap-1.5 transition cursor-pointer ${
 activeTab ==='edit'
 ?'bg-[var(--surface)]/80 text-[var(--ink)] shadow'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Edit3 className="w-3.5 h-3.5" />
 <span>Editar</span>
 </button>
 </div>

 {/* INTERACTIVE CONTROLS (Only visible on chords tab) */}
 {activeTab ==='chords' && (
 <div className="flex flex-wrap items-center gap-3">
 
 {/* TRANSPOSITION CONTROL */}
 <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
 <span className="text-[11px] text-[var(--ink-2)] mr-1">Tono:</span>
 <button
 type="button"
 onClick={() => setTranspose(prev => prev - 1)}
 className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
 title="Bajar 1 semitono"
 >
 -1
 </button>
 <span className={`w-8 text-center font-bold ${transpose !== 0 ?'text-[var(--acc)]' :'text-[var(--ink-2)]'}`}>
 {transpose > 0 ? `+${transpose}` : transpose}
 </span>
 <button
 type="button"
 onClick={() => setTranspose(prev => prev + 1)}
 className="px-2 py-0.5 rounded bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)] font-bold transition cursor-pointer"
 title="Subir 1 semitono"
 >
 +1
 </button>
 {transpose !== 0 && (
 <button
 type="button"
 onClick={() => setTranspose(0)}
 className="p-1 rounded text-[var(--ink-2)] hover:text-[var(--acc)] transition cursor-pointer ml-1"
 title="Restablecer Tono Original"
 >
 <RotateCcw className="w-3 h-3" />
 </button>
 )}
 </div>

 {/* NOTATION TOGGLE (Latino / C-D-E) */}
 <button
 type="button"
 onClick={() => setNotation(prev => prev ==='ES' ?'EN' :'ES')}
 className="px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--sunken)] hover: text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition cursor-pointer flex items-center gap-1"
 title="Cambiar entre Cifrado Latino (Do, Re, Mi) e Inglés (C, D, E)"
 >
 <span>Cifrado:</span>
 <span className="text-[var(--acc)]">{notation ==='ES' ?'Do - Re - Mi' :'C - D - E'}</span>
 </button>

 {/* AUTO-SCROLL CONTROLLER */}
 <div className="flex items-center gap-1.5 bg-[var(--sunken)] px-2 py-1 rounded-[var(--r-m)]">
 <button
 type="button"
 onClick={() => setIsAutoScrolling(!isAutoScrolling)}
 className={`px-2.5 py-0.5 rounded-[var(--r-s)] font-bold flex items-center gap-1 transition cursor-pointer ${
 isAutoScrolling
 ?'bg-emerald-600 text-[var(--ink)] animate-pulse'
 :'bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Iniciar/Pausar Desfile Automático"
 >
 {isAutoScrolling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
 <span>Autoscroll</span>
 </button>

 {isAutoScrolling && (
 <div className="flex items-center gap-1 ml-1">
 <span className="text-[10px] text-[var(--ink-2)]">Vel:</span>
 {[1, 2, 3].map(v => (
 <button
 key={v}
 type="button"
 onClick={() => setScrollSpeed(v)}
 className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center transition cursor-pointer ${
 scrollSpeed === v ?'bg-emerald-500 text-[var(--ink)]' :'bg-[var(--ink)]/10 text-[var(--ink-2)]'
 }`}
 >
 {v}x
 </button>
 ))}
 </div>
 )}
 </div>

 {/* TOGGLE CHORD DIAGRAMS */}
 <button
 type="button"
 onClick={() => setShowChordDiagrams(!showChordDiagrams)}
 className={`px-2.5 py-1 rounded-[var(--r-m)] font-bold transition cursor-pointer ${
 showChordDiagrams
 ?'bg-purple-950/40 border-[var(--acc)]/50 text-purple-300'
 :'bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 🎸 Diagramas
 </button>

 {/* COPY BUTTON */}
 <button
 type="button"
 onClick={handleCopyChords}
 className="p-1.5 rounded-[var(--r-m)] bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition cursor-pointer"
 title="Copiar texto de acordes"
 >
 {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
 </button>
 </div>
 )}
 </div>

 {/* AI SUCCESS NOTIFICATION BANNER */}
 {aiSuccessMsg && (
 <div
 className={`border-b px-4 py-2 text-xs font-mono flex items-center justify-between animate-in fade-in ${
 aiSuccessMsg.startsWith('⚠️')
 ?'bg-[var(--acc-soft)] /40 text-[var(--acc)]/70'
 :'bg-[var(--ok-soft)] border-[var(--ok)]/40 text-[var(--ink-2)]'
 }`}
 >
 <span className="flex items-center gap-2">
 <Sparkles className={`w-4 h-4 shrink-0 ${aiSuccessMsg.startsWith('⚠️') ?'text-[var(--acc)]' :'text-emerald-400'}`} />
 {aiSuccessMsg}
 </span>
 <button
 onClick={() => setAiSuccessMsg(null)}
 className={aiSuccessMsg.startsWith('⚠️') ?'text-[var(--acc)] hover:text-[var(--ink)]' :'text-emerald-400 hover:text-[var(--ink)]'}
 >
 ✕
 </button>
 </div>
 )}

 {/* MODAL BODY */}
 <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
 
 {/* MAIN CONTENT AREA */}
 <div
 ref={scrollContainerRef}
 className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
 >
 {/* TAB 1: CHORDS & LYRICS SHEET (LaCuerda style) */}
 {activeTab ==='chords' && (
 <div className="space-y-6 max-w-3xl mx-auto">
 
 {/* SUBSTITUTE QUICK SUMMARY BANNER */}
 {guiaSustituto?.estructura && (
 <div className="bg-gradient-to-r from-purple-950/40 via-[var(--surface)] to-[var(--sunken)] p-3.5 rounded-[var(--r-m)] text-xs font-mono space-y-1.5">
 <div className="flex items-center justify-between text-purple-300 font-bold">
 <span className="flex items-center gap-1.5">
 <Zap className="w-4 h-4 text-[var(--acc)]" />
 Estructura Rápida para el Músico:
 </span>
 <button
 onClick={() => setActiveTab('substitute')}
 className="text-[10px] underline text-purple-400 hover:text-[var(--ink)]"
 >
 Ver Ficha Completa →
 </button>
 </div>
 <p className="text-[var(--ink-2)] text-sm font-semibold tracking-wide bg-[var(--sunken)] p-2 rounded-[var(--r-s)] border-[var(--hair)]5">
 {guiaSustituto.estructura}
 </p>
 </div>
 )}

 {/* THE CHORD SHEET DISPLAY */}
 <div className="bg-[var(--sunken)] p-6 rounded-[var(--r-l)] shadow-inner font-mono text-sm leading-relaxed whitespace-pre-wrap select-text">
 {renderFormattedChordSheet(processedText)}
 </div>
 </div>
 )}

 {/* TAB 2: SUBSTITUTE QUICK GUIDE (FICHA PARA MÚSICO SUSTITUTO) */}
 {activeTab ==='substitute' && (
 <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
 <div className="bg-gradient-to-br from-purple-950/60 to-[var(--surface)] p-6 rounded-[var(--r-l)] shadow-xl space-y-5">
 <div className="flex items-center gap-3 border-b border-[var(--acc)]/30 pb-4">
 <div className="p-3 rounded-[var(--r-m)] bg-purple-600 text-[var(--ink)] shadow-lg">
 <UserCheck className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-[var(--ink)]">Ficha de Sustitución Urgente</h3>
 <p className="text-xs text-purple-300 font-mono">
 Resumen express para tocar el tema correctamente en directo o ensayo sin margen de error.
 </p>
 </div>
 </div>

 {/* GUIDES GRID */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
 <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] border-[var(--hair)]10 space-y-1.5">
 <span className="text-[var(--acc)] font-bold block text-[11px] uppercase tracking-wider">
 1. Estructura Exacta del Tema
 </span>
 <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
 {guiaSustituto.estructura ||'Sin estructura definida.'}
 </p>
 </div>

 <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] border-[var(--hair)]10 space-y-1.5">
 <span className="text-emerald-400 font-bold block text-[11px] uppercase tracking-wider">
 2. Progresión Armónica Clave
 </span>
 <p className="text-[var(--ink)] text-sm font-semibold leading-relaxed">
 {guiaSustituto.progresionClave ||'Ver cifrado completo.'}
 </p>
 </div>

 <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] border-[var(--hair)]10 space-y-1.5">
 <span className="text-rose-400 font-bold block text-[11px] uppercase tracking-wider">
 3. Cortes, Entradas y Claves
 </span>
 <p className="text-[var(--ink-2)] leading-relaxed">
 {guiaSustituto.cortesYClaves ||'Sin indicaciones especiales de cortes.'}
 </p>
 </div>

 <div className="bg-[var(--sunken)] p-4 rounded-[var(--r-m)] border-[var(--hair)]10 space-y-1.5">
 <span className="text-purple-300 font-bold block text-[11px] uppercase tracking-wider">
 4. Capo / Afinación
 </span>
 <p className="text-[var(--ink-2)] leading-relaxed">
 {guiaSustituto.capoTraste ||'Standard / Sin Capo'}
 </p>
 </div>

 <div className="sm:col-span-2 bg-[var(--sunken)] p-4 rounded-[var(--r-m)] border-[var(--hair)]10 space-y-1.5">
 <span className="text-cyan-400 font-bold block text-[11px] uppercase tracking-wider">
 5. Protagonismo de Instrumentos / Arreglos
 </span>
 <p className="text-[var(--ink-2)] leading-relaxed">
 {guiaSustituto.instrumentosClave ||'Seguir el pulso principal de batería y bajo.'}
 </p>
 </div>
 </div>

 <div className="pt-2 flex justify-end">
 <button
 type="button"
 onClick={() => setActiveTab('edit')}
 className="px-4 py-2 rounded-[var(--r-m)] bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2"
 >
 <Edit3 className="w-4 h-4" />
 <span>Editar esta Ficha de Sustitución</span>
 </button>
 </div>
 </div>
 </div>
 )}

 {/* TAB 3: EDIT MODE */}
 {activeTab ==='edit' && (
 <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in">
 <div className="bg-[var(--surface)]/90 p-5 rounded-[var(--r-l)] space-y-4">
 <div className="flex items-center justify-between border-b pb-3">
 <h3 className="font-bold text-[var(--ink)] flex items-center gap-2 text-sm font-mono">
 <Edit3 className="w-4 h-4 text-[var(--acc)]" />
 Editor de Cifrado y Ficha
 </h3>
 <button
 type="button"
 onClick={handleSaveEdits}
 className="px-4 py-2 rounded-[var(--r-m)] bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)] font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg"
 >
 <Save className="w-4 h-4" />
 <span>Guardar Cambios</span>
 </button>
 </div>

 <div>
 <label className="text-xs font-mono font-bold text-[var(--acc)] block mb-1">
 Texto con Letra y Acordes (Formato LaCuerda o [Acorde] inline):
 </label>
 <textarea
 value={cifradoTexto}
 onChange={(e) => setCifradoTexto(e.target.value)}
 rows={14}
 className="w-full p-3 bg-black rounded-[var(--r-m)] text-[var(--ink)] font-mono text-xs focus:outline-none focus: leading-relaxed"
 placeholder={`[Intro]\nMim Do Re Mim\n\n[Estribillo]\n[Sol] Que tiene tu [Re] veneno [Mim] ...`}
 />
 </div>

 <div className="pt-3 border-t space-y-3">
 <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
 Campos de la Ficha del Músico Sustituto:
 </h4>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
 <div>
 <label className="text-[var(--ink-2)] block mb-0.5">Estructura Exacta del Tema:</label>
 <input
 type="text"
 value={guiaSustituto.estructura ||''}
 onChange={(e) => setGuiaSustituto({ ...guiaSustituto, estructura: e.target.value })}
 className="w-full p-2 bg-black rounded-[var(--r-s)] text-[var(--ink)]"
 placeholder="Intro -> Verso -> Estribillo -> Outro"
 />
 </div>

 <div>
 <label className="text-[var(--ink-2)] block mb-0.5">Progresiones Clave:</label>
 <input
 type="text"
 value={guiaSustituto.progresionClave ||''}
 onChange={(e) => setGuiaSustituto({ ...guiaSustituto, progresionClave: e.target.value })}
 className="w-full p-2 bg-black rounded-[var(--r-s)] text-[var(--ink)]"
 placeholder="Verso: Mim - Do | Estribillo: Sol - Re"
 />
 </div>

 <div>
 <label className="text-[var(--ink-2)] block mb-0.5">Cortes y Claves en Vivo:</label>
 <input
 type="text"
 value={guiaSustituto.cortesYClaves ||''}
 onChange={(e) => setGuiaSustituto({ ...guiaSustituto, cortesYClaves: e.target.value })}
 className="w-full p-2 bg-black rounded-[var(--r-s)] text-[var(--ink)]"
 placeholder="Parón en compás 8..."
 />
 </div>

 <div>
 <label className="text-[var(--ink-2)] block mb-0.5">Capo / Afinación:</label>
 <input
 type="text"
 value={guiaSustituto.capoTraste ||''}
 onChange={(e) => setGuiaSustituto({ ...guiaSustituto, capoTraste: e.target.value })}
 className="w-full p-2 bg-black rounded-[var(--r-s)] text-[var(--ink)]"
 placeholder="Capo 2º traste"
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* RIGHT SIDEBAR: CHORD DIAGRAMS DRAWER */}
 {activeTab ==='chords' && showChordDiagrams && (
 <div className="w-full md:w-64 bg-[var(--surface)] border-t md:border-t-0 md:border-l p-4 overflow-y-auto shrink-0 space-y-4">
 <div className="flex items-center justify-between border-b pb-2">
 <span className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
 🎸 Posiciones de Acordes ({uniqueChords.length})
 </span>
 <button
 type="button"
 onClick={() => setShowChordDiagrams(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] text-xs"
 >
 ✕
 </button>
 </div>

 {uniqueChords.length === 0 ? (
 <p className="text-xs text-[var(--ink-2)] font-mono italic">
 No se detectaron acordes en el texto.
 </p>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
 {uniqueChords.map(chord => (
 <ChordDiagramBox key={chord} chord={chord} />
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* SHARE MODAL FOR WHATSAPP / APPS */}
 <ShareModal
 isOpen={showShareModal}
 onClose={() => setShowShareModal(false)}
 title={song.titulo}
 subtitle="Canción y cifrado para WhatsApp"
 initialText={formatSongShareText(song, { includeChords: true, includeGuide: true })}
 itemType="song"
 />

 {/* STRUCTURE UPLOAD MODAL */}
 <SongStudioStructureUploadModal
 song={song}
 isOpen={showStructureUploadModal}
 onClose={() => setShowStructureUploadModal(false)}
 onUpdateSong={onUpdateSong}
 />
 </div>
 </ModalPortal>
 );
}

// RENDER FUNCTION FOR FORMATTED CHORD SHEET WITH HIGHLIGHTED CHORDS
function renderFormattedChordSheet(text: string) {
 if (!text) return <span className="text-[var(--ink-2)] italic">Sin cifrado disponible. Usa el botón de IA para generarlo.</span>;

 const lines = text.split('\n');

 return lines.map((line, idx) => {
 // Check if section header like [Intro], [Estribillo], [Solo], etc.
 if (/^\[(Intro|Verso|Estribillo|Coro|Puente|Solo|Outro|Coda|Final|Intro\s\d+|Verso\s\d+)\]/i.test(line.trim())) {
 return (
 <div key={idx} className="text-purple-400 font-bold text-base my-2 pt-2 border-t /60 flex items-center gap-2">
 <span className="px-2.5 py-0.5 rounded bg-purple-950/80 text-purple-300">
 {line.trim()}
 </span>
 </div>
 );
 }

 // Check if inline bracket chord format: [Do] Que tiene tu [Sol] veneno
 if (line.includes('[')) {
 const parts = line.split(/(\[[A-Za-z0-9#\/]+\])/g);
 return (
 <div key={idx} className="py-0.5">
 {parts.map((part, pIdx) => {
 if (part.startsWith('[') && part.endsWith(']')) {
 const chordName = part.slice(1, -1);
 return (
 <span
 key={pIdx}
 className="font-bold text-[var(--acc)] bg-[var(--acc-soft)] px-1 py-0.5 rounded mx-0.5 text-xs shadow-sm"
 >
 {chordName}
 </span>
 );
 }
 return <span key={pIdx} className="text-[var(--ink-2)]">{part}</span>;
 })}
 </div>
 );
 }

 // Otherwise check if line contains chords separated by spaces. Usa el mismo validador de
 // acordes (parseRootNote) que la transposición y la lista de diagramas: antes esta línea
 // tenía su propia regex duplicada que solo miraba si el token EMPEZABA por una nota, sin
 // validar el resto ("Get","Fire","Baby" contaban como acordes en letras en inglés).
 const tokens = line.trim().split(/\s+/);
 const chordCount = tokens.filter(t => parseRootNote(t) !== null).length;
 const isChordLine = chordCount > 0 && chordCount / tokens.length >= 0.7;

 if (isChordLine) {
 return (
 <div key={idx} className="font-bold text-[var(--acc)] text-sm tracking-wide py-0.5 leading-none select-none">
 {line}
 </div>
 );
 }

 // Standard lyrics line
 return (
 <div key={idx} className="text-[var(--ink-2)] py-0.5">
 {line ||'\u00A0'}
 </div>
 );
 });
}

// COMPONENT TO RENDER A SINGLE GUITAR CHORD BOX/FRETBOARD DIAGRAM
const ChordDiagramBox: React.FC<{ chord: string }> = ({ chord }) => {
 // Look up in database or clean name
 const shape: GuitarChordShape | undefined = GUITAR_CHORD_DATABASE[chord];

 return (
 <div className="bg-[var(--sunken)] p-2.5 rounded-[var(--r-m)] text-center space-y-1.5 hover:/40 transition">
 <div className="text-xs font-bold text-[var(--acc)] font-mono flex items-center justify-center gap-1">
 <span>{chord}</span>
 </div>

 {shape ? (
 <div className="flex justify-center pt-1">
 {/* Simple 6-string Guitar Fretboard Grid Representation */}
 <div className="w-24 bg-[var(--surface)] p-1.5 rounded text-[9px] font-mono">
 {shape.baseFret && shape.baseFret > 1 && (
 <div className="text-[8px] text-[var(--acc)] font-bold text-left pl-1">
 Traste {shape.baseFret}
 </div>
 )}
 <div className="grid grid-cols-6 gap-0.5 my-1 text-[var(--ink-2)] border-b pb-0.5">
 {['E','A','D','G','B','E'].map((s, i) => (
 <span key={i} className="text-center">{s}</span>
 ))}
 </div>

 <div className="grid grid-cols-6 gap-0.5 my-1">
 {shape.frets.map((fret, stringIdx) => (
 <div key={stringIdx} className="flex flex-col items-center">
 <span className={`font-bold ${
 fret === -1 ?'text-rose-400' : fret === 0 ?'text-emerald-400' :'text-[var(--acc)]/70'
 }`}>
 {fret === -1 ?'x' : fret === 0 ?'o' : fret}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>
 ) : (
 <p className="text-[10px] text-[var(--ink-2)] font-mono">
 [Acorde Estándar]
 </p>
 )}
 </div>
 );
}

// SAMPLE DEFAULT CHORD SHEETS FOR DEMO SONGS
function getSampleCifrado(song: Song): string {
 if (song.titulo.toLowerCase().includes('brisa') || song.titulo.toLowerCase().includes('rojitas')) {
 return `[Intro]
Lam Fa Sol Lam
Lam Fa Sol Lam

[Verso 1]
Lam Fa
Que tiene tu veneno
 Sol Lam
Que me quita la vida, solo con un beso
 Fa Sol
Y me lleva a la luna y me ofrece la droga
 Lam
Que todo lo cura.

[Estribillo]
Lam Fa
Dependencia bendita
 Sol Lam
Invisible cadena que me ata a la vida
 Fa Sol
Y en momentos oscuros palmadita en la espalda
 Lam
Y ya estoy más seguro.

[Solo]
Fa Sol Lam Lam
Fa Sol Lam Lam

[Outro]
Fa Sol Lam
Rojitas las orejas...`;
 }

 return `[Intro]
Mim Do Re Mim
Mim Do Re Mim

[Verso 1]
[Mim] Arrancamos la noche en la [Do] ciudad
[Re] Buscando el sonido de la [Mim] libertad
[Mim] Guitarras encendidas y el [Do] viento a favor
[Re] Marcando el ritmo con el [Mim] corazón.

[Estribillo]
[Sol] Siente la fuerza del [Re] rock en las venas
[Mim] Rompiendo juntos todas las [Do] cadenas
[Sol] Noche de garaje, [Re] fuego y pasión
[Mim] Cantando juntos la [Do] misma canción.

[Solo]
Mim Do Re Mim

[Outro]
[Mim] Cierre con final seco en [Do] [Re] [Mim]`;
}

function getSampleSubstituteGuide(song: Song): SongSubstituteGuide {
 return {
 estructura:'Intro (4T) -> Verso 1 -> Estribillo -> Verso 2 -> Estribillo -> Solo de Guitarra -> Outro',
 progresionClave:'Verso: Mim - Do - Re - Mim | Estribillo: Sol - Re - Mim - Do',
 cortesYClaves:'Corte seco en el compás 8 del solo. Entrada de voz sola en el verso 2.',
 capoTraste:'Sin Capo / Afinación Standard E',
 instrumentosClave:'Entrada potente de vientos en el estribillo. Redoble de batería para paso a solo.'
 };
}

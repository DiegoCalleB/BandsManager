import React, { useState, useRef, useEffect } from'react';
import { Song, ThemeColors } from'../../types';
import { formatSongTitle } from'../../utils/formatSongTitle';
import {
 Play,
 Pause,
 Star,
 FileText,
 Users,
 Headphones,
 Edit3,
 Trash2,
 Share2,
 ExternalLink,
 MoreVertical,
 ArrowUp,
 ArrowDown,
 Volume2,
 Music,
 Check,
 GripVertical,
 Sparkles,
 Cpu
} from'lucide-react';
import { hasIrisStems } from'../../utils/irisTracks';

export interface SongCardRowProps {
 song: Song;
 index: number;
 isPlayingCurrent: boolean;
 isPlayerPlaying: boolean;
 onPlay: () => void;
 onSelect?: () => void;
 onToggleFavorite: () => void;
 onOpenChords?: () => void;
 onOpenMemberNotes?: () => void;
 onOpenStudio?: () => void;
 onOpenIris?: () => void;
 onEditSong?: () => void;
 onDeleteSong?: () => void;
 onShareSong?: () => void;
 externalLink?: string;
 showAlbumBadge?: boolean;
 showCheckbox?: boolean;
 isSelected?: boolean;
 onToggleSelect?: () => void;
 showReorder?: boolean;
 onMoveUp?: () => void;
 onMoveDown?: () => void;
 canMoveUp?: boolean;
 canMoveDown?: boolean;
 draggable?: boolean;
 onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
 onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
 onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
 onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
 onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
 isDragging?: boolean;
 isDragOver?: boolean;
 colors?: ThemeColors;
 isStitchLight?: boolean;
}

export const SongCardRow: React.FC<SongCardRowProps> = ({
 song,
 index,
 isPlayingCurrent,
 isPlayerPlaying,
 onPlay,
 onSelect,
 onToggleFavorite,
 onOpenChords,
 onOpenMemberNotes,
 onOpenStudio,
 onOpenIris,
 onEditSong,
 onDeleteSong,
 onShareSong,
 externalLink,
 showAlbumBadge = false,
 showCheckbox = false,
 isSelected = false,
 onToggleSelect,
 showReorder = false,
 onMoveUp,
 onMoveDown,
 canMoveUp = false,
 canMoveDown = false,
 draggable = false,
 onDragStart,
 onDragOver,
 onDragLeave,
 onDrop,
 onDragEnd,
 isDragging = false,
 isDragOver = false,
 colors,
 isStitchLight = false,
}) => {
 const [showMenu, setShowMenu] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);

 // Close menu on outside click
 useEffect(() => {
 if (!showMenu) return;
 const handleClickOutside = (e: MouseEvent) => {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 setShowMenu(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [showMenu]);

 const isPlaying = isPlayingCurrent && isPlayerPlaying;
 const displayTitle = formatSongTitle(song.titulo) || song.titulo;
 const albumLabel = song.albumDisco || song.album ||'Sin Disco';
 const durationText = song.duracion || (song.duracionSegundos ? `${Math.floor(song.duracionSegundos / 60)}:${String(Math.floor(song.duracionSegundos % 60)).padStart(2,'0')}` :'—');
 const hasMemberNotes = song.notasMiembros && Object.values(song.notasMiembros).some((v) => typeof v ==='string' && v.trim().length > 0);
 const ideasCount = (song.audioIdeas || []).length;
 const isDriveAudio = (song.audioPrincipalUrl ||'').includes('drive.google.com');

 return (
 <div
 draggable={draggable}
 onDragStart={onDragStart}
 onDragOver={onDragOver}
 onDragLeave={onDragLeave}
 onDrop={onDrop}
 onDragEnd={onDragEnd}
 className={`group relative rounded-[var(--r-m)] transition-all duration-150 ${
 isDragging
 ?'opacity-30 scale-[0.98] border-dashed border-emerald-500'
 : isDragOver
 ?'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-500/10'
 : isPlayingCurrent
 ? isStitchLight
 ?'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm ring-1 ring-emerald-400/30'
 :'bg-emerald-500/10 border-emerald-500/30 text-white shadow-sm ring-1 ring-emerald-500/20'
 : isSelected
 ? isStitchLight
 ?'bg-amber-50/80 text-[var(--ink)]'
 :'bg-amber-500/10 /30 text-zinc-100'
 : isStitchLight
 ?'bg-white hover:bg-[var(--bg)] /80 text-[var(--ink)] shadow-xs'
 :'bg-[#16161a]/90 hover:bg-[#1f1f24] /80 hover: text-zinc-200 shadow-xs'
 } ${draggable ?'cursor-grab active:cursor-grabbing' :''}`}
 >
 <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:px-3.5 sm:py-2.5 overflow-x-auto">
 {/* Drag Handle (when draggable) */}
 {draggable && (
 <div 
 className="shrink-0 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing -mr-0.5"
 title="Arrastrar para reordenar canción"
 >
 <GripVertical className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
 </div>
 )}

 {/* Bulk select checkbox (if enabled) */}
 {showCheckbox && onToggleSelect && (
 <div className="shrink-0 flex items-center justify-center pr-0.5" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={isSelected}
 onChange={onToggleSelect}
 className="w-4 h-4 rounded cursor-pointer accent-amber-500"
 aria-label={`Seleccionar ${displayTitle}`}
 />
 </div>
 )}

 {/* Play button / Track index */}
 <div className="shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
 <button
 type="button"
 onClick={onPlay}
 className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
 isPlaying
 ?'bg-emerald-500 text-black shadow-md scale-105'
 : isStitchLight
 ?'bg-[var(--sunken)] hover:bg-emerald-500 text-[var(--ink-2)] hover:text-black'
 :'bg-neutral-800 hover:bg-emerald-500 text-zinc-300 hover:text-black group-hover:scale-105 shadow-xs'
 }`}
 title={isPlaying ?'Pausar canción' : `Reproducir ${displayTitle}`}
 >
 {isPlaying ? (
 <div className="flex items-center gap-0.5">
 <span className="w-0.5 h-3 bg-black rounded-full animate-pulse" />
 <span className="w-0.5 h-4 bg-black rounded-full animate-pulse delay-75" />
 <span className="w-0.5 h-2.5 bg-black rounded-full animate-pulse delay-150" />
 </div>
 ) : (
 <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
 )}
 </button>
 </div>

 {/* Optional Cover image (hidden on tiny screens if no cover) */}
 {song.portadaUrl ? (
 <div className="hidden sm:block w-8.5 h-8.5 rounded-[var(--r-s)] overflow-hidden shrink-0 shadow-xs">
 <img src={song.portadaUrl} alt={displayTitle} className="w-full h-full object-cover" />
 </div>
 ) : null}

 {/* Track Number display (subtle) */}
 <span className="text-xs text-[var(--ink-2)] w-4 shrink-0 text-center hidden md:inline-block font-medium">
 {index}
 </span>

 {/* Central Info: Title, Details & Badges */}
 <div
 className="shrink-0 max-w-[50vw] sm:max-w-none sm:flex-1 sm:min-w-0 cursor-pointer"
 onClick={() => {
 if (onSelect) onSelect();
 }}
 >
 {/* Line 1: Title & Favorite Star */}
 <div className="flex items-center gap-2">
 <span
 className={`truncate text-xs sm:text-sm font-semibold tracking-tight ${
 isPlayingCurrent
 ? isStitchLight
 ?'text-emerald-900 font-bold'
 :'text-emerald-400 font-bold'
 : isStitchLight
 ?'text-[var(--ink)] hover:text-indigo-600'
 :'text-[var(--ink-3)] group-hover:text-white'
 }`}
 title={displayTitle}
 >
 {displayTitle}
 </span>

 {/* Favorite Star Button */}
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onToggleFavorite();
 }}
 className={`p-1 rounded-full transition-all cursor-pointer shrink-0 ${
 song.favoritoGeneral
 ?'text-amber-400 hover:text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
 :'text-[var(--ink-2)] hover:text-amber-400 opacity-60 hover:opacity-100'
 }`}
 title={song.favoritoGeneral ?'Quitar de favoritas' :'Marcar como favorita'}
 >
 <Star className={`w-3.5 h-3.5 ${song.favoritoGeneral ?'fill-amber-400' :''}`} />
 </button>
 </div>

 {/* Line 2: Responsive Badges Bar */}
 <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs flex-wrap">
 {/* Tone & BPM pill */}
 <span
 title={(song.bpmDetectadoEn || song.tonalidadDetectadaEn) ?'Detectado automáticamente por Iris desde el audio' : undefined}
 className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
 isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)]'
 :'bg-neutral-800/90 text-zinc-300'
 }`}
 >
 {song.tonalidad ||'—'}{song.bpm ? ` • ${song.bpm} BPM` :''}{(song.bpmDetectadoEn || song.tonalidadDetectadaEn) ?' 🤖' :''}
 </span>

 {/* Duration */}
 <span className="text-zinc-400 text-xs font-normal">
 {durationText}
 </span>

 {/* Status badge */}
 {song.estadoTema && (
 <span
 className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
 song.estadoTema ==='listo'
 ?'bg-emerald-500/15 text-emerald-300'
 : song.estadoTema ==='ensayando'
 ?'bg-amber-500/15 text-amber-300'
 :'bg-neutral-800 text-zinc-400'
 }`}
 >
 {song.estadoTema ==='listo' ?'Listo' : song.estadoTema ==='ensayando' ?'Ensayando' : song.estadoTema}
 </span>
 )}

 {/* Album Badge (if displayed in full catalog mode) */}
 {showAlbumBadge && albumLabel !=='Sin Disco' && (
 <span className="hidden sm:inline-flex items-center gap-1 text-[var(--ink-3)] text-xs max-w-[140px] truncate">
 <span>•</span>
 <span className="truncate">{albumLabel}</span>
 </span>
 )}

 {/* Audio Indicator */}
 {song.audioPrincipalUrl ? (
 <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
 <Volume2 className="w-2.5 h-2.5" />
 <span>{isDriveAudio ?'Drive' :'Audio'}</span>
 </span>
 ) : ideasCount > 0 ? (
 <span className="hidden xs:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
 <Headphones className="w-2.5 h-2.5" />
 <span>{ideasCount} ideas</span>
 </span>
 ) : null}
 </div>

 {/* Subtle Notes Preview (desktop only to save vertical mobile space) */}
 {song.notasInternas && (
 <p className="hidden md:block text-[10px] text-neutral-500 line-clamp-1 italic mt-0.5 font-sans">
 {song.notasInternas}
 </p>
 )}
 </div>

 {/* Right Section: Direct Quick Actions + Overflow ⋯ Menu */}
 <div className="shrink-0 flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
 {/* 1. Direct Acordes / Chords Button */}
 {onOpenChords && (
 <button
 type="button"
 onClick={onOpenChords}
 className={`hidden sm:flex p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-s)] text-xs font-medium items-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight
 ?'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
 :'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/25'
 }`}
 title="Ver cifrado de acordes, armonía y letra (LaCuerda.net)"
 >
 <FileText className="w-3.5 h-3.5" />
 <span className="hidden sm:inline text-xs">Acordes</span>
 </button>
 )}

 {/* 2. Direct Studio Button */}
 {onOpenStudio && (
 <button
 type="button"
 onClick={onOpenStudio}
 className={`p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-s)] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
 ideasCount > 0
 ?'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 /40 shadow-xs'
 : isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]'
 :'bg-neutral-800 hover:bg-neutral-700 text-zinc-200 /80'
 }`}
 title="Abrir Studio de Grabación Multipista & Pistas"
 >
 <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
 <span className="hidden xs:inline text-xs">Studio</span>
 {ideasCount > 0 && (
 <span className="px-1.5 py-0.2 bg-amber-500/40 text-white rounded-full text-[10px] font-bold">
 {ideasCount}
 </span>
 )}
 </button>
 )}

 {/* 2b. Direct Iris Stem Separator Button */}
 {(onOpenIris || onOpenStudio) && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 if (onOpenIris) onOpenIris();
 else if (onOpenStudio) onOpenStudio();
 }}
 className={`p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 hasIrisStems(song)
 ?'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 /40 shadow-xs'
 : isStitchLight
 ?'bg-amber-50 hover:bg-amber-100 text-amber-900'
 :'bg-[var(--surface)] hover:bg-neutral-800 text-amber-300 /30'
 }`}
 title={hasIrisStems(song) ?'Ver pistas e instrumentos separados con Iris' :'Procesar esta canción con Iris (Separador de Pistas/Stems con IA)'}
 >
 <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
 <span className="hidden sm:inline text-xs font-mono">Iris</span>
 </button>
 )}

 {/* 3. Direct Member Notes Button */}
 {onOpenMemberNotes && (
 <button
 type="button"
 onClick={onOpenMemberNotes}
 className={`hidden sm:flex p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-s)] text-xs font-medium items-center gap-1.5 transition-all cursor-pointer ${
 hasMemberNotes
 ?'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 /30 shadow-xs'
 : isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 :'bg-neutral-800/80 hover:bg-neutral-700 text-zinc-400 hover:text-zinc-200 /70'
 }`}
 title="Ver y editar notas específicas por miembro de la banda"
 >
 <Users className={`w-3.5 h-3.5 ${hasMemberNotes ?'text-amber-400' :'text-zinc-400'}`} />
 <span className="hidden md:inline text-xs">Notas</span>
 </button>
 )}

 {/* 4. Direct Edit Song Button */}
 {onEditSong && (
 <button
 type="button"
 onClick={onEditSong}
 className={`hidden sm:flex p-1.5 sm:px-2 sm:py-1 rounded-[var(--r-s)] text-xs font-medium items-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'bg-neutral-800/80 hover:bg-neutral-700 text-zinc-400 hover:text-zinc-100 /70'
 }`}
 title="Editar canción (título, tonalidad, BPM, afinación, disco...)"
 >
 <Edit3 className="w-3.5 h-3.5" />
 <span className="hidden lg:inline text-xs">Editar</span>
 </button>
 )}

 {/* Reorder Buttons (alternative to drag & drop for accessibility) */}
 {showReorder && (
 <div className="hidden sm:flex flex-col">
 <button
 type="button"
 disabled={!canMoveUp}
 onClick={onMoveUp}
 className="p-0.5 text-[var(--ink-2)] hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
 title="Subir orden"
 >
 <ArrowUp className="w-3 h-3" />
 </button>
 <button
 type="button"
 disabled={!canMoveDown}
 onClick={onMoveDown}
 className="p-0.5 text-[var(--ink-2)] hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
 title="Bajar orden"
 >
 <ArrowDown className="w-3 h-3" />
 </button>
 </div>
 )}

 {/* Secondary Actions ⋯ Menu */}
 <div className="relative" ref={menuRef}>
 <button
 type="button"
 onClick={() => setShowMenu((prev) => !prev)}
 className={`p-1.5 rounded-[var(--r-s)] transition-all cursor-pointer ${
 showMenu
 ?'bg-[var(--surface)] text-white'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:bg-[var(--sunken)] border-transparent hover:'
 :'text-[var(--ink-3)] hover:text-[var(--ink-3)] hover:bg-[var(--surface)]/80 border-transparent'
 }`}
 title="Más opciones del tema"
 aria-label="Más opciones"
 >
 <MoreVertical className="w-4 h-4" />
 </button>

 {/* Menu Popover */}
 {showMenu && (
 <div
 className={`absolute right-0 top-full mt-1.5 z-40 w-52 rounded-[var(--r-m)] p-1.5 shadow-2xl text-xs backdrop-blur-md ${
 isStitchLight
 ?'bg-white text-[var(--ink)] divide-y divide-slate-100'
 :'bg-[var(--surface)]/95 /80 text-[var(--ink-3)] divide-y divide-slate-800/60'
 }`}
 >
 <div className="py-1 space-y-0.5">
 {/* Acordes / Notas / Editar: solo en móvil, en escritorio ya son botones directos */}
 {onOpenChords && (
 <button
 type="button"
 onClick={() => { setShowMenu(false); onOpenChords(); }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
 >
 <FileText className="w-3.5 h-3.5" />
 <span>Ver Acordes</span>
 </button>
 )}
 {onOpenMemberNotes && (
 <button
 type="button"
 onClick={() => { setShowMenu(false); onOpenMemberNotes(); }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-amber-500/20 text-amber-300 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
 >
 <Users className="w-3.5 h-3.5" />
 <span>Notas por Miembro</span>
 </button>
 )}
 {onEditSong && (
 <button
 type="button"
 onClick={() => { setShowMenu(false); onEditSong(); }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-white/10 text-zinc-300 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
 >
 <Edit3 className="w-3.5 h-3.5" />
 <span>Editar Canción</span>
 </button>
 )}

 {/* Studio / Grabadora Multipista */}
 {onOpenStudio && (
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 onOpenStudio();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-indigo-500/20 text-indigo-300 transition-colors flex items-center gap-2 cursor-pointer font-bold"
 >
 <Headphones className="w-3.5 h-3.5 text-indigo-400" />
 <span>Abrir Studio / Grabadora</span>
 </button>
 )}

 {/* Iris Stem Separator */}
 {(onOpenIris || onOpenStudio) && (
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 if (onOpenIris) onOpenIris();
 else if (onOpenStudio) onOpenStudio();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-amber-500/20 text-amber-300 transition-colors flex items-center gap-2 cursor-pointer font-bold"
 >
 <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
 <span>{hasIrisStems(song) ?'🎛️ Ver Pistas Iris Separadas' :'✨ Procesar con Iris (IA Stems)'}</span>
 </button>
 )}

 {/* Share on WhatsApp */}
 {onShareSong && (
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 onShareSong();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
 >
 <Share2 className="w-3.5 h-3.5" />
 <span>Compartir por WhatsApp</span>
 </button>
 )}

 {/* External Chords / Score Link */}
 {externalLink && (
 <a
 href={externalLink}
 target="_blank"
 rel="noreferrer"
 onClick={() => setShowMenu(false)}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
 >
 <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Partitura / Enlace</span>
 </a>
 )}

 {/* Reorder in mobile */}
 {showReorder && (
 <>
 {canMoveUp && onMoveUp && (
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 onMoveUp();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
 >
 <ArrowUp className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Mover arriba</span>
 </button>
 )}
 {canMoveDown && onMoveDown && (
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 onMoveDown();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
 >
 <ArrowDown className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Mover abajo</span>
 </button>
 )}
 </>
 )}
 </div>

 {/* Delete button */}
 {onDeleteSong && (
 <div className="py-1">
 <button
 type="button"
 onClick={() => {
 setShowMenu(false);
 onDeleteSong();
 }}
 className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center gap-2 cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span>Eliminar Canción</span>
 </button>
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
};

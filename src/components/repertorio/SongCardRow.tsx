import React, { useState, useRef, useEffect } from 'react';
import { Song, ThemeColors } from '../../types';
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
  GripVertical
} from 'lucide-react';

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
  const albumLabel = song.albumDisco || song.album || 'Sin Disco';
  const durationText = song.duracion || (song.duracionSegundos ? `${Math.floor(song.duracionSegundos / 60)}:${String(Math.floor(song.duracionSegundos % 60)).padStart(2, '0')}` : '—');
  const hasMemberNotes = song.notasMiembros && Object.values(song.notasMiembros).some((v) => typeof v === 'string' && v.trim().length > 0);
  const ideasCount = (song.audioIdeas || []).length;
  const isDriveAudio = (song.audioPrincipalUrl || '').includes('drive.google.com');

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl transition-all duration-150 border ${
        isDragging
          ? 'opacity-30 scale-[0.98] border-dashed border-[#1db954]'
          : isDragOver
          ? 'border-[#1db954] ring-2 ring-[#1db954]/50 bg-[#1db954]/10'
          : isPlayingCurrent
          ? isStitchLight
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm'
            : 'bg-[#1db954]/10 border-[#1db954]/30 text-white shadow-sm'
          : isSelected
          ? isStitchLight
            ? 'bg-indigo-50/80 border-indigo-200 text-slate-900'
            : 'bg-white/5 border-white/10 text-zinc-200'
          : isStitchLight
          ? 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-xs'
          : 'bg-[#161616] hover:bg-[#1c1c1c] border-white/5 text-zinc-300'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:px-3.5 sm:py-2.5">
        {/* Drag Handle (when draggable) */}
        {draggable && (
          <div 
            className="shrink-0 text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing -mr-0.5"
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
              className="w-4 h-4 rounded cursor-pointer accent-[#1db954]"
              aria-label={`Seleccionar ${song.titulo}`}
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
                ? 'bg-[#1db954] text-black shadow-md scale-105'
                : isStitchLight
                ? 'bg-slate-100 hover:bg-[#1db954] text-slate-700 hover:text-black'
                : 'bg-zinc-800/90 hover:bg-[#1db954] text-zinc-300 hover:text-black group-hover:scale-105'
            }`}
            title={isPlaying ? 'Pausar canción' : `Reproducir ${song.titulo}`}
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
          <div className="hidden sm:block w-8.5 h-8.5 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-xs">
            <img src={song.portadaUrl} alt={song.titulo} className="w-full h-full object-cover" />
          </div>
        ) : null}

        {/* Track Number display (subtle) */}
        <span className="text-[11px] font-mono text-neutral-500 w-4 shrink-0 text-center hidden md:inline-block">
          {index}
        </span>

        {/* Central Info: Title, Details & Badges */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
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
                    ? 'text-emerald-900 font-bold'
                    : 'text-[#1ed760] font-bold'
                  : isStitchLight
                  ? 'text-slate-900 hover:text-indigo-600'
                  : 'text-zinc-100 group-hover:text-white'
              }`}
              title={song.titulo}
            >
              {song.titulo}
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
                  ? 'text-amber-400 hover:text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'text-zinc-500 hover:text-amber-400 opacity-60 hover:opacity-100'
              }`}
              title={song.favoritoGeneral ? 'Quitar de favoritas' : 'Marcar como favorita'}
            >
              <Star className={`w-3.5 h-3.5 ${song.favoritoGeneral ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          {/* Line 2: Responsive Badges Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px] font-mono flex-wrap">
            {/* Tone & BPM pill */}
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                isStitchLight
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-white/5 text-zinc-300 border border-white/10'
              }`}
            >
              {song.tonalidad || '—'}{song.bpm ? ` • ${song.bpm} BPM` : ''}
            </span>

            {/* Duration */}
            <span className="text-neutral-400 text-[10px]">
              {durationText}
            </span>

            {/* Status badge */}
            {song.estadoTema && (
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                  song.estadoTema === 'listo'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : song.estadoTema === 'ensayando'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                }`}
              >
                {song.estadoTema === 'listo' ? 'Listo' : song.estadoTema === 'ensayando' ? 'Ensayando' : song.estadoTema}
              </span>
            )}

            {/* Album Badge (if displayed in full catalog mode) */}
            {showAlbumBadge && albumLabel !== 'Sin Disco' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-neutral-400 text-[10px] max-w-[140px] truncate">
                <span>•</span>
                <span className="truncate">{albumLabel}</span>
              </span>
            )}

            {/* Audio Indicator */}
            {song.audioPrincipalUrl ? (
              <span className="hidden xs:inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <Volume2 className="w-2.5 h-2.5" />
                <span>{isDriveAudio ? 'Drive' : 'Audio'}</span>
              </span>
            ) : ideasCount > 0 ? (
              <span className="hidden xs:inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
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
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                isStitchLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
              }`}
              title="Ver cifrado de acordes, armonía y letra (LaCuerda.net)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Acordes</span>
            </button>
          )}

          {/* 2. Direct Studio Button */}
          {onOpenStudio && (
            <button
              type="button"
              onClick={onOpenStudio}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                ideasCount > 0
                  ? 'bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 border-indigo-500/50 shadow-xs'
                  : isStitchLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30'
              }`}
              title="Abrir Studio de Grabación Multipista & Pistas"
            >
              <Headphones className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden xs:inline text-[11px]">Studio</span>
              {ideasCount > 0 && (
                <span className="px-1 py-0.2 bg-indigo-500/50 text-white rounded-full text-[9px]">
                  {ideasCount}
                </span>
              )}
            </button>
          )}

          {/* 3. Direct Member Notes Button */}
          {onOpenMemberNotes && (
            <button
              type="button"
              onClick={onOpenMemberNotes}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                hasMemberNotes
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-xs'
                  : isStitchLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border-white/10'
              }`}
              title="Ver y editar notas específicas por miembro de la banda"
            >
              <Users className={`w-3.5 h-3.5 ${hasMemberNotes ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className="hidden md:inline text-[11px]">Notas</span>
            </button>
          )}

          {/* 4. Direct Edit Song Button (Pencil icon) */}
          {onEditSong && (
            <button
              type="button"
              onClick={onEditSong}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                isStitchLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10'
              }`}
              title="Editar canción (título, tonalidad, BPM, afinación, disco...)"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Editar</span>
            </button>
          )}

          {/* Reorder Buttons (alternative to drag & drop for accessibility) */}
          {showReorder && (
            <div className="hidden sm:flex flex-col">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
                title="Subir orden"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-default"
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
              className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                showMenu
                  ? 'bg-white/20 text-white border-white/30'
                  : isStitchLight
                  ? 'text-slate-600 hover:bg-slate-100 border-transparent hover:border-slate-200'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10 border-transparent'
              }`}
              title="Más opciones del tema"
              aria-label="Más opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popover */}
            {showMenu && (
              <div
                className={`absolute right-0 top-full mt-1.5 z-40 w-52 rounded-xl p-1.5 shadow-2xl border text-xs font-mono ${
                  isStitchLight
                    ? 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
                    : 'bg-[#1e1e1e] border-neutral-700 text-zinc-200 divide-y divide-white/5'
                }`}
              >
                <div className="py-1 space-y-0.5">
                  {/* Studio / Grabadora Multipista */}
                  {onOpenStudio && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenStudio();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/20 text-indigo-300 transition-colors flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Abrir Studio / Grabadora</span>
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
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
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
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
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
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-neutral-400" />
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
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-neutral-400" />
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
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors flex items-center gap-2 cursor-pointer"
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

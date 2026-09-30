import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Song, ThemeColors } from '../../types';
import { formatSongTitle } from '../../utils/formatSongTitle';
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
  Cpu,
} from 'lucide-react';
import { hasIrisStems } from '../../utils/irisTracks';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

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
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  // El menú se pinta en un portal con posición fija: la fila tiene overflow-x-auto y un menú
  // absoluto dentro quedaba recortado (en móvil solo se veía la primera línea).
  useLayoutEffect(() => {
    if (!showMenu || !menuRef.current) return;
    const r = menuRef.current.getBoundingClientRect();
    const alto = 320; // alto aproximado del menú
    const abajo = window.innerHeight - r.bottom;
    setMenuPos({
      top: abajo < alto && r.top > alto ? Math.max(8, r.top - alto - 6) : r.bottom + 6,
      right: Math.max(8, window.innerWidth - r.right),
    });
  }, [showMenu]);

  // Cierra al pulsar fuera, al hacer scroll o al cambiar el tamaño
  useEffect(() => {
    if (!showMenu) return;
    const cerrar = () => setShowMenu(false);
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setShowMenu(false);
    };
    // Un scroll solo cierra el menú si desplaza de verdad su ancla: un evento rezagado de un
    // scroll anterior (o el de otro contenedor) no debe cerrarlo nada más abrirse.
    const anclaTop = menuRef.current?.getBoundingClientRect().top ?? 0;
    const alHacerScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return;
      const top = menuRef.current?.getBoundingClientRect().top ?? anclaTop;
      if (Math.abs(top - anclaTop) > 4) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', alHacerScroll, true);
    window.addEventListener('resize', cerrar);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', alHacerScroll, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [showMenu]);

  const isPlaying = isPlayingCurrent && isPlayerPlaying;
  const displayTitle = formatSongTitle(song.titulo) || song.titulo;
  const albumLabel = song.albumDisco || song.album || 'Sin Disco';
  const durationText =
    song.duracion ||
    (song.duracionSegundos
      ? `${Math.floor(song.duracionSegundos / 60)}:${String(Math.floor(song.duracionSegundos % 60)).padStart(2, '0')}`
      : '—');
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
      className={`group relative rounded-[var(--r-m)] transition-ui duration-150 ${
        isDragging
          ? 'opacity-30 scale-[0.98]'
          : isDragOver
            ? 'ring-2 ring-[var(--ok)]/50 bg-[var(--ok)]/10'
            : isPlayingCurrent
              ? 'bg-[var(--ok)]/10 text-[var(--ink)] ring-1 ring-[var(--ok)]/20'
              : isSelected
                ? 'bg-[var(--acc)]/10 text-[var(--ink)]'
                : 'bg-[var(--sunken)] hover:bg-[var(--bg)] text-[var(--ink)]'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:px-3.5 sm:py-2.5 overflow-x-auto no-scrollbar shrink-0">
        {/* Drag Handle (when draggable) */}
        {draggable && (
          <div
            className="shrink-0 text-[var(--ink-2)] hover:text-[var(--ink-2)] cursor-grab active:cursor-grabbing -mr-0.5"
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
            className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-[var(--r-pill)] flex items-center justify-center transition-ui cursor-pointer ${
              isPlaying
                ? 'bg-[var(--ok)] text-[var(--on-ok)] scale-105'
                : 'bg-[var(--surface)] hover:bg-[var(--ok)] text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
            title={isPlaying ? 'Pausar canción' : `Reproducir ${displayTitle}`}
          >
            {isPlaying ? (
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 h-3 bg-[var(--sunken)] rounded-[var(--r-pill)]" />
                <span className="w-0.5 h-4 bg-[var(--sunken)] rounded-[var(--r-pill)] delay-75" />
                <span className="w-0.5 h-2.5 bg-[var(--sunken)] rounded-[var(--r-pill)] delay-150" />
              </div>
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Optional Cover image (hidden on tiny screens if no cover) */}
        {song.portadaUrl ? (
          <div className="hidden sm:block w-8.5 h-8.5 rounded-[var(--r-s)] overflow-hidden shrink-0">
            <img src={song.portadaUrl} alt={displayTitle} className="w-full h-full object-cover" />
          </div>
        ) : null}

        {/* Track Number display (subtle) */}
        <span className="text-xs text-[var(--ink-2)] w-4 shrink-0 text-center hidden md:inline-block font-medium">{index}</span>

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
                isPlayingCurrent ? 'text-[var(--ok)] font-bold' : 'text-[var(--ink-2)] group-hover:text-[var(--ink)]'
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
              className={`p-1 rounded-[var(--r-pill)] transition-ui cursor-pointer shrink-0 ${
                song.favoritoGeneral
                  ? 'text-[var(--acc)] hover:text-[var(--acc)]/70'
                  : 'text-[var(--ink-2)] hover:text-[var(--acc)] opacity-60 hover:opacity-100'
              }`}
              title={song.favoritoGeneral ? 'Quitar de favoritas' : 'Marcar como favorita'}
            >
              <Star className={`w-3.5 h-3.5 ${song.favoritoGeneral ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          {/* Line 2: Responsive Badges Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs flex-wrap">
            {/* Tone & BPM pill */}
            <span
              title={song.bpmDetectadoEn || song.tonalidadDetectadaEn ? 'Detectado automáticamente por Iris desde el audio' : undefined}
              className="px-2 py-0.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--surface)] text-[var(--ink-2)]"
            >
              {song.tonalidad || '—'}
              {song.bpm ? ` • ${song.bpm} BPM` : ''}
              {song.bpmDetectadoEn || song.tonalidadDetectadaEn ? ' 🤖' : ''}
            </span>

            {/* Duration */}
            <span className="text-[var(--ink-2)] text-xs font-normal">{durationText}</span>

            {/* Status badge */}
            {song.estadoTema && (
              <span
                className={`px-2 py-0.5 rounded-[var(--r-pill)] text-micro font-medium tracking-wide ${
                  song.estadoTema === 'listo'
                    ? 'bg-[var(--ok)]/15 text-[var(--ink)]'
                    : song.estadoTema === 'ensayando'
                      ? 'bg-[var(--acc)]/15 text-[var(--acc-ink)]'
                      : 'bg-[var(--surface)]text-[var(--ink-2)]'
                }`}
              >
                {song.estadoTema === 'listo' ? 'Listo' : song.estadoTema === 'ensayando' ? 'Ensayando' : song.estadoTema}
              </span>
            )}

            {/* Album Badge (if displayed in full catalog mode) */}
            {showAlbumBadge && albumLabel !== 'Sin Disco' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[var(--ink-2)] text-xs max-w-[140px] truncate">
                <span>•</span>
                <span className="truncate">{albumLabel}</span>
              </span>
            )}

            {/* Audio Indicator */}
            {song.audioPrincipalUrl ? (
              <span className="hidden xs:inline-flex items-center gap-1 text-micro font-medium px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)]">
                <Volume2 className="w-2.5 h-2.5" />
                <span>{isDriveAudio ? 'Drive' : 'Audio'}</span>
              </span>
            ) : ideasCount > 0 ? (
              <span className="hidden xs:inline-flex items-center gap-1 text-micro font-medium px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--tentative)]/15 text-[var(--tentative)]">
                <Headphones className="w-2.5 h-2.5" />
                <span>{ideasCount} ideas</span>
              </span>
            ) : null}
          </div>

          {/* Subtle Notes Preview (desktop only to save vertical mobile space) */}
          {song.notasInternas && (
            <p className="hidden md:block text-micro text-[var(--ink-2)] line-clamp-1 italic mt-0.5 font-sans">{song.notasInternas}</p>
          )}
        </div>

        {/* Right Section: Streamlined Quick Action + Overflow ⋯ Menu */}
        <div className="shrink-0 flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* 1. Primary Direct Button: Studio (or Acordes if no studio) */}
          {onOpenStudio ? (
            <button
              type="button"
              onClick={onOpenStudio}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-pill)] text-xs font-medium flex items-center gap-1.5 transition-ui cursor-pointer ${
                ideasCount > 0
                  ? 'bg-[var(--acc)]/20 hover:bg-[var(--acc)]/40 text-[var(--ink)]'
                  : 'bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink)]'
              }`}
              title="Abrir Studio de Grabación Multipista & Pistas"
            >
              <Headphones className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
              <span className="hidden xs:inline text-xs">Studio</span>
              {ideasCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[var(--acc)]/40 text-[var(--ink)] rounded-[var(--r-pill)] text-micro font-bold">{ideasCount}</span>
              )}
            </button>
          ) : onOpenChords ? (
            <button
              type="button"
              onClick={onOpenChords}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-[var(--r-pill)] text-xs font-semibold flex items-center gap-1.5 transition-ui cursor-pointer ${
                'bg-[var(--ok-soft)] hover:bg-[var(--ok-soft)] text-[var(--ok)] '
              }`}
              title="Ver cifrado de acordes, armonía y letra"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-xs">Acordes</span>
            </button>
          ) : null}

          {/* Reorder Buttons (alternative to drag & drop) */}
          {showReorder && (
            <div className="hidden sm:flex flex-col">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={onMoveUp}
                className="p-0.5 text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer disabled:cursor-default"
                title="Subir orden"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={onMoveDown}
                className="p-0.5 text-[var(--ink-2)] hover:text-[var(--ink)] disabled:opacity-20 cursor-pointer disabled:cursor-default"
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
              className={`p-1.5 rounded-[var(--r-pill)] transition-ui cursor-pointer ${
                showMenu
                  ? 'bg-[var(--surface)] text-[var(--ink)]'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
              }`}
              title="Opciones de la canción"
              aria-label="Más opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popover (portal: no lo recorta la fila) */}
            {showMenu && menuPos && createPortal(
              <div
                ref={popRef}
                style={{ position: 'fixed', top: menuPos?.top ?? 0, right: menuPos?.right ?? 8 }}
                className={`menu-pop z-[10000] max-h-[70vh] overflow-y-auto w-52 rounded-[var(--r-m)] p-1.5 text-xs bg-[var(--surface)] text-[var(--ink)] divide-y divide-[var(--sunken)]`}
              >
                <div className="py-1 space-y-0.5">
                  {/* Acordes */}
                  {onOpenChords && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenChords();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ok)]/20 text-[var(--ok)] transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ver acordes y letra</span>
                    </button>
                  )}

                  {/* Editar Canción */}
                  {onEditSong && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onEditSong();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ink)]/10 text-[var(--ink-2)] transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span>Editar canción</span>
                    </button>
                  )}

                  {/* Member Notes */}
                  {onOpenMemberNotes && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenMemberNotes();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-m)] hover:bg-[var(--acc)]/15 text-[var(--acc)] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Users className="w-3.5 h-3.5 text-[var(--acc)]" />
                      <span>Notas por miembro</span>
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--tentative)]/20 text-[var(--tentative)]/50 transition-colors flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Headphones className="w-3.5 h-3.5 text-[var(--tentative)]" />
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--acc)]/20 text-[var(--acc)]/70 transition-colors flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
                      <span>{hasIrisStems(song) ? 'Ver Pistas Iris' : 'Separar Stems con Iris'}</span>
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ok)]/20 text-[var(--ok)] transition-colors flex items-center gap-2 cursor-pointer"
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ink)]/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span>Partitura / enlace</span>
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
                          className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ink)]/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
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
                          className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--ink)]/10 transition-colors flex items-center gap-2 cursor-pointer sm:hidden"
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
                      className="w-full text-left px-2.5 py-1.5 rounded-[var(--r-s)] hover:bg-[var(--alert)]/20 text-[var(--alert)] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar canción</span>
                    </button>
                  </div>
                )}
              </div>
              , document.body)}
          </div>
        </div>
      </div>
    </div>
  );
};

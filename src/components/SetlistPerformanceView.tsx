import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Music, FileText, Maximize, Minimize, Type, StickyNote } from 'lucide-react';
import { Setlist, Song } from '../types';
import { isImageDocument, isPdfDocument } from '../utils/documentType';

interface SetlistPerformanceViewProps {
  setlist: Setlist;
  songs: Song[];
  onClose: () => void;
}

// Distancia mínima de swipe (px) para contar como "pasar página" y no como un scroll normal
// dentro del documento.
const SWIPE_THRESHOLD = 60;

const FONT_SIZES = ['text-sm sm:text-base', 'text-base sm:text-lg', 'text-lg sm:text-xl', 'text-xl sm:text-2xl'];

export const SetlistPerformanceView: React.FC<SetlistPerformanceViewProps> = ({
  setlist,
  songs,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  const songItems = setlist.items.filter(item => item.songId && item.tipoItem === 'cancion');
  const currentItem = songItems[currentIndex];
  const currentSong = songs.find(s => s.id === currentItem?.songId);
  const nextItem = songItems[currentIndex + 1];
  const nextSong = nextItem ? songs.find(s => s.id === nextItem.songId) : null;

  // La partitura original escaneada (PDF/imagen) es la vista "de verdad" — como pasar hojas
  // reales de papel en un atril de iPad. El texto con acordes es el fallback para temas que
  // todavía no tienen un documento subido.
  const hasScannedSheet = Boolean(
    currentSong?.estructuraDocumentoUrl &&
    (isImageDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl) ||
      isPdfDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl))
  );

  const notes = [currentSong?.notasInternas, currentSong?.notasRepertorio].filter(Boolean).join('\n\n');

  // WAKE LOCK: lo más importante para un músico en directo — que la pantalla del móvil/tablet
  // NO se apague a media canción por inactividad táctil (el músico está tocando, no tocando la
  // pantalla). Sin esto, el modo concierto es inservible en un bolo real.
  useEffect(() => {
    let released = false;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Algunos navegadores lo rechazan si la pestaña no está en foco o no hay soporte —
        // degradamos en silencio, no es motivo para romper el modo concierto.
      }
    };
    requestLock();

    // iOS/Android liberan el wake lock al cambiar de pestaña/app; lo repedimos al volver.
    const handleVisibility = () => {
      if (!released && document.visibilityState === 'visible') requestLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release?.().catch(() => {});
    };
  }, []);

  // FULLSCREEN real del navegador (oculta la barra de direcciones/UI del sistema) — el
  // fixed inset-0 ya cubre la ventana, pero en un móvil/tablet la barra de Chrome/Safari sigue
  // ahí robando espacio y invitando a un toque accidental que saque al músico de la app.
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  // Transpose key
  const transposeKey = (key: string, semitones: number): string => {
    if (!key || semitones === 0) return key;

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const minorNotes = ['Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'];

    const isMinor = key.includes('m');
    const noteList = isMinor ? minorNotes : notes;
    const baseKey = key.replace('m', '').replace('b', 'b').trim();

    const currentIndex = noteList.findIndex(n => n.replace('m', '').trim() === baseKey);
    if (currentIndex === -1) return key;

    const newIndex = (currentIndex + semitones) % 12;
    return noteList[(newIndex + 12) % 12];
  };

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex(i => Math.min(songItems.length - 1, i + 1));
  };

  // Keyboard shortcuts — incluye Space/PageUp/PageDown porque los pedales bluetooth de pasar
  // partituras (los que usan orquestas de verdad con iPad) emulan esas teclas, no solo flechas.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); handlePrev(); }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); handleNext(); }
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setTranspose(t => Math.min(t + 1, 6));
      if (e.key === '-') setTranspose(t => Math.max(t - 1, -6));
      if (e.key === '0') setTranspose(0);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [songItems.length, toggleFullscreen]);

  // Swipe táctil estilo "pasar página" (iBooks / forScore): un swipe horizontal claro pasa de
  // canción; un gesto vertical o corto se deja pasar para no robarle el scroll al documento.
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) handlePrev();
    else handleNext();
  };

  if (!currentSong) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <p>No hay canciones en el repertorio</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const transposedKey = transposeKey(currentSong.tonalidad, transpose);
  const chords = currentSong.cifradoTexto || 'Sin acordes guardados';
  const structure = currentSong.guiaSustituto?.estructura || '';
  const progression = currentSong.guiaSustituto?.progresionClave || '';
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === songItems.length - 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* THIN TOP BAR — minimal, out of the way of the "page" itself */}
      <div className="shrink-0 bg-gradient-to-b from-black to-black/0 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 z-20">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-lg">🎤</span>
          <h1 className="text-sm sm:text-base font-bold text-amber-300 truncate">{currentSong.titulo}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="text-xs font-mono text-neutral-400 mr-1">{currentIndex + 1}/{songItems.length}</span>

          {notes && (
            <button
              onClick={() => setShowNotes(v => !v)}
              className={`p-1.5 rounded-lg transition ${showNotes ? 'bg-amber-500 text-black' : 'hover:bg-white/10 text-amber-300'}`}
              title="Notas del tema"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          )}

          {!hasScannedSheet && (
            <button
              onClick={() => setFontSizeIdx(i => (i + 1) % FONT_SIZES.length)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition text-neutral-300"
              title="Tamaño de letra"
            >
              <Type className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/10 rounded-lg transition text-neutral-300"
            title="Pantalla completa (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
            title="Cerrar (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* NOTES BANNER — cosas como "cambio de afinación", "entra el segundo cantante", que un
          músico necesita ver ANTES de tocar el tema, no descubrirlas a mitad. */}
      {showNotes && notes && (
        <div className="shrink-0 bg-amber-950/90 border-y border-amber-500/40 px-4 py-2.5 text-sm text-amber-100 whitespace-pre-wrap z-20">
          {notes}
        </div>
      )}

      {/* THE "PAGE" — full-bleed content area with tap zones on the sides to turn songs, like
          forScore / iBooks. The zones sit ABOVE the content but only intercept clicks on their
          own strip, so scrolling/pinching the sheet itself still works normally. */}
      <div className="relative flex-1 min-h-0">
        {!isFirst && (
          <button
            onClick={handlePrev}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 w-16 z-10 items-center justify-start pl-2 bg-gradient-to-r from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            title="← Canción anterior"
          >
            <ChevronLeft className="w-8 h-8 text-white/80" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 w-16 z-10 items-center justify-end pr-2 bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            title="Siguiente canción →"
          >
            <ChevronRight className="w-8 h-8 text-white/80" />
          </button>
        )}

        {hasScannedSheet ? (
          <ScannedSheetPage song={currentSong} />
        ) : (
          <ChordSheetPage
            chords={chords}
            structure={structure}
            progression={progression}
            transposedKey={transposedKey}
            originalKey={currentSong.tonalidad}
            transpose={transpose}
            bpm={currentSong.bpm}
            duracion={currentSong.duracion}
            afinacion={currentSong.afinacion}
            fontSizeClass={FONT_SIZES[fontSizeIdx]}
          />
        )}
      </div>

      {/* THIN BOTTOM BAR — page dots + prev/next for touch, transpose only when it applies
          (a scanned sheet is a picture, transposing the text controls does nothing to it),
          plus a peek at what's coming up next so the musician can get ready in advance. */}
      <div className="shrink-0 bg-gradient-to-t from-black to-black/0 px-3 sm:px-4 py-2 space-y-2 z-20">
        {!hasScannedSheet && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-neutral-500 text-xs">Tono:</span>
            <button
              onClick={() => setTranspose(t => Math.max(t - 1, -6))}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono"
              title="- (Bajar semitono)"
            >
              −
            </button>
            <span className={`px-2 text-xs font-mono min-w-10 text-center ${transpose !== 0 ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}>
              {transposedKey}{transpose !== 0 ? ` (${transpose > 0 ? '+' : ''}${transpose})` : ''}
            </span>
            <button
              onClick={() => setTranspose(t => Math.min(t + 1, 6))}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono"
              title="+ (Subir semitono)"
            >
              +
            </button>
            {transpose !== 0 && (
              <button
                onClick={() => setTranspose(0)}
                className="px-2 py-1 text-neutral-500 hover:text-amber-400 text-xs"
                title="Restablecer tono original"
              >
                reset
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Anterior</span>
          </button>

          {/* Page dots: quick glance at where you are in the setlist */}
          <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto px-2 max-w-full">
            {songItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`shrink-0 rounded-full transition-all ${
                  i === currentIndex ? 'w-5 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                }`}
                title={songs.find(s => s.id === songItems[i].songId)?.titulo || `Canción ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={isLast}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <span className="hidden sm:inline text-xs">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {nextSong && (
          <p className="text-center text-[11px] text-neutral-500 font-mono truncate">
            Siguiente: <span className="text-neutral-300">{nextSong.titulo}</span>
            {nextSong.tonalidad && <span> · {nextSong.tonalidad}</span>}
          </p>
        )}
      </div>
    </div>
  );
};

// Página tipo "atril digital": el documento original escaneado a pantalla completa, tal cual
// lo vería un músico de orquesta pasando hojas en un iPad.
const ScannedSheetPage: React.FC<{ song: Song }> = ({ song }) => {
  const isImage = isImageDocument(song.estructuraDocumentoNombre, song.estructuraDocumentoUrl);

  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-950 p-1 sm:p-4">
      {isImage ? (
        <img
          src={song.estructuraDocumentoUrl}
          alt={`Partitura de ${song.titulo}`}
          className="max-w-full max-h-full object-contain rounded shadow-2xl"
        />
      ) : (
        <iframe
          src={song.estructuraDocumentoUrl}
          title={`Partitura de ${song.titulo}`}
          className="w-full h-full border-0 bg-white rounded"
        />
      )}
    </div>
  );
};

// Fallback cuando la canción todavía no tiene un documento escaneado: el texto de acordes y
// letra, grande y legible desde lejos, con la ficha rápida debajo.
const ChordSheetPage: React.FC<{
  chords: string;
  structure: string;
  progression: string;
  transposedKey: string;
  originalKey: string;
  transpose: number;
  bpm?: number;
  duracion?: string;
  afinacion?: string;
  fontSizeClass: string;
}> = ({ chords, structure, progression, transposedKey, originalKey, transpose, bpm, duracion, afinacion, fontSizeClass }) => {
  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-teal-900/30 border border-teal-500/30 rounded-lg p-2.5">
            <p className="text-teal-300 text-[10px] font-mono uppercase">Tonalidad</p>
            <p className="text-xl sm:text-2xl font-bold text-teal-300 mt-0.5">
              {transposedKey}
              {transpose !== 0 && <span className="text-xs text-teal-200 ml-1">({originalKey} {transpose > 0 ? '+' : ''}{transpose})</span>}
            </p>
          </div>
          <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-2.5">
            <p className="text-indigo-300 text-[10px] font-mono uppercase">Tempo</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-300 mt-0.5">{bpm} BPM</p>
          </div>
          <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-2.5">
            <p className="text-emerald-300 text-[10px] font-mono uppercase">Duración</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-300 mt-0.5">{duracion}</p>
          </div>
          {afinacion && (
            <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-2.5">
              <p className="text-purple-300 text-[10px] font-mono uppercase">Afinación</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-300 mt-0.5">{afinacion}</p>
            </div>
          )}
        </div>

        <div className="bg-neutral-900/50 border border-amber-500/20 rounded-lg p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-amber-300 mb-3 uppercase flex items-center gap-2">
            <FileText className="w-4 h-4" /> Acordes & Letra
          </h2>
          <pre className={`text-amber-100 font-mono whitespace-pre-wrap leading-relaxed break-words ${fontSizeClass}`}>
            {chords}
          </pre>
        </div>

        {(structure || progression) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {structure && (
              <div className="bg-neutral-900/50 border border-indigo-500/20 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-bold text-indigo-300 mb-2 uppercase">🎵 Estructura</h3>
                <p className="text-indigo-100 text-sm sm:text-base font-mono">{structure}</p>
              </div>
            )}
            {progression && (
              <div className="bg-neutral-900/50 border border-teal-500/20 rounded-lg p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-bold text-teal-300 mb-2 uppercase">🎸 Progresión</h3>
                <p className="text-teal-100 text-sm sm:text-base font-mono">{progression}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

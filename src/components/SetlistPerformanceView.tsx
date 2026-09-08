import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Music, Maximize, Minimize, Type, StickyNote, Info } from 'lucide-react';
import { Setlist, SetlistItem, Song } from '../types';
import { isImageDocument, isPdfDocument } from '../utils/documentType';
import { getSemitoneDifference, transposeChordToken } from '../utils/chordUtils';

interface SetlistPerformanceViewProps {
  setlist: Setlist;
  songs: Song[];
  onClose: () => void;
}

// Distancia mínima de swipe (px) para contar como "pasar página" y no como un scroll normal
// dentro del documento.
const SWIPE_THRESHOLD = 60;

const FONT_SIZES = ['text-base sm:text-lg', 'text-lg sm:text-xl', 'text-xl sm:text-2xl', 'text-2xl sm:text-3xl'];

// Icono/etiqueta por tipo de bloque del setlist (presentación, cambio de instrumento...) — lo
// que se muestra en modo teleprompter cuando toca un bloque en vez de una canción.
const BLOCK_META: Record<string, { icon: string; label: string }> = {
  header: { icon: '📌', label: 'Sección' },
  presentacion: { icon: '🎤', label: 'Presentación' },
  intro_tema: { icon: '🔥', label: 'Intro' },
  beatbox: { icon: '🎵', label: 'Beatbox' },
  solo_performance: { icon: '⭐', label: 'Solo / Performance' },
  cambio_instrumento: { icon: '🎸', label: 'Cambio de instrumento' },
  chapa: { icon: '💬', label: 'Chapa con el público' },
  descanso: { icon: '☕', label: 'Descanso' },
  bis: { icon: '👏', label: 'Bis' },
  otro: { icon: '📋', label: 'Bloque' },
};

const getBlockMeta = (item: SetlistItem) => BLOCK_META[item.bloqueSubtipo || 'otro'] || BLOCK_META.otro;
const itemLabel = (item: SetlistItem, songs: Song[]) =>
  item.tipoItem === 'cancion'
    ? songs.find(s => s.id === item.songId)?.titulo || 'Canción'
    : item.tituloCustom || getBlockMeta(item).label;

export const SetlistPerformanceView: React.FC<SetlistPerformanceViewProps> = ({
  setlist,
  songs,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);

  // Incluye TANTO canciones como bloques (presentación, cambio de instrumento, descanso...) en
  // su orden real del repertorio — antes el modo concierto solo conocía canciones, así que un
  // bloque entre dos temas desaparecía sin más en vez de mostrarse como guion en pantalla.
  const allItems = setlist.items.filter(item => (item.tipoItem === 'cancion' && item.songId) || item.tipoItem === 'bloque');
  const currentItem = allItems[currentIndex];
  const isBlock = currentItem?.tipoItem === 'bloque';
  const currentSong = !isBlock ? songs.find(s => s.id === currentItem?.songId) : undefined;
  const nextItem = allItems[currentIndex + 1];

  // Si este repertorio pide tocar el tema en un tono distinto al original (definido en la
  // fila del setlist — ver RepertorioSetlists), la transposición se aplica sola al llegar a la
  // canción: nadie tiene que acordarse de darle manualmente a +/- cada vez que suena este tema.
  const autoTranspose = currentItem?.tonalidadDeseada
    ? getSemitoneDifference(currentSong?.tonalidad || '', currentItem.tonalidadDeseada) ?? 0
    : 0;

  // Reajuste manual (+/-) que el músico puede aplicar POR ENCIMA de la transposición automática
  // de este tema, sin perderla al cambiar de canción y sin tener que recalcularla a mano.
  const [manualAdjust, setManualAdjust] = useState(0);
  useEffect(() => {
    setManualAdjust(0);
    setShowDetails(false);
  }, [currentIndex]);

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

  // Transpone una tonalidad manteniendo su notación original (ES o EN) — reutiliza el mismo
  // transpositor validado que usa el visor de acordes, en vez de una tabla ad-hoc que solo
  // cubría bien la notación inglesa.
  const transposeKey = (key: string, semitones: number): string => {
    if (!key || semitones === 0) return key;
    const isSpanish = /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(key.trim());
    return transposeChordToken(key, semitones, isSpanish ? 'ES' : 'EN');
  };

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex(i => Math.min(allItems.length - 1, i + 1));
  };

  // Keyboard shortcuts — incluye Space/PageUp/PageDown porque los pedales bluetooth de pasar
  // partituras (los que usan orquestas de verdad con iPad) emulan esas teclas, no solo flechas.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); handlePrev(); }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); handleNext(); }
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setManualAdjust(t => Math.min(t + 1, 6));
      if (e.key === '-') setManualAdjust(t => Math.max(t - 1, -6));
      if (e.key === '0') setManualAdjust(0);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allItems.length, toggleFullscreen]);

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

  if (!currentItem) {
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

  const effectiveTranspose = autoTranspose + manualAdjust;
  const transposedKey = currentSong ? transposeKey(currentSong.tonalidad, effectiveTranspose) : '';
  const chords = currentSong?.cifradoTexto || 'Sin acordes guardados';
  const structure = currentSong?.guiaSustituto?.estructura || '';
  const progression = currentSong?.guiaSustituto?.progresionClave || '';
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allItems.length - 1;
  const blockMeta = isBlock ? getBlockMeta(currentItem) : null;

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
          <span className="text-lg">{isBlock ? blockMeta!.icon : '🎤'}</span>
          <h1 className="text-sm sm:text-base font-bold text-amber-300 truncate">
            {isBlock ? (currentItem.tituloCustom || blockMeta!.label) : currentSong?.titulo}
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="text-xs font-mono text-neutral-400 mr-1">{currentIndex + 1}/{allItems.length}</span>

          {!isBlock && notes && (
            <button
              onClick={() => setShowNotes(v => !v)}
              className={`p-1.5 rounded-lg transition ${showNotes ? 'bg-amber-500 text-black' : 'hover:bg-white/10 text-amber-300'}`}
              title="Notas del tema"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          )}

          {!isBlock && !hasScannedSheet && (
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
      {!isBlock && showNotes && notes && (
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
            title="← Anterior"
          >
            <ChevronLeft className="w-8 h-8 text-white/80" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={handleNext}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 w-16 z-10 items-center justify-end pr-2 bg-gradient-to-l from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            title="Siguiente →"
          >
            <ChevronRight className="w-8 h-8 text-white/80" />
          </button>
        )}

        {isBlock ? (
          <TeleprompterBlockPage item={currentItem} meta={blockMeta!} />
        ) : hasScannedSheet ? (
          <ScannedSheetPage song={currentSong!} />
        ) : (
          <ChordSheetPage
            chords={chords}
            structure={structure}
            progression={progression}
            transposedKey={transposedKey}
            originalKey={currentSong?.tonalidad || ''}
            transpose={effectiveTranspose}
            bpm={currentSong?.bpm}
            duracion={currentSong?.duracion}
            afinacion={currentSong?.afinacion}
            fontSizeClass={FONT_SIZES[fontSizeIdx]}
            showDetails={showDetails}
            onToggleDetails={() => setShowDetails(v => !v)}
          />
        )}
      </div>

      {/* THIN BOTTOM BAR — page dots + prev/next for touch, transpose only when it applies
          (a scanned sheet is a picture, transposing the text controls does nothing to it),
          plus a peek at what's coming up next so the musician can get ready in advance. */}
      <div className="shrink-0 bg-gradient-to-t from-black to-black/0 px-3 sm:px-4 py-2 space-y-2 z-20">
        {!isBlock && !hasScannedSheet && (
          <div className="flex items-center justify-center gap-2">
            {autoTranspose !== 0 && manualAdjust === 0 && (
              <span className="text-[10px] text-amber-400/80" title={`Este repertorio pide tocarla en ${currentItem?.tonalidadDeseada} (original: ${currentSong?.tonalidad})`}>
                🎯 auto
              </span>
            )}
            <span className="text-neutral-500 text-xs">Tono:</span>
            <button
              onClick={() => setManualAdjust(t => Math.max(t - 1, -6))}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono"
              title="- (Bajar semitono)"
            >
              −
            </button>
            <span className={`px-2 text-xs font-mono min-w-10 text-center ${effectiveTranspose !== 0 ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}>
              {transposedKey}{effectiveTranspose !== 0 ? ` (${currentSong?.tonalidad} ${effectiveTranspose > 0 ? '+' : ''}${effectiveTranspose})` : ''}
            </span>
            <button
              onClick={() => setManualAdjust(t => Math.min(t + 1, 6))}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-mono"
              title="+ (Subir semitono)"
            >
              +
            </button>
            {manualAdjust !== 0 && (
              <button
                onClick={() => setManualAdjust(0)}
                className="px-2 py-1 text-neutral-500 hover:text-amber-400 text-xs"
                title={autoTranspose !== 0 ? 'Quitar el ajuste manual (vuelve al tono de este repertorio)' : 'Restablecer tono original'}
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

          {/* Page dots: quick glance at where you are in the setlist. Los bloques se marcan
              distinto (cuadrado en vez de punto) para ver de un vistazo dónde hay una pausa/
              presentación entre canciones. */}
          <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto px-2 max-w-full">
            {allItems.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setCurrentIndex(i)}
                className={`shrink-0 transition-all ${it.tipoItem === 'bloque' ? 'rounded-sm' : 'rounded-full'} ${
                  i === currentIndex
                    ? 'w-5 h-1.5 bg-amber-400'
                    : it.tipoItem === 'bloque'
                      ? 'w-1.5 h-1.5 bg-indigo-400/60 hover:bg-indigo-400'
                      : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                }`}
                title={itemLabel(it, songs)}
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

        {nextItem && (
          <p className="text-center text-[11px] text-neutral-500 font-mono truncate">
            Siguiente: <span className="text-neutral-300">{itemLabel(nextItem, songs)}</span>
            {nextItem.tipoItem === 'cancion' && songs.find(s => s.id === nextItem.songId)?.tonalidad && (
              <span> · {songs.find(s => s.id === nextItem.songId)?.tonalidad}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

// Vista "teleprompter" para los bloques del repertorio (presentación al público, cambio de
// instrumento, descanso...) que antes desaparecían sin más del modo concierto. Texto grande y
// centrado, como un guion, para leerlo en voz alta o seguir la indicación sin acercarse a mirar.
const TeleprompterBlockPage: React.FC<{ item: SetlistItem; meta: { icon: string; label: string } }> = ({ item, meta }) => {
  const script = item.notas || item.notaTema || '';
  const duration = item.duracionEstimadaMinutos
    ? `${item.duracionEstimadaMinutos} min`
    : item.duracionEstimadaSegundos
      ? `${item.duracionEstimadaSegundos}s`
      : null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-gradient-to-b from-indigo-950/40 via-neutral-950 to-black overflow-y-auto">
      <span className="text-5xl sm:text-7xl mb-6">{meta.icon}</span>
      <h2 className="text-2xl sm:text-4xl font-bold text-amber-300 mb-6 uppercase tracking-wide">
        {item.tituloCustom || meta.label}
      </h2>
      {script ? (
        <p className="text-xl sm:text-3xl md:text-4xl text-white leading-relaxed max-w-4xl whitespace-pre-wrap font-medium">
          {script}
        </p>
      ) : (
        <p className="text-neutral-500 text-lg">{meta.label}</p>
      )}
      {duration && (
        <p className="mt-8 text-neutral-500 font-mono text-sm">⏱ {duration}</p>
      )}
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
// letra ocupa casi toda la pantalla — es lo único que un músico necesita leer sin tocar nada,
// así que la ficha (tono/tempo/duración/afinación) se reduce a una línea y la estructura/
// progresión quedan colapsadas detrás de un botón "ⓘ", en vez de robarle espacio por defecto.
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
  showDetails: boolean;
  onToggleDetails: () => void;
}> = ({ chords, structure, progression, transposedKey, originalKey, transpose, bpm, duracion, afinacion, fontSizeClass, showDetails, onToggleDetails }) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Ficha compacta: una sola línea, no cuatro tarjetas — la letra es la protagonista. */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-xs sm:text-sm font-mono border-b border-white/5 bg-black/30">
        <span className="text-teal-300 font-bold">
          {transposedKey}
          {transpose !== 0 && <span className="text-teal-200/70 font-normal"> ({originalKey} {transpose > 0 ? '+' : ''}{transpose})</span>}
        </span>
        {bpm && <span className="text-indigo-300">{bpm} BPM</span>}
        {duracion && <span className="text-emerald-300">{duracion}</span>}
        {afinacion && <span className="text-purple-300">{afinacion}</span>}
        {(structure || progression) && (
          <button
            onClick={onToggleDetails}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${showDetails ? 'bg-white/15 text-white' : 'text-neutral-400 hover:text-white'}`}
            title="Estructura y progresión de acordes"
          >
            <Info className="w-3 h-3" /> detalles
          </button>
        )}
      </div>

      {showDetails && (structure || progression) && (
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-2 text-xs sm:text-sm border-b border-white/5 bg-black/20">
          {structure && (
            <p className="text-indigo-200"><span className="text-indigo-400 font-bold">🎵 Estructura: </span>{structure}</p>
          )}
          {progression && (
            <p className="text-teal-200"><span className="text-teal-400 font-bold">🎸 Progresión: </span>{progression}</p>
          )}
        </div>
      )}

      {/* La letra + acordes ocupan todo el espacio que queda, sin competir por sitio. */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <pre className={`max-w-4xl mx-auto text-amber-100 font-mono whitespace-pre-wrap leading-relaxed break-words ${fontSizeClass}`}>
          {chords}
        </pre>
      </div>
    </div>
  );
};

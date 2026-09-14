import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Music, Maximize, Minimize, Type, StickyNote, Info, FileText, Image as ImageIcon, Sun, Battery, BatteryCharging, BatteryWarning, Moon, Plane, MoreVertical } from 'lucide-react';
import { Setlist, SetlistItem, Song } from '../types';
import { isImageDocument, isPdfDocument } from '../utils/documentType';
import { getSemitoneDifference, transposeChordToken, processChordText, splitIntoChordSections, ChordSection } from '../utils/chordUtils';

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
  // Un navegador no puede subir el brillo real de la pantalla (no existe esa API por
  // privacidad/seguridad) — esto es lo más parecido que se puede ofrecer: fondo blanco con
  // texto negro muy grueso, que en la práctica se ve mucho mejor que ámbar-sobre-negro bajo sol
  // directo o focos de escenario (y suele disparar el brillo automático del propio móvil).
  const [glareMode, setGlareMode] = useState(false);
  // "Apagar" la pantalla no es algo que una web pueda hacer de verdad (no hay API para eso) —
  // esto es lo más parecido y honesto: soltar el Wake Lock (deja que el móvil se apague solo
  // por su propio temporizador de inactividad) y pintar negro puro, que en la mayoría de
  // pantallas OLED apaga esos píxeles de verdad y sí ahorra batería real. Se resetea en cada
  // cambio de canción a propósito: activarlo es una decisión por tema, no "para siempre",
  // para no arriesgarse a llegar a la siguiente canción sin pantalla por olvido.
  const [isResting, setIsResting] = useState(false);
  const [showFlightModeInfo, setShowFlightModeInfo] = useState(false);
  // Menú "más opciones": agrupa todo lo que no hace falta ver siempre (brillo, descanso, modo
  // avión, notas, vista, tamaño de letra, pantalla completa) para que el header no vuelva a
  // llenarse de iconos y comerse el título de la canción.
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // Battery Status API: Chrome la soporta (con datos redondeados por privacidad), pero Firefox
  // y Safari/iOS nunca la han implementado. null = "no se sabe" y no se muestra nada — mejor
  // eso que fingir un dato de batería falso en la mitad de los móviles.
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
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

  // Notación (ES/EN) a mantener al mostrar/transportar un tono — se detecta de la propia
  // tonalidad guardada de la canción, para no forzar "Re" a salir como "D" o viceversa.
  const detectNotation = (key: string): 'ES' | 'EN' => (/^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(key.trim()) ? 'ES' : 'EN');

  const transposeKey = (key: string, semitones: number): string => {
    if (!key || semitones === 0) return key;
    return transposeChordToken(key, semitones, detectNotation(key));
  };

  // El tono en el que se toca este tema en ESTE repertorio se define en la fila del setlist
  // (RepertorioSetlists), no aquí: cambiar de tono a media canción en directo, con el móvil en
  // la mano y cantando, es justo lo que NO se quiere. El Modo Concierto solo APLICA lo ya
  // decidido de antemano — se calcula de forma derivada a partir de tonalidadDeseada.
  const effectiveTranspose = currentItem?.tonalidadDeseada && currentSong
    ? getSemitoneDifference(currentSong.tonalidad, currentItem.tonalidadDeseada) ?? 0
    : 0;

  // Los acordes en texto son la vista principal: se pueden transportar, agrandar y hacer
  // autoscroll, cosas que una foto/PDF escaneado no permite. El documento original queda como
  // consulta opcional (para comparar contra lo que la IA extrajo) mediante el botón de
  // alternar vista, nunca como vista por defecto. Se calcula de forma puramente derivada (sin
  // useState+useEffect de sincronización) para que no pueda haber un "flash" mostrando el
  // documento antes de que un efecto corrija la vista al valor correcto.
  const hasChordsText = Boolean(currentSong?.cifradoTexto?.trim());
  const hasScannedSheet = Boolean(
    currentSong?.estructuraDocumentoUrl &&
    (isImageDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl) ||
      isPdfDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl))
  );
  const [manualViewOverride, setManualViewOverride] = useState<'chords' | 'sheet' | null>(null);
  const effectiveViewMode: 'chords' | 'sheet' = manualViewOverride ?? (hasChordsText ? 'chords' : 'sheet');
  const showScannedSheet = effectiveViewMode === 'sheet' && hasScannedSheet;

  // El autoscroll a velocidad fija se desincroniza en cuanto la banda alarga un solo o repite
  // un estribillo — para cuando te das cuenta, la letra ya bajó sola de más. En su lugar, la
  // canción se divide en secciones ([Intro]/[Verso]/[Estribillo]...) y el propio músico avanza
  // de una a otra tocando, con control total y sin depender de ningún temporizador.
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    setShowDetails(false);
    setManualViewOverride(null);
    setCurrentSectionIndex(0);
    // El Modo Descanso es por tema, no "para siempre": si se quedara activo al cambiar de
    // canción, el riesgo es llegar a un tema que sí necesitas ver sin pantalla porque se te
    // olvidó reactivarla.
    setIsResting(false);
    setShowMoreMenu(false);
    setShowFlightModeInfo(false);
  }, [currentIndex]);

  // Transpone los acordes DE VERDAD (las letras Do/Re/Mi... dentro del texto), no solo la
  // etiqueta de tonalidad — antes se mostraba "Tono: Re" pero el texto seguía en Mi, que es
  // peor que inútil en un escenario: parece correcto pero no lo es.
  const chords = currentSong?.cifradoTexto
    ? processChordText(currentSong.cifradoTexto, effectiveTranspose, detectNotation(currentSong.tonalidad || 'C'))
    : 'Sin acordes guardados';
  const chordSections = hasChordsText ? splitIntoChordSections(chords) : [];
  const hasMultipleSections = chordSections.length >= 2;

  const notes = [currentSong?.notasInternas, currentSong?.notasRepertorio].filter(Boolean).join('\n\n');

  // BATERÍA: con pantalla+wake lock+fullscreen encendidos todo el bolo, avisar antes de que se
  // apague en el bis es más útil que descubrirlo cuando ya se apagó. Se degrada en silencio
  // donde el navegador no lo soporta (batteryLevel se queda en null y no se muestra nada).
  useEffect(() => {
    let batteryRef: any = null;
    const handleChange = () => {
      if (batteryRef) {
        setBatteryLevel(batteryRef.level);
        setBatteryCharging(batteryRef.charging);
      }
    };
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryRef = battery;
        handleChange();
        battery.addEventListener('levelchange', handleChange);
        battery.addEventListener('chargingchange', handleChange);
      }).catch(() => {});
    }
    return () => {
      if (batteryRef) {
        batteryRef.removeEventListener('levelchange', handleChange);
        batteryRef.removeEventListener('chargingchange', handleChange);
      }
    };
  }, []);

  // WAKE LOCK: lo más importante para un músico en directo — que la pantalla del móvil/tablet
  // NO se apague a media canción por inactividad táctil (el músico está tocando, no tocando la
  // pantalla). Sin esto, el modo concierto es inservible en un bolo real. Se libera cuando el
  // propio músico activa el Modo Descanso para el tema actual (isResting) — es la única
  // situación en la que SÍ queremos que el móvil pueda apagar la pantalla solo.
  useEffect(() => {
    if (isResting) {
      wakeLockRef.current?.release?.().catch(() => {});
      wakeLockRef.current = null;
      return;
    }

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
  }, [isResting]);

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

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCurrentIndex(i => Math.min(allItems.length - 1, i + 1));
  };

  // Avanzar/retroceder de SECCIÓN dentro del tema (Intro→Verso→Estribillo...) cuando la hay;
  // al llegar al final o al principio, pasa de canción — así el pedal/tecla de "pasar página"
  // funciona igual de natural para moverse dentro de un tema largo que para cambiar de tema.
  const handleAdvance = () => {
    if (!isBlock && !showScannedSheet && hasMultipleSections && currentSectionIndex < chordSections.length - 1) {
      setCurrentSectionIndex(i => i + 1);
    } else {
      handleNext();
    }
  };
  const handleRetreat = () => {
    if (!isBlock && !showScannedSheet && hasMultipleSections && currentSectionIndex > 0) {
      setCurrentSectionIndex(i => i - 1);
    } else {
      handlePrev();
    }
  };

  // Keyboard shortcuts — incluye Space/PageUp/PageDown porque los pedales bluetooth de pasar
  // partituras (los que usan orquestas de verdad con iPad) emulan esas teclas, no solo flechas.
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); handleRetreat(); }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); handleAdvance(); }
      if (e.key === 'Escape') onClose();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems.length, toggleFullscreen, currentSectionIndex, hasMultipleSections, isBlock, showScannedSheet]);

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

  const transposedKey = currentSong ? transposeKey(currentSong.tonalidad, effectiveTranspose) : '';
  const structure = currentSong?.guiaSustituto?.estructura || '';
  const progression = currentSong?.guiaSustituto?.progresionClave || '';
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === allItems.length - 1;
  const blockMeta = isBlock ? getBlockMeta(currentItem) : null;

  // MODO DESCANSO: pantalla negra a pantalla completa, sin wake lock — la opción real más
  // parecida a "apagar la pantalla" que puede ofrecer una web. Cualquier toque la despierta.
  if (isResting) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-8 cursor-pointer select-none"
        onClick={() => setIsResting(false)}
      >
        <span className="text-5xl mb-4">😴</span>
        <p className="text-neutral-600 text-sm font-mono mb-1">Modo descanso — ahorrando batería</p>
        <p className="text-neutral-800 text-xs font-mono">Toca la pantalla para volver a "{itemLabel(currentItem, songs)}"</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden select-none ${glareMode ? 'bg-white text-black' : 'bg-black text-white'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* THIN TOP BAR — el título es lo único que un músico necesita leer de un vistazo para
          saber en qué tema está; antes competía por sitio con 8 iconos y se quedaba truncado a
          3 letras. Ahora solo quedan aquí los dos controles que hacen falta siempre a mano
          (menú y cerrar) — todo lo demás vive en el menú "⋯", y los datos pasivos (batería,
          posición, verificación) bajan a una segunda línea fina que no le roba sitio al título. */}
      <div className={`shrink-0 px-3 sm:px-4 pt-2 pb-1.5 z-20 ${glareMode ? 'bg-gradient-to-b from-white to-white/0' : 'bg-gradient-to-b from-black to-black/0'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex items-center gap-2 flex-1">
            <span className="text-lg shrink-0">{isBlock ? blockMeta!.icon : '🎤'}</span>
            <h1 className={`text-base sm:text-lg font-bold truncate ${glareMode ? 'text-black' : 'text-amber-300'}`}>
              {isBlock ? (currentItem.tituloCustom || blockMeta!.label) : currentSong?.titulo}
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0 relative">
            <button
              onClick={() => setShowMoreMenu(v => !v)}
              className={`p-1.5 rounded-lg transition ${showMoreMenu ? (glareMode ? 'bg-black/10' : 'bg-white/15') : glareMode ? 'hover:bg-black/10 text-neutral-700' : 'hover:bg-white/10 text-neutral-300'}`}
              title="Más opciones"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${glareMode ? 'hover:bg-black/10 text-black' : 'hover:bg-white/10 text-white'}`}
              title="Cerrar (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className={`absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl border shadow-2xl p-1.5 space-y-0.5 text-sm ${
                  glareMode ? 'bg-white border-neutral-300 text-black' : 'bg-neutral-900 border-neutral-700 text-white'
                }`}>
                  <button
                    onClick={() => { setGlareMode(v => !v); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'} ${glareMode ? 'text-amber-600' : ''}`}
                  >
                    <Sun className="w-4 h-4 shrink-0" /> {glareMode ? 'Quitar' : 'Activar'} alto contraste
                  </button>

                  <button
                    onClick={() => { setIsResting(true); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
                  >
                    <Moon className="w-4 h-4 shrink-0" /> Modo descanso (ahorra batería)
                  </button>

                  {!isBlock && notes && (
                    <button
                      onClick={() => { setShowNotes(v => !v); setShowMoreMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'} text-amber-400`}
                    >
                      <StickyNote className="w-4 h-4 shrink-0" /> {showNotes ? 'Ocultar' : 'Ver'} notas del tema
                    </button>
                  )}

                  {!isBlock && hasChordsText && hasScannedSheet && (
                    <button
                      onClick={() => { setManualViewOverride(effectiveViewMode === 'sheet' ? 'chords' : 'sheet'); setShowMoreMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
                    >
                      {showScannedSheet ? <FileText className="w-4 h-4 shrink-0" /> : <ImageIcon className="w-4 h-4 shrink-0" />}
                      Ver {showScannedSheet ? 'acordes en texto' : 'documento original'}
                    </button>
                  )}

                  {!isBlock && !showScannedSheet && (
                    <button
                      onClick={() => { setFontSizeIdx(i => (i + 1) % FONT_SIZES.length); setShowMoreMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
                    >
                      <Type className="w-4 h-4 shrink-0" /> Cambiar tamaño de letra
                    </button>
                  )}

                  <button
                    onClick={() => { toggleFullscreen(); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 shrink-0" /> : <Maximize className="w-4 h-4 shrink-0" />}
                    {isFullscreen ? 'Salir de' : 'Entrar en'} pantalla completa
                  </button>

                  <button
                    onClick={() => { setShowFlightModeInfo(v => !v); setShowMoreMenu(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition ${glareMode ? 'hover:bg-black/5' : 'hover:bg-white/10'} text-sky-400`}
                  >
                    <Plane className="w-4 h-4 shrink-0" /> Sobre el modo avión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Segunda línea: datos pasivos que no compiten con el título — posición en el
            repertorio, batería (si el navegador la soporta) y si hace falta revisar los
            acordes de este tema. */}
        <div className="flex items-center gap-2 mt-1 pl-7 text-[11px] font-mono">
          <span className={glareMode ? 'text-neutral-600' : 'text-neutral-500'}>{currentIndex + 1}/{allItems.length}</span>

          {batteryLevel !== null && (
            <span
              className={`flex items-center gap-1 ${
                batteryCharging ? 'text-emerald-400' : batteryLevel < 0.2 ? 'text-rose-400 font-bold' : glareMode ? 'text-neutral-600' : 'text-neutral-500'
              }`}
              title={batteryCharging ? 'Cargando' : batteryLevel < 0.2 ? 'Batería baja — busca un cargador' : 'Batería'}
            >
              {batteryCharging ? <BatteryCharging className="w-3 h-3" /> : batteryLevel < 0.2 ? <BatteryWarning className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
              {Math.round(batteryLevel * 100)}%
            </span>
          )}

          {!isBlock && currentSong?.estructuraDocumentoUrl && !currentSong?.estructuraVerificada && (
            <span
              className="font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40"
              title="Los acordes de este tema vienen de una subida sin verificar todavía por nadie de la banda"
            >
              ⚠️ sin verificar
            </span>
          )}
        </div>
      </div>

      {/* NOTES BANNER — cosas como "cambio de afinación", "entra el segundo cantante", que un
          músico necesita ver ANTES de tocar el tema, no descubrirlas a mitad. */}
      {!isBlock && showNotes && notes && (
        <div className="shrink-0 bg-amber-950/90 border-y border-amber-500/40 px-4 py-2.5 text-sm text-amber-100 whitespace-pre-wrap z-20">
          {notes}
        </div>
      )}

      {/* Una web no puede activar el modo avión del dispositivo — ninguna app sin permisos de
          sistema puede tocar la radio del móvil, por seguridad. Esto es honesto sobre esa
          limitación en vez de fingir un botón que no haría nada. */}
      {showFlightModeInfo && (
        <div className="shrink-0 bg-sky-950/90 border-y border-sky-500/40 px-4 py-2.5 text-sm text-sky-100 z-20 flex items-start gap-2">
          <Plane className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            No hay forma de activar el modo avión desde aquí — ninguna web (ni casi ninguna app) puede tocar la
            conectividad del móvil, es una restricción de seguridad del propio sistema. Actívalo tú a mano antes
            de subir al escenario: la app ya funciona sin conexión una vez cargado el repertorio, así que no pasa
            nada por quedarte sin señal.
          </p>
        </div>
      )}

      {/* THE "PAGE" — full-bleed content area with tap zones on the sides to turn songs, like
          forScore / iBooks. The zones sit ABOVE the content but only intercept clicks on their
          own strip, so scrolling/pinching the sheet itself still works normally.
          Estas zonas eran `hidden sm:flex` — no existían en absoluto en un móvil, que es
          precisamente el dispositivo que un cantante sujeta en el atril. Ahora son anchas
          (28% de la pantalla a cada lado) y visibles con opacidad baja siempre, no solo al
          hover (que no existe en touch), para que un golpe del atril o un dedo impreciso
          siga acertando. */}
      <div className="relative flex-1 min-h-0">
        {!isFirst && (
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-[28%] max-w-32 z-10 flex items-center justify-start pl-2 bg-gradient-to-r from-black/50 to-transparent opacity-40 hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
            title="← Anterior"
          >
            <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </button>
        )}
        {!isLast && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-[28%] max-w-32 z-10 flex items-center justify-end pr-2 bg-gradient-to-l from-black/50 to-transparent opacity-40 hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
            title="Siguiente →"
          >
            <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </button>
        )}

        {isBlock ? (
          <TeleprompterBlockPage item={currentItem} meta={blockMeta!} glareMode={glareMode} />
        ) : showScannedSheet ? (
          <ScannedSheetPage song={currentSong!} />
        ) : (
          <ChordSheetPage
            chords={chords}
            sections={chordSections}
            currentSectionIndex={currentSectionIndex}
            onAdvanceSection={handleAdvance}
            onRetreatSection={handleRetreat}
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
            glareMode={glareMode}
          />
        )}
      </div>

      {/* THIN BOTTOM BAR — page dots + prev/next for touch, transpose only when it applies
          (a scanned sheet is a picture, transposing the text controls does nothing to it),
          plus a peek at what's coming up next so the musician can get ready in advance. */}
      <div className={`shrink-0 px-3 sm:px-4 py-2 space-y-2 z-20 ${glareMode ? 'bg-gradient-to-t from-white to-white/0' : 'bg-gradient-to-t from-black to-black/0'}`}>
        {/* Tono: solo lectura aquí a propósito — cambiar de tono con el móvil en la mano y
            cantando en directo es un error esperando a pasar. El tono se define en la fila del
            setlist (Repertorio); esto solo confirma qué se está aplicando ahora mismo. */}
        {!isBlock && !showScannedSheet && effectiveTranspose !== 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span className="text-amber-400 font-bold font-mono">🎯 {transposedKey}</span>
            <span className="text-neutral-500 font-mono">(original {currentSong?.tonalidad}, definido en el repertorio)</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-lg transition flex items-center gap-1.5 ${
              glareMode ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
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
                      : glareMode ? 'w-1.5 h-1.5 bg-black/25 hover:bg-black/50' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                }`}
                title={itemLabel(it, songs)}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={isLast}
            className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-lg transition flex items-center gap-1.5 ${
              glareMode ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/5 hover:bg-white/10 text-white'
            }`}
          >
            <span className="hidden sm:inline text-xs">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {nextItem && (
          <p className={`text-center text-[11px] font-mono truncate ${glareMode ? 'text-neutral-600' : 'text-neutral-500'}`}>
            Siguiente: <span className={glareMode ? 'text-neutral-800' : 'text-neutral-300'}>{itemLabel(nextItem, songs)}</span>
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
const TeleprompterBlockPage: React.FC<{ item: SetlistItem; meta: { icon: string; label: string }; glareMode: boolean }> = ({ item, meta, glareMode }) => {
  const script = item.notas || item.notaTema || '';
  const duration = item.duracionEstimadaMinutos
    ? `${item.duracionEstimadaMinutos} min`
    : item.duracionEstimadaSegundos
      ? `${item.duracionEstimadaSegundos}s`
      : null;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-y-auto ${
      glareMode ? 'bg-white' : 'bg-gradient-to-b from-indigo-950/40 via-neutral-950 to-black'
    }`}>
      <span className="text-5xl sm:text-7xl mb-6">{meta.icon}</span>
      <h2 className={`text-2xl sm:text-4xl font-bold mb-6 uppercase tracking-wide ${glareMode ? 'text-black' : 'text-amber-300'}`}>
        {item.tituloCustom || meta.label}
      </h2>
      {script ? (
        <p className={`text-xl sm:text-3xl md:text-4xl leading-relaxed max-w-4xl whitespace-pre-wrap font-medium ${glareMode ? 'text-black font-bold' : 'text-white'}`}>
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

  if (!song.estructuraDocumentoUrl || song.estructuraDocumentoUrl.trim() === '') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-950 p-4 text-neutral-500 text-sm">
        No hay documento adjunto disponible
      </div>
    );
  }

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
  sections: ChordSection[];
  currentSectionIndex: number;
  onAdvanceSection: () => void;
  onRetreatSection: () => void;
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
  glareMode: boolean;
}> = ({ chords, sections, currentSectionIndex, onAdvanceSection, onRetreatSection, structure, progression, transposedKey, originalKey, transpose, bpm, duracion, afinacion, fontSizeClass, showDetails, onToggleDetails, glareMode }) => {
  const hasMultipleSections = sections.length >= 2;
  const currentSection = hasMultipleSections ? sections[currentSectionIndex] : null;
  const chordTextClass = glareMode ? 'text-black font-bold' : 'text-amber-100';
  const borderClass = glareMode ? 'border-black/10' : 'border-white/5';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Ficha compacta: una sola línea, no cuatro tarjetas — la letra es la protagonista. */}
      <div className={`shrink-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1.5 text-xs sm:text-sm font-mono border-b ${borderClass} ${glareMode ? 'bg-black/5' : 'bg-black/30'}`}>
        <span className={glareMode ? 'text-teal-700 font-bold' : 'text-teal-300 font-bold'}>
          {transposedKey}
          {transpose !== 0 && <span className={glareMode ? 'text-teal-800/70 font-normal' : 'text-teal-200/70 font-normal'}> ({originalKey} {transpose > 0 ? '+' : ''}{transpose})</span>}
        </span>
        {bpm && <span className={glareMode ? 'text-indigo-700' : 'text-indigo-300'}>{bpm} BPM</span>}
        {duracion && <span className={glareMode ? 'text-emerald-700' : 'text-emerald-300'}>{duracion}</span>}
        {afinacion && <span className={glareMode ? 'text-purple-700' : 'text-purple-300'}>{afinacion}</span>}
        {(structure || progression) && (
          <button
            onClick={onToggleDetails}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
              showDetails ? (glareMode ? 'bg-black/15 text-black' : 'bg-white/15 text-white') : (glareMode ? 'text-neutral-600 hover:text-black' : 'text-neutral-400 hover:text-white')
            }`}
            title="Estructura y progresión de acordes"
          >
            <Info className="w-3 h-3" /> detalles
          </button>
        )}
      </div>

      {showDetails && (structure || progression) && (
        <div className={`shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-2 text-xs sm:text-sm border-b ${borderClass} ${glareMode ? 'bg-black/5' : 'bg-black/20'}`}>
          {structure && (
            <p className={glareMode ? 'text-indigo-900' : 'text-indigo-200'}><span className={glareMode ? 'text-indigo-700 font-bold' : 'text-indigo-400 font-bold'}>🎵 Estructura: </span>{structure}</p>
          )}
          {progression && (
            <p className={glareMode ? 'text-teal-900' : 'text-teal-200'}><span className={glareMode ? 'text-teal-700 font-bold' : 'text-teal-400 font-bold'}>🎸 Progresión: </span>{progression}</p>
          )}
        </div>
      )}

      {hasMultipleSections ? (
        // Navegación por SECCIÓN en vez de autoscroll: el músico controla cuándo se pasa a la
        // siguiente parte (tocando el botón o con el pedal/Space), en vez de fiarse de una
        // velocidad de scroll fija que se desincroniza en cuanto la banda alarga algo.
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`shrink-0 text-center py-1.5 text-[11px] font-mono border-b ${borderClass} ${glareMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Parte {currentSectionIndex + 1}/{sections.length}
            {currentSection?.title && <span className={glareMode ? 'text-purple-700 font-bold' : 'text-purple-300 font-bold'}> · {currentSection.title}</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
            <pre className={`max-w-4xl mx-auto font-mono whitespace-pre-wrap leading-relaxed break-words text-center ${fontSizeClass} ${chordTextClass}`}>
              {currentSection?.body}
            </pre>
          </div>
          <div className={`shrink-0 flex items-center gap-2 p-3 border-t ${borderClass}`}>
            <button
              onClick={onRetreatSection}
              disabled={currentSectionIndex === 0}
              className={`px-4 py-2.5 disabled:opacity-30 rounded-lg text-sm font-mono font-bold transition ${
                glareMode ? 'bg-black/10 hover:bg-black/15 text-black' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              ◀ Parte anterior
            </button>
            <button
              onClick={onAdvanceSection}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-mono font-bold transition"
            >
              Siguiente parte ▶
            </button>
          </div>
        </div>
      ) : (
        // Sin encabezados de sección detectados: se muestra todo el cifrado de una vez, con
        // scroll manual normal (nunca automático).
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <pre className={`max-w-4xl mx-auto font-mono whitespace-pre-wrap leading-relaxed break-words ${fontSizeClass} ${chordTextClass}`}>
            {chords}
          </pre>
        </div>
      )}
    </div>
  );
};

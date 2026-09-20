import React, { useState, useEffect, useRef, useCallback, useMemo } from'react';
import { ChevronLeft, ChevronRight, X, Music, Maximize, Minimize, Type, StickyNote, Info, FileText, Image as ImageIcon, Sun, Battery, BatteryCharging, BatteryWarning, Moon, Plane, MoreVertical, Headphones, Sliders, ListMusic, Sparkles, Play, Pause, RotateCcw, ArrowUpDown, SlidersHorizontal } from'lucide-react';
import { Setlist, SetlistItem, Song, SongAudioIdea, User } from'../types';
import { isImageDocument, isPdfDocument } from'../utils/documentType';
import { getSemitoneDifference, transposeChordToken, processChordText, splitIntoChordSections, ChordSection } from'../utils/chordUtils';
import { getSongIrisStemIdea, getIdeaTracks } from'../utils/irisTracks';
import PracticeModePanel from'./PracticeModePanel';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';

interface SetlistPerformanceViewProps {
 setlist: Setlist;
 songs: Song[];
 onClose: () => void;
 onOpenStudioModal?: (song: Song) => void;
 onOpenPracticeMode?: (song: Song, idea: SongAudioIdea) => void;
 onUpdateSong?: (song: Song) => void;
 currentUser?: User;
 initialMode?:'directo' |'ensayo';
}

// Distancia mínima de swipe (px) para contar como"pasar página" y no como un scroll normal
// dentro del documento.
const SWIPE_THRESHOLD = 60;

const FONT_SIZES = ['text-base sm:text-lg','text-lg sm:text-xl','text-xl sm:text-2xl','text-2xl sm:text-3xl'];

// Icono/etiqueta por tipo de bloque del setlist (presentación, cambio de instrumento...) — lo
// que se muestra en modo teleprompter cuando toca un bloque en vez de una canción.
const BLOCK_META: Record<string, { icon: string; label: string }> = {
 header: { icon:'📌', label:'Sección' },
 presentacion: { icon:'🎤', label:'Presentación' },
 intro_tema: { icon:'🔥', label:'Intro' },
 beatbox: { icon:'🎵', label:'Beatbox' },
 solo_performance: { icon:'⭐', label:'Solo / Performance' },
 cambio_instrumento: { icon:'🎸', label:'Cambio de instrumento' },
 chapa: { icon:'💬', label:'Chapa con el público' },
 descanso: { icon:'☕', label:'Descanso' },
 bis: { icon:'👏', label:'Bis' },
 otro: { icon:'📋', label:'Bloque' }};

const getBlockMeta = (item: SetlistItem) => BLOCK_META[item.bloqueSubtipo ||'otro'] || BLOCK_META.otro;
const itemLabel = (item: SetlistItem, songs: Song[]) =>
 item.tipoItem ==='cancion'
 ? songs.find(s => s.id === item.songId)?.titulo ||'Canción'
 : item.tituloCustom || getBlockMeta(item).label;

export const SetlistPerformanceView: React.FC<SetlistPerformanceViewProps> = ({
 setlist,
 songs,
 onClose,
 onOpenStudioModal,
 onOpenPracticeMode,
 onUpdateSong,
 currentUser,
 initialMode ='directo'}) => {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [modeArchetype, setModeArchetype] = useState<'directo' |'ensayo'>(initialMode);
 const [showSongListDrawer, setShowSongListDrawer] = useState(false);
 const [isFullscreen, setIsFullscreen] = useState(false);
 const [fontSizeIdx, setFontSizeIdx] = useState(1);
 const [showNotes, setShowNotes] = useState(false);
 const [showDetails, setShowDetails] = useState(false);
 const [internalPracticeIdea, setInternalPracticeIdea] = useState<SongAudioIdea | null>(null);
 const [internalPracticeSong, setInternalPracticeSong] = useState<Song | null>(null);
 // Un navegador no puede subir el brillo real de la pantalla (no existe esa API por
 // privacidad/seguridad) — esto es lo más parecido que se puede ofrecer: fondo blanco con
 // texto negro muy grueso, que en la práctica se ve mucho mejor que ámbar-sobre-negro bajo sol
 // directo o focos de escenario (y suele disparar el brillo automático del propio móvil).
 const [glareMode, setGlareMode] = useState(false);
 //"Apagar" la pantalla no es algo que una web pueda hacer de verdad (no hay API para eso) —
 // esto es lo más parecido y honesto: soltar el Wake Lock (deja que el móvil se apague solo
 // por su propio temporizador de inactividad) y pintar negro puro, que en la mayoría de
 // pantallas OLED apaga esos píxeles de verdad y sí ahorra batería real. Se resetea en cada
 // cambio de canción a propósito: activarlo es una decisión por tema, no"para siempre",
 // para no arriesgarse a llegar a la siguiente canción sin pantalla por olvido.
 const [isResting, setIsResting] = useState(false);
 const [showFlightModeInfo, setShowFlightModeInfo] = useState(false);
 // Menú"más opciones": agrupa todo lo que no hace falta ver siempre (brillo, descanso, modo
 // avión, notas, vista, tamaño de letra, pantalla completa) para que el header no vuelva a
 // llenarse de iconos y comerse el título de la canción.
 const [showMoreMenu, setShowMoreMenu] = useState(false);
 // Battery Status API: Chrome la soporta (con datos redondeados por privacidad), pero Firefox
 // y Safari/iOS nunca la han implementado. null ="no se sabe" y no se muestra nada — mejor
 // eso que fingir un dato de batería falso en la mitad de los móviles.
 const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
 const [batteryCharging, setBatteryCharging] = useState(false);
 const touchStartX = useRef<number | null>(null);
 const containerRef = useRef<HTMLDivElement>(null);
 const wakeLockRef = useRef<any>(null);

 // Incluye TANTO canciones como bloques (presentación, cambio de instrumento, descanso...) en
 // su orden real del repertorio — antes el modo concierto solo conocía canciones, así que un
 // bloque entre dos temas desaparecía sin más en vez de mostrarse como guion en pantalla.
 const allItems = setlist.items.filter(item => (item.tipoItem ==='cancion' && item.songId) || item.tipoItem ==='bloque');
 const currentItem = allItems[currentIndex];
 const isBlock = currentItem?.tipoItem ==='bloque';
 const currentSong = !isBlock ? songs.find(s => s.id === currentItem?.songId) : undefined;
 const nextItem = allItems[currentIndex + 1];

 const songsInSetlistCount = useMemo(() => {
 return allItems.filter(i => i.tipoItem ==='cancion' && i.songId).length;
 }, [allItems]);

 const songsWithIrisCount = useMemo(() => {
 return allItems.filter(item => {
 if (item.tipoItem !=='cancion' || !item.songId) return false;
 const s = songs.find(x => x.id === item.songId);
 return s ? Boolean(getSongIrisStemIdea(s)) : false;
 }).length;
 }, [allItems, songs]);

 const irisStemIdea = useMemo(() => {
 return getSongIrisStemIdea(currentSong);
 }, [currentSong]);

 const handleLaunchPractice = useCallback((customSong?: Song, customIdea?: SongAudioIdea) => {
 const targetSong = customSong || currentSong;
 const targetIdea = customIdea || (targetSong ? getSongIrisStemIdea(targetSong) : null);
 if (!targetSong || !targetIdea) return;
 if (onOpenPracticeMode) {
 onOpenPracticeMode(targetSong, targetIdea);
 } else {
 setInternalPracticeSong(targetSong);
 setInternalPracticeIdea(targetIdea);
 }
 }, [currentSong, onOpenPracticeMode]);

 const handleLaunchStudio = useCallback((customSong?: Song) => {
 const targetSong = customSong || currentSong;
 if (!targetSong) return;
 onOpenStudioModal?.(targetSong);
 }, [currentSong, onOpenStudioModal]);

 // Notación (ES/EN) a mantener al mostrar/transportar un tono — se detecta de la propia
 // tonalidad guardada de la canción, para no forzar"Re" a salir como"D" o viceversa.
 const detectNotation = (key: string):'ES' |'EN' => (/^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(key.trim()) ?'ES' :'EN');

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

 // Transposición en tiempo real en escenario (Live Pitch Shift)
 const [liveTransposeOffset, setLiveTransposeOffset] = useState<number>(0);

 // Modo teleprompter:'sections' (por bloques con pedal) o'scroll' (desplazamiento continuo)
 const [teleprompterMode, setTeleprompterMode] = useState<'sections' |'scroll'>('sections');
 const [isTeleprompterPlaying, setIsTeleprompterPlaying] = useState<boolean>(false);
 const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
 const teleprompterScrollRef = useRef<HTMLDivElement | null>(null);

 // Los acordes en texto son la vista principal: se pueden transportar, agrandar y hacer
 // autoscroll, cosas que una foto/PDF escaneado no permite. El documento original queda como
 // consulta opcional (para comparar contra lo que la IA extrajo) mediante el botón de
 // alternar vista, nunca como vista por defecto. Se calcula de forma puramente derivada (sin
 // useState+useEffect de sincronización) para que no pueda haber un"flash" mostrando el
 // documento antes de que un efecto corrija la vista al valor correcto.
 const hasChordsText = Boolean(currentSong?.cifradoTexto?.trim());
 const hasScannedSheet = Boolean(
 currentSong?.estructuraDocumentoUrl &&
 (isImageDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl) ||
 isPdfDocument(currentSong.estructuraDocumentoNombre, currentSong.estructuraDocumentoUrl))
 );
 const [manualViewOverride, setManualViewOverride] = useState<'chords' |'sheet' | null>(null);
 const effectiveViewMode:'chords' |'sheet' = manualViewOverride ?? (hasChordsText ?'chords' :'sheet');
 const showScannedSheet = effectiveViewMode ==='sheet' && hasScannedSheet;

 // El autoscroll a velocidad fija se desincroniza en cuanto la banda alarga un solo o repite
 // un estribillo — para cuando te das cuenta, la letra ya bajó sola de más. En su lugar, la
 // canción se divide en secciones ([Intro]/[Verso]/[Estribillo]...) y el propio músico avanza
 // de una a otra tocando, con control total y sin depender de ningún temporizador.
 const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

 useEffect(() => {
 setShowDetails(false);
 setManualViewOverride(null);
 setCurrentSectionIndex(0);
 setLiveTransposeOffset(0);
 setIsTeleprompterPlaying(false);
 // El Modo Descanso es por tema, no"para siempre": si se quedara activo al cambiar de
 // canción, el riesgo es llegar a un tema que sí necesitas ver sin pantalla porque se te
 // olvidó reactivarla.
 setIsResting(false);
 setShowMoreMenu(false);
 setShowFlightModeInfo(false);
 }, [currentIndex]);

 // Autoscroll suave para el modo Teleprompter
 useEffect(() => {
 if (teleprompterMode !=='scroll' || !isTeleprompterPlaying) return;

 let animId: number;
 let lastTime = performance.now();

 const scrollStep = (currentTime: number) => {
 const elapsed = currentTime - lastTime;
 lastTime = currentTime;
 if (teleprompterScrollRef.current) {
 const delta = (28 * teleprompterSpeed * elapsed) / 1000;
 teleprompterScrollRef.current.scrollTop += delta;
 }
 animId = requestAnimationFrame(scrollStep);
 };

 animId = requestAnimationFrame(scrollStep);
 return () => cancelAnimationFrame(animId);
 }, [teleprompterMode, isTeleprompterPlaying, teleprompterSpeed]);

 const totalTranspose = effectiveTranspose + liveTransposeOffset;

 // Transpone los acordes DE VERDAD (las letras Do/Re/Mi... dentro del texto), no solo la
 // etiqueta de tonalidad, aplicando la suma de la tonalidad fijada y el ajuste en vivo.
 const chords = currentSong?.cifradoTexto
 ? processChordText(currentSong.cifradoTexto, totalTranspose, detectNotation(currentSong.tonalidad ||'C'))
 :'Sin acordes guardados';
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
 if (!released && document.visibilityState ==='visible') requestLock();
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
 // al llegar al final o al principio, pasa de canción — así el pedal/tecla de"pasar página"
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
 if (e.key ==='ArrowLeft' || e.key ==='PageUp') { e.preventDefault(); handleRetreat(); }
 if (e.key ==='ArrowRight' || e.key ==='PageDown') { e.preventDefault(); handleAdvance(); }
 if (e.key ==='') {
 e.preventDefault();
 if (teleprompterMode ==='scroll') {
 setIsTeleprompterPlaying(p => !p);
 } else {
 handleAdvance();
 }
 }
 if (e.key ==='Escape') onClose();
 if (e.key ==='f' || e.key ==='F') toggleFullscreen();
 };

 window.addEventListener('keydown', handleKeyPress);
 return () => window.removeEventListener('keydown', handleKeyPress);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [allItems.length, toggleFullscreen, currentSectionIndex, hasMultipleSections, isBlock, showScannedSheet, teleprompterMode]);

 // Swipe táctil estilo"pasar página" (iBooks / forScore): un swipe horizontal claro pasa de
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
 <div className="fixed inset-0 z-[9999] bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center">
 <div className="text-center flex flex-col items-center gap-6">
 <PublicoSilhouette opacity={0.12} size="large" />
 <div>
 <p className="font-medium text-lg">Repertorio vacío</p>
 <p className="text-xs text-[var(--ink-2)] mt-2 max-w-xs">Añade canciones a tu repertorio para comenzar a ensayar.</p>
 </div>
 <button
 onClick={onClose}
 className="mt-4 px-6 py-2 bg-[var(--alert)] hover:bg-[var(--alert)]/80 text-[var(--on-alert)] rounded-[var(--r-pill)] font-medium text-sm"
 >
 Cerrar
 </button>
 </div>
 </div>
 );
 }

 const transposedKey = currentSong ? transposeKey(currentSong.tonalidad, totalTranspose) :'';
 const structure = currentSong?.guiaSustituto?.estructura ||'';
 const progression = currentSong?.guiaSustituto?.progresionClave ||'';
 const isFirst = currentIndex === 0;
 const isLast = currentIndex === allItems.length - 1;
 const blockMeta = isBlock ? getBlockMeta(currentItem) : null;

 // MODO DESCANSO: pantalla negra a pantalla completa, sin wake lock — la opción real más
 // parecida a"apagar la pantalla" que puede ofrecer una web. Cualquier toque la despierta.
 if (isResting) {
 return (
 <div
 className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-8 cursor-pointer select-none"
 onClick={() => setIsResting(false)}
 >
 <span className="text-5xl mb-4">😴</span>
 <p className="text-[var(--ink-2)] text-sm font-sans mb-1">Modo descanso — ahorrando batería</p>
 <p className="text-[var(--ink)] text-xs font-sans">Toca la pantalla para volver a"{itemLabel(currentItem, songs)}"</p>
 </div>
 );
 }

 return (
 <div
 ref={containerRef}
 className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden select-none ${glareMode ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-black text-[var(--ink)]'}`}
 onTouchStart={handleTouchStart}
 onTouchEnd={handleTouchEnd}
 >
 {/* THIN TOP BAR — el título es lo único que un músico necesita leer de un vistazo para
 saber en qué tema está; antes competía por sitio con 8 iconos y se quedaba truncado a
 3 letras. Ahora solo quedan aquí los dos controles que hacen falta siempre a mano
 (menú y cerrar) — todo lo demás vive en el menú"⋯", y los datos pasivos (batería,
 posición, verificación) bajan a una segunda línea fina que no le roba sitio al título. */}
 <div className={`shrink-0 px-3 sm:px-4 pt-2 pb-1.5 z-20 ${glareMode ?'bg-gradient-to-b from-white to-white/0' :'bg-gradient-to-b from-black to-[var(--sunken)]/0'}`}>
 <div className="flex items-center justify-between gap-2">
 <div className="min-w-0 flex items-center gap-2 flex-1">
 <span className="text-lg shrink-0">{isBlock ? blockMeta!.icon :'🎤'}</span>
 <h1 className={`text-base sm:text-lg font-bold truncate ${glareMode ?'text-[var(--ink)]' :'text-[var(--acc)]/70'}`}>
 {isBlock ? (currentItem.tituloCustom || blockMeta!.label) : currentSong?.titulo}
 </h1>
 </div>

 <div className="flex items-center gap-1.5 shrink-0 relative">
 {/* Toggle Directo / Ensayo */}
 <div className={`flex items-center rounded-[var(--r-s)] p-0.5 text-xs font-bold shrink-0 ${
 glareMode ?'bg-[var(--surface)]300' :'bg-[var(--sunken)]'
 }`}>
 <button
 type="button"
 onClick={() => setModeArchetype('directo')}
 className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
 modeArchetype ==='directo'
 ? glareMode ?'bg-[var(--acc)]/60 text-[var(--on-acc)]' :'bg-[var(--acc)] text-[var(--on-acc)]'
 : glareMode ?'text-[var(--ink-2)] hover:text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Directo
 </button>
 <button
 type="button"
 onClick={() => setModeArchetype('ensayo')}
 className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
 modeArchetype ==='ensayo'
 ?'bg-[var(--ok)] text-[var(--ink)]'
 : glareMode ?'text-[var(--ink-2)] hover:text-[var(--ok)]' :'text-[var(--ink-2)] hover:text-[var(--ok)]'
 }`}
 >
 <Headphones className="w-3 h-3" />
 <span>Ensayo</span>
 </button>
 </div>

 {/* Quick action: Repertorio completo & Pistas Iris drawer */}
 <button
 id="btn-stage-songlist-drawer"
 type="button"
 onClick={() => setShowSongListDrawer(true)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
 glareMode
 ?'bg-[var(--accent-alt)]/10 hover:bg-[var(--accent-alt)]/30 text-[var(--accent-alt)]'
 :'bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/40'
 }`}
 title="Repertorio completo: ver todos los temas, estado de pistas Iris y accesos directos a Studio"
 >
 <ListMusic className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Pistas & Repertorio</span>
 <span className="sm:hidden">Temas</span>
 {songsWithIrisCount > 0 && (
 <span className="px-1.5 py-0.2 rounded-full text-[10px] font-sans bg-[var(--ok)]/30 text-[var(--ink-2)]">
 {songsWithIrisCount}
 </span>
 )}
 </button>

 {/* Quick action: Ensayo con pistas Iris */}
 {!isBlock && currentSong && irisStemIdea && (
 <button
 id="btn-stage-practice-mode"
 type="button"
 onClick={() => handleLaunchPractice()}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
 glareMode
 ?'bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ok)]'
 :'bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink-2)] hover:border-[var(--ok)]'
 }`}
 title="Modo Ensayo: practica este tema con pistas separadas por Iris (silenciar/aislar pistas, tempo, bucle A/B)"
 >
 <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span className="hidden sm:inline">Ensayo Iris</span>
 <span className="sm:hidden">Ensayo</span>
 </button>
 )}

 {/* Quick action: Separar con Iris si no tiene pistas */}
 {!isBlock && currentSong && !irisStemIdea && (
 <button
 type="button"
 onClick={() => handleLaunchStudio()}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
 glareMode
 ?'bg-[var(--surface)] hover:bg-[var(--sunken)] text-[var(--ink)]300'
 :'bg-[var(--sunken)]/80 hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)]'
 }`}
 title="Separar pistas de este tema con el motor de IA Iris en Modo Studio"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--tentative)]" />
 <span className="hidden sm:inline">Separar con Iris</span>
 <span className="sm:hidden">Iris</span>
 </button>
 )}

 {/* Quick action: Modo Studio */}
 {!isBlock && currentSong && (
 <button
 id="btn-stage-studio-mode"
 type="button"
 onClick={() => handleLaunchStudio()}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
 glareMode
 ?'bg-[var(--tentative)]/10 hover:bg-[var(--tentative)]/30 text-[var(--tentative)]'
 :'bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]/30 text-[var(--tentative)]/50 hover:border-[var(--acc)]'
 }`}
 title="Modo Studio: grabaciones multipista, ideas de audio, acordes y arreglos de este tema"
 >
 <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" />
 <span className="hidden sm:inline">Modo Studio</span>
 <span className="sm:hidden">Studio</span>
 </button>
 )}

 <button
 onClick={() => setShowMoreMenu(v => !v)}
 className={`p-1.5 rounded-[var(--r-s)] transition ${showMoreMenu ? (glareMode ?'bg-[var(--sunken)]' :'bg-[var(--ink)]/15') : glareMode ?'hover:bg-[var(--sunken)] text-[var(--ink-2)]' :'hover:bg-[var(--ink)]/10 text-[var(--ink-2)]'}`}
 title="Más opciones"
 >
 <MoreVertical className="w-5 h-5" />
 </button>

 <button
 onClick={onClose}
 className={`p-1.5 rounded-[var(--r-s)] transition ${glareMode ?'hover:bg-[var(--sunken)] text-[var(--ink)]' :'hover:bg-[var(--ink)]/10 text-[var(--ink)]'}`}
 title="Cerrar (ESC)"
 >
 <X className="w-5 h-5" />
 </button>

 {showMoreMenu && (
 <>
 <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
 <div className={`absolute right-0 top-full mt-1.5 z-40 w-64 rounded-[var(--r-m)] p-1.5 space-y-0.5 text-sm ${
 glareMode ?'bg-[var(--surface)] border-text-[var(--ink-2)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 {/* Studio & Ensayo shortcuts inside menu */}
 {!isBlock && currentSong && (
 <>
 {irisStemIdea ? (
 <button
 onClick={() => { setShowMoreMenu(false); handleLaunchPractice(); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition font-semibold ${
 glareMode ?'hover:bg-[var(--sunken)] text-[var(--ok)]' :'hover:bg-[var(--ink)]/10 text-[var(--ok)]'
 }`}
 >
 <Headphones className="w-4 h-4 shrink-0 text-[var(--ok)]" />
 <span>Sala de Ensayo (Pistas Iris)</span>
 </button>
 ) : (
 <button
 onClick={() => { setShowMoreMenu(false); handleLaunchStudio(); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${
 glareMode ?'hover:bg-[var(--sunken)] text-[var(--ink-2)]' :'hover:bg-[var(--ink)]/10 text-[var(--ink-2)]'
 }`}
 title="Abre el Studio para separar las pistas de este tema con el motor de IA Iris"
 >
 <Headphones className="w-4 h-4 shrink-0 text-[var(--ink-2)]" />
 <span className="flex items-center justify-between flex-1">
 <span>Separar pistas con Iris</span>
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--tentative)]/20 text-[var(--tentative)]/50 font-sans">Studio</span>
 </span>
 </button>
 )}

 {onOpenStudioModal && (
 <button
 onClick={() => { setShowMoreMenu(false); handleLaunchStudio(); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${
 glareMode ?'hover:bg-[var(--sunken)] text-[var(--tentative)]' :'hover:bg-[var(--ink)]/10 text-[var(--tentative)]'
 }`}
 >
 <Sliders className="w-4 h-4 shrink-0 text-[var(--tentative)]" />
 <span>Abrir Modo Studio</span>
 </button>
 )}

 <div className={`my-1 ${glareMode ?'border-[var(--sunken)]' :''}`} />
 </>
 )}

 <button
 onClick={() => { setGlareMode(v => !v); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'} ${glareMode ?'text-[var(--accent-alt)]' :''}`}
 >
 <Sun className="w-4 h-4 shrink-0" /> {glareMode ?'Quitar' :'Activar'} alto contraste
 </button>

 <button
 onClick={() => { setIsResting(true); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'}`}
 >
 <Moon className="w-4 h-4 shrink-0" /> Modo descanso (ahorra batería)
 </button>

 {!isBlock && notes && (
 <button
 onClick={() => { setShowNotes(v => !v); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'} text-[var(--acc)]`}
 >
 <StickyNote className="w-4 h-4 shrink-0" /> {showNotes ?'Ocultar' :'Ver'} notas del tema
 </button>
 )}

 {!isBlock && hasChordsText && hasScannedSheet && (
 <button
 onClick={() => { setManualViewOverride(effectiveViewMode ==='sheet' ?'chords' :'sheet'); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'}`}
 >
 {showScannedSheet ? <FileText className="w-4 h-4 shrink-0" /> : <ImageIcon className="w-4 h-4 shrink-0" />}
 Ver {showScannedSheet ?'acordes en texto' :'documento original'}
 </button>
 )}

 {!isBlock && !showScannedSheet && (
 <button
 onClick={() => { setFontSizeIdx(i => (i + 1) % FONT_SIZES.length); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'}`}
 >
 <Type className="w-4 h-4 shrink-0" /> Cambiar tamaño de letra
 </button>
 )}

 <button
 onClick={() => { toggleFullscreen(); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'}`}
 >
 {isFullscreen ? <Minimize className="w-4 h-4 shrink-0" /> : <Maximize className="w-4 h-4 shrink-0" />}
 {isFullscreen ?'Salir de' :'Entrar en'} pantalla completa
 </button>

 <button
 onClick={() => { setShowFlightModeInfo(v => !v); setShowMoreMenu(false); }}
 className={`w-full text-left px-3 py-2 rounded-[var(--r-s)] flex items-center gap-2.5 transition ${glareMode ?'hover:bg-[var(--sunken)]' :'hover:bg-[var(--ink)]/10'} text-[var(--ink-2)]`}
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
 <div className="flex items-center gap-2 mt-1 pl-7 text-[11px] font-sans flex-wrap">
 <span className={glareMode ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}>{currentIndex + 1}/{allItems.length}</span>

 {batteryLevel !== null && (
 <span
 className={`flex items-center gap-1 ${
 batteryCharging ?'text-[var(--ok)]' : batteryLevel < 0.2 ?'text-[var(--alert)] font-bold' : glareMode ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'
 }`}
 title={batteryCharging ?'Cargando' : batteryLevel < 0.2 ?'Batería baja — busca un cargador' :'Batería'}
 >
 {batteryCharging ? <BatteryCharging className="w-3 h-3" /> : batteryLevel < 0.2 ? <BatteryWarning className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
 {Math.round(batteryLevel * 100)}%
 </span>
 )}

 {!isBlock && irisStemIdea && (
 <button
 type="button"
 onClick={() => handleLaunchPractice()}
 className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
 glareMode
 ?'bg-[var(--ok)]/10 text-[var(--ok)] hover:bg-[var(--ok)]/20'
 :'bg-[var(--ok)]/10 text-[var(--ok)]/30 hover:bg-[var(--ok)]/20'
 }`}
 title="Pistas separadas por Iris disponibles. Clic para abrir el Modo Ensayo"
 >
 <Headphones className="w-2.5 h-2.5 text-[var(--ok)]" />
 <span>Pistas Iris ({getIdeaTracks(irisStemIdea).length})</span>
 </button>
 )}

 {!isBlock && currentSong?.estructuraDocumentoUrl && !currentSong?.estructuraVerificada && (
 <span
 className="font-bold px-1.5 py-0.5 rounded-full bg-[var(--acc)]/20 text-[var(--acc)]"
 title="Los acordes de este tema vienen de una subida sin verificar todavía por nadie de la banda"
 >
 ⚠️ sin verificar
 </span>
 )}
 </div>
 </div>

 {/* BANNER MODO ENSAYO: destacado con tempo, tonalidad y acceso directo a Iris/Studio */}
 {modeArchetype ==='ensayo' && !isBlock && currentSong && (
 <div className={`shrink-0 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs z-20 ${
 glareMode
 ?'bg-[var(--ok)]/10 text-[var(--ok)]'
 :'bg-[var(--ok-soft)]/40 text-[var(--ink)]'
 }`}>
 <div className="flex items-center gap-2 min-w-0">
 <div className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
 glareMode ?'bg-[var(--ok)]/30 text-[var(--ok)]' :'bg-[var(--ok)]/20 text-[var(--ok)]'
 }`}>
 <Headphones className="w-4 h-4" />
 </div>
 <div className="truncate">
 <span className="font-bold text-[var(--ok)]">Modo Ensayo Activo</span>
 <span className="opacity-80 ml-2 font-sans text-[11px]">
 {currentSong.tonalidad ? `Tono: ${currentSong.tonalidad}` :''}
 {currentSong.bpm ? ` · ${currentSong.bpm} BPM` :''}
 {irisStemIdea ? ` · ${getIdeaTracks(irisStemIdea).length} pistas Iris` :' · Sin pistas separadas'}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 {irisStemIdea ? (
 <button
 type="button"
 onClick={() => handleLaunchPractice()}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
 >
 <Headphones className="w-3.5 h-3.5" />
 <span>Abrir Sala de Ensayo</span>
 </button>
 ) : (
 <button
 type="button"
 onClick={() => handleLaunchStudio()}
 className="px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--tentative)]/80 hover:bg-[var(--tentative)] text-[var(--ink)] font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5" />
 <span>Separar en Studio</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => handleLaunchStudio()}
 className="px-2 py-1 rounded-[var(--r-s)] bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)] text-xs font-semibold flex items-center gap-1700 transition active:scale-95 cursor-pointer"
 >
 <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]/50" />
 <span>Studio</span>
 </button>
 </div>
 </div>
 )}

 {/* NOTES BANNER — cosas como"cambio de afinación","entra el segundo cantante", que un
 músico necesita ver ANTES de tocar el tema, no descubrirlas a mitad. */}
 {!isBlock && showNotes && notes && (
 <div className="shrink-0 bg-[var(--acc-soft)] /40 px-4 py-2.5 text-sm text-[var(--acc)] whitespace-pre-wrap z-20">
 {notes}
 </div>
 )}

 {/* Una web no puede activar el modo avión del dispositivo — ninguna app sin permisos de
 sistema puede tocar la radio del móvil, por seguridad. Esto es honesto sobre esa
 limitación en vez de fingir un botón que no haría nada. */}
 {showFlightModeInfo && (
 <div className="shrink-0 bg-[var(--bg)]/90/40 px-4 py-2.5 text-sm text-[var(--tentative)]/40 z-20 flex items-start gap-2">
 <Plane className="w-4 h-4 shrink-0 mt-0.5" />
 <p>
 No hay forma de activar el modo avión desde aquí — ninguna web (ni casi ninguna app) puede tocar la
 conectividad del móvil, es una restricción de seguridad del propio sistema. Actívalo tú a mano antes
 de subir al escenario: la app ya funciona sin conexión una vez cargado el repertorio, así que no pasa
 nada por quedarte sin señal.
 </p>
 </div>
 )}

 {/* THE"PAGE" — full-bleed content area with tap zones on the sides to turn songs, like
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
 <ChevronLeft className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--ink)]" />
 </button>
 )}
 {!isLast && (
 <button
 onClick={handleNext}
 className="absolute right-0 top-0 bottom-0 w-[28%] max-w-32 z-10 flex items-center justify-end pr-2 bg-gradient-to-l from-black/50 to-transparent opacity-40 hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer"
 title="Siguiente →"
 >
 <ChevronRight className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--ink)]" />
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
 originalKey={currentSong?.tonalidad ||''}
 transpose={effectiveTranspose}
 liveTransposeOffset={liveTransposeOffset}
 onLiveTransposeChange={setLiveTransposeOffset}
 bpm={currentSong?.bpm}
 duracion={currentSong?.duracion}
 afinacion={currentSong?.afinacion}
 fontSizeClass={FONT_SIZES[fontSizeIdx]}
 showDetails={showDetails}
 onToggleDetails={() => setShowDetails(v => !v)}
 glareMode={glareMode}
 teleprompterMode={teleprompterMode}
 onToggleTeleprompterMode={() => setTeleprompterMode(m => m ==='scroll' ?'sections' :'scroll')}
 isTeleprompterPlaying={isTeleprompterPlaying}
 onToggleTeleprompterPlay={() => setIsTeleprompterPlaying(p => !p)}
 teleprompterSpeed={teleprompterSpeed}
 onChangeTeleprompterSpeed={setTeleprompterSpeed}
 onResetTeleprompterScroll={() => {
 if (teleprompterScrollRef.current) {
 teleprompterScrollRef.current.scrollTo({ top: 0, behavior:'smooth' });
 }
 }}
 teleprompterScrollRef={teleprompterScrollRef}
 />
 )}
 </div>

 {/* THIN BOTTOM BAR — page dots + prev/next for touch, live transposition & teleprompter */}
 <div className={`shrink-0 px-3 sm:px-4 py-2 space-y-2 z-20 ${glareMode ?'bg-gradient-to-t from-white to-white/0' :'bg-gradient-to-t from-black to-[var(--sunken)]/0'}`}>
 {!isBlock && !showScannedSheet && currentSong?.tonalidad && (
 <div className="flex items-center justify-center gap-2 text-xs">
 <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-0.5 rounded">
 <button
 type="button"
 onClick={() => setLiveTransposeOffset(v => v - 1)}
 className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold cursor-pointer"
 title="Bajar 1 semitono (-1)"
 >
 -
 </button>
 <span className="text-[var(--acc)] font-bold font-sans">🎯 {transposedKey}</span>
 <button
 type="button"
 onClick={() => setLiveTransposeOffset(v => v + 1)}
 className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold cursor-pointer"
 title="Subir 1 semitono (+1)"
 >
 +
 </button>
 {liveTransposeOffset !== 0 && (
 <button
 type="button"
 onClick={() => setLiveTransposeOffset(0)}
 className="ml-1 text-[10px] px-1 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 cursor-pointer"
 title="Restablecer tono"
 >
 {liveTransposeOffset > 0 ? `+${liveTransposeOffset}` : liveTransposeOffset} ⟲
 </button>
 )}
 </div>
 {effectiveTranspose !== 0 && (
 <span className="text-[var(--ink-2)] font-sans text-[11px] hidden sm:inline">
 (original {currentSong?.tonalidad})
 </span>
 )}
 </div>
 )}

 <div className="flex items-center justify-between gap-3">
 <button
 onClick={handlePrev}
 disabled={isFirst}
 className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-[var(--r-s)] transition flex items-center gap-1.5 ${
 glareMode ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink)]'
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
 className={`shrink-0 transition-all ${it.tipoItem ==='bloque' ?'rounded-sm' :'rounded-full'} ${
 i === currentIndex
 ?'w-5 h-1.5 bg-[var(--acc)]/60'
 : it.tipoItem ==='bloque'
 ?'w-1.5 h-1.5 bg-[var(--tentative)]/60 hover:bg-[var(--tentative)]'
 : glareMode ?'w-1.5 h-1.5 bg-[var(--sunken)] hover:bg-[var(--sunken)]' :'w-1.5 h-1.5 bg-[var(--ink)]/25 hover:bg-[var(--ink)]/50'
 }`}
 title={itemLabel(it, songs)}
 />
 ))}
 </div>

 <button
 onClick={handleNext}
 disabled={isLast}
 className={`px-4 py-2.5 disabled:opacity-30 font-bold rounded-[var(--r-s)] transition flex items-center gap-1.5 ${
 glareMode ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--ink)]/5 hover:bg-[var(--ink)]/10 text-[var(--ink)]'
 }`}
 >
 <span className="hidden sm:inline text-xs">Siguiente</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>

 {nextItem && (
 <p className={`text-center text-[11px] font-sans truncate ${glareMode ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Siguiente: <span className={glareMode ?'text-[var(--ink)]' :'text-[var(--ink-2)]'}>{itemLabel(nextItem, songs)}</span>
 {nextItem.tipoItem ==='cancion' && songs.find(s => s.id === nextItem.songId)?.tonalidad && (
 <span> · {songs.find(s => s.id === nextItem.songId)?.tonalidad}</span>
 )}
 </p>
 )}
 </div>

 {/* Fallback internal Practice Mode Panel if not handled by parent */}
 {internalPracticeIdea && (internalPracticeSong || currentSong) && (
 <PracticeModePanel
 song={internalPracticeSong || currentSong!}
 idea={internalPracticeIdea}
 tracks={getIdeaTracks(internalPracticeIdea)}
 currentUser={currentUser}={glareMode}
 onClose={() => {
 setInternalPracticeIdea(null);
 setInternalPracticeSong(null);
 }}
 onOpenStudio={() => {
 const s = internalPracticeSong || currentSong;
 setInternalPracticeIdea(null);
 setInternalPracticeSong(null);
 if (s) handleLaunchStudio(s);
 }}
 onApplyAsMainChords={(cifradoTexto, guiaSustituto) => {
 const s = internalPracticeSong || currentSong;
 if (s) {
 onUpdateSong?.({ ...s, cifradoTexto, guiaSustituto });
 }
 }}
 />
 )}

 {/* Drawer: Repertorio completo, pistas Iris y accesos directos a Studio */}
 {showSongListDrawer && (
 <div className="fixed inset-0 z-50 flex justify-end bg-[var(--scrim)]/75 animate-in fade-in duration-150">
 <div className="w-full max-w-md h-full bg-[var(--surface)] flex flex-col text-[var(--ink)]">
 {/* Drawer Header */}
 <div className="p-4 flex items-center justify-between bg-[var(--surface)]">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc)]/30 flex items-center justify-center">
 <ListMusic className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-[var(--ink)] tracking-wider">Repertorio & Pistas Iris</h3>
 <p className="text-[11px] text-[var(--ink-2)]">
 {songsWithIrisCount} de {songsInSetlistCount} temas con pistas Iris listas
 </p>
 </div>
 </div>
 <button
 onClick={() => setShowSongListDrawer(false)}
 className="p-1.5 rounded-[var(--r-s)] hover:bg-[var(--ink)]/10 text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Drawer List */}
 <div className="flex-1 overflow-y-auto p-3 space-y-2">
 {allItems.map((item, idx) => {
 const isItemBlock = item.tipoItem ==='bloque';
 const song = !isItemBlock ? songs.find(s => s.id === item.songId) : undefined;
 const isCurrent = idx === currentIndex;
 const songIrisIdea = song ? getSongIrisStemIdea(song) : null;
 const stemCount = songIrisIdea ? getIdeaTracks(songIrisIdea).length : 0;

 if (isItemBlock) {
 const meta = getBlockMeta(item);
 return (
 <div
 key={item.id}
 onClick={() => {
 setCurrentIndex(idx);
 setShowSongListDrawer(false);
 }}
 className={`p-3 rounded-[var(--r-m)] flex items-center justify-between cursor-pointer transition ${
 isCurrent
 ?'bg-[var(--acc)]/90/40/50 text-[var(--acc)]/40'
 :'bg-[var(--bg)]/60800 hover:border-[var(--hair)]700 text-[var(--ink-2)]'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <span className="text-lg">{meta.icon}</span>
 <div>
 <div className="text-xs font-bold text-[var(--ink)]">{item.tituloCustom || meta.label}</div>
 <div className="text-[10px] text-[var(--ink-2)] font-sans">Bloque de escenario</div>
 </div>
 </div>
 <span className="px-2 py-1 rounded bg-[var(--sunken)] text-[10px] text-[var(--ink-2)] font-sans">
 Ir al bloque
 </span>
 </div>
 );
 }

 if (!song) return null;

 return (
 <div
 key={item.id}
 className={`p-3 rounded-[var(--r-m)] transition flex flex-col gap-2.5 ${
 isCurrent
 ?'bg-[var(--acc)]/10 /50'
 :'bg-[var(--surface)]800/80 hover:border-[var(--hair)]700'
 }`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0">
 <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-sans font-bold shrink-0 ${
 isCurrent ?'bg-[var(--acc)] text-[var(--on-acc)]' :'bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}>
 {idx + 1}
 </span>
 <div className="min-w-0">
 <h4 className={`text-xs font-bold truncate ${isCurrent ?'text-[var(--acc)]' :'text-[var(--ink)]'}`}>
 {song.titulo}
 </h4>
 <div className="flex items-center gap-2 text-[10px] text-[var(--ink-2)] font-sans">
 {song.tonalidad && <span className="text-[var(--acc)]/70">Tono: {song.tonalidad}</span>}
 {song.bpm ? <span>· {song.bpm} BPM</span> : null}
 {song.duracion ? <span>· {song.duracion}</span> : null}
 </div>
 </div>
 </div>

 {songIrisIdea ? (
 <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--ok)]/20 text-[var(--ink-2)] flex items-center gap-1">
 <Headphones className="w-2.5 h-2.5" />
 {stemCount > 0 ? `${stemCount} pistas` :'Iris'}
 </span>
 ) : (
 <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] text-[var(--ink-2)] bg-[var(--sunken)]/50">
 Sin Iris
 </span>
 )}
 </div>

 <div className="flex items-center gap-1.5 pt-1">
 {songIrisIdea ? (
 <button
 type="button"
 onClick={() => {
 setShowSongListDrawer(false);
 handleLaunchPractice(song, songIrisIdea);
 }}
 className="flex-1 py-1.5 px-2 rounded-[var(--r-s)] text-xs font-bold bg-[var(--ok)]/20 hover:bg-[var(--ok)]/30 text-[var(--ink-2)] flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
 title="Modo Ensayo individual con las pistas aisladas de este tema"
 >
 <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Modo Ensayo</span>
 </button>
 ) : (
 <button
 type="button"
 onClick={() => {
 setShowSongListDrawer(false);
 handleLaunchStudio(song);
 }}
 className="flex-1 py-1.5 px-2 rounded-[var(--r-s)] text-xs font-bold bg-[var(--tentative)]/20 hover:bg-[var(--tentative)]/30 text-[var(--tentative)]/50 flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
 title="Separar pistas de este tema con el motor de IA Iris en Modo Studio"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--tentative)]" />
 <span>Separar con Iris</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => {
 setShowSongListDrawer(false);
 handleLaunchStudio(song);
 }}
 className="py-1.5 px-2.5 rounded-[var(--r-s)] text-xs font-semibold bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink)]700 flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
 title="Abrir Studio multipista completo de este tema"
 >
 <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]/50" />
 <span className="hidden sm:inline">Studio</span>
 </button>

 <button
 type="button"
 onClick={() => {
 setCurrentIndex(idx);
 setShowSongListDrawer(false);
 }}
 className="py-1.5 px-2.5 rounded-[var(--r-s)] text-xs font-bold bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)] flex items-center justify-center gap-1 transition cursor-pointer active:scale-95"
 title="Mostrar en el atril"
 >
 <Play className="w-3 h-3 text-[var(--acc)]" />
 <span>Atril</span>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

// Vista"teleprompter" para los bloques del repertorio (presentación al público, cambio de
// instrumento, descanso...) que antes desaparecían sin más del modo concierto. Texto grande y
// centrado, como un guion, para leerlo en voz alta o seguir la indicación sin acercarse a mirar.
const TeleprompterBlockPage: React.FC<{ item: SetlistItem; meta: { icon: string; label: string }; glareMode: boolean }> = ({ item, meta, glareMode }) => {
 const script = item.notas || item.notaTema ||'';
 const duration = item.duracionEstimadaMinutos
 ? `${item.duracionEstimadaMinutos} min`
 : item.duracionEstimadaSegundos
 ? `${item.duracionEstimadaSegundos}s`
 : null;

 return (
 <div className={`w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center overflow-y-auto ${
 glareMode ?'bg-[var(--surface)]' :'bg-gradient-to-b from-indigo-950/40 via-[var(--surface)] to-[var(--sunken)]'
 }`}>
 <span className="text-5xl sm:text-7xl mb-6">{meta.icon}</span>
 <h2 className={`text-2xl sm:text-4xl font-bold mb-6 tracking-wide ${glareMode ?'text-[var(--ink)]' :'text-[var(--acc)]/70'}`}>
 {item.tituloCustom || meta.label}
 </h2>
 {script ? (
 <p className={`text-xl sm:text-3xl md:text-4xl leading-relaxed max-w-4xl whitespace-pre-wrap font-medium ${glareMode ?'text-[var(--ink)] font-bold' :'text-[var(--ink)]'}`}>
 {script}
 </p>
 ) : (
 <p className="text-[var(--ink-2)] text-lg">{meta.label}</p>
 )}
 {duration && (
 <p className="mt-8 text-[var(--ink-2)] font-sans text-sm">⏱ {duration}</p>
 )}
 </div>
 );
};

// Página tipo"atril digital": el documento original escaneado a pantalla completa, tal cual
// lo vería un músico de orquesta pasando hojas en un iPad.
const ScannedSheetPage: React.FC<{ song: Song }> = ({ song }) => {
 const isImage = isImageDocument(song.estructuraDocumentoNombre, song.estructuraDocumentoUrl);

 if (!song.estructuraDocumentoUrl || song.estructuraDocumentoUrl.trim() ==='') {
 return (
 <div className="w-full h-full flex items-center justify-center bg-[var(--surface)] p-4 text-[var(--ink-2)] text-sm">
 No hay documento adjunto disponible
 </div>
 );
 }

 return (
 <div className="w-full h-full flex items-center justify-center bg-[var(--surface)] p-1 sm:p-4">
 {isImage ? (
 <img
 src={song.estructuraDocumentoUrl}
 alt={`Partitura de ${song.titulo}`}
 className="max-w-full max-h-full object-contain rounded"
 />
 ) : (
 <iframe
 src={song.estructuraDocumentoUrl}
 title={`Partitura de ${song.titulo}`}
 className="w-full h-full bg-[var(--surface)] rounded"
 />
 )}
 </div>
 );
};

// Fallback cuando la canción todavía no tiene un documento escaneado: el texto de acordes y
// letra ocupa casi toda la pantalla — es lo único que un músico necesita leer sin tocar nada,
// así que la ficha (tono/tempo/duración/afinación) se reduce a una línea y la estructura/
// progresión quedan colapsadas detrás de un botón"ⓘ", en vez de robarle espacio por defecto.
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
 liveTransposeOffset: number;
 onLiveTransposeChange: (offset: number) => void;
 bpm?: number;
 duracion?: string;
 afinacion?: string;
 fontSizeClass: string;
 showDetails: boolean;
 onToggleDetails: () => void;
 glareMode: boolean;
 teleprompterMode:'sections' |'scroll';
 onToggleTeleprompterMode: () => void;
 isTeleprompterPlaying: boolean;
 onToggleTeleprompterPlay: () => void;
 teleprompterSpeed: number;
 onChangeTeleprompterSpeed: (speed: number) => void;
 onResetTeleprompterScroll: () => void;
 teleprompterScrollRef: React.RefObject<HTMLDivElement | null>;
}> = ({
 chords,
 sections,
 currentSectionIndex,
 onAdvanceSection,
 onRetreatSection,
 structure,
 progression,
 transposedKey,
 originalKey,
 transpose,
 liveTransposeOffset,
 onLiveTransposeChange,
 bpm,
 duracion,
 afinacion,
 fontSizeClass,
 showDetails,
 onToggleDetails,
 glareMode,
 teleprompterMode,
 onToggleTeleprompterMode,
 isTeleprompterPlaying,
 onToggleTeleprompterPlay,
 teleprompterSpeed,
 onChangeTeleprompterSpeed,
 onResetTeleprompterScroll,
 teleprompterScrollRef
}) => {
 const hasMultipleSections = sections.length >= 2;
 const currentSection = hasMultipleSections ? sections[currentSectionIndex] : null;
 const chordTextClass = glareMode ?'text-[var(--ink)] font-bold' :'text-[var(--acc)]';
 const borderClass = glareMode ?'border-[var(--hair)]/10' :'border-[var(--hair)]';

 return (
 <div className="w-full h-full flex flex-col overflow-hidden">
 {/* Ficha compacta con transposición en tiempo real y selector de modo */}
 <div className={`shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-2 text-xs sm:text-sm font-sans ${borderClass} ${glareMode ?'bg-[var(--sunken)]' :'bg-[var(--sunken)]'}`}>
 <div className="flex items-center gap-2 flex-wrap">
 {/* Selector de tono con transposición en tiempo real */}
 <div className="flex items-center gap-1 bg-[var(--sunken)] px-2 py-0.5 rounded">
 <button
 type="button"
 onClick={() => onLiveTransposeChange(liveTransposeOffset - 1)}
 className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/15 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition cursor-pointer"
 title="Bajar 1 semitono (-1)"
 >
 -
 </button>
 <span className={glareMode ?'text-[var(--ok)] font-bold' :'text-[var(--ok)] font-bold'}>
 🎯 {transposedKey ||'Sin tono'}
 </span>
 <button
 type="button"
 onClick={() => onLiveTransposeChange(liveTransposeOffset + 1)}
 className="px-1.5 py-0.5 rounded hover:bg-[var(--ink)]/15 text-[var(--ink-2)] hover:text-[var(--ink)] font-bold transition cursor-pointer"
 title="Subir 1 semitono (+1)"
 >
 +
 </button>
 {liveTransposeOffset !== 0 && (
 <button
 type="button"
 onClick={() => onLiveTransposeChange(0)}
 className="ml-1 text-[10px] px-1 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 transition cursor-pointer"
 title="Restablecer al tono del repertorio"
 >
 {liveTransposeOffset > 0 ? `+${liveTransposeOffset}` : liveTransposeOffset} ⟲
 </button>
 )}
 </div>

 {originalKey && (transpose !== 0 || liveTransposeOffset !== 0) && (
 <span className="text-[11px] text-[var(--ink-2)] font-normal">
 (orig: {originalKey})
 </span>
 )}
 {bpm && <span className={glareMode ?'text-[var(--tentative)]' :'text-[var(--tentative)]/50'}>{bpm} BPM</span>}
 {duracion && <span className={glareMode ?'text-[var(--ok)]' :'text-[var(--ink-2)]'}>{duracion}</span>}
 {afinacion && <span className={glareMode ?'text-[var(--acc)]' :'text-[var(--tentative)]/80'}>{afinacion}</span>}
 {(structure || progression) && (
 <button
 onClick={onToggleDetails}
 className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition ${
 showDetails ? (glareMode ?'bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--ink)]/15 text-[var(--ink)]') : (glareMode ?'text-[var(--ink-2)] hover:text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]')
 }`}
 title="Estructura y progresión de acordes"
 >
 <Info className="w-3 h-3" /> detalles
 </button>
 )}
 </div>

 {/* Selector de modo Teleprompter vs Secciones */}
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onToggleTeleprompterMode}
 className={`px-2.5 py-1 text-xs font-sans font-bold rounded-[var(--r-s)] transition flex items-center gap-1.5 cursor-pointer ${
 teleprompterMode ==='scroll'
 ?'bg-[var(--acc)]/20 /50 text-[var(--acc)]/70'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title={teleprompterMode ==='scroll' ?'Cambiar a modo pedal por secciones' :'Cambiar a modo teleprompter scroll continuo'}
 >
 <span>{teleprompterMode ==='scroll' ?'📜 Teleprompter Auto' :'📑 Modo Secciones'}</span>
 </button>
 </div>
 </div>

 {showDetails && (structure || progression) && (
 <div className={`shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-2 text-xs sm:text-sm ${borderClass} ${glareMode ?'bg-[var(--sunken)]' :'bg-[var(--sunken)]'}`}>
 {structure && (
 <p className={glareMode ?'text-[var(--tentative)]' :'text-[var(--tentative)]/40'}><span className={glareMode ?'text-[var(--tentative)] font-bold' :'text-[var(--tentative)] font-bold'}>🎵 Estructura: </span>{structure}</p>
 )}
 {progression && (
 <p className={glareMode ?'text-[var(--ok)]' :'text-[var(--ok)]/60'}><span className={glareMode ?'text-[var(--ok)] font-bold' :'text-[var(--ok)] font-bold'}>🎸 Progresión: </span>{progression}</p>
 )}
 </div>
 )}

 {/* MODO TELEPROMPTER AUTO-SCROLL */}
 {teleprompterMode ==='scroll' ? (
 <div className="flex-1 flex flex-col overflow-hidden">
 {/* Barra de control del teleprompter */}
 <div className={`shrink-0 flex items-center justify-between gap-3 px-4 py-2 ${borderClass} ${glareMode ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/90'}`}>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onToggleTeleprompterPlay}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold flex items-center gap-1.5 transition cursor-pointer ${
 isTeleprompterPlaying
 ?'bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)]'
 :'bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)]'
 }`}
 title="Pausar o reanudar teleprompter (o pulsar Espacio)"
 >
 {isTeleprompterPlaying ? (
 <>
 <Pause className="w-3.5 h-3.5" />
 <span>Pausa (Espacio)</span>
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5" />
 <span>Rodar (Espacio)</span>
 </>
 )}
 </button>

 <button
 type="button"
 onClick={onResetTeleprompterScroll}
 className="px-2.5 py-1.5 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--r-s)] text-xs font-sans flex items-center gap-1 transition cursor-pointer"
 title="Rebobinar al principio"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Inicio</span>
 </button>
 </div>

 {/* Velocidades */}
 <div className="flex items-center gap-1 text-[11px] font-sans">
 <span className="text-[var(--ink-2)] hidden sm:inline mr-1">Vel:</span>
 {[0.5, 1, 1.5, 2].map(speed => (
 <button
 key={speed}
 type="button"
 onClick={() => onChangeTeleprompterSpeed(speed)}
 className={`px-2 py-1 rounded text-xs transition cursor-pointer ${
 teleprompterSpeed === speed
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {speed}x
 </button>
 ))}
 </div>
 </div>

 {/* Contenedor de lectura continua */}
 <div ref={teleprompterScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
 <pre className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words pb-32 ${fontSizeClass} ${chordTextClass}`}>
 {chords}
 </pre>
 </div>
 </div>
 ) : hasMultipleSections ? (
 // NAVEGACIÓN POR SECCIONES (PEDAL / TAP)
 <div className="flex-1 flex flex-col overflow-hidden">
 <div className={`shrink-0 text-center py-1.5 text-[11px] font-sans ${borderClass} ${glareMode ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Parte {currentSectionIndex + 1}/{sections.length}
 {currentSection?.title && <span className={glareMode ?'text-[var(--acc)] font-bold' :'text-[var(--tentative)]/80 font-bold'}> · {currentSection.title}</span>}
 </div>
 <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
 <pre className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words text-center ${fontSizeClass} ${chordTextClass}`}>
 {currentSection?.body}
 </pre>
 </div>
 <div className={`shrink-0 flex items-center gap-2 p-3 ${borderClass}`}>
 <button
 onClick={onRetreatSection}
 disabled={currentSectionIndex === 0}
 className={`px-4 py-2.5 disabled:opacity-30 rounded-[var(--r-s)] text-sm font-sans font-bold transition ${
 glareMode ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]'
 }`}
 >
 ◀ Parte anterior
 </button>
 <button
 onClick={onAdvanceSection}
 className="flex-1 py-2.5 bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] rounded-[var(--r-s)] text-sm font-sans font-bold transition"
 >
 Siguiente parte ▶
 </button>
 </div>
 </div>
 ) : (
 // Sin encabezados de sección detectados: se muestra todo el cifrado de una vez, con scroll manual
 <div className="flex-1 overflow-y-auto p-4 sm:p-6">
 <pre className={`max-w-4xl mx-auto font-sans whitespace-pre-wrap leading-relaxed break-words ${fontSizeClass} ${chordTextClass}`}>
 {chords}
 </pre>
 </div>
 )}
 </div>
 );
};

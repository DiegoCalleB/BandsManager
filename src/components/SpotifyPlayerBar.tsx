import React, { useState, useEffect, useRef } from'react';

const SILENT_AUDIO_URI ='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
import { Song, ThemeColors } from'../types';
import {
 Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX,
 ExternalLink, Disc, Sliders, X, Flame, Music, Sparkles, FileText, ChevronUp, ChevronDown
} from'lucide-react';
import { parseGoogleDriveAudioUrl, isGoogleDriveUrl, resolveAudioUrl, fileToBase64 } from'../utils/audioStorage';
import { CROSSFADE_SECONDS, computeCrossfadeGains, shouldCrossfade } from'../utils/crossfade';
import { transposeChordToken, getSemitoneDifference } from'../utils/chordUtils';
import { api } from'../services/api';
import { useTonePitchShift } from'../hooks/useTonePitchShift';

interface SpotifyPlayerBarProps {
 song: Song | null;
 songs: Song[];
 colors: ThemeColors;
 onSelectSong: (song: Song, autoPlay?: boolean) => void;
 onOpenStudio: (song: Song) => void;
 onOpenIris?: (song: Song) => void;
 onUpdateSong?: (song: Song) => void;
 onClosePlayer: () => void;
 autoPlay?: boolean;
 playSignal?: number;
 onIsPlayingChange?: (isPlaying: boolean) => void;
 /** Transposition semitones (e.g., 2 for +2 semitones). If provided, audio will be pitch-shifted. */
 transposeSemitones?: number;
}

function getRawAudioUrl(song: Song | null | undefined): string {
 if (!song) return'';
 return (
 song.audioPrincipalUrl ||
 (song as any).audio_principal_url ||
 song.audioUrl ||
 (song as any).audio_url ||
 (song as any).audio ||
 (song as any).url ||
 (song as any).fileUrl ||
 (song as any).file_url ||
 (song.audioIdeas && song.audioIdeas[0]?.audioUrl) ||
 (song as any).audio_ideas?.[0]?.audioUrl ||
 (song as any).audio_ideas?.[0]?.audio_url ||''
 );
}

export default function SpotifyPlayerBar({
 song,
 songs,
 colors,
 onSelectSong,
 onOpenStudio,
 onOpenIris,
 onUpdateSong,
 onClosePlayer,
 autoPlay = false,
 playSignal = 0,
 onIsPlayingChange,
 transposeSemitones: propTransposeSemitones = 0
}: SpotifyPlayerBarProps) {
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [volume, setVolume] = useState(0.8);
 const [isMuted, setIsMuted] = useState(false);
 const [isLooping, setIsLooping] = useState(false);
 const [playbackRate, setPlaybackRate] = useState<number>(1);
 const [isMinimized, setIsMinimized] = useState(false);

 // Cálculo automático de semitonos (prop explícita o diferencia entre tonalidad y tonalidadDeseada)
 const calculatedSemitones = React.useMemo(() => {
 if (typeof propTransposeSemitones ==='number' && propTransposeSemitones !== 0) {
 return propTransposeSemitones;
 }
 if (song?.tonalidad && (song as any)?.tonalidadDeseada) {
 return getSemitoneDifference(song.tonalidad, (song as any).tonalidadDeseada) ?? 0;
 }
 return 0;
 }, [propTransposeSemitones, song?.id, song?.tonalidad, (song as any)?.tonalidadDeseada]);

 const [transposeSemitones, setTransposeSemitones] = useState<number>(calculatedSemitones);

 useEffect(() => {
 setTransposeSemitones(calculatedSemitones);
 }, [calculatedSemitones, song?.id]);

 // Fundido real (5s, curva de potencia constante) al pasar al siguiente tema de la cola —
 // desactivado por defecto, mismo interruptor tanto si la cola es el catálogo, un álbum de
 // Discografía o un repertorio (ver `songs`, que decide qué es"el siguiente tema" en cada caso).
 const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
 const [isCrossfading, setIsCrossfading] = useState(false);

 // Dos <audio> en vez de uno: durante un fundido, uno termina el tema actual mientras el otro ya
 // reproduce el siguiente desde cero (mismo patrón que useStagePlayer.ts). `activeSlotRef` dice
 // cuál de los dos es"el de siempre" a efectos de play/pause/seek/volumen manuales — el otro
 // solo se usa como pista temporal de solape mientras dura el fundido.
 const audioRefA = useRef<HTMLAudioElement | null>(null);
 const audioRefB = useRef<HTMLAudioElement | null>(null);
 const activeSlotRef = useRef<'A' |'B'>('A');
 const getActiveAudioEl = () => (activeSlotRef.current ==='A' ? audioRefA.current : audioRefB.current);
 const getInactiveAudioEl = () => (activeSlotRef.current ==='A' ? audioRefB.current : audioRefA.current);

 // Spotify Pedalboard C++ DSP on server is used for audio transposition instead of Web Audio phase vocoders

 // Audio Synth fallback for songs without custom audio file
 const synthIntervalRef = useRef<any>(null);
 const audioCtxRef = useRef<AudioContext | null>(null);

 const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');

 const crossfadeRafRef = useRef<number | null>(null);
 const isCrossfadingRef = useRef(false);
 // Id de la última canción que llegó aquí por un fundido recién completado — le dice al efecto
 // de"cambió la canción" que ese tema ya está sonando de verdad (arrancó durante el fundido) y
 // que NO debe recargar el audio ni relanzar la reproducción desde cero.
 const promotedSongIdRef = useRef<string | null>(null);

 const cancelCrossfade = () => {
 if (crossfadeRafRef.current !== null) {
 cancelAnimationFrame(crossfadeRafRef.current);
 crossfadeRafRef.current = null;
 }
 if (isCrossfadingRef.current) {
 const inactive = getInactiveAudioEl();
 if (inactive) {
 inactive.pause();
 inactive.volume = isMuted ? 0 : volume;
 }
 const active = getActiveAudioEl();
 if (active) active.volume = isMuted ? 0 : volume;
 isCrossfadingRef.current = false;
 setIsCrossfading(false);
 }
 };

 const [isTransposingAudio, setIsTransposingAudio] = useState(false);

 // Trasposición nativa en tiempo real en el navegador (Tone.js / Web Audio API)
 useTonePitchShift({
 audioElement: getActiveAudioEl(),
 semitones: transposeSemitones
 });

 // Extract and resolve active audio URL asynchronously (supporting IndexedDB, Drive & Spotify Pedalboard DSP)
 useEffect(() => {
 let isMounted = true;
 if (!song) {
 setActiveAudioUrl('');
 return;
 }

 const rawUrl = getRawAudioUrl(song);

 if (!rawUrl) {
 setActiveAudioUrl('');
 return;
 }

 resolveAudioUrl(rawUrl).then((resolved) => {
 if (isMounted) {
 setActiveAudioUrl(resolved ||'');
 }
 }).catch(err => {
 console.warn('Error resolving audio URL:', err);
 if (isMounted) setActiveAudioUrl('');
 });

 return () => {
 isMounted = false;
 };
 }, [song, transposeSemitones]);

 // Sync isPlaying state to parent if callback provided
 useEffect(() => {
 onIsPlayingChange?.(isPlaying);
 }, [isPlaying, onIsPlayingChange]);

 const lastHandledSignalRef = useRef<number>(0);
 const lastSongIdRef = useRef<string | null>(null);

 // Cualquier cambio de canción que NO venga de un fundido recién completado corta un fundido en
 // curso — sin esto, terminaría aplicándose sobre la pista equivocada.
 useEffect(() => {
 if (promotedSongIdRef.current === song?.id) return;
 cancelCrossfade();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [song?.id]);

 // When song, activeAudioUrl, autoPlay, or playSignal changes
 useEffect(() => {
 if (!song) {
 setIsPlaying(false);
 lastSongIdRef.current = null;
 return;
 }

 const isNewSong = lastSongIdRef.current !== song.id;
 lastSongIdRef.current = song.id;

 if (promotedSongIdRef.current === song.id) {
 // Este tema llegó aquí por un fundido: ya está sonando de verdad desde antes
 const activeEl = getActiveAudioEl();
 const realDuration = activeEl?.duration;
 setDuration(realDuration && isFinite(realDuration) ? realDuration : (song.duracionSegundos || 210));
 return;
 }

 const hasNewPlaySignal = !!(playSignal && playSignal !== lastHandledSignalRef.current);
 if (playSignal) {
 lastHandledSignalRef.current = playSignal;
 }

 const activeEl = getActiveAudioEl();
 const wasPlaying = isPlaying;
 const previousTime = activeEl?.currentTime || currentTime || 0;

 const shouldPlayNow = autoPlay || hasNewPlaySignal || (!isNewSong && wasPlaying);

 if (isNewSong) {
 setCurrentTime(0);
 const estDuration = song.duracionSegundos || 210;
 setDuration(estDuration);
 }

 if (activeAudioUrl) {
 if (activeEl) {
 const urlChanged = activeEl.src !== activeAudioUrl && !activeEl.src.endsWith(activeAudioUrl);
 if (urlChanged) {
 activeEl.src = activeAudioUrl;
 activeEl.playbackRate = playbackRate;
 activeEl.volume = isMuted ? 0 : volume;

 if (!isNewSong && previousTime > 0) {
 try {
 activeEl.currentTime = previousTime;
 } catch {
 // ignore seek error
 }
 }
 }

 if (shouldPlayNow) {
 activeEl.play().then(() => {
 setIsPlaying(true);
 }).catch(err => {
 console.warn('Playback deferred or blocked:', err);
 setIsPlaying(false);
 });
 } else if (isNewSong) {
 activeEl.pause();
 activeEl.currentTime = 0;
 setIsPlaying(false);
 }
 }
 } else {
 if (activeEl) {
 activeEl.pause();
 if (activeEl.src !== SILENT_AUDIO_URI) {
 activeEl.src = SILENT_AUDIO_URI;
 }
 }
 if (shouldPlayNow) {
 setIsPlaying(true);
 } else if (isNewSong) {
 setIsPlaying(false);
 }
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [song, activeAudioUrl, autoPlay, playSignal]);

 // Playback rate effect
 useEffect(() => {
 const el = getActiveAudioEl();
 if (el) el.playbackRate = playbackRate;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [playbackRate]);


 // Volume effect
 useEffect(() => {
 if (isCrossfadingRef.current) return; // el fundido lleva el volumen de las dos pistas mientras dura
 const el = getActiveAudioEl();
 if (el) el.volume = isMuted ? 0 : volume;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [volume, isMuted]);

 // Loop effect
 useEffect(() => {
 const el = getActiveAudioEl();
 if (el) el.loop = isLooping;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isLooping]);

 // Synthetic practice beat generator when no audio URL exists
 useEffect(() => {
 if (isPlaying && !activeAudioUrl && song) {
 const bpm = song.bpm || 120;
 const intervalMs = (60 / bpm) * 1000;

 synthIntervalRef.current = setInterval(() => {
 setCurrentTime(prev => {
 const next = prev + (60 / bpm);
 if (next >= (song.duracionSegundos || 210)) {
 if (isLooping) return 0;
 setIsPlaying(false);
 return 0;
 }
 return next;
 });

 // Simple subtle click synth sound for practice
 try {
 if (!audioCtxRef.current) {
 audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
 }
 if (audioCtxRef.current.state ==='suspended') {
 audioCtxRef.current.resume();
 }
 const osc = audioCtxRef.current.createOscillator();
 const gain = audioCtxRef.current.createGain();
 osc.type ='triangle';
 osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
 gain.gain.setValueAtTime(0.05, audioCtxRef.current.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
 osc.connect(gain);
 gain.connect(audioCtxRef.current.destination);
 osc.start();
 osc.stop(audioCtxRef.current.currentTime + 0.08);
 } catch {
 // ignore web audio context limits
 }
 }, intervalMs);
 } else {
 if (synthIntervalRef.current) {
 clearInterval(synthIntervalRef.current);
 }
 }

 return () => {
 if (synthIntervalRef.current) {
 clearInterval(synthIntervalRef.current);
 }
 };
 }, [isPlaying, activeAudioUrl, song, isLooping]);

 // Cancela cualquier fundido pendiente al desmontar el reproductor.
 useEffect(() => {
 return () => cancelCrossfade();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 if (!song) return null;

 const currentIdx = songs.findIndex(s => s.id === song.id);
 // Mismo cálculo que handleNext (con vuelta al principio de la cola) — se usa tanto para saltar
 // manualmente como para saber a qué tema fundir cuando se acerca el final del actual.
 const nextQueueSong: Song | null = songs.length > 0
 ? (currentIdx >= 0 && currentIdx < songs.length - 1 ? songs[currentIdx + 1] : songs[0])
 : null;

 const handlePrev = () => {
 cancelCrossfade();
 if (currentIdx > 0) {
 onSelectSong(songs[currentIdx - 1]);
 } else {
 onSelectSong(songs[songs.length - 1]);
 }
 };

 const handleNext = (autoPlayNext: boolean = false) => {
 cancelCrossfade();
 if (currentIdx >= 0 && currentIdx < songs.length - 1) {
 onSelectSong(songs[currentIdx + 1], autoPlayNext);
 } else {
 onSelectSong(songs[0], autoPlayNext);
 }
 };

 const handleEnded = () => {
 if (isLooping) {
 const el = getActiveAudioEl();
 if (el) {
 el.currentTime = 0;
 el.play();
 }
 } else {
 // Al terminar una canción, la siguiente debe reproducirse automáticamente (autoPlay=true)
 handleNext(true);
 }
 };

 const togglePlayPause = () => {
 const el = getActiveAudioEl();
 if (activeAudioUrl && el) {
 if (isPlaying) {
 el.pause();
 setIsPlaying(false);
 } else {
 el.play().then(() => setIsPlaying(true)).catch(err => {
 console.warn('Playback deferred or interrupted:', err);
 setIsPlaying(false);
 });
 }
 } else {
 setIsPlaying(!isPlaying);
 }
 };

 const handleSeek = (newTime: number) => {
 setCurrentTime(newTime);
 const el = getActiveAudioEl();
 if (el && activeAudioUrl) {
 el.currentTime = newTime;
 }
 };

 // Arranca el fundido cruzado cuando quedan CROSSFADE_SECONDS o menos del tema actual — llamado
 // desde onTimeUpdate del <audio> activo en vez de un setInterval propio, así no hay dos relojes
 // compitiendo por decidir"cuánto queda".
 const handleActiveTimeUpdate = (currentTimeSec: number) => {
 setCurrentTime(currentTimeSec);

 if (!crossfadeEnabled || isLooping || isCrossfadingRef.current) return;
 if (!nextQueueSong || nextQueueSong.id === song.id) return; // cola de un solo tema: nada que fundir
 if (!duration || !shouldCrossfade(duration) || duration - currentTimeSec > CROSSFADE_SECONDS) return;

 const nextRawUrl = getRawAudioUrl(nextQueueSong);
 if (!nextRawUrl) return;

 const fromEl = getActiveAudioEl();
 const toEl = getInactiveAudioEl();
 if (!fromEl || !toEl) return;

 isCrossfadingRef.current = true;
 setIsCrossfading(true);
 const baseVolume = isMuted ? 0 : volume;

 resolveAudioUrl(nextRawUrl).then((resolved) => {
 if (!resolved || !isCrossfadingRef.current) {
 isCrossfadingRef.current = false;
 setIsCrossfading(false);
 return;
 }
 toEl.src = resolved;
 toEl.currentTime = 0;
 toEl.volume = 0;
 toEl.playbackRate = playbackRate;
 toEl.play().catch(() => {
 isCrossfadingRef.current = false;
 setIsCrossfading(false);
 });

 const fadeMs = CROSSFADE_SECONDS * 1000;
 const startTs = performance.now();

 const tick = () => {
 if (!isCrossfadingRef.current) return; // cancelado a mitad de camino (cancelCrossfade)
 const elapsed = performance.now() - startTs;
 const { fromGain, toGain } = computeCrossfadeGains(elapsed, fadeMs);
 fromEl.volume = fromGain * baseVolume;
 toEl.volume = toGain * baseVolume;

 if (elapsed < fadeMs) {
 crossfadeRafRef.current = requestAnimationFrame(tick);
 return;
 }

 // Fundido completo: A se pausa/limpia y B pasa a ser la pista"activa" de verdad.
 fromEl.pause();
 fromEl.src = SILENT_AUDIO_URI;
 fromEl.volume = baseVolume;
 toEl.volume = baseVolume;
 activeSlotRef.current = activeSlotRef.current ==='A' ?'B' :'A';
 promotedSongIdRef.current = nextQueueSong.id;
 isCrossfadingRef.current = false;
 setIsCrossfading(false);
 crossfadeRafRef.current = null;
 onSelectSong(nextQueueSong, false);
 };
 crossfadeRafRef.current = requestAnimationFrame(tick);
 }).catch(() => {
 isCrossfadingRef.current = false;
 setIsCrossfading(false);
 });
 };

 const formatSecs = (secs: number) => {
 if (isNaN(secs) || secs < 0) return'0:00';
 const m = Math.floor(secs / 60);
 const s = Math.floor(secs % 60);
 return `${m}:${s < 10 ?'0' :''}${s}`;
 };

 const isDrive = isGoogleDriveUrl(song.audioPrincipalUrl ||'');

 // z-50, no z-40: App.tsx tiene su propia barra de pestañas fija en móvil a z-40 (bottom-0,
 // h-16) — con el mismo z-index, cuál tapa a cuál dependería del orden en el DOM y podría acabar
 // esta barra debajo de esa. Se renderiza vía portal a document.body (ver
 // RepertorioSetlists.tsx), así que z-50 la deja siempre por encima sin pelear por el orden.
 // left-0 en móvil, md:left-[240px] en desktop para no tapar el sidebar (w-[240px]) de App.tsx.
 // En móvil: bottom-[64px] para no tapar la barra de navegación inferior (h-16 = 64px).
 // Cuando está minimizado, ajustar el bottom para que solo se vea la tira de ~2.5rem sin tapar el navbar.
 return (
 <div className="fixed bottom-[64px] md:bottom-0 left-0 md:left-[240px] right-0 z-50 transition-all duration-300 shadow-2xl">
 {/* Dos <audio> en vez de uno (ver activeSlotRef arriba) — solo el activo actualiza el reloj
 en pantalla y decide cuándo fundir; el otro solo se usa como pista temporal de solape. */}
 <audio
 ref={audioRefA}
 src={SILENT_AUDIO_URI}
 preload="metadata"
 onError={(e) => { e.preventDefault(); }}
 onTimeUpdate={() => { if (activeSlotRef.current ==='A' && audioRefA.current) handleActiveTimeUpdate(audioRefA.current.currentTime); }}
 onLoadedMetadata={() => { if (activeSlotRef.current ==='A' && audioRefA.current?.duration) setDuration(audioRefA.current.duration); }}
 onEnded={() => { if (activeSlotRef.current ==='A') handleEnded(); }}
 />
 <audio
 ref={audioRefB}
 src={SILENT_AUDIO_URI}
 preload="metadata"
 onError={(e) => { e.preventDefault(); }}
 onTimeUpdate={() => { if (activeSlotRef.current ==='B' && audioRefB.current) handleActiveTimeUpdate(audioRefB.current.currentTime); }}
 onLoadedMetadata={() => { if (activeSlotRef.current ==='B' && audioRefB.current?.duration) setDuration(audioRefB.current.duration); }}
 onEnded={() => { if (activeSlotRef.current ==='B') handleEnded(); }}
 />

 <div className="bg-[var(--surface)]/98 backdrop-blur-2xl border-t border-[var(--hair)] text-[var(--ink)] px-3.5 py-2.5 sm:px-4 sm:py-3 max-w-full shadow-2xl">
 {isMinimized ? (
 /* Minimized Compact Strip: single-row bar sitting strictly above mobile bottom navbar */
 <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
 {/* Left: Thumbnail & Song Info (click to expand) */}
 <div
 onClick={() => setIsMinimized(false)}
 className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
 title="Haz clic para expandir el reproductor"
 >
 <div className="relative shrink-0 w-10 h-10 rounded-[var(--r-s)] bg-[var(--surface)] shadow-md overflow-hidden border-[var(--hair)]">
 {song.portadaUrl ? (
 <img src={song.portadaUrl} alt={song.titulo} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-[var(--ok)]/30 via-[var(--surface)] to-[var(--sunken)] flex items-center justify-center">
 <Disc className={`w-5 h-5 ${isPlaying ?'animate-spin-slow text-[var(--ok)]' :'text-zinc-400'}`} />
 </div>
 )}
 {isPlaying && (
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
 <span className="w-0.5 h-3 bg-[var(--surface)] rounded-full animate-pulse" />
 <span className="w-0.5 h-4 bg-[var(--surface)] rounded-full animate-pulse delay-75" />
 <span className="w-0.5 h-2 bg-[var(--surface)] rounded-full animate-pulse delay-150" />
 </div>
 )}
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h4 className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate group-hover:text-[var(--ok)] transition">{song.titulo}</h4>
 {isDrive && (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
 Drive
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-[#b3b3b3] font-mono mt-0.5 truncate">
 <span className="text-[var(--ink)] font-medium">{song.artista ||'Banda'}</span>
 <span>•</span>
 <span className="text-[var(--ok)] font-semibold">
 {song.tonalidad ||'Am'}
 {transposeSemitones !== 0 && (
 <span className="text-[#ff6b9d] ml-1 font-bold">
 ➔ {transposeChordToken(song.tonalidad ||'Am', transposeSemitones, /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test((song.tonalidad ||'Am').trim()) ?'ES' :'EN')} ({transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} st)
 </span>
 )}
 </span>
 <span>•</span>
 <span>{song.bpm} BPM</span>
 {isCrossfading && nextQueueSong && (
 <span className="text-sky-400 font-semibold animate-pulse hidden xs:inline">
 • 🔀 → {nextQueueSong.titulo}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Right: Quick Controls */}
 <div className="flex items-center gap-1 sm:gap-2 shrink-0">
 <button
 type="button"
 onClick={() => handlePrev()}
 className="p-1.5 text-[#b3b3b3] hover:text-[var(--ink)] transition cursor-pointer active:scale-90"
 title="Canción Anterior"
 >
 <SkipBack className="w-4 h-4 fill-current" />
 </button>

 <button
 type="button"
 onClick={togglePlayPause}
 className="w-8 h-8 rounded-full bg-[var(--surface)] hover:bg-[var(--surface)] text-black font-bold flex items-center justify-center shadow-md cursor-pointer transition hover:scale-105 active:scale-95"
 title={isPlaying ?"Pausar" :"Reproducir"}
 >
 {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
 </button>

 <button
 type="button"
 onClick={() => handleNext(false)}
 className="p-1.5 text-[#b3b3b3] hover:text-[var(--ink)] transition cursor-pointer active:scale-90"
 title="Siguiente Canción"
 >
 <SkipForward className="w-4 h-4 fill-current" />
 </button>

 <button
 type="button"
 onClick={() => setIsMinimized(false)}
 className="p-1.5 text-zinc-400 hover:text-[var(--ink)] cursor-pointer ml-1"
 title="Expandir Reproductor"
 >
 <ChevronUp className="w-5 h-5 text-[var(--ok)]" />
 </button>

 <button
 type="button"
 onClick={onClosePlayer}
 className="p-1.5 text-zinc-500 hover:text-[var(--ink)] transition cursor-pointer"
 title="Cerrar Reproductor"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 ) : (
 /* Full Expanded Player */
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">

 {/* Left: Song Info */}
 <div className="flex items-center justify-between w-full md:w-1/4 min-w-0">
 <div className="flex items-center gap-3.5 min-w-0">
 <div className="relative shrink-0 w-14 h-14 rounded-[var(--r-s)] bg-[var(--surface)] shadow-md overflow-hidden group border-[var(--hair)]">
 {song.portadaUrl ? (
 <img src={song.portadaUrl} alt={song.titulo} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-[var(--ok)]/30 via-[var(--surface)] to-[var(--sunken)] flex items-center justify-center">
 <Disc className={`w-7 h-7 ${isPlaying ?'animate-spin-slow text-[var(--ok)]' :'text-zinc-400'}`} />
 </div>
 )}
 {isPlaying && (
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
 <span className="w-1 h-4 bg-[var(--surface)] rounded-full animate-pulse" />
 <span className="w-1 h-6 bg-[var(--surface)] rounded-full animate-pulse delay-75" />
 <span className="w-1 h-3 bg-[var(--surface)] rounded-full animate-pulse delay-150" />
 </div>
 )}
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h4 className="text-sm font-bold text-[var(--ink)] hover:underline cursor-pointer truncate">{song.titulo}</h4>
 {onUpdateSong && (
 <button
 type="button"
 onClick={() => onUpdateSong({ ...song, favoritoGeneral: !song.favoritoGeneral })}
 className="text-zinc-400 hover:text-[var(--ok)] transition cursor-pointer p-0.5"
 title={song.favoritoGeneral ?"Guardado en Favoritos" :"Guardar en Favoritos"}
 >
 <Sparkles className={`w-4 h-4 ${song.favoritoGeneral ?'text-[var(--ok)] fill-[var(--ok)]' :''}`} />
 </button>
 )}
 {isDrive && (
 <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
 Drive
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 text-[11px] text-[#b3b3b3] font-mono mt-0.5 truncate">
 <span className="text-[var(--ink)] font-medium">{song.artista ||'Banda'}</span>
 <span>•</span>
 <span className="text-[var(--ok)] font-semibold">
 {song.tonalidad ||'Am'}
 {transposeSemitones !== 0 && (
 <span className="text-[#ff6b9d] ml-1 font-bold">
 ➔ {transposeChordToken(song.tonalidad ||'Am', transposeSemitones, /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test((song.tonalidad ||'Am').trim()) ?'ES' :'EN')} ({transposeSemitones > 0 ? `+${transposeSemitones}` : transposeSemitones} st)
 </span>
 )}
 {isTransposingAudio && (
 <span className="ml-1 text-sky-400 font-bold animate-pulse text-[10px]" title="Procesando trasposición DSP con Pedalboard de Spotify">
 🎛️ Pedalboard...
 </span>
 )}
 </span>
 <span>•</span>
 <span>{song.bpm} BPM</span>
 {isCrossfading && nextQueueSong && (
 <>
 <span>•</span>
 <span className="text-sky-400 font-semibold animate-pulse">🔀 → {nextQueueSong.titulo}</span>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Minimizar a una tira de ~2.5rem (ver el translate-y de más arriba) — antes solo
 disponible en móvil (`md:hidden`); ahora también en escritorio, para poder dejar
 la barra ocupando lo mínimo cuando no hace falta verla entera. */}
 <div className="flex items-center gap-1">
 <button
 onClick={() => setIsMinimized(!isMinimized)}
 className="p-1.5 text-zinc-400 hover:text-[var(--ink)] cursor-pointer"
 title={isMinimized ?"Expandir Reproductor" :"Minimizar"}
 >
 {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
 </button>
 </div>
 </div>

 {/* Center: Playback Controls & Timeline Scrubber */}
 <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">

 {/* Control Buttons */}
 <div className="flex items-center gap-4">
 {/* Loop Practice Toggle */}
 <button
 onClick={() => setIsLooping(!isLooping)}
 className={`p-1.5 rounded-full transition-all cursor-pointer ${
 isLooping
 ?'text-[var(--ok)] bg-[var(--surface)]/10'
 :'text-[#b3b3b3] hover:text-[var(--ink)]'
 }`}
 title={isLooping ?"Repetir tema activado" :"Activar Bucle"}
 >
 <Repeat className="w-4 h-4" />
 </button>

 {/* Prev Song */}
 <button
 onClick={() => handlePrev()}
 className="p-1 text-[#b3b3b3] hover:text-[var(--ink)] transition-all cursor-pointer active:scale-90"
 title="Canción Anterior"
 >
 <SkipBack className="w-5 h-5 fill-current" />
 </button>

 {/* Play / Pause - Authentic Spotify Green Circle */}
 <button
 onClick={togglePlayPause}
 className="w-10 h-10 rounded-full bg-[var(--surface)] hover:bg-[var(--surface)] text-black font-bold flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
 title={isPlaying ?"Pausar" :"Reproducir Canción"}
 >
 {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
 </button>

 {/* Next Song */}
 <button
 onClick={() => handleNext(false)}
 className="p-1 text-[#b3b3b3] hover:text-[var(--ink)] transition-all cursor-pointer active:scale-90"
 title="Siguiente Canción"
 >
 <SkipForward className="w-5 h-5 fill-current" />
 </button>

 {/* Crossfade Toggle — fundido real de 5s al pasar al siguiente tema de la cola */}
 <button
 onClick={() => setCrossfadeEnabled(!crossfadeEnabled)}
 className={`p-1.5 rounded-full transition-all cursor-pointer text-sm ${
 crossfadeEnabled
 ?'text-sky-400 bg-sky-400/10'
 :'text-[#b3b3b3] hover:text-[var(--ink)]'
 }`}
 title={crossfadeEnabled ?"Fundido entre temas activado (5s)" :"Activar fundido entre temas (5s)"}
 >
 🔀
 </button>

 {/* Speed multiplier selector */}
 <select
 value={playbackRate}
 onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
 className="bg-[var(--surface)] text-[var(--ok)] text-[10px] font-mono rounded px-1.5 py-1 cursor-pointer hover:bg-zinc-700 focus:outline-none border-[var(--hair)]"
 title="Velocidad de Reproducción"
 >
 <option value={0.5}>0.5x</option>
 <option value={0.75}>0.75x</option>
 <option value={1.0}>1.0x</option>
 <option value={1.25}>1.25x</option>
 <option value={1.5}>1.5x</option>
 </select>

 {/* Pitch Transpose selector (Spotify Pedalboard DSP) */}
 <select
 value={transposeSemitones}
 onChange={(e) => setTransposeSemitones(parseInt(e.target.value, 10))}
 className={`bg-[var(--surface)] text-[10px] font-mono rounded px-1.5 py-1 cursor-pointer hover:bg-zinc-700 focus:outline-none border-[var(--hair)] ${
 transposeSemitones !== 0 ?'text-[#ff6b9d] font-bold border-[#ff6b9d]/30' :'text-[#b3b3b3]'
 }`}
 title="Trasposición de Tono (Nativa en tiempo real Web Audio)"
 >
 {[6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6].map((st) => {
 const origKey = song?.tonalidad?.trim();
 let label = st > 0 ? `+${st} st` : st < 0 ? `${st} st` :'0 (Original)';
 if (origKey) {
 const targetKey = transposeChordToken(origKey, st,'EN');
 label = st === 0 ? `${origKey} (Original)` : `${targetKey} (${st > 0 ? `+${st}` : st} st)`;
 }
 return (
 <option key={st} value={st}>
 {label}
 </option>
 );
 })}
 </select>
 </div>

 {/* Timeline Slider */}
 <div className="w-full flex items-center gap-2 text-[11px] font-mono text-[#b3b3b3]">
 <span className="w-9 text-right shrink-0">{formatSecs(currentTime)}</span>

 <div className="relative flex-1 flex items-center">
 <input
 type="range"
 min={0}
 max={duration || 210}
 step={0.5}
 value={currentTime}
 onChange={(e) => handleSeek(parseFloat(e.target.value))}
 className="w-full h-1 bg-[#4d4d4d] rounded-[var(--r-s)] appearance-none cursor-pointer accent-[var(--ok)] hover:accent-[var(--ok)] focus:outline-none"
 />
 </div>

 <span className="w-9 text-left shrink-0">{formatSecs(duration)}</span>
 </div>
 </div>

 {/* Right: Actions & Volume */}
 <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">

 {/* Chords link if available */}
 {song.enlaceAcordes && (
 <a
 href={song.enlaceAcordes}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[#b3b3b3] hover:text-[var(--ink)] text-xs font-mono flex items-center gap-1 transition-all cursor-pointer"
 title="Ver Acordes / Partitura"
 >
 <FileText className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span className="hidden lg:inline text-[11px]">Acordes</span>
 </a>
 )}

 {/* Studio / Arreglos Button */}
 <button
 onClick={() => onOpenStudio(song)}
 className="px-3 py-1.5 rounded-full bg-[var(--surface)]/15 hover:bg-[var(--surface)]/25 text-[var(--ok)] border-[var(--hair)]/30 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
 title="Abrir Estudio de Arreglos e Ideas"
 >
 <Sliders className="w-3.5 h-3.5" />
 <span className="text-[11px]">Estudio</span>
 </button>

 {/* Iris Stem Separator Button */}
 <button
 onClick={() => onOpenIris ? onOpenIris(song) : onOpenStudio(song)}
 className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-[var(--acc)]/70 font-bold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
 title="Procesar y separar voces e instrumentos con Iris (IA Stems)"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] animate-pulse" />
 <span className="hidden sm:inline text-[11px]">Iris</span>
 </button>

 {/* Volume */}
 <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[var(--hair)]">
 <button
 onClick={() => setIsMuted(!isMuted)}
 className="text-[#b3b3b3] hover:text-[var(--ink)] p-1"
 >
 {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
 </button>
 <input
 type="range"
 min={0}
 max={1}
 step={0.05}
 value={isMuted ? 0 : volume}
 onChange={(e) => {
 setVolume(parseFloat(e.target.value));
 setIsMuted(false);
 }}
 className="w-16 h-1 bg-[#4d4d4d] rounded-[var(--r-s)] appearance-none cursor-pointer accent-[var(--ok)]"
 />
 </div>

 {/* Close Player */}
 <button
 onClick={onClosePlayer}
 className="p-1.5 text-zinc-500 hover:text-[var(--ink)] transition-all ml-1"
 title="Cerrar Reproductor"
 >
 <X className="w-4 h-4" />
 </button>

 </div>

 </div>
 )}
 </div>
 </div>
 );
}

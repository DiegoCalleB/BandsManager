import React, { useState, useEffect, useRef, useMemo, useCallback } from'react';
import { X, Play, Pause, Headphones, GraduationCap, RotateCcw, Repeat, Download, Volume2, Gauge, Music2, Loader2, CheckCircle2, Scale, ArrowUpDown, Timer, Target, Sliders } from'lucide-react';
import { Song, SongAudioIdea, AudioTrack, User, SongSubstituteGuide } from'../types';
import { resolveAudioUrl } from'../utils/audioStorage';
import { exportMasterMixAudioBlob, MasterMixTrackInput, computeAutoBalanceVolumes } from'../utils/audioLatency';
import { matchInstrumentToStemCategory } from'../config/stemInstruments';
import { apiFetch } from'../utils/api';
import { useTonePitchShift } from'../hooks/useTonePitchShift';
import { transposeChordToken } from'../utils/chordUtils';

const TRANSPOSE_SEMITONE_OPTIONS = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];

/** Puente invisible: aplica trasposición de tono en tiempo real a UNA pista de audio, reutilizando
 * el mismo hook (Tone.js) que ya usa la barra de reproducción global. Practice Mode suena varias
 * pistas a la vez, y los hooks no se pueden llamar dentro de un .map(), así que cada pista tiene
 * su propia instancia de este componente — se queda montado siempre (aunque semitones sea 0) para
 * no desconectar el audio de la pista a media sesión (ver comentario en TrackPitchShiftBridges). */
function TrackPitchShiftBridge({ audioElement, semitones }: { audioElement: HTMLAudioElement | null; semitones: number }) {
 useTonePitchShift({ audioElement, semitones });
 return null;
}

function scheduleMetronomeClick(ctx: AudioContext, time: number, accent: boolean) {
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 osc.frequency.value = accent ? 1500 : 1000;
 gain.gain.setValueAtTime(0.0001, time);
 gain.gain.exponentialRampToValueAtTime(accent ? 0.9 : 0.6, time + 0.005);
 gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
 osc.connect(gain);
 gain.connect(ctx.destination);
 osc.start(time);
 osc.stop(time + 0.06);
}

/**
 * Sala de ensayo individual: mezcla 100% local (nunca toca `song`/onUpdateSong) para que
 * cada miembro practique con velocidad, bucle y volúmenes propios sin pisar lo que ven los
 * demás en el mezclador compartido. Se guarda solo en localStorage, por usuario + canción + idea.
 */

interface TrackOverride {
 volumen?: number;
 muted?: boolean;
 solo?: boolean;
}

interface TrackChordsResult {
 cifradoTexto: string;
 guiaSustituto?: SongSubstituteGuide;
 chordsSource:'audio_real' |'ia_sin_audio' |'plantilla_generica';
 esAproximado: boolean;
}

interface PracticeModePanelProps {
 song: Song;
 idea: SongAudioIdea;
 tracks: AudioTrack[];
 currentUser?: User;
 isStitchLight?: boolean;
 onClose: () => void;
 /** Permite abrir el Modo Studio multipista completo de este tema */
 onOpenStudio?: () => void;
 /** Si se define, se ofrece un botón para sustituir el cifrado principal de la canción por el de esta pista aislada. */
 onApplyAsMainChords?: (cifradoTexto: string, guiaSustituto?: SongSubstituteGuide) => void;
}

function buildStorageKey(song: Song, idea: SongAudioIdea, currentUser?: User): string {
 const who = currentUser?.username || currentUser?.id || currentUser?.name ||'anon';
 return `practiceMix:${song.band_id ||'sinbanda'}:${song.id}:${idea.id}:${who}`;
}

function formatTime(totalSeconds: number): string {
 if (!isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
 const m = Math.floor(totalSeconds / 60);
 const s = Math.floor(totalSeconds % 60);
 return `${m}:${String(s).padStart(2,'0')}`;
}

export default function PracticeModePanel({ song, idea, tracks, currentUser, isStitchLight, onClose, onOpenStudio, onApplyAsMainChords }: PracticeModePanelProps) {
 const storageKey = useMemo(() => buildStorageKey(song, idea, currentUser), [song, idea, currentUser]);

 const [overrides, setOverrides] = useState<Record<string, TrackOverride>>({});
 const [speed, setSpeed] = useState(1);
 const [loopA, setLoopA] = useState<number | null>(null);
 const [loopB, setLoopB] = useState<number | null>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [isExporting, setIsExporting] = useState<string | null>(null);
 const [exportError, setExportError] = useState<string | null>(null);
 const [isAutoBalancing, setIsAutoBalancing] = useState(false);
 const [semitonesOffset, setSemitonesOffset] = useState(0);
 const [metronomeOn, setMetronomeOn] = useState(false);
 // Instante (en segundos, tiempo"real" de la canción, no afectado por `speed`) del primer golpe de
 // compás marcado a mano — permite alinear la claqueta con canciones que no empiezan justo en el
 // beat 1 (intro, silencio, cuenta suelta). 0 = sin marcar, se asume que el compás cae en el segundo 0.
 const [beatAnchorSec, setBeatAnchorSec] = useState(0);
 // Se incrementa cada vez que ensureAudioLoaded crea elementos <audio> nuevos, para forzar un
 // re-render y que los puentes de trasposición (TrackPitchShiftBridge) reciban el elemento real
 // en vez del null inicial — audioRefs es un ref, mutarlo no dispara render por sí solo.
 const [, setAudioReadyTick] = useState(0);

 const metronomeCtxRef = useRef<AudioContext | null>(null);
 const metronomeTimerRef = useRef<number | null>(null);
 const metronomeNextClickTimeRef = useRef<number>(0);
 const metronomeBeatCounterRef = useRef<number>(0);

 const [chordsByTrack, setChordsByTrack] = useState<Record<string, TrackChordsResult>>({});
 const [loadingChordsTrackId, setLoadingChordsTrackId] = useState<string | null>(null);
 const [chordsErrorByTrack, setChordsErrorByTrack] = useState<Record<string, string>>({});
 const [expandedChordsTrackId, setExpandedChordsTrackId] = useState<string | null>(null);

 const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

 const myCategory = useMemo(() => matchInstrumentToStemCategory(currentUser?.instrument), [currentUser?.instrument]);
 const myTrack = useMemo(() => tracks.find(t => t.instrumento === myCategory) || null, [tracks, myCategory]);

 const beatAnchorStorageKey = useMemo(() => `${storageKey}:beatAnchor`, [storageKey]);

 // Cargar la mezcla personal guardada de este usuario para esta idea concreta
 useEffect(() => {
 try {
 const raw = localStorage.getItem(storageKey);
 setOverrides(raw ? JSON.parse(raw) : {});
 } catch {
 setOverrides({});
 }
 try {
 const rawAnchor = localStorage.getItem(beatAnchorStorageKey);
 setBeatAnchorSec(rawAnchor ? Number(rawAnchor) || 0 : 0);
 } catch {
 setBeatAnchorSec(0);
 }
 setLoopA(null);
 setLoopB(null);
 setSpeed(1);
 setSemitonesOffset(0);
 setMetronomeOn(false);
 }, [storageKey, beatAnchorStorageKey]);

 // Persistir la mezcla personal (solo en este dispositivo, nunca en el documento de la canción)
 useEffect(() => {
 try {
 if (Object.keys(overrides).length > 0) {
 localStorage.setItem(storageKey, JSON.stringify(overrides));
 } else {
 localStorage.removeItem(storageKey);
 }
 } catch {}
 }, [storageKey, overrides]);

 // Persistir el compás marcado (por dispositivo, igual que el resto de ajustes de práctica)
 useEffect(() => {
 try {
 if (beatAnchorSec > 0) {
 localStorage.setItem(beatAnchorStorageKey, String(beatAnchorSec));
 } else {
 localStorage.removeItem(beatAnchorStorageKey);
 }
 } catch {}
 }, [beatAnchorStorageKey, beatAnchorSec]);

 const getEffective = useCallback((tr: AudioTrack): AudioTrack => {
 const ov = overrides[tr.id];
 return ov ? { ...tr, ...ov } : tr;
 }, [overrides]);

 const hasSolo = useMemo(() => tracks.some(t => getEffective(t).solo), [tracks, getEffective]);

 const applyDsp = useCallback((tr: AudioTrack) => {
 const el = audioRefs.current[tr.id];
 if (!el) return;
 const eff = getEffective(tr);
 const audible = (hasSolo ? !!eff.solo : true) && !eff.muted;
 el.volume = audible ? Math.max(0, Math.min(1, eff.volumen ?? 1)) : 0;
 el.muted = !audible;
 }, [getEffective, hasSolo]);

 useEffect(() => {
 tracks.forEach(applyDsp);
 }, [tracks, applyDsp]);

 const setOverride = (trackId: string, patch: TrackOverride) => {
 setOverrides(prev => ({ ...prev, [trackId]: { ...prev[trackId], ...patch } }));
 };

 const toggleMute = (trackId: string) => {
 const isMuted = overrides[trackId]?.muted ?? false;
 setOverride(trackId, { muted: !isMuted });
 };

 const toggleSolo = (trackId: string) => {
 const isSolo = overrides[trackId]?.solo ?? false;
 if (isSolo) {
 setOverride(trackId, { solo: false });
 return;
 }
 // Solo exclusivo, estilo Cubase: activar este desactiva el resto.
 setOverrides(prev => {
 const next: Record<string, TrackOverride> = {};
 for (const t of tracks) next[t.id] = { ...prev[t.id], solo: t.id === trackId };
 return next;
 });
 };

 const setTrackVolume = (trackId: string, vol: number) => setOverride(trackId, { volumen: vol });

 const resetOverrides = () => setOverrides({});

 // Analiza el volumen real (RMS) de cada pista y nivela los faders de"Mi mezcla" para que
 // ningún instrumento se pierda bajo otro más fuerte. Solo afecta a tu mezcla local: nunca toca
 // song/onUpdateSong, así que es 100% seguro repetirlo o deshacerlo con"Restablecer".
 const handleAutoBalance = async () => {
 setIsAutoBalancing(true);
 try {
 const volumes = await computeAutoBalanceVolumes(
 tracks.map(t => ({ id: t.id, audioUrl: t.audioUrl })),
 resolveAudioUrl
 );
 setOverrides(prev => {
 const next = { ...prev };
 for (const [trackId, volumen] of Object.entries(volumes)) {
 next[trackId] = { ...next[trackId], volumen };
 }
 return next;
 });
 } catch (err) {
 console.warn('[Practice Mode] Auto-Balance falló:', err);
 } finally {
 setIsAutoBalancing(false);
 }
 };

 const applyPresetPracticeWithBand = () => {
 if (!myTrack) return;
 const next: Record<string, TrackOverride> = {};
 for (const t of tracks) next[t.id] = { muted: t.id === myTrack.id, solo: false };
 setOverrides(next);
 };

 const applyPresetLearnMyPart = () => {
 if (!myTrack) return;
 const next: Record<string, TrackOverride> = {};
 for (const t of tracks) next[t.id] = { solo: t.id === myTrack.id, muted: false };
 setOverrides(next);
 };

 const ensureAudioLoaded = useCallback(async () => {
 let createdAny = false;
 for (const tr of tracks) {
 let el = audioRefs.current[tr.id];
 if (!el) {
 el = new Audio();
 el.preload ='auto';
 // Hay que fijar esto ANTES de asignar el .src: si se hace después (como hace, a la fuerza,
 // useTonePitchShift la primera vez que activas la trasposición), el navegador ya ha
 // empezado a pedir el audio sin modo CORS y createMediaElementSource() se queda mudo para
 // esa pista el resto de la sesión, sin lanzar ningún error visible.
 el.crossOrigin ='anonymous';
 audioRefs.current[tr.id] = el;
 createdAny = true;
 }
 if (!el.src || el.src ==='' || el.src.endsWith('undefined')) {
 try {
 const resolved = await resolveAudioUrl(tr.audioUrl);
 el.src = resolved || tr.audioUrl;
 } catch {
 el.src = tr.audioUrl;
 }
 }
 }
 if (createdAny) setAudioReadyTick(t => t + 1);
 }, [tracks]);

 // Recalcula en qué instante exacto (reloj de AudioContext) debería sonar el próximo clic del
 // metrónomo para que coincida con `atTime` de la reproducción — se llama al arrancar, al cambiar
 // de velocidad/BPM y en cada salto (seek, bucle A/B) para que nunca se desincronice.
 const resyncMetronomeAt = useCallback((atTime: number, anchorOverride?: number) => {
 if (!metronomeCtxRef.current) {
 metronomeCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
 }
 const ctx = metronomeCtxRef.current;
 if (ctx.state ==='suspended') ctx.resume().catch(() => {});
 const anchor = anchorOverride ?? beatAnchorSec;
 const secPerBeat = 60 / (song.bpm || 120) / speed;
 const relativeTime = atTime - anchor;
 const nextBeatIndex = Math.ceil(relativeTime / secPerBeat);
 metronomeBeatCounterRef.current = nextBeatIndex;
 metronomeNextClickTimeRef.current = ctx.currentTime + (anchor + nextBeatIndex * secPerBeat - atTime);
 }, [song.bpm, speed, beatAnchorSec]);

 // Marca el instante actual como el primer golpe de compás — la claqueta reajusta su rejilla
 // para que ese punto (y cada `secPerBeat` desde ahí, hacia delante y hacia atrás) sea un beat.
 const markBeatAnchor = useCallback(() => {
 const t = currentTime;
 setBeatAnchorSec(t);
 if (metronomeOn && isPlaying) {
 resyncMetronomeAt(t, t);
 }
 }, [currentTime, metronomeOn, isPlaying, resyncMetronomeAt]);

 const metronomeSchedulerTick = useCallback(() => {
 const ctx = metronomeCtxRef.current;
 if (!ctx) return;
 const secPerBeat = 60 / (song.bpm || 120) / speed;
 const lookaheadSec = 0.1;
 while (metronomeNextClickTimeRef.current < ctx.currentTime + lookaheadSec) {
 const accent = metronomeBeatCounterRef.current % 4 === 0;
 scheduleMetronomeClick(ctx, metronomeNextClickTimeRef.current, accent);
 metronomeNextClickTimeRef.current += secPerBeat;
 metronomeBeatCounterRef.current += 1;
 }
 }, [song.bpm, speed]);

 // Arranca/para el metrónomo y lo re-sincroniza cada vez que cambian play/pausa, la velocidad de
 // práctica o el BPM de la canción (un seek suelto lo gestiona seekAll, más abajo, sin reiniciar
 // el intervalo entero).
 useEffect(() => {
 if (metronomeOn && isPlaying) {
 resyncMetronomeAt(currentTime);
 if (metronomeTimerRef.current) window.clearInterval(metronomeTimerRef.current);
 metronomeTimerRef.current = window.setInterval(metronomeSchedulerTick, 25);
 } else if (metronomeTimerRef.current) {
 window.clearInterval(metronomeTimerRef.current);
 metronomeTimerRef.current = null;
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [metronomeOn, isPlaying, speed, song.bpm]);

 const effectiveSemitones = useMemo(() => {
 if (semitonesOffset === 0) return 0;
 // La velocidad de práctica ya cambia el tono de forma natural (playbackRate). Compensamos ese
 // desvío para que"+2 semitonos" siga significando"+2 respecto al tono ORIGINAL" sin importar
 // a qué velocidad estés ensayando.
 return semitonesOffset - 12 * Math.log2(speed);
 }, [semitonesOffset, speed]);

 // Carga inicial + limpieza total al cambiar de idea o desmontar
 useEffect(() => {
 ensureAudioLoaded();
 return () => {
 Object.values(audioRefs.current).forEach(el => { if (el) { el.pause(); el.src =''; } });
 audioRefs.current = {};
 if (metronomeTimerRef.current) {
 window.clearInterval(metronomeTimerRef.current);
 metronomeTimerRef.current = null;
 }
 };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [idea.id]);

 const seekAll = useCallback((time: number) => {
 const clamped = Math.max(0, time);
 Object.values(audioRefs.current).forEach(el => {
 if (el) { try { el.currentTime = clamped; } catch {} }
 });
 setCurrentTime(clamped);
 if (metronomeOn && isPlaying) {
 resyncMetronomeAt(clamped);
 }
 }, [metronomeOn, isPlaying, resyncMetronomeAt]);

 // La primera pista actúa de"líder" de tiempo: de ahí sale el playhead y el chequeo de loop.
 useEffect(() => {
 const leaderId = tracks[0]?.id;
 const el = leaderId ? audioRefs.current[leaderId] : null;
 if (!el) return;

 const onTimeUpdate = () => {
 setCurrentTime(el.currentTime);
 if (loopB != null && el.currentTime >= loopB) {
 seekAll(loopA ?? 0);
 }
 };
 const onLoadedMeta = () => setDuration(el.duration || 0);
 const onEnded = () => setIsPlaying(false);

 el.addEventListener('timeupdate', onTimeUpdate);
 el.addEventListener('loadedmetadata', onLoadedMeta);
 el.addEventListener('ended', onEnded);
 return () => {
 el.removeEventListener('timeupdate', onTimeUpdate);
 el.removeEventListener('loadedmetadata', onLoadedMeta);
 el.removeEventListener('ended', onEnded);
 };
 }, [tracks, loopA, loopB, seekAll]);

 const togglePlay = async () => {
 await ensureAudioLoaded();
 const players = tracks.map(t => audioRefs.current[t.id]).filter(Boolean) as HTMLAudioElement[];
 if (isPlaying) {
 players.forEach(el => el.pause());
 setIsPlaying(false);
 return;
 }
 tracks.forEach(applyDsp);
 players.forEach(el => { el.playbackRate = speed; });
 await Promise.all(players.map(el => el.play().catch(() => {})));
 setIsPlaying(true);
 };

 const changeSpeed = (val: number) => {
 setSpeed(val);
 Object.values(audioRefs.current).forEach(el => { if (el) el.playbackRate = val; });
 };

 // El BPM real de la canción (detectado por Iris o puesto a mano) como referencia — el ratio de
 // velocidad (playbackRate) es lo único que el audio entiende de verdad, pero un músico piensa
 // en BPM, no en porcentajes, así que el control se expresa siempre en BPM y por debajo se
 // traduce al ratio que necesita el elemento <audio>.
 const baseBpm = song.bpm && song.bpm > 0 ? song.bpm : 120;
 const targetBpm = Math.round(baseBpm * speed);
 const nudgeBpm = (delta: number) => {
 const minBpm = Math.round(baseBpm * 0.4);
 const maxBpm = Math.round(baseBpm * 1.6);
 const newBpm = Math.max(minBpm, Math.min(maxBpm, targetBpm + delta));
 changeSpeed(newBpm / baseBpm);
 };

 const handleSeekBarChange = (val: number) => {
 seekAll(val);
 };

 const markLoopA = () => setLoopA(currentTime);
 const markLoopB = () => setLoopB(currentTime);
 const clearLoop = () => { setLoopA(null); setLoopB(null); };

 const handleExport = async (mode:'sin-mi-pista' |'solo-mi-pista' |'mezcla-actual') => {
 setExportError(null);
 setIsExporting(mode);
 try {
 const inputs: MasterMixTrackInput[] = tracks.map(t => {
 const eff = getEffective(t);
 let muted = hasSolo ? !eff.solo : !!eff.muted;
 if (mode ==='sin-mi-pista' && myTrack) muted = muted || t.id === myTrack.id;
 if (mode ==='solo-mi-pista' && myTrack) muted = t.id !== myTrack.id;
 return {
 audioUrl: t.audioUrl,
 volumen: eff.volumen,
 muted,
 pan: t.pan,
 desfaseMs: t.desfaseMs,
 eqLow: t.eqLow,
 eqMid: t.eqMid,
 eqHigh: t.eqHigh
 };
 });
 const blob = await exportMasterMixAudioBlob(inputs, resolveAudioUrl);
 const url = URL.createObjectURL(blob);
 const suffix = mode ==='sin-mi-pista' ?'sin_mi_pista' : mode ==='solo-mi-pista' ?'solo_mi_pista' :'mezcla_ensayo';
 const a = document.createElement('a');
 a.href = url;
 a.download = `${song.titulo}_${idea.titulo}_${suffix}.wav`.replace(/[^a-zA-Z0-9_\-.]/g,'_');
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
 } catch (err: any) {
 setExportError(err?.message ||'No se pudo exportar la mezcla.');
 } finally {
 setIsExporting(null);
 }
 };

 const handleAnalyzeTrackChords = async (tr: AudioTrack) => {
 if (loadingChordsTrackId) return;
 setLoadingChordsTrackId(tr.id);
 setChordsErrorByTrack(prev => ({ ...prev, [tr.id]:'' }));
 setExpandedChordsTrackId(tr.id);
 try {
 // Sin songId a propósito: así el servidor NUNCA sobreescribe el cifrado principal de la
 // canción con el análisis de una pista aislada (bajo, guitarra...) — queda solo en este
 // panel hasta que el usuario decida explícitamente aplicarlo con onApplyAsMainChords.
 const data = await apiFetch('/api/generate-song-chords', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 titulo: `${song.titulo} — pista aislada: ${tr.nombre}`,
 artista: undefined,
 tonalidad: song.tonalidad,
 bpm: song.bpm,
 audioUrl: tr.audioUrl
 })
 });
 setChordsByTrack(prev => ({
 ...prev,
 [tr.id]: {
 cifradoTexto: data.cifradoTexto,
 guiaSustituto: data.guiaSustituto,
 chordsSource: data.chordsSource,
 esAproximado: !!data.esAproximado
 }
 }));
 } catch (err: any) {
 setChordsErrorByTrack(prev => ({ ...prev, [tr.id]: err?.message ||'No se pudieron detectar los acordes de esta pista.' }));
 } finally {
 setLoadingChordsTrackId(null);
 }
 };

 const chordsSourceLabel = (source: TrackChordsResult['chordsSource']) => {
 if (source ==='audio_real') return { text:'🎧 Transcrito escuchando esta pista real', tone:'text-[var(--ok)]' };
 if (source ==='ia_sin_audio') return { text:'🤖 Propuesta de IA sin poder escuchar el audio', tone:'text-[var(--acc)]' };
 return { text:'📐 Plantilla genérica (sin IA disponible)', tone:'text-[var(--ink-2)]' };
 };

 const panelBg = isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]';
 const cardBg = isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60 /80';

 return (
 <>
 {/* Puentes de trasposición: uno por pista, siempre montados (ver comentario en
 TrackPitchShiftBridge más arriba — desmontarlos a mitad de sesión dejaría esa pista muda). */}
 {tracks.map(tr => (
 <TrackPitchShiftBridge key={tr.id} audioElement={audioRefs.current[tr.id] || null} semitones={effectiveSemitones} />
 ))}
 <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[var(--scrim)]/80
 <div className={`w-full max-w-2xl rounded-[var(--r-l)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${panelBg}`}>
 {/* Header */}
 <div className={`px-5 py-4 flex items-center justify-between border-b ${isStitchLight ?' bg-[var(--bg)]' :' bg-[var(--surface)]/60'}`}>
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ok)] flex items-center justify-center shrink-0">
 <Headphones className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <h3 className="font-bold font-display tracking-wider text-sm truncate">Sala de Ensayo Individual</h3>
 <p className="text-[11px] text-[var(--ink-2)] truncate">{song.titulo} · {idea.titulo}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {onOpenStudio && (
 <button
 type="button"
 onClick={onOpenStudio}
 className="px-2.5 py-1.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] border-[var(--acc)]/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
 title="Abrir Studio multipista completo de este tema"
 >
 <Sliders className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Modo Studio</span>
 </button>
 )}
 <button onClick={onClose} className="p-2 rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] shrink-0 cursor-pointer">
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="overflow-y-auto p-5 space-y-4">
 {/* Aviso: qué instrumento detectó / instrucción si no hay ninguno */}
 {myTrack ? (
 <div className="text-xs px-3 py-2 rounded-[var(--r-s)] bg-[var(--ok)]/10 text-[var(--ink-2)]">
 Tu instrumento (<strong>{currentUser?.instrument}</strong>) coincide con la pista <strong>{myTrack.nombre}</strong>.
 </div>
 ) : (
 <div className="text-xs px-3 py-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc)]/70">
 No hemos podido identificar tu pista. Pídele a quien administra la banda que te asigne un instrumento (Voz, Batería, Bajo, Guitarras, Teclados o Arreglos) en Gestión de Miembros — mientras tanto puedes usar la mezcla manual de abajo.
 </div>
 )}

 {/* Presets */}
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={applyPresetPracticeWithBand}
 disabled={!myTrack}
 className="flex flex-col items-center gap-1 px-3 py-3 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--ink-3)] hover:bg-[var(--acc)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
 >
 <Headphones className="w-4 h-4" />
 <span className="text-[11px] font-sans font-semibold text-center">Tocar con la banda<br />(silencia mi pista)</span>
 </button>
 <button
 onClick={applyPresetLearnMyPart}
 disabled={!myTrack}
 className="flex flex-col items-center gap-1 px-3 py-3 rounded-[var(--r-m)] bg-[var(--tentative)]/10 text-[var(--acc)]/50 hover:bg-[var(--tentative)]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
 >
 <GraduationCap className="w-4 h-4" />
 <span className="text-[11px] font-sans font-semibold text-center">Aprender mi parte<br />(aísla mi pista)</span>
 </button>
 </div>

 {/* Transporte + velocidad + loop */}
 <div className={`rounded-[var(--r-m)] p-3 space-y-3 ${cardBg}`}>
 <div className="flex items-center gap-3">
 <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-[var(--ok)] text-[var(--ink)] flex items-center justify-center shrink-0 hover:bg-[var(--ok)]">
 {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
 </button>
 <span className="text-[11px] font-sans text-[var(--ink-2)] w-10 text-right">{formatTime(currentTime)}</span>
 <input
 type="range"
 min={0}
 max={Math.max(duration, 0.1)}
 step={0.1}
 value={Math.min(currentTime, duration)}
 onChange={(e) => handleSeekBarChange(Number(e.target.value))}
 className="flex-1 accent-emerald-500"
 />
 <span className="text-[11px] font-sans text-[var(--ink-2)] w-10">{formatTime(duration)}</span>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <div className="flex items-center gap-1">
 <Gauge className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span className="text-[10px] font-sans text-[var(--ink-2)] mr-0.5">Tempo</span>
 <button
 onClick={() => nudgeBpm(-5)}
 title="-5 BPM"
 className="text-[10px] font-sans px-1.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]"
 >-5</button>
 <button
 onClick={() => nudgeBpm(-1)}
 title="-1 BPM"
 className="text-[10px] font-sans px-1.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]"
 >-1</button>
 <span className={`text-xs font-sans font-bold w-16 text-center px-1 py-1 rounded-[var(--r-s)] ${speed !== 1 ?'text-[var(--acc)]/70' :'text-[var(--ink-2)]'}`}>
 {targetBpm} BPM
 </span>
 <button
 onClick={() => nudgeBpm(1)}
 title="+1 BPM"
 className="text-[10px] font-sans px-1.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]"
 >+1</button>
 <button
 onClick={() => nudgeBpm(5)}
 title="+5 BPM"
 className="text-[10px] font-sans px-1.5 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]"
 >+5</button>
 {speed !== 1 && (
 <button
 onClick={() => changeSpeed(1)}
 title={`Volver al tempo original (${baseBpm} BPM)`}
 className="text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]"
 >
 ↺ {baseBpm}
 </button>
 )}
 </div>

 <div className="flex items-center gap-1.5">
 <Repeat className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span className="text-[10px] font-sans text-[var(--ink-2)]">Bucle</span>
 <button onClick={markLoopA} className="text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]">
 A {loopA != null ? formatTime(loopA) :'--:--'}
 </button>
 <button onClick={markLoopB} className="text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)]">
 B {loopB != null ? formatTime(loopB) :'--:--'}
 </button>
 {(loopA != null || loopB != null) && (
 <button onClick={clearLoop} className="text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]">
 Quitar
 </button>
 )}
 </div>

 <div className="flex items-center gap-1.5">
 <ArrowUpDown className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span className="text-[10px] font-sans text-[var(--ink-2)]">Tono</span>
 <select
 value={semitonesOffset}
 onChange={(e) => setSemitonesOffset(Number(e.target.value))}
 title="Trasposición de tono en tiempo real — útil para ensayar en el tono acordado para un bolo concreto"
 className={`text-xs font-sans rounded-[var(--r-s)] px-2 py-1 outline-none ${isStitchLight ?'bg-[var(--surface)]' :'bg-[var(--surface)]'} ${semitonesOffset !== 0 ?'text-[var(--ink-2)] font-bold' :''}`}
 >
 {TRANSPOSE_SEMITONE_OPTIONS.map(st => {
 const origKey = song.tonalidad?.trim();
 let label = st > 0 ? `+${st} st` : st < 0 ? `${st} st` :'0 (Original)';
 if (origKey) {
 const notation = /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(origKey) ?'ES' :'EN';
 const targetKey = transposeChordToken(origKey, st, notation);
 label = st === 0 ? `${origKey} (Original)` : `${targetKey} (${st > 0 ? `+${st}` : st} st)`;
 }
 return <option key={st} value={st}>{label}</option>;
 })}
 </select>
 </div>

 <div className="flex items-center gap-1.5">
 <button
 onClick={() => setMetronomeOn(v => !v)}
 title={`Metrónomo (claqueta) — sigue el tempo de arriba, sube y baja a la vez con la canción. Ahora mismo: ${targetBpm} BPM`}
 className={`flex items-center gap-1 text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] ${
 metronomeOn
 ?'bg-[var(--acc)]/20 /40 text-[var(--acc)]/70'
 :'bg-[var(--surface)]/80 border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Timer className="w-3.5 h-3.5" /> {targetBpm} BPM
 </button>
 <button
 onClick={markBeatAnchor}
 title="Marcar beat de compás — ponte en el primer golpe fuerte del compás (en cualquier punto de la canción) y pulsa aquí: la claqueta recalcula toda su rejilla a partir de ese instante"
 className={`flex items-center gap-1 text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] ${
 beatAnchorSec > 0
 ?'bg-[var(--ok)]/20 border-[var(--ok)]/40 text-[var(--ink-2)]'
 :'bg-[var(--surface)]/80 border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <Target className="w-3.5 h-3.5" /> {beatAnchorSec > 0 ? `Compás ${formatTime(beatAnchorSec)}` :'Marcar beat de compás'}
 </button>
 {beatAnchorSec > 0 && (
 <button
 onClick={() => {
 setBeatAnchorSec(0);
 if (metronomeOn && isPlaying) resyncMetronomeAt(currentTime, 0);
 }}
 title="Quitar el compás marcado (volver a asumir que empieza en 0:00)"
 className="text-[10px] font-sans px-1.5 py-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]"
 >
 ✕
 </button>
 )}
 </div>
 </div>

 <div className="flex items-center gap-2 px-0.5">
 <span className="text-[10px] font-sans text-[var(--ink-2)] w-10 text-right">{Math.round(baseBpm * 0.4)}</span>
 <input
 type="range"
 min={Math.round(baseBpm * 0.4)}
 max={Math.round(baseBpm * 1.6)}
 step={1}
 value={targetBpm}
 onChange={(e) => changeSpeed(Number(e.target.value) / baseBpm)}
 title="Ajuste fino de tempo — arrastra para cualquier BPM exacto"
 className="flex-1 accent-amber-500"
 />
 <span className="text-[10px] font-sans text-[var(--ink-2)] w-10">{Math.round(baseBpm * 1.6)}</span>
 </div>
 </div>

 {/* Mezcla manual por pista */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-sans font-semibold text-[var(--ink-2)]">Mi mezcla (solo la ves tú)</span>
 <div className="flex items-center gap-3">
 <button
 onClick={handleAutoBalance}
 disabled={isAutoBalancing}
 title="Analiza el volumen real de cada pista y nivela los faders automáticamente"
 className="flex items-center gap-1 text-[10px] font-sans text-[var(--ink-2)] hover:text-[var(--ink-3)] disabled:opacity-50"
 >
 {isAutoBalancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scale className="w-3 h-3" />}
 {isAutoBalancing ?'Analizando...' :'Auto-Balance'}
 </button>
 <button onClick={resetOverrides} className="flex items-center gap-1 text-[10px] font-sans text-[var(--ink-2)] hover:text-[var(--ink)]">
 <RotateCcw className="w-3 h-3" /> Restablecer
 </button>
 </div>
 </div>
 {tracks.map(tr => {
 const eff = getEffective(tr);
 const isMine = myTrack?.id === tr.id;
 const chords = chordsByTrack[tr.id];
 const chordsErr = chordsErrorByTrack[tr.id];
 const isLoadingThis = loadingChordsTrackId === tr.id;
 const isExpanded = expandedChordsTrackId === tr.id;
 return (
 <div key={tr.id} className={`rounded-[var(--r-m)] ${cardBg} ${isMine ?'border-[var(--ok)]/40' :''}`}>
 <div className="flex items-center gap-2 px-3 py-2">
 <span className="text-xs font-semibold truncate flex-1 min-w-0">
 {tr.nombre}
 {isMine && <span className="ml-1.5 text-[9px] font-sans px-1.5 py-0.5 rounded bg-[var(--ok)]/15 text-[var(--ok)]">TÚ</span>}
 </span>
 <button
 onClick={() => toggleMute(tr.id)}
 title="Silenciar (solo en mi mezcla)"
 className={`w-6 h-6 rounded text-[10px] font-sans font-bold ${eff.muted ?'bg-[var(--alert)]/80 text-[var(--ink)]' :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
 >
 M
 </button>
 <button
 onClick={() => toggleSolo(tr.id)}
 title="Solo (aislar, solo en mi mezcla)"
 className={`w-6 h-6 rounded text-[10px] font-sans font-bold ${eff.solo ?'bg-[var(--acc)]/60 text-[var(--on-acc)]' :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'}`}
 >
 S
 </button>
 <Volume2 className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
 <input
 type="range"
 min={0}
 max={1}
 step={0.05}
 value={eff.volumen ?? 1}
 onChange={(e) => setTrackVolume(tr.id, Number(e.target.value))}
 className="w-20 accent-emerald-500"
 />
 <button
 onClick={() => (chords ? setExpandedChordsTrackId(isExpanded ? null : tr.id) : handleAnalyzeTrackChords(tr))}
 title="Detectar acordes escuchando solo esta pista aislada"
 disabled={isLoadingThis}
 className="w-6 h-6 rounded flex items-center justify-center bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--tentative)]/50 disabled:opacity-50"
 >
 {isLoadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music2 className="w-3.5 h-3.5" />}
 </button>
 </div>

 {isExpanded && (chords || chordsErr) && (
 <div className="px-3 pb-3 space-y-2 border-t border-[var(--hair)] pt-2">
 {chordsErr && <p className="text-[11px] text-[var(--alert)]">{chordsErr}</p>}
 {chords && (
 <>
 <p className={`text-[10px] font-sans ${chordsSourceLabel(chords.chordsSource).tone}`}>
 {chordsSourceLabel(chords.chordsSource).text}
 {chords.esAproximado &&' · ⚠️ aproximado, verifica de oído'}
 </p>
 <pre className="text-[11px] font-sans whitespace-pre-wrap text-[var(--ink-2)] max-h-40 overflow-y-auto bg-[var(--sunken)] rounded-[var(--r-s)] p-2">
 {chords.cifradoTexto}
 </pre>
 {onApplyAsMainChords && (
 <button
 onClick={() => onApplyAsMainChords(chords.cifradoTexto, chords.guiaSustituto)}
 className="flex items-center gap-1.5 text-[10px] font-sans px-2.5 py-1.5 rounded-[var(--r-s)] bg-[var(--tentative)]/15 text-[var(--tentative)]/50 hover:bg-[var(--tentative)]/25"
 >
 <CheckCircle2 className="w-3 h-3" /> Usar como cifrado principal de la canción
 </button>
 )}
 </>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Exportar */}
 <div className={`rounded-[var(--r-m)] p-3 space-y-2 ${cardBg}`}>
 <span className="text-[11px] font-sans font-semibold text-[var(--ink-2)]">Descargar para escuchar offline</span>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => handleExport('sin-mi-pista')}
 disabled={!myTrack || isExporting !== null}
 className="flex items-center gap-1.5 text-[11px] font-sans px-3 py-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--ink-3)] hover:bg-[var(--acc)]/20 disabled:opacity-40"
 >
 <Download className="w-3.5 h-3.5" /> {isExporting ==='sin-mi-pista' ?'Generando…' :'Sin mi pista'}
 </button>
 <button
 onClick={() => handleExport('solo-mi-pista')}
 disabled={!myTrack || isExporting !== null}
 className="flex items-center gap-1.5 text-[11px] font-sans px-3 py-2 rounded-[var(--r-s)] bg-[var(--tentative)]/10 text-[var(--acc)]/50 hover:bg-[var(--tentative)]/20 disabled:opacity-40"
 >
 <Download className="w-3.5 h-3.5" /> {isExporting ==='solo-mi-pista' ?'Generando…' :'Solo mi pista'}
 </button>
 <button
 onClick={() => handleExport('mezcla-actual')}
 disabled={isExporting !== null}
 className="flex items-center gap-1.5 text-[11px] font-sans px-3 py-2 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70 disabled:opacity-40"
 >
 <Download className="w-3.5 h-3.5" /> {isExporting ==='mezcla-actual' ?'Generando…' :'Mi mezcla actual'}
 </button>
 </div>
 {exportError && <p className="text-[11px] text-[var(--alert)]">{exportError}</p>}
 </div>
 </div>
 </div>
 </div>
 </>
 );
}

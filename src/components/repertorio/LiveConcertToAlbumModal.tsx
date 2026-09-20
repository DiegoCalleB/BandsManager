import React, { useState } from'react';
import { Disc3, Sparkles, Scissors, Play, Pause, Plus, Trash2, ArrowUp, ArrowDown, Download, Check, RefreshCw, Layers, Radio, Volume2, VolumeX, HelpCircle, FileText, ExternalLink, X, Combine, GitMerge, CheckSquare, Square, Wand2, Music2, FileCode, ListPlus, Sliders, ChevronDown, ChevronUp, RotateCcw, RotateCw, Clock, Zap, AlertTriangle, Upload, CheckCircle2, Undo2, Redo2, Lock, Key, ShieldCheck, Tag, Target } from'lucide-react';
import { Song, ThemeColors } from'../../types';
import { apiFetch } from'../../utils/api';
import { ModalPortal } from'../common/ModalPortal';

export interface TrackCutItem {
 index: number;
 title: string;
 start: number; // in seconds
 end: number; // in seconds
 duration: number; // in seconds
 type:'musica' |'dialogo';
 speechTranscription?: string;
 lyricsWithChords?: string;
 tonalidad?: string;
 bpm?: number;
 audioUrl?: string;
 cueIn?: number;
 cueOut?: number;
 hasApplauseIntro?: boolean;
 hasApplauseOutro?: boolean;
 cueConfidence?: number;
}

interface LiveConcertToAlbumModalProps {
 isOpen: boolean;
 onClose: () => void;
 bandName?: string;
 colors: ThemeColors;: boolean;
 onSaveAlbumToCatalog: (albumTitle: string, tracks: TrackCutItem[]) => void;
 onSaveSetlist?: (newSetlist: any) => void;
}

const formatSeconds = (totalSecs: number): string => {
 if (isNaN(totalSecs) || totalSecs < 0) return'00:00';
 const hrs = Math.floor(totalSecs / 3600);
 const mins = Math.floor((totalSecs % 3600) / 60);
 const secs = Math.floor(totalSecs % 60);

 const mStr = String(mins).padStart(2,'0');
 const sStr = String(secs).padStart(2,'0');

 if (hrs > 0) {
 return `${hrs}:${mStr}:${sStr}`;
 }
 return `${mStr}:${sStr}`;
};

const parseTimeToSeconds = (str: string): number => {
 if (!str) return 0;
 const parts = str.split(':').map((p) => parseFloat(p) || 0);
 if (parts.length === 3) {
 return parts[0] * 3600 + parts[1] * 60 + parts[2];
 }
 if (parts.length === 2) {
 return parts[0] * 60 + parts[1];
 }
 return parseFloat(str) || 0;
};

export const LiveConcertToAlbumModal: React.FC<LiveConcertToAlbumModalProps> = ({
 isOpen,
 onClose,
 bandName ='Nuestra Banda',
 colors
 onSaveAlbumToCatalog,
 onSaveSetlist}) => {
 const [youtubeUrl, setYoutubeUrl] = useState('');
 const [uploadedFile, setUploadedFile] = useState<File | null>(null);
 const [useAi, setUseAi] = useState(true);
 const [transcribeFirst, setTranscribeFirst] = useState(true);

 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [analysisStatus, setAnalysisStatus] = useState('');
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const [albumTitle, setAlbumTitle] = useState('');
 const [artistName, setArtistName] = useState(bandName);
 const [tracks, setTracks] = useState<TrackCutItem[]>([]);
 const [history, setHistory] = useState<TrackCutItem[][]>([]);
 const [redoStack, setRedoStack] = useState<TrackCutItem[][]>([]);
 const [analyzedSourcePath, setAnalyzedSourcePath] = useState('');

 // Quick Naming & Batch Renaming Assistant state
 const [showQuickNamingModal, setShowQuickNamingModal] = useState(false);
 const [batchPastedText, setBatchPastedText] = useState('');
 const [quickNamingActiveTab, setQuickNamingActiveTab] = useState<'table' |'paste'>('table');

 // Push snapshot to history stack before mutating tracks
 const pushHistorySnapshot = () => {
 setHistory((prev) => [...prev, tracks]);
 setRedoStack([]);
 };

 const handleUndo = () => {
 if (history.length === 0) return;
 const previous = history[history.length - 1];
 setRedoStack((prev) => [tracks, ...prev]);
 setHistory((prev) => prev.slice(0, prev.length - 1));
 setTracks(previous);
 setSelectedIndices([]);
 };

 const handleRedo = () => {
 if (redoStack.length === 0) return;
 const next = redoStack[0];
 setHistory((prev) => [...prev, tracks]);
 setRedoStack((prev) => prev.slice(1));
 setTracks(next);
 setSelectedIndices([]);
 };

 // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y / Ctrl+Shift+Z (Redo)
 React.useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 const target = e.target as HTMLElement;
 const isEditingText = target && (target.tagName ==='INPUT' || target.tagName ==='TEXTAREA');

 if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() ==='z') {
 if (e.shiftKey) {
 if (!isEditingText && redoStack.length > 0) {
 e.preventDefault();
 handleRedo();
 }
 } else {
 if (!isEditingText && history.length > 0) {
 e.preventDefault();
 handleUndo();
 }
 }
 } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() ==='y') {
 if (!isEditingText && redoStack.length > 0) {
 e.preventDefault();
 handleRedo();
 }
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [history, redoStack, tracks]);

 const [isProcessing, setIsProcessing] = useState(false);
 const [processingStatus, setProcessingStatus] = useState('');
 const [generatedResult, setGeneratedResult] = useState<{
 albumId: string;
 deliverablePath: string;
 tracks: TrackCutItem[];
 } | null>(null);

 const [playingTrackUrl, setPlayingTrackUrl] = useState<string | null>(null);
 const [loadingSnippetIndex, setLoadingSnippetIndex] = useState<number | null>(null);
 const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
 const [isClassifying, setIsClassifying] = useState(false);
 const [youtubeBlocked, setYoutubeBlocked] = useState(false);
 const [audioAvailable, setAudioAvailable] = useState(true);
 const [isLinkingLocalFile, setIsLinkingLocalFile] = useState(false);

 // YouTube Band Account & Cookies Authentication State
 const [hasYoutubeCookies, setHasYoutubeCookies] = useState(false);
 const [cookieModalOpen, setCookieModalOpen] = useState(false);
 const [cookiesInputText, setCookiesInputText] = useState('');
 const [isSavingCookies, setIsSavingCookies] = useState(false);
 const [cookieSuccessMsg, setCookieSuccessMsg] = useState<string | null>(null);

 const checkYoutubeCookies = async () => {
 try {
 const res = await fetch('/api/concert-to-album/cookies-status');
 if (res.ok) {
 const data = await res.json();
 setHasYoutubeCookies(Boolean(data.hasCookies));
 }
 } catch {}
 };

 React.useEffect(() => {
 if (isOpen) {
 checkYoutubeCookies();
 }
 }, [isOpen]);

 const handleSaveCookies = async () => {
 if (!cookiesInputText.trim()) return;
 setIsSavingCookies(true);
 try {
 const res = await fetch('/api/concert-to-album/save-cookies', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ cookiesText: cookiesInputText.trim() })});
 const data = await res.json();
 if (res.ok && data.success) {
 setHasYoutubeCookies(true);
 setCookieSuccessMsg('¡Acceso verificado! Ahora el servidor puede descargar vídeos del canal directamente sin bloqueos.');
 setTimeout(() => {
 setCookieSuccessMsg(null);
 setCookieModalOpen(false);
 }, 2200);
 } else {
 setErrorMessage(data.error ||'Error al guardar las cookies de YouTube.');
 }
 } catch (err: any) {
 setErrorMessage(err.message ||'Error al conectar con el servidor.');
 } finally {
 setIsSavingCookies(false);
 }
 };

 const handleDeleteCookies = async () => {
 try {
 await fetch('/api/concert-to-album/delete-cookies', { method:'POST' });
 setHasYoutubeCookies(false);
 setCookiesInputText('');
 setCookieSuccessMsg('Cookies eliminadas del servidor.');
 setTimeout(() => setCookieSuccessMsg(null), 2000);
 } catch {}
 };

 const handleUploadCookieFile = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = (event) => {
 const content = event.target?.result as string;
 if (content) {
 setCookiesInputText(content);
 }
 };
 reader.readAsText(file);
 };

 // Helper for binary streaming upload via FormData & Chunks (handles 1GB+ files cleanly without 413 limits)
 const uploadFileBinary = async (
 file: File,
 folder ='conciertos_fuente',
 onProgress?: (msg: string) => void
 ): Promise<string> => {
 const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks fit easily inside Cloud Run / proxy limits

 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token');
 let activeBandId ='';
 try {
 const userStr = localStorage.getItem('bakandeya_user');
 if (userStr) activeBandId = JSON.parse(userStr)?.band_id ||'';
 } catch {}

 const authHeaders: Record<string, string> = {};
 if (token) authHeaders['Authorization'] = `Bearer ${token}`;
 if (activeBandId) authHeaders['x-band-id'] = activeBandId;

 if (file.size <= 10 * 1024 * 1024) {
 if (onProgress) onProgress('Subiendo archivo...');
 const formData = new FormData();
 formData.append('file', file);
 formData.append('folder', folder);

 const uploadRes = await fetch('/api/upload', {
 method:'POST',
 headers: authHeaders,
 body: formData});

 if (!uploadRes.ok) {
 const errorText = await uploadRes.text();
 throw new Error(`Falló la subida (${uploadRes.status}): ${errorText.substring(0, 100)}`);
 }

 const uploadData = await uploadRes.json();
 return uploadData.filePath || uploadData.url ||'';
 }

 // Chunked upload for files > 10MB
 const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
 const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

 for (let i = 0; i < totalChunks; i++) {
 const start = i * CHUNK_SIZE;
 const end = Math.min(file.size, start + CHUNK_SIZE);
 const chunkBlob = file.slice(start, end);

 const formData = new FormData();
 formData.append('chunk', chunkBlob, file.name);
 formData.append('uploadId', uploadId);
 formData.append('chunkIndex', String(i));
 formData.append('totalChunks', String(totalChunks));
 formData.append('filename', file.name);
 formData.append('folder', folder);

 const percent = Math.round(((i + 1) / totalChunks) * 100);
 const mbUploaded = (end / (1024 * 1024)).toFixed(0);
 const mbTotal = (file.size / (1024 * 1024)).toFixed(0);
 if (onProgress) {
 onProgress(`Subiendo archivo en partes: ${percent}% (${mbUploaded}MB / ${mbTotal}MB)...`);
 }

 const res = await fetch('/api/upload/chunk', {
 method:'POST',
 headers: authHeaders,
 body: formData});

 if (!res.ok) {
 const errorText = await res.text();
 throw new Error(`Error subiendo la parte ${i + 1}/${totalChunks} (${res.status}): ${errorText.substring(0, 100)}`);
 }

 const data = await res.json();
 if (data.completed) {
 return data.filePath || data.url ||'';
 }
 }

 throw new Error('No se completó la subida del archivo.');
 };

 // Quick attach local MP3/MP4 media file for audio listening & Gemini audio transcription
 const handleAttachLocalAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setIsLinkingLocalFile(true);
 setErrorMessage(null);
 try {
 const sourceFilePath = await uploadFileBinary(file,'conciertos_fuente', (msg) => {
 setAnalysisStatus(msg);
 });
 setAnalyzedSourcePath(sourceFilePath);
 setAudioAvailable(true);
 setYoutubeBlocked(false);
 } catch (err: any) {
 console.error('Error linking local audio file:', err);
 alert(err.message ||'Error al vincular el archivo de audio local.');
 } finally {
 setIsLinkingLocalFile(false);
 }
 };

 const handleLoadDemoAudio = async () => {
 setIsLinkingLocalFile(true);
 setErrorMessage(null);
 try {
 const res = await apiFetch('/api/concert-to-album/demo-audio', {
 method:'POST'});
 if (res.success && res.filePath) {
 setAnalyzedSourcePath(res.filePath);
 setAudioAvailable(true);
 setYoutubeBlocked(false);
 } else {
 throw new Error('No se pudo generar el audio demo.');
 }
 } catch (err: any) {
 console.error('Error loading demo audio:', err);
 alert(err.message ||'Error al cargar el audio demo.');
 } finally {
 setIsLinkingLocalFile(false);
 }
 };

 // Audio Fragment Scrubber Player State
 const [activeSnippet, setActiveSnippet] = useState<{
 trackIndex: number;
 title: string;
 audioUrl: string;
 start: number;
 end: number;
 } | null>(null);

 const [snippetCurrentTime, setSnippetCurrentTime] = useState(0);
 const [snippetDuration, setSnippetDuration] = useState(0);
 const [snippetIsPlaying, setSnippetIsPlaying] = useState(false);
 const [snippetSpeed, setSnippetSpeed] = useState(1);
 const snippetAudioRef = React.useRef<HTMLAudioElement | null>(null);

 React.useEffect(() => {
 if (snippetAudioRef.current) {
 if (snippetIsPlaying) {
 snippetAudioRef.current.play().catch((err) => {
 console.warn('Autoplay prevented or audio error:', err);
 setSnippetIsPlaying(false);
 });
 } else {
 snippetAudioRef.current.pause();
 }
 }
 }, [snippetIsPlaying, activeSnippet]);

 const [transcribingIndex, setTranscribingIndex] = useState<number | null>(null);
 const [transcribingChordsIndex, setTranscribingChordsIndex] = useState<number | null>(null);
 const [expandedChordsIndex, setExpandedChordsIndex] = useState<number | null>(null);
 const [expandAllChords, setExpandAllChords] = useState(true);
 const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
 const [isTranscribingAll, setIsTranscribingAll] = useState(false);
 const [transcribeAllProgress, setTranscribeAllProgress] = useState<{
 current: number;
 total: number;
 title: string;
 stopRequested?: boolean;
 } | null>(null);
 const [isDetectingCues, setIsDetectingCues] = useState(false);

 if (!isOpen) return null;

 // Step 1: Run Analysis
 const handleAnalyzeConcert = async () => {
 if (!youtubeUrl && !uploadedFile) {
 setErrorMessage('Por favor, introduce una URL de YouTube o selecciona un archivo de vídeo/audio local.');
 return;
 }

 setErrorMessage(null);
 setIsAnalyzing(true);
 setAnalysisStatus('Extrayendo metadatos y analizando silenciogramas...');
 setGeneratedResult(null);

 try {
 let sourceFilePath ='';

 // If user uploaded local file, upload to temp folder first using FormData chunk streaming
 if (uploadedFile) {
 setAnalysisStatus('Subiendo archivo local al servidor...');
 sourceFilePath = await uploadFileBinary(uploadedFile,'conciertos_fuente', (msg) => {
 setAnalysisStatus(msg);
 });
 setAnalyzedSourcePath(sourceFilePath);
 }

 setAnalysisStatus(
 useAi
 ? transcribeFirst
 ?'Transcribiendo y analizando el audio completo con IA para alinear cortes y letras...'
 :'Analizando acústica y detectando estructura del concierto...'
 :'Detectando silencios, pausas y capítulos del concierto...'
 );

 const response = await fetch('/api/concert-to-album/analyze', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 url: youtubeUrl.trim(),
 sourceFilePath,
 useAi,
 transcribeFirst,
 bandName: artistName || bandName})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al analizar el concierto.');
 }

 const data = await response.json();
 setAlbumTitle(data.albumTitle || `Directo - ${artistName}`);
 setArtistName(data.artist || artistName);
 setTracks(data.tracks || []);
 if (typeof data.youtubeBlocked !=='undefined') setYoutubeBlocked(Boolean(data.youtubeBlocked));
 if (typeof data.audioAvailable !=='undefined') setAudioAvailable(Boolean(data.audioAvailable));
 } catch (err: any) {
 console.error('Error analyzing concert:', err);
 setErrorMessage(err.message ||'Error durante el análisis del concierto.');
 } finally {
 setIsAnalyzing(false);
 }
 };

 // Step 2: Slice & Generate Album
 const handleProcessAndSlice = async () => {
 if (!tracks || tracks.length === 0) {
 setErrorMessage('No hay pistas configuradas para trocear.');
 return;
 }

 setErrorMessage(null);
 setIsProcessing(true);
 setProcessingStatus('Troceando archivos de audio de alta fidelidad...');

 try {
 const response = await fetch('/api/concert-to-album/process', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 tracks,
 albumTitle: albumTitle ||'Directo en Vivo',
 artist: artistName || bandName})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al trocear el concierto.');
 }

 const data = await response.json();
 setGeneratedResult({
 albumId: data.albumId,
 deliverablePath: data.deliverablePath,
 tracks: data.tracks});
 setTracks(data.tracks);
 } catch (err: any) {
 console.error('Error slicing concert:', err);
 setErrorMessage(err.message ||'Error al procesar el troceado del disco.');
 } finally {
 setIsProcessing(false);
 }
 };

 // Track modification helpers
 const handleUpdateTrack = (index: number, key: keyof TrackCutItem, value: any) => {
 pushHistorySnapshot();
 setTracks((prev) =>
 prev.map((t) => {
 if (t.index === index) {
 const updated = { ...t, [key]: value };
 if (key ==='start' || key ==='end') {
 updated.duration = Math.max(0, updated.end - updated.start);
 }
 return updated;
 }
 return t;
 })
 );
 };

 const handleAddCutTrack = (afterIndex: number) => {
 pushHistorySnapshot();
 setTracks((prev) => {
 const currentTrack = prev.find((t) => t.index === afterIndex);
 const start = currentTrack ? currentTrack.end : 0;
 const end = start + 180;
 const newTrack: TrackCutItem = {
 index: prev.length + 1,
 title: `Nueva Pista ${prev.length + 1}`,
 start,
 end,
 duration: 180,
 type:'musica'};
 const updated = [...prev, newTrack];
 return updated.map((t, i) => ({ ...t, index: i + 1 }));
 });
 };

 const handleDeleteTrack = (index: number) => {
 pushHistorySnapshot();
 setTracks((prev) => {
 const filtered = prev.filter((t) => t.index !== index);
 return filtered.map((t, i) => ({ ...t, index: i + 1 }));
 });
 };

 const handleMoveTrack = (index: number, direction:'up' |'down') => {
 pushHistorySnapshot();
 setTracks((prev) => {
 const idx = prev.findIndex((t) => t.index === index);
 if (idx < 0) return prev;
 const targetIdx = direction ==='up' ? idx - 1 : idx + 1;
 if (targetIdx < 0 || targetIdx >= prev.length) return prev;

 const newArr = [...prev];
 const temp = newArr[idx];
 newArr[idx] = newArr[targetIdx];
 newArr[targetIdx] = temp;

 return newArr.map((t, i) => ({ ...t, index: i + 1 }));
 });
 };

 // Quick naming & speech title helpers
 const handleSuggestTitleFromSpeech = (trackIndex: number) => {
 const track = tracks.find((t) => t.index === trackIndex);
 if (!track || !track.speechTranscription) return;

 const cleanSpeech = track.speechTranscription.replace(/[\n\r]+/g,'').trim();
 const firstPhrase = cleanSpeech.split(/[.!?]/)[0].trim();
 const suggested = firstPhrase.length > 45 ? `${firstPhrase.slice(0, 42)}...` : firstPhrase;
 if (suggested) {
 handleUpdateTrack(trackIndex,'title', `Speech:"${suggested}"`);
 }
 };

 const handleApplyBatchPastedNames = () => {
 if (!batchPastedText.trim()) return;
 pushHistorySnapshot();

 const lines = batchPastedText
 .split('\n')
 .map((l) => l.trim())
 .filter(Boolean);

 if (lines.length === 0) return;

 setTracks((prev) => {
 return prev.map((tr, idx) => {
 if (idx >= lines.length) return tr;

 let cleanName = lines[idx];
 // Strip leading numbering:"1.","01.","1 -","1)","#1", etc.
 cleanName = cleanName.replace(/^(?:#?\d+[\.\)\-:\s]+|\s*[-–—]\s*)+/i,'').trim();
 if (!cleanName) cleanName = lines[idx];

 // Auto-detect if it sounds like a speech or dialogue
 const lower = cleanName.toLowerCase();
 const isSpeechKeyword = /speech|presentaci[oó]n|saludo|hablado|charla|an[eé]cdota|intro hablada|palabras|agradecimiento|bises?\s+hablado|chapa/i.test(lower);
 const newType = isSpeechKeyword ?'dialogo' : tr.type;

 return {
 ...tr,
 title: cleanName,
 type: newType};
 });
 });

 setBatchPastedText('');
 setShowQuickNamingModal(false);
 };

 // Audio scrubber helper methods
 const handleSeekSnippet = (timeSecs: number) => {
 setSnippetCurrentTime(timeSecs);
 if (snippetAudioRef.current) {
 snippetAudioRef.current.currentTime = timeSecs;
 }
 };

 const handleSkipSnippet = (deltaSecs: number) => {
 if (!snippetAudioRef.current) return;
 const maxDur = snippetAudioRef.current.duration || 1000;
 const newTime = Math.max(0, Math.min(maxDur, snippetAudioRef.current.currentTime + deltaSecs));
 snippetAudioRef.current.currentTime = newTime;
 setSnippetCurrentTime(newTime);
 };

 const handleChangeSnippetSpeed = (speed: number) => {
 setSnippetSpeed(speed);
 if (snippetAudioRef.current) {
 snippetAudioRef.current.playbackRate = speed;
 }
 };

 const handleSetStartFromCurrentSnippet = (trackIndex: number) => {
 if (!activeSnippet) return;
 const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
 handleUpdateTrack(trackIndex,'start', currentAbs);
 };

 const handleSetEndFromCurrentSnippet = (trackIndex: number) => {
 if (!activeSnippet) return;
 const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
 handleUpdateTrack(trackIndex,'end', currentAbs);
 };

 const getYouTubeVideoId = (url: string) => {
 if (!url) return null;
 const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
 const match = url.match(regExp);
 return match && match[2].length === 11 ? match[2] : null;
 };

 // Preview snippet playback (Generates or plays audio for a single cut item)
 const handlePlaySnippetPreview = async (track: TrackCutItem, startFromCue: boolean = false) => {
 const cueOffset = startFromCue && track.cueIn && track.cueIn > 0 ? track.cueIn : 0;

 if (activeSnippet && activeSnippet.trackIndex === track.index) {
 if (snippetAudioRef.current) {
 if (startFromCue && track.cueIn) {
 snippetAudioRef.current.currentTime = track.cueIn;
 setSnippetCurrentTime(track.cueIn);
 snippetAudioRef.current.play();
 setSnippetIsPlaying(true);
 return;
 }
 if (snippetIsPlaying) {
 snippetAudioRef.current.pause();
 } else {
 snippetAudioRef.current.play();
 }
 }
 return;
 }

 if (track.audioUrl) {
 setActiveSnippet({
 trackIndex: track.index,
 title: track.title,
 audioUrl: track.audioUrl,
 start: track.start,
 end: track.end});
 setSnippetCurrentTime(cueOffset);
 setSnippetIsPlaying(true);
 setTimeout(() => {
 if (snippetAudioRef.current && cueOffset > 0) {
 snippetAudioRef.current.currentTime = cueOffset;
 }
 }, 100);
 return;
 }

 // Direct YouTube Player Sync if no local file is uploaded
 const ytVideoId = getYouTubeVideoId(youtubeUrl);
 if (!analyzedSourcePath && ytVideoId) {
 setActiveSnippet({
 trackIndex: track.index,
 title: track.title,
 audioUrl:'',
 start: track.start,
 end: track.end});
 setSnippetCurrentTime(cueOffset);
 setSnippetIsPlaying(true);
 return;
 }

 setLoadingSnippetIndex(track.index);
 try {
 const response = await fetch('/api/concert-to-album/preview-snippet', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 start: track.start,
 end: track.end,
 trackIndex: track.index})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al obtener previsualización del trozo.');
 }

 const data = await response.json();
 if (data.audioUrl) {
 handleUpdateTrack(track.index,'audioUrl', data.audioUrl);
 setActiveSnippet({
 trackIndex: track.index,
 title: track.title,
 audioUrl: data.audioUrl,
 start: track.start,
 end: track.end});
 setSnippetCurrentTime(cueOffset);
 setSnippetIsPlaying(true);
 setTimeout(() => {
 if (snippetAudioRef.current && cueOffset > 0) {
 snippetAudioRef.current.currentTime = cueOffset;
 }
 }, 150);
 }
 } catch (err: any) {
 console.error('Error generating snippet preview:', err);
 alert(err.message ||'No se pudo generar la previsualización del trozo.');
 } finally {
 setLoadingSnippetIndex(null);
 }
 };

 // Auto-classify songs vs dialogue automatically
 const handleAutoClassifyTracks = async () => {
 if (!tracks || tracks.length === 0) return;
 setIsClassifying(true);
 try {
 const response = await fetch('/api/concert-to-album/classify-tracks', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 tracks,
 bandName: artistName || bandName,
 albumTitle: albumTitle ||'Directo en Vivo',
 useAi})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al auto-clasificar.');
 }

 const data = await response.json();
 if (data.tracks) {
 setTracks(data.tracks);
 }
 } catch (err: any) {
 console.error('Error auto-classifying tracks:', err);
 alert(err.message ||'No se pudo completar la auto-clasificación.');
 } finally {
 setIsClassifying(false);
 }
 };

 // Autodetectar CUEs de inicio musical para cada pista
 const handleAutoDetectCues = async () => {
 if (!tracks || tracks.length === 0) return;
 setIsDetectingCues(true);
 try {
 const response = await fetch('/api/concert-to-album/detect-cues', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 tracks,
 sourceFilePath: analyzedSourcePath,
 url: youtubeUrl.trim()})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al autodetectar CUEs de inicio.');
 }

 const data = await response.json();
 if (data.tracks) {
 pushHistorySnapshot();
 setTracks(data.tracks);
 }
 } catch (err: any) {
 console.error('Error auto-detecting cues:', err);
 alert(err.message ||'No se pudo completar la autodetección de CUEs.');
 } finally {
 setIsDetectingCues(false);
 }
 };

 // Ajustar el inicio de una pista a su CUE In exacto
 const handleSnapTrackStartToCue = (trackIndex: number) => {
 const idx = tracks.findIndex((t) => t.index === trackIndex);
 if (idx < 0) return;
 const track = tracks[idx];
 if (!track.cueIn || track.cueIn <= 0.1) return;

 pushHistorySnapshot();
 const newStart = Math.round((track.start + track.cueIn) * 10) / 10;
 const newDuration = Math.max(0.5, Math.round((track.end - newStart) * 10) / 10);
 const updated = [...tracks];
 updated[idx] = {
 ...track,
 start: newStart,
 duration: newDuration,
 cueIn: 0};
 setTracks(updated);
 };

 // Ajustar todos los temas musicales a sus CUEs detectados
 const handleSnapAllTracksToCues = () => {
 pushHistorySnapshot();
 let adjustedCount = 0;
 const updated = tracks.map((t) => {
 if (t.type ==='musica' && t.cueIn && t.cueIn > 0.2) {
 const newStart = Math.round((t.start + t.cueIn) * 10) / 10;
 const newDuration = Math.max(0.5, Math.round((t.end - newStart) * 10) / 10);
 adjustedCount++;
 return {
 ...t,
 start: newStart,
 duration: newDuration,
 cueIn: 0};
 }
 return t;
 });
 setTracks(updated);
 if (adjustedCount > 0) {
 alert(`Se han ajustado los puntos de inicio de ${adjustedCount} temas para arrancar exactamente en la entrada musical.`);
 }
 };

 // Selection for multi-track fusion
 const handleToggleSelectTrack = (index: number) => {
 setSelectedIndices((prev) =>
 prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
 );
 };

 // Merge track with next track
 const handleMergeWithNext = (trackIndex: number) => {
 const idx = tracks.findIndex((t) => t.index === trackIndex);
 if (idx < 0 || idx >= tracks.length - 1) return;

 pushHistorySnapshot();

 const trackA = tracks[idx];
 const trackB = tracks[idx + 1];

 const minStart = Math.min(trackA.start, trackB.start);
 const maxEnd = Math.max(trackA.end, trackB.end);
 const mergedTitle = `${trackA.title} + ${trackB.title}`;
 const mergedSpeech = [trackA.speechTranscription, trackB.speechTranscription].filter(Boolean).join('\n');

 const mergedTrack: TrackCutItem = {
 index: trackA.index,
 title: mergedTitle,
 start: minStart,
 end: maxEnd,
 duration: maxEnd - minStart,
 type: trackA.type ==='musica' || trackB.type ==='musica' ?'musica' :'dialogo',
 speechTranscription: mergedSpeech};

 const newArr = [...tracks];
 newArr.splice(idx, 2, mergedTrack);
 const reindexed = newArr.map((t, i) => ({ ...t, index: i + 1 }));
 setTracks(reindexed);
 setSelectedIndices([]);
 };

 // Merge all checked tracks
 const handleMergeSelectedTracks = () => {
 if (selectedIndices.length < 2) return;
 const sortedIdxs = [...selectedIndices].sort((a, b) => a - b);
 const targetTracks = tracks.filter((t) => sortedIdxs.includes(t.index));
 if (targetTracks.length < 2) return;

 pushHistorySnapshot();

 const minStart = Math.min(...targetTracks.map((t) => t.start));
 const maxEnd = Math.max(...targetTracks.map((t) => t.end));
 const mergedTitle = targetTracks.map((t) => t.title).join(' +');
 const mergedSpeech = targetTracks.map((t) => t.speechTranscription).filter(Boolean).join('\n');
 const hasMusic = targetTracks.some((t) => t.type ==='musica');

 const mergedTrack: TrackCutItem = {
 index: sortedIdxs[0],
 title: mergedTitle,
 start: minStart,
 end: maxEnd,
 duration: maxEnd - minStart,
 type: hasMusic ?'musica' :'dialogo',
 speechTranscription: mergedSpeech};

 const remaining = tracks.filter((t) => !sortedIdxs.includes(t.index));
 const updatedList = [...remaining, mergedTrack].sort((a, b) => a.start - b.start);
 const reindexed = updatedList.map((t, i) => ({ ...t, index: i + 1 }));

 setTracks(reindexed);
 setSelectedIndices([]);
 };

 // Split track into 2 parts at custom position, current snippet player time, or midpoint
 const handleSplitTrack = (trackIndex: number, customSplitSecs?: number) => {
 pushHistorySnapshot();
 setTracks((prev) => {
 const idx = prev.findIndex((t) => t.index === trackIndex);
 if (idx < 0) return prev;

 const orig = prev[idx];
 let splitPoint = customSplitSecs;

 if (splitPoint === undefined) {
 if (activeSnippet && activeSnippet.trackIndex === trackIndex && snippetCurrentTime > 0) {
 splitPoint = Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10;
 } else {
 splitPoint = Math.round((orig.start + (orig.end - orig.start) / 2) * 10) / 10;
 }
 }

 if (splitPoint <= orig.start + 0.5 || splitPoint >= orig.end - 0.5) {
 alert(`Punto de corte inválido (${formatSeconds(splitPoint)}). Debe estar dentro del intervalo del tramo (${formatSeconds(orig.start)} - ${formatSeconds(orig.end)}).`);
 return prev;
 }

 const part1: TrackCutItem = {
 ...orig,
 title: orig.title.includes('(Parte') ? orig.title : `${orig.title} (Parte 1)`,
 end: splitPoint,
 duration: Math.max(1, splitPoint - orig.start),
 audioUrl: undefined};

 const part2: TrackCutItem = {
 ...orig,
 title: orig.title.includes('(Parte') ? `${orig.title} b` : `${orig.title} (Parte 2)`,
 start: splitPoint,
 end: orig.end,
 duration: Math.max(1, orig.end - splitPoint),
 audioUrl: undefined};

 const newArr = [...prev];
 newArr.splice(idx, 1, part1, part2);
 return newArr.map((t, i) => ({ ...t, index: i + 1 }));
 });

 if (activeSnippet && activeSnippet.trackIndex === trackIndex) {
 setActiveSnippet(null);
 }
 };

 // Transcribe spoken speech / interlude with Gemini AI
 const handleTranscribeSpeech = async (track: TrackCutItem) => {
 setTranscribingIndex(track.index);
 try {
 const response = await fetch('/api/concert-to-album/transcribe-speech', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 trackTitle: track.title,
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 start: track.start,
 end: track.end,
 trackIndex: track.index,
 audioUrl: track.audioUrl,
 promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al transcribir discurso.');
 }

 const data = await response.json();
 if (data.transcription) {
 handleUpdateTrack(track.index,'speechTranscription', data.transcription);
 }
 } catch (err: any) {
 console.error('Error transcribing speech:', err);
 alert(err.message ||'No se pudo generar la transcripción del discurso.');
 } finally {
 setTranscribingIndex(null);
 }
 };

 // Transcribe song lyrics and chords sheet with AI
 const handleTranscribeSongChordsAndLyrics = async (track: TrackCutItem) => {
 setTranscribingChordsIndex(track.index);
 try {
 const response = await fetch('/api/concert-to-album/transcribe-song', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 title: track.title,
 artist: artistName || bandName,
 duration: track.duration,
 speechTranscription: track.speechTranscription,
 audioUrl: track.audioUrl,
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 start: track.start,
 end: track.end,
 trackIndex: track.index})});

 if (!response.ok) {
 const errData = await response.json();
 throw new Error(errData.error ||'Error al transcribir letra y acordes.');
 }

 const data = await response.json();
 if (data.lyricsWithChords) {
 handleUpdateTrack(track.index,'lyricsWithChords', data.lyricsWithChords);
 if (data.tonalidad) handleUpdateTrack(track.index,'tonalidad', data.tonalidad);
 if (data.bpm) handleUpdateTrack(track.index,'bpm', data.bpm);
 setExpandedChordsIndex(track.index);
 }
 } catch (err: any) {
 console.error('Error transcribing song chords:', err);
 alert(err.message ||'No se pudo generar la transcripción de acordes.');
 } finally {
 setTranscribingChordsIndex(null);
 }
 };

 // Transcribe all or selected concert tracks automatically with Gemini AI
 const handleTranscribeAllConcert = async () => {
 const targetTracks = selectedIndices.length > 0
 ? tracks.filter((t) => selectedIndices.includes(t.index))
 : tracks;

 if (!targetTracks || targetTracks.length === 0) {
 alert('No hay pistas en el tracklist para transcribir.');
 return;
 }

 pushHistorySnapshot();
 setIsTranscribingAll(true);

 for (let i = 0; i < targetTracks.length; i++) {
 const track = targetTracks[i];
 setTranscribeAllProgress({
 current: i + 1,
 total: targetTracks.length,
 title: track.title});

 try {
 if (track.type ==='dialogo') {
 // Transcribe speech/interlude
 setTranscribingIndex(track.index);
 const response = await fetch('/api/concert-to-album/transcribe-speech', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 trackTitle: track.title,
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 start: track.start,
 end: track.end,
 trackIndex: track.index,
 audioUrl: track.audioUrl,
 promptContext: `Interludio o presentación del artista (${artistName || bandName}) en el concierto`})});

 if (response.ok) {
 const data = await response.json();
 if (data.transcription) {
 handleUpdateTrack(track.index,'speechTranscription', data.transcription);
 }
 }
 setTranscribingIndex(null);
 } else {
 // Transcribe song lyrics and chords
 setTranscribingChordsIndex(track.index);
 const response = await fetch('/api/concert-to-album/transcribe-song', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 title: track.title,
 artist: artistName || bandName,
 duration: track.duration,
 speechTranscription: track.speechTranscription,
 audioUrl: track.audioUrl,
 url: youtubeUrl.trim(),
 sourceFilePath: analyzedSourcePath,
 start: track.start,
 end: track.end,
 trackIndex: track.index})});

 if (response.ok) {
 const data = await response.json();
 if (data.lyricsWithChords) handleUpdateTrack(track.index,'lyricsWithChords', data.lyricsWithChords);
 if (data.tonalidad) handleUpdateTrack(track.index,'tonalidad', data.tonalidad);
 if (data.bpm) handleUpdateTrack(track.index,'bpm', data.bpm);
 }
 setTranscribingChordsIndex(null);
 }
 } catch (err: any) {
 console.error(`Error al transcribir pista ${track.index} (${track.title}):`, err);
 }
 }

 setIsTranscribingAll(false);
 setTranscribeAllProgress(null);
 };

 // Create Setlist from Concert
 const handleCreateSetlistFromConcert = () => {
 const trackListToUse = generatedResult ? generatedResult.tracks : tracks;
 if (!trackListToUse || trackListToUse.length === 0) return;

 const setlistTitle = `Directo: ${albumTitle ||'Concierto en Vivo'}`;
 const setlistItems = trackListToUse.map((t, idx) => ({
 id: `i_live_${Date.now()}_${idx}`,
 tipoItem: t.type ==='musica' ?'cancion' :'intro_tema',
 tituloCustom: t.title,
 notaTema: t.speechTranscription || (t.type ==='musica' ? `Tonalidad: ${t.tonalidad ||'Mim'} | BPM: ${t.bpm || 120}` :''),
 duracionEstimadaMinutos: Math.max(1, Math.round(t.duration / 60)),
 duracionEstimadaSegundos: t.duration || 180}));

 const totalMinutos = setlistItems.reduce((acc, it) => acc + (it.duracionEstimadaMinutos || 3), 0);

 const newSetlist = {
 id: `setlist_${Date.now()}`,
 nombre: setlistTitle,
 descripcion: `Setlist generado automáticamente a partir del audio en directo de ${albumTitle ||'Concierto en Vivo'}`,
 tipoFormato:'directo',
 duracionTotalEstimadaMinutos: totalMinutos,
 fechaCreacion: new Date().toISOString().split('T')[0],
 fechaUltimaEdicion: new Date().toISOString().split('T')[0],
 items: setlistItems};

 try {
 if (onSaveSetlist) {
 onSaveSetlist(newSetlist);
 } else {
 const stored = localStorage.getItem('bakandeya_setlists_data') || localStorage.getItem('bakandeya_setlists');
 const setlists = stored ? JSON.parse(stored) : [];
 const updated = [newSetlist, ...(Array.isArray(setlists) ? setlists : [])];
 localStorage.setItem('bakandeya_setlists_data', JSON.stringify(updated));
 localStorage.setItem('bakandeya_setlists', JSON.stringify(updated));
 }

 // Persist to Supabase Backend
 const token = localStorage.getItem('bakandeya_token');
 fetch('/api/setlists', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(newSetlist)
 }).catch(err => console.warn('Could not persist direct setlist to Supabase API:', err));

 alert(`¡Setlist"${setlistTitle}" creado con éxito en tu Gestor de Repertorio/Setlists!`);
 } catch (err) {
 console.warn('Error saving setlist:', err);
 alert('Error al guardar el setlist.');
 }
 };

 const handleSaveToCatalog = () => {
 if (!generatedResult) return;
 onSaveAlbumToCatalog(albumTitle ||'Directo en Vivo', generatedResult.tracks);
 setSavedSuccessMsg(true);
 setTimeout(() => setSavedSuccessMsg(false), 4000);
 };

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
 <div
 className={`relative w-full max-w-5xl my-auto rounded-[var(--r-l)] overflow-hidden ${
 'bg-[var(--surface)] text-[var(--ink)]'
 } max-h-[92vh] flex flex-col`}
 >
 {/* Modal Header */}
 <div
 className={`p-6 flex items-start justify-between ${
' bg-[var(--acc)]/10'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-[var(--r-m)] bg-gradient-to-br from-[var(--acc)] to-amber-600 flex items-center justify-center text-[var(--ink)]/10/30">
 <Disc3 className="w-7 h-7 animate-spin-slow" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-2xl font-black tracking-tight">Live Concert to Album Generator</h2>
 <span className="px-2 py-0.5 text-xs font-bold bg-[var(--acc)]/20 text-[var(--acc)] rounded-full">
 v2.0 Híbrido
 </span>
 </div>
 <p className="text-xs text-[var(--ink-2)] mt-0.5">
 Módulo para transformar conciertos en directo en un Disco completo, separando canciones y presentaciones.
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className={`p-2 rounded-[var(--r-s)] transition-colors ${
 'hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 }`}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Modal Body */}
 <div className="p-6 overflow-y-auto space-y-6 flex-1">
 {errorMessage && (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--alert)]/10 text-[var(--alert)] text-sm flex items-center justify-between">
 <span>⚠️ {errorMessage}</span>
 <button onClick={() => setErrorMessage(null)} className="font-bold text-xs hover:underline">
 Descartar
 </button>
 </div>
 )}

 {/* Step 1: Input & Parameters */}
 <div
 className={`p-5 rounded-[var(--r-m)] space-y-4 ${
 'bg-[var(--surface)]'
 }`}
 >
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold tracking-wider text-[var(--acc)] flex items-center gap-2">
 <Radio className="w-4 h-4" /> 1. Ingesta del Concierto (YouTube o Archivo Local)
 </h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-semibold text-[var(--ink-2)]">
 Enlace de YouTube del Concierto Completo
 </label>
 <button
 type="button"
 onClick={() => setCookieModalOpen(true)}
 className={`text-[11px] font-medium flex items-center gap-1 transition-colors ${
 hasYoutubeCookies
 ?'text-[var(--ok)] hover:text-[var(--ink-2)]'
 :'text-[var(--acc)] hover:text-[var(--acc)]/70 hover:underline'
 }`}
 title="Configura las cookies del canal de la banda para permitir descargas directas en servidor"
 >
 {hasYoutubeCookies ? (
 <>
 <ShieldCheck className="w-3 h-3 text-[var(--ok)]" />
 <span>Canal Vinculado</span>
 </>
 ) : (
 <>
 <Lock className="w-3 h-3" />
 <span>🔐 ¿Es tu canal? Vincular sesión</span>
 </>
 )}
 </button>
 </div>
 <input
 type="text"
 placeholder="https://www.youtube.com/watch?v=..."
 value={youtubeUrl}
 onChange={(e) => setYoutubeUrl(e.target.value)}
 className={`w-full px-3 py-2 text-sm rounded-[var(--r-s)] focus:outline-none focus:ring-2 focus:ring-amber-500 ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
 O Subir Archivo de Vídeo/Audio Local
 </label>
 <input
 type="file"
 accept="video/*,audio/*"
 onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
 className={`w-full text-xs text-[var(--ink-2)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--acc)] file:text-[var(--ink)] hover:file:bg-[var(--acc)]/80 ${
 'bg-[var(--surface)]'
 }`}
 />
 </div>
 </div>

 {/* AI Toggle Option */}
 <div className="pt-2 /60 space-y-2">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <label className="flex items-center gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={useAi}
 onChange={(e) => setUseAi(e.target.checked)}
 className="w-4 h-4 text-[var(--acc)] rounded focus:ring-amber-500 bg-[var(--surface)]"
 />
 <div>
 <span className="text-xs font-bold text-[var(--acc)] flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" /> Usar Gemini 1.5 Flash para Análisis Acústico y Transcripción
 </span>
 <p className="text-[11px] text-[var(--ink-2)]">
 Desactivado = MODO ALGORÍTMICO LOCAL (Zero Cost). Activado = Enriquecimiento IA para nombres y speeches.
 </p>
 </div>
 </label>

 <button
 onClick={handleAnalyzeConcert}
 disabled={isAnalyzing || (!youtubeUrl && !uploadedFile)}
 className="px-5 py-2.5 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-sm text-[var(--ink)]/10/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shrink-0"
 >
 {isAnalyzing ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" /> Analizando...
 </>
 ) : (
 <>
 <Scissors className="w-4 h-4" /> 🔍 Analizar Concierto & Detectar Pistas
 </>
 )}
 </button>
 </div>

 {useAi && (
 <div className="pl-7 pt-1.5 ml-2">
 <label className="flex items-start gap-2.5 cursor-pointer">
 <input
 type="checkbox"
 checked={transcribeFirst}
 onChange={(e) => setTranscribeFirst(e.target.checked)}
 className="w-4 h-4 text-[var(--ok)] rounded focus:ring-emerald-500 bg-[var(--surface)] mt-0.5"
 />
 <div>
 <span className="text-xs font-bold text-[var(--ok)] flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--ok)]" /> 🎤 Transcribir audio completo ANTES de trocear (Ajuste fino de cortes por habla/letra)
 </span>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
 <strong>¿Por qué trocea mejor?</strong> Al transcribir primero el concierto completo, Gemini identifica exactamente dónde termina el cantante de hablar al público y dónde empieza cada letra de canción, ajustando los timestamps de corte para no dejar frases ni acordes cortados.
 </p>
 </div>
 </label>
 </div>
 )}
 </div>

 {isAnalyzing && (
 <div className="p-3 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-xs text-[var(--acc)]/70 flex items-center gap-2">
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span>{analysisStatus}</span>
 </div>
 )}
 </div>

 {/* Step 2: Tracks Editor Table */}
 {tracks.length > 0 && (
 <div className="space-y-4">
 {/* Local File / YouTube Audio Availability Status Banner */}
 {(!audioAvailable || youtubeBlocked) && (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)]/70 text-xs space-y-3">
 <div className="flex items-start gap-2.5">
 <AlertTriangle className="w-5 h-5 text-[var(--acc)] shrink-0 mt-0.5" />
 <div>
 <p className="font-bold text-[var(--ink)] text-sm">
 🎬 Audio y Muestras de YouTube Listos para Escuchar
 </p>
 <p className="text-[var(--acc)]/70/90 mt-1 leading-relaxed">
 Puedes <strong>escuchar las muestras de cada corte</strong> directamente haciendo clic en <strong>"🔊 Escuchar muestra"</strong> (se reproduce el vídeo/audio original de YouTube sincronizado con los timestamps).
 </p>
 <p className="text-[var(--acc)]/80 mt-1 text-[11px]">
 ℹ️ <em>Para trocear físicamente el concierto en archivos MP3 independientes descargables en el servidor o transcribir con Gemini:</em>
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2 pt-1 /20">
 <button
 type="button"
 onClick={() => setCookieModalOpen(true)}
 className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]/70 font-bold rounded-[var(--r-s)] flex items-center gap-1.5 transition-all text-xs"
 title="Configurar cookies de la cuenta de YouTube para descargar automáticamente en el servidor sin bloqueos"
 >
 <Lock className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>{hasYoutubeCookies ?'🔐 Sesión YouTube Activa' :'🔐 Vincular Sesión de la Banda'}</span>
 </button>

 <a
 href={`https://cobalt.tools/#${encodeURIComponent(youtubeUrl ||'')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-3 py-2 bg-[var(--tentative)]/80 hover:bg-[var(--tentative)] text-[var(--ink)] font-bold rounded-[var(--r-s)] flex items-center gap-1.5 transition-all text-xs"
 title="Abrir Cobalt para descargar el MP3 completo de YouTube en 5 segundos y adjuntarlo aquí"
 >
 <Download className="w-3.5 h-3.5" />
 <span>📥 Extraer MP3 (Cobalt)</span>
 <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
 </a>

 <button
 onClick={handleLoadDemoAudio}
 disabled={isLinkingLocalFile}
 className="px-3 py-2 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] font-bold rounded-[var(--r-s)] flex items-center gap-1.5 transition-all text-xs disabled:opacity-50"
 title="Cargar audio de ensayo demo instantáneamente para probar muestras y transcripciones"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--ink)]" />
 <span>✨ Cargar Demo</span>
 </button>

 <label className="px-3.5 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold rounded-[var(--r-s)] cursor-pointer flex items-center justify-center gap-1.5 transition-all text-xs">
 <Upload className="w-4 h-4" />
 <span>{isLinkingLocalFile ?'Subiendo...' :'📁 Adjuntar Archivo Local'}</span>
 <input
 type="file"
 accept="audio/*,video/*"
 onChange={handleAttachLocalAudioFile}
 disabled={isLinkingLocalFile}
 className="hidden"
 />
 </label>
 </div>
 </div>
 )}

 {audioAvailable && analyzedSourcePath && (
 <div className="px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--ok)]/10 text-[var(--ink-2)] text-xs flex items-center justify-between">
 <span className="flex items-center gap-2 font-medium">
 <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span>Audio maestro vinculado: <strong>{analyzedSourcePath.split('/').pop()}</strong>. Muestras de audio y transcriptor listo.</span>
 </span>
 <label className="text-[11px] font-bold text-[var(--ok)] hover:underline cursor-pointer ml-2 shrink-0">
 <span>Cambiar archivo</span>
 <input
 type="file"
 accept="audio/*,video/*"
 onChange={handleAttachLocalAudioFile}
 disabled={isLinkingLocalFile}
 className="hidden"
 />
 </label>
 </div>
 )}

 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[var(--surface)]/60 p-3.5 rounded-[var(--r-m)]">
 <div>
 <h3 className="text-base font-extrabold flex items-center gap-2">
 <Layers className="w-5 h-5 text-[var(--acc)]" />
 2. Tracklist Detectado ({tracks.length} Pistas)
 </h3>
 <p className="text-xs text-[var(--ink-2)]">
 Escucha cada trozo, ajusta títulos y momentos de corte, y clasifica o fusiona canciones y habla.
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {/* Undo & Redo Controls */}
 <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-s)]">
 <button
 onClick={handleUndo}
 disabled={history.length === 0}
 className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
 history.length > 0
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 cursor-pointer'
 :'text-[var(--ink-2)] cursor-not-allowed opacity-50'
 }`}
 title="Deshacer última acción (Ctrl+Z)"
 >
 <Undo2 className="w-3.5 h-3.5" />
 <span>Deshacer</span>
 {history.length > 0 && (
 <span className="text-[10px] bg-[var(--acc)]/30 text-[var(--ink)] px-1 rounded font-sans">
 {history.length}
 </span>
 )}
 </button>

 <button
 onClick={handleRedo}
 disabled={redoStack.length === 0}
 className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
 redoStack.length > 0
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 cursor-pointer'
 :'text-[var(--ink-2)] cursor-not-allowed opacity-50'
 }`}
 title="Rehacer acción cancelada (Ctrl+Y / Ctrl+Shift+Z)"
 >
 <Redo2 className="w-3.5 h-3.5" />
 <span>Rehacer</span>
 </button>
 </div>

 <div className="flex items-center gap-2 mr-2">
 <label className="text-xs font-semibold text-[var(--ink-2)]">Título Disco:</label>
 <input
 type="text"
 value={albumTitle}
 onChange={(e) => setAlbumTitle(e.target.value)}
 className={`px-2.5 py-1 text-xs font-bold rounded ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <button
 onClick={() => setShowQuickNamingModal(true)}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--acc)]/80/30 text-[var(--tentative)]/40 hover:bg-[var(--acc)]/80/50 flex items-center gap-1.5 transition-all"
 title="Abrir asistente para nombrar todos los temas y speeches rápidamente o pegar tu setlist"
 >
 <Tag className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>🏷️ Nombrar Temas & Speeches</span>
 </button>

 <button
 onClick={handleAutoDetectCues}
 disabled={isDetectingCues || tracks.length === 0}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--acc)]/80/30 text-[var(--tentative)]/40 hover:bg-[var(--acc)]/80/50 flex items-center gap-1.5 transition-all"
 title="Analiza la envolvente de audio para detectar con precisión el ataque musical de cada tema, descartando ruidos, charla o aplausos"
 >
 <Target className={`w-3.5 h-3.5 text-[var(--ink-2)] ${isDetectingCues ?'animate-spin' :''}`} />
 <span>{isDetectingCues ?'Detectando CUEs...' :'🎯 Autodetectar CUEs de Inicio'}</span>
 </button>

 {tracks.some((t) => t.type ==='musica' && typeof t.cueIn ==='number' && t.cueIn > 0.2) && (
 <button
 onClick={handleSnapAllTracksToCues}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--ink)] hover:bg-[var(--tentative)] flex items-center gap-1.5 font-bold"
 title="Ajusta automáticamente los tiempos de inicio de todos los temas musicales al punto CUE exacto de entrada musical"
 >
 <Target className="w-3.5 h-3.5" />
 <span>⚡ Ajustar Inicios a CUEs</span>
 </button>
 )}

 <button
 onClick={handleAutoClassifyTracks}
 disabled={isClassifying || isTranscribingAll}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--tentative)]/80/30 text-[var(--tentative)]/60 hover:bg-[var(--tentative)]/80/50 flex items-center gap-1.5 transition-all"
 title="Identificar automáticamente si cada trozo es una canción o un discurso"
 >
 <Wand2 className={`w-3.5 h-3.5 text-[var(--tentative)] ${isClassifying ?'animate-spin' :''}`} />
 {isClassifying ?'Clasificando...' :'⚡ Auto-Clasificar (Música/Diálogo)'}
 </button>

 <button
 onClick={handleTranscribeAllConcert}
 disabled={isTranscribingAll || tracks.length === 0}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--ok)]/30 text-[var(--ink)] hover:bg-[var(--ok)]/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
 title="Transcribir automáticamente todo el concierto (letras, acordes y speeches) usando Gemini IA"
 >
 <Sparkles className={`w-3.5 h-3.5 text-[var(--ok)] ${isTranscribingAll ?'animate-spin' :''}`} />
 {isTranscribingAll
 ? `Transcribiendo (${transcribeAllProgress?.current}/${transcribeAllProgress?.total})...`
 : selectedIndices.length > 0
 ? `🎤 Transcribir Seleccionadas (${selectedIndices.length})`
 :'🎤 Transcribir Todo el Concierto'}
 </button>

 <button
 onClick={() => setExpandAllChords(!expandAllChords)}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--acc)]/80/30 text-[var(--ink)] hover:bg-[var(--acc)]/80/50 flex items-center gap-1.5 transition-all"
 title="Mostrar u ocultar los editores de cifrado y letras de todas las canciones"
 >
 <Music2 className="w-3.5 h-3.5 text-[var(--acc)]" />
 {expandAllChords ?'🙈 Plegar Cifrados' :'📖 Desplegar Todos los Cifrados'}
 </button>

 {selectedIndices.length >= 2 && (
 <button
 onClick={handleMergeSelectedTracks}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--ink)] hover:bg-[var(--acc)]/60 flex items-center gap-1.5 animate-bounce"
 >
 <GitMerge className="w-3.5 h-3.5" />
 Fusionar Seleccionadas ({selectedIndices.length})
 </button>
 )}

 <button
 onClick={() => handleAddCutTrack(tracks.length)}
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" /> Añadir Corte
 </button>
 </div>
 </div>

 {/* Banner suggestion for Pista 1 if it's currently set as song */}
 {tracks.length > 0 && tracks[0].type ==='musica' && (
 <div className="p-3 bg-[var(--tentative)]/5/40 rounded-[var(--r-m)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--tentative)]/60 animate-fade-in">
 <div className="flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-[var(--tentative)] shrink-0" />
 <span>
 <strong>💡 ¿La Pista 1 es la presentación/speech de la banda?</strong> Si incluye palabras de saludo o presentación (incluso con música de fondo o ráfagas), conviértela a Speech:
 </span>
 </div>
 <button
 onClick={() => {
 handleUpdateTrack(1,'type','dialogo');
 if (tracks[0].title.startsWith('Pista 1') || tracks[0].title.startsWith('Tema 1')) {
 handleUpdateTrack(1,'title','Presentación e Intro del Concierto');
 }
 }}
 className="px-3 py-1 bg-[var(--tentative)]/80 hover:bg-[var(--tentative)] text-[var(--ink)] font-bold rounded-[var(--r-s)] text-xs shrink-0 shadow transition-all flex items-center gap-1"
 >
 🗣️ Convertir Pista 1 a Speech / Presentación
 </button>
 </div>
 )}

 {/* Interactive Visual Concert Timeline */}
 {tracks.length > 0 && (
 <div className="bg-[var(--surface)] p-3 rounded-[var(--r-m)] space-y-1.5">
 <div className="flex items-center justify-between text-[11px] font-sans text-[var(--ink-2)]">
 <span className="flex items-center gap-1 font-bold text-[var(--acc)]">
 <Sliders className="w-3.5 h-3.5" /> Línea del Tiempo del Concierto
 </span>
 <span>Duración estimada: {formatSeconds(Math.max(...tracks.map((t) => t.end), 0))}</span>
 </div>
 <div className="h-6 w-full bg-[var(--surface)] rounded-[var(--r-s)] overflow-hidden flex p-0.5 gap-0.5">
 {(() => {
 const totalSecs = Math.max(...tracks.map((t) => t.end), 1);
 return tracks.map((tr) => {
 const pct = Math.max(1, (tr.duration / totalSecs) * 100);
 const isSong = tr.type ==='musica';
 const isExpanded = expandedChordsIndex === tr.index;
 return (
 <div
 key={tr.index}
 style={{ width: `${pct}%` }}
 onClick={() => tr.type ==='musica' && setExpandedChordsIndex(isExpanded ? null : tr.index)}
 className={`h-full rounded relative group cursor-pointer transition-all flex items-center justify-center text-[10px] font-sans font-bold truncate px-1 ${
 isSong ?'bg-[var(--acc)]/80 hover:bg-[var(--acc)]/60 text-[var(--ink)]' :'bg-[var(--tentative)]/80/80 hover:bg-[var(--tentative)] text-[var(--ink)]'
 }`}
 title={`#${tr.index} ${tr.title} (${formatSeconds(tr.duration)})`}
 >
 <span className="truncate">{tr.index}. {tr.title}</span>
 </div>
 );
 });
 })()}
 </div>
 </div>
 )}

 {/* Bulk Transcription Active Progress Banner */}
 {isTranscribingAll && transcribeAllProgress && (
 <div className="bg-[var(--ok-soft)] p-3.5 rounded-[var(--r-m)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--ink)]">
 <div className="flex items-center gap-2.5">
 <Sparkles className="w-5 h-5 text-[var(--ok)] animate-spin shrink-0" />
 <div>
 <div className="font-extrabold text-[var(--ok)]/40 flex items-center gap-1.5">
 <span>Transcribiendo concierto completo con IA</span>
 <span className="text-[10px] bg-[var(--ok)]/20 text-[var(--ink-2)] px-2 py-0.5 rounded-full font-sans">
 {transcribeAllProgress.current} / {transcribeAllProgress.total}
 </span>
 </div>
 <div className="text-[11px] text-[var(--ink-2)]/80 truncate max-w-md">
 Pista actual: <span className="font-semibold text-[var(--ink)]">"{transcribeAllProgress.title}"</span>
 </div>
 </div>
 </div>
 <div className="w-full sm:w-48 bg-[var(--surface)] h-2.5 rounded-full overflow-hidden">
 <div
 className="bg-gradient-to-r from-[var(--ok)] to-[var(--ok-soft)] h-full transition-all duration-300"
 style={{ width: `${(transcribeAllProgress.current / transcribeAllProgress.total) * 100}%` }}
 />
 </div>
 </div>
 )}

 {/* Tracks List */}
 <div className="space-y-2">
 {tracks.map((track, idx) => {
 const isSelected = selectedIndices.includes(track.index);
 const isLoadingPreview = loadingSnippetIndex === track.index;
 const isPlayingThis = playingTrackUrl === track.audioUrl && !!track.audioUrl;

 return (
 <div
 key={track.index}
 className={`p-3.5 rounded-[var(--r-m)] transition-all space-y-2 ${
 isSelected
 ?'bg-[var(--acc)]/15 ring-1 ring-amber-0/50'
 : track.type ==='musica'
 ?' bg-[var(--acc-soft)] /20 hover:/40'
 :' bg-[var(--tentative)]/5/20/20 hover:border-[var(--acc)]/40'
 }`}
 >
 {/* Top Row: Track Controls, Type, Timestamps, and Actions */}
 <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 /60">
 {/* Checkbox, Index & Type Switcher */}
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleToggleSelectTrack(track.index)}
 className="text-[var(--ink-2)] hover:text-[var(--acc)] p-0.5 transition-colors"
 title="Seleccionar para fusionar varias pistas"
 >
 {isSelected ? (
 <CheckSquare className="w-4 h-4 text-[var(--acc)]" />
 ) : (
 <Square className="w-4 h-4 text-[var(--ink-2)]" />
 )}
 </button>

 <span className="w-7 text-center font-sans font-black text-xs text-[var(--ink-2)] bg-[var(--surface)]/90 px-1.5 py-0.5 rounded">
 #{String(track.index).padStart(2,'0')}
 </span>

 <select
 value={track.type}
 onChange={(e) => {
 const newType = e.target.value as'musica' |'dialogo';
 handleUpdateTrack(track.index,'type', newType);
 if (newType ==='dialogo' && (track.title.startsWith('Tema') || track.title.startsWith('Pista'))) {
 handleUpdateTrack(track.index,'title', `Presentación / Speech ${track.index}`);
 } else if (newType ==='musica' && (track.title.startsWith('Presentación') || track.title.startsWith('Speech'))) {
 handleUpdateTrack(track.index,'title', `Tema ${track.index}`);
 }
 }}
 className={`text-xs font-black px-2.5 py-1 rounded-[var(--r-s)] transition-all cursor-pointer ${
 track.type ==='musica'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /50 hover:bg-[var(--acc)]/30'
 :'bg-[var(--tentative)]/20 text-[var(--tentative)]/80/50 hover:bg-[var(--tentative)]/30'
 }`}
 title="Haz clic para alternar entre Canción y Speech/Presentación"
 >
 <option value="musica">🎵 Canción Completa</option>
 <option value="dialogo">🗣️ Speech / Presentación</option>
 </select>
 </div>

 {/* Timestamps & Actions */}
 <div className="flex flex-wrap items-center gap-2">
 {/* Timestamps */}
 <div className="flex items-center gap-1.5 text-xs font-sans bg-[var(--surface)]/80 px-2 py-1 rounded-[var(--r-s)]">
 <span className="text-[var(--ink-2)] text-[11px]">Inicio:</span>
 <input
 type="text"
 value={formatSeconds(track.start)}
 onChange={(e) => handleUpdateTrack(track.index,'start', parseTimeToSeconds(e.target.value))}
 className="w-14 px-1 py-0.5 text-center bg-[var(--surface)] rounded text-[var(--acc)] text-xs font-bold"
 title="Tiempo de inicio (MM:SS)"
 />
 <span className="text-[var(--ink-2)] text-[11px]">Fin:</span>
 <input
 type="text"
 value={formatSeconds(track.end)}
 onChange={(e) => handleUpdateTrack(track.index,'end', parseTimeToSeconds(e.target.value))}
 className="w-14 px-1 py-0.5 text-center bg-[var(--surface)] rounded text-[var(--acc)] text-xs font-bold"
 title="Tiempo de fin (MM:SS)"
 />
 <span className="text-[var(--ink-2)] font-bold text-[11px]">({formatSeconds(track.duration)})</span>
 </div>

 {/* CUE In detected badge & snap buttons */}
 {typeof track.cueIn ==='number' && track.cueIn > 0.1 && (
 <div className="flex items-center gap-1.5 bg-[var(--bg)]/70 text-[var(--tentative)]/40 px-2.5 py-1 rounded-[var(--r-s)] text-xs font-sans">
 <Target className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
 <span className="text-[11px]">
 CUE: <strong>+{track.cueIn.toFixed(1)}s</strong>
 </span>
 <button
 onClick={() => handlePlaySnippetPreview(track, true)}
 className="px-1.5 py-0.5 bg-[var(--acc)]/80 hover:bg-[var(--acc)] text-[var(--ink)] rounded font-sans text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
 title="Reproducir desde el punto CUE de entrada musical"
 >
 <Play className="w-2.5 h-2.5" /> Desde CUE
 </button>
 <button
 onClick={() => handleSnapTrackStartToCue(track.index)}
 className="px-1.5 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)] text-[var(--acc)]/70 hover:text-[var(--ink)] rounded font-sans text-[10px] font-bold transition-all cursor-pointer"
 title="Ajustar tiempo de inicio para que arranque exactamente en este CUE musical"
 >
 ⚡ Ajustar Inicio
 </button>
 </div>
 )}

 {track.hasApplauseIntro && (
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1" title="Se detectó charla o aplauso antes de la entrada musical">
 👏 Charla previa
 </span>
 )}

 {/* Actions */}
 <div className="flex items-center gap-1">
 {/* Play snippet preview button */}
 <button
 onClick={() => handlePlaySnippetPreview(track)}
 disabled={isLoadingPreview}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1 transition-all ${
 isPlayingThis
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--surface)] hover:bg-[var(--acc)] hover:text-[var(--ink)] text-[var(--ink-2)]'
 }`}
 title="Reproducir este trozo para escucharlo y clasificarlo"
 >
 {isLoadingPreview ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span className="hidden sm:inline">Generando...</span>
 </>
 ) : isPlayingThis ? (
 <>
 <Pause className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Pausar</span>
 </>
 ) : (
 <>
 <Play className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Escuchar</span>
 </>
 )}
 </button>

 {/* Split track in two button */}
 <button
 onClick={() => handleSplitTrack(track.index)}
 className="p-1.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--alert)] flex items-center gap-1 text-xs font-bold"
 title="Dividir este tramo en 2 partes"
 >
 <Scissors className="w-3.5 h-3.5" />
 <span className="hidden xl:inline text-[10px]">Dividir</span>
 </button>

 {/* Merge with next button */}
 {idx < tracks.length - 1 && (
 <button
 onClick={() => handleMergeWithNext(track.index)}
 className="p-1.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)]"
 title={`Fusionar con el siguiente (#${track.index + 1})`}
 >
 <Combine className="w-3.5 h-3.5" />
 </button>
 )}

 <button
 onClick={() => handleMoveTrack(track.index,'up')}
 className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)]"
 title="Mover arriba"
 >
 <ArrowUp className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleMoveTrack(track.index,'down')}
 className="p-1 rounded hover:bg-[var(--surface)] text-[var(--ink-2)]"
 title="Mover abajo"
 >
 <ArrowDown className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleDeleteTrack(track.index)}
 className="p-1 rounded hover:bg-[var(--alert)]/20 text-[var(--alert)]"
 title="Eliminar corte"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>

 {/* Prominent Dedicated Title Row with Quick Presets */}
 <div className="pt-2.5 space-y-2">
 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
 <div className="flex items-center gap-1.5 shrink-0">
 {track.type ==='musica' ? (
 <Music2 className="w-4 h-4 text-[var(--acc)]" />
 ) : (
 <span className="text-base">🗣️</span>
 )}
 <label className="text-xs font-black tracking-wide text-[var(--ink-2)]">
 {track.type ==='musica' ?'Nombre del Tema:' :'Nombre del Speech:'}
 </label>
 </div>

 <div className="flex-1 relative">
 <input
 type="text"
 value={track.title}
 onChange={(e) => handleUpdateTrack(track.index,'title', e.target.value)}
 className={`w-full px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] transition-all ${
 'bg-[var(--surface)] text-[var(--ink)] focus:'
 : track.type ==='musica'
 ?'bg-[var(--surface)]/90 /40 text-[var(--acc)] placeholder-[var(--ink-2)] focus: focus:ring-1 focus:ring-amber-400'
 :'bg-[var(--surface)]/90/40 text-[var(--ink)] placeholder-[var(--ink-2)] focus:ring-1 focus:ring-purple-400'
 }`}
 placeholder={
 track.type ==='musica'
 ? `Ej: Tema ${track.index} (o escribe el nombre de la canción)...`
 : `Ej: Presentación de la banda / Saludo al público / Anécdota...`
 }
 />
 {track.title && (
 <button
 type="button"
 onClick={() => handleUpdateTrack(track.index,'title','')}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink-2)] p-0.5"
 title="Limpiar nombre"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Quick Presets for Songs and Speeches */}
 <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-6 text-[11px]">
 <span className="text-[var(--ink-2)] text-[10px] font-semibold">Sugerencias rápidas:</span>
 {track.type ==='dialogo' ? (
 <>
 {['Presentación de la Banda','Saludo al Público','Anécdota / Historia','Agradecimientos','Presentación del Tema','Despedida / Bises'].map((preset) => (
 <button
 key={preset}
 type="button"
 onClick={() => handleUpdateTrack(track.index,'title', preset)}
 className="px-2 py-0.5 rounded bg-[var(--tentative)]/5/60 hover:bg-[var(--tentative)]/60/60 text-[var(--tentative)]/80 text-[10px] font-medium transition-all"
 >
 + {preset}
 </button>
 ))}
 {track.speechTranscription && (
 <button
 type="button"
 onClick={() => handleSuggestTitleFromSpeech(track.index)}
 className="px-2 py-0.5 rounded bg-[var(--tentative)]/80/30 hover:bg-[var(--tentative)]/80/50 text-[var(--tentative)]/60 text-[10px] font-bold transition-all flex items-center gap-1"
 title="Extrae las primeras palabras del speech para usarlas como nombre"
 >
 <Sparkles className="w-3 h-3 text-[var(--tentative)]" />
 <span>💡 Usar frase del speech</span>
 </button>
 )}
 </>
 ) : (
 <>
 {['Intro Instrumental','Solo / Jam','Acústico','Fin de Concierto / Outro','Bis / Encore'].map((preset) => (
 <button
 key={preset}
 type="button"
 onClick={() => {
 if (track.title && !track.title.includes(preset)) {
 handleUpdateTrack(track.index,'title', `${track.title} (${preset})`);
 } else {
 handleUpdateTrack(track.index,'title', `${preset} ${track.index}`);
 }
 }}
 className="px-2 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 text-[10px] font-medium transition-all"
 >
 + {preset}
 </button>
 ))}
 </>
 )}
 </div>
 </div>

 {/* Song Chords & Lyrics Control Row */}
 {track.type ==='musica' && (
 <div className="pl-9 pt-1.5 space-y-2 /60 mt-2">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div className="flex items-center gap-2 text-xs">
 <span className="text-[var(--ink-2)] font-semibold text-[11px]">Ton:</span>
 <input
 type="text"
 value={track.tonalidad ||'Mim'}
 onChange={(e) => handleUpdateTrack(track.index,'tonalidad', e.target.value)}
 className="w-14 px-2 py-0.5 text-center bg-[var(--surface)] rounded text-[var(--acc)] font-bold text-xs"
 placeholder="Mim"
 />
 <span className="text-[var(--ink-2)] font-semibold text-[11px]">BPM:</span>
 <input
 type="number"
 value={track.bpm || 120}
 onChange={(e) => handleUpdateTrack(track.index,'bpm', parseInt(e.target.value) || 120)}
 className="w-14 px-2 py-0.5 text-center bg-[var(--surface)] rounded text-[var(--acc)] font-bold text-xs"
 placeholder="120"
 />
 {track.lyricsWithChords ? (
 <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--ok)]/20 text-[var(--ok)] flex items-center gap-1">
 <Check className="w-3 h-3" /> Cifrado & Letra Listos
 </span>
 ) : (
 <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--surface)] text-[var(--ink-2)]">
 Sin cifrado aún
 </span>
 )}
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => handleTranscribeSongChordsAndLyrics(track)}
 disabled={transcribingChordsIndex === track.index}
 className="px-2.5 py-1 text-[11px] font-bold rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/40 flex items-center gap-1.5 transition-all"
 title="Generar o actualizar automáticamente letra transcrita con cifrado de acordes con Gemini AI"
 >
 <Sparkles className={`w-3 h-3 text-[var(--acc)] ${transcribingChordsIndex === track.index ?'animate-spin' :''}`} />
 {transcribingChordsIndex === track.index ?'Transcribiendo...' :'✨ Re-Transcribir Letra y Acordes'}
 </button>

 <button
 onClick={() => setExpandedChordsIndex(expandedChordsIndex === track.index ? null : track.index)}
 className="px-2.5 py-1 text-[11px] font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1"
 >
 <Music2 className="w-3 h-3 text-[var(--acc)]" />
 {expandedChordsIndex === track.index || expandAllChords ?'Ocultar Cifrado' :'🎼 Ver/Editar Cifrado'}
 {expandedChordsIndex === track.index || expandAllChords ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
 </button>
 </div>
 </div>

 {/* Collapsed Preview snippet of chords/lyrics if populated */}
 {!expandAllChords && expandedChordsIndex !== track.index && track.lyricsWithChords && (
 <div
 onClick={() => setExpandedChordsIndex(track.index)}
 className="p-2.5 bg-[var(--surface)]/90 rounded-[var(--r-m)] font-sans text-[11px] text-[var(--ink)]/90 cursor-pointer hover:/60 transition-all flex items-center justify-between gap-2"
 >
 <div className="truncate italic flex items-center gap-2">
 <Music2 className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
 <span className="font-bold text-[var(--acc)]/70 not-italic">Cifrado:</span>
 <span className="truncate">"{track.lyricsWithChords.split('\n').filter(Boolean).slice(0, 2).join(' /')}"</span>
 </div>
 <span className="text-[10px] bg-[var(--acc)]/20 text-[var(--acc)]/70 px-2 py-0.5 rounded-md font-sans font-bold shrink-0 flex items-center gap-1">
 Ver completo ➔
 </span>
 </div>
 )}

 {/* Expanded Chord Sheet Textarea Editor */}
 {(expandAllChords || expandedChordsIndex === track.index) && (
 <div className="p-3 bg-[var(--surface)] rounded-[var(--r-m)] space-y-2 animate-fade-in">
 <div className="flex items-center justify-between text-xs font-bold text-[var(--ink-2)]">
 <span className="flex items-center gap-1.5 text-[var(--acc)]">
 <Music2 className="w-3.5 h-3.5" /> Editor de Cifrado y Letra (Formato LaCuerda / Ultimate Guitar)
 </span>
 <span className="text-[10px] text-[var(--ink-2)]">Usa [Acorde] antes de la palabra o líneas superiores de acordes</span>
 </div>
 <textarea
 value={track.lyricsWithChords ||''}
 onChange={(e) => handleUpdateTrack(track.index,'lyricsWithChords', e.target.value)}
 placeholder="[Intro]&#10;[Mim] [Do] [Sol] [Re]&#10;&#10;[Verso 1]&#10;[Mim]En la noche del concierto [Do]cantamos juntos..."
 rows={8}
 className="w-full p-3 font-sans text-xs rounded-[var(--r-s)] bg-[var(--surface)] text-[var(--acc)] placeholder-[var(--ink-2)] focus:outline-none focus: leading-relaxed"
 />
 </div>
 )}
 </div>
 )}

 {/* Speech Transcription row */}
 {track.type ==='dialogo' && (
 <div className="pl-9 pt-2 space-y-1.5/20 mt-2">
 <div className="flex items-center justify-between text-xs">
 <span className="text-[11px] font-bold text-[var(--tentative)]/80 flex items-center gap-1.5">
 🗣️ Transcripción del Speech / Intro:
 </span>
 <button
 onClick={() => handleTranscribeSpeech(track)}
 disabled={transcribingIndex === track.index}
 className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-[var(--tentative)]/80/30 text-[var(--tentative)]/80 hover:bg-[var(--tentative)]/80/50 flex items-center gap-1 transition-all"
 >
 <Sparkles className="w-3 h-3 text-[var(--tentative)]" />
 {transcribingIndex === track.index ?'Transcribiendo...' :'Re-Transcribir Speech'}
 </button>
 </div>
 <textarea
 value={track.speechTranscription ||''}
 onChange={(e) => handleUpdateTrack(track.index,'speechTranscription', e.target.value)}
 placeholder="[Intro musical / Palabras del artista al público]..."
 rows={2}
 className="w-full text-xs p-2.5 rounded-[var(--r-s)] bg-[var(--surface)] text-[var(--ink)] placeholder-purple-400/50 focus:outline-none leading-relaxed font-sans"
 />
 </div>
 )}

 {/* Interactive Audio Fragment Scrubber Player - Positioned directly underneath the active track */}
 {activeSnippet && activeSnippet.trackIndex === track.index && (
 <div className="mt-3 p-3.5 bg-[var(--surface)] /60 rounded-[var(--r-m)] space-y-3 animate-fade-in ring-2 ring-amber-0/20">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)] shrink-0">
 <Volume2 className="w-4 h-4" />
 </div>
 <div>
 <span className="text-xs font-black text-[var(--acc)] block">
 Reproductor de Tramo: #{activeSnippet.trackIndex}"{track.title}"
 </span>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">
 Línea de tiempo: {formatSeconds(activeSnippet.start)} ➔ {formatSeconds(activeSnippet.end)}
 </span>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-1.5">
 {/* Jump to detected CUE In if available */}
 {(() => {
 const currentTrack = tracks.find((t) => t.index === activeSnippet.trackIndex);
 if (currentTrack?.cueIn && currentTrack.cueIn > 0.1) {
 return (
 <button
 onClick={() => {
 if (snippetAudioRef.current && currentTrack.cueIn) {
 snippetAudioRef.current.currentTime = currentTrack.cueIn;
 setSnippetCurrentTime(currentTrack.cueIn);
 }
 }}
 className="px-2.5 py-1 text-[10px] font-bold rounded bg-[var(--acc)]/20 text-[var(--ink-3)] hover:bg-[var(--acc)]/40 transition-all flex items-center gap-1 cursor-pointer"
 title="Saltar al CUE In de entrada musical detectado"
 >
 <Target className="w-3 h-3 text-[var(--ink-2)]" />
 <span>🎯 Ir a CUE (+{currentTrack.cueIn.toFixed(1)}s)</span>
 </button>
 );
 }
 return null;
 })()}

 {/* Set start/end markers from current position */}
 <button
 onClick={() => handleSetStartFromCurrentSnippet(activeSnippet.trackIndex)}
 className="px-2.5 py-1 text-[10px] font-bold rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/40 transition-all flex items-center gap-1"
 title="Fijar el punto de inicio de este corte en el segundo actual de reproducción"
 >
 📍 Ajustar Inicio ({formatSeconds(activeSnippet.start + snippetCurrentTime)})
 </button>

 <button
 onClick={() => handleSetEndFromCurrentSnippet(activeSnippet.trackIndex)}
 className="px-2.5 py-1 text-[10px] font-bold rounded bg-[var(--tentative)]/20 text-[var(--tentative)]/80 hover:bg-[var(--tentative)]/40 transition-all flex items-center gap-1"
 title="Fijar el punto final de este corte en el segundo actual de reproducción"
 >
 📍 Ajustar Fin ({formatSeconds(activeSnippet.start + snippetCurrentTime)})
 </button>

 <button
 onClick={() => {
 const currentAbs = Math.max(0, Math.round((activeSnippet.start + snippetCurrentTime) * 10) / 10);
 handleSplitTrack(activeSnippet.trackIndex, currentAbs);
 }}
 className="px-2.5 py-1 text-[10px] font-bold rounded bg-[var(--alert)]/20 text-[var(--ink-2)] hover:bg-[var(--alert)]/40 transition-all flex items-center gap-1"
 title="Dividir este tramo en 2 partes exactamente en el segundo actual de reproducción"
 >
 <Scissors className="w-3 h-3 text-[var(--alert)]" />
 <span>✂️ Dividir en 2 Aquí ({formatSeconds(activeSnippet.start + snippetCurrentTime)})</span>
 </button>

 <button
 onClick={() => setActiveSnippet(null)}
 className="p-1 rounded bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink)]"
 title="Cerrar reproductor"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Media Controller: YouTube Synced Embed OR HTML5 Audio Element */}
 {getYouTubeVideoId(youtubeUrl) && !analyzedSourcePath && !activeSnippet.audioUrl ? (
 <div className="space-y-2">
 <div className="relative rounded-[var(--r-s)] overflow-hidden bg-black aspect-video max-h-56 mx-auto">
 <iframe
 key={`yt-embed-${activeSnippet.trackIndex}-${Math.floor(activeSnippet.start)}`}
 src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(youtubeUrl)}?start=${Math.floor(activeSnippet.start)}&end=${Math.ceil(activeSnippet.end)}&autoplay=1&enablejsapi=1&rel=0`}
 title={track.title}
 className="w-full h-full"
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 />
 </div>
 <div className="flex items-center justify-between text-[11px] text-[var(--acc)]/70 font-sans bg-[var(--surface)]/80 px-3 py-1.5 rounded-[var(--r-s)]">
 <span>▶️ Reproduciendo muestra sincronizada: {formatSeconds(activeSnippet.start)} a {formatSeconds(activeSnippet.end)}</span>
 <span className="text-[var(--ink-2)]">Duración: {formatSeconds(activeSnippet.end - activeSnippet.start)}</span>
 </div>
 </div>
 ) : (
 <>
 {/* Audio element controller */}
 {activeSnippet.audioUrl && (
 <audio
 ref={snippetAudioRef}
 src={activeSnippet.audioUrl}
 autoPlay
 onError={(e) => e.preventDefault()}
 onTimeUpdate={(e) => setSnippetCurrentTime(e.currentTarget.currentTime)}
 onLoadedMetadata={(e) => setSnippetDuration(e.currentTarget.duration)}
 onPlay={() => setSnippetIsPlaying(true)}
 onPause={() => setSnippetIsPlaying(false)}
 onEnded={() => setSnippetIsPlaying(false)}
 />
 )}

 {/* Range Slider Scrubber */}
 <div className="space-y-1">
 <div className="flex items-center justify-between text-xs font-sans font-bold text-[var(--acc)]/70">
 <span>{formatSeconds(snippetCurrentTime)}</span>
 <span className="text-[10px] text-[var(--ink-2)] font-sans">Desplaza la barra para navegar por el tramo</span>
 <span>{formatSeconds(snippetDuration)}</span>
 </div>

 <input
 type="range"
 min={0}
 max={snippetDuration || 100}
 step={0.1}
 value={snippetCurrentTime}
 onChange={(e) => handleSeekSnippet(parseFloat(e.target.value))}
 className="w-full h-2.5 bg-[var(--surface)] rounded-[var(--r-s)] appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
 />
 </div>

 {/* Player Controls Bar */}
 <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
 <div className="flex items-center gap-2">
 <button
 onClick={() => handleSkipSnippet(-5)}
 className="px-2.5 py-1 rounded bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1"
 title="Retroceder 5 segundos"
 >
 <RotateCcw className="w-3.5 h-3.5" /> -5s
 </button>

 <button
 onClick={() => {
 if (snippetAudioRef.current) {
 if (snippetIsPlaying) snippetAudioRef.current.pause();
 else snippetAudioRef.current.play();
 }
 }}
 className="px-4 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-black text-xs flex items-center gap-1.5/10/20"
 >
 {snippetIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
 {snippetIsPlaying ?'Pausar' :'Reproducir'}
 </button>

 <button
 onClick={() => handleSkipSnippet(5)}
 className="px-2.5 py-1 rounded bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-1"
 title="Adelantar 5 segundos"
 >
 <RotateCw className="w-3.5 h-3.5" /> +5s
 </button>
 </div>

 {/* Playback speed selector */}
 <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-[var(--r-s)] text-[11px] font-sans">
 <span className="text-[var(--ink-2)] font-sans px-1 text-[10px]">Velocidad:</span>
 {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
 <button
 key={spd}
 onClick={() => handleChangeSnippetSpeed(spd)}
 className={`px-1.5 py-0.5 rounded font-bold ${
 snippetSpeed === spd ?'bg-[var(--acc)] text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {spd}x
 </button>
 ))}
 </div>
 </div>
 </>
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Action Button: Trocear y Generar Disco */}
 <div className="pt-4 flex justify-end">
 <button
 onClick={handleProcessAndSlice}
 disabled={isProcessing}
 className="px-6 py-3 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--ok)] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-extrabold text-[var(--ink)] text-sm flex items-center gap-2 transition-all"
 >
 {isProcessing ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" /> {processingStatus}
 </>
 ) : (
 <>
 <Scissors className="w-4 h-4" /> ✂️ Trocear Concierto & Crear Disco (.mp3)
 </>
 )}
 </button>
 </div>
 </div>
 )}

 {/* Step 3: Generated Result & Save to Catalog */}
 {generatedResult && (
 <div className="p-5 rounded-[var(--r-l)] bg-gradient-to-br from-emerald-950/40 to-slate-900 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[var(--ok)]/20 flex items-center justify-center text-[var(--ok)]">
 <Check className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-black text-[var(--ok)]">¡Disco Generado con Éxito!</h3>
 <p className="text-xs text-[var(--ink-2)]">
 Archivos cortados y manifiesto web interactivo listos.
 </p>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <a
 href={generatedResult.deliverablePath}
 target="_blank"
 rel="noreferrer"
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1.5"
 >
 <ExternalLink className="w-3.5 h-3.5 text-[var(--acc)]" /> Abrir Repertorio Web
 </a>

 <a
 href={generatedResult.deliverablePath.replace('/index.html','/repertoire.cue')}
 download="repertoire.cue"
 target="_blank"
 rel="noreferrer"
 className="px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] flex items-center gap-1.5"
 title="Descargar mapa de índices para DAWs (Reaper, Cubase, Ableton, Logic)"
 >
 <FileCode className="w-3.5 h-3.5 text-[var(--tentative)]" /> CUE Sheet (.cue)
 </a>

 <button
 onClick={handleCreateSetlistFromConcert}
 className="px-3.5 py-1.5 text-xs font-bold rounded-[var(--r-s)] bg-[var(--tentative)]/80/30 text-[var(--tentative)]/60 hover:bg-[var(--tentative)]/80/50 flex items-center gap-1.5 transition-all"
 >
 <ListPlus className="w-3.5 h-3.5 text-[var(--tentative)]" /> Crear Setlist
 </button>
 </div>
 </div>

 <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
 <p className="text-xs text-[var(--ink-2)]">
 ¿Deseas agregar formalmente este nuevo Álbum con todos sus temas a la Discografía de la Banda?
 </p>

 <button
 onClick={handleSaveToCatalog}
 className="px-6 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/80 font-extrabold text-[var(--ink)] text-xs/10/20 flex items-center gap-2"
 >
 <Disc3 className="w-4 h-4" /> 💾 Guardar como Álbum en la Discografía
 </button>
 </div>

 {savedSuccessMsg && (
 <div className="p-3 bg-[var(--ok)]/20 text-[var(--ink-2)] text-xs rounded-[var(--r-s)] font-bold text-center animate-fade-in">
 ¡Álbum e individualidades guardadas correctamente en la Discografía de la Banda!
 </div>
 )}
 </div>
 )}
 </div>

 {/* Modal de Vinculación de Sesión / Cookies de YouTube */}
 {cookieModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fade-in">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-xl w-full p-6 space-y-4 text-[var(--ink-2)]">
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)]">
 <Key className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-sm font-bold text-[var(--ink-2)]">Vincular Cuenta de YouTube / Cookies</h3>
 <p className="text-[11px] text-[var(--ink-2)]">Permite descargas directas en el servidor sin bloqueos de bot</p>
 </div>
 </div>
 <button
 onClick={() => setCookieModalOpen(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] hover:bg-[var(--surface)]"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {cookieSuccessMsg ? (
 <div className="p-4 bg-[var(--ok)]/20 rounded-[var(--r-m)] text-[var(--ink-2)] text-xs font-bold flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>{cookieSuccessMsg}</span>
 </div>
 ) : (
 <>
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-xs text-[var(--ink-2)] space-y-2 leading-relaxed">
 <p className="font-semibold text-[var(--acc)]/70 flex items-center gap-1.5">
 <ShieldCheck className="w-4 h-4 text-[var(--ok)] shrink-0" />
 ¿Por qué es necesario autenticar el canal de la banda?
 </p>
 <p className="text-[11px] text-[var(--ink-2)]">
 YouTube bloquea las peticiones automáticas desde centros de datos con el mensaje <em>"Sign in to confirm you're not a bot"</em>. Al vincular las cookies de tu cuenta/canal, el servidor se identifica legítimamente y descarga el vídeo o audio completo al instante a máxima velocidad.
 </p>
 <div className="pt-2 text-[11px] text-[var(--ink-2)] space-y-1">
 <p className="font-bold text-[var(--ink-2)]">📌 Cómo obtener las cookies en 10 segundos:</p>
 <p>1. Instala la extensión gratuita de Chrome/Firefox <strong>"Get cookies.txt locally"</strong>.</p>
 <p>2. Abre YouTube con tu cuenta de la banda iniciada.</p>
 <p>3. Haz clic en la extensión, pulsa <strong>"Export"</strong> y pega el contenido aquí o sube el archivo.</p>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1.5">
 <label className="text-xs font-bold text-[var(--ink-2)]">
 Contenido de cookies.txt (formato Netscape):
 </label>
 <label className="text-[11px] font-semibold text-[var(--acc)] hover:text-[var(--acc)]/70 cursor-pointer flex items-center gap-1">
 <Upload className="w-3 h-3" />
 <span>Subir archivo cookies.txt</span>
 <input
 type="file"
 accept=".txt"
 onChange={handleUploadCookieFile}
 className="hidden"
 />
 </label>
 </div>
 <textarea
 rows={5}
 value={cookiesInputText}
 onChange={(e) => setCookiesInputText(e.target.value)}
 placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / TRUE 1789000000 SID ..."
 className="w-full font-sans text-[11px] p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink-2)] focus:outline-none focus:ring-2 focus:ring-amber-500"
 />
 </div>

 <div className="flex items-center justify-between pt-2">
 {hasYoutubeCookies ? (
 <button
 onClick={handleDeleteCookies}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--alert)]/20 hover:bg-[var(--alert)]/30 text-[var(--alert)]/60 text-xs font-bold transition-all"
 >
 Eliminar cookies actuales
 </button>
 ) : (
 <div />
 )}

 <div className="flex items-center gap-2">
 <button
 onClick={() => setCookieModalOpen(false)}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold"
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveCookies}
 disabled={isSavingCookies || !cookiesInputText.trim()}
 className="px-5 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] text-xs font-extrabold/10/20 disabled:opacity-50 flex items-center gap-1.5"
 >
 {isSavingCookies ? (
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <Check className="w-3.5 h-3.5" />
 )}
 <span>Guardar y Habilitar Descargas</span>
 </button>
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 )}
 {/* Modal: Asistente para Nombrar Temas y Speeches */}
 {showQuickNamingModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)]/85 animate-fade-in">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-3xl w-full p-6 space-y-4 text-[var(--ink-2)] max-h-[90vh] flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between pb-3 shrink-0">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--ink-2)]">
 <Tag className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-extrabold text-[var(--ink-2)] flex items-center gap-2">
 <span>Nombrar Temas y Speeches</span>
 <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--ink-2)]">
 {tracks.length} cortes
 </span>
 </h3>
 <p className="text-[11px] text-[var(--ink-2)]">
 Personaliza el título de cada canción o presentación, o pega tu lista/setlist completo en lote
 </p>
 </div>
 </div>
 <button
 onClick={() => setShowQuickNamingModal(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-s)] hover:bg-[var(--surface)] transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-2 pb-2 shrink-0">
 <button
 type="button"
 onClick={() => setQuickNamingActiveTab('table')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1.5 transition-all ${
 quickNamingActiveTab ==='table'
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <Sliders className="w-3.5 h-3.5" />
 <span>Lista Rápida Editable</span>
 </button>

 <button
 type="button"
 onClick={() => setQuickNamingActiveTab('paste')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-bold flex items-center gap-1.5 transition-all ${
 quickNamingActiveTab ==='paste'
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <FileText className="w-3.5 h-3.5" />
 <span>Pegar Setlist / Lista en Bloque</span>
 </button>
 </div>

 {/* Tab 1: Quick Table */}
 {quickNamingActiveTab ==='table' && (
 <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
 <div className="text-[11px] text-[var(--ink-2)] bg-[var(--surface)]/60 p-2.5 rounded-[var(--r-m)] flex items-center justify-between">
 <span>💡 Edita directamente el título de cada corte o cambia su tipo entre 🎵 Canción y 🗣️ Speech. Pulsa Tab para avanzar al siguiente.</span>
 <div className="flex items-center gap-2 text-[10px] font-sans shrink-0">
 <span className="text-[var(--acc)]">🎵 {tracks.filter((t) => t.type ==='musica').length} temas</span>
 <span className="text-[var(--tentative)]">🗣️ {tracks.filter((t) => t.type ==='dialogo').length} speeches</span>
 </div>
 </div>

 <div className="space-y-2">
 {tracks.map((tr) => (
 <div
 key={`quick-rename-${tr.index}`}
 className={`p-2.5 rounded-[var(--r-m)] transition-all flex flex-col sm:flex-row sm:items-center gap-2.5 ${
 tr.type ==='musica'
 ?'bg-[var(--acc-soft)] /20 hover:/40'
 :'bg-[var(--tentative)]/5/20/20 hover:border-[var(--acc)]/40'
 }`}
 >
 {/* Index + Type Toggle Button */}
 <div className="flex items-center gap-2 shrink-0">
 <span className="w-7 text-center font-sans font-black text-xs text-[var(--ink-2)] bg-[var(--surface)] px-1.5 py-1 rounded">
 #{String(tr.index).padStart(2,'0')}
 </span>

 <button
 type="button"
 onClick={() => {
 const newType = tr.type ==='musica' ?'dialogo' :'musica';
 handleUpdateTrack(tr.index,'type', newType);
 if (newType ==='dialogo' && (tr.title.startsWith('Tema') || tr.title.startsWith('Pista'))) {
 handleUpdateTrack(tr.index,'title', `Presentación / Speech ${tr.index}`);
 } else if (newType ==='musica' && (tr.title.startsWith('Presentación') || tr.title.startsWith('Speech'))) {
 handleUpdateTrack(tr.index,'title', `Tema ${tr.index}`);
 }
 }}
 className={`px-2 py-1 rounded-[var(--r-s)] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
 tr.type ==='musica'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /40 hover:bg-[var(--acc)]/30'
 :'bg-[var(--tentative)]/20 text-[var(--tentative)]/80/40 hover:bg-[var(--tentative)]/30'
 }`}
 title="Haz clic para alternar entre Canción y Speech"
 >
 {tr.type ==='musica' ?'🎵 Canción' :'🗣️ Speech'}
 </button>

 <span className="text-[11px] font-sans text-[var(--ink-2)]">
 {formatSeconds(tr.duration)}
 </span>
 </div>

 {/* Title Input */}
 <div className="flex-1 min-w-0 relative">
 <input
 type="text"
 value={tr.title}
 onChange={(e) => handleUpdateTrack(tr.index,'title', e.target.value)}
 placeholder={tr.type ==='musica' ?'Nombre del tema...' :'Nombre de la presentación o speech...'}
 className={`w-full px-3 py-1.5 text-xs font-bold rounded-[var(--r-s)] transition-all ${
 tr.type ==='musica'
 ?'bg-[var(--surface)] /30 text-[var(--acc)] focus:'
 :'bg-[var(--surface)]/30 text-[var(--ink)] }`}
 />
 {tr.title && (
 <button
 type="button"
 onClick={() => handleUpdateTrack(tr.index,'title','')}
 className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </div>

 {/* Quick Presets Per Row */}
 <div className="flex items-center gap-1 shrink-0">
 {tr.type ==='dialogo' ? (
 <>
 <button
 type="button"
 onClick={() => handleUpdateTrack(tr.index,'title','Presentación de la Banda')}
 className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)]/80 text-[10px]"
 >
 Banda
 </button>
 <button
 type="button"
 onClick={() => handleUpdateTrack(tr.index,'title','Saludo al Público')}
 className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)]/80 text-[10px]"
 >
 Saludo
 </button>
 <button
 type="button"
 onClick={() => handleUpdateTrack(tr.index,'title','Despedida / Bises')}
 className="px-1.5 py-0.5 rounded bg-[var(--tentative)]/5 hover:bg-[var(--tentative)]/60 text-[var(--tentative)]/80 text-[10px]"
 >
 Despedida
 </button>
 </>
 ) : (
 <>
 <button
 type="button"
 onClick={() => {
 const base = tr.title.replace(/\s*\((?:Intro|Outro|Acústico)\)/gi,'');
 handleUpdateTrack(tr.index,'title', `${base} (Intro)`);
 }}
 className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 text-[10px]"
 >
 +Intro
 </button>
 <button
 type="button"
 onClick={() => {
 const base = tr.title.replace(/\s*\((?:Intro|Outro|Acústico)\)/gi,'');
 handleUpdateTrack(tr.index,'title', `${base} (Acústico)`);
 }}
 className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 text-[10px]"
 >
 +Acústico
 </button>
 <button
 type="button"
 onClick={() => {
 const base = tr.title.replace(/\s*\((?:Intro|Outro|Acústico)\)/gi,'');
 handleUpdateTrack(tr.index,'title', `${base} (Outro)`);
 }}
 className="px-1.5 py-0.5 rounded bg-[var(--acc-soft)] hover:bg-[var(--acc-soft)] text-[var(--acc)]/70 text-[10px]"
 >
 +Outro
 </button>
 </>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Tab 2: Batch Paste */}
 {quickNamingActiveTab ==='paste' && (
 <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] text-xs text-[var(--ink-2)] space-y-2">
 <p className="font-bold text-[var(--ink-2)] flex items-center gap-1.5">
 <Sparkles className="w-4 h-4 text-[var(--ink-2)]" />
 Pega el Setlist o Lista de Canciones y Speeches (una por línea)
 </p>
 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
 Copia la lista desde tu WhatsApp, notas o papel de escenario y pégala aquí. El asistente asignará cada línea a la pista correspondiente (#1, #2, #3...) y limpiará automáticamente números iniciales ("1.","01 -", etc.).
 </p>
 <p className="text-[11px] text-[var(--tentative)]/80">
 💡 Si una línea contiene palabras como <em>"speech"</em>, <em>"presentación"</em>, <em>"saludo"</em>, <em>"charla"</em> o <em>"agradecimientos"</em>, la clasificará automáticamente como Speech.
 </p>
 </div>

 <textarea
 value={batchPastedText}
 onChange={(e) => setBatchPastedText(e.target.value)}
 rows={10}
 placeholder={`1. Intro y Saludo al Público\n2. Noches de Garaje\n3. Charla sobre el nuevo disco\n4. Ska del Norte\n5. Canto a la Sombra\n6. Presentación de los músicos\n7. Gira Sin Fin`}
 className="w-full p-3 font-sans text-xs rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink-2)] placeholder-[var(--ink-2)] focus:outline-none leading-relaxed"
 />

 <div className="flex items-center justify-between text-xs text-[var(--ink-2)]">
 <span>
 Líneas detectadas:{''}
 <strong className="text-[var(--ink-2)]">
 {batchPastedText.split('\n').filter((l) => l.trim().length > 0).length}
 </strong>{''}
 / Cortes en concierto: <strong className="text-[var(--acc)]">{tracks.length}</strong>
 </span>

 <button
 type="button"
 onClick={handleApplyBatchPastedNames}
 disabled={!batchPastedText.trim()}
 className="px-4 py-2 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] font-extrabold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
 >
 <Check className="w-4 h-4" />
 <span>Aplicar Nombres a las Pistas</span>
 </button>
 </div>
 </div>
 )}

 {/* Footer */}
 <div className="pt-3 flex justify-end shrink-0">
 <button
 type="button"
 onClick={() => setShowQuickNamingModal(false)}
 className="px-5 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-bold transition-colors"
 >
 Listo / Cerrar
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </ModalPortal>
 );
};

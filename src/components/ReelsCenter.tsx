import React, { useState, useEffect } from'react';
import { ThemeColors, SocialPost, SocialMetric } from'../types';
import { apiFetch } from'../utils/api';
import { 
 Sparkles, Play, Flame, Heart, MessageCircle, Share2, Music, 
 Upload, Layers, CheckCircle2, RotateCcw, AlertCircle, RefreshCw,
 Video, Calendar, Clock, Trash2, Film, Check, ExternalLink, Gauge, ChevronRight, ChevronLeft,
 Plus, TrendingUp, LineChart, Instagram, Youtube, Edit, Table,
 Volume2, VolumeX, Maximize2, X, Star, Bookmark, ThumbsUp
} from'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from'recharts';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';

interface ReelsCenterProps {
 colors: ThemeColors;
 posts: SocialPost[];
 onAddPost: (post: SocialPost) => Promise<void>;
 onUpdatePost: (id: string, updatedFields: Partial<SocialPost>) => Promise<void>;
 metrics?: SocialMetric[];
 onAddMetric?: (metric: SocialMetric) => Promise<void>;
 onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
 onDeleteMetric?: (id: string) => Promise<void>;
 bandName?: string;
 instagramHandle?: string;
 /** El backend ya rastrea Instagram, TikTok, YouTube y Facebook: basta con tener uno configurado. */
 hasAnySocialLink?: boolean;
}

import {
 ReelCard,
 HighlightClip,
 OptimalTime,
 getYouTubeId,
 getStartTimeInSeconds,
 defaultScheduleDate,
 validateScheduleReadiness,
 getCadenceWarnings
} from'../utils/reelsUtils';
import { BandToneModal, ToneAnalysisData } from'./bandCRM/BandToneModal';

export type { ReelCard, HighlightClip, OptimalTime };

export interface YoutubeVideoMeta {
 videoId: string;
 title: string;
 author: string;
 duration: number;
 durationKnown: boolean;
 thumbnail: string;
 hasTranscript: boolean;
 transcriptLines: number;
 isLive?: boolean;
}

/** Clave estable para un archivo local: no sube el vídeo, solo permite reconocerlo si se
 * vuelve a abrir el mismo (mismo nombre y tamaño) para recuperar su análisis guardado. */
function videoKeyDeArchivo(file: { name: string; size: number } | null): string | undefined {
 if (!file) return undefined;
 return `file:${file.name}-${file.size}`;
}

function parseRangeTimes(rangeStr?: string) {
 if (!rangeStr) return { start: 0, end: 0, duration: 0 };
 const parts = rangeStr.split('-');
 const startStr = parts[0]?.trim() ||'';
 const endStr = parts[1]?.trim() ||'';
 
 const parseTime = (timeStr: string) => {
 const timeParts = timeStr.split(':');
 if (timeParts.length === 3) {
 const hrs = parseInt(timeParts[0], 10) || 0;
 const mins = parseInt(timeParts[1], 10) || 0;
 const secs = parseInt(timeParts[2], 10) || 0;
 return hrs * 3600 + mins * 60 + secs;
 } else if (timeParts.length === 2) {
 const mins = parseInt(timeParts[0], 10) || 0;
 const secs = parseInt(timeParts[1], 10) || 0;
 return mins * 60 + secs;
 } else if (timeParts.length === 1) {
 return parseInt(timeParts[0], 10) || 0;
 }
 return 0;
 };

 const start = parseTime(startStr);
 const end = parseTime(endStr);
 const duration = Math.max(0, end - start);
 return { start, end, duration };
}

function formatTime(seconds: number): string {
 const mins = Math.floor(seconds / 60);
 const secs = seconds % 60;
 return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

// El tono no es el mismo en cada red (Facebook más institucional, TikTok más gamberro...), así
// que el texto que se propone para programar el post tiene que seguir a la red elegida, no
// enseñar siempre el copy de Instagram aunque el usuario haya marcado TikTok o Facebook.
function copyForPlatform(clip: HighlightClip | undefined | null, platform:'Instagram' |'TikTok' |'YouTube' |'Facebook'): string {
 if (!clip) return'';
 if (platform ==='TikTok') return clip.copyTikTok || clip.recommendedCopy ||'';
 if (platform ==='YouTube') return clip.copyYouTube || clip.recommendedCopy ||'';
 if (platform ==='Facebook') return clip.copyFacebook || clip.recommendedCopy ||'';
 return clip.recommendedCopy ||'';
}

// Qué iconos de interacción tapan el lateral derecho del vídeo en cada red: no es solo el
// copy lo que cambia por plataforma, la propia UI de la app también se come parte del encuadre
// de forma distinta (Instagram añade guardar, YouTube separa like/dislike, etc.), así que un
// hookText o un subtítulo pegado al borde derecho puede quedar tapado en una red y no en otra.
const PLATFORM_UI_ICONS: Record<'Instagram' |'TikTok' |'YouTube' |'Facebook', typeof Heart[]> = {
 Instagram: [Heart, MessageCircle, Share2, Bookmark],
 TikTok: [Heart, MessageCircle, Bookmark, Share2],
 YouTube: [ThumbsUp, MessageCircle, Share2],
 Facebook: [ThumbsUp, MessageCircle, Share2]
};

export default function ReelsCenter({
 colors,
 posts = [],
 onAddPost,
 onUpdatePost,
 metrics = [],
 onAddMetric,
 onUpdateMetric,
 onDeleteMetric,
 bandName,
 instagramHandle,
 hasAnySocialLink
}: ReelsCenterProps) {
 // Tabs:'pipeline' (existing Kanban + Writer) vs'analyzer' (new AI Video Highlight Extractor)
 const [activeTab, setActiveTab] = useState<'pipeline' |'analyzer'>('pipeline');

 // Esta pantalla estaba llena de"Bakandeya" a pelo, así que cualquier otra banda veía por
 // todas partes el nombre de la banda del fundador en vez del suyo.
 const nombreBanda = (bandName ||'').trim() ||'tu banda';

 // Band Tone Analysis State
 const [isBakandeyaToneModalOpen, setIsBakandeyaToneModalOpen] = useState(false);
 const [bakandeyaToneData, setBakandeyaToneData] = useState<ToneAnalysisData | null>(null);
 const [isAnalyzingBakandeyaTone, setIsAnalyzingBakandeyaTone] = useState(false);
 // Si el backend confirmó que guardó el ADN de tono en Supabase (y no solo en esta pantalla).
 // El usuario preguntó explícitamente si esto se guardaba: antes no había forma de saberlo.
 const [toneAnalysisSaved, setToneAnalysisSaved] = useState(false);

 // Abrir el modal disparaba SIEMPRE un análisis nuevo con IA, aunque ya hubiera un ADN guardado
 // (de una edición manual o de un análisis anterior): cada vez que el usuario solo quería
 // consultarlo, se lo pisaba con un resultado nuevo de la IA y perdía sus correcciones a mano.
 // Ahora primero se mira qué hay ya guardado; solo se lanza la IA si no hay nada todavía.
 const handleOpenToneModal = async () => {
 setIsBakandeyaToneModalOpen(true);
 setIsAnalyzingBakandeyaTone(true);
 try {
 const res = await apiFetch('/api/bands/tone-dna');
 const json = res as any;
 if (json?.success && json.data) {
 setBakandeyaToneData(json.data);
 setToneAnalysisSaved(true);
 setIsAnalyzingBakandeyaTone(false);
 return;
 }
 } catch (err) {
 console.error('Error cargando el ADN de tono guardado:', err);
 }
 // Sin nada guardado todavía: se cae al análisis con IA de siempre.
 await handleAnalyzeBakandeyaTone();
 };

 // Refresca solo lo guardado en Supabase (incluidas las reglas de Self-Refining Tone DNA
 // recién generadas por"Entrenar ADN de tono ahora"), sin relanzar el rastreo de redes.
 const handleRefreshLearnedRules = async () => {
 try {
 const res = await apiFetch('/api/bands/tone-dna');
 const json = res as any;
 if (json?.success && json.data) {
 setBakandeyaToneData(json.data);
 setToneAnalysisSaved(true);
 }
 } catch (err) {
 console.error('Error refrescando el ADN de tono aprendido:', err);
 }
 };

 // Antes esto analizaba siempre @bakandeya en Instagram, sin importar qué banda estuviera
 // usando la app: el botón"Analizar tono de voz" de CUALQUIER banda escaneaba la cuenta de
 // Instagram del fundador en vez de la suya propia.
 const handleAnalyzeBakandeyaTone = async () => {
 // El backend ya rastrea Instagram, TikTok, YouTube y Facebook (lee el EPK real de la banda),
 // así que exigir Instagram en concreto bloqueaba a cualquier banda que solo tuviera, por
 // ejemplo, TikTok configurado.
 if (!instagramHandle && !hasAnySocialLink) {
 alert('Configura al menos una red social de tu banda (Instagram, TikTok, YouTube o Facebook) en el EPK antes de analizar el tono de voz.');
 return;
 }
 setIsAnalyzingBakandeyaTone(true);
 setIsBakandeyaToneModalOpen(true);
 setToneAnalysisSaved(false);
 try {
 const res = await apiFetch('/api/bands/analyze-tone', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 nombre_entidad: bandName ||'Tu Banda',
 instagram: instagramHandle,
 estilo_musical:'',
 localizacion:'',
 tipo:'Banda / Artista Emisora',
 is_sender: true
 })
 });
 const json = res as any;
 if (json?.success && json.data) {
 setBakandeyaToneData(json.data);
 // El backend guarda el ADN en Supabase de forma automática cuando is_sender es true;
 // savedPermanently confirma que la escritura no falló, para poder decírselo al usuario.
 setToneAnalysisSaved(Boolean(json.savedPermanently));
 }
 } catch (err) {
 console.error('Error analyzing Bakandeya tone:', err);
 } finally {
 setIsAnalyzingBakandeyaTone(false);
 }
 };

 // Sync state
 const [isSyncingReels, setIsSyncingReels] = useState(false);
 const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
 const [syncErrorMessage, setSyncErrorMessage] = useState('');

 const handleSyncReels = async () => {
 setIsSyncingReels(true);
 setSyncSuccessMessage('');
 setSyncErrorMessage('');
 try {
 const res = await fetch('/api/posts/sync', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setSyncSuccessMessage(data.message ||'Publicaciones y Reels sincronizados con éxito.');
 // clear after 6 seconds
 setTimeout(() => setSyncSuccessMessage(''), 6000);
 } else {
 setSyncErrorMessage(data.error ||'Error al intentar sincronizar los Reels.');
 }
 } catch (error) {
 console.error('Error synchronizing reels:', error);
 setSyncErrorMessage('Error de conexión con el servidor.');
 } finally {
 setIsSyncingReels(false);
 }
 };

 const [selectedPostInPhone, setSelectedPostInPhone] = useState<SocialPost | null>(null);
 const [reelIdea, setReelIdea] = useState('');
 const [generatedCopy, setGeneratedCopy] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [uploadProgress, setUploadProgress] = useState<number | null>(null);

 // New AI Analyzer States
 const [inputType, setInputType] = useState<'file' |'youtube'>('file');
 const [youtubeUrl, setYoutubeUrl] = useState('');
 const [dragActive, setDragActive] = useState(false);
 const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
 const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
 // Duración real del archivo subido. Sin ella, al analizar un vídeo local el backend
 // trabajaba a ciegas y repartía los cortes sobre una duración inventada.
 const [localVideoDuration, setLocalVideoDuration] = useState<number>(0);
 const [isPreviewMuted, setIsPreviewMuted] = useState(true);
 const [isExpandedPreview, setIsExpandedPreview] = useState(false);

 useEffect(() => {
 if (isExpandedPreview) {
 document.body.style.overflow ='hidden';
 setTimeout(() => {
 const modalEl = document.getElementById('theater-mode-modal');
 if (modalEl) modalEl.scrollTop = 0;
 window.scrollTo({ top: 0, behavior:'instant' as any });
 }, 10);
 } else {
 document.body.style.overflow ='';
 }
 return () => {
 document.body.style.overflow ='';
 };
 }, [isExpandedPreview]);

 const [videoTopic, setVideoTopic] = useState('');
 // Duración objetivo del CLIP que queremos sacar (15/30/60), no la del vídeo de origen.
 const [videoDuration, setVideoDuration] = useState(30);
 const [isAnalyzing, setIsAnalyzing] = useState(false);

 // Ficha real del vídeo de YouTube. Antes la línea de tiempo asumía siempre 120 s, así que
 // en un directo de 40 minutos los marcadores no se correspondían con nada.
 const [videoMeta, setVideoMeta] = useState<YoutubeVideoMeta | null>(null);
 const [isFetchingMeta, setIsFetchingMeta] = useState(false);
 const [metaError, setMetaError] = useState<string | null>(null);
 const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
 // Tramos con más volumen medidos en el audio real. Es lo que permite acertar en material
 // instrumental, donde no hay transcripción de la que tirar.
 const [energyWindows, setEnergyWindows] = useState<Array<{ start: number; end: number; score: number }>>([]);
 // Versión con el desglose por señal (volumen / arranque / ritmo visual). Cuando el backend
 // no llega a calcularla (p.ej. sin yt-dlp para leer el audio en streaming) se cae a
 // energyWindows, que solo trae el score combinado.
 const [viralWindows, setViralWindows] = useState<Array<{
 start: number; end: number; energia: number; arranque: number; dinamismo: number; score: number; motivo: string;
 }>>([]);

 // Opciones de renderizado del clip físico
 const [cropMode, setCropMode] = useState<'crop' |'blur' |'none'>('crop');
 const [burnSubtitles, setBurnSubtitles] = useState(false);
 // Resaltado palabra por palabra (estilo TikTok/CapCut) en vez del subtítulo estático de siempre.
 const [karaokeSubtitles, setKaraokeSubtitles] = useState(true);
 const [loadingStep, setLoadingStep] = useState(0);
 const [analysisError, setAnalysisError] = useState<string | null>(null);
 
 // Results from Backend
 const [highlights, setHighlights] = useState<HighlightClip[]>([]);
 const [optimalTime, setOptimalTime] = useState<OptimalTime | null>(null);
 const [selectedHighlightIndex, setSelectedHighlightIndex] = useState<number>(0);
 const [simulatedTime, setSimulatedTime] = useState<number>(0);
 const [ytLoopCount, setYtLoopCount] = useState<number>(0);
 const [draggingBoundary, setDraggingBoundary] = useState<'start' |'end' | null>(null);

 // Real physical video cutting and subtitle states
 const [renderedClipUrl, setRenderedClipUrl] = useState<string | null>(null);
 const [renderedSubUrl, setRenderedSubUrl] = useState<string | null>(null);
 const [subtitleCues, setSubtitleCues] = useState<Array<{ text: string; start: number; end: number }>>([]);
 const [wordOffsets, setWordOffsets] = useState<Array<{ word: string; start: number; end: number }>>([]);
 const [isWhisperTranscribed, setIsWhisperTranscribed] = useState(false);
 const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
 const [isCuttingVideo, setIsCuttingVideo] = useState(false);
 const [cuttingProgressText, setCuttingProgressText] = useState('');
 const [cuttingError, setCuttingError] = useState<string | null>(null);
 const [sinTranscripcionReal, setSinTranscripcionReal] = useState<boolean>(false);
 const [renderedClipSize, setRenderedClipSize] = useState<number>(0);
 const [renderedBurnedSubs, setRenderedBurnedSubs] = useState<boolean>(false);
 // Si el clip se subió a Supabase Storage sobrevive a un redeploy; si no, solo vive en el
 // disco del servidor hasta el próximo despliegue.
 const [renderedStoredPermanently, setRenderedStoredPermanently] = useState<boolean>(false);
 // Cuándo se guardó el análisis que se está viendo, si viene recuperado de la BD en vez de
 // recién calculado. null cuando el análisis en pantalla es fresco (o no hay ninguno).
 const [loadedFromSaveAt, setLoadedFromSaveAt] = useState<string | null>(null);
 // Cómo está grabado el material: cambia qué busca la IA y cómo titula.'auto' deja que el
 // servidor lo adivine del título/descripción reales; el usuario puede fijarlo a mano.
 const [contentType, setContentType] = useState<'auto' |'concierto' |'videoclip' |'ensayo'>('auto');
 const [detectedContentType, setDetectedContentType] = useState<string | null>(null);

 // Al escribir/pegar una URL de YouTube pedimos su ficha real (título, duración, canal,
 // si tiene subtítulos). Sin esto trabajábamos a ciegas y la línea de tiempo mentía.
 useEffect(() => {
 const videoId = getYouTubeId(youtubeUrl);
 if (inputType !=='youtube' || !videoId) {
 setVideoMeta(null);
 setMetaError(null);
 setIsFetchingMeta(false);
 return;
 }

 if (videoMeta && videoMeta.videoId === videoId) return;

 let cancelado = false;
 setIsFetchingMeta(true);
 setMetaError(null);

 const temporizador = setTimeout(async () => {
 try {
 const data = await apiFetch<any>(`/api/youtube-meta?url=${encodeURIComponent(youtubeUrl)}`);
 if (cancelado) return;
 if (data?.success && data.meta) {
 setVideoMeta(data.meta as YoutubeVideoMeta);
 // Rellenamos el contexto con el título real en vez del texto genérico de relleno.
 setVideoTopic(prev => prev.trim() ? prev : (data.meta.title || prev));

 // Si este vídeo ya se analizó antes, recuperamos ese análisis en vez de dejar la
 // pantalla vacía hasta que el usuario pulse"Analizar" (y sin gastar otra llamada a
 // Gemini). Solo si no hay ya algo en pantalla: nunca se pisa un análisis en curso.
 try {
 const guardado = await apiFetch<any>(`/api/reel-analysis?youtubeUrl=${encodeURIComponent(youtubeUrl)}`);
 if (!cancelado && guardado?.success && guardado.found) {
 setHighlights(prev => {
 if (prev.length > 0) return prev;
 setSelectedHighlightIndex(0);
 setEditedCopy(copyForPlatform(guardado.highlights?.[0], selectedPlatform));
 setOptimalTime(guardado.optimalTime || null);
 setEnergyWindows(Array.isArray(guardado.energyWindows) ? guardado.energyWindows : []);
 setViralWindows(Array.isArray(guardado.videoMeta?.viralWindows) ? guardado.videoMeta.viralWindows : []);
 setDetectedContentType(guardado.videoMeta?.contentType || null);
 setLoadedFromSaveAt(guardado.savedAt || new Date().toISOString());
 return guardado.highlights || [];
 });
 }
 } catch (err) {
 // Recuperar el análisis guardado es una comodidad: si falla, simplemente no aparece
 // y el flujo normal de"pegar URL y Analizar" sigue funcionando igual.
 console.warn('No se pudo recuperar un análisis guardado:', err);
 }
 } else {
 setMetaError(data?.error ||'No se pudo leer la ficha del vídeo.');
 }
 } catch (err: any) {
 if (!cancelado) setMetaError(err?.message ||'No se pudo leer la ficha del vídeo.');
 } finally {
 if (!cancelado) setIsFetchingMeta(false);
 }
 }, 600);

 return () => {
 cancelado = true;
 clearTimeout(temporizador);
 };
 // videoMeta queda fuera a propósito: solo se relee cuando cambia la URL o el tipo de entrada.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [youtubeUrl, inputType]);

 // Al salir del centro de Reels hay que soltar los blobs: sin esto, el vídeo local y el clip
 // renderizado se quedaban retenidos en memoria hasta recargar la página entera.
 const urlsVivas = React.useRef<{ local: string | null; clip: string | null; subs: string | null }>({
 local: null, clip: null, subs: null
 });

 useEffect(() => {
 urlsVivas.current = { local: localVideoUrl, clip: renderedClipUrl, subs: renderedSubUrl };
 }, [localVideoUrl, renderedClipUrl, renderedSubUrl]);

 useEffect(() => {
 return () => {
 for (const url of Object.values(urlsVivas.current)) {
 if (url && url.startsWith('blob:')) {
 try { URL.revokeObjectURL(url); } catch (err) { /* ya revocado */ }
 }
 }
 };
 }, []);

 /** Duración de referencia para la línea de tiempo: la real si la conocemos. */
 const timelineDuration = React.useMemo(() => {
 if (inputType ==='file' && localVideoDuration > 0) return localVideoDuration;
 if (videoMeta?.durationKnown && videoMeta.duration > 0) return videoMeta.duration;
 const clip = highlights[selectedHighlightIndex];
 const { end } = parseRangeTimes(clip?.range);
 return Math.max(120, end + 30);
 }, [videoMeta, highlights, selectedHighlightIndex, inputType, localVideoDuration]);

 // Clip Re-analysis states
 const [clipUserNote, setClipUserNote] = useState<string>('');
 const [isReanalyzingClip, setIsReanalyzingClip] = useState<boolean>(false);
 const [reanalyzeSuccessMsg, setReanalyzeSuccessMsg] = useState<string | null>(null);
 // Valorar el título/copy anterior con estrellas + decidir si la corrección se recuerda para
 // todos los próximos Reels de la banda o es solo un ajuste puntual de este corte.
 const [clipToneRating, setClipToneRating] = useState<number>(0);
 const [clipContentRating, setClipContentRating] = useState<number>(0);
 const [clipFeedbackScope, setClipFeedbackScope] = useState<'este_reel' |'global'>('este_reel');

 const handleReanalyzeClip = async () => {
 const activeClip = highlights[selectedHighlightIndex];
 if (!activeClip) return;

 setIsReanalyzingClip(true);
 setReanalyzeSuccessMsg(null);

 const { start, duration } = parseRangeTimes(activeClip.range);

 try {
 const response = await apiFetch('/api/reanalyze-clip', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 youtubeUrl,
 fileName: selectedFile?.name,
 videoTitle: videoTopic || selectedFile?.name,
 start,
 duration,
 userNotes: clipUserNote,
 currentTitle: activeClip.title,
 currentCopy: activeClip.recommendedCopy,
 // Para que el highlight reanalizado se actualice también en lo que ya se guardó en BD,
 // no solo en la pantalla actual.
 highlightId: activeClip.id,
 videoKey: inputType ==='file' ? videoKeyDeArchivo(selectedFile) : undefined,
 contentType: contentType !=='auto' ? contentType : (detectedContentType || undefined),
 tonoRating: clipToneRating || undefined,
 contenidoRating: clipContentRating || undefined,
 alcance: clipFeedbackScope
 })
 });

 const data = response as any;
 if (data?.success && data.analysis) {
 const { title, reason, recommendedCopy, hashtags, energyLevel, confidence, hookText, copyTikTok, copyFacebook, cta } = data.analysis;

 let clipActualizado: HighlightClip | null = null;
 setHighlights(prev => prev.map((clip, idx) => {
 if (idx === selectedHighlightIndex) {
 clipActualizado = {
 ...clip,
 title: title || clip.title,
 reason: reason || clip.reason,
 recommendedCopy: recommendedCopy || clip.recommendedCopy,
 hashtags: hashtags || clip.hashtags,
 energyLevel: energyLevel || clip.energyLevel,
 confidence: confidence || clip.confidence,
 hookText: hookText || clip.hookText,
 copyTikTok: copyTikTok || clip.copyTikTok,
 copyFacebook: copyFacebook || clip.copyFacebook,
 cta: cta || clip.cta
 };
 return clipActualizado;
 }
 return clip;
 }));

 if (clipActualizado) {
 setEditedCopy(copyForPlatform(clipActualizado, selectedPlatform));
 }

 const huboFeedback = Boolean(clipUserNote.trim() || clipToneRating || clipContentRating);
 setReanalyzeSuccessMsg(
 data.generatedByAI === false
 ?"Fragmento actualizado (la IA no estaba disponible: se ha usado una plantilla con tus notas)."
 : huboFeedback && clipFeedbackScope ==='global'
 ?"¡Análisis refinado! Este ajuste se recordará también en tus próximos Reels."
 :"¡Análisis del fragmento refinado con éxito!"
 );
 setTimeout(() => setReanalyzeSuccessMsg(null), 5000);
 // Se resetea la valoración tras usarla: es feedback sobre ESA versión, no debe arrastrarse
 // a la siguiente regeneración como si aplicara también a ella.
 setClipToneRating(0);
 setClipContentRating(0);
 } else {
 alert(data?.error ||"No se pudo reanalizar el fragmento.");
 }
 } catch (err) {
 console.error("Error reanalyzing clip:", err);
 alert("Hubo un problema al conectar con el servidor para el reanálisis.");
 } finally {
 setIsReanalyzingClip(false);
 }
 };

 const handleCutPhysicalVideo = async () => {
 const activeClip = highlights[selectedHighlightIndex];
 if (!activeClip || !youtubeUrl) return;

 setIsCuttingVideo(true);
 setCuttingError(null);
 setCuttingProgressText("Conectando con el servidor...");
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setSinTranscripcionReal(false);

 const { start, duration } = parseRangeTimes(activeClip.range);
 const clipId = `reel-${selectedHighlightIndex}-${Date.now()}`;

 const progressSteps = ["Descargando el vídeo de YouTube...","Extrayendo la mejor pista de vídeo y audio disponible...","Preparando ffmpeg...",
`Recortando de ${formatTime(start)} a ${formatTime(start + duration)}...`,
 cropMode ==='blur'
 ?"Componiendo fondo desenfocado en 9:16 (no se recorta a nadie)..."
 : cropMode ==='crop'
 ?"Aplicando encuadre vertical 9:16..."
 :"Manteniendo el encuadre original...","Buscando la transcripción de YouTube para los subtítulos...",
 burnSubtitles ?"Incrustando los subtítulos en la imagen..." :"Generando la pista de subtítulos (.vtt)...","Codificando el MP4 final...","Últimos ajustes..."
 ];

 let currentStep = 0;
 const interval = setInterval(() => {
 if (currentStep < progressSteps.length - 1) {
 currentStep++;
 setCuttingProgressText(progressSteps[currentStep]);
 }
 }, 2500);

 try {
 const res = await apiFetch("/api/cut-video-clip", {
 method:"POST",
 headers: {"Content-Type":"application/json" },
 body: JSON.stringify({
 youtubeUrl,
 start,
 duration,
 clipId,
 cropMode,
 burnSubtitles,
 karaokeSubtitles,
 // Flag antiguo, por si el servidor todavía no está actualizado.
 cropVertical: cropMode !=='none'
 })
 });

 clearInterval(interval);

 // apiFetch ya devuelve el JSON parseado, no una Response: llamar a res.json() aquí
 // reventaba con"res.json is not a function" y res.ok era siempre undefined.
 const data = res as any;
 if (!data?.success) {
 throw new Error(data?.error ||"Error al codificar el clip de vídeo.");
 }

 // Los blobs anteriores dejan de hacer falta en cuanto llega un clip nuevo.
 if (renderedClipUrl && renderedClipUrl.startsWith('blob:')) {
 URL.revokeObjectURL(renderedClipUrl);
 }
 if (renderedSubUrl && renderedSubUrl.startsWith('blob:')) {
 URL.revokeObjectURL(renderedSubUrl);
 }

 // El servidor sirve ahora el clip como archivo estático. El base64 se mantiene como
 // respaldo: metía 30 MB dentro de un JSON y reventaba el límite del body.
 let nuevaUrl: string | null = null;
 if (data.clipUrl) {
 nuevaUrl = String(data.clipUrl);
 } else if (data.videoBase64) {
 const parts = String(data.videoBase64).split(',');
 const mimeString = parts[0].split(':')[1].split(';')[0];
 const byteString = atob(parts[1]);
 const ab = new ArrayBuffer(byteString.length);
 const ia = new Uint8Array(ab);
 for (let i = 0; i < byteString.length; i++) {
 ia[i] = byteString.charCodeAt(i);
 }
 nuevaUrl = URL.createObjectURL(new Blob([ab], { type: mimeString }));
 }

 if (!nuevaUrl) {
 throw new Error("El servidor no devolvió ningún clip renderizado.");
 }
 setRenderedClipUrl(nuevaUrl);
 setRenderedClipSize(Number(data.fileSize) || 0);
 setRenderedBurnedSubs(Boolean(data.burnedSubtitles));
 setRenderedStoredPermanently(Boolean(data.storedPermanently));

 if (data.vttContent) {
 const vttBlob = new Blob([data.vttContent], { type:'text/vtt' });
 setRenderedSubUrl(URL.createObjectURL(vttBlob));
 } else {
 setRenderedSubUrl(null);
 }

 setSubtitleCues(data.subtitles || []);
 setWordOffsets(data.words || []);
 setSinTranscripcionReal(Boolean(data.sinTranscripcionReal));
 setIsWhisperTranscribed(false);
 setCuttingProgressText("¡Clip renderizado y listo para descargar!");
 } catch (err: any) {
 clearInterval(interval);
 setCuttingError(err?.message ||"Error al renderizar el clip.");
 } finally {
 setIsCuttingVideo(false);
 }
 };

 // Global drag handler for timeline dragging
 useEffect(() => {
 if (!draggingBoundary) return;

 const handleGlobalMouseMove = (e: MouseEvent) => {
 const container = document.getElementById('interactive-timeline-container');
 if (!container) return;

 const rect = container.getBoundingClientRect();
 const clickX = e.clientX - rect.left;
 const clickPct = Math.max(0, Math.min(1, clickX / rect.width));
 
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;
 const { start, end } = parseRangeTimes(currentClip.range);
 const totalDuration = timelineDuration;
 const targetSeconds = Math.round(clickPct * totalDuration);

 let newStart = start;
 let newEnd = end;

 if (draggingBoundary ==='start') {
 newStart = Math.max(0, Math.min(targetSeconds, end - 1));
 } else if (draggingBoundary ==='end') {
 // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
 // llegaba a ffmpeg y devolvía un recorte vacío.
 newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 };

 const handleGlobalMouseUp = () => {
 setDraggingBoundary(null);
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 window.addEventListener('mousemove', handleGlobalMouseMove);
 window.addEventListener('mouseup', handleGlobalMouseUp);

 const handleGlobalTouchMove = (e: TouchEvent) => {
 const container = document.getElementById('interactive-timeline-container');
 if (!container) return;

 const rect = container.getBoundingClientRect();
 const touch = e.touches[0];
 if (!touch) return;
 const clickX = touch.clientX - rect.left;
 const clickPct = Math.max(0, Math.min(1, clickX / rect.width));
 
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;
 const { start, end } = parseRangeTimes(currentClip.range);
 const totalDuration = timelineDuration;
 const targetSeconds = Math.round(clickPct * totalDuration);

 let newStart = start;
 let newEnd = end;

 if (draggingBoundary ==='start') {
 newStart = Math.max(0, Math.min(targetSeconds, end - 1));
 } else if (draggingBoundary ==='end') {
 // No dejamos arrastrar más allá del final real del vídeo: un rango imposible
 // llegaba a ffmpeg y devolvía un recorte vacío.
 newEnd = Math.min(totalDuration, Math.max(targetSeconds, start + 1));
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 };

 const handleGlobalTouchEnd = () => {
 setDraggingBoundary(null);
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
 window.addEventListener('touchend', handleGlobalTouchEnd);

 return () => {
 window.removeEventListener('mousemove', handleGlobalMouseMove);
 window.removeEventListener('mouseup', handleGlobalMouseUp);
 window.removeEventListener('touchmove', handleGlobalTouchMove);
 window.removeEventListener('touchend', handleGlobalTouchEnd);
 };
 }, [draggingBoundary, highlights, selectedHighlightIndex, timelineDuration]);

 // Simulated playback time for highlight looping
 useEffect(() => {
 let interval: any = null;
 const currentClip = highlights[selectedHighlightIndex];
 if (currentClip && activeTab ==='analyzer') {
 const { duration } = parseRangeTimes(currentClip.range);
 setSimulatedTime(0);
 setYtLoopCount(0);
 if (duration > 0) {
 interval = setInterval(() => {
 setSimulatedTime((prev) => {
 if (prev >= duration - 1) {
 setYtLoopCount(c => c + 1);
 return 0; // loop back to 0
 }
 return prev + 1;
 });
 }, 1000);
 }
 } else {
 setSimulatedTime(0);
 }
 return () => {
 if (interval) clearInterval(interval);
 };
 }, [selectedHighlightIndex, highlights, activeTab]);

 // Close expanded preview modal when Escape is pressed
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key ==='Escape' && isExpandedPreview) {
 setIsExpandedPreview(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [isExpandedPreview]);
 
 // Form values for Scheduling
 const [editedCopy, setEditedCopy] = useState('');
 const [selectedPlatform, setSelectedPlatform] = useState<'Instagram' |'TikTok' |'YouTube' |'Facebook'>('Instagram');
 const [scheduledDate, setScheduledDate] = useState(() => defaultScheduleDate(1));
 const [scheduledTime, setScheduledTime] = useState('20:30');
 const [isScheduling, setIsScheduling] = useState(false);
 const [schedulingSuccess, setSchedulingSuccess] = useState(false);
 // Antes solo se comprobaba que el copy no estuviera vacío, y en silencio: el botón no hacía
 // nada y no se explicaba por qué. Ahora se avisa de qué falta (hashtag, fecha pasada...).
 const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);
 // Avisos de cadencia (no bloquean programar, son sobre estrategia: dos posts pegados en la
 // misma red, o un hueco largo sin publicar nada).
 const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);
 const [copySuccess, setCopySuccess] = useState(false);

 // Metrics Form States
 const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0]);
 const [metricInsta, setMetricInsta] = useState('');
 const [metricTiktok, setMetricTiktok] = useState('');
 const [metricYoutube, setMetricYoutube] = useState('');
 const [metricNotes, setMetricNotes] = useState('');
 const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
 const [isSavingMetric, setIsSavingMetric] = useState(false);
 const [metricSuccess, setMetricSuccess] = useState('');
 const [isSyncingMetrics, setIsSyncingMetrics] = useState(false);
 const [isScanningMetrics, setIsScanningMetrics] = useState(false);
 // Vídeos reales que devuelve el escaneo de métricas. Arrancaba con cuatro vídeos
 // inventados de Bakandeya (todos apuntando al mismo enlace de relleno), que en cualquier
 // otra banda eran datos falsos de un grupo ajeno.
 const [realVideos, setRealVideos] = useState<any[]>([]);

 const handleSaveMetric = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!metricInsta || !metricTiktok || !metricYoutube) {
 alert("Por favor rellena todos los campos de seguidores.");
 return;
 }

 setIsSavingMetric(true);
 setMetricSuccess('');

 try {
 if (editingMetricId) {
 if (onUpdateMetric) {
 await onUpdateMetric(editingMetricId, {
 fecha: metricDate,
 instagram: parseInt(metricInsta),
 tiktok: parseInt(metricTiktok),
 youtube: parseInt(metricYoutube),
 notas: metricNotes
 });
 setMetricSuccess('✓ Registro actualizado correctamente.');
 }
 } else {
 if (onAddMetric) {
 const newId = `metric-${Date.now()}`;
 await onAddMetric({
 id: newId,
 fecha: metricDate,
 instagram: parseInt(metricInsta),
 tiktok: parseInt(metricTiktok),
 youtube: parseInt(metricYoutube),
 notas: metricNotes
 });
 setMetricSuccess('✓ Nuevo checkpoint registrado correctamente.');
 }
 }

 // Reset form
 setMetricDate(new Date().toISOString().split('T')[0]);
 setMetricInsta('');
 setMetricTiktok('');
 setMetricYoutube('');
 setMetricNotes('');
 setEditingMetricId(null);
 setTimeout(() => setMetricSuccess(''), 4000);
 } catch (error) {
 console.error("Error saving metric:", error);
 } finally {
 setIsSavingMetric(false);
 }
 };

 const handleEditMetricClick = (m: SocialMetric) => {
 setEditingMetricId(m.id);
 setMetricDate(m.fecha);
 setMetricInsta(String(m.instagram));
 setMetricTiktok(String(m.tiktok));
 setMetricYoutube(String(m.youtube));
 setMetricNotes(m.notas);
 };

 const handleCancelEditMetric = () => {
 setEditingMetricId(null);
 setMetricDate(new Date().toISOString().split('T')[0]);
 setMetricInsta('');
 setMetricTiktok('');
 setMetricYoutube('');
 setMetricNotes('');
 };

 const handleSyncMetricsTab = async () => {
 setIsSyncingMetrics(true);
 setMetricSuccess('');
 try {
 const res = await fetch('/api/metrics/sync', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setMetricSuccess('✓ Sincronizado con éxito.');
 setTimeout(() => setMetricSuccess(''), 4000);
 } else {
 alert(data.error ||'Error al sincronizar seguidores.');
 }
 } catch (err) {
 console.error(err);
 alert('Error de conexión.');
 } finally {
 setIsSyncingMetrics(false);
 }
 };

 const handleScanRealMetrics = async () => {
 setIsScanningMetrics(true);
 setMetricSuccess('');
 try {
 const resData = await apiFetch<any>('/api/metrics/real', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 if (resData && resData.success) {
 const { data, metric } = resData;
 if (data) {
 setMetricInsta(data.instagramFollowers?.toString() ||'0');
 setMetricTiktok(data.tiktokFollowers?.toString() ||'0');
 setMetricYoutube(data.youtubeSubscribers?.toString() ||'0');
 setMetricNotes(`Radar Scan. Spotify: ${data.spotifyListeners || 0}`);
 if (data.videos && data.videos.length > 0) {
 setRealVideos(data.videos);
 }
 }

 if (onAddMetric && metric) {
 await onAddMetric(metric);
 }

 setMetricSuccess(`✓ Sincronización en directo realizada desde perfiles oficiales (IG: ${data?.instagramFollowers ?? 0}, TK: ${data?.tiktokFollowers ?? 0}, YT: ${data?.youtubeSubscribers ?? 0}, Spotify: ${data?.spotifyListeners ?? 0}).`);
 setTimeout(() => setMetricSuccess(''), 6000);
 } else {
 alert(resData?.error ||'Error al escanear datos reales.');
 }
 } catch (err: any) {
 console.error(err);
 alert(err?.message ||'Error de conexión al escanear redes reales.');
 } finally {
 setIsScanningMetrics(false);
 }
 };

 // Pasos reales del backend. Los de antes describían un análisis espectral y un modelo de
 // BPM que no existen en ningún sitio del código.
 const getLoadingSteps = () => {
 const firstStep = inputType ==='youtube'
 ?"Leyendo la ficha del vídeo de YouTube..."
 :"Preparando el metraje subido...";
 return [
 firstStep,"Descargando la transcripción con marcas de tiempo (si la hay)...","Midiendo el volumen del audio para localizar los subidones...","Enviando el contexto real de tu banda al modelo...",
 `Buscando los mejores fragmentos de ~${videoDuration} s...`,"Redactando copys, hooks y hashtags..."
 ];
 };

 // Drag & Drop helper
 /**
 * Cambia el vídeo local revocando antes el blob anterior. Elegir otro archivo sin pasar por
 * el botón de"eliminar" dejaba el vídeo previo entero retenido en memoria por su object URL.
 */
 const cambiarVideoLocal = (file: File | null) => {
 setLocalVideoUrl(prev => {
 if (prev && prev.startsWith('blob:')) {
 try { URL.revokeObjectURL(prev); } catch (err) { /* ya revocado */ }
 }
 if (!file) return null;
 try {
 return URL.createObjectURL(file);
 } catch (err) {
 console.error("Error creating Object URL for video:", err);
 return null;
 }
 });
 };

 const handleFileDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setDragActive(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 const file = e.dataTransfer.files[0];
 setSelectedFile({
 name: file.name,
 size: file.size
 });
 setLocalVideoDuration(0);
 cambiarVideoLocal(file);
 // Try to auto-extract context from file name
 const cleanName = file.name.replace(/\.[^/.]+$/,"").replace(/_/g,"").replace(/-/g,"");
 setVideoTopic(cleanName);
 }
 };

 const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files[0]) {
 const file = e.target.files[0];
 setSelectedFile({
 name: file.name,
 size: file.size
 });
 setLocalVideoDuration(0);
 cambiarVideoLocal(file);
 const cleanName = file.name.replace(/\.[^/.]+$/,"").replace(/_/g,"").replace(/-/g,"");
 setVideoTopic(cleanName);
 }
 };

 // Trigger Highlight Extraction via backend API
 const handleAnalyzeVideo = async () => {
 if (inputType ==='file' && !selectedFile) return;
 if (inputType ==='youtube' && !youtubeUrl) return;

 // Reset physical clip and subtitle state for the new video
 setRenderedClipUrl(null);
 setRenderedClipSize(0);
 setRenderedBurnedSubs(false);
 setRenderedStoredPermanently(false);
 setRenderedSubUrl(null);
 setSubtitleCues([]);
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setCurrentSubtitleText('');
 setCuttingError(null);

 setIsAnalyzing(true);
 setAnalysisError(null);
 setAnalysisNotice(null);
 setEnergyWindows([]);
 setViralWindows([]);
 // Un análisis pedido a propósito siempre es fresco, así que no arrastramos el aviso de
 //"esto es lo que había guardado" de una vez anterior.
 setLoadedFromSaveAt(null);
 setLoadingStep(0);
 // El tipo detectado se pisa con el que devuelva este análisis nuevo; hasta entonces no
 // mostramos el de un vídeo anterior.
 setDetectedContentType(null);

 const steps = getLoadingSteps();

 // Simulate stepping for user feedback
 const stepInterval = setInterval(() => {
 setLoadingStep(prev => {
 if (prev < steps.length - 1) return prev + 1;
 return prev;
 });
 }, 1500);

 try {
 const targetYtUrl = inputType ==='youtube' ? youtubeUrl : (youtubeUrl || undefined);
 const res = await apiFetch('/api/analyze-video-highlights', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 fileName: inputType ==='file' ? selectedFile?.name : undefined,
 youtubeUrl: targetYtUrl,
 // targetDuration = cuánto debe durar cada clip; knownDuration = cuánto dura el vídeo.
 // Antes ambas cosas viajaban en el mismo campo y la IA recibía"el vídeo dura 30 s".
 targetDuration: videoDuration,
 knownDuration: inputType ==='file'
 ? (localVideoDuration > 0 ? localVideoDuration : undefined)
 : (videoMeta?.durationKnown ? videoMeta.duration : undefined),
 // Sin esto, un vídeo subido como archivo nunca se podía guardar ni recuperar: el
 // servidor nunca ve el archivo en sí, así que necesita esta clave para reconocerlo.
 videoKey: inputType ==='file' ? videoKeyDeArchivo(selectedFile) : undefined,
 contentType: contentType !=='auto' ? contentType : undefined,
 videoDuration: videoDuration,
 videoTopic: videoTopic || undefined
 })
 });

 clearInterval(stepInterval);

 // apiFetch resuelve ya con el JSON parseado (o lanza si la respuesta no fue 2xx),
 // así que aquí no hay ninguna Response sobre la que llamar a .json().
 const data = res as any;

 if (!data?.success) {
 throw new Error(data?.error || data?.message ||'Error al procesar el vídeo en el servidor. Revisa tu sesión o inténtalo de nuevo.');
 }

 setHighlights(data.highlights || []);
 setOptimalTime(data.optimalTime || null);
 setSelectedHighlightIndex(0);
 setAnalysisNotice(data.notice || null);
 setEnergyWindows(Array.isArray(data.energyWindows) ? data.energyWindows : []);
 setViralWindows(Array.isArray(data.viralWindows) ? data.viralWindows : []);
 setDetectedContentType(data.contentType || null);
 if (data.videoMeta && data.videoMeta.videoId) {
 setVideoMeta(data.videoMeta as YoutubeVideoMeta);
 }
 
 // Initialize editing form fields
 if (data.highlights && data.highlights.length > 0) {
 setEditedCopy(copyForPlatform(data.highlights[0], selectedPlatform) || data.highlights[0].copy ||'');
 }
 if (data.optimalTime) {
 setScheduledDate(data.optimalTime.date ||'2026-07-30');
 setScheduledTime(data.optimalTime.time ||'20:30');
 }
 } catch (err: any) {
 clearInterval(stepInterval);
 setAnalysisError(err.message ||'Error de conexión con la IA.');
 } finally {
 setIsAnalyzing(false);
 }
 };

 // Submit and Schedule Post
 const handleSchedulePost = async (e: React.FormEvent) => {
 e.preventDefault();
 const problemas = validateScheduleReadiness({ copy: editedCopy, scheduledDate, scheduledTime });
 setScheduleErrors(problemas);
 // La cadencia es un aviso, no un bloqueo: se calcula igualmente para enseñarlo junto al post ya programado.
 setScheduleWarnings(getCadenceWarnings({ posts, platform: selectedPlatform, scheduledDate, scheduledTime }));
 if (problemas.length > 0) return;

 setIsScheduling(true);
 setSchedulingSuccess(false);

 try {
 const newPost: SocialPost = {
 id: `post-${Date.now()}`,
 fecha: `${scheduledDate} ${scheduledTime}`,
 plataforma: selectedPlatform,
 contenido: editedCopy,
 estado:'aprobado',
 responsable:'Jon'
 };

 await onAddPost(newPost);
 setSchedulingSuccess(true);
 setScheduleErrors([]);

 // Auto-clear success state after a few seconds
 setTimeout(() => {
 setSchedulingSuccess(false);
 }, 5000);

 } catch (err) {
 console.error("Error al programar publicación:", err);
 alert("Hubo un error al guardar la publicación en el servidor local.");
 } finally {
 setIsScheduling(false);
 }
 };

 // Change active highlight in lighttable
 const handleSelectHighlight = (index: number) => {
 setSelectedHighlightIndex(index);
 // Reset physical cutting states when switching segments
 setRenderedClipUrl(null);
 setRenderedClipSize(0);
 setRenderedBurnedSubs(false);
 setRenderedStoredPermanently(false);
 setRenderedSubUrl(null);
 setSubtitleCues([]);
 setWordOffsets([]);
 setIsWhisperTranscribed(false);
 setCurrentSubtitleText('');
 setCuttingError(null);
 setClipUserNote('');
 setReanalyzeSuccessMsg(null);
 
 const clip = highlights[index];
 if (clip) {
 setEditedCopy(copyForPlatform(clip, selectedPlatform));
 }
 };

 // Copy text to clipboard helper
 const handleCopyToClipboard = (text: string) => {
 if (!text) return;
 navigator.clipboard.writeText(text).then(() => {
 setCopySuccess(true);
 setTimeout(() => setCopySuccess(false), 2000);
 }).catch((err) => {
 console.error("Error copying to clipboard:", err);
 });
 };

 // Crop edit adjustments (Extending or trimming from left or right)
 const handleAdjustCrop = (direction:'start_minus' |'start_plus' |'end_minus' |'end_plus') => {
 const currentClip = highlights[selectedHighlightIndex];
 if (!currentClip) return;

 const { start, end } = parseRangeTimes(currentClip.range);
 let newStart = start;
 let newEnd = end;

 if (direction ==='start_minus') {
 newStart = Math.max(0, start - 1);
 } else if (direction ==='start_plus') {
 newStart = Math.min(end - 1, start + 1);
 } else if (direction ==='end_minus') {
 newEnd = Math.max(start + 1, end - 1);
 } else if (direction ==='end_plus') {
 newEnd = end + 1;
 }

 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
 };

 const newRange = `${formatSecsToMMSS(newStart)}-${formatSecsToMMSS(newEnd)}`;

 // Update state
 setHighlights(prev => prev.map((clip, index) => 
 index === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 setSimulatedTime(0); // reset playback timer to restart from new crop
 setYtLoopCount(c => c + 1); // trigger iframe refresh
 };

 // Move existing pipeline reels
 const moveReel = (id: string, newStage:'draft' |'edit' |'ready') => {
 onUpdatePost(id, { estado: newStage ==='ready' ?'publicado' : newStage ==='edit' ?'aprobado' :'borrador' });
 };

 const handleGenerateCopy = async (style:'hype' |'chill') => {
 setIsGenerating(true);
 try {
 const response = await apiFetch('/api/write-reels-copy', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ idea: reelIdea, style })
 });
 const data = response as any;
 if (data?.success && data.text) {
 setGeneratedCopy(data.text);
 } else {
 alert('Hubo un problema al generar el texto. Mostrando plantilla de respaldo.');
 }
 } catch (err) {
 console.error(err);
 if (style ==='hype') {
 setGeneratedCopy(`⚡️ ¡FUEGO EN EL ESCENARIO! 🔥\n\n${nombreBanda} no tiene freno: ${reelIdea}. ¡Prepárate para sudar la camiseta! 🔥🎸\n\n#MusicaEnDirecto #Directo`);
 } else {
 setGeneratedCopy(`🌊 Respirando hondo, dejando fluir el ritmo... 🍀\n\n${nombreBanda} conectando ideas en el local: ${reelIdea}. Buenas energías para el camino. ✨\n\n#MusicaEnDirecto #Local`);
 }
 } finally {
 setIsGenerating(false);
 }
 };

 const handleSimulateUpload = () => {
 setUploadProgress(0);
 const interval = setInterval(() => {
 setUploadProgress(prev => {
 if (prev === null) return null;
 if (prev >= 100) {
 clearInterval(interval);
 setTimeout(() => setUploadProgress(null), 1500);
 return 100;
 }
 return prev + 10;
 });
 }, 200);
 };

 // Select dynamic display text for phone screen mock
 const phoneText = selectedPostInPhone
 ? selectedPostInPhone.contenido
 : (activeTab ==='analyzer' && highlights.length > 0
 ? editedCopy
 : generatedCopy);

 const phoneTitle = selectedPostInPhone
 ? `${selectedPostInPhone.plataforma} · ${selectedPostInPhone.responsable}`
 : (activeTab ==='analyzer' && highlights.length > 0
 ? (highlights[selectedHighlightIndex]?.title || `Reel de ${nombreBanda}`)
 : `Reels de ${nombreBanda}`);

 const phoneDuration = selectedPostInPhone
 ? selectedPostInPhone.fecha
 : (activeTab ==='analyzer' && highlights.length > 0
 ? (highlights[selectedHighlightIndex]?.range ||'0:30')
 :'0:30');

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const textTitle = isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]';
 const textSub = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';
 const textMuted = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';

 return (
 <div data-modulo="reels" className={`space-y-6 ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink)]'} font-sans w-full max-w-full overflow-x-hidden`}>
 
 {/* Header con Sincronización en Excel */}
 <div className={`flex justify-between items-start md:items-center pb-4 mb-2 gap-4 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 {/* HEADER / TITULO PRINCIPAL */}
 <div className="mb-2">
 <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-[var(--ink)] mb-2">Medios</h1>
 <p className="text-sm font-mono text-[var(--ink-2)] uppercase tracking-widest">Analítica Social y Prensa</p>
 </div>
 <div className="flex gap-2.5 items-center flex-wrap">
 <button
 onClick={handleOpenToneModal}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)] transition-all cursor-pointer shadow-md"
 title={`Ver el tono de voz guardado de ${instagramHandle || nombreBanda}, o analizarlo si todavía no existe`}
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)] animate-pulse" />
 <span>Tono de voz en redes</span>
 </button>

 <button
 id="sync-reels-excel-btn"
 onClick={handleSyncReels}
 disabled={isSyncingReels}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
 isSyncingReels
 ?'bg-[var(--surface)]/80 text-[var(--ink-2)] animate-pulse'
 : isStitchLight
 ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] shadow-sm shadow-indigo-100'
 :'bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc)] -[var(--acc)]/30 shadow-md'
 }`}
 title="Sincronizar todas las publicaciones de redes sociales"
 >
 <RefreshCw className={`w-3 h-3 ${isSyncingReels ?'animate-spin' :''}`} />
 {isSyncingReels ?'Sincronizando...' :'Actualizar en Excel'}
 </button>
 
 <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
 isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--ok)]/10 -[var(--ok)]/20 text-[var(--ok)]'
 }`}>
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" /> Auto-sync
 </span>
 </div>
 </div>

 {/* Notificaciones de Sincronización */}
 {syncSuccessMessage && (
 <div className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ?'bg-emerald-50 text-emerald-800' 
 :'bg-emerald-500/10 -emerald-500/20 text-emerald-400'
 }`}>
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
 <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}
 {syncErrorMessage && (
 <div className={`p-2 px-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ?'bg-rose-50 text-rose-800' 
 :'bg-rose-500/10 -rose-500/20 text-rose-400'
 }`}>
 <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncErrorMessage}</span>
 <button onClick={() => setSyncErrorMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}

 {/* Dynamic Segment Tab Selector */}
 <div className={`flex pb-4 mb-2 flex-wrap gap-3 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <button
 id="tab-btn-pipeline"
 onClick={() => setActiveTab('pipeline')}
 className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300 rounded-[var(--r-m)] cursor-pointer ${
 activeTab ==='pipeline'
 ? isStitchLight
 ?'bg-indigo-600 text-[var(--ink)] font-black shadow-md'
 :'bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-md shadow-[var(--acc)]/10'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--bg)] bg-white'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/50'
 }`}
 >
 Pipeline & Redactor de Copy
 </button>
 <button
 id="tab-btn-analyzer"
 onClick={() => setActiveTab('analyzer')}
 className={`px-5 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300 rounded-[var(--r-m)] flex items-center gap-1.5 cursor-pointer ${
 activeTab ==='analyzer'
 ? isStitchLight
 ?'bg-indigo-600 text-[var(--ink)] font-black shadow-md'
 :'bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-md shadow-[var(--acc)]/10'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--bg)] bg-white'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/50'
 }`}
 >
 <Sparkles className="w-3.5 h-3.5" /> Analizador de Vídeos AI
 </button>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
 
 {/* LEFT COLUMN: ACTIVE WORKSPACE TAB (8 columns) */}
 <div className="xl:col-span-8 space-y-6 flex flex-col justify-between min-w-0">
 
 {activeTab ==='pipeline' ? (
 /* TAB 1: KANBAN PIPELINE AND COPY GENERATOR */
 <div className="space-y-6">
 {/* 1. Pipeline Kanban */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>Pipeline de Reels y Contenido</h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Visualiza los vídeos grabados por la banda en la carretera y arrástralos / muévelos de etapa para coordinar la publicación.
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Borradores */}
 <div className={`space-y-3 rounded-[var(--r-s)] p-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block pb-1.5 ${
 isStitchLight ?'text-indigo-600 -slate-200/80' :'text-[var(--acc)]'
 }`}>Borradores ({posts.filter(r => r.estado ==='borrador').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado ==='borrador').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]'
 } ${
 selectedPostInPhone?.id === post.id
 ? isStitchLight ?'-indigo-600 shadow-sm' :'-[var(--acc)]'
 : isStitchLight ?'-slate-200 hover:-indigo-300' :'-neutral-800 hover:-[#99907c]/30'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma ==='Instagram' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :
 post.plataforma ==='TikTok' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :'bg-[var(--surface)]/80 text-[var(--ink)]'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-[var(--ink-2)]">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <span className="text-[8px] font-mono text-[var(--ink-2)]">{post.fecha}</span>
 <button 
 id={`btn-move-aprobado-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado:'aprobado' }); }}
 className={`text-[8px] font-mono hover:underline cursor-pointer bg-transparent -none p-0 ${isStitchLight ?'text-indigo-600 font-bold' :'text-[var(--acc)]'}`}
 >
 Aprobar →
 </button>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado ==='borrador').length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 gap-2">
 <PublicoSilhouette opacity={0.1} size="small" />
 <p className="text-xs text-[var(--ink-2)]">No hay borradores</p>
 </div>
 )}
 </div>
 </div>

 {/* En Edición / Aprobados */}
 <div className={`space-y-3 rounded-[var(--r-s)] p-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block pb-1.5 ${
 isStitchLight ?'text-indigo-600 -slate-200/80' :'text-[var(--acc)]'
 }`}>En Edición / Aprobados ({posts.filter(r => r.estado ==='aprobado').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado ==='aprobado').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]'
 } ${
 selectedPostInPhone?.id === post.id
 ? isStitchLight ?'-indigo-600 shadow-sm' :'-[var(--acc)]'
 : isStitchLight ?'-slate-200 hover:-indigo-300' :'-neutral-800 hover:-[var(--acc)]/40'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma ==='Instagram' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :
 post.plataforma ==='TikTok' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :'bg-[var(--surface)]/80 text-[var(--ink)]'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-[var(--ink-2)]">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <button 
 id={`btn-move-borrador-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado:'borrador' }); }}
 className="text-[8px] font-mono text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
 >
 ← Borrador
 </button>
 <button 
 id={`btn-move-publicado-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado:'publicado' }); }}
 className="text-[8px] font-mono text-emerald-500 hover:underline cursor-pointer font-bold bg-transparent -none p-0"
 >
 Publicar →
 </button>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado ==='aprobado').length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 gap-2">
 <PublicoSilhouette opacity={0.1} size="small" />
 <p className="text-xs text-[var(--ink-2)]">No hay reels en edición</p>
 </div>
 )}
 </div>
 </div>

 {/* Listos / Publicados */}
 <div className={`space-y-3 rounded-[var(--r-s)] p-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className={`text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold block pb-1.5 ${
 isStitchLight ?'-slate-200/80' :'-neutral-800'
 }`}>Listos / Publicados ({posts.filter(r => r.estado ==='publicado').length})</span>
 <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
 {posts.filter(r => r.estado ==='publicado').map(post => (
 <div 
 key={post.id} 
 onClick={() => setSelectedPostInPhone(post)}
 className={` rounded-md p-2.5 cursor-pointer transition-all space-y-1.5 ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]'
 } ${
 selectedPostInPhone?.id === post.id
 ?'-emerald-500'
 : isStitchLight ?'-slate-200 hover:-emerald-300' :'-neutral-800 hover:-emerald-500/30'
 }`}
 >
 <div className="flex justify-between items-start gap-1">
 <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
 post.plataforma ==='Instagram' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :
 post.plataforma ==='TikTok' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :'bg-[var(--surface)]/80 text-[var(--ink)]'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[8px] font-mono text-[var(--ink-2)]">{post.responsable}</span>
 </div>
 <p className={`text-[11px] font-medium leading-snug font-sans line-clamp-3 ${textTitle}`}>
 {post.contenido}
 </p>
 <div className={`flex justify-between items-center pt-1 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <button 
 id={`btn-move-aprobado-back-${post.id}`}
 onClick={(e) => { e.stopPropagation(); onUpdatePost(post.id, { estado:'aprobado' }); }}
 className="text-[8px] font-mono text-[var(--ink-2)] hover:underline cursor-pointer bg-transparent -none p-0"
 >
 ← Re-editar
 </button>
 <span className="text-[8px] font-mono text-emerald-500 flex items-center gap-0.5 font-bold uppercase tracking-wider">
 <CheckCircle2 className="w-2.5 h-2.5" /> Publicado
 </span>
 </div>
 </div>
 ))}
 {posts.filter(r => r.estado ==='publicado').length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 gap-2">
 <PublicoSilhouette opacity={0.1} size="small" />
 <p className="text-xs text-[var(--ink-2)]">No hay publicaciones completadas</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* 2. Structured Soul AI Writer */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>
 <Sparkles className="w-4 h-4" /> AI Reels Writer (Redacción Estructurada)
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Escribe la idea general del Reels. Elige una de las dos vibras sonoras identitarias de la banda para generar una copia adaptada mediante Gemini.
 </p>
 </div>

 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="block text-[10px] uppercase font-mono tracking-wider text-[var(--ink-2)]">Idea de Contenido o Anécdota</label>
 <textarea
 id="reels-idea-input"
 rows={3}
 value={reelIdea}
 onChange={(e) => setReelIdea(e.target.value)}
 placeholder="Ej: R-violin tocando el violín a toda velocidad o elyar ensayando con el hang pan en el camerino..."
 className={`w-full rounded-[var(--r-s)] p-3 text-xs focus:outline-none font-sans leading-relaxed ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] -[#99907c]/20 text-[var(--ink)] focus:outline-none focus:-[var(--acc)]/50'
 }`}
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
 <div className="lg:col-span-4 space-y-2.5">
 <span className="block text-[9px] uppercase font-mono text-[var(--ink-2)]">Seleccionar Tonalidad AI</span>
 <button
 id="btn-reels-hype"
 onClick={() => handleGenerateCopy('hype')}
 disabled={isGenerating}
 className={`w-full py-3 font-mono font-bold text-xs uppercase tracking-widest rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 ${
 isStitchLight
 ?'bg-indigo-600 text-white hover:bg-indigo-700'
 :'bg-gradient-to-r from-[var(--acc)] to-[var(--accent)] text-[var(--acc-ink)]'
 }`}
 >
 <Flame className="w-4 h-4" /> Balkan Hype 🎺🔥
 </button>
 <button
 id="btn-reels-chill"
 onClick={() => handleGenerateCopy('chill')}
 disabled={isGenerating}
 className={`w-full py-3 font-mono font-bold text-xs uppercase tracking-widest rounded-[var(--r-s)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 ${
 isStitchLight
 ?'bg-white hover:-emerald-400 text-emerald-600'
 :'bg-[var(--surface)] -emerald-500/30 hover:-emerald-500/50 text-emerald-400'
 }`}
 >
 <Music className="w-4 h-4" /> Reggae Chill 🌿🕊️
 </button>

 {isGenerating && (
 <div className="text-[10px] font-mono text-[var(--ink-2)] text-center animate-pulse flex items-center justify-center gap-1.5 mt-2">
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span>Consultando a Gemini...</span>
 </div>
 )}
 </div>

 <div className="lg:col-span-8 space-y-1.5">
 <span className="block text-[9px] uppercase font-mono text-[var(--ink-2)]">Publicación Generada (Listo para copiar)</span>
 <textarea
 id="reels-generated-output"
 rows={6}
 value={generatedCopy}
 onChange={(e) => setGeneratedCopy(e.target.value)}
 className={`w-full rounded-[var(--r-s)] p-3 text-xs font-mono leading-relaxed focus:outline-none ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] -[#99907c]/15 text-[var(--ink-2)] focus:-[var(--acc)]/30'
 }`}
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : (
 /* TAB 2: BRAND NEW AI VIDEO HIGHLIGHT EXTRACTOR */
 <div className="space-y-6">
 
 {/* 1. Drag & Drop & Upload Area */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-3 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>
 <Video className={`w-4 h-4 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`} /> Extraer Highlights de Vídeos de Ensayos / Directos
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Sube tu metraje bruto en formato vídeo o pega un enlace de YouTube. Nuestro modelo buscará ganchos acústicos, transiciones y saltos rítmicos para recortar los mejores 15-60s.
 </p>
 </div>

 {/* Selector de Origen de Vídeo */}
 <div className="flex gap-1.5 p-1 rounded-[var(--r-m)] w-fit" style={{ borderColor: isStitchLight ?'#e2e8f0' :'#2d2d2d' }}>
 <button
 type="button"
 onClick={() => { setInputType('file'); setAnalysisError(null); }}
 className={`px-3.5 py-1.5 text-[10px] font-mono rounded-[var(--r-s)] transition-all cursor-pointer ${
 inputType ==='file'
 ? isStitchLight ?'bg-indigo-600 text-[var(--ink)] font-bold shadow-sm' :'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-sm'
 : isStitchLight ?'text-[var(--ink-2)] hover:text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 📂 Archivo de Vídeo
 </button>
 <button
 type="button"
 onClick={() => { setInputType('youtube'); setAnalysisError(null); }}
 className={`px-3.5 py-1.5 text-[10px] font-mono rounded-[var(--r-s)] transition-all cursor-pointer ${
 inputType ==='youtube'
 ? isStitchLight ?'bg-indigo-600 text-[var(--ink)] font-bold shadow-sm' :'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-sm'
 : isStitchLight ?'text-[var(--ink-2)] hover:text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 📺 Enlace de YouTube
 </button>
 </div>

 {/* Drag & Drop or YouTube Link Input */}
 {inputType ==='file' ? (
 <div
 id="video-dropzone"
 onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
 onDragLeave={() => setDragActive(false)}
 onDrop={handleFileDrop}
 onClick={() => document.getElementById('video-file-input')?.click()}
 className={` -dashed rounded-[var(--r-l)] p-8 text-center cursor-pointer transition-all ${
 dragActive
 ? isStitchLight ?'-indigo-600 bg-indigo-50/50 scale-[1.01]' :'-[var(--acc)] bg-[var(--acc)]/5 scale-[1.01]'
 : selectedFile
 ?'-emerald-500/40 bg-emerald-500/[0.02]'
 : isStitchLight ?'-slate-200 hover:-indigo-400 bg-[var(--bg)]' :'-[#99907c]/25 hover:-[var(--acc)]/40 bg-[var(--surface)]/50'
 }`}
 >
 <input
 id="video-file-input"
 type="file"
 accept="video/*"
 className="hidden"
 onChange={handleFileSelect}
 />
 {selectedFile ? (
 <div className="space-y-3">
 <div className="w-12 h-12 rounded-full bg-emerald-500/10 -emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]'}`}>{selectedFile.name}</p>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
 </div>
 <button
 id="btn-clear-file"
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setSelectedFile(null);
 cambiarVideoLocal(null);
 setLocalVideoDuration(0);
 setHighlights([]);
 setOptimalTime(null);
 setEnergyWindows([]);
 setViralWindows([]);
 setLoadedFromSaveAt(null);
 setDetectedContentType(null);
 }}
 className="text-[10px] font-mono text-rose-500 hover:underline hover:text-rose-600 bg-transparent -none p-0 cursor-pointer"
 >
 Eliminar archivo y elegir otro
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
 isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--acc)]/10 -[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 <Upload className="w-5 h-5" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>Suelta tu vídeo aquí o haz clic para buscar</p>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mt-1">Soporta .mp4, .mov, .m4v (Vídeo bruto de conciertos o ensayos, máx 100MB)</p>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className={` rounded-[var(--r-l)] p-8 transition-all ${
 isStitchLight ?'-slate-200 bg-[var(--bg)]' :'-[#99907c]/25 bg-[var(--surface)]/50'
 }`}>
 <div className="space-y-4 max-w-xl mx-auto text-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
 isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--acc)]/10 -[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 <Youtube className="w-5 h-5" />
 </div>
 <div>
 <p className={`text-xs font-bold ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>Introduce la URL del vídeo de YouTube</p>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mt-1">Extrae highlights de cualquier vídeo público de YouTube, Shorts o directo</p>
 </div>
 <div className="relative">
 <input
 id="youtube-url-input"
 type="url"
 value={youtubeUrl}
 onChange={(e) => setYoutubeUrl(e.target.value)}
 placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
 className={`w-full rounded-[var(--r-m)] pl-3 pr-10 py-2.5 text-xs focus:outline-none font-mono ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink-2)] focus:-[var(--acc)]/50'
 }`}
 />
 {youtubeUrl && (
 <button
 type="button"
 onClick={() => {
 setYoutubeUrl('');
 setHighlights([]);
 setOptimalTime(null);
 setEnergyWindows([]);
 setViralWindows([]);
 setLoadedFromSaveAt(null);
 setDetectedContentType(null);
 }}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-mono bg-transparent -none cursor-pointer"
 >
 ×
 </button>
 )}
 </div>

 {/* Ficha real del vídeo: sin esto el usuario no sabía si la URL era la correcta
 hasta después de gastar un análisis entero. */}
 {isFetchingMeta && (
 <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-[var(--ink-2)] pt-1">
 <RefreshCw className="w-3 h-3 animate-spin" />
 <span>Leyendo la ficha del vídeo...</span>
 </div>
 )}

 {!isFetchingMeta && metaError && (
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 -amber-0/20 text-[10px] text-[var(--acc)]/70 font-mono text-left flex items-start gap-2">
 <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
 <span>{metaError} Puedes analizarlo igualmente, pero los rangos serán aproximados.</span>
 </div>
 )}

 {!isFetchingMeta && videoMeta && (
 <div className={`flex gap-3 items-center p-2.5 rounded-[var(--r-m)] text-left ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]'
 }`}>
 {videoMeta.thumbnail && (
 <img
 src={videoMeta.thumbnail}
 alt=""
 className="w-20 h-12 object-cover rounded-[var(--r-s)] shrink-0"
 loading="lazy"
 />
 )}
 <div className="min-w-0 flex-1 space-y-1">
 <p className={`text-[11px] font-bold truncate ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]'}`}>
 {videoMeta.title ||'Vídeo de YouTube'}
 </p>
 <div className="flex flex-wrap gap-1.5 items-center text-[9px] font-mono">
 {videoMeta.author && <span className="text-[var(--ink-2)] truncate max-w-[120px]">{videoMeta.author}</span>}
 {videoMeta.durationKnown ? (
 <span className={`px-1.5 py-0.5 rounded font-bold ${isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--acc)]/10 text-[var(--acc)]'}`}>
 {formatTime(videoMeta.duration)}
 </span>
 ) : (
 <span className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">duración desconocida</span>
 )}
 <span className={`px-1.5 py-0.5 rounded font-bold ${
 videoMeta.hasTranscript ?'bg-emerald-500/10 text-emerald-400' :'bg-[var(--surface)]/80 text-[var(--ink-2)]'
 }`}>
 {videoMeta.hasTranscript ? `subtítulos ✓ (${videoMeta.transcriptLines})` :'sin subtítulos'}
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Configurations */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-1">
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)]">
 Tipo de material
 {contentType ==='auto' && detectedContentType && (
 <span className="normal-case font-sans text-[var(--ink-2)]"> (detectado: {detectedContentType})</span>
 )}
 </label>
 <select
 id="video-content-type-select"
 value={contentType}
 onChange={(e) => setContentType(e.target.value as typeof contentType)}
 title="Un concierto, un videoclip y un ensayo se buscan y se titulan de forma distinta: cambia qué momentos prioriza la IA."
 className={`w-full rounded-[var(--r-s)] px-3 py-2 text-xs focus:outline-none ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:-[var(--acc)]/50'
 }`}
 >
 <option value="auto">Detectar automáticamente</option>
 <option value="concierto">Concierto / Directo</option>
 <option value="videoclip">Videoclip</option>
 <option value="ensayo">Ensayo / Local</option>
 </select>
 </div>
 <div className="space-y-1">
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)]">Contexto / Anécdota de apoyo (IA)</label>
 <input
 id="video-topic-input"
 type="text"
 value={videoTopic}
 onChange={(e) => setVideoTopic(e.target.value)}
 placeholder="Ej: Solo de violín rápido o improvisación de loops con percusión..."
 className={`w-full rounded-[var(--r-s)] px-3 py-2 text-xs focus:outline-none font-sans ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink-2)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>
 <div className="space-y-1">
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)]">Límite de Duración Deseado</label>
 <select
 id="video-duration-select"
 value={videoDuration}
 onChange={(e) => setVideoDuration(Number(e.target.value))}
 className={`w-full rounded-[var(--r-s)] px-3 py-2 text-xs focus:outline-none ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink)] focus:-[var(--acc)]/50'
 }`}
 >
 <option value={15}>15 segundos (Ideal para Reels cortos / Stories)</option>
 <option value={30}>30 segundos (Súper dinámico / Recomendado)</option>
 <option value={60}>60 segundos (Explicativo completo de bases)</option>
 </select>
 </div>
 </div>

 {/* Aviso de análisis recuperado: sin esto, el usuario no sabría por qué ya hay
 clips sugeridos sin haber pulsado"Analizar" en esta visita. */}
 {loadedFromSaveAt && highlights.length > 0 && !isAnalyzing && (
 <div className={`p-3 rounded-[var(--r-s)] text-xs flex items-center gap-2 ${
 isStitchLight ?'bg-emerald-50 text-emerald-700' :'bg-emerald-500/10 -emerald-500/20 text-[var(--ink-2)]'
 }`}>
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>
 Recuperado el análisis guardado de este vídeo
 ({new Date(loadedFromSaveAt).toLocaleString('es-ES', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}).
 Pulsa"Analizar highlights con IA" si quieres uno nuevo.
 </span>
 </div>
 )}

 {/* Analysis Button */}
 <div className="pt-2">
 <button
 id="btn-analyze-video"
 onClick={handleAnalyzeVideo}
 disabled={(inputType ==='file' ? !selectedFile : !youtubeUrl) || isAnalyzing}
 className={`w-full py-3.5 rounded-[var(--r-m)] font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
 (inputType ==='file' ? selectedFile : youtubeUrl) 
 ? isStitchLight
 ?'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
 :'bg-gradient-to-r from-[var(--acc)] to-[var(--accent)] text-[var(--acc-ink)] shadow-lg shadow-[var(--acc)]/10 hover:scale-[1.01]' 
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed'
 }`}
 >
 {isAnalyzing ? (
 <>
 <RefreshCw className={`w-4 h-4 animate-spin ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--acc-ink)]'}`} />
 <span>PROCESANDO METRAJE...</span>
 </>
 ) : (
 <>
 <Sparkles className={`w-4 h-4 ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--acc-ink)]'}`} />
 <span>ANALIZAR HIGHLIGHTS CON IA</span>
 </>
 )}
 </button>
 </div>

 {/* Loading indicator with detailed analytical logs */}
 {isAnalyzing && (
 <div className={`p-4 rounded-[var(--r-m)] space-y-3 animate-pulse ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/80'}`}>
 <div className="flex justify-between items-center text-[10px] font-mono">
 <span className={`font-bold ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>Estado del análisis:</span>
 <span className="text-[var(--ink-2)]">Paso {loadingStep + 1} de {getLoadingSteps().length}</span>
 </div>
 <p className={`text-[11px] font-mono leading-normal ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink)]'}`}>
 ⚡️ <span className={isStitchLight ?'text-indigo-500' :'text-[var(--acc)]'}>{getLoadingSteps()[loadingStep]}</span>
 </p>
 <div className={`w-full h-1.5 rounded-full overflow-hidden ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 <div 
 className={`h-full transition-all duration-500 ${isStitchLight ?'bg-indigo-600' :'bg-gradient-to-r from-[var(--acc)] to-[var(--accent)]'}`} 
 style={{ width: `${((loadingStep + 1) / getLoadingSteps().length) * 100}%` }}
 />
 </div>
 </div>
 )}

 {analysisError && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-[var(--r-s)] text-rose-400 text-xs flex gap-2 items-center">
 <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
 <span>{analysisError}</span>
 </div>
 )}

 {/* Cuando la IA no ha intervenido lo decimos: antes los cortes de respaldo se
 presentaban como si los hubiera elegido el modelo. */}
 {!analysisError && analysisNotice && (
 <div className="p-3 bg-[var(--acc)]/10 -amber-0/20 rounded-[var(--r-s)] text-[var(--acc)]/70 text-xs flex gap-2 items-start">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{analysisNotice}</span>
 </div>
 )}
 </div>

 {/* 2. Lighttable (Mesa de Luz con los Clips Detectados) */}
 {highlights.length > 0 && (
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>
 <Layers className="w-4 h-4" /> Mesa de Luz de Clips Sugeridos (Highlights)
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Hemos localizado {highlights.length} momentos de alto potencial. Haz clic en un clip para seleccionarlo, previsualizarlo y ajustar su programación.
 </p>
 </div>

 {/* Mapa de señales: si hay desglose (volumen/arranque/ritmo visual) se usa ese, porque
 explica MEJOR por qué se ha elegido cada momento; si no, se cae al de solo energía. */}
 {(viralWindows.length > 0 || energyWindows.length > 0) && timelineDuration > 0 && (() => {
 const ventanas = viralWindows.length > 0 ? viralWindows : energyWindows;
 const conDesglose = viralWindows.length > 0;
 return (
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {conDesglose ?'Señales medidas (volumen · arranque · montaje)' :'Energía medida en el audio'}
 </span>
 <span className="text-[9px] font-mono text-emerald-400">● {ventanas.length} tramos con potencial</span>
 </div>
 <div className={`relative w-full h-7 rounded-[var(--r-s)] overflow-hidden ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 {ventanas.map((v, i) => {
 const izq = Math.max(0, Math.min(100, (v.start / timelineDuration) * 100));
 const ancho = Math.max(0.8, Math.min(100 - izq, ((v.end - v.start) / timelineDuration) * 100));
 const titulo = conDesglose &&'motivo' in v
 ? `${formatTime(v.start)} - ${formatTime(v.end)} · potencial ${v.score}/100\nvolumen ${(v as any).energia} · arranque ${(v as any).arranque} · montaje ${(v as any).dinamismo}\n${(v as any).motivo}`
 : `${formatTime(v.start)} - ${formatTime(v.end)} · energía ${v.score}/100`;
 return (
 <div
 key={`${v.start}-${i}`}
 className="absolute top-0 bottom-0 rounded-sm"
 title={titulo}
 style={{
 left: `${izq}%`,
 width: `${ancho}%`,
 background: isStitchLight ?'#4f46e5' :'var(--acc)',
 opacity: 0.25 + (Math.max(0, Math.min(100, v.score)) / 100) * 0.75
 }}
 />
 );
 })}
 {/* Dónde ha caído el clip seleccionado sobre ese mapa */}
 {(() => {
 const clip = highlights[selectedHighlightIndex];
 if (!clip) return null;
 const { start, end } = parseRangeTimes(clip.range);
 if (end <= start) return null;
 const izq = Math.max(0, Math.min(100, (start / timelineDuration) * 100));
 const ancho = Math.max(0.8, Math.min(100 - izq, ((end - start) / timelineDuration) * 100));
 return (
 <div
 className="absolute top-0 bottom-0 -2 rounded-sm pointer-events-none"
 style={{ left: `${izq}%`, width: `${ancho}%`, boxShadow:'0 0 0 1px rgba(16,185,129,0.6) inset' }}
 />
 );
 })()}
 </div>
 <p className="text-[9px] font-mono text-[var(--ink-2)] leading-tight">
 {conDesglose
 ?'Cuanto más intenso, más potencial combinado (volumen + arranque + montaje). El recuadro verde es el corte seleccionado.'
 :'Cuanto más intenso, más suena la banda en ese punto. El recuadro verde es el corte seleccionado.'}
 </p>
 {(() => {
 // El motivo de la ventana que coincide con el corte seleccionado, para no obligar a
 // pasar el ratón por encima de una barra diminuta para leerlo.
 const clip = highlights[selectedHighlightIndex];
 if (!clip || !conDesglose) return null;
 const { start } = parseRangeTimes(clip.range);
 const ventana = (viralWindows as any[]).find(v => Math.abs(v.start - start) <= 2);
 if (!ventana?.motivo) return null;
 return (
 <p className={`text-[10px] font-sans italic leading-snug pt-0.5 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>"{ventana.motivo}"
 </p>
 );
 })()}
 </div>
 );
 })()}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {highlights.map((clip, index) => {
 const isSelected = selectedHighlightIndex === index;
 return (
 <div
 id={`clip-card-${index}`}
 key={clip.id || index}
 onClick={() => handleSelectHighlight(index)}
 className={` rounded-[var(--r-m)] p-3.5 cursor-pointer transition-all space-y-3 relative group overflow-hidden ${
 isSelected 
 ? isStitchLight
 ?'-indigo-600 bg-indigo-50/20 shadow-md'
 :'-[var(--acc)] bg-[var(--acc)]/5 shadow-lg shadow-[var(--acc)]/5' 
 : isStitchLight
 ?'-slate-200 bg-white hover:-indigo-300 hover:bg-[var(--bg)]/50'
 :'-neutral-800/80 bg-[var(--surface)]/60 hover:-neutral-700 hover:bg-[var(--surface)]/90'
 }`}
 >
 {/* Simulated miniature video thumbnail track design */}
 <div className={`w-full h-20 rounded-[var(--r-s)] relative flex flex-col justify-between p-2 overflow-hidden ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'
 }`}>
 {/* Waveforms illustration background */}
 <div className="absolute inset-x-0 bottom-0 h-8 flex items-end gap-[2px] opacity-25 px-1">
 {[35, 45, 60, 20, 80, 50, 95, 30, 45, 75, 25, 40, 60, 80, 25, 50, 70, 90, 40, 20, 45, 80, 60].map((h, i) => (
 <div key={i} className={`flex-1 ${isStitchLight ?'bg-indigo-600' :'bg-[var(--acc)]'}`} style={{ height: `${isSelected ? h : h * 0.7}%` }} />
 ))}
 </div>
 <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded self-start z-10 ${
 isStitchLight ?'bg-indigo-600 text-[var(--ink)]' :'bg-[var(--acc)] text-[var(--acc-ink)]'
 }`}>
 {clip.range}
 </span>
 <div className="absolute inset-0 flex items-center justify-center z-0 opacity-80 group-hover:scale-105 transition-transform">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/20 flex items-center justify-center text-[var(--acc)]">
 <Play className="w-3.5 h-3.5 fill-[var(--acc)] ml-0.5" />
 </div>
 </div>
 <span className="text-[8px] font-mono text-[var(--ink-2)] self-end z-10 bg-black/60 px-1 rounded truncate w-full">
 CLIP-{index + 1}.mp4
 </span>
 </div>

 <div className="space-y-1.5">
 <h4 className={`text-[11px] font-bold font-sans line-clamp-1 flex items-center gap-1 transition-colors ${
 isStitchLight ?'text-[var(--ink)] group-hover:text-indigo-600' :'text-[var(--ink-2)] group-hover:text-[var(--acc)]'
 }`}>
 {clip.title}
 </h4>
 <p className={`text-[10px] font-sans leading-normal line-clamp-2 ${textSub}`}>
 {clip.description}
 </p>
 </div>

 {/* Virality score meter */}
 <div className={`space-y-1 pt-1.5 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <div className="flex justify-between items-center text-[9px] font-mono text-[var(--ink-2)]">
 <span className="flex items-center gap-1">
 <Flame className={`w-3 h-3 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`} /> Virality Score:
 </span>
 <span className={`font-bold ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>{clip.virality}%</span>
 </div>
 <div className={`w-full h-1 rounded-full overflow-hidden ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 <div 
 className={`h-full ${isStitchLight ?'bg-indigo-600' :'bg-[var(--acc)]'}`} 
 style={{ width: `${clip.virality}%` }}
 />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* 3. Editor & Scheduler Form for Selected Highlight */}
 {highlights.length > 0 && (
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-2 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>
 <Calendar className="w-4 h-4" /> Personalizar Publicación y Programar en Calendario
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Edita el pie de foto (copy) propuesto por la IA y confirma la fecha recomendada de publicación para el feed de la banda.
 </p>
 </div>

 <form onSubmit={handleSchedulePost} className="space-y-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 
 {/* Left Block: Configs & copy */}
 <div className="lg:col-span-8 space-y-4">
 
 {/* Selected Clip summary header */}
 <div className={`p-3 rounded-[var(--r-m)] flex justify-between items-center gap-3 ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'
 }`}>
 <div className="space-y-0.5 flex-1">
 <span className="text-[9px] font-mono text-[var(--ink-2)] uppercase">TÍTULO DEL CORTE (EDITABLE):</span>
 <input
 type="text"
 value={highlights[selectedHighlightIndex]?.title ||''}
 onChange={(e) => {
 const val = e.target.value;
 setHighlights(prev => prev.map((clip, idx) => 
 idx === selectedHighlightIndex ? { ...clip, title: val } : clip
 ));
 }}
 className={`w-full bg-transparent text-xs font-bold font-sans -dashed -neutral-700/60 focus:-[var(--acc)] focus:outline-none py-0.5 ${textTitle}`}
 placeholder="Escribe un título para este corte..."
 />
 </div>
 <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 ${
 isStitchLight 
 ?'bg-indigo-50 text-indigo-600' 
 :'bg-[var(--acc)]/10 -[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 {highlights[selectedHighlightIndex]?.range}
 </span>
 </div>

 {/* AI Re-analyzer & User Notes Panel */}
 <div className={`p-3.5 rounded-[var(--r-l)] space-y-3 ${
 isStitchLight ?'bg-indigo-50/40' :'bg-[var(--surface)]/90 -[var(--acc)]/20'
 }`}>
 <div className="flex justify-between items-center flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <Sparkles className={`w-4 h-4 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`} />
 <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textTitle}`}>
 Reanalizar y Refinar Fragmento con IA
 </span>
 </div>
 <button
 type="button"
 onClick={handleReanalyzeClip}
 disabled={isReanalyzingClip}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
 isReanalyzingClip
 ?'bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed animate-pulse'
 : isStitchLight
 ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)]'
 :'bg-[var(--acc)] hover:bg-[#e0b83f] text-[var(--ink)]'
 }`}
 >
 <Sparkles className={`w-3.5 h-3.5 ${isReanalyzingClip ?'animate-spin' :''}`} />
 {isReanalyzingClip ?'Reanalizando...' :'Reanalizar Corte con IA'}
 </button>
 </div>

 <div className="space-y-1">
 <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-2)]">
 Notas u Observaciones del Fragmento (Opcional - ej:"En este tramo toca el bajo Jon","Sólo instrumental","Presentación de la banda")
 </label>
 <input
 type="text"
 value={clipUserNote}
 onChange={(e) => setClipUserNote(e.target.value)}
 placeholder="Ej: En este tramo del 0:15 al 0:45 sólo toca el bajo Jon y la batería, no hay violín..."
 className={`w-full rounded-[var(--r-m)] px-3 py-2 text-xs font-sans focus:outline-none ${
 isStitchLight
 ?'bg-white text-[var(--ink)] focus:-indigo-500'
 :'bg-[var(--surface)] text-[var(--ink-2)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>

 {/* Valorar la versión anterior (como el entrenamiento de pitches en Booking CRM):
 estrellas + comentario ya existente arriba, y decidir si se recuerda para siempre
 o es solo un ajuste puntual de este corte. */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 <div className={`p-2 rounded-[var(--r-m)] space-y-1 ${isStitchLight ?'bg-white' :'bg-[var(--surface)]'}`}>
 <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-2)] block">Tono (versión anterior)</span>
 <div className="flex items-center gap-0.5">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`clip-tone-${star}`}
 type="button"
 onClick={() => setClipToneRating(clipToneRating === star ? 0 : star)}
 className={`p-0.5 rounded cursor-pointer transition-colors ${clipToneRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 title={`Valorar el tono: ${star}/5`}
 >
 <Star className="w-3.5 h-3.5 fill-current" />
 </button>
 ))}
 </div>
 </div>
 <div className={`p-2 rounded-[var(--r-m)] space-y-1 ${isStitchLight ?'bg-white' :'bg-[var(--surface)]'}`}>
 <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--ink-2)] block">Contenido (versión anterior)</span>
 <div className="flex items-center gap-0.5">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={`clip-content-${star}`}
 type="button"
 onClick={() => setClipContentRating(clipContentRating === star ? 0 : star)}
 className={`p-0.5 rounded cursor-pointer transition-colors ${clipContentRating >= star ?'text-[var(--acc)]' :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 title={`Valorar el contenido: ${star}/5`}
 >
 <Star className="w-3.5 h-3.5 fill-current" />
 </button>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-1.5 text-[10px] font-mono">
 <span className="text-[var(--ink-2)] uppercase tracking-wider">Alcance del ajuste:</span>
 <button
 type="button"
 onClick={() => setClipFeedbackScope('este_reel')}
 className={`px-2 py-1 rounded-[var(--r-s)] cursor-pointer transition-all ${
 clipFeedbackScope ==='este_reel'
 ?'bg-[var(--surface)]/70 text-[var(--ink)] font-bold'
 :'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Solo este corte
 </button>
 <button
 type="button"
 onClick={() => setClipFeedbackScope('global')}
 className={`px-2 py-1 rounded-[var(--r-s)] cursor-pointer transition-all flex items-center gap-1 ${
 clipFeedbackScope ==='global'
 ?'bg-[var(--acc)]/20 text-[var(--acc)] font-bold'
 :'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="La IA recordará esta corrección también para futuros Reels de la banda"
 >
 <Sparkles className="w-3 h-3" /> Recordar para siempre
 </button>
 </div>

 {reanalyzeSuccessMsg && (
 <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-[var(--r-s)] -emerald-500/20">
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span>{reanalyzeSuccessMsg}</span>
 </div>
 )}

 {highlights[selectedHighlightIndex]?.reason && (
 <div className={`p-2.5 rounded-[var(--r-m)] text-[11px] font-sans leading-relaxed ${
 isStitchLight ?'bg-white/80 text-[var(--ink-2)]' :'bg-black/40 text-[var(--ink)]'
 }`}>
 <span className="font-mono text-[9px] uppercase font-bold text-[var(--ink-2)] block mb-0.5">Diagnóstico IA del Fragmento:</span>
 <p>{highlights[selectedHighlightIndex]?.reason}</p>
 </div>
 )}
 </div>

 {/* Copy editor textarea */}
 <div className="space-y-1.5">
 <label className="block text-[10px] uppercase font-mono tracking-wider text-[var(--ink-2)]">Pie de Foto (Copy Recomendado para Redes)</label>
 <textarea
 id="highlight-copy-editor"
 rows={5}
 value={editedCopy}
 onChange={(e) => setEditedCopy(e.target.value)}
 className={`w-full rounded-[var(--r-m)] p-3 text-xs font-sans leading-relaxed focus:outline-none ${
 isStitchLight 
 ?'bg-white text-[var(--ink)] focus:-indigo-500' 
 :'bg-[var(--surface)] text-[var(--ink-2)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>

 {/* Recommendation Tips */}
 {optimalTime && (
 <div className={`p-3 rounded-[var(--r-m)] flex gap-3 items-start text-[11px] leading-relaxed ${
 isStitchLight 
 ?'bg-indigo-50/30 text-[var(--ink-2)]' 
 :'bg-[var(--acc)]/5 -[var(--acc)]/15 text-[var(--ink)]'
 }`}>
 <Clock className={`w-4.5 h-4.5 mt-0.5 shrink-0 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`} />
 <div className="space-y-0.5">
 <span className={`font-mono text-[9px] uppercase font-bold tracking-wider ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>¿Por qué este horario?</span>
 <p className={`font-sans ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>{optimalTime.reason}</p>
 </div>
 </div>
 )}
 </div>

 {/* Right Block: Platform, Date/Time & Submit */}
 <div className="lg:col-span-4 space-y-4">
 
 {/* Platform Selector */}
 <div className="space-y-1.5">
 <span className="block text-[10px] uppercase font-mono text-[var(--ink-2)]">Plataforma Objetivo</span>
 <div className="grid grid-cols-2 gap-2">
 {[
 { id:'Instagram', name:'Instagram Reels' },
 { id:'TikTok', name:'TikTok Video' },
 { id:'YouTube', name:'YouTube Shorts' },
 { id:'Facebook', name:'Facebook' }
 ].map((plat) => (
 <button
 type="button"
 key={plat.id}
 onClick={() => {
 const nuevaPlataforma = plat.id as'Instagram' |'TikTok' |'YouTube' |'Facebook';
 setSelectedPlatform(nuevaPlataforma);
 setEditedCopy(copyForPlatform(highlights[selectedHighlightIndex], nuevaPlataforma));
 }}
 className={`py-2 px-2 rounded-[var(--r-s)] text-[10px] font-mono text-center transition-all cursor-pointer ${
 selectedPlatform === plat.id
 ? isStitchLight
 ?'bg-indigo-600 text-[var(--ink)] font-black'
 :'bg-[var(--acc)] -[var(--acc)] text-[var(--acc-ink)] font-black'
 : isStitchLight
 ?'-slate-200 hover:-indigo-200 bg-white text-[var(--ink-2)]'
 :'-neutral-800 hover:-neutral-700 bg-[var(--surface)]/60 text-[var(--ink-2)]'
 }`}
 >
 {plat.name}
 </button>
 ))}
 </div>
 </div>

 {/* Interactive Scheduler Inputs */}
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1">
 <span className="block text-[10px] uppercase font-mono text-[var(--ink-2)]">Fecha de envío</span>
 <input
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 className={`w-full rounded-[var(--r-s)] p-2.5 text-xs font-mono focus:outline-none ${
 isStitchLight 
 ?'bg-white text-[var(--ink)] focus:-indigo-500' 
 :'bg-[var(--surface)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>
 <div className="space-y-1">
 <span className="block text-[10px] uppercase font-mono text-[var(--ink-2)]">Hora sugerida</span>
 <input
 type="time"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className={`w-full rounded-[var(--r-s)] p-2.5 text-xs font-mono focus:outline-none ${
 isStitchLight 
 ?'bg-white text-[var(--ink)] focus:-indigo-500' 
 :'bg-[var(--surface)] focus:-[var(--acc)]/50'
 }`}
 />
 </div>
 </div>

 {/* Submit Button */}
 <div className="pt-2">
 <button
 type="submit"
 disabled={isScheduling}
 className={`w-full py-3.5 rounded-[var(--r-m)] font-mono text-xs font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
 isScheduling
 ?'bg-[var(--surface)]/80 text-[var(--ink-2)] cursor-not-allowed'
 : isStitchLight
 ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] font-black shadow-md'
 :'bg-[var(--sunken)] hover:bg-zinc-700 text-[var(--ink)] font-black shadow-lg shadow-[var(--acc)]/15'
 }`}
 >
 {isScheduling ? (
 <>
 <RefreshCw className="w-3.5 h-3.5 animate-spin" />
 <span>PROGRAMANDO...</span>
 </>
 ) : (
 <>
 <CheckCircle2 className="w-4 h-4" />
 <span>APROBAR Y PROGRAMAR</span>
 </>
 )}
 </button>
 </div>

 {schedulingSuccess && (
 <div className="p-2.5 bg-emerald-500/10 -emerald-500/20 rounded-[var(--r-s)] text-emerald-400 text-xs text-center font-mono animate-bounce mt-2 flex items-center justify-center gap-1.5">
 <Check className="w-3.5 h-3.5 text-emerald-400" />
 <span>¡Reel programado con éxito!</span>
 </div>
 )}
 {scheduleErrors.length > 0 && (
 <div className="p-2.5 bg-red-500/10 -red-500/30 rounded-[var(--r-s)] text-red-400 text-[11px] font-mono mt-2 space-y-1">
 {scheduleErrors.map((problema) => (
 <div key={problema} className="flex items-center gap-1.5">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
 <span>{problema}</span>
 </div>
 ))}
 </div>
 )}
 {scheduleWarnings.length > 0 && (
 <div className="p-2.5 bg-[var(--acc)]/10 -amber-0/30 rounded-[var(--r-s)] text-[var(--acc)] text-[11px] font-mono mt-2 space-y-1">
 {scheduleWarnings.map((aviso) => (
 <div key={aviso} className="flex items-center gap-1.5">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
 <span>{aviso}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </form>
 </div>
 )}

 {/* 4. Calendario de Publicaciones de la Banda List */}
 <div className={`${colors.card} p-5 space-y-4`}>
 <div className={` pb-2 flex justify-between items-center ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>
 <Calendar className="w-4 h-4" /> Calendario de Publicaciones de la Banda ({posts.length})
 </h3>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Aquí puedes ver la parrilla de contenidos aprobada y programada de {nombreBanda}.
 </p>
 </div>
 <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase ${
 isStitchLight ?'-slate-200 text-[var(--ink-2)] bg-[var(--bg)]' :'-neutral-800 text-[var(--ink-2)]'
 }`}>
 Live Database
 </span>
 </div>

 {posts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12">
 <PublicoSilhouette opacity={12} size="small" />
 <p className="mt-4 font-medium text-[var(--ink)] text-xs">Sin publicaciones programadas</p>
 <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs">
 Sube un vídeo y genera un clip viral para comenzar tu campaña.
 </p>
 </div>
 ) : (
 <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
 {[...posts].reverse().map((post) => (
 <div 
 key={post.id} 
 className={` rounded-[var(--r-m)] p-3 flex flex-col md:flex-row justify-between gap-3 items-stretch transition-all ${
 isStitchLight 
 ?'bg-[var(--bg)]/50 hover:-indigo-300' 
 :'bg-[var(--surface)]/60 hover:-neutral-800'
 }`}
 >
 <div className="space-y-2 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
 post.plataforma ==='Instagram' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :
 post.plataforma ==='TikTok' ?'bg-[var(--acc)]/10 text-[var(--acc)]' :'bg-[var(--surface)]/80 text-[var(--ink)]'
 }`}>
 {post.plataforma}
 </span>
 <span className="text-[10px] font-mono text-[var(--ink-2)] flex items-center gap-1">
 <Clock className="w-3.5 h-3.5 text-[var(--ink-2)]" /> {post.fecha}
 </span>
 <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold uppercase tracking-wider">
 {post.estado}
 </span>
 </div>
 <p className={`text-xs line-clamp-3 leading-relaxed font-sans font-medium ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]'}`}>
 {post.contenido}
 </p>
 </div>
 
 <div className={`flex md:flex-col justify-end items-end gap-2 md: md: pt-2.5 md:pt-0 md:pl-4 shrink-0 ${
 isStitchLight ?'-slate-200' :'-bg-[var(--surface)]'
 }`}>
 <span className="text-[8px] font-mono text-[var(--ink-2)]">Responsable: {post.responsable ||'Community Manager'}</span>
 <button
 id={`delete-post-${post.id}`}
 onClick={async () => {
 if (confirm(`¿Seguro que deseas eliminar esta publicación del calendario de ${nombreBanda}?`)) {
 await onUpdatePost(post.id, { estado:'borrador' }); // or we can handle direct deletion or mock update
 alert('Publicación desactivada/movida a borrador.');
 }
 }}
 className="p-1 text-[var(--ink-2)] hover:text-rose-500 transition-colors bg-transparent -none cursor-pointer"
 title="Eliminar del Calendario"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 )}

 </div>

 {/* RIGHT COLUMN: HIGH-FIDELITY PHONE PREVIEW MOCKUP (4 columns) */}
 <div className={`xl:col-span-4 rounded-[var(--r-m)] p-5 flex flex-col justify-between select-none ${colors.card}`}>
 
 <div className="space-y-3">
 <div className={` pb-2 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <h3 className={`text-xs font-mono uppercase tracking-widest ${isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}`}>Vista Previa en Redes</h3>
 <p className="text-[9px] text-[var(--ink-2)] font-mono mt-0.5">Visualiza cómo se verá la copia y el contenido en directo</p>
 </div>

 {/* Smart Phone Shell Frame */}
 <div className={`mx-auto w-[240px] h-[450px] rounded-[30px] -[6px] relative overflow-hidden flex flex-col justify-between ${
 isStitchLight ?'-slate-300 bg-white shadow-xl' :'-neutral-800 bg-[var(--sunken)] shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
 }`}>
 
 {/* Speaker & camera notch mockup */}
 <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full z-20 flex items-center justify-center ${
 isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/80'
 }`}>
 <span className={`w-2 h-2 rounded-full ${isStitchLight ?'bg-[var(--surface)]' :'bg-[var(--surface)]'}`} />
 </div>

 {/* Dynamic Video Mockup Content with Analog Synth pattern as background */}
 <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 pt-8 pb-3 relative">
 
 {/* Background Decorative Pattern representing video overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[var(--sunken)]/90 pointer-events-none z-0" />
 
 {/* Real Media Player Background or Fallback Wave Illustration */}
 {activeTab ==='analyzer' && inputType ==='youtube' && getYouTubeId(youtubeUrl) && !isExpandedPreview ? (
 (() => {
 const { start, end } = parseRangeTimes(phoneDuration);
 if (renderedClipUrl) {
 return (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <video
 key={`mini-rendered-${renderedClipUrl}-${isPreviewMuted ?'muted' :'unmuted'}`}
 src={renderedClipUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 playsInline
 className="absolute w-full h-full object-cover opacity-90"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const cur = video.currentTime;
 if (subtitleCues && subtitleCues.length > 0) {
 const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
 setCurrentSubtitleText(activeCue ? activeCue.text :'');
 }
 }}
 >
 {renderedSubUrl && (
 <track
 src={renderedSubUrl}
 kind="subtitles"
 srcLang="es"
 label="Español"
 default
 />
 )}
 </video>

 {/* Kinetic Reels Subtitles Overlay */}
 {currentSubtitleText && !renderedBurnedSubs && (
 <div className="absolute bottom-20 left-3 right-3 z-40 bg-black/80 px-2 py-1.5 rounded-[var(--r-m)] -[var(--acc)]/40 text-center backdrop-blur-sm shadow-xl">
 <span className="text-[10px] font-sans font-black tracking-wide text-[var(--acc)] uppercase leading-tight">
 ✨ {currentSubtitleText} ✨
 </span>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <iframe
 key={`${getYouTubeId(youtubeUrl)}-${start}-${end}-${isPreviewMuted ?'muted' :'unmuted'}-${ytLoopCount}`}
 src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=${start}&end=${end}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=0&modestbranding=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}&showinfo=0&rel=0&iv_load_policy=3`}
 className="absolute w-[280%] h-full left-1/2 -translate-x-1/2 object-cover pointer-events-none opacity-80"
 allow="autoplay; encrypted-media"
 title="Highlight Clip Video Player"
 style={{ border: 0 }}
 />
 </div>
 );
 })()
 ) : activeTab ==='analyzer' && inputType ==='file' && localVideoUrl && !isExpandedPreview ? (
 <div className="absolute inset-0 z-[-1] overflow-hidden bg-black">
 <video
 key={`${localVideoUrl}-${isPreviewMuted ?'muted' :'unmuted'}`}
 src={localVideoUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 playsInline
 className="absolute w-full h-full object-cover opacity-80"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const { start, end } = parseRangeTimes(phoneDuration);
 if (end > start) {
 if (video.currentTime < start) {
 video.currentTime = start;
 }
 if (video.currentTime >= end) {
 video.currentTime = start;
 video.play().catch(() => {});
 }
 }
 }}
 onLoadedMetadata={(e) => {
 const video = e.currentTarget;
 if (Number.isFinite(video.duration) && video.duration > 0) {
 setLocalVideoDuration(Math.floor(video.duration));
 }
 const { start } = parseRangeTimes(phoneDuration);
 video.currentTime = start;
 }}
 />
 </div>
 ) : (
 /* Vintage Audio Wave / Synth Illustration behind */
 <div className="absolute inset-0 bg-cover bg-center opacity-35 z-[-1] flex flex-col items-center justify-center p-4">
 <div className={`w-full h-full -dashed rounded-[var(--r-m)] flex flex-col items-center justify-center gap-3 ${
 isStitchLight ?'-indigo-100' :'-neutral-700/30'
 }`}>
 <div className="flex gap-4">
 <div className={`w-10 h-10 rounded-full -dashed flex items-center justify-center text-[8px] font-mono ${
 isStitchLight ?'-indigo-300 text-indigo-400' :'-[var(--acc)]/50 text-[var(--acc)]/70'
 }`}>VOL</div>
 <div className={`w-10 h-10 rounded-full -dashed flex items-center justify-center text-[8px] font-mono ${
 isStitchLight ?'-emerald-300 text-emerald-400' :'-[var(--accent)]/50 text-[var(--acc)]/70'
 }`}>SKA</div>
 </div>
 <span className={`text-[9px] font-mono uppercase tracking-widest text-center animate-pulse ${
 isStitchLight ?'text-indigo-400' :'text-[var(--ink-2)]'
 }`}>
 {activeTab ==='analyzer' && highlights.length > 0 ?'[ HIGHLIGHT CLIP ACTIVE ]' :'[ Balkan Analog Synth ]'}
 </span>
 {phoneDuration && (
 <span className={`text-[10px] font-mono py-0.5 px-2 rounded-full font-bold ${
 isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--acc)]/10 -[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 {phoneDuration}
 </span>
 )}
 </div>
 </div>
 )}

 {/* Top Status Header */}
 <div className="flex justify-between items-center z-10">
 <span className={`text-[9px] font-mono tracking-wider font-bold ${
 isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'
 }`}>
 {activeTab ==='analyzer' ?'AI ANALYZER REEL' :'REELS PREVIEW'}
 </span>
 <div className="flex gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
 <span className="text-[8px] font-mono text-red-400 font-bold">LIVE REC</span>
 </div>
 </div>

 {/* Floating Action Badges Column */}
 {activeTab ==='analyzer' && ((inputType ==='youtube' && getYouTubeId(youtubeUrl)) || (inputType ==='file' && localVideoUrl)) && (
 <div className="absolute top-12 right-3 z-30 flex flex-col gap-2">
 {/* Sound Toggle */}
 <button
 id="btn-toggle-sound"
 type="button"
 onClick={() => setIsPreviewMuted(!isPreviewMuted)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 -white/20 text-[var(--ink)] hover:bg-black/85 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-lg select-none"
 >
 {isPreviewMuted ? (
 <>
 <VolumeX className="w-3 h-3 text-red-400 animate-pulse" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-red-200">SIN SONIDO</span>
 </>
 ) : (
 <>
 <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-[var(--ink)]">CON SONIDO</span>
 </>
 )}
 </button>

 {/* Maximize Toggle */}
 <button
 id="btn-maximize-preview"
 type="button"
 onClick={() => setIsExpandedPreview(true)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/60 -white/20 text-[var(--ink)] hover:bg-black/85 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-lg select-none"
 >
 <Maximize2 className="w-3 h-3 text-sky-400" />
 <span className="text-[7.5px] font-mono font-extrabold tracking-wider uppercase text-sky-200">VER GRANDE</span>
 </button>
 </div>
 )}

 {/* Play Button Overlay (hidden when playing a real video to keep the clip clean) */}
 {!(activeTab ==='analyzer' && (
 (inputType ==='youtube' && getYouTubeId(youtubeUrl)) ||
 (inputType ==='file' && localVideoUrl)
 )) && (
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
 <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center text-[var(--acc)] shadow-lg animate-pulse ${
 isStitchLight ?'bg-white/40' :'bg-white/10 -white/20'
 }`}>
 <Play className={`w-6 h-6 ml-0.5 ${isStitchLight ?'fill-indigo-600 text-indigo-600' :'fill-[var(--acc)] text-[var(--acc)]'}`} />
 </div>
 </div>
 )}

 {/* Right Side Social Action Widgets */}
 <div className="self-end flex flex-col gap-4 items-center z-10 mr-1">
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-[var(--ink)] hover:text-red-500">
 <Heart className="w-4 h-4 fill-white/10" />
 </div>
 <span className="text-[8px] font-mono text-[var(--ink)] font-bold">2,108</span>
 </div>
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-[var(--ink)]">
 <MessageCircle className="w-4 h-4" />
 </div>
 <span className="text-[8px] font-mono text-[var(--ink)] font-bold">48</span>
 </div>
 <div className="flex flex-col items-center gap-1 cursor-pointer">
 <div className="w-8 h-8 rounded-full bg-black/40 -white/10 flex items-center justify-center text-[var(--ink)]">
 <Share2 className="w-4 h-4" />
 </div>
 <span className="text-[8px] font-mono text-[var(--ink)] font-bold">186</span>
 </div>
 </div>

 {/* Bottom Video Metadata Overlays */}
 <div className="z-10 space-y-2 mt-auto">
 <div className="flex items-center gap-1.5">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-mono font-bold ${
 isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-[var(--acc)]/20 -[var(--acc)] text-[var(--acc)]'
 }`}>{nombreBanda.charAt(0).toUpperCase()}</span>
 <div>
 <span className="text-[9px] font-bold text-[var(--ink)] block truncate max-w-[90px]">{instagramHandle || nombreBanda}</span>
 <span className={`text-[7px] font-mono block ${isStitchLight ?'text-indigo-200' :'text-[var(--acc)]'}`}>{nombreBanda}</span>
 </div>
 </div>

 {phoneTitle && (
 <h4 className="text-[10px] text-[var(--ink-2)] font-bold line-clamp-1">
 🎬 {phoneTitle}
 </h4>
 )}

 {/* Generated caption summary inside the reel overlay */}
 <p className="text-[9px] text-[var(--ink-2)] line-clamp-3 leading-normal font-sans">
 {phoneText}
 </p>

 {/* Slim, elegant progress timeline of the highlight clip */}
 {activeTab ==='analyzer' && highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const pct = (simulatedTime / duration) * 100;
 return (
 <div className={`p-1.5 rounded-[var(--r-m)] space-y-1 ${
 isStitchLight ?'bg-white/90 -indigo-200/40 text-[var(--ink)]' :'bg-black/75 -white/10 text-[var(--ink-2)]'
 }`}>
 <div className="flex justify-between items-center text-[7.5px] font-mono font-bold">
 <span className={isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'}>⏱️ REC CORTE</span>
 <span className="font-mono">{formatTime(start + simulatedTime)} / {formatTime(end)}</span>
 </div>
 <div className="relative w-full h-1 bg-[var(--surface)]/80 rounded-full overflow-hidden">
 <div 
 className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-linear ${
 isStitchLight ?'bg-indigo-600' :'bg-gradient-to-r from-amber-500 to-[var(--acc)]'
 }`}
 style={{ width: `${pct}%` }}
 />
 </div>
 <div className="flex justify-between text-[6.5px] font-mono text-[var(--ink-2)]">
 <span>Inicia: {formatTime(start)}</span>
 <span className="font-bold">Duración: {duration}s</span>
 <span>Termina: {formatTime(end)}</span>
 </div>
 </div>
 );
 }
 return null;
 })()}

 {/* Track label scrolling simulation */}
 <div className={`flex items-center gap-1 text-[8px] font-mono py-1 px-1.5 rounded-full max-w-[140px] truncate ${
 isStitchLight ?'text-indigo-400 bg-white/10 -indigo-200/20' :'text-[var(--acc)] bg-black/40 -neutral-800/50'
 }`}>
 <Music className="w-2.5 h-2.5 shrink-0" />
 <span className="animate-marquee whitespace-nowrap">{videoMeta?.title || `Audio original · ${nombreBanda}`}</span>
 </div>
 </div>
 </div>

 {/* Simulated Upload Status Queue */}
 <div className={`space-y-2 pt-4 mt-4 ${isStitchLight ?'-slate-100' :'-[#99907c]/15'}`}>
 <div className="flex justify-between items-center">
 <span className="text-[9px] font-mono text-[var(--ink-2)]">Canal de Emisión</span>
 <button
 id="btn-reels-upload"
 onClick={handleSimulateUpload}
 disabled={uploadProgress !== null}
 className={`text-[9px] font-mono hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40 bg-transparent -none ${
 isStitchLight ?'text-indigo-600' :'text-[var(--acc)]'
 }`}
 >
 <Upload className="w-3 h-3" /> Subir Directo
 </button>
 </div>

 {uploadProgress !== null ? (
 <div className="space-y-1">
 <div className="flex justify-between items-center text-[8px] font-mono text-[var(--ink-2)]">
 <span>Transmitiendo a APIs de Redes Sociales...</span>
 <span>{uploadProgress}%</span>
 </div>
 <div className={`w-full h-1.5 rounded-full overflow-hidden ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 <div 
 className={`h-full transition-all duration-200 ${isStitchLight ?'bg-indigo-600' :'bg-[var(--acc)]'}`} 
 style={{ width: `${uploadProgress}%` }}
 />
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--ink-2)] justify-end">
 <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ink-2)]" />
 <span>Todo sincronizado</span>
 </div>
 )}
 </div>

 </div>

 </div>

 </div>

 </div>

 {/* 🎬 MODO CINE / PREVISUALIZADOR EXPANDIDO */}
 {isExpandedPreview && (
 <div 
 id="theater-mode-modal"
 onClick={() => setIsExpandedPreview(false)}
 className="fixed inset-0 z-[200] bg-[var(--surface)]/98 backdrop-blur-md flex flex-col items-center justify-start lg:justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
 >
 <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/5 via-transparent to-[var(--acc)]/5 pointer-events-none" />
 
 {/* Floating Close/Minimise button in the top right corner of the screen */}
 <button
 id="btn-close-theater-floating"
 onClick={(e) => {
 e.stopPropagation();
 setIsExpandedPreview(false);
 }}
 className="fixed top-4 right-4 z-[250] p-3 rounded-full bg-[var(--surface)]/90 hover:bg-[var(--surface)]/80 text-[var(--ink)] hover:text-[var(--ink)] transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer hidden lg:flex items-center justify-center backdrop-blur-sm"
 title="Cerrar modo cine (ESC o Click fuera)"
 >
 <X className="w-6 h-6" />
 </button>

 {/* Mobile sticky top header bar */}
 <div 
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-6xl mb-2 flex items-center justify-between p-3 rounded-[var(--r-l)] bg-[var(--surface)] lg:hidden shrink-0 shadow-lg"
 >
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-xs font-mono font-bold text-[var(--ink)] uppercase tracking-wider">Modo Cine · Reels</span>
 </div>
 <button
 onClick={() => setIsExpandedPreview(false)}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 text-[var(--acc)] hover:text-[var(--ink)] font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer"
 >
 <X className="w-4 h-4" /> <span>Cerrar</span>
 </button>
 </div>

 <div 
 onClick={(e) => e.stopPropagation()}
 className="relative w-full max-w-6xl bg-[var(--surface)] rounded-3xl shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[90vh] lg:max-h-[90vh] overflow-visible lg:overflow-hidden"
 >
 
 {/* Left Column: Huge 9:16 vertical smartphone screen mockup */}
 <div className="w-full lg:w-[460px] bg-[var(--surface)]/80 p-6 flex flex-col items-center justify-center lg: lg: relative select-none shrink-0">
 <div className="absolute top-4 left-6 flex items-center gap-2">
 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-[10px] font-mono text-[var(--ink-2)] font-bold uppercase tracking-wider">MODO CINE ACTIVO</span>
 </div>

 {/* Close Button for mobile, positioned in the top-right of the Left Column */}
 <button
 id="btn-close-theater-mobile"
 onClick={() => setIsExpandedPreview(false)}
 className="absolute top-3 right-4 z-50 p-2.5 rounded-full bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer lg:hidden"
 title="Cerrar modo cine"
 >
 <X className="w-5 h-5" />
 </button>

 {/* Physical phone mock wrapper */}
 <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-[36px] overflow-hidden -neutral-700/80 bg-black shadow-inner shadow-black flex flex-col justify-between p-4 pt-10 pb-5">
 
 {/* Speaker Notch */}
 <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-[var(--surface)] -neutral-800/50 z-20 flex items-center justify-center">
 <div className="w-8 h-1 rounded-full bg-[var(--surface)]/70" />
 </div>

 {/* Video / Player */}
 {inputType ==='youtube' && getYouTubeId(youtubeUrl) ? (
 (() => {
 const { start, end } = parseRangeTimes(phoneDuration);
 if (renderedClipUrl) {
 return (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <video
 key={`expanded-rendered-${renderedClipUrl}-${isPreviewMuted ?'muted' :'unmuted'}`}
 src={renderedClipUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 controls
 playsInline
 className="absolute w-full h-full object-cover"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const cur = video.currentTime;
 if (subtitleCues && subtitleCues.length > 0) {
 const activeCue = subtitleCues.find(cue => cur >= cue.start && cur <= cue.end);
 setCurrentSubtitleText(activeCue ? activeCue.text :'');
 }
 }}
 >
 {renderedSubUrl && (
 <track
 src={renderedSubUrl}
 kind="subtitles"
 srcLang="es"
 label="Español"
 default
 />
 )}
 </video>

 {/* Subtitles Overlay inside Cinema Phone */}
 {currentSubtitleText && !renderedBurnedSubs && (
 <div className="absolute bottom-20 left-3 right-3 z-40 bg-black/80 px-2 py-1.5 rounded-[var(--r-m)] -[var(--acc)]/40 text-center backdrop-blur-sm shadow-xl">
 <span className="text-[10px] font-sans font-black tracking-wide text-[var(--acc)] uppercase leading-tight">
 ✨ {currentSubtitleText} ✨
 </span>
 </div>
 )}
 </div>
 );
 }

 return (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <iframe
 key={`expanded-yt-${getYouTubeId(youtubeUrl)}-${start}-${end}-${isPreviewMuted ?'muted' :'unmuted'}-${ytLoopCount}`}
 src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?start=${start}&end=${end}&autoplay=1&mute=${isPreviewMuted ? 1 : 0}&controls=1&modestbranding=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}&showinfo=0&rel=0&iv_load_policy=3`}
 className="absolute w-[280%] h-full left-1/2 -translate-x-1/2 object-cover"
 allow="autoplay; encrypted-media; picture-in-picture"
 title="Expanded Highlight Video Player"
 style={{ border: 0 }}
 />
 </div>
 );
 })()
 ) : inputType ==='file' && localVideoUrl ? (
 <div className="absolute inset-0 z-0 overflow-hidden bg-black">
 <video
 key={`expanded-file-${localVideoUrl}-${isPreviewMuted ?'muted' :'unmuted'}`}
 src={localVideoUrl}
 autoPlay
 muted={isPreviewMuted}
 loop
 controls
 playsInline
 className="absolute w-full h-full object-cover"
 onTimeUpdate={(e) => {
 const video = e.currentTarget;
 const { start, end } = parseRangeTimes(phoneDuration);
 if (end > start) {
 if (video.currentTime < start) {
 video.currentTime = start;
 }
 if (video.currentTime >= end) {
 video.currentTime = start;
 video.play().catch(() => {});
 }
 }
 }}
 onLoadedMetadata={(e) => {
 const video = e.currentTarget;
 const { start } = parseRangeTimes(phoneDuration);
 video.currentTime = start;
 }}
 />
 </div>
 ) : (
 <div className="absolute inset-0 z-0 bg-[var(--surface)] flex flex-col items-center justify-center p-4">
 <AlertCircle className="w-8 h-8 text-[var(--ink-2)] mb-2" />
 <span className="text-xs font-mono text-[var(--ink-2)]">No hay vídeo cargado</span>
 </div>
 )}

 {/* Dark Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[var(--sunken)]/85 pointer-events-none z-10" />

 {/* Vista previa de la plataforma: la propia UI de cada app tapa una franja distinta del
 borde derecho (guardar en Instagram/TikTok, like+dislike separados en YouTube...), así
 que un hookText o subtítulo pegado ahí puede quedar oculto en una red y no en otra. */}
 <div className="absolute right-2 bottom-24 z-20 flex flex-col gap-3 items-center pointer-events-none">
 {PLATFORM_UI_ICONS[selectedPlatform].map((Icon, idx) => (
 <div key={idx} className="w-7 h-7 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-[var(--ink)]/85">
 <Icon className="w-3.5 h-3.5" />
 </div>
 ))}
 </div>

 {/* Video Info Overlays inside the phone */}
 <div className="z-10 flex justify-between items-center">
 <span className="text-[8px] font-mono text-[var(--acc)] font-extrabold tracking-widest bg-black/40 py-1 px-2 rounded-full -white/5 uppercase">
 Clip #{selectedHighlightIndex + 1}
 </span>
 <div className="flex gap-1 items-center bg-black/40 py-1 px-2 rounded-full -white/5">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
 <span className="text-[8px] font-mono text-red-400 font-bold">1080P HD</span>
 </div>
 </div>

 <div className="z-10 space-y-2 mt-auto text-left">
 <div className="flex items-center gap-1.5">
 <span className="w-5 h-5 rounded-full -[var(--acc)] bg-[var(--acc)]/20 flex items-center justify-center text-[8px] font-mono font-bold text-[var(--acc)]">{nombreBanda.charAt(0).toUpperCase()}</span>
 <div>
 <span className="text-[9px] font-bold text-[var(--ink)] block truncate max-w-[120px]">{instagramHandle || nombreBanda}</span>
 <span className="text-[7px] font-mono text-[var(--ink-2)] block truncate max-w-[120px]">{nombreBanda}</span>
 </div>
 </div>

 {highlights[selectedHighlightIndex] && (
 <h4 className="text-[10px] text-[var(--ink-2)] font-bold line-clamp-1">
 🎬 {highlights[selectedHighlightIndex]?.title}
 </h4>
 )}

 <p className="text-[9px] text-[var(--ink-2)] line-clamp-3 leading-normal font-sans">
 {editedCopy || (highlights[selectedHighlightIndex]?.recommendedCopy ||'')}
 </p>

 {/* Slim, elegant progress timeline of the highlight clip inside expanded modal */}
 {highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const pct = (simulatedTime / duration) * 100;
 return (
 <div className="p-1.5 rounded-[var(--r-m)] -white/10 bg-black/75 text-[var(--ink-2)] space-y-1">
 <div className="flex justify-between items-center text-[7.5px] font-mono font-bold">
 <span className="text-[var(--acc)]">⏱️ REC CORTE</span>
 <span className="font-mono">{formatTime(start + simulatedTime)} / {formatTime(end)}</span>
 </div>
 <div className="relative w-full h-1 bg-[var(--surface)]/80 rounded-full overflow-hidden">
 <div 
 className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r from-amber-500 to-[var(--acc)]"
 style={{ width: `${pct}%` }}
 />
 </div>
 <div className="flex justify-between text-[6.5px] font-mono text-[var(--ink-2)]">
 <span>Inicia: {formatTime(start)}</span>
 <span className="font-bold text-[var(--acc)]">Duración: {duration}s</span>
 <span>Termina: {formatTime(end)}</span>
 </div>
 </div>
 );
 }
 return null;
 })()}

 <div className="flex items-center gap-1 text-[8px] font-mono bg-black/60 text-[var(--acc)] -neutral-800/50 py-1 px-2 rounded-full max-w-[150px] truncate">
 <Music className="w-2.5 h-2.5 shrink-0" />
 <span className="truncate">{videoMeta?.title || `Audio original · ${nombreBanda}`}</span>
 </div>
 </div>

 </div>

 {/* Sound Toggle under the phone */}
 <div className="mt-4 flex items-center gap-2">
 <button
 id="expanded-mute-btn"
 onClick={() => setIsPreviewMuted(!isPreviewMuted)}
 className="flex items-center gap-2 px-4 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-[var(--ink)] hover:text-[var(--ink)] hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all cursor-pointer shadow-lg select-none text-xs font-mono font-bold"
 >
 {isPreviewMuted ? (
 <>
 <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
 <span>Activar Audio</span>
 </>
 ) : (
 <>
 <Volume2 className="w-4 h-4 text-emerald-400" />
 <span>Silenciar Audio</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* Right Column: Information, Copy Editor & Scheduler */}
 <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-visible lg:overflow-y-auto bg-[var(--surface)] text-left">
 
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-start">
 <div>
 <div className="flex items-center gap-2 mb-1.5">
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-[var(--acc)]/15 text-[var(--acc)] -[var(--acc)]/30 tracking-wider">
 Highlight de Alto Impacto
 </span>
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-sky-500/15 text-sky-400 -sky-500/20 tracking-wider">
 {highlights[selectedHighlightIndex]?.range ||'N/D'}
 </span>
 </div>
 <h2 className="text-xl md:text-2xl font-bold text-[var(--ink)] font-sans tracking-tight">
 {highlights[selectedHighlightIndex]?.title ||'Clip sin título'}
 </h2>
 </div>
 
 {/* Close Button */}
 <button
 id="btn-close-theater"
 onClick={() => setIsExpandedPreview(false)}
 className="p-2 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/80 -neutral-700/50 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer"
 title="Cerrar modo cine"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Virality Card & Reason */}
 <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/50 -neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="space-y-1">
 <span className="text-[10px] font-mono text-[var(--ink-2)] uppercase tracking-wider block">Por qué este momento es viral</span>
 <p className="text-xs text-[var(--ink)] leading-relaxed max-w-xl">
 {highlights[selectedHighlightIndex]?.description ||'La IA está analizando los ganchos emocionales de este intervalo.'}
 </p>
 </div>
 
 {/* Viral Progress Gauge */}
 <div className="flex items-center gap-3 shrink-0 bg-[var(--surface)] p-3 rounded-[var(--r-m)]">
 <div className="relative w-12 h-12 flex items-center justify-center">
 <svg className="w-full h-full transform -rotate-90">
 <circle
 cx="24"
 cy="24"
 r="20"
 stroke="currentColor"
 strokeWidth="3.5"
 className="text-[var(--ink)]"
 fill="transparent"
 />
 <circle
 cx="24"
 cy="24"
 r="20"
 stroke="currentColor"
 strokeWidth="3.5"
 className="text-amber-500"
 fill="transparent"
 strokeDasharray={`${2 * Math.PI * 20}`}
 strokeDashoffset={`${2 * Math.PI * 20 * (1 - (highlights[selectedHighlightIndex]?.virality || 90) / 100)}`}
 />
 </svg>
 <span className="absolute text-[11px] font-mono font-extrabold text-[var(--ink)]">
 {highlights[selectedHighlightIndex]?.virality || 95}%
 </span>
 </div>
 <div className="text-left">
 <div className="flex items-center gap-1">
 <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
 <span className="text-xs font-bold text-[var(--ink)]">Viralidad</span>
 </div>
 <span className="text-[9px] font-mono text-[var(--acc)] uppercase tracking-widest block font-bold">POTENCIAL MÁXIMO</span>
 </div>
 </div>
 </div>

 {/* ⏱️ PRECISION TRIM TIMELINE & ALIGNMENT ANALYZER */}
 {highlights[selectedHighlightIndex] && (() => {
 const { start, end, duration } = parseRangeTimes(highlights[selectedHighlightIndex]?.range);
 if (duration > 0) {
 const totalDuration = timelineDuration;
 const startPct = (start / totalDuration) * 100;
 const endPct = (end / totalDuration) * 100;
 const activeWidth = endPct - startPct;
 const playheadPct = ((start + simulatedTime) / totalDuration) * 100;

 const updateCropTimes = (newStart: number, newEnd: number) => {
 const finalStart = Math.max(0, newStart);
 const finalEnd = Math.max(finalStart + 1, newEnd);
 
 const formatSecsToMMSS = (totalSecs: number) => {
 const mins = Math.floor(totalSecs / 60);
 const secs = totalSecs % 60;
 return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
 };

 const newRange = `${formatSecsToMMSS(finalStart)}-${formatSecsToMMSS(finalEnd)}`;
 
 setHighlights(prev => prev.map((clip, index) => 
 index === selectedHighlightIndex ? { ...clip, range: newRange } : clip
 ));
 setSimulatedTime(0);
 setYtLoopCount(c => c + 1);
 };

 const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
 const rect = e.currentTarget.getBoundingClientRect();
 const clickX = e.clientX - rect.left;
 const clickPct = clickX / rect.width;
 const targetSeconds = Math.round(clickPct * totalDuration);

 const distToStart = Math.abs(targetSeconds - start);
 const distToEnd = Math.abs(targetSeconds - end);

 let newStart = start;
 let newEnd = end;

 if (targetSeconds < start) {
 // Clicked left of start -> extend start to left
 newStart = targetSeconds;
 } else if (targetSeconds > end) {
 // Clicked right of end -> extend end to right
 newEnd = targetSeconds;
 } else {
 // Clicked inside -> adjust closer boundary
 if (distToStart < distToEnd) {
 newStart = Math.min(targetSeconds, end - 1);
 } else {
 newEnd = Math.max(targetSeconds, start + 1);
 }
 }
 updateCropTimes(newStart, newEnd);
 };

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/60 -neutral-800/85 space-y-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-mono font-extrabold uppercase text-[var(--ink)] tracking-wider">
 Línea de Tiempo Interactiva
 </span>
 </div>
 <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--acc)]/10 text-[var(--acc)] -[var(--acc)]/20 animate-pulse">
 REPRODUCIENDO CROP
 </span>
 </div>

 {/* Clickable interactive timeline slider track */}
 <div className="space-y-1.5">
 <div className="text-[10px] text-[var(--ink-2)] font-mono flex justify-between px-1">
 <span>00:00</span>
 <span className="text-[9px] text-[var(--acc)]/80 font-bold flex items-center gap-1">
 <span>🎛️ Arrastra los bordes</span>
 <span className="text-[var(--ink-2)]">•</span>
 <span>Haz click para posicionar</span>
 </span>
 <span>{formatTime(totalDuration)}</span>
 </div>

 <div 
 id="interactive-timeline-container"
 onClick={handleTimelineClick}
 className="relative w-full h-10 bg-[var(--surface)] rounded-[var(--r-m)] overflow-hidden flex items-center cursor-pointer group hover:-neutral-700 transition-colors touch-none"
 title="Haz click para ajustar el inicio o fin del recorte aquí"
 >
 {/* Visual highlight segment on the timeline */}
 <div 
 className="absolute top-1 bottom-1 bg-[var(--acc)]/20 rounded-md flex items-center justify-between px-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:bg-[var(--acc)]/25 transition-all touch-none"
 style={{ left: `${startPct}%`, width: `${activeWidth}%` }}
 >
 {/* Left Grab Handle (Start) */}
 <div 
 className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 flex items-center justify-center cursor-ew-resize group/lhandle z-30 touch-none"
 onMouseDown={(e) => {
 e.stopPropagation();
 setDraggingBoundary('start');
 }}
 onTouchStart={(e) => {
 e.stopPropagation();
 setDraggingBoundary('start');
 }}
 title="Arrastrar para ajustar el inicio (Izquierda)"
 >
 <div className="w-1.5 h-6 bg-[var(--acc)]/60 group-hover/lhandle:bg-white rounded-full transition-all shadow-md group-hover/lhandle:scale-y-110" />
 </div>

 <span className="text-[8px] font-mono text-[var(--acc)]/70 font-extrabold tracking-tight select-none pointer-events-none pl-1">START</span>
 <span className="text-[8px] font-mono text-[var(--ink)] select-none hidden sm:inline pointer-events-none">Recorte ({duration}s)</span>
 <span className="text-[8px] font-mono text-[var(--acc)]/70 font-extrabold tracking-tight select-none pointer-events-none pr-1">END</span>

 {/* Right Grab Handle (End) */}
 <div 
 className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 flex items-center justify-center cursor-ew-resize group/rhandle z-30 touch-none"
 onMouseDown={(e) => {
 e.stopPropagation();
 setDraggingBoundary('end');
 }}
 onTouchStart={(e) => {
 e.stopPropagation();
 setDraggingBoundary('end');
 }}
 title="Arrastrar para ajustar el fin (Derecha)"
 >
 <div className="w-1.5 h-6 bg-[var(--acc)]/60 group-hover/rhandle:bg-white rounded-full transition-all shadow-md group-hover/rhandle:scale-y-110" />
 </div>
 </div>

 {/* Live Playhead Indicator inside the crop segment */}
 <div 
 className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] z-20 transition-all duration-1000 ease-linear pointer-events-none"
 style={{ left: `${playheadPct}%` }}
 >
 <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
 <div className="absolute top-1/2 -translate-y-1/2 left-2 bg-[var(--surface)] rounded px-1.5 py-0.5 text-[8.5px] font-mono text-[var(--ink)] whitespace-nowrap shadow-xl">
 {formatTime(start + simulatedTime)}
 </div>
 </div>

 {/* Background track ticks */}
 <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-5">
 {[...Array(20)].map((_, i) => (
 <div key={i} className="h-full w-[1px] bg-white" />
 ))}
 </div>
 </div>

 <div className="flex justify-between text-[10px] font-mono text-[var(--ink-2)] px-1">
 <span>⏱️ Inicio: <strong className="text-[var(--ink)] font-bold">{formatTime(start)}</strong> ({start}s)</span>
 <span className="text-[var(--acc)] bg-[var(--acc)]/10 px-2.5 py-0.5 rounded-full font-bold">
 Duración: {duration} segundos
 </span>
 <span>⏱️ Fin: <strong className="text-[var(--ink)] font-bold">{formatTime(end)}</strong> ({end}s)</span>
 </div>
 </div>

 {/* Controles Interactivos de Edición de Crop */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
 {/* Ajustar Inicio (Izquierda) */}
 <div className="space-y-1.5 text-left">
 <div className="flex justify-between items-center">
 <span className="text-[10.5px] font-mono text-[var(--ink-2)] font-extrabold uppercase tracking-wider flex items-center gap-1">
 <span>⬅️ Ajustar Inicio (Izquierda)</span>
 </span>
 <span className="text-[10px] font-mono text-[var(--ink)] font-bold bg-[var(--surface)] px-2 py-0.5 rounded">
 {formatTime(start)}
 </span>
 </div>
 <div className="flex gap-2">
 <button
 id="btn-crop-start-minus"
 type="button"
 onClick={() => handleAdjustCrop('start_minus')}
 className="flex-1 px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-[var(--ink)] flex items-center justify-center gap-1 cursor-pointer"
 title="Mover inicio 1 segundo atrás (extender por la izquierda)"
 >
 <ChevronLeft className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>-1s (Extender)</span>
 </button>
 <button
 id="btn-crop-start-plus"
 type="button"
 disabled={start >= end - 1}
 onClick={() => handleAdjustCrop('start_plus')}
 className="flex-1 px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-[var(--ink)] flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Mover inicio 1 segundo adelante (recortar por la izquierda)"
 >
 <span>+1s (Recortar)</span>
 <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
 </button>
 </div>
 </div>

 {/* Ajustar Fin (Derecha) */}
 <div className="space-y-1.5 text-left">
 <div className="flex justify-between items-center">
 <span className="text-[10.5px] font-mono text-[var(--ink-2)] font-extrabold uppercase tracking-wider flex items-center gap-1">
 <span>➡️ Ajustar Fin (Derecha)</span>
 </span>
 <span className="text-[10px] font-mono text-[var(--ink)] font-bold bg-[var(--surface)] px-2 py-0.5 rounded">
 {formatTime(end)}
 </span>
 </div>
 <div className="flex gap-2">
 <button
 id="btn-crop-end-minus"
 type="button"
 disabled={end <= start + 1}
 onClick={() => handleAdjustCrop('end_minus')}
 className="flex-1 px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-[var(--ink)] flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Mover fin 1 segundo atrás (recortar por la derecha)"
 >
 <ChevronLeft className="w-4 h-4 text-amber-500 shrink-0" />
 <span>-1s (Recortar)</span>
 </button>
 <button
 id="btn-crop-end-plus"
 type="button"
 onClick={() => handleAdjustCrop('end_plus')}
 className="flex-1 px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] hover:-neutral-700 hover:bg-neutral-850 active:scale-95 transition-all text-xs font-mono font-bold text-[var(--ink)] flex items-center justify-center gap-1 cursor-pointer"
 title="Mover fin 1 segundo adelante (extender por la derecha)"
 >
 <span>+1s (Extender)</span>
 <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />
 </button>
 </div>
 </div>
 </div>

 {/* Extra informational feedback with nice indicators */}
 <div className="bg-[var(--surface)]/50 p-3 rounded-[var(--r-m)] text-[11px] text-[var(--ink-2)] leading-relaxed font-sans space-y-1">
 <p>
 🚀 <strong>¿Por qué dura exactamente esto?</strong> Los primeros segundos de un video son vitales para retener al espectador. Este recorte fue calculado por el algoritmo de IA basándose en los picos de intensidad acústica y velocidad de habla de la banda, asegurando una retención óptima.
 </p>
 </div>
 </div>
 );
 }
 return null;
 })()}

 {/* ✂️ REAL PHYSICAL CUTTING & AUTOMATIC SUBTITLING SYSTEM */}
 {highlights[selectedHighlightIndex] && youtubeUrl && (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/60 -neutral-800/85 space-y-4">
 <div className="flex items-center gap-2">
 <Film className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-xs font-mono font-extrabold uppercase text-[var(--ink)] tracking-wider">
 Generador de Reel Físico y Subtítulos
 </span>
 </div>

 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed font-sans">
 Corta físicamente el fragmento del vídeo de YouTube a formato vertical 9:16 para Reels/TikTok y genera la pista de subtítulos sincronizada con la voz.
 </p>

 {/* Opciones de renderizado */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <span className="block text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">Encuadre vertical</span>
 <div className="grid grid-cols-3 gap-1">
 {([
 { valor:'crop' as const, etiqueta:'Recortar', ayuda:'Recorta los laterales. Encuadre cerrado: puede dejar fuera a parte de la banda.' },
 { valor:'blur' as const, etiqueta:'Fondo blur', ayuda:'Mete el vídeo entero centrado sobre un fondo desenfocado. No se pierde a nadie.' },
 { valor:'none' as const, etiqueta:'Original', ayuda:'Deja el encuadre horizontal tal cual.' }
 ]).map(opcion => (
 <button
 key={opcion.valor}
 type="button"
 title={opcion.ayuda}
 onClick={() => setCropMode(opcion.valor)}
 disabled={isCuttingVideo}
 className={`px-2 py-1.5 rounded-[var(--r-s)] text-[9.5px] font-mono font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
 cropMode === opcion.valor
 ?'bg-[var(--acc)] text-[var(--acc-ink)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {opcion.etiqueta}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-1.5">
 <span className="block text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">Subtítulos</span>
 <button
 type="button"
 onClick={() => setBurnSubtitles(v => !v)}
 disabled={isCuttingVideo || (videoMeta ? !videoMeta.hasTranscript : false)}
 title={videoMeta && !videoMeta.hasTranscript
 ?'Este vídeo no tiene transcripción en YouTube, así que no hay nada que incrustar.'
 :'Graba los subtítulos dentro de la imagen, que es como se ven en Reels y TikTok sin activar nada.'}
 className={`w-full px-3 py-1.5 rounded-[var(--r-s)] text-[9.5px] font-mono font-bold cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
 burnSubtitles
 ?'bg-emerald-500/15 -emerald-500/40 text-[var(--ink-2)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {burnSubtitles ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 opacity-40" />}
 <span>{burnSubtitles ?'Incrustados en el vídeo' :'Solo pista .vtt aparte'}</span>
 </button>
 {videoMeta && !videoMeta.hasTranscript && (
 <p className="text-[9px] font-mono text-[var(--ink-2)] leading-tight">Este vídeo no tiene transcripción en YouTube.</p>
 )}
 {burnSubtitles && (
 <button
 type="button"
 onClick={() => setKaraokeSubtitles(v => !v)}
 disabled={isCuttingVideo}
 title="Resalta cada palabra según se pronuncia, como en TikTok/CapCut, en vez de enseñar la línea entera fija."
 className={`w-full px-3 py-1.5 rounded-[var(--r-s)] text-[9.5px] font-mono font-bold cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
 karaokeSubtitles
 ?'bg-[var(--acc)]/15 -[var(--acc)]/40 text-[var(--acc)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {karaokeSubtitles ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5 opacity-40" />}
 <span>{karaokeSubtitles ?'Resaltado palabra a palabra' :'Línea fija clásica'}</span>
 </button>
 )}
 </div>
 </div>

 {/* Rendering State indicators */}
 {isCuttingVideo ? (
 <div className="bg-[var(--surface)]/80 p-4 rounded-[var(--r-m)] space-y-3 animate-pulse">
 <div className="flex items-center gap-3">
 <RefreshCw className="w-5 h-5 text-[var(--acc)] animate-spin" />
 <span className="text-xs font-mono font-extrabold text-[var(--ink-2)]">
 RENDERIZANDO ARCHIVOS REALES...
 </span>
 </div>
 <p className="text-[11px] text-[var(--acc)] font-mono pl-8">
 ⚡ {cuttingProgressText}
 </p>
 <div className="w-full h-1 bg-[var(--surface)]/80 rounded-full overflow-hidden">
 <div className="h-full bg-gradient-to-r from-[var(--acc)] to-emerald-500 animate-pulse" style={{ width:'75%' }}></div>
 </div>
 </div>
 ) : renderedClipUrl ? (
 <div className="bg-[var(--ok-soft)] p-4 rounded-[var(--r-m)] -emerald-800/40 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-xs font-mono font-extrabold text-[var(--ink)] uppercase tracking-wider">
 ¡Reel Renderizado con Éxito!
 </span>
 </div>
 <div className="flex gap-1 shrink-0">
 <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[var(--surface)]/15 text-[var(--ok)] font-extrabold -emerald-500/30">
 {cropMode ==='none' ?'ORIGINAL' : cropMode ==='blur' ?'9:16 BLUR' :'9:16'}
 </span>
 {renderedBurnedSubs && (
 <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[var(--acc)]/15 text-[var(--acc)] font-extrabold -[var(--acc)]/30">
 SUBS
 </span>
 )}
 </div>
 </div>

 <p className="text-[11px] text-[var(--ink)]">
 Clip listo{renderedClipSize > 0 ? ` (${(renderedClipSize / (1024 * 1024)).toFixed(1)} MB)` :''}. Se está reproduciendo en el simulador de la izquierda y puedes descargarlo ya.
 </p>

 {/* Sin esto, el usuario no sabe si el clip va a seguir ahí mañana o solo hasta el
 próximo despliegue del servidor. */}
 <div className={`p-2 rounded-[var(--r-s)] text-[10px] font-mono flex items-center gap-2 ${
 renderedStoredPermanently
 ?'bg-emerald-500/10 -emerald-500/20 text-[var(--ink-2)]'
 :'bg-[var(--acc)]/10 -amber-0/20 text-[var(--acc)]/70'
 }`}>
 <span>
 {renderedStoredPermanently
 ?'☁️ Guardado de forma permanente. Seguirá disponible aunque pase el tiempo.'
 :'⚠️ Guardado solo temporalmente en el servidor. Descárgalo antes de que se reinicie o se despliegue una nueva versión.'}
 </span>
 </div>

 {sinTranscripcionReal && (
 <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 -amber-0/20 text-[10px] text-[var(--acc)]/70 font-mono flex items-center gap-2">
 <span>ℹ️ Este vídeo no tiene transcripción en YouTube, así que el clip va sin subtítulos.</span>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-2 pt-1">
 <a
 href={renderedClipUrl}
 download={`${(bandName ||'reel').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') ||'reel'}-${highlights[selectedHighlightIndex]?.range?.replace(/[^0-9]/g,'') ||'clip'}.mp4`}
 rel="noreferrer noopener"
 className="flex-1 px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:-neutral-700 text-[11px] font-mono font-bold text-[var(--acc)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Descargar MP4</span>
 </a>

 {renderedSubUrl && !renderedBurnedSubs && (
 <a
 href={renderedSubUrl}
 download="subtitulos.vtt"
 rel="noreferrer noopener"
 className="flex-1 px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)] hover:-neutral-700 text-[11px] font-mono font-bold text-[var(--ink-2)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 <span>Descargar .VTT</span>
 </a>
 )}
 
 <button
 type="button"
 onClick={handleCutPhysicalVideo}
 className="flex-1 px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/10 -[var(--acc)]/20 hover:bg-[var(--acc)]/20 text-[11px] font-mono font-bold text-[var(--acc)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
 >
 <RotateCcw className="w-3.5 h-3.5" />
 <span>Volver a Renderizar</span>
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 {cuttingError && (
 <div className="bg-red-950/20 p-3 rounded-[var(--r-m)] -red-800/40 text-[10.5px] text-red-400 font-mono flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
 <div className="space-y-1">
 <span className="font-bold">ERROR DE RENDERIZADO:</span>
 <p className="leading-relaxed">{cuttingError}</p>
 </div>
 </div>
 )}

 <button
 type="button"
 onClick={handleCutPhysicalVideo}
 className="w-full py-3 px-4 rounded-[var(--r-m)] bg-gradient-to-r from-amber-500 via-[var(--acc)] to-yellow-400 hover:brightness-105 active:scale-[0.99] font-sans font-black uppercase text-xs text-[var(--ink)] tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/10 transition-all duration-200"
 >
 <Sparkles className="w-4 h-4 text-[var(--ink)] fill-bg-[var(--surface)]" />
 <span>✂️ Renderizar Reel Físico + Auto-Subtítulos (9:16)</span>
 </button>
 </div>
 )}

 {/* Subtitles timing preview list */}
 {subtitleCues.length > 0 && (
 <div className="bg-[var(--surface)]/40 p-4 rounded-[var(--r-m)] space-y-2.5">
 <div className="flex justify-between items-center -neutral-800/50 pb-1.5">
 <span className="text-[9.5px] font-mono font-extrabold uppercase text-[var(--ink-2)] tracking-wider">
 Pista de Subtítulos Generada ({subtitleCues.length} líneas)
 </span>
 <span className="text-[8px] font-mono text-emerald-400 font-bold">● AUTO-SYNCED</span>
 </div>
 <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1 text-[10px] scrollbar-thin scrollbar-thumb-neutral-800">
 {subtitleCues.map((cue, idx) => (
 <div key={idx} className="flex gap-2 items-start py-0.5 -bg-[var(--surface)]/30 last:">
 <span className="text-[8.5px] font-mono text-[var(--acc)] font-bold bg-[var(--surface)] px-1.5 py-0.5 rounded shrink-0">
 {cue.start.toFixed(1)}s
 </span>
 <p className="text-[var(--ink)] font-sans italic leading-tight">"{cue.text}"
 </p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Word-level exact offsets preview */}
 {wordOffsets.length > 0 && (
 <div className="bg-[var(--surface)]/40 p-4 rounded-[var(--r-m)] space-y-2.5 mt-3">
 <div className="flex justify-between items-center -neutral-800/50 pb-1.5">
 <span className="text-[9.5px] font-mono font-extrabold uppercase text-[var(--ink-2)] tracking-wider flex items-center gap-1">
 <span>⚡ Offsets de Palabras Sincronizados ({wordOffsets.length})</span>
 </span>
 <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[var(--surface)]/15 text-[var(--ok)] font-bold -emerald-500/20">
 SINCRO LOCAL
 </span>
 </div>

 <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 text-[9.5px] scrollbar-thin scrollbar-thumb-neutral-800">
 {wordOffsets.map((w, idx) => (
 <div 
 key={idx} 
 className="px-2 py-1 rounded bg-[var(--surface)] -neutral-800/80 flex items-center gap-1 hover:-neutral-700 hover:bg-neutral-850 transition-colors"
 title={`Exact times: ${w.start.toFixed(2)}s to ${w.end.toFixed(2)}s`}
 >
 <span className="text-[var(--ink-2)] font-sans font-medium">"{w.word}"</span>
 <span className="text-[8px] font-mono text-[var(--acc)]">
 {w.start.toFixed(2)}s
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Hook, CTA y variantes por plataforma: lo que de verdad decide si alguien
 se queda en el primer segundo, y que antes la IA ni generaba. */}
 {(() => {
 const clip = highlights[selectedHighlightIndex];
 if (!clip) return null;
 const variantes = [
 { etiqueta:'Instagram', texto: clip.recommendedCopy },
 { etiqueta:'TikTok', texto: clip.copyTikTok },
 { etiqueta:'YouTube Shorts', texto: clip.copyYouTube },
 { etiqueta:'Facebook', texto: clip.copyFacebook }
 ].filter(v => v.texto && v.texto.trim());

 if (!clip.hookText && !clip.cta && variantes.length < 2 && !(clip.hashtags || []).length) return null;

 return (
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)]/40 -neutral-800/60 space-y-3">
 {clip.hookText && (
 <div className="space-y-1">
 <span className="block text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">
 Rótulo para los primeros 2 segundos
 </span>
 <div className="flex items-center gap-2">
 <p className="flex-1 text-sm font-black text-[var(--acc)] leading-tight">"{clip.hookText}"</p>
 <button
 type="button"
 onClick={() => handleCopyToClipboard(clip.hookText ||'')}
 className="shrink-0 px-2 py-1 rounded-[var(--r-s)] bg-[var(--surface)] text-[9px] font-mono text-[var(--ink-2)] hover:text-[var(--ink-2)] cursor-pointer"
 >
 Copiar
 </button>
 </div>
 </div>
 )}

 {clip.cta && (
 <div className="space-y-1">
 <span className="block text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">Llamada a la acción</span>
 <p className="text-[11px] text-[var(--ink)] leading-snug">{clip.cta}</p>
 </div>
 )}

 {variantes.length > 1 && (
 <div className="space-y-1.5">
 <span className="block text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">
 Versiones por plataforma (pulsa para usarla)
 </span>
 <div className="flex flex-wrap gap-1.5">
 {variantes.map(v => (
 <button
 key={v.etiqueta}
 type="button"
 onClick={() => setEditedCopy(v.texto ||'')}
 title={v.texto}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[9.5px] font-mono font-bold cursor-pointer transition-all ${
 editedCopy === v.texto
 ?'bg-[var(--acc)] text-[var(--acc-ink)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 {v.etiqueta}
 </button>
 ))}
 </div>
 </div>
 )}

 {(clip.hashtags || []).length > 0 && (
 <div className="space-y-1.5">
 <div className="flex justify-between items-center">
 <span className="text-[9px] font-mono uppercase text-[var(--ink-2)] tracking-wider">Hashtags sugeridos</span>
 <button
 type="button"
 onClick={() => setEditedCopy(prev => `${prev.trimEnd()}\n\n${(clip.hashtags || []).join('')}`.trim())}
 className="text-[9px] font-mono text-[var(--acc)] hover:underline cursor-pointer bg-transparent -none"
 >
 Añadir todos al copy
 </button>
 </div>
 <div className="flex flex-wrap gap-1">
 {(clip.hashtags || []).map((tag, i) => (
 <span key={`${tag}-${i}`} className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[9px] font-mono text-[var(--ink-2)]">
 {tag}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 );
 })()}

 {/* Copy Editor Area */}
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-xs font-mono font-bold text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
 <span>📝 Copy de Publicación Generado</span>
 </label>
 
 <button
 id="btn-copy-text"
 type="button"
 onClick={() => handleCopyToClipboard(editedCopy ||'')}
 className="text-xs font-mono text-[var(--acc)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent -none py-1 px-2 rounded-[var(--r-s)] hover:bg-[var(--surface)]/80"
 >
 {copySuccess ? (
 <>
 <Check className="w-3.5 h-3.5 text-emerald-400" />
 <span className="text-emerald-400 font-bold">¡Copiado!</span>
 </>
 ) : (
 <>
 <Share2 className="w-3.5 h-3.5" />
 <span>Copiar al portapapeles</span>
 </>
 )}
 </button>
 </div>
 
 <textarea
 id="txt-expanded-copy"
 value={editedCopy}
 onChange={(e) => setEditedCopy(e.target.value)}
 rows={7}
 placeholder="Escribe el copy para tus redes sociales..."
 className="w-full text-xs font-sans bg-[var(--surface)] rounded-[var(--r-m)] p-4 text-[var(--ink-2)] focus:outline-none focus:-neutral-700 leading-relaxed font-normal shadow-inner"
 />
 <p className="text-[9.5px] font-mono text-[var(--ink-2)]">
 * Puedes editar este texto libremente antes de programarlo. Se actualizará en tiempo real en la pantalla del simulador de la izquierda.
 </p>
 </div>

 {/* Scheduling controls inside Modal */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[var(--r-m)] bg-[var(--surface)]/30 -neutral-800/50">
 <div>
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)] mb-1 font-bold">Plataforma</label>
 <select
 id="modal-platform-select"
 value={selectedPlatform}
 onChange={(e) => {
 const nuevaPlataforma = e.target.value as'Instagram' |'TikTok' |'YouTube' |'Facebook';
 setSelectedPlatform(nuevaPlataforma);
 setEditedCopy(copyForPlatform(highlights[selectedHighlightIndex], nuevaPlataforma));
 }}
 className="w-full text-xs font-mono bg-[var(--surface)] rounded-[var(--r-s)] p-2 text-[var(--ink)] focus:outline-none cursor-pointer"
 >
 <option value="Instagram">Instagram Reel</option>
 <option value="TikTok">TikTok Video</option>
 <option value="YouTube">YouTube Shorts</option>
 <option value="Facebook">Facebook</option>
 </select>
 </div>

 <div>
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)] mb-1 font-bold">Fecha de Publicación</label>
 <input
 id="modal-date-input"
 type="date"
 value={scheduledDate}
 onChange={(e) => setScheduledDate(e.target.value)}
 className="w-full text-xs font-mono bg-[var(--surface)] rounded-[var(--r-s)] p-2 text-[var(--ink)] focus:outline-none cursor-pointer"
 />
 </div>

 <div>
 <label className="block text-[9px] font-mono uppercase text-[var(--ink-2)] mb-1 font-bold">Hora Óptima Sugerida</label>
 <input
 id="modal-time-input"
 type="time"
 value={scheduledTime}
 onChange={(e) => setScheduledTime(e.target.value)}
 className="w-full text-xs font-mono bg-[var(--surface)] rounded-[var(--r-s)] p-2 text-[var(--ink)] focus:outline-none cursor-pointer"
 />
 </div>
 </div>

 {optimalTime && (
 <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 px-1">
 <Check className="w-3.5 h-3.5 shrink-0 animate-bounce" />
 <span><strong>Sugerencia de la IA:</strong> Programar el {optimalTime.day} {optimalTime.date} a las {optimalTime.time} ({optimalTime.reason})</span>
 </p>
 )}

 </div>

 {/* Success / Error states and main schedule action */}
 <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="text-left">
 {schedulingSuccess ? (
 <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
 <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
 <span>¡Clip guardado e insertado en tu agenda de redes!</span>
 </div>
 ) : scheduleErrors.length > 0 ? (
 <div className="space-y-1">
 {scheduleErrors.map((problema) => (
 <div key={problema} className="flex items-center gap-1.5 text-red-400 text-[11px] font-mono">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
 <span>{problema}</span>
 </div>
 ))}
 </div>
 ) : scheduleWarnings.length > 0 ? (
 <div className="space-y-1">
 {scheduleWarnings.map((aviso) => (
 <div key={aviso} className="flex items-center gap-1.5 text-[var(--acc)] text-[11px] font-mono">
 <AlertCircle className="w-3.5 h-3.5 shrink-0" />
 <span>{aviso}</span>
 </div>
 ))}
 </div>
 ) : (
 <span className="text-[10px] font-mono text-[var(--ink-2)]">Se guarda en tu agenda de Reels</span>
 )}
 </div>

 <div className="flex gap-3 w-full sm:w-auto">
 <button
 id="btn-modal-cancel"
 type="button"
 onClick={() => setIsExpandedPreview(false)}
 className="flex-1 sm:flex-none px-5 py-2.5 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 text-xs font-mono font-bold transition-all cursor-pointer"
 >
 Salir de Modo Cine
 </button>

 <button
 id="btn-modal-submit-schedule"
 type="button"
 onClick={(e) => {
 handleSchedulePost(e);
 }}
 disabled={isScheduling || !editedCopy.trim()}
 className="flex-1 sm:flex-none px-6 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--acc-ink)] hover:bg-[#ffc634] active:scale-95 transition-all cursor-pointer text-xs font-mono font-bold disabled:opacity-40"
 >
 {isScheduling ?'Guardando...' :'Aprobar y Programar Post'}
 </button>
 </div>
 </div>

 </div>

 </div>
 </div>
 )}

 {/* Modal de Tono de Expresión de la banda activa */}
 <BandToneModal
 isOpen={isBakandeyaToneModalOpen}
 onClose={() => setIsBakandeyaToneModalOpen(false)}
 band={{
 id: instagramHandle ||'',
 nombre_banda: bandName ||'Tu Banda',
 estilo_musical:'',
 localizacion:'',
 estado_relacion:'colegas_aliados',
 ultimo_contacto:'Hoy'
 }}
 toneData={bakandeyaToneData}
 isLoading={isAnalyzingBakandeyaTone}
 isSaved={toneAnalysisSaved}
 editable
 onSaved={(data) => {
 setBakandeyaToneData(data);
 setToneAnalysisSaved(true);
 }}
 onReAnalyze={handleAnalyzeBakandeyaTone}
 onRefreshLearnedRules={handleRefreshLearnedRules}
 />

 </div>
 );
}

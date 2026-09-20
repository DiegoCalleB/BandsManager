import React, { useState, useRef, useEffect } from'react';
import { api } from'../services/api';
import { Message as MessageType, Lead, Rehearsal, Concert, ThemeColors, User as UserType, EPKConfig, DrumPatternStyle, SongAudioIdea, MelodicInstrument, MelodicNoteEvent } from'../types';
import { Send, Bot, Guitar, User, Sparkles, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Calendar, ShieldAlert, X, Activity, ExternalLink, Terminal, Clock, Copy, Key, Sliders, Mail, PlayCircle, Save, Mic, Download } from'lucide-react';
import { AgentAutonomySettingsModal } from'./dashboard/AgentAutonomySettingsModal';
import { apiFetch } from'../utils/api';
import { generateAccompanimentAudioBlob } from'../utils/accompanimentSynth';
import { renderMelodicIdeaAudioBlob } from'../utils/instrumentSynth';
import { eventosAMidiBlob } from'../utils/midiExport';
import { uploadFileToServer } from'../utils/audioStorage';

interface ProposedAction {
 status?:'pending' |'applied' |'dismissed';
 type:'propose_lead_approval' |'propose_rehearsal' |'propose_status_change' |'propose_agent_trigger' |'propose_concert' |'propose_add_concert' |'propose_band' |'propose_tour' |'propose_update_logo' |'propose_send_email' |'propose_draft_email' |'propose_add_lead' |'propose_update_lead' |'propose_accompaniment' |'propose_melodic_idea';
 leadId?: string;
 bandId?: string;
 targetType?:'lead' |'band';
 targetName?: string;
 leadName?: string;
 description: string;
 newStatus?: string;
 agentName?: string;
 params?: any;
 concert?: Partial<Concert>;
 rehearsal?: Partial<Rehearsal>;
 band?: any;
 tour?: any;
 imagen_url?: string;
 icono?: string;
 subject?: string;
 body?: string;
 senderName?: string;
 attachDossier?: boolean;
 incluirFirmaRedes?: boolean;
 lead?: any;
 updatedFields?: any;
 accompaniment?: {
 bpm: number;
 keyName: string;
 drumPattern: DrumPatternStyle;
 includeDrums: boolean;
 includeBass: boolean;
 durationSecs: number;
 songId?: string;
 songTitle?: string;
 };
 melodicIdea?: {
 instrument: MelodicInstrument;
 bpm: number;
 keyName: string;
 escala?:'mayor' |'menor';
 durationSecs: number;
 seccion?: SongAudioIdea['seccion'];
 songId?: string;
 songTitle?: string;
 eventos: MelodicNoteEvent[];
 };
}

interface ChatMessage {
 id: string;
 sender:'user' |'bot';
 text: string;
 timestamp: Date;
 proposedActions?: ProposedAction[];
 actionStatus?:'pending' |'applied' |'dismissed';
}

interface ChatbotProps {
 key?: string;
 colors: ThemeColors;
 leads: Lead[];
 rehearsals: Rehearsal[];
 concerts: Concert[];
 epkConfig?: Partial<EPKConfig>;
 onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
 onCreateLead?: (lead: Lead) => void;
 onAddRehearsal: (rehearsal: Rehearsal) => void;
 onAddConcert?: (concert: Concert) => void;
 onNavigate?: (view: string, options?: any) => void;
 isFloating?: boolean;
 onClose?: () => void;
 userRole?: string;
 currentUser?: UserType | null;
 activeBandName?: string;
 onLoadingChange?: (isLoading: boolean) => void;
}

export default function Chatbot({ colors, leads, rehearsals, concerts, epkConfig, onUpdateLead, onCreateLead, onAddRehearsal, onAddConcert, onNavigate, isFloating, onClose, userRole, currentUser, activeBandName, onLoadingChange }: ChatbotProps) {
 const isAdmin = userRole ==='admin' || userRole ==='leader' || (currentUser?.role as string) ==='admin' || currentUser?.role ==='leader';
 const [isAutonomyModalOpen, setIsAutonomyModalOpen] = useState(false);
 const bandDisplayName = activeBandName || currentUser?.bandName ||'vuestra banda';
 const effectiveBandId = currentUser?.band_id || (currentUser as any)?.bandId;
 const cleanUserName = (() => {
 const rawName = currentUser?.name || currentUser?.username ||'';
 if (!rawName) return'equipo';
 
 const lowerRaw = rawName.toLowerCase().replace(/^(band|reg)-/,'').trim();
 const lowerBandDisplay = bandDisplayName.toLowerCase().replace(/^(band|reg)-/,'').trim();
 
 if (
 lowerRaw === lowerBandDisplay ||
 ['repercusion','bakandeya','admin','user','guest','leader','member','banda','equipo'].includes(lowerRaw) ||
 lowerRaw.startsWith('band-') ||
 lowerRaw.startsWith('reg-')
 ) {
 return'equipo';
 }
 const firstName = rawName.split('')[0].trim();
 return firstName ||'equipo';
 })();

 const storageKey = `bakandeya_chat_messages_${currentUser?.id ||'guest'}_${currentUser?.band_id ||'default'}`;

 const cleanLegacyText = (text: string) => {
 if (!text) return text;
 return text
 .replace(/hoja de datos de Google Sheets \(salas\)/gi,'base de datos de Supabase (salas)')
 .replace(/hoja de datos de Google Sheets/gi,'base de datos de Supabase')
 .replace(/Google Sheets/gi,'Supabase')
 .replace(/GitHub Actions/gi,'Supabase Native Engine')
 .replace(/tareas de Python en GitHub Actions/gi,'tareas nativas en Supabase')
 .replace(/Agentes Python/gi,'Agentes Supabase')
 .replace(/Python/gi,'Supabase');
 };

 const getWelcomeMessageText = (name: string, band: string) => {
 return `👋 **¡Buenas, ${name}!** Soy vuestro **Manager Virtual de ${band}**.\n\nEstoy conectado en tiempo real con vuestra base de datos de Supabase (salas), el calendario de ensayos de banda, la contabilidad y la logística de redes.\n\nPuedes preguntarme cosas como:\n- *¿Qué salas tengo pendientes de aprobación en Madrid o Granada?*\n- *Resúmeme el estado de la semana o hazme una lista de tareas para hoy.*\n- *¿Cuántas salas de Ska, Reggae o Fusión tenemos registradas?*\n\nSi necesitas, puedo **proponer cambios directos** en las salas (como aprobar un correo de contacto) o agendar ensayos, pidiéndote confirmación antes de actuar.`;
 };

 let chatMsgSeq = 0;
 const generateUniqueMsgId = (prefix: string ='msg'): string => {
 chatMsgSeq += 1;
 const rand = Math.random().toString(36).substring(2, 7);
 return `${prefix}-${Date.now()}-${chatMsgSeq}-${rand}`;
 };

 const ensureUniqueMessageIds = (rawMessages: any[]): ChatMessage[] => {
 const seenIds = new Set<string>();
 return rawMessages.map((m: any, idx: number) => {
 let msgId = m.id;
 if (!msgId || seenIds.has(msgId)) {
 msgId = generateUniqueMsgId(typeof msgId ==='string' && msgId ? msgId.split('-')[0] :'msg');
 }
 seenIds.add(msgId);
 return {
 ...m,
 id: msgId,
 text: cleanLegacyText(m.text),
 timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
 proposedActions: (m.proposedActions || []).map((act: any) => ({
 ...act,
 status: act.status || (m.actionStatus ==='applied' ?'applied' : m.actionStatus ==='dismissed' ?'dismissed' :'pending')
 }))
 };
 });
 };

 const [messages, setMessages] = useState<ChatMessage[]>(() => {
 const saved = localStorage.getItem(storageKey);
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 if (Array.isArray(parsed) && parsed.length > 0) {
 return ensureUniqueMessageIds(parsed);
 }
 } catch (e) {
 console.error("Error al cargar historial del chat:", e);
 }
 }
 return [
 {
 id:'welcome-1',
 sender:'bot',
 text: getWelcomeMessageText(cleanUserName, bandDisplayName),
 timestamp: new Date()
 }
 ];
 });

 // Re-sync messages when storageKey or active band changes
 useEffect(() => {
 const saved = localStorage.getItem(storageKey);
 if (saved) {
 try {
 const parsed = JSON.parse(saved);
 if (Array.isArray(parsed) && parsed.length > 0) {
 setMessages(ensureUniqueMessageIds(parsed));
 return;
 }
 } catch (e) {
 console.error("Error re-loading chat for band:", e);
 }
 }
 setMessages([
 {
 id: generateUniqueMsgId('welcome'),
 sender:'bot',
 text: getWelcomeMessageText(cleanUserName, bandDisplayName),
 timestamp: new Date()
 }
 ]);
 }, [storageKey, bandDisplayName]);

 useEffect(() => {
 try {
 localStorage.setItem(storageKey, JSON.stringify(messages));
 } catch (e) {
 console.error("Error al guardar historial del chat:", e);
 }
 }, [messages, storageKey]);
 const [inputText, setInputText] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 // Bases rítmicas generadas al vuelo (síntesis local Web Audio) por'propose_accompaniment',
 // guardadas por clave"msgId-actionIndex" para no regenerar el audio en cada re-render.
 const [accompanimentAudio, setAccompanimentAudio] = useState<Record<string, {
 loading: boolean;
 url?: string;
 error?: string;
 saving?: boolean;
 savedToSong?: string;
 saveError?: string;
 }>>({});

 // Cuando el chatbot no ha identificado una canción exacta del repertorio (el usuario pidió la
 // base/idea sin nombrar un tema, o Gemini no encontró coincidencia), en vez de fallar con un
 // error sin salida se ofrece un desplegable para elegir a mano en qué canción guardarla.
 // Compartido entre'propose_accompaniment' y'propose_melodic_idea': audioKey ("msgId-actionIndex")
 // es único por acción dentro del mensaje, así que no hay colisión entre ambos tipos.
 const [songPicker, setSongPicker] = useState<Record<string, { songs: { id: string; titulo: string }[]; selectedId: string }>>({});

 const buildBandAuthHeaders = (): Record<string, string> => {
 const token = localStorage.getItem('bakandeya_token');
 const activeBandId = currentUser?.band_id ||'';
 return {'Content-Type':'application/json','Authorization': token ? `Bearer ${token}` :'',
 ...(activeBandId ? {'x-band-id': activeBandId } : {})
 };
 };

 const handleGenerateAccompanimentAudio = async (key: string, params: NonNullable<ProposedAction['accompaniment']>) => {
 setAccompanimentAudio(prev => ({ ...prev, [key]: { loading: true } }));
 try {
 const blob = await generateAccompanimentAudioBlob({
 bpm: params.bpm,
 durationSecs: params.durationSecs,
 keyName: params.keyName,
 includeDrums: params.includeDrums,
 includeBass: params.includeBass,
 drumPattern: params.drumPattern
 });
 const url = URL.createObjectURL(blob);
 setAccompanimentAudio(prev => ({ ...prev, [key]: { loading: false, url } }));
 } catch (err) {
 console.error('Error generando base rítmica:', err);
 setAccompanimentAudio(prev => ({ ...prev, [key]: { loading: false, error:'No se pudo sintetizar el audio en este navegador.' } }));
 }
 };

 // Guarda la base ya generada como una nueva idea de audio en una canción existente del
 // repertorio. Se manda SIEMPRE la canción completa (fetch + spread), nunca un parche parcial:
 // dbUpsertSong rellena con valores por defecto cualquier campo ausente (ver server/db/repertoire.ts),
 // así que un PUT parcial borraría título, bpm y tonalidad de la canción real.
 const handleSaveAccompanimentToSong = async (key: string, params: NonNullable<ProposedAction['accompaniment']>, overrideSongId?: string) => {
 const current = accompanimentAudio[key];
 if (!current?.url) return;

 setAccompanimentAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: true, saveError: undefined } }));
 try {
 const activeBandId = currentUser?.band_id ||'';
 const headers = buildBandAuthHeaders();

 const songsRes = await fetch('/api/songs', { headers });
 const songsData = await songsRes.json().catch(() => null);
 const allSongs: any[] = songsData?.songs || [];

 let targetSong = overrideSongId ? allSongs.find(s => s.id === overrideSongId) : undefined;
 if (!targetSong) {
 targetSong = params.songId ? allSongs.find(s => s.id === params.songId) : undefined;
 }
 if (!targetSong && params.songTitle) {
 const lowerTitle = params.songTitle.trim().toLowerCase();
 targetSong = allSongs.find(s => (s.titulo ||'').trim().toLowerCase() === lowerTitle)
 || allSongs.find(s => (s.titulo ||'').toLowerCase().includes(lowerTitle));
 }
 // No se ha podido resolver la canción sola (ni por id ni por título, ni el usuario ha
 // elegido una del desplegable todavía): en vez de fallar sin salida, se ofrece elegir a
 // mano entre las canciones reales del repertorio.
 if (!targetSong) {
 setAccompanimentAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
 setSongPicker(prev => ({ ...prev, [key]: { songs: allSongs.map(s => ({ id: s.id, titulo: s.titulo })), selectedId: prev[key]?.selectedId ||'' } }));
 return;
 }

 const wavBlob = await (await fetch(current.url)).blob();
 const fileName = `chatbot-base-${params.drumPattern}-${Date.now()}.wav`;
 const file = new File([wavBlob], fileName, { type:'audio/wav' });
 const uploadedUrl = await uploadFileToServer(file, { bandId: activeBandId });

 const newIdea: SongAudioIdea = {
 id: `idea-${Date.now()}`,
 titulo: `Base IA (${params.drumPattern.toUpperCase()} - ${params.keyName})`,
 seccion:'general',
 audioUrl: uploadedUrl,
 subidoPor: cleanUserName,
 instrumento: params.includeDrums && params.includeBass ?'Batería + Bajo (AI)' : params.includeDrums ?'Batería (AI)' :'Bajo (AI)',
 fecha: new Date().toISOString().split('T')[0],
 notas: `Generada desde el chatbot a ${params.bpm} BPM.`
 };

 const updatedSong = { ...targetSong, audioIdeas: [...(targetSong.audioIdeas || []), newIdea] };

 const putRes = await fetch(`/api/songs/${encodeURIComponent(targetSong.id)}`, {
 method:'PUT',
 headers,
 body: JSON.stringify(updatedSong)
 });
 if (!putRes.ok) throw new Error('El servidor rechazó el guardado de la canción.');

 setAccompanimentAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false, savedToSong: targetSong.titulo } }));
 setSongPicker(prev => { const next = { ...prev }; delete next[key]; return next; });
 } catch (err: any) {
 console.error('Error guardando base rítmica en el repertorio:', err);
 setAccompanimentAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false, saveError: err?.message ||'No se pudo guardar en el repertorio.' } }));
 }
 };

 // Ideas melódicas por instrumento ('propose_melodic_idea', síntesis local Tone.js), misma
 // mecánica que accompanimentAudio: se generan bajo demanda y se guardan por clave"msgId-actionIndex".
 const [melodicIdeaAudio, setMelodicIdeaAudio] = useState<Record<string, {
 loading: boolean;
 url?: string;
 error?: string;
 saving?: boolean;
 savedToSong?: string;
 saveError?: string;
 }>>({});

 const handleGenerateMelodicIdeaAudio = async (key: string, params: NonNullable<ProposedAction['melodicIdea']>) => {
 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { loading: true } }));
 try {
 const blob = await renderMelodicIdeaAudioBlob({
 instrument: params.instrument,
 bpm: params.bpm,
 durationSecs: params.durationSecs,
 eventos: params.eventos
 });
 const url = URL.createObjectURL(blob);
 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { loading: false, url } }));
 } catch (err) {
 console.error('Error generando idea melódica:', err);
 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { loading: false, error:'No se pudo sintetizar el audio en este navegador.' } }));
 }
 };

 // Descarga la idea como .mid. Un WAV solo se puede escuchar; un MIDI se abre en cualquier DAW o
 // editor de partituras y se edita nota a nota, así que es la forma de que la idea salga de aquí.
 const handleDownloadMelodicIdeaMidi = (params: NonNullable<ProposedAction['melodicIdea']>) => {
 const instrumentLabel = params.instrument.charAt(0).toUpperCase() + params.instrument.slice(1);
 const blob = eventosAMidiBlob({
 eventos: params.eventos,
 bpm: params.bpm,
 instrument: params.instrument,
 nombrePista: `Idea IA ${instrumentLabel} ${params.keyName}`
 });

 const url = URL.createObjectURL(blob);
 const enlace = document.createElement('a');
 enlace.href = url;
 enlace.download = `idea-${params.instrument}-${params.keyName}-${params.bpm}bpm.mid`;
 document.body.appendChild(enlace);
 enlace.click();
 document.body.removeChild(enlace);
 URL.revokeObjectURL(url);
 };

 const handleSaveMelodicIdeaToSong = async (key: string, params: NonNullable<ProposedAction['melodicIdea']>, overrideSongId?: string) => {
 const current = melodicIdeaAudio[key];
 if (!current?.url) return;

 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: true, saveError: undefined } }));
 try {
 const activeBandId = currentUser?.band_id ||'';
 const headers = buildBandAuthHeaders();

 const songsRes = await fetch('/api/songs', { headers });
 const songsData = await songsRes.json().catch(() => null);
 const allSongs: any[] = songsData?.songs || [];

 let targetSong = overrideSongId ? allSongs.find(s => s.id === overrideSongId) : undefined;
 if (!targetSong) {
 targetSong = params.songId ? allSongs.find(s => s.id === params.songId) : undefined;
 }
 if (!targetSong && params.songTitle) {
 const lowerTitle = params.songTitle.trim().toLowerCase();
 targetSong = allSongs.find(s => (s.titulo ||'').trim().toLowerCase() === lowerTitle)
 || allSongs.find(s => (s.titulo ||'').toLowerCase().includes(lowerTitle));
 }
 // Igual que en handleSaveAccompanimentToSong: sin coincidencia automática, se ofrece elegir
 // a mano en vez de fallar sin salida.
 if (!targetSong) {
 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false } }));
 setSongPicker(prev => ({ ...prev, [key]: { songs: allSongs.map(s => ({ id: s.id, titulo: s.titulo })), selectedId: prev[key]?.selectedId ||'' } }));
 return;
 }

 const wavBlob = await (await fetch(current.url)).blob();
 const fileName = `chatbot-idea-${params.instrument}-${Date.now()}.wav`;
 const file = new File([wavBlob], fileName, { type:'audio/wav' });
 const uploadedUrl = await uploadFileToServer(file, { bandId: activeBandId });

 const instrumentLabel = params.instrument.charAt(0).toUpperCase() + params.instrument.slice(1);
 const newIdea: SongAudioIdea = {
 id: `idea-${Date.now()}`,
 titulo: `Idea IA de ${instrumentLabel} (${params.keyName})`,
 seccion: params.seccion ||'general',
 audioUrl: uploadedUrl,
 subidoPor: cleanUserName,
 instrumento: `${instrumentLabel} (AI)`,
 fecha: new Date().toISOString().split('T')[0],
 notas: `Generada desde el chatbot a ${params.bpm} BPM.`
 };

 const updatedSong = { ...targetSong, audioIdeas: [...(targetSong.audioIdeas || []), newIdea] };

 const putRes = await fetch(`/api/songs/${encodeURIComponent(targetSong.id)}`, {
 method:'PUT',
 headers,
 body: JSON.stringify(updatedSong)
 });
 if (!putRes.ok) throw new Error('El servidor rechazó el guardado de la canción.');

 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false, savedToSong: targetSong.titulo } }));
 setSongPicker(prev => { const next = { ...prev }; delete next[key]; return next; });
 } catch (err: any) {
 console.error('Error guardando idea melódica en el repertorio:', err);
 setMelodicIdeaAudio(prev => ({ ...prev, [key]: { ...prev[key], saving: false, saveError: err?.message ||'No se pudo guardar en el repertorio.' } }));
 }
 };

 const accompanimentAudioRef = useRef(accompanimentAudio);
 accompanimentAudioRef.current = accompanimentAudio;
 const melodicIdeaAudioRef = useRef(melodicIdeaAudio);
 melodicIdeaAudioRef.current = melodicIdeaAudio;
 useEffect(() => {
 return () => {
 Object.values(accompanimentAudioRef.current).forEach(entry => {
 if (entry.url) URL.revokeObjectURL(entry.url);
 });
 Object.values(melodicIdeaAudioRef.current).forEach(entry => {
 if (entry.url) URL.revokeObjectURL(entry.url);
 });
 };
 }, []);

 const onLoadingChangeRef = useRef(onLoadingChange);
 useEffect(() => {
 onLoadingChangeRef.current = onLoadingChange;
 }, [onLoadingChange]);

 const prevLoadingRef = useRef<boolean>(isLoading);
 useEffect(() => {
 if (prevLoadingRef.current !== isLoading) {
 prevLoadingRef.current = isLoading;
 const timer = setTimeout(() => {
 if (onLoadingChangeRef.current) {
 onLoadingChangeRef.current(isLoading);
 }
 }, 0);
 return () => clearTimeout(timer);
 }
 }, [isLoading]);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 // Switch mode between Python GitHub Agents vs Direct Gemini AI
 const [agentsEnabled, setAgentsEnabled] = useState<boolean>(() => {
 const saved = localStorage.getItem('bakandeya_agents_enabled');
 return saved !== null ? saved ==='true' : false; // Default to false (Gemini Direct Mode)
 });

 useEffect(() => {
 localStorage.setItem('bakandeya_agents_enabled', String(agentsEnabled));
 }, [agentsEnabled]);

 const [autonomyConfig, setAutonomyConfig] = useState(() => {
 try {
 const saved = localStorage.getItem('bakandeya_agent_autonomy');
 if (saved) return JSON.parse(saved);
 } catch (e) {
 console.error(e);
 }
 return {
 dispatchLevel:'draft_only',
 negotiationDepth:'filter_conditions',
 minCacheThreshold: 300,
 maxCacheThreshold: 800,
 autoDeclineUnderMinCache: false,
 notifyOnEveryProposal: true,
 requireHumanForFinalSignOff: true
 };
 });

 useEffect(() => {
 const handleAutonomyChange = () => {
 try {
 const saved = localStorage.getItem('bakandeya_agent_autonomy');
 if (saved) setAutonomyConfig(JSON.parse(saved));
 } catch (e) {
 console.error(e);
 }
 };
 window.addEventListener('autonomy-settings-changed', handleAutonomyChange);
 return () => window.removeEventListener('autonomy-settings-changed', handleAutonomyChange);
 }, []);

 useEffect(() => {
 let isMounted = true;
 api.getAutonomyConfig()
 .then((cfg) => {
 if (isMounted && cfg && cfg.dispatchLevel) {
 setAutonomyConfig(cfg);
 try {
 localStorage.setItem('bakandeya_agent_autonomy', JSON.stringify(cfg));
 } catch (e) {}
 }
 })
 .catch((e) => {
 console.warn("Notice fetching initial autonomy config for chat:", e);
 });
 return () => { isMounted = false; };
 }, []);

 useEffect(() => {
 if (textareaRef.current) {
 textareaRef.current.style.height ='auto';
 textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
 }
 }, [inputText]);

 const [activeRun, setActiveRun] = useState<{
 id: number | null;
 status:'queued' |'in_progress' |'completed' |'unknown' |'fetching' |'error';
 conclusion: string | null;
 agentName: string;
 triggeredAt: number;
 steps: { name: string; status: string; conclusion: string | null; number: number }[];
 isDemo: boolean;
 initialLeadIds?: string[];
 // Sin declarar aquí, TypeScript no veía estos campos aunque se asignan y se leen para
 // filtrar los leads simulados de fallback por región/tipo (ver más abajo en este archivo).
 region?: string;
 params?: { ciudad?: string; region?: string; tipo?: string; [key: string]: any };
 } | null>(null);

 useEffect(() => {
 if (!activeRun || activeRun.status ==='completed' || activeRun.status ==='error') return;

 let intervalId: any;
 let attempts = 0;

 const pollStatus = async () => {
 if (activeRun?.isDemo) {
 attempts += 1;
 if (attempts >= 4) {
 setActiveRun((prev: any) => {
 if (!prev) return null;
 setTimeout(() => {
 window.dispatchEvent(new Event('github-agent-completed'));
 }, 50);
 return {
 ...prev,
 status:'completed',
 conclusion:'success',
 steps: prev.steps.map((s: any) => 
 s.name.includes("Agent") || s.number === 5 ? { ...s, status:'completed', conclusion:'success' } : s
 )
 };
 });
 }
 return;
 }

 try {
 const token = localStorage.getItem('bakandeya_token');
 const pat = localStorage.getItem('bakandeya_github_pat') ||'';
 const owner = localStorage.getItem('bakandeya_github_owner') ||'';
 const repo = localStorage.getItem('bakandeya_github_repo') ||'';

 const headers: Record<string, string> = {};
 if (token) {
 headers['Authorization'] = `Bearer ${token}`;
 headers['x-auth-token'] = token;
 }
 if (pat) headers['x-github-pat'] = pat;
 if (owner) headers['x-github-owner'] = owner;
 if (repo) headers['x-github-repo'] = repo;

 if (!activeRun?.id) {
 // Find newly started run
 const res = await fetch('/api/agent-runs', { headers });
 if (res.ok) {
 const data = await res.json().catch(() => null);
 const recentRuns = data?.runs || [];
 
 const matchedRun = recentRuns.find((run: any) => {
 const runTime = new Date(run.created_at).getTime();
 const timeDiff = Math.abs(Date.now() - runTime);
 return timeDiff < 180000; // 3 minutes
 });

 if (matchedRun) {
 setActiveRun((prev: any) => {
 if (!prev) return null;
 return {
 ...prev,
 id: matchedRun.id,
 status: matchedRun.status,
 conclusion: matchedRun.conclusion
 };
 });
 }
 }
 } else {
 // Poll specific run status and job steps
 const runId = activeRun.id;
 const runsRes = await fetch('/api/agent-runs', { headers });
 if (runsRes.ok) {
 const runsData = await runsRes.json().catch(() => null);
 const matchingRun = (runsData?.runs || []).find((r: any) => r.id === runId);
 
 if (matchingRun) {
 const updatedStatus = matchingRun.status;
 const updatedConclusion = matchingRun.conclusion;

 // Fetch job steps
 const jobsRes = await fetch(`/api/agent-runs/${runId}/jobs`, { headers });
 let steps: any[] = [];
 if (jobsRes.ok) {
 const jobsData = await jobsRes.json().catch(() => null);
 if (jobsData?.jobs && jobsData.jobs.length > 0) {
 steps = jobsData.jobs[0].steps || [];
 }
 }

 setActiveRun((prev: any) => {
 if (!prev) return null;
 
 if (updatedStatus ==='completed' && prev.status !=='completed') {
 if (updatedConclusion ==='success') {
 setTimeout(() => {
 window.dispatchEvent(new Event('github-agent-completed'));
 }, 50);

 // Delay showing success for 3s while App.tsx fetches new state
 setTimeout(() => {
 setActiveRun((current: any) => current ? { ...current, status:'completed', conclusion:'success' } : null);
 }, 3000);

 return {
 ...prev,
 status:'in_progress', // Keep it visually running
 conclusion: null,
 steps: [...(steps.length > 0 ? steps : prev.steps), { name:"Sincronizando con Supabase...", status:"in_progress", conclusion: null }]
 };
 }
 }

 return {
 ...prev,
 status: updatedStatus,
 conclusion: updatedConclusion,
 steps: steps.length > 0 ? steps : prev.steps
 };
 });
 }
 }
 }
 } catch (err) {
 // Silent retry on network flicker
 }
 };

 pollStatus();
 intervalId = setInterval(pollStatus, 6000);

 return () => clearInterval(intervalId);
 }, [activeRun?.id, activeRun?.status, activeRun?.isDemo]);

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;

 // Auto-scroll chat to bottom on mount and on message/loading updates
 useEffect(() => {
 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior:'auto' });
 };

 // Scroll immediately
 scrollToBottom();
 // Re-scroll after layout paint
 const timer1 = setTimeout(scrollToBottom, 80);
 const timer2 = setTimeout(scrollToBottom, 250);

 return () => {
 clearTimeout(timer1);
 clearTimeout(timer2);
 };
 }, [messages.length, isLoading]);

 const parseMarkdown = (text: string) => {
 const lines = text.split('\n');
 return lines.map((line, idx) => {
 // Bullets
 if (line.trim().startsWith('-')) {
 const bulletText = line.trim().slice(2);
 return (
 <li key={idx} className="ml-4 list-disc mt-1 text-xs">
 {formatBold(bulletText)}
 </li>
 );
 }
 return (
 <p key={idx} className="min-h-[1.2em] text-xs leading-relaxed mt-1">
 {formatBold(line)}
 </p>
 );
 });
 };

 const formatBold = (text: string) => {
 const parts = text.split(/(\*\*.*?\*\*)/g);
 return parts.map((part, i) => {
 if (part.startsWith('**') && part.endsWith('**')) {
 return <strong key={i} className={`font-bold ${isStitchLight ?'text-indigo-950' :'text-[var(--sunken)]'}`}>{part.slice(2, -2)}</strong>;
 }
 return part;
 });
 };

 const handleSendMessage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!inputText.trim() || isLoading) return;

 const userMsgText = inputText;
 setInputText('');

 // Add user message
 const userMsg: ChatMessage = {
 id: `user-${Date.now()}`,
 sender:'user',
 text: userMsgText,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, userMsg]);
 setIsLoading(true);

 try {
 const token = localStorage.getItem('bakandeya_token');
 const activeBandId = currentUser?.band_id ||'';
 const response = await fetch('/api/chat', {
 method:'POST',
 headers: {'Content-Type':'application/json','Authorization': token ? `Bearer ${token}` :'','x-user-role': userRole ||'','x-band-id': activeBandId
 },
 body: JSON.stringify({
 message: userMsgText,
 chatHistory: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text })),
 userRole: userRole ||'member',
 agentsEnabled: agentsEnabled,
 band_id: activeBandId,
 autonomyConfig
 })
 });

 if (!response.ok) {
 throw new Error('Response error from server');
 }

 const data = await response.json();
 
 const rawActions: ProposedAction[] = data.proposedActions || [];
 const processedActions: ProposedAction[] = rawActions.map(a => ({
 ...a,
 status: a.status ||'pending'
 }));

 const botMsg: ChatMessage = {
 id: `bot-${Date.now()}`,
 sender:'bot',
 text: data.text ||'He recibido los datos correctamente.',
 timestamp: new Date(),
 proposedActions: processedActions,
 actionStatus: (processedActions.length > 0) ?'pending' : undefined
 };

 setMessages(prev => [...prev, botMsg]);
 } catch (error) {
 console.error(error);
 const errMsg: ChatMessage = {
 id: `err-${Date.now()}`,
 sender:'bot',
 text:'⚠️ **Error de Conexión:** Ha habido un problema conectando con el servicio de Inteligencia Artificial. Por favor, inténtalo de nuevo.',
 timestamp: new Date()
 };
 setMessages(prev => [...prev, errMsg]);
 } finally {
 setIsLoading(false);
 }
 };

 const updateActionStatusInMessages = (msgId: string, actionIndex: number, action: ProposedAction, status:'applied' |'dismissed') => {
 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 const currentActions = m.proposedActions ? [...m.proposedActions] : [];
 let targetIdx = actionIndex;
 if (targetIdx < 0 || targetIdx >= currentActions.length || !currentActions[targetIdx]) {
 targetIdx = currentActions.findIndex(a => (action.leadId && a.leadId === action.leadId) || (a.description && a.description === action.description) || a === action);
 }
 if (targetIdx !== -1 && currentActions[targetIdx]) {
 currentActions[targetIdx] = {
 ...currentActions[targetIdx],
 status
 };
 }
 const nonTriggers = currentActions.filter(a => a.type !=='propose_agent_trigger');
 const allResolved = nonTriggers.length === 0 || nonTriggers.every(a => a.status ==='applied' || a.status ==='dismissed');
 return {
 ...m,
 proposedActions: currentActions,
 actionStatus: allResolved ? status :'pending'
 };
 }
 return m;
 }));
 };

 async function handleConfirmAllActions(msgId: string, actions: ProposedAction[]) {
 const pendingItems = actions
 .map((act, idx) => ({ act, idx }))
 .filter(item => item.act.type !=='propose_agent_trigger' && item.act.type !=='propose_accompaniment' && item.act.type !=='propose_melodic_idea' && (item.act.status ||'pending') ==='pending');

 for (const item of pendingItems) {
 await handleConfirmAction(msgId, item.idx, item.act);
 }
 try {
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 } catch (_) {}
 }

 // Confirm action callback
 async function handleConfirmAction(msgId: string, actionIndex: number, action: ProposedAction) {
 // 1. Apply changes
 if (action.type ==='propose_lead_approval') {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 const nowStr = `${today} ${new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}`;
 
 const emailBody = action.body || targetLead.pitch_generado ||'';
 const emailSubject = action.subject || `Propuesta de Concierto - Bakandeya en ${targetLead.nombre_sala}`;
 const recipientEmail = targetLead.email_contacto;
 const isDraftOnly = autonomyConfig.dispatchLevel ==='draft_only' || autonomyConfig.dispatchLevel !=='autonomous_first_contact';

 if (isDraftOnly) {
 // Antes esto abría un popup de Google (Firebase Auth) para crear el borrador - imposible
 // de repetir sin usuario delante, y por tanto incompatible con que el Agente Enviador
 // programado hiciera lo mismo sin contraseña. Dispara el mismo endpoint que usa el
 // scheduler (POST /api/trigger-agent), que ya elige entre la API de Gmail por OAuth (sin
 // popup) y el IMAP con contraseña de aplicación para Outlook (server/services/agentEngine.ts)
 // - así el borrador vale igual venga del chatbot, del botón"Aprobar" del CRM o del scheduler.
 let gmailOk = false;
 let gmailError ='';
 if (!recipientEmail) {
 gmailError ='La sala no tiene un correo de contacto (email_contacto).';
 } else {
 try {
 if (emailBody && emailBody !== targetLead.pitch_generado) {
 await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
 }
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({ agentName:'enviador', params: { id: targetLead.id, trigger_type:'chatbot' } })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === targetLead.id) : null;
 gmailOk = leadResult?.status ==='borrador';
 if (!gmailOk) gmailError = leadResult?.error || data.message ||'No se pudo crear el borrador.';
 } catch (err: any) {
 console.error('Error aprobando lead vía Chatbot:', err);
 gmailError = err.message ||'Error al aprobar el lead.';
 }
 }

 const updatedNotes = `*** [${nowStr}] Borrador Creado por Mánager IA (Modo Sólo Borradores Activo) ***\n${targetLead.notas ||''}`;
 onUpdateLead(action.leadId, {
 estado: gmailOk ?'borrador_creado' :'pendiente_aprobacion',
 pitch_generado: emailBody || targetLead.pitch_generado,
 notas: updatedNotes
 }, targetLead.estado);
 // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent), no
 // hace falta duplicar el registro aquí como antes.

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const draftMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: gmailOk
 ? `📝 **Borrador Creado (Modo Sólo Borradores Activo):**\n\n🔒 Por seguridad y al estar la autonomía fijada en **SÓLO BORRADORES**, el correo NO se ha enviado directamente.\nSe ha generado el **borrador real** en tu bandeja de email para **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** Guardado para revisión humana obligatoria.`
 : `⚠️ **No se pudo crear el borrador:** ${gmailError ||'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, draftMsg]);
 } else {
 // Envío directo (autonomía"Auto 1er Contacto"): esto abría un popup de Google (Firebase
 // Auth) y mandaba el correo directo desde el navegador con el token personal de quien
 // estuviera en el chat - saltándose los dos interruptores de seguridad que sí respeta el
 // Agente Enviador (AGENT_EMAIL_MODE de la plataforma y el dispatch_mode de la banda, ver
 // AGENTS.md sección 3): un envío disparado desde aquí podía salir de verdad aunque el
 // kill switch global siguiera en modo seguro. Mismo arreglo que ya se aplicó a la rama de
 //"Sólo Borradores" de arriba: dispara el mismo endpoint que usa el scheduler
 // (POST /api/trigger-agent), que es quien de verdad decide si envía o deja borrador.
 let enviadoOk = false;
 let estadoNuevo ='';
 let fechaEnvioReal ='';
 let gmailError ='';

 if (!recipientEmail) {
 gmailError ='La sala no tiene un correo de contacto (email_contacto).';
 } else {
 try {
 if (emailBody && emailBody !== targetLead.pitch_generado) {
 await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
 }
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({ agentName:'enviador', params: { id: targetLead.id, trigger_type:'chatbot' } })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === targetLead.id) : null;
 enviadoOk = leadResult?.status ==='enviado';
 estadoNuevo = leadResult?.estado_nuevo ||'';
 fechaEnvioReal = leadResult?.fecha_envio ||'';
 if (!enviadoOk) gmailError = leadResult?.error || data.message ||'No se pudo enviar el correo.';
 } catch (err: any) {
 console.error('Error aprobando lead vía Chatbot:', err);
 gmailError = err.message ||'Error al aprobar el lead.';
 }
 }

 const updatedNotes = `*** [${nowStr}] Correo APROBADO Y ENVIADO vía Chatbot AI Assistant ***\n${targetLead.notas ||''}`;
 onUpdateLead(action.leadId, {
 estado: (enviadoOk ? (estadoNuevo ||'contactado') :'pendiente_aprobacion') as Lead['estado'],
 fecha_envio: enviadoOk ? (fechaEnvioReal || nowStr) : undefined,
 pitch_generado: emailBody || targetLead.pitch_generado,
 notas: updatedNotes
 }, targetLead.estado);

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: enviadoOk
 ? `📧 **¡Correo Enviado con Éxito!**\n\nSe ha enviado el correo oficialmente a **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** ${estadoNuevo ||'Enviado'} (${nowStr})\n- **Sincronización:** Supabase actualizado.`
 : `✅ **Aprobación Registrada en Supabase:** Se ha marcado como aprobado **"${targetLead.nombre_sala}"** en la base de datos.${gmailError ? `\n\n⚠️ *Aviso:* ${gmailError}` :''}`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);
 }
 }

 } else if (action.type ==='propose_status_change') {
 if (action.leadId && action.newStatus) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Clasificación editada vía Chatbot AI a'${action.newStatus}' ***\n${targetLead.notas ||''}`;
 
 onUpdateLead(action.leadId, {
 estado: action.newStatus as any,
 notas: updatedNotes
 }, targetLead.estado);
 }

 updateActionStatusInMessages(msgId, actionIndex, action,'applied');

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `✅ **Acción Ejecutada con éxito:** Se ha procesado la propuesta para **"${action.leadName ||'Sala'}"**. El estado ha sido modificado y se ha persistido el log correspondiente en la base de datos de Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);
 }

 } else if (action.type ==='propose_band' || action.band) {
 const bandData = {
 id: `band-${Date.now()}`,
 nombre_banda: action.band?.nombre_banda ||'Nueva Banda',
 estilo_musical: action.band?.estilo_musical ||'Desconocido',
 localizacion: action.band?.localizacion ||'Desconocido',
 estado_relacion: action.band?.estado_relacion ||'nuevo',
 ultimo_contacto: new Date().toISOString().split('T')[0],
 contacto_nombre: action.band?.contacto_nombre ||'',
 email: action.band?.email ||'',
 telefono: action.band?.telefono ||'',
 instagram: action.band?.instagram ||'',
 spotify_youtube: action.band?.spotify_youtube ||'',
 aforo_promedio: Number(action.band?.aforo_promedio) || 0,
 notas_colaboracion: action.band?.notas_colaboracion ||'Añadido vía AI',
 ciudad_origen_swap: action.band?.localizacion ||''
 };
 
 try {
 const token = localStorage.getItem('bakandeya_token');
 const activeBandId = currentUser?.band_id ||'';
 await fetch('/api/bands', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {}),
 ...(activeBandId ? {'x-band-id': activeBandId } : {})
 },
 body: JSON.stringify(bandData)
 });
 } catch (e) {
 console.error("Error adding band directly:", e);
 }

 setMessages(prev => [...prev, {
 id: Date.now().toString(),
 text: `✅ He añadido a **${bandData.nombre_banda}** a la base de datos de bandas aliadas.`,
 sender:'bot',
 timestamp: new Date()
 }]);
 } else if (action.type ==='propose_concert' || action.type ==='propose_add_concert' || action.concert) {
 const concertData: Concert = {
 id: action.concert?.id || `con-${Date.now()}`,
 fecha: action.concert?.fecha || new Date().toISOString().split('T')[0],
 ciudad: action.concert?.ciudad || (action.leadId ? leads.find(l => l.id === action.leadId)?.ciudad ||'Madrid' :'Madrid'),
 sala: action.concert?.sala || action.leadName ||'Sala Villanos',
 cache: action.concert?.cache || 0,
 aforo_vendido: action.concert?.aforo_vendido || 0,
 aforo_total: action.concert?.aforo_total || 200,
 contrato_firmado: action.concert?.contrato_firmado ?? true,
 estado_pago: action.concert?.estado_pago ||'pendiente',
 notas: action.concert?.notas ||'Bolo agendado vía Mánager Virtual AI',
 tipo: action.concert?.tipo ||'sala'
 };

 if (onAddConcert) {
 onAddConcert(concertData);
 } else {
 try {
 const token = localStorage.getItem('bakandeya_token');
 await fetch('/api/concerts', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(concertData)
 });
 } catch (e) {
 console.error("Error adding concert directly:", e);
 }
 }

 if (action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 onUpdateLead(action.leadId, {
 estado: (action.newStatus as any) ||'negociando',
 notas: `*** [${today}] Concierto agendado para el ${concertData.fecha} ***\n${targetLead.notas ||''}`
 }, targetLead.estado);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus:'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `🎉 **¡Concierto Agendado con Éxito!**\n\nSe ha añadido el bolo en **${concertData.sala}** (${concertData.ciudad}) para el **${concertData.fecha}** en la agenda de conciertos y guardado en la pestaña **conciertos** de Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type ==='propose_rehearsal' || action.rehearsal) {
 const rehearsalData: Rehearsal = {
 id: action.rehearsal?.id || `reh-${Date.now()}`,
 fecha: action.rehearsal?.fecha || new Date().toISOString().split('T')[0],
 hora: action.rehearsal?.hora ||'19:00',
 lugar: action.rehearsal?.lugar ||'Local de Ensayo',
 asistentes: action.rehearsal?.asistentes || ['Banda'],
 notas: action.rehearsal?.notas ||'Ensayo agendado vía Chatbot AI',
 estado: action.rehearsal?.estado ||'programado'
 };

 if (onAddRehearsal) {
 onAddRehearsal(rehearsalData);
 } else {
 try {
 const token = localStorage.getItem('bakandeya_token');
 await fetch('/api/rehearsals', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(rehearsalData)
 });
 } catch (e) {
 console.error("Error adding rehearsal directly:", e);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus:'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `📅 **Ensayo Programado con Éxito:**\n\nSe ha agendado el ensayo para el **${rehearsalData.fecha}** a las **${rehearsalData.hora}** en **${rehearsalData.lugar}** y guardado en Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type ==='propose_tour' || action.tour) {
 const tourData = action.tour || {
 id: `tour-${Date.now()}`,
 nombre: action.description ||'Nueva Gira',
 vehiculo:'Furgoneta 9 Plazas',
 estado:'planificacion',
 fechaInicio: new Date().toISOString().split('T')[0],
 fechaFin: new Date().toISOString().split('T')[0],
 presupuestoLogistica: 0,
 stops: []
 };

 try {
 const token = localStorage.getItem('bakandeya_token');
 await fetch('/api/tours', {
 method:'POST',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify(tourData)
 });
 } catch (e) {
 console.error("Error creating tour from chat:", e);
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus:'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `🚚 **Gira Guardada con Éxito:**\n\nSe ha registrado la gira **"${tourData.nombre ||'Nueva Gira'}"** en la base de datos y sincronizado con Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type ==='propose_update_logo') {
 const targetLeadId = action.leadId || (action.targetType ==='lead' ? action.leadId : undefined);
 const targetBandId = action.bandId || (action.targetType ==='band' ? action.bandId : undefined);
 const name = action.targetName || action.leadName ||'Item';

 if (targetLeadId) {
 onUpdateLead(targetLeadId, {
 imagen_url: action.imagen_url,
 icono: action.icono
 });
 } else if (targetBandId) {
 try {
 const token = localStorage.getItem('bakandeya_token');
 await fetch(`/api/bands/${targetBandId}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({
 id: targetBandId,
 imagen_url: action.imagen_url,
 icono: action.icono
 })
 });
 } catch (e) {
 console.error("Error updating band logo directly:", e);
 }
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 return { ...m, actionStatus:'applied' };
 }
 return m;
 }));

 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `🖼️ **Logo/Icono Actualizado con Éxito:** Se ha guardado el logo/icono para **"${name}"** en la base de datos y sincronizado con Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 } else if (action.type ==='propose_add_lead' || action.lead) {
 const activeBandId = currentUser?.band_id ||'band-bakandeya';
 const isMedio = (action.lead?.tipo ==='medio' || action.lead?.tipo ==='radio' || action.lead?.tipo ==='prensa');
 const newLeadData: Lead = {
 id: action.lead?.id || `lead-${Date.now()}`,
 band_id: action.lead?.band_id || currentUser?.band_id || activeBandId,
 nombre_sala: action.lead?.nombre_sala || action.leadName ||'Nuevo Lead',
 ciudad: action.lead?.ciudad ||'Madrid',
 region: action.lead?.region || action.lead?.ciudad ||'Madrid',
 aforo: Number(action.lead?.aforo) || 0,
 genero: action.lead?.genero ||'Variado',
 tipo: action.lead?.tipo ||'sala',
 email_contacto: action.lead?.email_contacto ||'',
 telefono: action.lead?.telefono ||'',
 website: action.lead?.website ||'',
 instagram: action.lead?.instagram ||'',
 festival_start_date: action.lead?.festival_start_date || (action.lead as any)?.festivalStartDate ||'',
 festival_end_date: action.lead?.festival_end_date || (action.lead as any)?.festivalEndDate ||'',
 fuente: action.lead?.fuente ||'Chatbot AI',
 estado: action.lead?.estado ||'nuevo',
 notas: action.lead?.notas ||'Creado directamente vía Chatbot AI',
 pitch_generado: action.lead?.pitch_generado ||'',
 fecha_envio: action.lead?.fecha_envio ||'',
 fecha_ultima_respuesta:''
 };

 let createdLead: Lead = newLeadData;
 let saveSuccess = false;
 let saveErrorMessage ='';

 try {
 if (onCreateLead) {
 const result: any = await onCreateLead(newLeadData);
 if (result && result.id) createdLead = result;
 saveSuccess = true;
 } else {
 const res: any = await api.createLead(newLeadData);
 if (res?.lead) createdLead = res.lead;
 saveSuccess = true;
 }
 } catch (e: any) {
 console.error("Error creating lead from chatbot:", e);
 saveErrorMessage = e?.message ||'Error al conectar con la base de datos Supabase.';
 }

 if (saveSuccess) {
 try {
 window.dispatchEvent(new Event('app-data-updated'));
 } catch (_) {}

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 const updatedActions = (m.proposedActions || []).map((a, idx) =>
 idx === actionIndex ? { ...a, status:'applied' as const } : a
 );
 return { ...m, actionStatus:'applied', proposedActions: updatedActions };
 }
 return m;
 }));

 if (onNavigate) {
 onNavigate(isMedio ?'medios' :'booking', {
 sectionTab: isMedio ?'medios' :'salas',
 statusFilter:'todos',
 initialSelectedLeadId: createdLead.id
 });
 }

 const addSuccessMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `✨ **Nuevo Lead / Medio Creado con Éxito:**\n\nSe ha guardado e insertado **"${newLeadData.nombre_sala}"** (${newLeadData.ciudad}) en la base de datos y sincronizado directamente con Supabase.\n\n📍 *Te he redirigido al CRM seleccionando la sala directamente.*`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, addSuccessMsg]);
 } else {
 const addFailMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `⚠️ **No se pudo guardar la sala en Supabase:**\n\n${saveErrorMessage}\n\nRevisa la sesión o intenta añadir la sala manualmente en el CRM.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, addFailMsg]);
 }

 } else if (action.type ==='propose_update_lead' && action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 if (targetLead && action.updatedFields) {
 onUpdateLead(action.leadId, action.updatedFields, targetLead.estado);
 }

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const updateSuccessMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: `✏️ **Lead / Medio Actualizado con Éxito:** Se han guardado los cambios para **"${action.leadName || targetLead?.nombre_sala ||'Lead'}"** en la base de datos y Supabase.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, updateSuccessMsg]);

 } else if (action.type ==='propose_draft_email' && action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 const rawDraftBody = action.body || targetLead?.pitch_generado ||'';

 // Antes esto abría un popup de Google para crear el borrador (ver comentario en
 // propose_lead_approval, más arriba) - ahora dispara el Agente Enviador en el servidor
 // (POST /api/trigger-agent), que crea el borrador sin popup vía la API de Gmail por OAuth
 // si la banda la tiene conectada, o por IMAP si no.
 let gmailOk = false;
 let gmailError ='';

 if (!targetLead) {
 gmailError ='No se encontró el lead.';
 } else if (!targetLead.email_contacto) {
 gmailError ='La sala no tiene un correo de contacto (email_contacto).';
 } else {
 try {
 if (rawDraftBody && rawDraftBody !== targetLead.pitch_generado) {
 await onUpdateLead(action.leadId, { pitch_generado: rawDraftBody }, targetLead.estado);
 }
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({ agentName:'enviador', params: { id: targetLead.id, trigger_type:'chatbot' } })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === targetLead.id) : null;
 gmailOk = leadResult?.status ==='borrador';
 if (!gmailOk) gmailError = leadResult?.error || data.message ||'No se pudo crear el borrador.';
 } catch (err: any) {
 console.error('Error creando el borrador vía Chatbot:', err);
 gmailError = err.message ||'Error al crear el borrador.';
 }
 }

 if (targetLead) {
 const today = new Date().toISOString().split('T')[0];
 const updatedNotes = `*** [${today}] Borrador guardado vía Chatbot AI ***\n${targetLead.notas ||''}`;
 onUpdateLead(action.leadId, {
 pitch_generado: rawDraftBody || targetLead.pitch_generado,
 estado: gmailOk ?'borrador_creado' :'pendiente_aprobacion',
 notas: updatedNotes
 }, targetLead.estado);
 }
 // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent), no
 // hace falta duplicar el registro aquí como antes.

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const draftSuccessMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: gmailOk
 ? `📝 **Borrador Creado y Guardado:**\n\nSe ha creado el borrador real en tu bandeja de email para **"${targetLead?.email_contacto}"** (${targetLead?.nombre_sala}).\n- **Estado:** Pendiente de revisión humana.`
 : `⚠️ **No se pudo crear el borrador:** ${gmailError ||'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, draftSuccessMsg]);

 } else if (action.type ==='propose_send_email' && action.leadId) {
 const targetLead = leads.find(l => l.id === action.leadId);
 const today = new Date().toISOString().split('T')[0];
 const nowStr = `${today} ${new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}`;
 const isDraftOnly = autonomyConfig.dispatchLevel ==='draft_only' || autonomyConfig.dispatchLevel !=='autonomous_first_contact';

 if (targetLead) {
 const emailBody = action.body || targetLead.pitch_generado ||'';
 const recipientEmail = targetLead.email_contacto;

 if (isDraftOnly) {
 // Ver comentario en propose_lead_approval: dispara el Agente Enviador en el servidor
 // en vez de abrir el popup de Google, para que funcione igual que el scheduler.
 let gmailOk = false;
 let gmailError ='';
 if (!recipientEmail) {
 gmailError ='El lead/sala no tiene un correo de contacto definido (email_contacto).';
 } else {
 try {
 if (emailBody && emailBody !== targetLead.pitch_generado) {
 await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
 }
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({ agentName:'enviador', params: { id: targetLead.id, trigger_type:'chatbot' } })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === targetLead.id) : null;
 gmailOk = leadResult?.status ==='borrador';
 if (!gmailOk) gmailError = leadResult?.error || data.message ||'No se pudo crear el borrador.';
 } catch (err: any) {
 console.error('Error creando el borrador vía Chatbot:', err);
 gmailError = err.message ||'Error al crear el borrador.';
 }
 }

 const updatedNotes = `*** [${nowStr}] Borrador Creado por Mánager IA (Bloqueado Modo Solo Borradores) ***\n${targetLead.notas ||''}`;
 onUpdateLead(action.leadId, {
 estado: gmailOk ?'borrador_creado' :'pendiente_aprobacion',
 pitch_generado: emailBody,
 notas: updatedNotes
 }, targetLead.estado);
 // El servidor ya audita la ejecución (logAgentExecution dentro de runEnviadorAgent).

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const draftOnlyMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: gmailOk
 ? `📝 **Borrador Creado (Modo Sólo Borradores Activo):**\n\n🔒 Por seguridad y al estar la autonomía en **SÓLO BORRADORES**, el correo NO se ha enviado directamente.\nSe ha creado el **borrador real** en tu bandeja de email para **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** Guardado para revisión humana.`
 : `⚠️ **No se pudo crear el borrador:** ${gmailError ||'Error desconocido.'}\n\nEl lead queda pendiente de aprobación para que lo revises a mano.`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, draftOnlyMsg]);
 } else {
 // Envío directo (autonomía"Auto 1er Contacto"): igual que en propose_lead_approval, esto
 // abría el popup de Google y enviaba desde el navegador saltándose AGENT_EMAIL_MODE y el
 // dispatch_mode de la banda. Dispara el mismo endpoint que el scheduler.
 let enviadoOk = false;
 let estadoNuevo ='';
 let fechaEnvioReal ='';
 let gmailError ='';

 if (!recipientEmail) {
 gmailError ='El lead/sala no tiene un correo de contacto definido (email_contacto).';
 } else {
 try {
 if (emailBody && emailBody !== targetLead.pitch_generado) {
 await onUpdateLead(action.leadId, { pitch_generado: emailBody }, targetLead.estado);
 }
 const data = await apiFetch('/api/trigger-agent', {
 method:'POST',
 body: JSON.stringify({ agentName:'enviador', params: { id: targetLead.id, trigger_type:'chatbot' } })
 });
 const leadResult = Array.isArray(data.results) ? data.results.find((r: any) => r.id === targetLead.id) : null;
 enviadoOk = leadResult?.status ==='enviado';
 estadoNuevo = leadResult?.estado_nuevo ||'';
 fechaEnvioReal = leadResult?.fecha_envio ||'';
 if (!enviadoOk) gmailError = leadResult?.error || data.message ||'No se pudo enviar el correo.';
 } catch (err: any) {
 console.error('Error procesando el correo vía Chatbot:', err);
 gmailError = err.message ||'Error al aprobar el lead.';
 }
 }

 const updatedNotes = `*** [${nowStr}] Correo ENVIADO a ${recipientEmail ||'sin_email'} por ${action.senderName ||'Mánager Virtual Chatbot'} ***\n${targetLead.notas ||''}`;
 onUpdateLead(action.leadId, {
 estado: (enviadoOk ? (estadoNuevo ||'contactado') :'pendiente_aprobacion') as Lead['estado'],
 fecha_envio: enviadoOk ? (fechaEnvioReal || nowStr) : undefined,
 pitch_generado: emailBody,
 notas: updatedNotes
 }, targetLead.estado);

 setMessages(prev => prev.map(m => {
 if (m.id === msgId) return { ...m, actionStatus:'applied' };
 return m;
 }));

 const sendSuccessMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: enviadoOk
 ? `📧 **¡Correo ENVIADO REALMENTE!**\n\nEl correo ha sido enviado oficialmente a **"${recipientEmail}"** (${targetLead.nombre_sala}).\n- **Estado:** ${estadoNuevo ||'Enviado'} (${nowStr})\n- **Firma & EPK:** Incluidos automáticamente.\n\nSe ha actualizado el estado y registrado la fecha de envío en Supabase.`
 : `📧 **Correo Marcado como Aprobado en Supabase:**\n\nSe ha actualizado el estado de **"${action.leadName || targetLead.nombre_sala}"** a **Pendiente de Aprobación** en la base de datos (${nowStr}).\n\n⚠️ **Atención:** ${gmailError}`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, sendSuccessMsg]);
 }
 }

 try {
 window.dispatchEvent(new Event('app-data-updated'));
 } catch (_) {}

 } else if (action.type ==='propose_agent_trigger' && action.agentName) {
 try {
 const token = localStorage.getItem('bakandeya_token') || localStorage.getItem('token') ||'';
 const pat = localStorage.getItem('bakandeya_github_pat') ||'';
 const owner = localStorage.getItem('bakandeya_github_owner') ||'';
 const repo = localStorage.getItem('bakandeya_github_repo') ||'';
 const ref = localStorage.getItem('bakandeya_github_ref') ||'main';

 const customHeaders: Record<string, string> = {'Content-Type':'application/json'
 };

 if (token) {
 customHeaders['Authorization'] = `Bearer ${token}`;
 customHeaders['x-auth-token'] = token;
 }
 if (pat) customHeaders['x-github-pat'] = pat;
 if (owner) customHeaders['x-github-owner'] = owner;
 if (repo) customHeaders['x-github-repo'] = repo;
 if (ref) customHeaders['x-github-ref'] = ref;

 const response = await fetch('/api/trigger-agent', {
 method:'POST',
 headers: customHeaders,
 body: JSON.stringify({
 agentName: action.agentName,
 params: {
 ...(action.params || {}),
 autonomyConfig
 }
 })
 });

 const contentType = response.headers.get('content-type') ||'';
 let data: any = null;

 if (contentType.includes('application/json')) {
 try {
 data = await response.json();
 } catch (_) {
 data = null;
 }
 } else {
 const rawText = await response.text().catch(() =>'');
 try {
 data = JSON.parse(rawText);
 } catch (_) {
 data = null;
 }
 }

 if (!response.ok) {
 const errorText = data?.error || data?.message || `Error del servidor (${response.status}): Fallo al disparar el agente.`;
 throw new Error(errorText);
 }

 if (!data) {
 data = {
 success: true,
 message: `Agente'${action.agentName}' ejecutado con éxito en Supabase.`
 };
 }

 if (data.detectedRef) {
 localStorage.setItem('bakandeya_github_ref', data.detectedRef);
 window.dispatchEvent(new Event('github-ref-updated'));
 }

 updateActionStatusInMessages(msgId, actionIndex, action,'applied');

 const isSim = data.simulated;
 const successMsg: ChatMessage = {
 id: `sys-${Date.now()}`,
 sender:'bot',
 text: isSim 
 ? `⚙️ **Simulación del Agente'${action.agentName}':**\n\n${data.message ||'Ejecución completada.'}`
 : `🚀 **Agente'${action.agentName}' Iniciado:**\n\n${data.message ||'Ejecución completada.'}`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, successMsg]);

 const targetRegion = action.params?.ciudad || action.params?.region ||'Huelva';

 if (isSim) {
 setActiveRun({
 id: 999,
 status:'in_progress',
 conclusion: null,
 agentName: action.agentName,
 region: targetRegion,
 params: action.params,
 triggeredAt: Date.now(),
 steps: [
 { name:"Configurar entorno", status:"completed", conclusion:"success", number: 1 },
 { name:"Verificar repositorio", status:"completed", conclusion:"success", number: 2 },
 { name:"Instalar dependencias", status:"completed", conclusion:"success", number: 3 },
 { name: `Ejecutar Agente de Supabase'${action.agentName}'`, status:"in_progress", conclusion: null, number: 4 }
 ],
 isDemo: true,
 initialLeadIds: leads.map(l => l.id)
 });
 } else {
 setActiveRun({
 id: null,
 status:'completed',
 conclusion:'success',
 agentName: action.agentName,
 region: targetRegion,
 params: action.params,
 triggeredAt: Date.now(),
 steps: [
 { name:"Conectar con Supabase", status:"completed", conclusion:"success", number: 1 },
 { name: `Ejecutar Agente'${action.agentName}' en Supabase`, status:"completed", conclusion:"success", number: 2 },
 { name:"Actualizar base de datos y auditoría", status:"completed", conclusion:"success", number: 3 }
 ],
 isDemo: false,
 initialLeadIds: leads.map(l => l.id)
 });
 }

 } catch (err: any) {
 console.error(err);
 const errorMsg: ChatMessage = {
 id: `sys-err-${Date.now()}`,
 sender:'bot',
 text: `❌ **Error al ejecutar el agente:** ${err.message ||'No se pudo contactar con el backend de Supabase.'}`,
 timestamp: new Date()
 };
 setMessages(prev => [...prev, errorMsg]);
 }
 }
 try {
 window.dispatchEvent(new CustomEvent('app-data-updated'));
 } catch (_) {}
 };

 try {
 } catch (_) {}

 const handleDismissAction = (msgId: string, actionIndex?: number, action?: ProposedAction) => {
 if (typeof actionIndex ==='number' && action) {
 updateActionStatusInMessages(msgId, actionIndex, action,'dismissed');
 } else {
 setMessages(prev => prev.map(m => {
 if (m.id === msgId) {
 const currentActions = (m.proposedActions || []).map(a => ({ ...a, status:'dismissed' as const }));
 return { ...m, proposedActions: currentActions, actionStatus:'dismissed' };
 }
 return m;
 }));
 }
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
 if (e.key ==='Enter' && !e.shiftKey) {
 e.preventDefault();
 if (inputText.trim() && !isLoading) {
 handleSendMessage(e as any);
 }
 }
 };

 // Dictado por voz (Web Speech API) para poder dar instrucciones al chatbot hablando
 // en vez de escribir. No hay backend/servidor implicado: el reconocimiento corre en el
 // propio navegador y solo escribe el texto transcrito en el input existente.
 const speechRecognitionRef = useRef<any>(null);
 const [isListening, setIsListening] = useState(false);
 const speechSupported = typeof window !=='undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

 useEffect(() => {
 return () => {
 if (speechRecognitionRef.current) {
 try { speechRecognitionRef.current.stop(); } catch (e) {}
 }
 };
 }, []);

 const handleToggleMic = () => {
 if (!speechSupported) return;

 if (isListening) {
 speechRecognitionRef.current?.stop();
 return;
 }

 const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
 const recognition = new SpeechRecognitionCtor();
 recognition.lang ='es-ES';
 recognition.interimResults = false;
 recognition.continuous = false;

 recognition.onstart = () => setIsListening(true);
 recognition.onerror = () => setIsListening(false);
 recognition.onend = () => {
 setIsListening(false);
 speechRecognitionRef.current = null;
 };
 recognition.onresult = (event: any) => {
 const transcript = Array.from(event.results)
 .map((result: any) => result[0].transcript)
 .join('')
 .trim();
 if (!transcript) return;
 setInputText(prev => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
 };

 speechRecognitionRef.current = recognition;
 recognition.start();
 };

 return (
 <div className={`flex flex-col ${isFloating ?'h-[550px]' :'h-full min-h-[500px]'} ${isStitchLight ?'bg-white' :'bg-[var(--bg)]/95'} rounded-[var(--r-l)] overflow-hidden font-sans backdrop-blur-xl shadow-2xl w-full max-w-full overflow-x-hidden`}>
 {/* Bot Header */}
 <div className={`px-5 py-4 flex items-center justify-between ${isStitchLight ?'bg-[var(--bg)] -slate-200/80' :'bg-[var(--bg)]/90 -bg-[var(--surface)]/60'}`}>
 <div className="flex items-center gap-3">
 <div className={`p-1.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-cyan-500/10 -cyan-500/20 text-cyan-400'}`}>
 <Guitar className="w-4 h-4" />
 </div>
 <div>
 <h4 className={`text-xs font-display font-medium tracking-widest flex items-center gap-1.5 uppercase ${isStitchLight ?'text-[var(--ink)]' :'text-[var(--sunken)]'}`}>
 Mánager Virtual AI <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${isStitchLight ?'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.8)]' :'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'}`} />
 </h4>
 <span className="text-[9px] font-mono text-[var(--ink-2)]">{bandDisplayName.toUpperCase()} // SUPABASE INTEGRATION</span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 {isAdmin ? (
 <button
 type="button"
 onClick={() => setIsAutonomyModalOpen(true)}
 className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
 isStitchLight 
 ?'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 shadow-sm' 
 :'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/40 shadow-sm'
 }`}
 title="Configurar niveles de autonomía de los agentes (Solo Administradores)"
 >
 <Sliders className="w-3 h-3 text-purple-400" />
 <span>
 Autonomía: {autonomyConfig.dispatchLevel ==='draft_only' ?'Borrador' : autonomyConfig.dispatchLevel ==='scheduled_window' ?'Ventana 3h' :'Auto 1er Contacto'} • Min {autonomyConfig.minCacheThreshold || 300}€
 </span>
 <span className="px-1 py-0.2 text-[8px] rounded font-black bg-purple-500/40 text-purple-100 ml-0.5">
 ADMIN
 </span>
 </button>
 ) : (
 <div 
 className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold opacity-80 ${
 isStitchLight 
 ?'bg-purple-50 text-purple-700 border-purple-200' 
 :'bg-purple-500/15 text-purple-300 border-purple-500/30'
 }`}
 title="Límites de autonomía configurados (Configuración restringida a Administradores)"
 >
 <Sliders className="w-3 h-3 text-purple-400" />
 <span>
 Autonomía: {autonomyConfig.dispatchLevel ==='draft_only' ?'Borrador' : autonomyConfig.dispatchLevel ==='scheduled_window' ?'Ventana 3h' :'Auto 1er Contacto'} • Min {autonomyConfig.minCacheThreshold || 300}€
 </span>
 </div>
 )}

 <button
 id="clear-chat-btn"
 onClick={() => {
 const resetMessages: ChatMessage[] = [
 {
 id:'welcome-1',
 sender:'bot',
 text: `👋 **¡Buenas, ${cleanUserName}!** He limpiado el hilo del chat de **${bandDisplayName}**.\n\n¿En qué os puedo ayudar para organizar los conciertos de la banda, el calendario de redes o revisar los correos para las salas hoy?`,
 timestamp: new Date()
 }
 ];
 setMessages(resetMessages);
 try {
 localStorage.setItem(storageKey, JSON.stringify(resetMessages));
 } catch (e) {
 console.error(e);
 }
 }}
 className={`text-[9px] font-mono tracking-wider uppercase transition-all flex items-center gap-1 hover:underline cursor-pointer active:scale-95 ${isStitchLight ?'text-[var(--ink-3)] hover:text-indigo-600' :'text-[var(--ink-2)] hover:text-cyan-400'}`}
 >
 Limpiar Hilo
 </button>
 {onClose && (
 <button
 id="close-floating-chat-btn"
 onClick={onClose}
 className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
 isStitchLight 
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]' 
 :'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Cerrar Chat"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Mode Switcher Banner (Python Agents vs Direct Gemini) */}
 <div className={`px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono transition-colors ${
 agentsEnabled 
 ? (isStitchLight ?'bg-amber-50/80 -amber-200/80 text-amber-900' :'bg-[var(--acc)]/10 -amber-500/20 text-[var(--acc)]/70')
 : (isStitchLight ?'bg-emerald-50/80 -emerald-200/80 text-emerald-900' :'bg-emerald-500/10 -emerald-500/20 text-[var(--ink-2)]')
 }`}>
 <div className="flex items-center gap-2 min-w-0">
 <span className={`w-2 h-2 rounded-full shrink-0 ${agentsEnabled ?'bg-[var(--acc)]/60 animate-pulse' :'bg-emerald-400'}`} />
 <span className="font-bold truncate text-[11px] uppercase tracking-wider">
 {agentsEnabled ?'⚡ Agentes Supabase Activos (Backend & Database)' :'🤖 Modo Gemini Directo (100% Autónomo)'}
 </span>
 <span className="text-[10px] opacity-75 hidden sm:inline truncate">
 {agentsEnabled ?'— Ejecuta agentes (Scout, Redactor, Enviador, Lector) en Supabase' :'— Asistencia, redacción y consultas directas con Gemini'}
 </span>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {isAdmin && (
 <button
 id="open-autonomy-config-btn"
 type="button"
 onClick={() => setIsAutonomyModalOpen(true)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ${
 isStitchLight
 ?'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
 :'bg-purple-500/25 hover:bg-purple-500/40 text-purple-200'
 }`}
 title="Configurar niveles de autonomía y negociación de los agentes AI (Solo Administradores)"
 >
 <Sliders className="w-3 h-3 text-purple-400" />
 <span>Niveles de Autonomía</span>
 <span className="px-1 py-0.2 rounded text-[8px] bg-purple-500/50 text-[var(--ink)] font-black">ADMIN</span>
 </button>
 )}

 <button
 id="toggle-agents-switch"
 type="button"
 onClick={() => {
 const nextVal = !agentsEnabled;
 setAgentsEnabled(nextVal);
 localStorage.setItem('bakandeya_agents_enabled', String(nextVal));
 }}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 ${
 agentsEnabled
 ? (isStitchLight ?'bg-amber-200 hover:bg-[var(--acc)]/50/15 text-[#d1b375]' :'bg-[var(--acc)]/20 hover:bg-[var(--acc)]/50/15 text-[#d1b375] -amber-500/40')
 : (isStitchLight ?'bg-emerald-200 hover:bg-[var(--surface)]/15 text-[var(--ok)]' :'bg-emerald-500/20 hover:bg-[var(--surface)]/15 text-[var(--ok)] -emerald-500/40')
 }`}
 title={agentsEnabled ?"Desactivar motor de agentes de Supabase y usar solo Gemini" :"Activar motor de agentes en Supabase"}
 >
 <span>{agentsEnabled ?"Desactivar Agentes Supabase" :"Activar Agentes Supabase"}</span>
 </button>
 </div>
 </div>

 {/* Messages Thread Container */}
 <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isStitchLight ?'bg-[var(--bg)]/50' :'bg-[var(--surface)]/20'}`}>
 {messages.map((msg) => {
 const isBot = msg.sender ==='bot';
 return (
 <div key={msg.id} className={`flex gap-3 max-w-[90%] ${isBot ?'self-start' :'self-end ml-auto flex-row-reverse'}`}>
 {/* Avatar circle */}
 <div className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center shrink-0 ${
 isBot 
 ? (isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-cyan-500/10 -cyan-500/20 text-cyan-400') 
 : (isStitchLight ?'bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-[var(--surface)] text-[var(--ink-2)]')
 }`}>
 {isBot ? <Guitar className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
 </div>

 <div className="space-y-2">
 {/* Text Bubble */}
 <div className={`p-3.5 rounded-[var(--r-m)] text-xs leading-relaxed ${
 isBot 
 ? (isStitchLight 
 ?'bg-white text-[var(--ink)] rounded-tl-none shadow-sm' 
 :'bg-[var(--surface)]/50 -bg-[var(--surface)]/80 rounded-tl-none text-[var(--ink-3)]') 
 : (isStitchLight 
 ?'bg-indigo-50 text-indigo-950 rounded-tr-none' 
 :'bg-cyan-950/20 -cyan-500/10 rounded-tr-none text-[var(--ink-3)]')
 }`}>
 <div className="space-y-1">{parseMarkdown(msg.text)}</div>
 <span className="text-[8px] font-mono text-[var(--ink-2)] block mt-2 text-right">
 {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
 </span>
 </div>

 {/* Proposed actions box within chat */}
 {isBot && msg.proposedActions && msg.proposedActions.length > 0 && (() => {
 const nonTriggerActions = msg.proposedActions;
 const pendingActions = nonTriggerActions.filter(a => a.type !=='propose_accompaniment' && a.type !=='propose_melodic_idea' && (a.status ||'pending') ==='pending');

 return (
 <div className={` rounded-[var(--r-l)] p-4 space-y-3 max-w-sm mt-1 backdrop-blur-md ${isStitchLight ?'-indigo-100 bg-indigo-50/20' :'-cyan-500/20 bg-cyan-500/5'}`}>
 <div className="flex items-center justify-between gap-1.5">
 <div className={`flex items-center gap-1.5 ${isStitchLight ?'text-indigo-600' :'text-cyan-400'}`}>
 <Sparkles className="w-3.5 h-3.5 animate-pulse" />
 <h5 className="font-mono font-bold text-[9px] tracking-widest uppercase">Propuestas del Manager ({nonTriggerActions.length})</h5>
 </div>
 {pendingActions.length > 1 && (
 <button
 onClick={() => handleConfirmAllActions(msg.id, msg.proposedActions || [])}
 className={`text-[9px] font-bold font-mono px-2 py-1 rounded-md transition-all active:scale-95 ${isStitchLight ?'bg-indigo-600 text-white hover:bg-indigo-700' :'bg-cyan-500 text-[var(--surface)] hover:bg-cyan-400'}`}
 >
 ⚡ Aprobar Todos ({pendingActions.length})
 </button>
 )}
 </div>
 
 {nonTriggerActions.map((act, aIdx) => {
 const realIdx = msg.proposedActions ? msg.proposedActions.indexOf(act) : aIdx;
 const actStatus = act.status || (msg.actionStatus ==='applied' ?'applied' : msg.actionStatus ==='dismissed' ?'dismissed' :'pending');

 return (
 <div key={aIdx} className="space-y-2 border-t /20 pt-2 first:border-0 first:pt-0">
 <p className={`text-[11px] leading-relaxed p-2.5 rounded-[var(--r-m)] font-mono ${isStitchLight ?'text-[var(--ink)] bg-white' :'text-[var(--ink-3)] bg-[var(--surface)]'}`}>
 {act.description}
 </p>

 {act.type ==='propose_accompaniment' && act.accompaniment ? (() => {
 const acc = act.accompaniment;
 if (!acc) return null;
 const audioKey = `${msg.id}-${aIdx}`;
 const audioState = accompanimentAudio[audioKey];
 return (
 <div className="space-y-2">
 <div className={`text-[9px] font-mono px-2 py-1 rounded-[var(--r-s)] flex flex-wrap gap-x-2 gap-y-0.5 ${isStitchLight ?'bg-purple-50 text-purple-700' :'bg-purple-500/10 text-purple-300'}`}>
 <span>{acc.bpm} BPM</span>
 <span>· Tono {acc.keyName}</span>
 <span>· {acc.drumPattern.toUpperCase()}</span>
 <span>· {acc.durationSecs}s</span>
 </div>
 {audioState?.url ? (
 <>
 <audio controls src={audioState.url} onError={(e) => e.preventDefault()} className="w-full h-9" />
 {audioState.savedToSong ? (
 <div className="text-[10px] font-mono text-emerald-600 bg-emerald-500/5 -emerald-500/10 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
 <CheckCircle className="w-3.5 h-3.5" /> Guardada en"{audioState.savedToSong}" (Song Studio)
 </div>
 ) : songPicker[audioKey] ? (
 <div className={`space-y-1.5 p-2 rounded-[var(--r-s)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">No he identificado la canción. Elige en cuál guardarla:</p>
 <select
 value={songPicker[audioKey].selectedId}
 onChange={(e) => setSongPicker(prev => ({ ...prev, [audioKey]: { ...prev[audioKey], selectedId: e.target.value } }))}
 className={`w-full text-[11px] font-mono px-2 py-1.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black text-[var(--sunken)]'}`}
 >
 <option value="">— Selecciona una canción —</option>
 {songPicker[audioKey].songs.map(s => (
 <option key={s.id} value={s.id}>{s.titulo}</option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => handleSaveAccompanimentToSong(audioKey, acc, songPicker[audioKey].selectedId)}
 disabled={!songPicker[audioKey].selectedId || audioState.saving}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${isStitchLight ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)]' :'bg-cyan-500 hover:bg-cyan-600 text-[var(--surface)]'}`}
 >
 {audioState.saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 {audioState.saving ?'Guardando...' :'Guardar aquí'}
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => handleSaveAccompanimentToSong(audioKey, acc)}
 disabled={audioState.saving}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${isStitchLight ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-3)]'}`}
 >
 {audioState.saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 {audioState.saving ?'Guardando...' : (acc.songTitle || acc.songId ? `Guardar en"${acc.songTitle ||'la canción'}"` :'Guardar en el repertorio')}
 </button>
 )}
 {audioState.saveError && (
 <div className="text-[10px] font-mono text-red-500">{audioState.saveError}</div>
 )}
 </>
 ) : (
 <button
 type="button"
 onClick={() => handleGenerateAccompanimentAudio(audioKey, acc)}
 disabled={audioState?.loading}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${isStitchLight ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] shadow-sm' :'bg-cyan-500 hover:bg-cyan-600 text-[var(--surface)]'}`}
 >
 {audioState?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
 {audioState?.loading ?'Sintetizando...' :'Generar y escuchar'}
 </button>
 )}
 {audioState?.error && (
 <div className="text-[10px] font-mono text-red-500">{audioState.error}</div>
 )}
 </div>
 );
 })() : act.type ==='propose_melodic_idea' && act.melodicIdea ? (() => {
 const idea = act.melodicIdea;
 if (!idea) return null;
 const instrumentLabels: Record<MelodicInstrument, string> = { guitarra:'Guitarra', violin:'Violín', handpan:'Handpan', percusion:'Percusión' };
 const audioKey = `${msg.id}-${aIdx}`;
 const audioState = melodicIdeaAudio[audioKey];
 return (
 <div className="space-y-2">
 <div className={`text-[9px] font-mono px-2 py-1 rounded-[var(--r-s)] flex flex-wrap gap-x-2 gap-y-0.5 ${isStitchLight ?'bg-purple-50 text-purple-700' :'bg-purple-500/10 text-purple-300'}`}>
 <span>{instrumentLabels[idea.instrument]}</span>
 <span>· {idea.bpm} BPM</span>
 <span>· Tono {idea.keyName}</span>
 {idea.seccion && idea.seccion !=='general' && <span>· {idea.seccion}</span>}
 <span>· {idea.durationSecs}s</span>
 </div>
 {audioState?.url ? (
 <>
 <audio controls src={audioState.url} onError={(e) => e.preventDefault()} className="w-full h-9" />
 <button
 type="button"
 onClick={() => handleDownloadMelodicIdeaMidi(idea)}
 title="Abre en cualquier DAW o editor de partituras para editarla nota a nota"
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-1.5 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 ${isStitchLight ?'bg-white hover:bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-transparent hover:bg-[var(--surface)] text-[var(--ink-2)]'}`}
 >
 <Download className="w-3.5 h-3.5" /> Descargar .mid
 </button>
 {audioState.savedToSong ? (
 <div className="text-[10px] font-mono text-emerald-600 bg-emerald-500/5 -emerald-500/10 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
 <CheckCircle className="w-3.5 h-3.5" /> Guardada en"{audioState.savedToSong}" (Song Studio)
 </div>
 ) : songPicker[audioKey] ? (
 <div className={`space-y-1.5 p-2 rounded-[var(--r-s)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">No he identificado la canción. Elige en cuál guardarla:</p>
 <select
 value={songPicker[audioKey].selectedId}
 onChange={(e) => setSongPicker(prev => ({ ...prev, [audioKey]: { ...prev[audioKey], selectedId: e.target.value } }))}
 className={`w-full text-[11px] font-mono px-2 py-1.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black text-[var(--sunken)]'}`}
 >
 <option value="">— Selecciona una canción —</option>
 {songPicker[audioKey].songs.map(s => (
 <option key={s.id} value={s.id}>{s.titulo}</option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => handleSaveMelodicIdeaToSong(audioKey, idea, songPicker[audioKey].selectedId)}
 disabled={!songPicker[audioKey].selectedId || audioState.saving}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${isStitchLight ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)]' :'bg-cyan-500 hover:bg-cyan-600 text-[var(--surface)]'}`}
 >
 {audioState.saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 {audioState.saving ?'Guardando...' :'Guardar aquí'}
 </button>
 </div>
 ) : (
 <button
 type="button"
 onClick={() => handleSaveMelodicIdeaToSong(audioKey, idea)}
 disabled={audioState.saving}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${isStitchLight ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-3)]'}`}
 >
 {audioState.saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 {audioState.saving ?'Guardando...' : (idea.songTitle || idea.songId ? `Guardar en"${idea.songTitle ||'la canción'}"` :'Guardar en el repertorio')}
 </button>
 )}
 {audioState.saveError && (
 <div className="text-[10px] font-mono text-red-500">{audioState.saveError}</div>
 )}
 </>
 ) : (
 <button
 type="button"
 onClick={() => handleGenerateMelodicIdeaAudio(audioKey, idea)}
 disabled={audioState?.loading}
 className={`w-full flex items-center justify-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 disabled:opacity-60 disabled:cursor-wait ${isStitchLight ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] shadow-sm' :'bg-cyan-500 hover:bg-cyan-600 text-[var(--surface)]'}`}
 >
 {audioState?.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
 {audioState?.loading ?'Sintetizando...' :'Generar y escuchar'}
 </button>
 )}
 {audioState?.error && (
 <div className="text-[10px] font-mono text-red-500">{audioState.error}</div>
 )}
 </div>
 );
 })() : actStatus ==='pending' ? (
 <div className="flex gap-2">
 <button
 id={`confirm-proposal-btn-${msg.id}-${aIdx}`}
 onClick={() => handleConfirmAction(msg.id, realIdx, act)}
 className={`flex-1 text-[10px] font-bold font-mono tracking-wider uppercase py-2 rounded-[var(--r-s)] transition-all cursor-pointer active:scale-95 active:opacity-90 ${isStitchLight ?'bg-indigo-600 hover:bg-indigo-700 text-[var(--ink)] shadow-sm' :'bg-cyan-500 hover:bg-cyan-600 text-[var(--surface)]'}`}
 >
 ✓ Aprobar esta
 </button>
 <button
 id={`dismiss-proposal-btn-${msg.id}-${aIdx}`}
 onClick={() => handleDismissAction(msg.id, realIdx, act)}
 className={`px-3 py-2 text-[10px] font-mono rounded-[var(--r-s)] transition-colors cursor-pointer active:scale-95 active:opacity-90 ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 Descartar
 </button>
 </div>
 ) : actStatus ==='applied' ? (
 <div className="text-[10px] font-mono text-emerald-600 bg-emerald-500/5 -emerald-500/10 rounded-[var(--r-s)] p-2 flex items-center gap-1.5">
 <CheckCircle className="w-3.5 h-3.5" /> Aprobado e insertado
 </div>
 ) : (
 <div className={`text-[10px] font-mono rounded-[var(--r-s)] p-2 ${isStitchLight ?'text-[var(--ink-3)] bg-[var(--bg)]' :'text-[var(--ink-2)] bg-[var(--surface)]'}`}>
 Propuesta descartada
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
 })()}
 </div>
 </div>
 );
 })}

 {isLoading && (
 <div className="flex gap-3 max-w-[80%] self-start">
 <div className={`w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center animate-pulse ${isStitchLight ?'bg-indigo-50 text-indigo-600' :'bg-cyan-500/10 -cyan-500/20 text-cyan-400'}`}>
 <Guitar className="w-3.5 h-3.5" />
 </div>
 <div className={`p-3.5 rounded-[var(--r-m)] rounded-tl-none text-[11px] font-mono flex items-center gap-2 ${isStitchLight ?'bg-white text-[var(--ink-2)] shadow-sm' :'bg-[var(--surface)]/50 text-[var(--ink-2)]'}`}>
 <RefreshCw className={`w-3.5 h-3.5 animate-spin ${isStitchLight ?'text-indigo-600' :'text-cyan-400'}`} /> Analizando base de datos Supabase...
 </div>
 </div>
 )}

 {activeRun && (
 <div className={` rounded-[var(--r-l)] p-4 space-y-3 max-w-sm mt-1 animate-in slide-in-from-bottom-2 fade-in duration-300 ${isStitchLight ?'-indigo-100 bg-white shadow-md text-[var(--ink)]' :'-cyan-500/10 bg-[var(--bg)]/80 shadow-[0_4px_24px_rgba(0,0,0,0.6)] text-[var(--ink-3)]'}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase">
 <Activity className={`w-3.5 h-3.5 ${isStitchLight ?'text-indigo-600' :'text-cyan-400'} animate-pulse`} />
 <span>Monitoreando {activeRun.agentName}</span>
 </div>
 <button 
 type="button"
 onClick={() => setActiveRun(null)}
 className="text-[var(--ink-2)] hover:text-[var(--ink-3)] transition-colors cursor-pointer"
 title="Cerrar monitor"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className={`p-3 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)] -slate-200/60' :'bg-[var(--bg)]/60 -bg-[var(--surface)]/80'}`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)]">Estado</span>
 {activeRun.status ==='queued' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#d1b375]/15 text-[#d1b375] -amber-500/20 animate-pulse">🕒 En Cola</span>
 )}
 {activeRun.status ==='fetching' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-sky-500/15 text-sky-400 -indigo-500/20 animate-pulse">🔄 Despachando</span>
 )}
 {activeRun.status ==='in_progress' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 -cyan-500/20 animate-pulse">⚙️ Ejecutando...</span>
 )}
 {activeRun.status ==='completed' && activeRun.conclusion ==='success' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--surface)]/15 text-[var(--ok)] -emerald-500/20">✅ Éxito</span>
 )}
 {activeRun.status ==='completed' && activeRun.conclusion ==='failure' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-400 -rose-500/20">❌ Fallido</span>
 )}
 {activeRun.status ==='completed' && activeRun.conclusion !=='success' && activeRun.conclusion !=='failure' && (
 <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">{activeRun.conclusion ||'Terminado'}</span>
 )}
 </div>

 {/* Steps sequencer */}
 {activeRun.steps && activeRun.steps.length > 0 && (
 <div className="mt-3 space-y-2 pt-2 -dashed dark:-neutral-800">
 <div className="flex items-center gap-1.5 text-[9px] text-[var(--ink-2)] uppercase tracking-wider">
 <Terminal className="w-3 h-3" /> Secuencia de Pasos:
 </div>
 <div className="space-y-1.5 pl-1">
 {activeRun.steps.map((step: any, idx: number) => {
 const isStepSuccess = step.conclusion ==='success';
 const isStepFailure = step.conclusion ==='failure';
 const isStepRunning = step.status ==='in_progress';
 
 let dotColor ='bg-[var(--surface)]/80';
 let textColor ='text-[var(--ink-2)]';
 if (isStepSuccess) {
 dotColor ='bg-emerald-500 shadow-[0_0_4px_var(--ok)]';
 textColor = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-3)]';
 } else if (isStepFailure) {
 dotColor ='bg-rose-500 shadow-[0_0_4px_#f43f5e] animate-pulse';
 textColor ='text-rose-400 font-bold';
 } else if (isStepRunning) {
 dotColor ='bg-cyan-400 animate-ping';
 textColor ='text-cyan-400 font-bold';
 }

 return (
 <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
 <span className={`truncate leading-none ${textColor}`}>{step.name}</span>
 {isStepRunning && <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400 shrink-0" />}
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 {/* Outcome message feedback */}
 {activeRun.status ==='completed' && activeRun.conclusion ==='success' && (() => {
 const isLector = (activeRun.agentName ||'').toLowerCase().includes('lector');
 const isEnviador = (activeRun.agentName ||'').toLowerCase().includes('enviador');
 const isRedactor = (activeRun.agentName ||'').toLowerCase().includes('redactor');

 if (isLector) {
 return (
 <div className="p-3.5 bg-[var(--ok-soft)] rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className="text-[11px] text-[var(--ok)] font-bold uppercase tracking-wider">¡Bandeja Sincronizada!</span>
 </div>
 <p className="text-[10px] leading-normal text-[var(--ok)]">
 El agente Lector ha revisado tu bandeja de correo y actualizado el hilo de respuestas en Supabase.
 </p>
 </div>
 );
 }

 if (isEnviador) {
 return (
 <div className="p-3.5 bg-emerald-500/10 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">¡Despacho Completado!</span>
 </div>
 <p className="text-[10px] leading-normal text-emerald-500/90 dark:text-emerald-400/80">
 El agente Enviador ha procesado los correos autorizados en Supabase y registrado las fechas de envío.
 </p>
 </div>
 );
 }

 if (isRedactor) {
 return (
 <div className="p-3.5 bg-emerald-500/10 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300 select-text">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">¡Borradores Generados!</span>
 </div>
 <p className="text-[10px] leading-normal text-emerald-500/90 dark:text-emerald-400/80">
 El agente Redactor ha generado propuestas personalizadas en Supabase listas para tu revisión.
 </p>
 </div>
 );
 }

 // Get actual new leads
 let detectedLeads = leads.filter(l => !activeRun.initialLeadIds?.includes(l.id));

 if (activeRun.region) {
 const searchLower = activeRun.region.toLowerCase();
 const regionalFiltered = detectedLeads.filter(l => 
 (l.ciudad && l.ciudad.toLowerCase().includes(searchLower)) ||
 (l.region && l.region.toLowerCase().includes(searchLower)) ||
 (l.fuente && l.fuente.toLowerCase().includes(searchLower))
 );
 if (regionalFiltered.length > 0) {
 detectedLeads = regionalFiltered;
 }
 }

 // Fallback to region-specific simulated leads if no new leads were detected or in demo mode
 if (detectedLeads.length === 0 || activeRun.isDemo) {
 const regionName = activeRun.region || activeRun.params?.region || activeRun.params?.ciudad ||'Huelva';
 const normLoc = regionName.toLowerCase();
 const dateTag = new Date().toLocaleDateString();

 if (normLoc.includes("huelva")) {
 detectedLeads = [
 {
 id: `demo-huelva-1-${Date.now()}`,
 nombre_sala:'Gran Teatro de Huelva',
 ciudad:'Huelva',
 region:'Andalucía',
 aforo: 600,
 genero:'Música / Teatro / Mestizaje',
 tipo: activeRun.params?.tipo ||'Teatro/Sala',
 email_contacto:'programacion@teatrohuelva.es',
 telefono:'+34 959 21 01 00',
 instagram:'@teatrohuelva',
 fuente:'Scout Descubridor: Huelva',
 estado:'nuevo',
 pitch_generado:'',
 notas: `Descubierto para Huelva (${dateTag}).`
 },
 {
 id: `demo-huelva-2-${Date.now()}`,
 nombre_sala:'Foro Iberoamericano de La Rábida',
 ciudad:'Palos de la Frontera (Huelva)',
 region:'Andalucía',
 aforo: 2500,
 genero:'Festivales / Conciertos',
 tipo:'Festival',
 email_contacto:'cultura@diphuelva.es',
 telefono:'+34 959 53 05 00',
 instagram:'@diphuelva',
 fuente:'Scout Descubridor: Huelva',
 estado:'nuevo',
 pitch_generado:'',
 notas: `Descubierto para Huelva (${dateTag}).`
 }
 ];
 } else if (normLoc.includes("sevilla") || normLoc.includes("andaluc")) {
 detectedLeads = [
 {
 id: `demo-sevilla-1-${Date.now()}`,
 nombre_sala:'Sala Custom',
 ciudad:'Sevilla',
 region:'Andalucía',
 aforo: 1000,
 genero:'Rock / Electronica / Fusion',
 tipo: activeRun.params?.tipo ||'Sala',
 email_contacto:'info@salacustom.com',
 telefono:'+34 954 51 52 53',
 instagram:'@salacustom',
 fuente:'Scout Descubridor: Sevilla',
 estado:'nuevo',
 pitch_generado:'',
 notas: `Descubierto para Sevilla (${dateTag}).`
 }
 ];
 } else {
 const capLoc = regionName.charAt(0).toUpperCase() + regionName.slice(1);
 detectedLeads = [
 {
 id: `demo-gen-1-${Date.now()}`,
 nombre_sala: `Gran Espacio Musical de ${capLoc}`,
 ciudad: capLoc,
 region: capLoc,
 aforo: 550,
 genero:'Música en Directo / Fusion',
 tipo: activeRun.params?.tipo ||'Sala',
 email_contacto: `booking@espacio${capLoc.toLowerCase().replace(/\s+/g,'')}.es`,
 telefono:'+34 900 12 34 56',
 instagram: `@espacio_${capLoc.toLowerCase().replace(/\s+/g,'_')}`,
 fuente: `Scout Descubridor: ${capLoc}`,
 estado:'nuevo',
 pitch_generado:'',
 notas: `Descubierto para ${capLoc} (${dateTag}).`
 }
 ];
 }
 }

 const getLeadCategory = (lead: any) => {
 const name = (lead.nombre_sala ||'').toLowerCase();
 const type = (lead.tipo ||'').toLowerCase();
 if (name.includes('ayuntamiento') || name.includes('ayto') || name.includes('concello') || name.includes('gobierno') || type.includes('ayuntamiento') || type.includes('concello') || type.includes('teatro') || type.includes('auditorio')) {
 return'Ayuntamientos';
 }
 if (name.includes('festival') || name.includes('fest') || type.includes('festival')) {
 return'Festivales';
 }
 return'Salas / Clubs';
 };

 const groupedLeads = detectedLeads.reduce((acc: Record<string, typeof detectedLeads>, lead) => {
 const cat = getLeadCategory(lead);
 if (!acc[cat]) acc[cat] = [];
 acc[cat].push(lead);
 return acc;
 }, {});

 return (
 <div className="p-3.5 bg-emerald-500/10 -emerald-500/20 rounded-[var(--r-m)] space-y-2.5 animate-in fade-in duration-300 select-text">
 <div className="flex items-center gap-2">
 <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">¡Búsqueda Finalizada!</span>
 </div>
 
 <p className="text-[10px] leading-normal text-emerald-500/90 dark:text-emerald-400/80">
 El agente ha terminado con éxito y ha enviado los resultados directos a Supabase. Tu Gestor de Booking se ha actualizado en tiempo real.
 </p>

 <div className=" -emerald-500/20 pt-2.5 mt-2 space-y-2">
 <div className="flex justify-between items-center text-[10px] font-mono">
 <span className="text-emerald-400/80 text-[10px]">Nuevos contactos añadidos:</span>
 <span className="px-2 py-0.5 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold font-sans -emerald-500/30">
 {detectedLeads.length} contactos
 </span>
 </div>

 {detectedLeads.length > 0 ? (
 <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
 {Object.entries(groupedLeads).map(([category, items]) => (
 <div key={category} className="space-y-1">
 <span className="text-[8px] font-bold font-mono tracking-wider uppercase text-emerald-500/70 block">
 {category} ({items.length})
 </span>
 <div className="space-y-1 pl-1">
 {items.map((item, iIdx) => (
 <div 
 key={iIdx} 
 className={`p-1.5 rounded text-[9px] font-sans flex flex-col gap-0.5 ${
 isStitchLight 
 ?'bg-white/60 -slate-200/50 text-[var(--ink-2)]' 
 :'bg-[var(--surface)]/40 -neutral-800/60 text-[var(--ink-3)]'
 }`}
 >
 <div className="flex justify-between items-start">
 <strong className={`${isStitchLight ?'text-[var(--ink)]' :'text-[var(--sunken)]'} font-semibold truncate`}>
 {item.nombre_sala}
 </strong>
 <span className="text-[8px] opacity-75 font-mono">{item.ciudad}</span>
 </div>
 <div className="flex justify-between items-center text-[8px] opacity-80 font-mono">
 <span className="truncate max-w-[150px]">{item.email_contacto ||'Sin email'}</span>
 <span className="text-emerald-500 uppercase text-[7px] font-bold">Añadido</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-[9px] italic text-[var(--ink-2)] font-mono">
 No se detectaron nuevas filas en esta ejecución. Toda la información ya está al día.
 </p>
 )}
 </div>
 </div>
 );
 })()}

 {activeRun.status ==='completed' && activeRun.conclusion ==='failure' && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-[var(--r-m)] space-y-2 animate-in fade-in duration-300">
 <div className="flex items-center justify-between">
 <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
 <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
 <span>Incidencia en Motor de Agentes Supabase</span>
 </p>
 </div>
 <p className="text-[10px] leading-normal text-[var(--ink-2)]/90">
 El agente encontró un problema durante su ejecución contra Supabase. Verifica tu conexión con la base de datos y vuelve a intentarlo.
 </p>
 </div>
 )}
 </div>
 )}

 <div ref={messagesEndRef} />
 </div>

 {/* Input Message Form Footer */}
 <form onSubmit={handleSendMessage} className={`p-3 flex gap-2 items-end ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--bg)]/90 -bg-[var(--surface)]/60'}`}>
 <textarea
 id="chatbot-text-input"
 ref={textareaRef}
 rows={1}
 value={inputText}
 onChange={(e) => setInputText(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
 className={`flex-1 rounded-[var(--r-m)] px-3.5 py-2 text-xs focus:outline-none transition-all font-sans resize-none max-h-28 min-h-[38px] ${
 isStitchLight 
 ?'bg-white text-[var(--ink)] focus:-indigo-500 placeholder:text-[var(--ink-3)]' 
 :'bg-[var(--surface)]/60 text-[var(--sunken)] focus:-cyan-500/50 placeholder:text-[var(--ink-2)]'
 }`}
 />
 <button
 id="chatbot-mic-btn"
 type="button"
 onClick={handleToggleMic}
 disabled={!speechSupported}
 title={speechSupported ? (isListening ?'Detener dictado por voz' :'Dar instrucciones por voz') :'Tu navegador no soporta dictado por voz'}
 className={`p-2.5 rounded-[var(--r-m)] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 active:opacity-90 mb-0.5 disabled:opacity-30 disabled:cursor-not-allowed ${
 isListening
 ?'bg-red-500 text-[var(--ink)] animate-pulse'
 : (isStitchLight ?'bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-[var(--surface)] text-[var(--ink-2)] -neutral-800/40')
 }`}
 >
 <Mic className="w-4 h-4" />
 </button>
 <button
 id="chatbot-send-btn"
 type="submit"
 disabled={!inputText.trim() || isLoading}
 className={`p-2.5 rounded-[var(--r-m)] font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 active:opacity-90 mb-0.5 ${
 inputText.trim() 
 ? (isStitchLight ?'bg-indigo-600 text-[var(--ink)]' : colors.primary) 
 : (isStitchLight ?'bg-[var(--sunken)] text-[var(--ink-3)]' :'bg-[var(--surface)] text-[var(--ink-2)] -neutral-800/40')
 }`}
 >
 <Send className={`w-4 h-4 ${isStitchLight && inputText.trim() ?'text-[var(--ink)]' :'text-zinc-950'}`} />
 </button>
 </form>

 {/* MODAL CONFIGURACIÓN NIVELES DE AUTONOMÍA (SOLO ADMINISTRADORES) */}
 {isAdmin && (
 <AgentAutonomySettingsModal
 isOpen={isAutonomyModalOpen}
 onClose={() => setIsAutonomyModalOpen(false)}
 bandName={bandDisplayName}
 />
 )}
 </div>
 );
}


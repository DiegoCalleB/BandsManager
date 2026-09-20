import React, { useState, useEffect, useRef } from'react';
import { motion, AnimatePresence } from'motion/react';
import { Rehearsal, Concert, ThemeColors, BookingCampaign, KeyContactItem, TechnicalLogistics, CierreMaterialItem, MerchBoloItem, MerchControlBolo } from'../types';
import DirectionsCard from'./DirectionsCard';
import { Calendar, Mic, DoorClosed, Clock, MapPin, CheckSquare, Sparkles, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2, Download, Navigation, Disc3, Music, Users, Ticket, Link2, Check, Copy, ExternalLink, Radio, Target, Flame, Building2, Eye, QrCode, Settings, Smartphone, Monitor, Cloud, ChevronDown, Video, Handshake, Bell, Send, Loader2, List, CalendarDays, Maximize2, Minimize2, MessageCircle, MessageSquare, Share2, AlertTriangle, Thermometer, Edit, Phone, Wrench, ShieldCheck, Truck, Volume2, Zap, CheckCircle2, RotateCcw, UserCheck, Layers, ArrowUpRight, Shirt, Coins, CreditCard, Banknote, Calculator, ShoppingBag, Tag } from'lucide-react';
import { EventWeatherCard } from'./calendar/EventWeatherCard';
import { CalendarWeatherBadge, AnimatedWeatherIcon } from'./calendar/AnimatedWeatherIcon';
import { getCachedEventWeatherAlerts, WeatherAlert } from'../services/weatherService';
import QRCode from'react-qr-code';
import { ModalPortal } from'./common/ModalPortal';
import { api } from'../services/api';
import { apiFetch } from'../utils/api';
import { triggerNativeMobileNotification } from'../utils/webPush';
import { FAN_FORM_LANGUAGES } from'../i18n/fansTranslations';
import { normalizePlan, hasModuleAccess } from'../utils/planPermissions';
import { 
 getCalendarDefaultMonths, 
 setCalendarDefaultMonths, 
 isTwoMonthsDefault, 
 getAllDevicePreferences, 
 syncCalendarPreferencesFromUser, 
 detectDeviceType, 
 CalendarMonthsView, 
 DeviceType 
} from'../utils/calendarViewPreferences';
import { useModuleTutorial } from'../hooks/useModuleTutorial';
import { ModuleTutorialModal } from'./common/ModuleTutorialModal';
import { ModuleTutorialTrigger } from'./common/ModuleTutorialTrigger';
import { SetlistPerformanceView } from'./SetlistPerformanceView';
import { HolidayDateWarning } from'./common/HolidayDateWarning';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';

interface CalendarViewProps {
 colors: ThemeColors;
 rehearsals: Rehearsal[];
 concerts: Concert[];
 campaigns?: BookingCampaign[];
 activeCampaign?: BookingCampaign | null;
 onNavigate?: (view: string, options?: any) => void;
 onUpdateRehearsal: (id: string, updatedFields: Partial<Rehearsal>) => void;
 onUpdateConcert: (id: string, updatedFields: Partial<Concert>) => void;
 onDeleteRehearsal?: (id: string) => void;
 onDeleteConcert?: (id: string) => void;
 onAddRehearsal?: (rehearsal: Rehearsal) => void;
 onAddConcert?: (concert: Concert) => void;
 initialSelectedEventId?: string;
 initialSelectedDate?: string;
 currentBandId?: string;
 currentBandName?: string;
 currentBandLogo?: string;
 availableBands?: Array<{ band_id: string; bandName: string; name?: string; logoUrl?: string; logo_url?: string; imagen_url?: string; avatar_url?: string }>;
 bandUsers?: Array<{ id: string; name: string; username?: string; role?: string; instrument?: string; band_id?: string; bandName?: string }>;
 currentUser?: { id?: string; name?: string; username?: string; email?: string; role?: string; band_id?: string; instrument?: string; plan?: string; ui_preferences?: any };
 isPromoPlan?: boolean;
 onShowNotification?: (message: string, type?:'success' |'error' |'info') => void;
}

interface RunOfShowItem {
 id: string;
 time: string;
 activity: string;
 done: boolean;
}

interface GearItem {
 id: string;
 label: string;
 checked: boolean;
}

export const getDetailedDateInfo = (dateInput: string | Date | undefined | null) => {
 if (!dateInput) return null;
 let d: Date;
 if (typeof dateInput ==='string') {
 const cleanStr = dateInput.split('T')[0].trim();
 const parts = cleanStr.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const day = parseInt(parts[2], 10);
 d = new Date(y, m, day, 12, 0, 0);
 } else {
 d = new Date(dateInput);
 }
 } else {
 d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 12, 0, 0);
 }
 if (isNaN(d.getTime())) return null;

 const dayNamesLong = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
 const dayNamesShort = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
 const monthNamesLong = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
 ];
 const monthNamesShort = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

 const dayOfWeek = dayNamesLong[d.getDay()];
 const dayOfWeekShort = dayNamesShort[d.getDay()];
 const dayNum = d.getDate();
 const monthLong = monthNamesLong[d.getMonth()];
 const monthShort = monthNamesShort[d.getMonth()];
 const year = d.getFullYear();

 // Indicador temporal relativo
 const today = new Date();
 today.setHours(12, 0, 0, 0);
 const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
 const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

 let relativeLabel ='';
 let relativeBadgeClass ='';
 if (diffDays === 0) {
 relativeLabel ='¡HOY!';
 relativeBadgeClass ='bg-emerald-500 text-[var(--acc-ink)] font-black shadow-xs animate-pulse';
 } else if (diffDays === 1) {
 relativeLabel ='Mañana';
 relativeBadgeClass ='bg-[var(--acc)]/60 text-[var(--acc-ink)] font-black shadow-xs';
 } else if (diffDays === 2) {
 relativeLabel ='Pasado mañana';
 relativeBadgeClass ='bg-[var(--acc)]/20 text-[var(--acc)]/70';
 } else if (diffDays > 2 && diffDays <= 7) {
 relativeLabel = `En ${diffDays} días`;
 relativeBadgeClass ='bg-sky-500/20 text-sky-300';
 } else if (diffDays > 7 && diffDays <= 30) {
 const weeks = Math.round(diffDays / 7);
 relativeLabel = `En ${diffDays} días (${weeks} sem)`;
 relativeBadgeClass ='bg-sky-950/40 text-sky-300';
 } else if (diffDays > 30) {
 const months = Math.round(diffDays / 30);
 relativeLabel = `En ${diffDays} días (~${months} mes${months > 1 ?'es' :''})`;
 relativeBadgeClass ='bg-[var(--surface)]/80 text-[var(--ink)]';
 } else if (diffDays === -1) {
 relativeLabel ='Ayer';
 relativeBadgeClass ='bg-[var(--surface)]/80 text-[var(--ink-2)]';
 } else {
 relativeLabel = `Celebrado (hace ${Math.abs(diffDays)} d)`;
 relativeBadgeClass ='bg-[var(--surface)] text-[var(--ink-2)]';
 }

 return {
 dayOfWeek,
 dayOfWeekShort,
 dayNum,
 monthLong,
 monthShort,
 year,
 fullFormatted: `${dayOfWeek}, ${dayNum} de ${monthLong} de ${year}`,
 shortFormatted: `${dayOfWeekShort} ${dayNum} ${monthShort}`,
 diffDays,
 relativeLabel,
 relativeBadgeClass
 };
};

export default function CalendarView({
 colors,
 rehearsals,
 concerts,
 campaigns = [],
 activeCampaign = null,
 onNavigate,
 onUpdateRehearsal,
 onUpdateConcert,
 onDeleteRehearsal,
 onDeleteConcert,
 onAddRehearsal,
 onAddConcert,
 initialSelectedEventId,
 initialSelectedDate,
 currentBandId ='',
 currentBandName ='',
 currentBandLogo ='',
 availableBands = [],
 bandUsers = [],
 currentUser,
 isPromoPlan: isPromoPlanProp,
 onShowNotification
}: CalendarViewProps) {
 const isPromoPlan = isPromoPlanProp ?? (
 normalizePlan(currentUser?.plan) ==='promo' ||
 Boolean(availableBands.find(b => (b.band_id === currentBandId || (b as any).id === currentBandId) && normalizePlan((b as any).plan) ==='promo'))
 );
 const { isOpen: isTutorialOpen, openTutorial, closeTutorial } = useModuleTutorial('calendario');
 const realToday = new Date();
 const [viewDate, setViewDate] = useState<Date>(() => new Date(realToday.getFullYear(), realToday.getMonth(), 1));
 const [selectedDate, setSelectedDate] = useState<Date>(() => realToday);
 // Cuando un día tiene varios eventos (2 conciertos, o concierto + ensayo), este id dice cuál se
 // ve en el panel de detalle. Sin esto, el panel siempre mostraba el primero del array y el resto
 // era invisible salvo el pequeño acceso directo de"editar ficha" en las chapas del día.
 const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
 const [copiedQrId, setCopiedQrId] = useState<string | null>(null);
 const [copiedEventModalId, setCopiedEventModalId] = useState<string | null>(null);
 const [deletingEventConfirmId, setDeletingEventConfirmId] = useState<string | null>(null);

 // Band view filter state:'all' (Todas las bandas asignadas por defecto) vs'active' (Solo la banda activa)
 const [filterBandMode, setFilterBandMode] = useState<'active' |'all'>('all');

 const activeBandId = currentBandId;
 const activeBandName = currentBandName;

 // Helper to compare band IDs normalizing prefixes (e.g.,'band-' vs'reg-')
 const isSameBandId = React.useCallback((id1?: string, id2?: string) => {
 if (!id1 && !id2) return true;
 if (!id1 || !id2) return false;
 if (id1 === id2) return true;
 const clean1 = id1.replace(/^(band|reg)-/,'').trim().toLowerCase();
 const clean2 = id2.replace(/^(band|reg)-/,'').trim().toLowerCase();
 return clean1 === clean2;
 }, []);

 // Build list of all user's assigned bands with logo resolution
 const effectiveBandsList = React.useMemo(() => {
 const map = new Map<string, { band_id: string; bandName: string; logoUrl?: string }>();

 let customLogos: Record<string, string> = {};
 try {
 const raw = localStorage.getItem('bandmanager_custom_band_logos');
 if (raw) customLogos = JSON.parse(raw);
 } catch {}

 const addBandToMap = (id?: string, name?: string, logo?: string) => {
 if (!id) return;
 const cleanKey = id.replace(/^(band|reg)-/,'').trim().toLowerCase();

 let resolvedLogo = logo || customLogos[cleanKey] ||'';
 if (!resolvedLogo && isSameBandId(id, activeBandId) && currentBandLogo) {
 resolvedLogo = currentBandLogo;
 }
 if (!resolvedLogo && (cleanKey ==='bakandeya' || name?.toLowerCase().includes('bakandeya') || id.toLowerCase().includes('bakandeya'))) {
 resolvedLogo ='/logo_bakandeya_bueno_sin_fondo.png';
 }

 if (!map.has(cleanKey)) {
 const displayName = name || (
 cleanKey ==='bakandeya' ?'Bakandeya' :
 cleanKey ==='repercusion' ?'Repercusion' :
 cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)
 );
 map.set(cleanKey, { band_id: id, bandName: displayName, logoUrl: resolvedLogo });
 } else {
 const existing = map.get(cleanKey)!;
 if (resolvedLogo && !existing.logoUrl) existing.logoUrl = resolvedLogo;
 if (name && existing.bandName === cleanKey) existing.bandName = name;
 }
 };

 if (activeBandId) {
 addBandToMap(activeBandId, activeBandName, currentBandLogo);
 }

 if (availableBands && availableBands.length > 0) {
 availableBands.forEach((b: any) => {
 const id = b.band_id || b.id;
 const name = b.bandName || b.name || b.nombre_banda;
 const logo = b.logoUrl || b.logo_url || b.imagen_url || b.avatar_url;
 addBandToMap(id, name, logo);
 });
 }

 concerts.forEach((c: any) => {
 if (c.band_id) {
 addBandToMap(c.band_id, c.bandName, c.bandLogo || c.logoUrl);
 }
 });

 rehearsals.forEach((r: any) => {
 if (r.band_id) {
 addBandToMap(r.band_id, r.bandName, r.bandLogo || r.logoUrl);
 }
 });

 return Array.from(map.values());
 }, [activeBandId, activeBandName, currentBandLogo, availableBands, concerts, rehearsals, isSameBandId]);

 // Helper to accurately derive the band name for any concert or rehearsal event
 const getEventBandName = React.useCallback((e: { bandName?: string; band_id?: string } | null | undefined): string => {
 if (!e) return activeBandName ||'Tu Banda';
 if (e.bandName) return e.bandName;
 if (e.band_id) {
 const found = effectiveBandsList.find(b => isSameBandId(b.band_id, e.band_id));
 if (found?.bandName) return found.bandName;
 if (isSameBandId(e.band_id,'band-bakandeya')) return'Bakandeya';
 if (isSameBandId(e.band_id,'band-repercusion')) return'Repercusion';
 if (e.band_id.startsWith('band-') || e.band_id.startsWith('reg-')) {
 const slug = e.band_id.replace(/^(band|reg)-/,'');
 return slug.charAt(0).toUpperCase() + slug.slice(1);
 }
 }
 return activeBandName ||'Tu Banda';
 }, [effectiveBandsList, activeBandName, isSameBandId]);

 // Check if current user is in multiple bands or has access to multiple bands' events
 const isMultiBandUser =
 effectiveBandsList.length > 1 ||
 (availableBands && availableBands.length > 1) ||
 currentUser?.role ==='admin' ||
 currentUser?.role ==='leader' ||
 (currentUser as any)?.is_admin ||
 concerts.some(c => c.band_id && !isSameBandId(c.band_id, activeBandId)) ||
 rehearsals.some(r => r.band_id && !isSameBandId(r.band_id, activeBandId));

 // Form state for selected band when creating rehearsal/concert
 const [selectedBandIdForNewEvent, setSelectedBandIdForNewEvent] = useState(activeBandId);
 const [showSyncModal, setShowSyncModal] = useState(false);
 const [syncScope, setSyncScope] = useState<'all' |'active'>('all');
 const [copiedFeed, setCopiedFeed] = useState(false);
 // La URL del feed .ics la firma el servidor: el enlace lleva una firma para que no baste con
 // saber el band_id para leerse los conciertos y ensayos de una banda cualquiera.
 const [rutaFeed, setRutaFeed] = useState<string | null>(null);
 const [errorFeed, setErrorFeed] = useState<string | null>(null);

 const bandasDelFeed = React.useMemo(
 () =>
 syncScope ==='all' && effectiveBandsList.length > 1
 ? effectiveBandsList.map(b => b.band_id).join(',')
 : activeBandId ||'',
 [syncScope, effectiveBandsList, activeBandId]
 );

 useEffect(() => {
 if (!showSyncModal || !bandasDelFeed) return;
 let cancelado = false;
 setErrorFeed(null);
 api
 .getCalendarFeedUrl(bandasDelFeed)
 .then(res => {
 if (cancelado) return;
 if (res.path) setRutaFeed(res.path);
 else setErrorFeed(res.error ||'No se pudo generar el enlace del calendario.');
 })
 .catch((err: any) => {
 if (!cancelado) setErrorFeed(err?.message ||'No se pudo generar el enlace del calendario.');
 });
 return () => {
 cancelado = true;
 };
 }, [showSyncModal, bandasDelFeed]);

 const urlFeedAbsoluta = rutaFeed ? `${window.location.origin}${rutaFeed}` :'';


 // Effective band members list for Convocatoria filtered by target band of the event
 // Antes esto era la formación real de Bakandeya (Diego, Filgue, Batería, Teclados) y se usaba
 // como lista por defecto de"miembros" para CUALQUIER banda sin integrantes cargados todavía:
 // cualquier banda nueva programando su primer ensayo veía a los compañeros de banda de Diego
 // como asistentes seleccionables. Sin datos reales, el único miembro real disponible es quien
 // ha iniciado sesión.
 const defaultMembers = React.useMemo(() => (
 currentUser
 ? [{ id: currentUser.id, name: currentUser.name || currentUser.username ||'Miembro', role: currentUser.role ||'member' }]
 : []
 ), [currentUser]);

 const effectiveBandMembers = React.useMemo(() => {
 const targetBandId = selectedBandIdForNewEvent || activeBandId ||"";
 const targetClean = targetBandId.replace(/^(band|reg)-/,"").replace(/-\d+$/,"").toLowerCase();
 const targetIsBakandeya = targetClean ==="bakandeya";

 if (bandUsers && bandUsers.length > 0) {
 const filtered = bandUsers.filter(u => {
 const uClean = (u.band_id ||"").replace(/^(band|reg)-/,"").replace(/-\d+$/,"").toLowerCase();
 const uBandName = (u.bandName ||"").toLowerCase();
 return targetIsBakandeya
 ? (!u.band_id || uClean ==="bakandeya" || uClean ==="")
 : (uClean === targetClean || uBandName.includes(targetClean));
 });

 const list = filtered.length > 0 ? filtered : bandUsers;
 return list.map(u => ({
 id: u.id,
 name: u.name || u.username ||"Miembro",
 role: u.role ||"member",
 instrument: u.instrument
 }));
 }
 return defaultMembers;
 }, [bandUsers, selectedBandIdForNewEvent, activeBandId, defaultMembers]);

 // Convocatoria form state
 const [convocatoriaTipo, setConvocatoriaTipo] = useState<'completa' |'parcial'>('completa');
 const [convocadosIds, setConvocadosIds] = useState<string[]>([]);

 // Event Reminder Modal State
 const [showReminderModal, setShowReminderModal] = useState(false);
 const [reminderSending, setReminderSending] = useState(false);
 const [reminderSuccessMsg, setReminderSuccessMsg] = useState<string | null>(null);
 const [reminderErrorMsg, setReminderErrorMsg] = useState<string | null>(null);
 const [reminderNotes, setReminderNotes] = useState('');
 const [reminderSendEmail, setReminderSendEmail] = useState(true);
 const [reminderSendPush, setReminderSendPush] = useState(true);

 const handleSendEventReminder = async () => {
 const evt = selectedConcert || selectedRehearsal;
 if (!evt) return;

 setReminderSending(true);
 setReminderSuccessMsg(null);
 setReminderErrorMsg(null);

 const eventType = selectedConcert ?'concierto' : (selectedRehearsal?.tipo_evento ==='reunion' ?'reunion' :'ensayo');
 const eventTitle = selectedConcert ? selectedConcert.sala : (selectedRehearsal?.asunto || selectedRehearsal?.lugar ||'Evento');
 const eventDate = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
 const eventTime = selectedRehearsal?.hora ||'';
 const eventLocation = selectedConcert ? `${selectedConcert.sala}, ${selectedConcert.ciudad}` : (selectedRehearsal?.lugar ||'');

 const recipientEmails = effectiveBandMembers
 .map((m: any) => m.email)
 .filter((e: string | undefined): e is string => !!e && e.includes('@'));

 if (recipientEmails.length === 0 && currentUser?.email) {
 recipientEmails.push(currentUser.email);
 }

 let pushSent = false;
 let emailSent = false;
 let pushMsg ='';
 let emailMsg ='';

 try {
 if (reminderSendPush) {
 const notifTitle = `🔔 ${eventType.toUpperCase()}: ${eventTitle}`;
 const notifBody = `📅 ${eventDate}${eventTime ? ` a las ${eventTime}` :''}${eventLocation ? ` (${eventLocation})` :''}${reminderNotes ? `\n💡 ${reminderNotes}` :''}`;
 const pushResult = await triggerNativeMobileNotification(notifTitle, { body: notifBody });
 if (pushResult.success) {
 pushSent = true;
 pushMsg ='📱 Notificación enviada al dispositivo móvil';
 } else {
 pushMsg = `📱 Móvil: ${pushResult.status}`;
 }
 }

 if (reminderSendEmail) {
 try {
 const data = await apiFetch<any>('/api/bands/send-reminder', {
 method:'POST',
 body: JSON.stringify({
 event_title: eventTitle,
 event_type: eventType,
 event_date: eventDate,
 event_time: eventTime,
 event_location: eventLocation,
 recipients: recipientEmails,
 custom_notes: reminderNotes,
 send_email: true
 })
 });

 if (data && data.success) {
 emailSent = true;
 emailMsg ='📧 Correo enviado a la banda';
 } else {
 emailMsg = data?.error ||'No se pudo enviar el correo';
 }
 } catch (apiErr: any) {
 console.warn('Error enviando correo de recordatorio:', apiErr);
 emailMsg = apiErr?.message ||'Error en envío de correo';
 }
 }

 if (pushSent || emailSent) {
 const messages = [pushSent ? pushMsg : null, emailSent ? emailMsg : null].filter(Boolean).join(' y');
 setReminderSuccessMsg(`¡Recordatorio enviado con éxito! (${messages})`);
 onShowNotification?.('🔔 Recordatorio enviado correctamente','success');
 setTimeout(() => {
 setShowReminderModal(false);
 setReminderSuccessMsg(null);
 setReminderNotes('');
 }, 2200);
 } else {
 const errDetails = [
 reminderSendPush ? pushMsg : null,
 reminderSendEmail ? emailMsg : null
 ].filter(Boolean).join('.');
 setReminderErrorMsg(`No se pudo enviar el recordatorio: ${errDetails}`);
 }
 } catch (err: any) {
 console.error('Error enviando recordatorio:', err);
 setReminderErrorMsg(err?.message ||'Error al procesar el recordatorio');
 } finally {
 setReminderSending(false);
 }
 };

 // Filter helper by Convocatoria (Banda Completa vs Convocatoria Parcial)
 const matchesConvocatoria = React.useCallback((evt: Concert | Rehearsal) => {
 if (evt.convocatoria_tipo ==='parcial' && evt.convocados_ids && evt.convocados_ids.length > 0) {
 if (currentUser) {
 const uId = currentUser.id;
 const uEmail = (currentUser.email ||'').toLowerCase().trim();
 const uUsername = (currentUser.username ||'').toLowerCase().trim();
 
 const isSummoned = evt.convocados_ids.some(id => {
 if (!id) return false;
 if (id === uId) return true;
 // Also check if id format contains username/email or part of user id
 const cleanEvtId = id.toLowerCase().trim();
 if (uEmail && cleanEvtId === uEmail) return true;
 if (uUsername && cleanEvtId === uUsername) return true;
 if (uId && (cleanEvtId.includes(uId) || uId.includes(cleanEvtId))) return true;
 return false;
 });

 const isLeader = currentUser.role ==='leader';
 return isSummoned || isLeader;
 }
 }
 return true; //'completa' or omitted -> visible to all
 }, [currentUser]);

 // Filtered concerts & rehearsals depending on filterBandMode and Convocatoria
 const filteredConcerts = React.useMemo(() => {
 let list = concerts;
 if (filterBandMode ==='active') {
 list = concerts.filter(c => {
 if (!c.band_id) return isSameBandId(activeBandId,'band-bakandeya');
 return isSameBandId(c.band_id, activeBandId);
 });
 }
 return list.filter(matchesConvocatoria);
 }, [concerts, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId]);

 
 const activeBandConcerts = React.useMemo(() => {
 return concerts.filter(c => {
 if (!c.band_id) return isSameBandId(activeBandId,"band-bakandeya");
 return isSameBandId(c.band_id, activeBandId);
 }).filter(matchesConvocatoria);
 }, [concerts, activeBandId, isSameBandId, matchesConvocatoria]);

 const activeBandRehearsals = React.useMemo(() => {
 return rehearsals.filter(r => {
 if (!r.band_id) return isSameBandId(activeBandId,"band-bakandeya");
 return isSameBandId(r.band_id, activeBandId);
 }).filter(matchesConvocatoria);
 }, [rehearsals, activeBandId, isSameBandId, matchesConvocatoria]);

 const filteredRehearsals = React.useMemo(() => {
 let list = rehearsals;
 if (filterBandMode ==='active') {
 list = rehearsals.filter(r => {
 if (!r.band_id) return isSameBandId(activeBandId,'band-bakandeya');
 return isSameBandId(r.band_id, activeBandId);
 });
 }
 return list.filter(matchesConvocatoria);
 }, [rehearsals, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId]);

 // Handle initial selected date / event ID passed as props
 useEffect(() => {
 if (initialSelectedDate) {
 const parts = initialSelectedDate.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const d = parseInt(parts[2], 10);
 if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
 const dt = new Date(y, m, d);
 setSelectedDate(dt);
 setViewDate(new Date(y, m, 1));
 }
 }
 } else if (initialSelectedEventId) {
 const conc = concerts.find(c => c.id === initialSelectedEventId);
 const reh = rehearsals.find(r => r.id === initialSelectedEventId);
 const eventDate = conc?.fecha || reh?.fecha;
 if (eventDate) {
 const parts = eventDate.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const d = parseInt(parts[2], 10);
 if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
 const dt = new Date(y, m, d);
 setSelectedDate(dt);
 setViewDate(new Date(y, m, 1));
 // Si el día tenía más de un evento, ir directo al que se pidió en vez del primero.
 setSelectedEventId(initialSelectedEventId);
 }
 }
 }
 }
 }, [initialSelectedDate, initialSelectedEventId, concerts, rehearsals]);

 // Configuración de vista de meses por tipo de dispositivo (1 mes por defecto para simplificación visual, configurable y sincronizado en Supabase)
 const currentDeviceType = detectDeviceType();
 const [devicePrefs, setDevicePrefs] = useState<{ mobile: CalendarMonthsView; desktop: CalendarMonthsView }>(() => getAllDevicePreferences());
 const [selectedConfigDevice, setSelectedConfigDevice] = useState<DeviceType>(() => detectDeviceType());
 const [twoMonthsMode, setTwoMonthsMode] = useState<boolean>(() => isTwoMonthsDefault());
 const [calendarViewMode, setCalendarViewMode] = useState<'1m' |'2m' |'week' |'agenda'>(() => isTwoMonthsDefault() ?'2m' :'1m');
 const [showViewConfigPopover, setShowViewConfigPopover] = useState<boolean>(false);
 const [configToast, setConfigToast] = useState<string | null>(null);
 const [isSavingPref, setIsSavingPref] = useState<boolean>(false);
 const viewConfigRef = useRef<HTMLDivElement>(null);

 // Sincronizar preferencias si el usuario se autentica o refresca sesión
 useEffect(() => {
 if (currentUser) {
 syncCalendarPreferencesFromUser(currentUser as any);
 const updated = getAllDevicePreferences();
 setDevicePrefs(updated);
 const curDev = detectDeviceType();
 const is2m = updated[curDev] ==='2';
 setTwoMonthsMode(is2m);
 setCalendarViewMode(prev => (prev ==='week' || prev ==='agenda') ? prev : (is2m ?'2m' :'1m'));
 }
 }, [currentUser]);

 // Cerrar el menú de configuración de vista al hacer clic fuera o pulsar Escape
 useEffect(() => {
 if (!showViewConfigPopover) return;
 const handleClickOutside = (e: MouseEvent) => {
 if (viewConfigRef.current && !viewConfigRef.current.contains(e.target as Node)) {
 setShowViewConfigPopover(false);
 }
 };
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key ==='Escape') setShowViewConfigPopover(false);
 };
 document.addEventListener('mousedown', handleClickOutside);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickOutside);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, [showViewConfigPopover]);

 const handleSetDefaultMonthsForDevice = async (mode: CalendarMonthsView, targetDevice: DeviceType) => {
 setIsSavingPref(true);
 setDevicePrefs(prev => ({ ...prev, [targetDevice]: mode }));

 if (targetDevice === currentDeviceType) {
 setTwoMonthsMode(mode ==='2');
 setCalendarViewMode(mode ==='2' ?'2m' :'1m');
 }

 const isCloudSaved = await setCalendarDefaultMonths(mode, targetDevice, true);
 setIsSavingPref(false);

 const devLabel = targetDevice ==='mobile' ?'móviles' :'ordenadores';
 const modeLabel = mode ==='1' ?'1 mes' :'2 meses';
 setConfigToast(isCloudSaved
 ? `Guardado en Supabase: ${modeLabel} por defecto para ${devLabel}`
 : `Guardado en local: ${modeLabel} por defecto para ${devLabel}`
 );

 setTimeout(() => {
 setConfigToast(null);
 }, 2200);
 };

 const [activeTab, setActiveTab] = useState<'runofshow' |'tecnica' |'contactos' |'merchan' |'cierre' |'gear' |'roadbook'>('runofshow');
 const [modalActiveTab, setModalActiveTab] = useState<'resumen' |'tecnica' |'contactos' |'merchan' |'cierre'>('resumen');

 // Roadbooks state per event date
 interface RoadbookInfo {
 contactoPromotor: string;
 telefonoPromotor: string;
 tecnicoSonido: string;
 hotelNombre: string;
 hotelDireccion: string;
 cateringInfo: string;
 inputList: string;
 horaLlegada?: string;
 horaPruebaSonido?: string;
 horaAperturaPuertas?: string;
 horaShow?: string;
 horaCierreToque?: string;
 paEspecificaciones?: string;
 monitoresTipo?: string;
 canalesMonitores?: string;
 backlineInfo?: string;
 potenciaElectrica?: string;
 notasTecnicas?: string;
 contactosClave?: KeyContactItem[];
 cierreMaterial?: CierreMaterialItem[];
 merchControl?: MerchControlBolo;
 }

 // Form states for adding Key Contact
 const [showAddContactForm, setShowAddContactForm] = useState(false);
 const [newContactNombre, setNewContactNombre] = useState('');
 const [newContactRol, setNewContactRol] = useState('Promotor / Sala');
 const [newContactTelefono, setNewContactTelefono] = useState('');
 const [newContactEmail, setNewContactEmail] = useState('');
 const [newContactNotas, setNewContactNotas] = useState('');

 // Form states for adding Cierre Item
 const [newCierreItemText, setNewCierreItemText] = useState('');
 const [newCierreItemCat, setNewCierreItemCat] = useState<'escenario' |'camerino' |'furgoneta'>('escenario');

 // Form states for Merch Control
 const [showAddMerchForm, setShowAddMerchForm] = useState(false);
 const [newMerchNombre, setNewMerchNombre] = useState('');
 const [newMerchCategoria, setNewMerchCategoria] = useState<'camisetas' |'vinilos' |'musica' |'accesorios' |'otro'>('camisetas');
 const [newMerchTalla, setNewMerchTalla] = useState('');
 const [newMerchPrecio, setNewMerchPrecio] = useState<string>('20');
 const [newMerchStockInicial, setNewMerchStockInicial] = useState<string>('15');
 const [merchCopiedToast, setMerchCopiedToast] = useState(false);

 const getDefaultRoadbook = (concert?: Concert | null): RoadbookInfo => {
 const salaNombre = concert?.sala ||'Sala de Conciertos';
 const ciudadNombre = concert?.ciudad ||'Madrid';
 return {
 contactoPromotor: `Manuel (Producción ${salaNombre})`,
 telefonoPromotor:'+34 654 321 987',
 tecnicoSonido:'Carlos (FOH / Sonido)',
 hotelNombre:'Hotel de Gira',
 hotelDireccion: ciudadNombre,
 cateringInfo:'Cena caliente tras prueba de sonido + aguas, fruta y toallas en camerino',
 inputList:'1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Hi-Hat (KM184)\n4. Bajo (D.I. Radial J48)\n5. Guitarra 1 (e906)\n6. Guitarra 2 (SM57)\n7. Teclado L/R (2x D.I.)\n8. Trompeta (Clip DPA)\n9. Saxo (Clip DPA)\n10. Voz Principal (Beta 58)\n11. Coro Gtr (SM58)\n12. Coro Teclado (SM58)',
 horaLlegada:'17:00',
 horaPruebaSonido:'18:00 - 19:30',
 horaAperturaPuertas:'20:30',
 horaShow: concert?.fecha ?'21:30' :'21:30',
 horaCierreToque:'01:00',
 paEspecificaciones:'Sistema Line Array estéreo homogéneo (D&B / L-Acoustics / Meyer) con subwoofers dedicados y presión adecuada.',
 monitoresTipo:'In-Ears estéreo de la banda (traemos transmisores propios) + 2 cuñas de refuerzo en frontal de escenario.',
 canalesMonitores:'4 envíos auxiliares independientes XLR a rack de IEMs.',
 backlineInfo:'Sala aporta: Batería básica (bombo, toms, pie hihat, 3 pies plato). Banda trae: Caja, platos, pedal bombo, amplificadores de guitarra/bajo y pedaleras.',
 potenciaElectrica:'2 tomas Schuko 220V / 16A limpias en frontal y trasera de escenario.',
 notasTecnicas:'Muelle de carga lateral disponible desde las 16:30. Acceso a prueba de sonido puntual.',
 contactosClave: [
 {
 id:'ct-1',
 nombre: `Manuel Producción (${salaNombre})`,
 rol:'Promotor / Sala',
 telefono:'+34 654 321 987',
 email:'produccion@conciertos.es',
 notas:'Contacto principal para accesos, llaves camerino y cobro de taquilla/caché.'
 },
 {
 id:'ct-2',
 nombre:'Carlos Sonido (FOH)',
 rol:'Técnico de Sonido (P.A.)',
 telefono:'+34 612 345 678',
 email:'sonido@salaslive.com',
 notas:'A cargo de la mesa de mezclas en sala y chequeo de líneas de microfonía.'
 },
 {
 id:'ct-3',
 nombre:'Laura Hospitalidad',
 rol:'Producción / Camerinos',
 telefono:'+34 699 112 233',
 email:'camerinos@venues.com',
 notas:'Catering, toallas, acreditaciones y acceso a furgoneta de carga.'
 }
 ],
 cierreMaterial: [
 { id:'cm-1', categoria:'escenario', item:'Instrumentos principales y estuches rígidos (guitarras, bajo, metales/teclado)', checked: false },
 { id:'cm-2', categoria:'escenario', item:'Pedaleras de efectos, alimentadores y fuentes de corriente', checked: false },
 { id:'cm-3', categoria:'escenario', item:'Cables jack / XLR propios, alargaderas y adaptadores', checked: false },
 { id:'cm-4', categoria:'escenario', item:'Petacas de in-ears, auriculares y transmisores inalámbricos', checked: false },
 { id:'cm-5', categoria:'escenario', item:'Pies de micro y soportes de instrumento de la banda', checked: false },
 { id:'cm-6', categoria:'escenario', item:'Micrófonos vocales y pinzas especiales', checked: false },
 { id:'cm-7', categoria:'camerino', item:'Ropa de directo, calzado y fundas de ropa', checked: false },
 { id:'cm-8', categoria:'camerino', item:'Mochilas personales, carteras, teléfonos y documentación', checked: false },
 { id:'cm-9', categoria:'camerino', item:'Cargadores de móvil, powerbanks y tablets de partituras', checked: false },
 { id:'cm-10', categoria:'camerino', item:'Caja de Merchandising, datáfono y dinero recaudado en efectivo', checked: false },
 { id:'cm-11', categoria:'furgoneta', item:'Todo el backline estibado y trincado con cinchas de amarre', checked: false },
 { id:'cm-12', categoria:'furgoneta', item:'Portón trasero y puertas laterales cerradas con candado/alarma', checked: false },
 { id:'cm-13', categoria:'furgoneta', item:'Inspección visual final de camerino y escenario (¡cero olvidos!)', checked: false }
 ],
 merchControl: {
 items: [
 { id:'mb-1', nombre:'Camiseta Gira Oficial', categoria:'camisetas', talla:'M', precioUnitario: 20, stockInicial: 15, stockFinal: 5 },
 { id:'mb-2', nombre:'Camiseta Gira Oficial', categoria:'camisetas', talla:'L', precioUnitario: 20, stockInicial: 20, stockFinal: 6 },
 { id:'mb-3', nombre:'Vinilo LP 12" Edición Limitada', categoria:'vinilos', talla:'LP', precioUnitario: 25, stockInicial: 15, stockFinal: 7 },
 { id:'mb-4', nombre:'Pack Púas de Colección + Pegatinas', categoria:'accesorios', talla:'Pack', precioUnitario: 5, stockInicial: 40, stockFinal: 12 },
 { id:'mb-5', nombre:'Totebag Algodón Serigrafiada', categoria:'accesorios', talla:'Única', precioUnitario: 12, stockInicial: 15, stockFinal: 5 }
 ],
 fondoCajaInicial: 50,
 ingresosEfectivo: 480,
 ingresosBizum: 460,
 notas:'Mesa de merchandising bien ubicada junto al acceso principal. Gran tirón de vinilos y camisetas tras el show.'
 }
 };
 };

 const [allRoadbooks, setAllRoadbooks] = useState<Record<string, RoadbookInfo>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_roadbooks');
 return saved ? JSON.parse(saved) : {'2026-07-18': {
 contactoPromotor:'Manuel (Producción Cabo de Plata)',
 telefonoPromotor:'+34 654 321 987',
 tecnicoSonido:'Carlos (FOH Bakandeya)',
 hotelNombre:'Hotel Playa de Barbate ****',
 hotelDireccion:'Avenida del Mar, 12, 11160 Barbate',
 cateringInfo:'Cena tras prueba de sonido (21:00). 2 menús vegetarianos.',
 inputList:'1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)'
 }
 };
 } catch {
 return {};
 }
 });

 const saveRoadbook = (dateKey: string, info: RoadbookInfo) => {
 const updated = { ...allRoadbooks, [dateKey]: info };
 setAllRoadbooks(updated);
 try {
 localStorage.setItem('bakandeya_roadbooks', JSON.stringify(updated));
 } catch {}
 };

 const getCurrentRoadbook = (dateKey: string, concert?: Concert | null): RoadbookInfo => {
 const existing = allRoadbooks[dateKey];
 const def = getDefaultRoadbook(concert);
 if (!existing) return def;
 return {
 ...def,
 ...existing,
 contactosClave: existing.contactosClave && existing.contactosClave.length > 0 ? existing.contactosClave : def.contactosClave,
 cierreMaterial: existing.cierreMaterial && existing.cierreMaterial.length > 0 ? existing.cierreMaterial : def.cierreMaterial,
 merchControl: existing.merchControl && existing.merchControl.items && existing.merchControl.items.length > 0 ? existing.merchControl : def.merchControl
 };
 };

 const updateRoadbookField = (dateKey: string, partial: Partial<RoadbookInfo>) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const updated: RoadbookInfo = { ...current, ...partial };
 saveRoadbook(dateKey, updated);
 if (selectedConcert && onUpdateConcert) {
 onUpdateConcert(selectedConcert.id, {
 logisticaTecnica: {
 horaLlegada: updated.horaLlegada,
 horaPruebaSonido: updated.horaPruebaSonido,
 horaAperturaPuertas: updated.horaAperturaPuertas,
 horaShow: updated.horaShow,
 horaCierreToque: updated.horaCierreToque,
 paEspecificaciones: updated.paEspecificaciones,
 monitoresTipo: updated.monitoresTipo,
 canalesMonitores: updated.canalesMonitores,
 backlineInfo: updated.backlineInfo,
 potenciaElectrica: updated.potenciaElectrica,
 inputList: updated.inputList,
 notasTecnicas: updated.notasTecnicas
 },
 contactosClave: updated.contactosClave,
 cierreMaterial: updated.cierreMaterial,
 merchControl: updated.merchControl
 });
 }
 };

 const handleToggleCierreItem = (itemId: string, dateKey: string) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const updatedList = (current.cierreMaterial || []).map(item =>
 item.id === itemId ? { ...item, checked: !item.checked } : item
 );
 updateRoadbookField(dateKey, { cierreMaterial: updatedList });
 };

 const handleToggleAllCierreItems = (dateKey: string, checkAll: boolean) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const updatedList = (current.cierreMaterial || []).map(item => ({ ...item, checked: checkAll }));
 updateRoadbookField(dateKey, { cierreMaterial: updatedList });
 };

 const handleAddCierreItem = (dateKey: string, e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newCierreItemText.trim()) return;
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const newItem: CierreMaterialItem = {
 id: `cm-${Date.now()}`,
 categoria: newCierreItemCat,
 item: newCierreItemText.trim(),
 checked: false
 };
 updateRoadbookField(dateKey, { cierreMaterial: [...(current.cierreMaterial || []), newItem] });
 setNewCierreItemText('');
 };

 const handleDeleteCierreItem = (itemId: string, dateKey: string) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const updatedList = (current.cierreMaterial || []).filter(item => item.id !== itemId);
 updateRoadbookField(dateKey, { cierreMaterial: updatedList });
 };

 const handleAddKeyContact = (dateKey: string, e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newContactNombre.trim() || !newContactTelefono.trim()) return;
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const newContact: KeyContactItem = {
 id: `ct-${Date.now()}`,
 nombre: newContactNombre.trim(),
 rol: newContactRol,
 telefono: newContactTelefono.trim(),
 email: newContactEmail.trim() || undefined,
 notas: newContactNotas.trim() || undefined
 };
 updateRoadbookField(dateKey, { contactosClave: [...(current.contactosClave || []), newContact] });
 setNewContactNombre('');
 setNewContactTelefono('');
 setNewContactEmail('');
 setNewContactNotas('');
 setShowAddContactForm(false);
 };

 const handleDeleteKeyContact = (contactId: string, dateKey: string) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const updatedList = (current.contactosClave || []).filter(c => c.id !== contactId);
 updateRoadbookField(dateKey, { contactosClave: updatedList });
 };

 const openWhatsAppContact = (contact: KeyContactItem, eventDateStr: string, venueName: string) => {
 const cleanPhone = contact.telefono.replace(/[^0-9]/g,'');
 const bandName = getBandIdentity(selectedConcert?.band_id).name ||'la banda';
 const msg = `¡Hola ${contact.nombre}! Te escribo de parte de ${bandName} con respecto al concierto en ${venueName} el día ${eventDateStr}. ¿Cómo estás? Quería consultar unos detalles de producción.`;
 const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
 window.open(url,'_blank','noopener,noreferrer');
 };

 const handleUpdateMerchItem = (dateKey: string, itemId: string, updates: Partial<MerchBoloItem>) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 const updatedItems = merch.items.map(item =>
 item.id === itemId ? { ...item, ...updates } : item
 );
 updateRoadbookField(dateKey, {
 merchControl: {
 ...merch,
 items: updatedItems
 }
 });
 };

 const handleAddMerchItem = (dateKey: string, e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newMerchNombre.trim()) return;
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 const precio = Math.max(0, parseFloat(newMerchPrecio) || 0);
 const stockIni = Math.max(0, parseInt(newMerchStockInicial, 10) || 0);
 const newItem: MerchBoloItem = {
 id: `mb-${Date.now()}`,
 nombre: newMerchNombre.trim(),
 categoria: newMerchCategoria,
 talla: newMerchTalla.trim() || undefined,
 precioUnitario: precio,
 stockInicial: stockIni,
 stockFinal: stockIni
 };
 updateRoadbookField(dateKey, {
 merchControl: {
 ...merch,
 items: [...merch.items, newItem]
 }
 });
 setNewMerchNombre('');
 setNewMerchTalla('');
 setShowAddMerchForm(false);
 };

 const handleDeleteMerchItem = (dateKey: string, itemId: string) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 const updatedItems = merch.items.filter(item => item.id !== itemId);
 updateRoadbookField(dateKey, {
 merchControl: {
 ...merch,
 items: updatedItems
 }
 });
 };

 const handleUpdateMerchTotals = (dateKey: string, updates: Partial<MerchControlBolo>) => {
 const current = getCurrentRoadbook(dateKey, selectedConcert);
 const merch = current.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 updateRoadbookField(dateKey, {
 merchControl: {
 ...merch,
 ...updates
 }
 });
 };

 const handleCopyMerchSummary = (roadbook: RoadbookInfo, dateKey: string, concert?: Concert | null) => {
 const merch = roadbook.merchControl || getDefaultRoadbook(concert).merchControl!;
 const sala = concert?.sala ||'Sala de Conciertos';
 const ciudad = concert?.ciudad ||'';
 
 let totalVendidas = 0;
 let totalVentaTeorica = 0;
 const desgloseItems: string[] = [];

 merch.items.forEach(item => {
 const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
 if (vendidas > 0) {
 const subtotal = vendidas * (item.precioUnitario || 0);
 totalVendidas += vendidas;
 totalVentaTeorica += subtotal;
 desgloseItems.push(`• ${item.nombre}${item.talla ? ` (${item.talla})` :''}: ${vendidas} uds × ${item.precioUnitario}€ = ${subtotal}€ (quedan: ${item.stockFinal})`);
 }
 });

 const totalCobrado = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
 const diferencia = totalCobrado - totalVentaTeorica;

 const texto = [
 `👕 *CONTROL DE MERCHANDISING - ${sala.toUpperCase()}*`,
 `📅 Fecha: ${dateKey}${ciudad ? ` | 📍 ${ciudad}` :''}`,
 `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
 `📦 *Artículos vendidos:* ${totalVendidas} unidades`,
 `💰 *Ventas Teóricas:* ${totalVentaTeorica.toFixed(2)} €`,
 ``,
 `💳 *DESGLOSE DE INGRESOS (ARQUEO):*`,
 `💵 Efectivo recaudado: ${(merch.ingresosEfectivo || 0).toFixed(2)} €`,
 `📱 Bizum / TPV: ${(merch.ingresosBizum || 0).toFixed(2)} €`,
 `🏷️ Total Cobrado Real: ${totalCobrado.toFixed(2)} €`,
 merch.fondoCajaInicial ? `🪙 Fondo de caja inicial: ${merch.fondoCajaInicial.toFixed(2)} €` : null,
 `⚖️ Cuadre de caja: ${diferencia === 0 ?'✓ ¡CAJA CUADRADA EXACTA!' : diferencia > 0 ? `+${diferencia.toFixed(2)} € (Superávit / Propinas)` : `${diferencia.toFixed(2)} € (Descuadre por verificar)`}`,
 ``,
 `📋 *DETALLE POR ARTÍCULO:*`,
 ...(desgloseItems.length > 0 ? desgloseItems : ['(Sin ventas registradas todavía)']),
 merch.notas ? `\n📝 *Notas:* ${merch.notas}` :''
 ].filter(Boolean).join('\n');

 navigator.clipboard.writeText(texto);
 setMerchCopiedToast(true);
 setTimeout(() => setMerchCopiedToast(false), 3000);
 };

 // Creation Modals state
 const [showCreateModal, setShowCreateModal] = useState<'rehearsal' |'concert' |'reunion' | null>(null);
 const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

 // Form fields for new Reunion
 const [reuHora, setReuHora] = useState('19:30 - 20:30');
 const [reuLugar, setReuLugar] = useState('Online (Google Meet)');
 const [reuAsunto, setReuAsunto] = useState('Coordinación de gira y tareas');
 const [reuEnlace, setReuEnlace] = useState('');
 const [reuNotas, setReuNotas] = useState('1. Repasar próximas fechas y logística.\n2. Presupuestos y gastos.\n3. Nuevos temas del repertorio.');
 const [reuEstado, setReuEstado] = useState<'programado' |'completado' |'cancelado'>('programado');

 // Reset convocatoria state when opening modal
 useEffect(() => {
 if (showCreateModal) {
 setSelectedBandIdForNewEvent(activeBandId);
 setConvocatoriaTipo('completa');
 }
 }, [showCreateModal, activeBandId]);

 useEffect(() => {
 if (showCreateModal) {
 setConvocadosIds(effectiveBandMembers.map(m => m.id));
 }
 }, [showCreateModal, effectiveBandMembers]);

 // Form fields for new Rehearsal
 const [rehTime, setRehTime] = useState('18:00 - 21:00');
 const [rehLugar, setRehLugar] = useState('Locales de Ensayo');
 const [rehNotas, setRehNotas] = useState('Ensayo general de repertorio directo');
 const [rehEstado, setRehEstado] = useState<'programado' |'completado' |'cancelado'>('programado');
 const [rehSetlistId, setRehSetlistId] = useState<string>('');

 // Form fields for new Concert
 const [concCiudad, setConcCiudad] = useState('Madrid');
 const [concSala, setConcSala] = useState('');
 const [concDireccion, setConcDireccion] = useState('');
 const [concCache, setConcCache] = useState('1200');
 const [concAforo, setConcAforo] = useState('300');
 const [concContrato, setConcContrato] = useState(true);
 const [concEstadoPago, setConcEstadoPago] = useState<'pendiente' |'pagado' |'anticipo'>('pendiente');
 const [concTipo, setConcTipo] = useState<'propio' |'festival' |'privado'>('propio');
 const [concNotas, setConcNotas] = useState('Concierto agendado desde el calendario');
 const [concIdioma, setConcIdioma] = useState('');
 const [concSetlistId, setConcSetlistId] = useState<string>('');
 const [concIsPosible, setConcIsPosible] = useState(false);

 // Setlists disponibles para ensayos y conciertos
 const [availableSetlists, setAvailableSetlists] = useState<any[]>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_setlists_data');
 return saved ? JSON.parse(saved) : [];
 } catch {
 return [];
 }
 });

 // Canciones para la vista de escenario / teleprompter
 const [availableSongs, setAvailableSongs] = useState<any[]>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_songs_data');
 return saved ? JSON.parse(saved) : [];
 } catch {
 return [];
 }
 });

 // Estado para la vista de directo / modo escenario desde el calendario
 const [activeStageSetlist, setActiveStageSetlist] = useState<any | null>(null);
 const [activeStageInitialMode, setActiveStageInitialMode] = useState<'directo' |'ensayo'>('directo');

 // Estado y lógica para la vista a Pantalla Completa del Calendario
 const [isCalendarFullscreen, setIsCalendarFullscreen] = useState(false);
 const calendarContainerRef = useRef<HTMLDivElement>(null);

 const toggleCalendarFullscreen = React.useCallback(() => {
 if (!isCalendarFullscreen) {
 if (calendarContainerRef.current && calendarContainerRef.current.requestFullscreen) {
 calendarContainerRef.current.requestFullscreen().catch(() => {});
 }
 setIsCalendarFullscreen(true);
 } else {
 if (document.fullscreenElement) {
 document.exitFullscreen().catch(() => {});
 }
 setIsCalendarFullscreen(false);
 }
 }, [isCalendarFullscreen]);

 useEffect(() => {
 const handleFullscreenChange = () => {
 setIsCalendarFullscreen(!!document.fullscreenElement);
 };
 document.addEventListener('fullscreenchange', handleFullscreenChange);
 return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
 }, []);

 // Ficha Modal Emergente y Navegación Cronológica: lista unificada de conciertos + ensayos
 // de la banda activa, ordenada por fecha, para poder pasar de uno a otro con < / > sin
 // tener que volver al calendario y buscar el siguiente a mano.
 const [showEventFichaModal, setShowEventFichaModal] = useState(false);
 const [modalWeatherAlerts, setModalWeatherAlerts] = useState<WeatherAlert[]>([]);

 // Usa filteredConcerts/filteredRehearsals (no activeBandConcerts/activeBandRehearsals): esas
 // dos ya respetan el toggle"Todos / banda activa" y la convocatoria con el que se pintan el
 // resto de vistas del calendario (mes, semana, agenda). Si la navegación de la Ficha Modal
 // usara solo la banda activa, un clic en un evento de"Todos" caía fuera de la lista y el
 // contador se quedaba clavado en"1 de 1" aunque hubiera 8 eventos visibles en pantalla.
 const allChronologicalEvents = React.useMemo(() => {
 type ChronoEvent = { id: string; fecha: string; kind:'concert' |'rehearsal'; data: Concert | Rehearsal };
 const combined: ChronoEvent[] = [
 ...filteredConcerts.map(c => ({ id: c.id, fecha: c.fecha, kind:'concert' as const, data: c })),
 ...filteredRehearsals.map(r => ({ id: r.id, fecha: r.fecha, kind:'rehearsal' as const, data: r })),
 ];
 combined.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
 return combined;
 }, [filteredConcerts, filteredRehearsals]);

 const handleSelectEvent = React.useCallback((evt: { id: string; fecha: string }) => {
 const dateStr = evt.fecha.split('T')[0];
 const parts = dateStr.split('-');
 if (parts.length === 3) {
 const y = parseInt(parts[0], 10);
 const m = parseInt(parts[1], 10) - 1;
 const d = parseInt(parts[2], 10);
 if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
 setSelectedDate(new Date(y, m, d));
 }
 }
 setSelectedEventId(evt.id);
 setShowEventFichaModal(true);
 }, []);

 const activeChronoIndex = React.useMemo(
 () => (selectedEventId ? allChronologicalEvents.findIndex(e => e.id === selectedEventId) : -1),
 [allChronologicalEvents, selectedEventId]
 );

 const goToAdjacentEvent = React.useCallback((direction: 1 | -1) => {
 if (allChronologicalEvents.length === 0) return;
 const currentIndex = activeChronoIndex >= 0 ? activeChronoIndex : 0;
 const nextIndex = currentIndex + direction;
 if (nextIndex < 0 || nextIndex >= allChronologicalEvents.length) return;
 handleSelectEvent(allChronologicalEvents[nextIndex].data);
 }, [allChronologicalEvents, activeChronoIndex, handleSelectEvent]);

 // Gestos táctiles de la Ficha Modal para pasar de evento deslizando a izquierda/derecha en móvil
 const modalTouchStartX = useRef<number | null>(null);
 const modalTouchStartY = useRef<number | null>(null);
 const modalTouchDeltaX = useRef<number>(0);

 const handleModalTouchStart = React.useCallback((e: React.TouchEvent) => {
 if (e.touches.length !== 1) return;
 modalTouchStartX.current = e.touches[0].clientX;
 modalTouchStartY.current = e.touches[0].clientY;
 modalTouchDeltaX.current = 0;
 }, []);

 const handleModalTouchMove = React.useCallback((e: React.TouchEvent) => {
 if (modalTouchStartX.current === null || modalTouchStartY.current === null) return;
 const diffX = e.touches[0].clientX - modalTouchStartX.current;
 const diffY = e.touches[0].clientY - modalTouchStartY.current;
 if (Math.abs(diffX) > Math.abs(diffY)) {
 modalTouchDeltaX.current = diffX;
 }
 }, []);

 const handleModalTouchEnd = React.useCallback(() => {
 if (modalTouchStartX.current === null) return;
 const dx = modalTouchDeltaX.current;
 const threshold = 40; // 40px para activar cambio de evento
 if (dx < -threshold) {
 goToAdjacentEvent(1);
 } else if (dx > threshold) {
 goToAdjacentEvent(-1);
 }
 modalTouchStartX.current = null;
 modalTouchStartY.current = null;
 modalTouchDeltaX.current = 0;
 }, [goToAdjacentEvent]);

 // Atajos de teclado de la Ficha Modal: Esc ya lo gestiona ModalPortal internamente.
 useEffect(() => {
 if (!showEventFichaModal) return;
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key ==='ArrowLeft') goToAdjacentEvent(-1);
 else if (e.key ==='ArrowRight') goToAdjacentEvent(1);
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [showEventFichaModal, goToAdjacentEvent]);

 useEffect(() => {
 let isMounted = true;
 fetch('/api/setlists')
 .then(res => res.json())
 .then(data => {
 if (!isMounted) return;
 const list = Array.isArray(data) ? data : (data?.setlists || []);
 if (list && list.length > 0) {
 setAvailableSetlists(list);
 try {
 localStorage.setItem('bakandeya_setlists_data', JSON.stringify(list));
 } catch (e) {}
 }
 })
 .catch(() => {});

 api.getSongs()
 .then(res => {
 if (!isMounted) return;
 const songsList = Array.isArray(res) ? res : (res?.songs || []);
 if (songsList && songsList.length > 0) {
 setAvailableSongs(songsList);
 try {
 localStorage.setItem('bakandeya_songs_data', JSON.stringify(songsList));
 } catch (e) {}
 }
 })
 .catch(() => {});

 return () => { isMounted = false; };
 }, [activeBandId]);

 // Ficha del concierto: ver / editar un concierto ya creado
 const [viewingConcert, setViewingConcert] = useState<Concert | null>(null);
 const [editDraft, setEditDraft] = useState<Concert | null>(null);

 useEffect(() => {
 setEditDraft(viewingConcert ? { ...viewingConcert } : null);
 }, [viewingConcert]);

 const handleSaveConcertEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!viewingConcert || !editDraft) return;
 onUpdateConcert(viewingConcert.id, {
 ciudad: editDraft.ciudad.trim() ||'Madrid',
 sala: editDraft.sala.trim() ||'Sala Directo',
 fecha: editDraft.fecha,
 direccion: editDraft.direccion?.trim() || undefined,
 cache: Number(editDraft.cache) || 0,
 aforo_vendido: Number(editDraft.aforo_vendido) || 0,
 aforo_total: Number(editDraft.aforo_total) || 0,
 contrato_firmado: editDraft.contrato_firmado,
 estado_pago: editDraft.estado_pago,
 tipo: editDraft.tipo,
 is_posible: editDraft.is_posible,
 notas: editDraft.notas?.trim() ||'',
 idioma: editDraft.idioma || undefined,
 setlistId: editDraft.setlistId || undefined,
 entradasUrl: editDraft.entradasUrl?.trim() || undefined,
 entradasLugarFisico: editDraft.entradasLugarFisico?.trim() || undefined
 });
 setViewingConcert(null);
 setSyncSuccessMessage(`¡Concierto de ${editDraft.sala} (${editDraft.ciudad}) actualizado!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 };

 // Ficha del ensayo: ver / editar un ensayo ya creado
 const [viewingRehearsal, setViewingRehearsal] = useState<Rehearsal | null>(null);
 const [editRehearsalDraft, setEditRehearsalDraft] = useState<Rehearsal | null>(null);

 useEffect(() => {
 setEditRehearsalDraft(viewingRehearsal ? { ...viewingRehearsal } : null);
 }, [viewingRehearsal]);

 const handleSaveRehearsalEdit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!viewingRehearsal || !editRehearsalDraft) return;
 const isReu = editRehearsalDraft.tipo_evento ==='reunion';
 onUpdateRehearsal(viewingRehearsal.id, {
 fecha: editRehearsalDraft.fecha,
 hora: editRehearsalDraft.hora?.trim() ||'',
 lugar: editRehearsalDraft.lugar?.trim() || (isReu ?'Online' :'Local de Ensayo'),
 tipo_evento: editRehearsalDraft.tipo_evento ||'ensayo',
 asunto: editRehearsalDraft.asunto?.trim() || undefined,
 enlace_reunion: editRehearsalDraft.enlace_reunion?.trim() || undefined,
 estado: editRehearsalDraft.estado ||'programado',
 notas: editRehearsalDraft.notas?.trim() ||'',
 convocatoria_tipo: editRehearsalDraft.convocatoria_tipo,
 convocados_ids: editRehearsalDraft.convocados_ids,
 setlistId: editRehearsalDraft.setlistId || undefined
 });
 setViewingRehearsal(null);
 setSyncSuccessMessage(`¡${isReu ?'Reunión' :'Ensayo'} ${isReu ? (editRehearsalDraft.asunto ||'actualizada') : `en ${editRehearsalDraft.lugar}`} actualizada!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 };

 const currentYear = viewDate.getFullYear();
 const currentMonth = viewDate.getMonth(); // 0 to 11

 // Second month calculations for dual month view
 const nextMonth = (currentMonth + 1) % 12;
 const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

 const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
 ];

 const fullWeekdays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

 const getWeekDays = (baseDate: Date) => {
 const curr = new Date(baseDate);
 const dayIndex = (curr.getDay() + 6) % 7;
 const monday = new Date(curr);
 monday.setDate(curr.getDate() - dayIndex);
 const days: Date[] = [];
 for (let i = 0; i < 7; i++) {
 const nextDay = new Date(monday);
 nextDay.setDate(monday.getDate() + i);
 days.push(nextDay);
 }
 return days;
 };

 const todayStr = React.useMemo(() => {
 const now = new Date();
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 }, []);

 // Helper to find campaigns that target a specific date
 const getCampaignsForDate = React.useCallback((dateStr: string): BookingCampaign[] => {
 if (!campaigns || campaigns.length === 0) return [];
 return campaigns.filter(c => Array.isArray(c.targetDates) && c.targetDates.includes(dateStr));
 }, [campaigns]);

 // Upcoming events filter state:'todos' |'conciertos' |'ensayos' |'campañas'
 const [upcomingFilter, setUpcomingFilter] = useState<'todos' |'conciertos' |'ensayos' |'campañas'>('todos');

 // Upcoming events starting from today (filters out past dates)
 const upcomingCalendarEvents = React.useMemo(() => {
 const list: Array<{
 id: string;
 type:'concierto' |'ensayo' |'campaña';
 title: string;
 fecha: string;
 day: string;
 month: string;
 salaOrLugar: string;
 ciudad?: string;
 direccion?: string;
 locationQuery: string;
 bandName: string;
 badge: string;
 campaign?: BookingCampaign;
 }> = [];

 // Filter concerts that are today or in the future
 filteredConcerts.forEach(c => {
 if (!c.fecha || c.fecha < todayStr) return;
 const parts = c.fecha.split('-');
 if (parts.length !== 3) return;
 const day = parts[2];
 const monthIdx = parseInt(parts[1], 10) - 1;
 const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() :'ENE';

 list.push({
 id: c.id,
 type:'concierto',
 title: `${c.sala}${c.ciudad ? ` (${c.ciudad})` :''}`,
 fecha: c.fecha,
 day,
 month,
 salaOrLugar: c.sala,
 ciudad: c.ciudad,
 direccion: c.direccion,
 locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
 bandName: getEventBandName(c),
 badge: c.contrato_firmado ?'Contrato Firmado' :'Confirmado'
 });
 });

 // Filter rehearsals that are today or in the future
 filteredRehearsals.forEach(r => {
 if (!r.fecha || r.fecha < todayStr) return;
 const parts = r.fecha.split('-');
 if (parts.length !== 3) return;
 const day = parts[2];
 const monthIdx = parseInt(parts[1], 10) - 1;
 const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() :'ENE';
 const isReu = r.tipo_evento ==='reunion';

 list.push({
 id: r.id,
 type: (isReu ?'reunion' :'ensayo') as any,
 title: isReu ? (r.asunto ||'Reunión de Banda') : (r.lugar ? `Ensayo en ${r.lugar}` :'Ensayo General'),
 fecha: r.fecha,
 day,
 month,
 salaOrLugar: isReu ? (r.lugar ||'Online') : (r.lugar ||'Local de Ensayo'),
 ciudad: undefined,
 direccion: undefined,
 locationQuery: isReu ? (r.lugar && !r.lugar.toLowerCase().includes('online') && !r.lugar.toLowerCase().includes('http') ? r.lugar : undefined) : `${r.lugar ||'Local de Ensayo'}, Madrid`,
 bandName: getEventBandName(r),
 badge: isReu ? (r.estado ==='completado' ?'Realizada' :'Convocada') : (r.estado ==='completado' ?'Completado' :'Programado')
 });
 });

 // Add campaign target dates (only if no confirmed concert on that same date)
 (campaigns || []).forEach(camp => {
 (camp.targetDates || []).forEach(tDate => {
 if (tDate < todayStr) return;
 const alreadyHasConcert = filteredConcerts.some(c => c.fecha === tDate);
 if (alreadyHasConcert) return;

 const parts = tDate.split('-');
 if (parts.length !== 3) return;
 const day = parts[2];
 const monthIdx = parseInt(parts[1], 10) - 1;
 const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() :'ENE';

 list.push({
 id: `camp-date-${camp.id}-${tDate}`,
 type:'campaña',
 title: `🎯 Posible Concierto: ${camp.name}`,
 fecha: tDate,
 day,
 month,
 salaOrLugar: `Salas en ${camp.targetCities?.join(',') ||'Ciudad objetivo'}`,
 ciudad: camp.targetCities?.[0] ||'Madrid',
 direccion: undefined,
 locationQuery: `Salas ${camp.targetCities?.join('')}, España`,
 bandName: activeBandName ||'Bakandeya',
 badge: camp.isActive ?'Campaña Activa' :'Objetivo Campaña',
 campaign: camp
 });
 });
 });

 list.sort((a, b) => a.fecha.localeCompare(b.fecha));
 return list;
 }, [filteredConcerts, filteredRehearsals, campaigns, todayStr, activeBandName, monthNames]);

 // Estado para dirección de deslizamiento y desplazamiento visual
 const [slideDirection, setSlideDirection] = useState<'left' |'right' | null>(null);
 const [dragOffset, setDragOffset] = useState<number>(0);

 const touchStartX = useRef<number | null>(null);
 const touchStartY = useRef<number | null>(null);
 const touchDeltaX = useRef<number>(0);
 const isSwipingTouch = useRef<boolean>(false);
 const hasSwipedTouch = useRef<boolean>(false);

 const mouseStartX = useRef<number | null>(null);
 const mouseStartY = useRef<number | null>(null);
 const mouseDeltaX = useRef<number>(0);
 const isMouseDown = useRef<boolean>(false);
 const hasMouseDragged = useRef<boolean>(false);

 const lastWheelTime = useRef<number>(0);

 const handlePrevMonth = () => {
 setSlideDirection('right');
 if (calendarViewMode ==='week') {
 setSelectedDate(prev => {
 const nextD = new Date(prev);
 nextD.setDate(nextD.getDate() - 7);
 return nextD;
 });
 setViewDate(prev => {
 const nextD = new Date(selectedDate);
 nextD.setDate(nextD.getDate() - 7);
 return new Date(nextD.getFullYear(), nextD.getMonth(), 1);
 });
 } else {
 setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
 }
 };

 const handleNextMonth = () => {
 setSlideDirection('left');
 if (calendarViewMode ==='week') {
 setSelectedDate(prev => {
 const nextD = new Date(prev);
 nextD.setDate(nextD.getDate() + 7);
 return nextD;
 });
 setViewDate(prev => {
 const nextD = new Date(selectedDate);
 nextD.setDate(nextD.getDate() + 7);
 return new Date(nextD.getFullYear(), nextD.getMonth(), 1);
 });
 } else {
 setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
 }
 };

 const handleGoToday = () => {
 const now = new Date();
 const currentMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
 const targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
 if (targetDate.getTime() > currentMonthDate.getTime()) {
 setSlideDirection('left');
 } else if (targetDate.getTime() < currentMonthDate.getTime()) {
 setSlideDirection('right');
 }
 setViewDate(targetDate);
 setSelectedDate(now);
 };

 // Gestos de deslizamiento táctil (móvil y tablet)
 const handleTouchStart = (e: React.TouchEvent) => {
 if (e.touches.length !== 1) return;
 touchStartX.current = e.touches[0].clientX;
 touchStartY.current = e.touches[0].clientY;
 touchDeltaX.current = 0;
 isSwipingTouch.current = true;
 hasSwipedTouch.current = false;
 };

 const handleTouchMove = (e: React.TouchEvent) => {
 if (!isSwipingTouch.current || touchStartX.current === null || touchStartY.current === null) return;
 const diffX = e.touches[0].clientX - touchStartX.current;
 const diffY = e.touches[0].clientY - touchStartY.current;

 // Priorizar intención horizontal sobre scroll vertical
 if (Math.abs(diffX) > Math.abs(diffY)) {
 if (Math.abs(diffX) > 15) {
 hasSwipedTouch.current = true;
 }
 touchDeltaX.current = diffX;
 // Resistencia elástica para feedback táctil en tiempo real
 const dampened = Math.sign(diffX) * Math.min(50, Math.pow(Math.abs(diffX), 0.85));
 setDragOffset(dampened);
 }
 };

 const handleTouchEnd = () => {
 if (!isSwipingTouch.current) return;
 const dx = touchDeltaX.current;
 const threshold = 40; // 40px para activar cambio de mes

 if (dx < -threshold) {
 handleNextMonth();
 } else if (dx > threshold) {
 handlePrevMonth();
 }

 isSwipingTouch.current = false;
 touchStartX.current = null;
 touchStartY.current = null;
 touchDeltaX.current = 0;
 setDragOffset(0);
 setTimeout(() => {
 hasSwipedTouch.current = false;
 }, 120);
 };

 const handleTouchCancel = () => {
 isSwipingTouch.current = false;
 touchStartX.current = null;
 touchStartY.current = null;
 touchDeltaX.current = 0;
 setDragOffset(0);
 hasSwipedTouch.current = false;
 };

 // Gestos de arrastre con ratón (escritorio)
 const handleMouseDown = (e: React.MouseEvent) => {
 if (e.button !== 0) return;
 mouseStartX.current = e.clientX;
 mouseStartY.current = e.clientY;
 mouseDeltaX.current = 0;
 isMouseDown.current = true;
 hasMouseDragged.current = false;
 };

 const handleMouseMove = (e: React.MouseEvent) => {
 if (!isMouseDown.current || mouseStartX.current === null || mouseStartY.current === null) return;
 const diffX = e.clientX - mouseStartX.current;
 const diffY = e.clientY - mouseStartY.current;

 if (Math.abs(diffX) > 15) {
 hasMouseDragged.current = true;
 }

 if (Math.abs(diffX) > Math.abs(diffY)) {
 mouseDeltaX.current = diffX;
 const dampened = Math.sign(diffX) * Math.min(50, Math.pow(Math.abs(diffX), 0.85));
 setDragOffset(dampened);
 }
 };

 const handleMouseUp = () => {
 if (!isMouseDown.current) return;
 const dx = mouseDeltaX.current;
 const threshold = 50;

 if (hasMouseDragged.current) {
 if (dx < -threshold) {
 handleNextMonth();
 } else if (dx > threshold) {
 handlePrevMonth();
 }
 }

 isMouseDown.current = false;
 mouseStartX.current = null;
 mouseStartY.current = null;
 mouseDeltaX.current = 0;
 setDragOffset(0);
 setTimeout(() => {
 hasMouseDragged.current = false;
 }, 120);
 };

 const handleMouseLeave = () => {
 if (isMouseDown.current) {
 handleMouseUp();
 }
 };

 // Desplazamiento horizontal para trackpads / mousewheel horizontal
 const handleWheel = (e: React.WheelEvent) => {
 if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 30) {
 const now = Date.now();
 if (now - lastWheelTime.current > 450) {
 lastWheelTime.current = now;
 if (e.deltaX > 0) {
 handleNextMonth();
 } else {
 handlePrevMonth();
 }
 }
 }
 };
 
 // Sync state
 const [isSyncingConcerts, setIsSyncingConcerts] = useState(false);
 const [syncSuccessMessage, setSyncSuccessMessage] = useState('');
 const [syncErrorMessage, setSyncErrorMessage] = useState('');

 const handleSaveNewRehearsal = (e: React.FormEvent) => {
 e.preventDefault();
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
 const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
 const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
 const newRehearsal: Rehearsal = {
 id: `reh-${Date.now()}`,
 fecha: formattedDate,
 hora: rehTime.trim() ||'18:00 - 21:00',
 lugar: rehLugar.trim() ||'Locales de Ensayo',
 asistentes: convocatoriaTipo ==='completa' ? ['Banda Completa'] : selectedMembers.map(m => m.name),
 notas: rehNotas.trim() ||'Ensayo general',
 estado: rehEstado,
 band_id: targetBand.band_id,
 bandName: targetBand.bandName,
 convocatoria_tipo: convocatoriaTipo,
 convocados_ids: convocatoriaTipo ==='parcial' ? convocadosIds : undefined,
 convocados_nombres: convocatoriaTipo ==='parcial' ? selectedMembers.map(m => m.name) : undefined,
 setlistId: rehSetlistId || undefined
 };

 if (onAddRehearsal) {
 onAddRehearsal(newRehearsal);
 setSyncSuccessMessage(`¡Ensayo de ${targetBand.bandName} creado para el ${formattedDate}!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 }
 setShowCreateModal(null);
 };

 const handleSaveNewReunion = (e: React.FormEvent) => {
 e.preventDefault();
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
 const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
 const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
 const newReunion: Rehearsal = {
 id: `reu-${Date.now()}`,
 fecha: formattedDate,
 hora: reuHora.trim() ||'19:30 - 20:30',
 lugar: reuLugar.trim() ||'Online (Google Meet)',
 tipo_evento:'reunion',
 asunto: reuAsunto.trim() ||'Reunión de Banda',
 enlace_reunion: reuEnlace.trim() || undefined,
 asistentes: convocatoriaTipo ==='completa' ? ['Banda Completa'] : selectedMembers.map(m => m.name),
 notas: reuNotas.trim() ||'Orden del día',
 estado: reuEstado,
 band_id: targetBand.band_id,
 bandName: targetBand.bandName,
 convocatoria_tipo: convocatoriaTipo,
 convocados_ids: convocatoriaTipo ==='parcial' ? convocadosIds : undefined,
 convocados_nombres: convocatoriaTipo ==='parcial' ? selectedMembers.map(m => m.name) : undefined,
 };

 if (onAddRehearsal) {
 onAddRehearsal(newReunion);
 setSyncSuccessMessage(`¡Reunión de ${targetBand.bandName} convocada para el ${formattedDate}!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 }
 setShowCreateModal(null);
 };

 const handleSaveNewConcert = (e: React.FormEvent) => {
 e.preventDefault();
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
 const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
 const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
 const newConcert: Concert = {
 id: `conc-${Date.now()}`,
 fecha: formattedDate,
 ciudad: concCiudad.trim() ||'Madrid',
 sala: concSala.trim() ||'Sala Directo',
 cache: Number(concCache) || 0,
 aforo_vendido: 0,
 aforo_total: Number(concAforo) || 200,
 contrato_firmado: concContrato,
 estado_pago: concEstadoPago,
 notas: concNotas.trim(),
 tipo: concTipo,
 is_posible: concIsPosible,
 band_id: targetBand.band_id,
 bandName: targetBand.bandName,
 convocatoria_tipo: convocatoriaTipo,
 convocados_ids: convocatoriaTipo ==='parcial' ? convocadosIds : undefined,
 convocados_nombres: convocatoriaTipo ==='parcial' ? selectedMembers.map(m => m.name) : undefined,
 idioma: concIdioma || undefined,
 setlistId: concSetlistId || undefined
 };

 if (onAddConcert) {
 onAddConcert(newConcert);
 setSyncSuccessMessage(`¡Concierto de ${targetBand.bandName} en ${newConcert.sala} (${newConcert.ciudad}) creado para el ${formattedDate}!`);
 setTimeout(() => setSyncSuccessMessage(''), 5000);
 }
 setShowCreateModal(null);
 };

 const handleSyncConcerts = async () => {
 setIsSyncingConcerts(true);
 setSyncSuccessMessage('');
 setSyncErrorMessage('');
 try {
 const res = await fetch('/api/concerts/sync', {
 method:'POST',
 headers: {'Content-Type':'application/json' }
 });
 const data = await res.json().catch(() => ({}));
 if (res.ok && data.success) {
 setSyncSuccessMessage(data.message ||'Conciertos sincronizados con éxito.');
 // clear after 6 seconds
 setTimeout(() => setSyncSuccessMessage(''), 6000);
 } else {
 setSyncErrorMessage(data.error ||'Error al intentar sincronizar los conciertos.');
 }
 } catch (error) {
 console.error('Error synchronizing concerts:', error);
 setSyncErrorMessage('Error de conexión con el servidor.');
 } finally {
 setIsSyncingConcerts(false);
 }
 };

 // Dynamic state for per-date schedules and gear checklists with localStorage persistence
 const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;

 // Al cambiar de día, olvidar qué evento estaba elegido: si no, un día con un solo evento podía
 // heredar el id de otro día y no encontrar coincidencia (se ve el primero, que es el
 // Al cambiar la fecha seleccionada en la cuadrícula, reseteamos el id de evento activo solo si la Ficha Modal
 // no está abierta y si el evento anterior no pertenecía al nuevo día seleccionado.
 useEffect(() => {
 if (showEventFichaModal) return;
 setSelectedEventId(prev => {
 if (!prev) return null;
 if (initialSelectedEventId && prev === initialSelectedEventId) return prev;
 const belongsToNewDate = filteredConcerts.some(c => c.id === prev && c.fecha === selectedDateKey) ||
 filteredRehearsals.some(r => r.id === prev && r.fecha === selectedDateKey);
 return belongsToNewDate ? prev : null;
 });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [selectedDateKey, showEventFichaModal]);

 const defaultInitialRunOfShow: Record<string, RunOfShowItem[]> = {'2026-07-23': [
 { id:'ros-1', time:'17:00', activity:'Llegada a la sala y descarga de bártulos', done: true },
 { id:'ros-2', time:'17:30', activity:'Montaje de escenario e in-ears', done: true },
 { id:'ros-3', time:'18:15', activity:'Prueba de sonido (Soundcheck de metales y bases)', done: true },
 { id:'ros-4', time:'19:30', activity:'Cena de la banda / Catering', done: false },
 { id:'ros-5', time:'21:00', activity:'Apertura de puertas', done: false },
 { id:'ros-6', time:'21:30', activity:'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎺💥', done: false },
 { id:'ros-7', time:'23:30', activity:'Merchandising, firmas y recogida de equipo', done: false },
 ],'2026-07-15': [
 { id:'ros-10', time:'17:00', activity:'Camerinos Rock Palace - Montaje y chequeo', done: true },
 { id:'ros-11', time:'18:00', activity:'Prueba de loops con Jon y violín', done: true },
 { id:'ros-12', time:'20:30', activity:'Cierre del ensayo y notas generales', done: false },
 ]
 };

 const defaultInitialGear: Record<string, GearItem[]> = {'2026-07-23': [
 { id:'gear-1', label:'Teclado Korg SV-2 + Stand', checked: true },
 { id:'gear-2', label:'Sección Metales (Sordinas y atril)', checked: true },
 { id:'gear-3', label:'Banderola de Escenario Bakandeya', checked: false },
 { id:'gear-4', label:'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
 { id:'gear-5', label:'Cables Jack / XLR de recambio', checked: true },
 { id:'gear-6', label:'DI-Box estéreo para teclados', checked: false },
 ]
 };

 const [allRunOfShow, setAllRunOfShow] = useState<Record<string, RunOfShowItem[]>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_run_of_show');
 return saved ? JSON.parse(saved) : defaultInitialRunOfShow;
 } catch {
 return defaultInitialRunOfShow;
 }
 });

 const [allGear, setAllGear] = useState<Record<string, GearItem[]>>(() => {
 try {
 const saved = localStorage.getItem('bakandeya_gear_checklists');
 return saved ? JSON.parse(saved) : defaultInitialGear;
 } catch {
 return defaultInitialGear;
 }
 });

 // Fetch server logistics state on mount
 useEffect(() => {
 if (!currentBandId) return;
 const token = localStorage.getItem('auth_token') ||'';
 const headers: Record<string, string> = {};
 if (token) headers['Authorization'] = `Bearer ${token}`;

 fetch(`/api/logistics?band_id=${encodeURIComponent(currentBandId)}`, { headers })
 .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json().catch(() => null) : null)
 .then(data => {
 if (data) {
 if (data.runOfShow && Object.keys(data.runOfShow).length > 0) {
 setAllRunOfShow(prev => ({ ...prev, ...data.runOfShow }));
 }
 if (data.gearChecklists && Object.keys(data.gearChecklists).length > 0) {
 setAllGear(prev => ({ ...prev, ...data.gearChecklists }));
 }
 }
 })
 .catch(err => console.warn("Notice: using local logistics state:", err));
 }, [currentBandId]);

 // Sync helpers to post server state
 const saveRunOfShowToServer = (dateKey: string, items: RunOfShowItem[]) => {
 fetch('/api/logistics/runofshow', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ dateKey, items })
 }).catch(err => console.error("Error saving run of show:", err));
 };

 const saveGearToServer = (dateKey: string, items: GearItem[]) => {
 fetch('/api/logistics/gear', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ dateKey, items })
 }).catch(err => console.error("Error saving gear checklist:", err));
 };

 // Inputs for adding new items
 const [newRunTime, setNewRunTime] = useState('');
 const [newRunActivity, setNewRunActivity] = useState('');
 const [newGearLabel, setNewGearLabel] = useState('');

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_run_of_show', JSON.stringify(allRunOfShow));
 } catch (e) {
 console.error(e);
 }
 }, [allRunOfShow]);

 useEffect(() => {
 try {
 localStorage.setItem('bakandeya_gear_checklists', JSON.stringify(allGear));
 } catch (e) {
 console.error(e);
 }
 }, [allGear]);

 // Current items for the selected day
 const currentRunOfShow = allRunOfShow[selectedDateKey] || [
 { id:'ros-def-1', time:'17:00', activity:'Llegada y descarga', done: false },
 { id:'ros-def-2', time:'18:00', activity:'Prueba de sonido', done: false },
 { id:'ros-def-3', time:'21:00', activity:'Comienzo de actuación / actividad', done: false }
 ];

 const currentGear = allGear[selectedDateKey] || [
 { id:'gear-def-1', label:'Instrumentos principales y fundas', checked: false },
 { id:'gear-def-2', label:'In-Ears y receptores', checked: false },
 { id:'gear-def-3', label:'Cables de audio y alimentación', checked: false }
 ];

 const handleToggleRunOfShow = (id: string) => {
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = dayList.map(item => item.id === id ? { ...item, done: !item.done } : item);
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleAddRunOfShow = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newRunActivity.trim()) return;
 const timeVal = newRunTime.trim() ||'12:00';
 const newItem: RunOfShowItem = {
 id: `ros-${Date.now()}`,
 time: timeVal,
 activity: newRunActivity.trim(),
 done: false
 };
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = [...dayList, newItem];
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 setNewRunTime('');
 setNewRunActivity('');
 };

 const handleDeleteRunOfShow = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setAllRunOfShow(prev => {
 const dayList = prev[selectedDateKey] || currentRunOfShow;
 const updatedList = dayList.filter(item => item.id !== id);
 saveRunOfShowToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleToggleGear = (id: string) => {
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = dayList.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 const handleAddGear = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newGearLabel.trim()) return;
 const newItem: GearItem = {
 id: `gear-${Date.now()}`,
 label: newGearLabel.trim(),
 checked: false
 };
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = [...dayList, newItem];
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 setNewGearLabel('');
 };

 const handleDeleteGear = (id: string, e: React.MouseEvent) => {
 e.stopPropagation();
 setAllGear(prev => {
 const dayList = prev[selectedDateKey] || currentGear;
 const updatedList = dayList.filter(item => item.id !== id);
 saveGearToServer(selectedDateKey, updatedList);
 return {
 ...prev,
 [selectedDateKey]: updatedList
 };
 });
 };

 // Month generator with navigation
 const weekdays = ['L','M','X','J','V','S','D'];

 // Helper function to get events for any date string"YYYY-MM-DD"
 const getEventsForDateStr = (formattedDate: string) => {
 const dayConcerts = filteredConcerts.filter(c => c.fecha === formattedDate);
 const dayRehearsals = filteredRehearsals.filter(r => r.fecha === formattedDate);
 return { concerts: dayConcerts, rehearsals: dayRehearsals };
 };

 // Get current event for the selected day
 const selectedEvents = getEventsForDateStr(selectedDateKey);

 // Lista combinada del día, para el selector de eventos cuando hay más de uno (2 conciertos, o
 // concierto + ensayo). El orden importa poco aquí: solo hace falta encontrar cuál es"el activo".
 const dayEventsList: Array<{ kind:'concert' |'rehearsal' |'reunion'; id: string; label: string }> = [
 ...selectedEvents.concerts.map(c => ({ kind:'concert' as const, id: c.id, label: `Concierto: ${c.sala}` })),
 ...selectedEvents.rehearsals.map(r => ({
 kind: (r.tipo_evento ==='reunion' ?'reunion' :'rehearsal') as'reunion' |'rehearsal',
 id: r.id,
 label: r.tipo_evento ==='reunion' ? `Reunión: ${r.asunto || r.lugar}` : `Ensayo: ${r.lugar.split(',')[0]}`
 })),
 ];
 const hasMultipleDayEvents = dayEventsList.length > 1;

 // El evento activo es el que se eligió explícitamente (chip del selector, o deep-link por
 // initialSelectedEventId) si sigue existiendo hoy; si no hay elección o no encaja, el primero
 // del día, igual que el comportamiento de siempre cuando solo hay un evento.
 const activeDayEventId = (selectedEventId && dayEventsList.some(e => e.id === selectedEventId))
 ? selectedEventId
 : dayEventsList[0]?.id;

 const selectedConcert = selectedEvents.concerts.find(c => c.id === activeDayEventId);
 const selectedRehearsal = selectedEvents.rehearsals.find(r => r.id === activeDayEventId);

 const currentRehearsal = selectedRehearsal;
 const isGeneralRehearsal = currentRehearsal && (
 currentRehearsal.notas.toLowerCase().includes('general') ||
 currentRehearsal.lugar.toLowerCase().includes('general')
 );
 const rehearsalTypeLabel = isGeneralRehearsal ?'Ensayo General' :'Ensayo';

 const isReunion = selectedRehearsal?.tipo_evento ==='reunion';
 const selectedEventTitle = selectedConcert
 ? `Concierto: ${selectedConcert.sala}`
 : selectedRehearsal
 ? (isReunion ? `Reunión: ${selectedRehearsal.asunto ||'Reunión de Banda'}` : `${rehearsalTypeLabel}: ${selectedRehearsal.lugar.split(',')[0]}`)
 : `Día Libre`;

 const currentSetlistId = selectedConcert?.setlistId || selectedRehearsal?.setlistId;
 const assignedSetlist = availableSetlists.find((s: any) => s.id === currentSetlistId);

 const selectedEventDetails = selectedConcert
 ? {
 type:'concert',
 time:'21:30',
 lugar: `${selectedConcert.sala}, ${selectedConcert.ciudad}`,
 direccion: selectedConcert.direccion,
 fee: `${selectedConcert.cache} € (Caché Pactado)`,
 notes: selectedConcert.notas,
 locationQuery: selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`,
 entradasUrl: selectedConcert.entradasUrl,
 entradasLugarFisico: selectedConcert.entradasLugarFisico
 }
 : selectedRehearsal
 ? {
 type: isReunion ?'reunion' : (isGeneralRehearsal ?'rehearsal_general' :'rehearsal'),
 time: selectedRehearsal.hora,
 lugar: selectedRehearsal.lugar,
 asunto: selectedRehearsal.asunto,
 enlace_reunion: selectedRehearsal.enlace_reunion,
 direccion: undefined,
 fee: isReunion ?'Reunión Interna' :'Gratuito',
 notes: selectedRehearsal.notas,
 locationQuery: isReunion && (selectedRehearsal.lugar.toLowerCase().includes('online') || selectedRehearsal.lugar.toLowerCase().includes('http')) ? undefined : selectedRehearsal.lugar
 }
 : {
 type:'free',
 time:'--:--',
 lugar:'Sin evento agendado',
 direccion: undefined,
 fee:'--',
 notes:'Día de descanso de la banda para composing o ensayos individuales.',
 locationQuery: undefined
 };

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const textTitle = isStitchLight ?'text-[var(--ink)]' :'text-[var(--ink-2)]';
 const textSub = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';
 const textMuted = isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]';

 // Paleta de colores e identificador visual de bandas (estilo Google Calendar)
 const BAND_COLOR_PALETTES = [
 { bg:'bg-[var(--acc)]/20 text-[var(--acc)]/70 /40', badge:'bg-[var(--acc)] text-[var(--acc-ink)]', dot:'bg-[var(--acc)]/60', accent:'var(--acc)' },
 { bg:'bg-sky-500/20 text-sky-300 border-sky-500/40', badge:'bg-sky-500 text-white', dot:'bg-sky-400', accent:'#0284c7' },
 { bg:'bg-purple-500/20 text-purple-300 border-purple-500/40', badge:'bg-purple-500 text-white', dot:'bg-purple-400', accent:'#a855f7' },
 { bg:'bg-emerald-500/20 text-[var(--ink-2)] border-emerald-500/40', badge:'bg-emerald-500 text-[var(--acc-ink)]', dot:'bg-emerald-400', accent:'var(--ok)' },
 { bg:'bg-rose-500/20 text-[var(--ink-2)] border-rose-500/40', badge:'bg-rose-500 text-[var(--ink)]', dot:'bg-rose-400', accent:'#f43f5e' },
 { bg:'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', badge:'bg-indigo-500 text-white', dot:'bg-indigo-400', accent:'#6366f1' },
 { bg:'bg-teal-500/20 text-teal-300 border-teal-500/40', badge:'bg-teal-500 text-[var(--acc-ink)]', dot:'bg-teal-400', accent:'#14b8a6' },
 { bg:'bg-orange-500/20 text-orange-300 border-orange-500/40', badge:'bg-orange-500 text-[var(--acc-ink)]', dot:'bg-orange-400', accent:'#f97316' },
 ];

 const getBandIdentity = React.useCallback((bandId?: string, bandNameFallback?: string) => {
 const name = getEventBandName({ band_id: bandId, bandName: bandNameFallback });
 const cleanId = (bandId ||'').replace(/^(band|reg)-/,'').trim().toLowerCase();
 const cleanName = (name ||'').trim().toLowerCase();

 const found = effectiveBandsList.find(b => isSameBandId(b.band_id, bandId));
 let logoUrl = found?.logoUrl || (found as any)?.logo_url || (found as any)?.imagen_url || (found as any)?.avatar_url ||'';

 if (!logoUrl && availableBands && availableBands.length > 0) {
 const match = availableBands.find((b: any) => isSameBandId(b.band_id, bandId) || isSameBandId(b.id, bandId));
 if (match) {
 logoUrl = (match as any).logoUrl || (match as any).logo_url || (match as any).imagen_url || (match as any).avatar_url ||'';
 }
 }

 if (!logoUrl) {
 try {
 const raw = localStorage.getItem('bandmanager_custom_band_logos');
 if (raw) {
 const parsed = JSON.parse(raw);
 if (parsed[cleanId]) logoUrl = parsed[cleanId];
 }
 } catch {}
 }

 if (!logoUrl && (isSameBandId(activeBandId, bandId) || cleanName === activeBandName?.trim().toLowerCase())) {
 logoUrl = currentBandLogo ||'';
 }

 if (!logoUrl && (cleanId ==='bakandeya' || cleanName.includes('bakandeya') || cleanId ==='' || !bandId)) {
 logoUrl ='/logo_bakandeya_bueno_sin_fondo.png';
 }
 
 const words = name.trim().split(/\s+/).filter(Boolean);
 const initials = words.length >= 2 
 ? (words[0][0] + words[1][0]).toUpperCase()
 : (name.slice(0, 2)).toUpperCase();

 let hash = 0;
 const str = (bandId || name ||'band');
 for (let i = 0; i < str.length; i++) {
 hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
 }
 const palette = BAND_COLOR_PALETTES[hash % BAND_COLOR_PALETTES.length];

 return { name, initials, logoUrl, palette };
 }, [effectiveBandsList, getEventBandName, isSameBandId, availableBands, activeBandId, activeBandName, currentBandLogo]);

 const getEventShareText = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
 const bandInfo = getBandIdentity(event.band_id, (event as any).bandName || (event as any).band_name);
 const dateObj = new Date(event.fecha);
 const dateFormatted = !isNaN(dateObj.getTime())
 ? `${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]}, ${dateObj.getFullYear()}`
 : event.fecha;

 let msg = `🎸 *CONVOCATORIA: ${bandInfo.name.toUpperCase()}*\n`;
 if (isConcert) {
 const c = event as Concert;
 msg += `🎤 *Concierto:* ${c.sala} (${c.ciudad})\n`;
 msg += `📅 *Fecha:* ${dateFormatted}\n`;
 msg += `⏰ *Hora Show:* 21:30h (Prueba de sonido: 18:30h)\n`;
 if (c.direccion) msg += `📍 *Dirección:* ${c.direccion}\n`;
 if (c.cache && !isPromoPlan) msg += `💰 *Caché acordado:* ${c.cache} €\n`;
 if (c.giraNombre) msg += `🚐 *Gira:* ${c.giraNombre}\n`;
 if (c.entradasUrl) msg += `🎟️ *Venta de entradas:* ${c.entradasUrl}\n`;
 if (c.notas) msg += `📝 *Notas / Rider:* ${c.notas}\n`;

 // Alertas meteorológicas en la convocatoria
 const weatherAlerts = getCachedEventWeatherAlerts(c.ciudad, c.fecha);
 if (weatherAlerts.length > 0) {
 msg += `\n⚠️ *ALERTAS METEOROLÓGICAS DE ESCENARIO:*\n`;
 weatherAlerts.forEach(a => {
 msg += `• ${a.badge}: ${a.shortAdvice}\n`;
 });
 }
 } else {
 const r = event as Rehearsal;
 msg += `🥁 *Ensayo / Convocatoria:* ${r.lugar}\n`;
 msg += `📅 *Fecha:* ${dateFormatted}\n`;
 msg += `⏰ *Hora:* ${r.hora}\n`;
 if (r.asunto) msg += `🎯 *Asunto:* ${r.asunto}\n`;
 if (r.enlace_reunion) msg += `🔗 *Enlace:* ${r.enlace_reunion}\n`;
 if (r.notas) msg += `📝 *Notas:* ${r.notas}\n`;
 }
 msg += `\n⚡ *Gestionado con BandManager.io*`;
 return msg;
 }, [getBandIdentity, isPromoPlan, monthNames]);

 const handleShareEventWhatsApp = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
 const msg = getEventShareText(event, isConcert);
 const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
 window.open(waUrl,'_blank','noopener,noreferrer');
 }, [getEventShareText]);

 const handleCopyEventFicha = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
 const msg = getEventShareText(event, isConcert);
 navigator.clipboard.writeText(msg);
 setCopiedEventModalId(event.id);
 setTimeout(() => setCopiedEventModalId(null), 2500);
 if (onShowNotification) onShowNotification('Ficha del evento copiada al portapapeles','success');
 }, [getEventShareText, onShowNotification]);

 const handleNotifyBandMembers = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
 const title = isConcert ? `Concierto en ${(event as Concert).sala}` : `Ensayo en ${(event as Rehearsal).lugar}`;
 const body = `Convocatoria: ${event.fecha} a las ${isConcert ?'21:30' : (event as Rehearsal).hora}`;
 triggerNativeMobileNotification(title, { body });
 setShowReminderModal(true);
 if (onShowNotification) onShowNotification('Convocatoria enviada a los músicos de la banda','success');
 }, [onShowNotification]);

 const handleDeleteEventFromModal = React.useCallback((eventId: string, isConcert: boolean) => {
 if (isConcert && onDeleteConcert) {
 onDeleteConcert(eventId);
 } else if (!isConcert && onDeleteRehearsal) {
 onDeleteRehearsal(eventId);
 }
 setDeletingEventConfirmId(null);
 setShowEventFichaModal(false);
 setSelectedEventId(null);
 if (onShowNotification) onShowNotification('Evento eliminado del calendario','info');
 }, [onDeleteConcert, onDeleteRehearsal, onShowNotification]);

 // Render month grid function
 const renderMonthGrid = (year: number, month: number, showMonthHeader: boolean = false) => {
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;

 const cells = [];
 for (let i = 0; i < startOffset; i++) {
 cells.push({ empty: true, day: 0 });
 }
 for (let d = 1; d <= daysInMonth; d++) {
 cells.push({ empty: false, day: d });
 }

 const isThisRealMonth = realToday.getFullYear() === year && realToday.getMonth() === month;

 return (
 <div key={`month-grid-${year}-${month}`} data-modulo="sala" className="flex-1 min-w-[280px]">
 {showMonthHeader && (
 <div className={`text-center font-bold font-display uppercase tracking-wider text-[10px] mb-3 pb-1 ${
 isStitchLight ?'text-sky-400' :'text-[var(--acc)]'
 }`}>
 {monthNames[month]} {year}
 </div>
 )}

 {/* Weekday Labels */}
 <div className={`grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono mb-2.5 font-bold uppercase ${textSub} bg-[var(--surface)]/60 p-2 rounded-[var(--r-m)]`}>
 {weekdays.map(day => (
 <div key={day} className="py-0.5 tracking-wider">{day}</div>
 ))}
 </div>

 {/* Grid Cells */}
 <div className="grid grid-cols-7 gap-1.5">
 {cells.map((cell, index) => {
 if (cell.empty) {
 return <div key={`empty-${year}-${month}-${index}`} className="aspect-square bg-transparent rounded-[var(--r-s)]" />;
 }

 const formattedDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
 const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(formattedDate);
 const dayCampaigns = getCampaignsForDate(formattedDate);
 const hasConcert = dayConcerts.length > 0;
 const hasRehearsal = dayRehearsals.length > 0;
 const hasCampaign = dayCampaigns.length > 0;
 const activeDateCampaign = dayCampaigns.find(c => c.isActive) || dayCampaigns[0];
 const dayEvents: Array<Concert | Rehearsal> = [...dayConcerts, ...dayRehearsals];
 const dayWeatherAlerts = dayConcerts.flatMap(c => getCachedEventWeatherAlerts(c.ciudad, formattedDate));
 const primaryAlert = dayWeatherAlerts[0];

 const isSelected = selectedDate.getFullYear() === year &&
 selectedDate.getMonth() === month &&
 selectedDate.getDate() === cell.day;

 const isToday = isThisRealMonth && cell.day === realToday.getDate();

 // Stylish logic for non-selected vs event vs selected days
 let borderAndBgClass ="";
 if (isSelected) {
 borderAndBgClass = isStitchLight
 ?'bg-sky-500 text-[var(--ink)] font-extrabold border-2 border-sky-300 shadow-xl shadow-sky-500/20 scale-[1.05] z-20'
 :'bg-[var(--acc)] text-[var(--ink)] font-black border-2 shadow-xl shadow-amber-0/25 scale-[1.05] z-20';
 } else if (isToday) {
 borderAndBgClass ='bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold border-2 /80 shadow-md shadow-amber-0/10 hover: z-10';
 } else if (hasConcert && hasRehearsal) {
 borderAndBgClass ='bg-gradient-to-br from-amber-950/40 to-emerald-950/40 hover: hover:shadow-md hover:shadow-amber-0/10 text-[var(--ink)]';
 } else if (hasConcert) {
 borderAndBgClass ='bg-[var(--acc-soft)] hover: hover:shadow-md hover:shadow-amber-0/10 text-[var(--ink)]';
 } else if (hasRehearsal) {
 borderAndBgClass ='bg-[var(--ok-soft)] hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 text-[var(--ink)]';
 } else if (hasCampaign) {
 borderAndBgClass ='bg-purple-950/30 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/20 text-purple-200';
 } else {
 borderAndBgClass = isStitchLight
 ?'bg-white hover:border-sky-400 hover:bg-[var(--bg)] text-[var(--ink)] shadow-xs'
 :'bg-[var(--surface)]/80 hover:/60 hover:bg-[var(--surface)]/80 hover:shadow-md hover:shadow-amber-0/10 text-[var(--ink-2)] shadow-xs';
 }

 return (
 <button
 key={`day-${year}-${month}-${cell.day}`}
 onClick={() => {
 setSelectedDate(new Date(year, month, cell.day));
 if (dayEvents.length > 0) {
 setSelectedEventId(dayEvents[0].id);
 }
 }}
 className={`relative min-h-[62px] sm:min-h-[76px] lg:min-h-[82px] aspect-auto sm:aspect-square p-1 sm:p-1.5 rounded-[var(--r-m)] flex flex-col justify-between transition-all duration-200 cursor-pointer overflow-hidden ${borderAndBgClass}`}
 >
 <div className="flex items-center justify-between w-full">
 <span className={`text-[11px] sm:text-xs font-mono font-bold ${isSelected ?'text-[var(--acc-ink)] font-black' : isToday ?'text-[var(--acc)]' :''}`}>
 {cell.day}
 </span>
 <div className="flex items-center gap-1">
 {primaryAlert && (
 <CalendarWeatherBadge alert={primaryAlert} compact />
 )}
 {isToday && !isSelected && (
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]/60 shrink-0 animate-ping" />
 )}
 </div>
 </div>

 {/* Mini Badges / Event Indicators con texto claro y legible */}
 <div className="w-full space-y-0.5 sm:space-y-1 overflow-hidden">
 {dayConcerts.slice(0, 2).map(c => {
 const bandInfo = getBandIdentity(c.band_id, (c as any).bandName || (c as any).band_name);
 const venueLabel = c.sala || c.ciudad ||'Concierto';
 const isPosible = Boolean(c.is_posible || (c as any).isPosible);
 return (
 <div
 key={c.id}
 onClick={(e) => {
 e.stopPropagation();
 handleSelectEvent(c);
 }}
 className={`text-[8px] sm:text-[9.5px] font-mono font-bold truncate px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
 isSelected 
 ?'bg-stone-950/25 text-[var(--acc-ink)] font-black' 
 : isPosible
 ?'bg-purple-500/25 text-purple-200 hover:bg-purple-500/35 hover:text-[var(--ink)] shadow-xs'
 :'bg-[var(--acc)]/25 text-[var(--ink)] hover:bg-[var(--acc)]/35 hover:text-[var(--ink)] shadow-xs'
 }`}
 title={`${isPosible ?'Posible Concierto' :'Concierto'} [${bandInfo.name}]: ${c.sala} (${c.ciudad})${c.cache ? ` · Caché: ${c.cache}€` :''}`}
 >
 <span className="shrink-0 text-[8.5px] leading-none">{isPosible ?'🎯' :'🎸'}</span>
 <span className="truncate font-extrabold tracking-tight">
 {venueLabel}
 </span>
 {c.ciudad && c.sala && (
 <span className="hidden md:inline opacity-75 text-[8px] shrink-0 font-normal">
 · {c.ciudad}
 </span>
 )}
 </div>
 );
 })}
 {dayRehearsals.slice(0, dayConcerts.length > 0 ? 1 : 2).map(r => {
 const isReu = r.tipo_evento ==='reunion';
 const bandInfo = getBandIdentity(r.band_id, (r as any).bandName || (r as any).band_name);
 const rehearsalLabel = isReu
 ? (r.asunto ||'Reunión')
 : (r.lugar.split(',')[0].replace(/Rehearsal|Studios/gi,'').trim() ||'Ensayo');
 return (
 <div
 key={r.id}
 onClick={(e) => {
 e.stopPropagation();
 handleSelectEvent(r);
 }}
 className={`text-[8px] sm:text-[9.5px] font-mono font-bold truncate px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1 transition-all ${
 isSelected
 ?'bg-stone-950/25 text-[var(--acc-ink)] font-black'
 : isReu
 ?'bg-indigo-500/25 text-indigo-200 hover:bg-indigo-500/35 hover:text-[var(--ink)] shadow-xs'
 :'bg-emerald-500/25 text-[var(--ink)] hover:bg-emerald-500/35 hover:text-[var(--ink)] shadow-xs'
 }`}
 title={isReu ? `Reunión [${bandInfo.name}]: ${r.asunto || r.lugar}` : `Ensayo [${bandInfo.name}]: ${r.lugar}`}
 >
 <span className="shrink-0 text-[8.5px] leading-none">{isReu ?'🤝' :'🥁'}</span>
 <span className="truncate font-extrabold tracking-tight">
 {rehearsalLabel}
 </span>
 </div>
 );
 })}
 {dayEvents.length > (dayConcerts.length > 0 ? 2 : 2) && (
 <div className="text-[7.5px] sm:text-[8.5px] font-mono text-center font-bold text-[var(--acc)]/70 opacity-90">
 +{dayEvents.length - 2} más
 </div>
 )}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 );
 };

 // Render Week View (Google Calendar Style: 7 días detallados con logos de banda)
 const renderWeekView = () => {
 const weekDays = getWeekDays(selectedDate);
 return (
 <div className="w-full flex flex-col gap-3">
 {/* Selector de días de la semana con badges */}
 <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
 {weekDays.map((d, idx) => {
 const isToday = realToday.toDateString() === d.toDateString();
 const isSelected = selectedDate.toDateString() === d.toDateString();
 const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const { concerts: cList, rehearsals: rList } = getEventsForDateStr(dayStr);
 const totalEvents = cList.length + rList.length;

 return (
 <button
 key={dayStr}
 onClick={() => setSelectedDate(d)}
 className={`flex flex-col items-center justify-center p-2 rounded-[var(--r-m)] transition-all cursor-pointer ${
 isSelected
 ? isStitchLight
 ?'bg-sky-500 text-[var(--ink)] border-sky-400 shadow-md font-bold'
 :'bg-[var(--acc)] text-[var(--acc-ink)] shadow-lg font-black'
 : isToday
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 /60 font-bold'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:border-sky-300'
 :'bg-[var(--surface)]/90 text-[var(--ink-2)] hover:/50'
 }`}
 >
 <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
 {fullWeekdays[idx].slice(0, 3)}
 </span>
 <span className="text-sm sm:text-base font-bold font-mono my-0.5">
 {d.getDate()}
 </span>
 {totalEvents > 0 && (
 <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
 isSelected
 ?'bg-black/20 text-inherit'
 :'bg-[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 {totalEvents} {totalEvents === 1 ?'evt' :'evts'}
 </span>
 )}
 </button>
 );
 })}
 </div>

 {/* 7 Columnas de la semana estilo Google Calendar */}
 <div className="w-full overflow-x-auto pb-2">
 <div className="grid grid-cols-7 gap-2 min-w-[700px] lg:min-w-0 min-h-[420px]">
 {weekDays.map((d, idx) => {
 const isToday = realToday.toDateString() === d.toDateString();
 const isSelected = selectedDate.toDateString() === d.toDateString();
 const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const { concerts: dayConcerts, rehearsals: dayRehearsals } = getEventsForDateStr(dayStr);
 const campaigns = getCampaignsForDate(dayStr);

 return (
 <div
 key={`col-${dayStr}`}
 onClick={() => setSelectedDate(d)}
 className={`flex flex-col rounded-[var(--r-m)] p-2 sm:p-2.5 transition-all min-w-0 ${
 isSelected
 ? isStitchLight
 ?'bg-sky-50/50 border-sky-300 ring-1 ring-sky-400'
 :'bg-[var(--surface)]/90 /60 ring-1 ring-amber-0/40'
 : isToday
 ? isStitchLight
 ?'bg-amber-50/40'
 :'bg-[var(--surface)]/60 /30'
 : isStitchLight
 ?'bg-white'
 :'bg-[var(--surface)]/50 /80'
 }`}
 >
 <div className="flex items-center justify-between pb-2 mb-2 border-b /50">
 <div className="flex items-center gap-1.5 min-w-0">
 <span className={`text-xs font-mono font-bold truncate ${isSelected ?'text-[var(--acc)]' : isToday ?'text-[var(--acc)]/70' :'text-[var(--ink-2)]'}`}>
 {fullWeekdays[idx].slice(0, 3)} {d.getDate()}
 </span>
 {(() => {
 const dIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 const cCity = dayConcerts.find(c => c.ciudad)?.ciudad;
 if (!cCity) return null;
 const wAlerts = getCachedEventWeatherAlerts(cCity, dIso);
 return wAlerts[0] ? <CalendarWeatherBadge alert={wAlerts[0]} compact /> : null;
 })()}
 {isToday && (
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]/60 animate-ping shrink-0" />
 )}
 </div>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setSelectedDate(d);
 setShowCreateModal('concert');
 }}
 title="Añadir evento a este día"
 className="p-1 rounded hover:bg-white/10 text-[var(--ink-2)] hover:text-[var(--ink)] transition-all cursor-pointer shrink-0"
 >
 <Plus className="w-3 h-3" />
 </button>
 </div>

 {/* Lista de eventos del día */}
 <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[360px]">
 {dayConcerts.map(c => {
 const bandInfo = getBandIdentity(c.band_id, (c as any).bandName || (c as any).band_name);
 const isEvtSelected = selectedEventId === c.id;
 const isPosible = Boolean(c.is_posible || (c as any).isPosible);
 return (
 <div
 key={c.id}
 onClick={(e) => {
 e.stopPropagation();
 handleSelectEvent(c);
 }}
 className={`p-2 rounded-[var(--r-s)] cursor-pointer transition-all text-left min-w-0 ${
 isEvtSelected
 ? isPosible
 ?'bg-purple-500/25 border-purple-400 ring-1 ring-purple-400/50 shadow-md'
 :'bg-[var(--acc)]/25 ring-1 ring-amber-400/50 shadow-md'
 : isPosible
 ?'bg-purple-950/30 border-purple-500/40 hover:border-purple-400 hover:bg-purple-900/30 text-purple-200'
 :'bg-[var(--acc-soft)] /40 hover: hover:bg-[var(--acc-soft)]'
 }`}
 >
 <div className="flex items-center gap-1.5 mb-1 min-w-0">
 {bandInfo.logoUrl ? (
 <img
 src={bandInfo.logoUrl}
 alt={bandInfo.name}
 className={`w-4 h-4 rounded-full object-contain bg-black/60 p-0.5 shrink-0 ${isPosible ?'border-purple-400/60' :'/60'}`}
 onError={(e) => {
 (e.currentTarget as HTMLElement).style.display ='none';
 const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
 if (fb) (fb as HTMLElement).classList.remove('hidden');
 }}
 />
 ) : null}
 <span className={`fallback-initials w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black ${bandInfo.palette.badge} ${bandInfo.logoUrl ?'hidden' :''}`}>
 {bandInfo.initials}
 </span>
 <span className={`text-[10px] font-bold ${isPosible ?'text-purple-200' :'text-[var(--ink)]'} truncate`} title={bandInfo.name}>
 {bandInfo.name}
 </span>
 {isPosible && (
 <span className="ml-auto text-[8px] font-mono uppercase font-black px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200">
 Posible
 </span>
 )}
 </div>
 <div className="text-[11px] font-bold text-[var(--ink)] truncate flex items-center gap-1">
 <span>{isPosible ?'🎯' :'🎸'}</span>
 <span className="truncate">{c.sala}</span>
 </div>
 {c.ciudad && (
 <div className="text-[10px] text-[var(--acc)]/70/80 truncate">
 📍 {c.ciudad}
 </div>
 )}
 <HolidayDateWarning date={c.fecha} city={c.ciudad} compact className="mt-1" />
 {((c as any).hora || (c.fecha.includes('T') ? c.fecha.split('T')[1].slice(0, 5) :'')) && (
 <div className="text-[9px] font-mono text-[var(--ink-2)] mt-1">
 🕒 {(c as any).hora || (c.fecha.includes('T') ? c.fecha.split('T')[1].slice(0, 5) :'')}
 </div>
 )}
 </div>
 );
 })}

 {dayRehearsals.map(r => {
 const isReu = r.tipo_evento ==='reunion';
 const bandInfo = getBandIdentity(r.band_id, (r as any).bandName || (r as any).band_name);
 const isEvtSelected = selectedEventId === r.id;
 return (
 <div
 key={r.id}
 onClick={(e) => {
 e.stopPropagation();
 handleSelectEvent(r);
 }}
 className={`p-2 rounded-[var(--r-s)] cursor-pointer transition-all text-left min-w-0 ${
 isEvtSelected
 ? isReu
 ?'bg-indigo-500/25 border-indigo-400 ring-1 ring-indigo-400/50 shadow-md'
 :'bg-emerald-500/25 border-emerald-400 ring-1 ring-emerald-400/50 shadow-md'
 : isReu
 ?'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-900/30'
 :'bg-[var(--ok-soft)] border-emerald-500/40 hover:border-emerald-400 hover:bg-[var(--ok-soft)]'
 }`}
 >
 <div className="flex items-center gap-1.5 mb-1 min-w-0">
 {bandInfo.logoUrl ? (
 <img
 src={bandInfo.logoUrl}
 alt={bandInfo.name}
 className={`w-4 h-4 rounded-full object-contain bg-black/60 p-0.5 shrink-0 ${isReu ?'border-indigo-400/60' :'border-emerald-400/60'}`}
 onError={(e) => {
 (e.currentTarget as HTMLElement).style.display ='none';
 const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
 if (fb) (fb as HTMLElement).classList.remove('hidden');
 }}
 />
 ) : null}
 <span className={`fallback-initials w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black ${bandInfo.palette.badge} ${bandInfo.logoUrl ?'hidden' :''}`}>
 {bandInfo.initials}
 </span>
 <span className={`text-[10px] font-bold truncate ${isReu ?'text-indigo-200' :'text-[var(--ink)]'}`} title={bandInfo.name}>
 {bandInfo.name}
 </span>
 </div>
 <div className="text-[11px] font-bold text-[var(--ink)] truncate flex items-center gap-1">
 <span>{isReu ?'🤝' :'🥁'}</span>
 <span className="truncate">{isReu ? (r.asunto ||'Reunión') : r.lugar}</span>
 </div>
 {r.hora && (
 <div className="text-[9px] font-mono text-[var(--ink-2)] mt-1">
 🕒 {r.hora}
 </div>
 )}
 </div>
 );
 })}
 {campaigns.map(camp => (
 <div
 key={camp.id}
 className="p-1.5 rounded-[var(--r-s)] bg-purple-950/25 text-[10px] text-purple-200"
 >
 🎯 {camp.name}
 </div>
 ))}

 {dayConcerts.length === 0 && dayRehearsals.length === 0 && campaigns.length === 0 && (
 <div className="h-24 flex flex-col items-center justify-center text-center p-2 rounded border-dashed /60 text-[var(--ink-2)]">
 <span className="text-[10px]">Sin eventos</span>
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
 };

 // Render Agenda View (Google Calendar Style: lista cronológica de eventos con logos e información detallada)
 const renderAgendaView = () => {
 const allEventsList: Array<{
 date: Date;
 dateStr: string;
 type:'concert' |'rehearsal';
 event: Concert | Rehearsal;
 }> = [];

 const startRange = new Date(currentYear, currentMonth, 1);
 const endRange = new Date(currentYear, currentMonth + 2, 0);

 concerts.forEach(c => {
 const d = new Date(c.fecha);
 if (!isNaN(d.getTime()) && d >= startRange && d <= endRange) {
 allEventsList.push({
 date: d,
 dateStr: c.fecha.split('T')[0],
 type:'concert',
 event: c
 });
 }
 });

 rehearsals.forEach(r => {
 const d = new Date(r.fecha);
 if (!isNaN(d.getTime()) && d >= startRange && d <= endRange) {
 allEventsList.push({
 date: d,
 dateStr: r.fecha.split('T')[0],
 type:'rehearsal',
 event: r
 });
 }
 });

 allEventsList.sort((a, b) => a.date.getTime() - b.date.getTime());

 const groupedByDate: { [dateStr: string]: typeof allEventsList } = {};
 allEventsList.forEach(item => {
 if (!groupedByDate[item.dateStr]) groupedByDate[item.dateStr] = [];
 groupedByDate[item.dateStr].push(item);
 });

 const dateKeys = Object.keys(groupedByDate).sort();

 return (
 <div className="w-full flex flex-col gap-4">
 <div className="flex items-center justify-between pb-2 border-b /80">
 <div className="flex items-center gap-2">
 <List className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink-2)]">
 Agenda Cronológica ({allEventsList.length} eventos programados)
 </span>
 </div>
 <button
 onClick={() => setShowCreateModal('concert')}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs font-bold font-mono bg-[var(--acc)] text-[var(--acc-ink)] hover:bg-[var(--acc)]/50/90 transition-all cursor-pointer flex items-center gap-1.5"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Añadir Evento</span>
 </button>
 </div>

 {dateKeys.length === 0 ? (
 <div className="p-8 text-center rounded-[var(--r-l)] bg-[var(--surface)]">
 <PublicoSilhouette opacity={0.12} size="medium" className="mx-auto mb-4" />
 <p className="text-sm font-bold text-[var(--ink)]">El calendario está vacío</p>
 <p className="text-xs text-[var(--ink-2)] mt-2">Usa el botón"Añadir Evento" o cambia de mes para ver otras fechas</p>
 </div>
 ) : (
 <div className="flex flex-col gap-3">
 {dateKeys.map(dateStr => {
 const items = groupedByDate[dateStr];
 const d = new Date(dateStr +'T12:00:00');
 const isToday = realToday.toDateString() === d.toDateString();
 const isSelected = selectedDate.toDateString() === d.toDateString();
 const dayName = fullWeekdays[(d.getDay() + 6) % 7];

 return (
 <div
 key={dateStr}
 className={`rounded-[var(--r-m)] transition-all p-3 ${
 isSelected
 ?'bg-[var(--surface)]/90 /60 ring-1 ring-amber-0/30'
 : isToday
 ?'bg-[var(--surface)]/70 /40'
 :'bg-[var(--surface)]/40 /80 hover:'
 }`}
 >
 <div className="flex items-center justify-between mb-2.5 pb-2 border-b /60">
 <div className="flex items-center gap-2">
 <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
 isToday ?'bg-[var(--acc)] text-[var(--acc-ink)] font-black' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 {dayName}, {d.getDate()} de {monthNames[d.getMonth()]}
 </span>
 {isToday && (
 <span className="text-[10px] font-mono font-bold uppercase text-[var(--acc)] flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]/60 animate-ping" />
 Hoy
 </span>
 )}
 </div>
 <button
 onClick={() => {
 setSelectedDate(d);
 setShowCreateModal('concert');
 }}
 className="p-1 rounded text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-all cursor-pointer"
 title="Añadir a esta fecha"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className="flex flex-col gap-2">
 {items.map(({ type, event: evt }) => {
 const isConcert = type ==='concert';
 const c = isConcert ? (evt as Concert) : null;
 const r = !isConcert ? (evt as Rehearsal) : null;
 const isReu = r?.tipo_evento ==='reunion';
 const bandInfo = getBandIdentity(evt.band_id, (evt as any).bandName || (evt as any).band_name);
 const isEvtSelected = selectedEventId === evt.id;

 return (
 <div
 key={evt.id}
 onClick={() => handleSelectEvent(evt)}
 className={`flex items-center justify-between p-2.5 rounded-[var(--r-s)] cursor-pointer transition-all ${
 isEvtSelected
 ?'bg-[var(--acc)]/20 shadow-md ring-1 ring-amber-400/50'
 : isConcert
 ?'bg-[var(--acc-soft)] /30 hover:/80 hover:bg-[var(--acc-soft)]'
 : isReu
 ?'bg-indigo-950/20 border-indigo-500/30 hover:border-indigo-400/80 hover:bg-indigo-900/20'
 :'bg-[var(--ok-soft)] border-emerald-500/30 hover:border-emerald-400/80 hover:bg-[var(--ok-soft)]'
 }`}
 >
 <div className="flex items-center gap-3 min-w-0">
 {/* Logo o iniciales de la banda */}
 {bandInfo.logoUrl ? (
 <img
 src={bandInfo.logoUrl}
 alt={bandInfo.name}
 className="w-8 h-8 rounded-full object-contain bg-black/60 p-0.5 shrink-0 border-[var(--hair)]20 shadow-xs"
 onError={(e) => {
 (e.currentTarget as HTMLElement).style.display ='none';
 const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
 if (fb) (fb as HTMLElement).classList.remove('hidden');
 }}
 />
 ) : null}
 <span className={`fallback-initials w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black shadow-xs ${bandInfo.palette.badge} ${bandInfo.logoUrl ?'hidden' :''}`}>
 {bandInfo.initials}
 </span>

 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className={`text-xs font-bold font-mono px-1.5 py-0.2 rounded ${
 isConcert
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /40'
 : isReu
 ?'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
 :'bg-emerald-500/20 text-[var(--ink-2)] border-emerald-500/40'
 }`}>
 {isConcert ?'🎸 Concierto' : isReu ?'🤝 Reunión' :'🥁 Ensayo'}
 </span>
 <span className="text-xs font-bold text-[var(--ink)] truncate">
 {bandInfo.name}
 </span>
 </div>
 <div className="text-xs text-[var(--ink-2)] font-medium truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
 <span>{isConcert ? `${c?.sala}${c?.ciudad ? ` (${c?.ciudad})` :''}` : isReu ? (r?.asunto ||'Reunión de coordinación') : r?.lugar}</span>
 {isConcert && c?.ciudad && (() => {
 const alerts = getCachedEventWeatherAlerts(c.ciudad, dateStr);
 return alerts[0] ? <CalendarWeatherBadge alert={alerts[0]} /> : null;
 })()}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 {((evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) :'')) && (
 <span className="text-xs font-mono text-[var(--ink-2)] flex items-center gap-1">
 <Clock className="w-3 h-3 text-[var(--ink-2)]" />
 {(evt as any).hora || ((evt as any).fecha?.includes('T') ? (evt as any).fecha.split('T')[1].slice(0, 5) :'')}
 </span>
 )}
 <ChevronRight className="w-4 h-4 text-[var(--ink-2)]" />
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 };

 return (
 <div
 ref={calendarContainerRef}
 className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isStitchLight ?'text-[var(--ink)] bg-[var(--sunken)]' :'text-[var(--ink)] bg-[var(--surface)]'} font-sans items-stretch w-full max-w-full overflow-x-hidden ${
 isCalendarFullscreen ?'fixed inset-0 z-50 p-4 sm:p-6 overflow-y-auto' :''
 }`}
 >
 {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
 <div className={`${colors.card} p-6 flex flex-col justify-between lg:col-span-2`}>
 <div>
 {/* Header */}
 <div className={`pb-4 mb-4 border-b ${isStitchLight ?"" :"border-[var(--hair)]800"}`}>
 {/* Top title & Action buttons */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="min-w-0">
 <h4 className={`text-[10px] font-mono uppercase tracking-widest ${isStitchLight ?"text-sky-500 font-bold" :"text-[var(--acc)]"}`}>
 Calendario de Directos, Ensayos y Reuniones
 </h4>
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold mt-1 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
 <span className="shrink-0 px-2 py-0.5 rounded-full bg-[var(--acc)]/15 text-[var(--acc)] flex items-center gap-1" title="Eventos visibles vs Total">
 <Calendar className="w-3 h-3" /> {filteredConcerts.length + filteredRehearsals.length}/{concerts.length + rehearsals.length}
 </span>
 <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1" title="Directos y conciertos públicos">
 <Mic className="w-3 h-3 text-emerald-400" /> {filteredConcerts.length} directos
 </span>
 <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 flex items-center gap-1" title="Ensayos de banda">
 <DoorClosed className="w-3 h-3 text-purple-400" /> {filteredRehearsals.filter(r => r.tipo_evento !=='reunion').length} ensayos
 </span>
 {filteredRehearsals.filter(r => r.tipo_evento ==='reunion').length > 0 && (
 <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center gap-1" title="Reuniones de coordinación">
 <span>🤝</span> {filteredRehearsals.filter(r => r.tipo_evento ==='reunion').length} reuniones
 </span>
 )}
 </div>
 </div>

 {/* Action buttons */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
 <ModuleTutorialTrigger
 moduleId="calendario"
 onClick={openTutorial}
 label="Guía rápida"
 />

 {/* Unified Add Event Button (Prevents button clutter) */}
 <div className="relative inline-block text-left">
 <button
 id="create-event-unified-btn"
 onClick={() => setShowAddEventDropdown(!showAddEventDropdown)}
 className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs ${
 isStitchLight
 ?"bg-amber-600 hover:bg-[var(--acc)] text-[var(--ink)]"
 :"bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold"
 }`}
 title="Añadir Concierto, Ensayo o Reunión"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Evento</span>
 <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
 </button>

 {showAddEventDropdown && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowAddEventDropdown(false)} />
 <div className={`absolute right-0 mt-1.5 w-48 rounded-[var(--r-m)] shadow-2xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-150 backdrop-blur-md ${
 isStitchLight ?"bg-white/95 text-[var(--ink)]" :"bg-[var(--surface)]/95 border-[var(--hair)]800 text-[var(--ink-2)]"
 }`}>
 <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[var(--ink-2)] border-b /40 mb-1">
 Añadir al Calendario
 </div>
 <button
 type="button"
 onClick={() => { setShowAddEventDropdown(false); setConcIsPosible(false); setShowCreateModal('concert'); }}
 className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-[var(--acc)]/15 hover:text-[var(--acc)] transition-colors cursor-pointer"
 >
 <span>🎸</span>
 <span>+ Concierto</span>
 </button>
 <button
 type="button"
 onClick={() => { setShowAddEventDropdown(false); setConcIsPosible(true); setShowCreateModal('concert'); }}
 className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-purple-500/15 hover:text-purple-400 transition-colors cursor-pointer"
 >
 <span>🎯</span>
 <span>+ Bolo Posible</span>
 </button>
 <button
 type="button"
 onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('rehearsal'); }}
 className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors cursor-pointer"
 >
 <span>🥁</span>
 <span>+ Ensayo</span>
 </button>
 <button
 type="button"
 onClick={() => { setShowAddEventDropdown(false); setShowCreateModal('reunion'); }}
 className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-indigo-500/15 hover:text-indigo-400 transition-colors cursor-pointer"
 >
 <span>🤝</span>
 <span>+ Reunión</span>
 </button>
 </div>
 </>
 )}
 </div>

 {!isPromoPlan && (
 <button
 id="export-ics-btn"
 onClick={() => setShowSyncModal(true)}
 className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs ${
 isStitchLight
 ?"bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink)]"
 :"bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70"
 }`}
 title="Sincronizar automáticamente con Google Calendar, Apple Calendar o Outlook"
 >
 <Radio className="w-3.5 h-3.5 text-[var(--acc)] animate-pulse" />
 <span>Sincronizar</span>
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Month Navigation & Band Selector */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-3 pt-2">
 {/* Left: Navigation Buttons + Month/Period Title (Rock-solid, never jumps) */}
 <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={handlePrevMonth}
 className={`p-1.5 rounded-[var(--r-s)] transition-all cursor-pointer ${
 isStitchLight ?"bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]" :"bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]"
 }`}
 title="Meses anteriores (o desliza a la derecha)"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 onClick={handleNextMonth}
 className={`p-1.5 rounded-[var(--r-s)] transition-all cursor-pointer ${
 isStitchLight ?"bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]" :"bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)]"
 }`}
 title="Meses siguientes (o desliza a la izquierda)"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 <button
 onClick={handleGoToday}
 className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-[var(--acc)]/15 text-[var(--acc)] hover:bg-[var(--acc)]/50/25 transition-all cursor-pointer shrink-0"
 title="Ir al mes y día actual"
 >
 Hoy
 </button>
 </div>

 <h2 className={`text-base sm:text-lg lg:text-xl font-bold font-display uppercase tracking-wider truncate min-w-0 ${textTitle}`}>
 {calendarViewMode ==='2m' ? (
 <>
 {monthNames[currentMonth]} - {monthNames[nextMonth]} <span className="text-[var(--acc)] font-mono text-base">{currentYear === nextMonthYear ? currentYear : `${currentYear}/${nextMonthYear}`}</span>
 </>
 ) : calendarViewMode ==='week' ? (
 (() => {
 const week = getWeekDays(selectedDate);
 const first = week[0];
 const last = week[6];
 return (
 <>
 Semana {first.getDate()} {monthNames[first.getMonth()].slice(0, 3)} - {last.getDate()} {monthNames[last.getMonth()].slice(0, 3)} <span className="text-[var(--acc)] font-mono text-base">{last.getFullYear()}</span>
 </>
 );
 })()
 ) : calendarViewMode ==='agenda' ? (
 <>
 Agenda <span className="text-[var(--acc)] font-mono text-base">{monthNames[currentMonth]} {currentYear}</span>
 </>
 ) : (
 <>
 {monthNames[currentMonth]} <span className="text-[var(--acc)] font-mono text-base">{currentYear}</span>
 </>
 )}
 </h2>
 </div>

 {/* Right: View Switchers + Band Filter */}
 <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end shrink-0">
 {/* Vistas estilo Google Calendar: 1M | 2M | Semana | Agenda + Configuración */}
 <div className="relative inline-flex items-center shrink-0" ref={viewConfigRef}>
 <div className={`flex items-center rounded-[var(--r-s)] p-0.5 ${
 isStitchLight ?"bg-[var(--sunken)]" :"bg-[var(--surface)] border-[var(--hair)]800"
 }`}>
 <button
 id="calendar-view-1m-btn"
 onClick={() => {
 setCalendarViewMode('1m');
 setTwoMonthsMode(false);
 }}
 title={devicePrefs[currentDeviceType] ==='1' ?"Ver 1 mes (predeterminado al iniciar en este dispositivo)" :"Ver 1 mes"}
 className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
 calendarViewMode ==='1m'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 1M
 </button>
 <button
 id="calendar-view-2m-btn"
 onClick={() => {
 setCalendarViewMode('2m');
 setTwoMonthsMode(true);
 }}
 title={devicePrefs[currentDeviceType] ==='2' ?"Ver 2 meses (predeterminado al iniciar en este dispositivo)" :"Ver 2 meses"}
 className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
 calendarViewMode ==='2m'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 2M
 </button>
 <button
 id="calendar-view-week-btn"
 onClick={() => setCalendarViewMode('week')}
 title="Vista Semana estilo Google Calendar (7 días detallados)"
 className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
 calendarViewMode ==='week'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 <CalendarDays className="w-3 h-3" />
 <span className="hidden sm:inline">Semana</span>
 </button>
 <button
 id="calendar-view-agenda-btn"
 onClick={() => setCalendarViewMode('agenda')}
 title="Vista Agenda / Lista estilo Google Calendar"
 className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
 calendarViewMode ==='agenda'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 <List className="w-3 h-3" />
 <span className="hidden sm:inline">Agenda</span>
 </button>
 <button
 id="calendar-view-config-btn"
 onClick={() => setShowViewConfigPopover(prev => !prev)}
 title="Configurar vista por defecto (1M o 2M) diferenciada por tipo de dispositivo y sincronizada en Supabase"
 className={`px-1.5 py-0.5 text-[10px] rounded transition-all cursor-pointer flex items-center justify-center relative ${
 showViewConfigPopover
 ? isStitchLight ?"bg-[var(--surface)] text-[var(--ink)]" :"bg-[var(--surface)]/80 text-[var(--acc)]"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 <Settings className="w-3 h-3" />
 {devicePrefs[currentDeviceType] ==='2' && (
 <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--acc)]" title="Vista personalizada activa: 2 meses" />
 )}
 </button>
 </div>

 {/* Botón de Pantalla Completa */}
 <button
 id="calendar-fullscreen-btn"
 onClick={toggleCalendarFullscreen}
 title={isCalendarFullscreen ?"Salir de pantalla completa (Esc)" :"Ver el calendario a pantalla completa"}
 className={`px-2 py-1 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
 isCalendarFullscreen
 ?"bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-lg shadow-amber-0/20"
 : isStitchLight
 ?"bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink)]"
 :"bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--acc)]/70 /30"
 }`}
 >
 {isCalendarFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
 <span className="hidden sm:inline">{isCalendarFullscreen ?'Salir' :'Pantalla Completa'}</span>
 </button>

 {/* Popover desplegable de configuración de vista por defecto por dispositivo */}
 {showViewConfigPopover && (
 <div className={`absolute top-full right-0 sm:left-0 sm:right-auto mt-2 z-50 w-80 sm:w-96 rounded-[var(--r-l)] p-4 shadow-2xl ${
 isStitchLight
 ?"bg-white text-[var(--ink)] shadow-slate-300/60"
 :"bg-[var(--surface)] border-[var(--hair)]800 text-[var(--ink)] shadow-black/90"
 } animate-in fade-in zoom-in-95 duration-150`}>
 <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[var(--hair)]10">
 <div className="flex items-center gap-2">
 <div className="p-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Settings className="w-3.5 h-3.5" />
 </div>
 <div>
 <h4 className="text-xs font-bold font-display uppercase tracking-wider">
 Vista por defecto
 </h4>
 <p className={`text-[10px] font-mono ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Diferenciada por dispositivo · Supabase
 </p>
 </div>
 </div>
 <button
 onClick={() => setShowViewConfigPopover(false)}
 className="p-1 rounded-md text-[var(--ink-2)] hover:text-[var(--ink)] text-xs cursor-pointer"
 title="Cerrar"
 >
 ✕
 </button>
 </div>

 {/* Selector de dispositivo (Móvil vs Escritorio) */}
 <div className={`p-1 rounded-[var(--r-m)] flex items-center gap-1 mb-3 ${
 isStitchLight ?"bg-[var(--sunken)]" :"bg-[var(--surface)] border-[var(--hair)]800"
 }`}>
 <button
 onClick={() => setSelectedConfigDevice('mobile')}
 className={`flex-1 py-1.5 px-2 rounded-[var(--r-s)] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 selectedConfigDevice ==='mobile'
 ? isStitchLight ?"bg-white text-sky-600 shadow-xs" :"bg-[var(--surface)]/80 text-[var(--acc)]/70 shadow-xs"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 <Smartphone className="w-3.5 h-3.5" />
 <span>Móvil</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--sunken)]">
 {devicePrefs.mobile}M
 </span>
 {currentDeviceType ==='mobile' && (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dispositivo actual" />
 )}
 </button>
 <button
 onClick={() => setSelectedConfigDevice('desktop')}
 className={`flex-1 py-1.5 px-2 rounded-[var(--r-s)] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 selectedConfigDevice ==='desktop'
 ? isStitchLight ?"bg-white text-sky-600 shadow-xs" :"bg-[var(--surface)]/80 text-[var(--acc)]/70 shadow-xs"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 >
 <Monitor className="w-3.5 h-3.5" />
 <span>Ordenador</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--sunken)]">
 {devicePrefs.desktop}M
 </span>
 {currentDeviceType ==='desktop' && (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dispositivo actual" />
 )}
 </button>
 </div>

 <div className="mb-2">
 <span className={`text-[10px] font-mono block ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Al entrar desde un <strong>{selectedConfigDevice ==='mobile' ?'móvil o pantalla estrecha' :'ordenador o pantalla ancha'}</strong>:
 </span>
 </div>

 <div className="space-y-2">
 {/* Opción 1: 1 Mes */}
 <button
 disabled={isSavingPref}
 onClick={() => handleSetDefaultMonthsForDevice('1', selectedConfigDevice)}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start justify-between gap-3 ${
 devicePrefs[selectedConfigDevice] ==='1'
 ? isStitchLight
 ?"bg-sky-50 border-sky-400/80 text-sky-950 shadow-xs"
 :"bg-[var(--acc)]/10 border-[var(--acc)] text-[var(--ink)] shadow-xs"
 : isStitchLight
 ?"bg-[var(--bg)] hover:bg-[var(--sunken)] text-[var(--ink-2)]"
 :"bg-[var(--surface)] hover:bg-[var(--surface)]/80 border-[var(--hair)]800 text-[var(--ink)]"
 }`}
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <span className="font-bold text-xs font-mono">1 Mes</span>
 <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
 devicePrefs[selectedConfigDevice] ==='1'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 : isStitchLight ?"bg-[var(--sunken)] text-[var(--ink-2)]" :"bg-[var(--surface)]/80 text-[var(--ink-2)]"
 }`}>
 {devicePrefs[selectedConfigDevice] ==='1' ?'Predeterminado' :'Recomendado móvil'}
 </span>
 </div>
 <p className={`text-[10px] mt-1 leading-snug ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Vista limpia y despejada de 1 mes (por defecto en dispositivos móviles).
 </p>
 </div>
 {devicePrefs[selectedConfigDevice] ==='1' && (
 <Check className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
 )}
 </button>

 {/* Opción 2: 2 Meses */}
 <button
 disabled={isSavingPref}
 onClick={() => handleSetDefaultMonthsForDevice('2', selectedConfigDevice)}
 className={`w-full text-left p-2.5 rounded-[var(--r-m)] transition-all cursor-pointer flex items-start justify-between gap-3 ${
 devicePrefs[selectedConfigDevice] ==='2'
 ? isStitchLight
 ?"bg-sky-50 border-sky-400/80 text-sky-950 shadow-xs"
 :"bg-[var(--acc)]/10 border-[var(--acc)] text-[var(--ink)] shadow-xs"
 : isStitchLight
 ?"bg-[var(--bg)] hover:bg-[var(--sunken)] text-[var(--ink-2)]"
 :"bg-[var(--surface)] hover:bg-[var(--surface)]/80 border-[var(--hair)]800 text-[var(--ink)]"
 }`}
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <span className="font-bold text-xs font-mono">2 Meses</span>
 <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
 devicePrefs[selectedConfigDevice] ==='2'
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)]" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black"
 : isStitchLight ?"bg-[var(--sunken)] text-[var(--ink-2)]" :"bg-[var(--surface)]/80 text-[var(--ink-2)]"
 }`}>
 {devicePrefs[selectedConfigDevice] ==='2' ?'Predeterminado' :'Recomendado ordenador'}
 </span>
 </div>
 <p className={`text-[10px] mt-1 leading-snug ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 Vista bimestral extendida (por defecto al entrar desde ordenador o pantalla grande).
 </p>
 </div>
 {devicePrefs[selectedConfigDevice] ==='2' && (
 <Check className="w-4 h-4 text-[var(--acc)] shrink-0 mt-0.5" />
 )}
 </button>
 </div>

 {/* Toast feedback */}
 {configToast && (
 <div className="mt-3 p-2 rounded-[var(--r-s)] bg-emerald-500/15 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5 animate-in fade-in">
 <Check className="w-3.5 h-3.5 shrink-0" />
 <span>{configToast}</span>
 </div>
 )}

 <div className={`mt-3 pt-2.5 border-t border-[var(--hair)]10 flex items-center justify-between text-[10px] font-mono ${
 isStitchLight ?"text-[var(--ink-2)]" :"text-[var(--ink-2)]"
 }`}>
 <span className="flex items-center gap-1.5">
 <Cloud className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Sincronizado con Supabase</span>
 </span>
 <span className="font-bold text-[var(--acc)]">
 {selectedConfigDevice ==='mobile' ?'Móvil' :'Ordenador'}: {devicePrefs[selectedConfigDevice]}M
 </span>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Band Filter Mode Segment Toggle */}
 {isMultiBandUser && (
 <div className={`flex items-center rounded-[var(--r-m)] p-1 gap-1 shrink-0 ${
 isStitchLight ?"bg-[var(--sunken)]" :"bg-[var(--bg)]/90 border-[var(--hair)]800"
 }`}>
 <button
 id="calendar-view-all-bands-btn"
 onClick={() => setFilterBandMode("all")}
 className={`flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
 filterBandMode ==="all"
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)] shadow-xs" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-xs"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 title="Ver eventos de todos los grupos"
 >
 <Users className="w-3 h-3 shrink-0" />
 <span className="truncate">Todas las bandas</span>
 <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
 filterBandMode ==="all" ?"bg-[var(--sunken)] text-[var(--ink)]" :"bg-[var(--sunken)]/50 text-[var(--ink-2)]"
 }`}>
 <span className="inline-flex items-center gap-0.5 text-emerald-400" title={`${concerts.length} directos totales`}>
 <Mic className="w-2.5 h-2.5" />
 {concerts.length}
 </span>
 <span className="opacity-30">•</span>
 <span className="inline-flex items-center gap-0.5 text-purple-400" title={`${rehearsals.length} ensayos totales`}>
 <DoorClosed className="w-2.5 h-2.5" />
 {rehearsals.length}
 </span>
 </span>
 </button>

 <button
 id="calendar-view-active-band-btn"
 onClick={() => setFilterBandMode("active")}
 className={`flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
 filterBandMode ==="active"
 ? isStitchLight ?"bg-sky-500 text-[var(--ink)] shadow-xs" :"bg-[var(--acc)] text-[var(--acc-ink)] font-black shadow-xs"
 :"text-[var(--ink-2)] hover:text-[var(--ink-2)]"
 }`}
 title={`Filtrar solo ${activeBandName}`}
 >
 <Music className="w-3 h-3 shrink-0" />
 <span className="truncate max-w-[90px] sm:max-w-none">{activeBandName}</span>
 <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
 filterBandMode ==="active" ?"bg-[var(--sunken)] text-[var(--ink)]" :"bg-[var(--sunken)]/50 text-[var(--ink-2)]"
 }`}>
 <span className="inline-flex items-center gap-0.5 text-emerald-400" title={`${activeBandConcerts.length} directos`}>
 <Mic className="w-2.5 h-2.5" />
 {activeBandConcerts.length}
 </span>
 <span className="opacity-30">•</span>
 <span className="inline-flex items-center gap-0.5 text-purple-400" title={`${activeBandRehearsals.length} ensayos`}>
 <DoorClosed className="w-2.5 h-2.5" />
 {activeBandRehearsals.length}
 </span>
 </span>
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Sync Notifications */}
 {syncSuccessMessage && (
 <div className={`mb-4 p-2 px-3 rounded-[var(--r-s)] text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? (isStitchLight ?'bg-emerald-100 text-emerald-700' :'bg-[var(--surface)]/15 text-[var(--ok)]') 
 : (isStitchLight ?'bg-emerald-100 text-emerald-700' :'bg-[var(--surface)]/15 text-[var(--ok)]')
 }`}>
 <CheckSquare className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
 <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}
 {syncErrorMessage && (
 <div className={`mb-4 p-2 px-3 rounded-[var(--r-s)] text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ?'bg-rose-500/15 text-rose-400' 
 :'bg-rose-500/15 text-rose-400'
 }`}>
 <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncErrorMessage}</span>
 <button onClick={() => setSyncErrorMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}

 {/* Month Grids Container (Single or Dual) con soporte para cambiar de mes deslizando (Touch/Mouse/Trackpad) */}
 <div
 className="relative overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing rounded-[var(--r-l)]"
 onTouchStart={handleTouchStart}
 onTouchMove={handleTouchMove}
 onTouchEnd={handleTouchEnd}
 onTouchCancel={handleTouchCancel}
 onMouseDown={handleMouseDown}
 onMouseMove={handleMouseMove}
 onMouseUp={handleMouseUp}
 onMouseLeave={handleMouseLeave}
 onWheel={handleWheel}
 >
 <AnimatePresence mode="wait" custom={slideDirection}>
 <motion.div
 key={`${calendarViewMode}-${currentYear}-${currentMonth}`}
 custom={slideDirection}
 variants={{
 enter: (direction:'left' |'right' | null) => ({
 x: direction ==='left' ? 30 : direction ==='right' ? -30 : 0,
 opacity: 0.85,
 }),
 center: {
 x: 0,
 opacity: 1,
 },
 exit: (direction:'left' |'right' | null) => ({
 x: direction ==='left' ? -30 : direction ==='right' ? 30 : 0,
 opacity: 0.85,
 }),
 }}
 initial={slideDirection ?"enter" : false}
 animate="center"
 exit="exit"
 transition={{ duration: 0.18, ease:"easeOut" }}
 style={dragOffset !== 0 ? { transform: `translateX(${dragOffset}px)` } : undefined}
 className={`flex flex-col ${calendarViewMode ==='2m' ?'xl:flex-row gap-6' :'gap-4'} transition-transform duration-75`}
 >
 {calendarViewMode ==='week' ? (
 renderWeekView()
 ) : calendarViewMode ==='agenda' ? (
 renderAgendaView()
 ) : (
 <>
 {renderMonthGrid(currentYear, currentMonth, calendarViewMode ==='2m')}
 {calendarViewMode ==='2m' && renderMonthGrid(nextMonthYear, nextMonth, true)}
 </>
 )}
 </motion.div>
 </AnimatePresence>
 </div>

 {/* SELECTED DAY AGENDA CARD - Inmediatamente visible bajo el calendario */}
 <div
 id="calendar-selected-day-banner"
 className={`mt-5 p-4 rounded-[var(--r-l)] transition-all duration-200 ${
 isStitchLight
 ?'bg-white shadow-sm'
 :'bg-[var(--surface)]/95 border-[var(--hair)]800 shadow-xl'
 }`}
 >
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--hair)]10">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-[var(--r-m)] flex flex-col items-center justify-center font-mono font-black shrink-0 ${
 isStitchLight
 ?'bg-sky-50 border-sky-200 text-sky-700'
 :'bg-[var(--acc)]/15 /40 text-[var(--acc)]/70'
 }`}>
 <span className="text-sm leading-none">{selectedDate.getDate()}</span>
 <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">
 {monthNames[selectedDate.getMonth()]?.slice(0, 3)}
 </span>
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className={`text-sm sm:text-base font-bold font-display capitalize ${textTitle}`}>
 {selectedDate.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
 </h4>
 {dayEventsList.length > 0 && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70">
 {dayEventsList.length} {dayEventsList.length === 1 ?'evento' :'eventos'}
 </span>
 )}
 </div>
 <p className={`text-[11px] font-mono ${textSub}`}>
 {dayEventsList.length === 0
 ?'Día libre · Sin actividad programada'
 : selectedConcert
 ? `Concierto en ${selectedConcert.sala}${selectedConcert.ciudad ? ` (${selectedConcert.ciudad})` :''}`
 : selectedRehearsal
 ? (selectedRehearsal.tipo_evento ==='reunion' ? `Reunión: ${selectedRehearsal.asunto ||'Coordinación'}` : `Ensayo en ${selectedRehearsal.lugar}`)
 :'Eventos del día'}
 </p>
 </div>
 </div>

 {/* Botones de acción rápida para la fecha seleccionada */}
 <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
 <button
 type="button"
 onClick={() => setShowCreateModal('concert')}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-[var(--acc)]/15 hover:bg-[var(--acc)]/25 text-[var(--acc)]/70 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 >
 <span>🎸</span> + Concierto
 </button>
 <button
 type="button"
 onClick={() => setShowCreateModal('rehearsal')}
 className="px-2.5 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 >
 <span>🥁</span> + Ensayo
 </button>
 </div>
 </div>

 {/* Contenido de eventos del día */}
 {dayEventsList.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8">
 <PublicoSilhouette opacity={12} size="small" />
 <p className={`text-xs font-medium ${textSub} mt-4`}>
 Ningún evento programado
 </p>
 <p className={`text-[10px] ${textMuted} mt-2 max-w-xs`}>
 Pulsa <span className="text-[var(--acc)] font-bold">+ Concierto</span> o <span className="text-[var(--ok)] font-bold">+ Ensayo</span> para agendar.
 </p>
 </div>
 ) : (
 <div className="mt-3 space-y-2.5">
 {/* Selector de eventos si el día tiene más de uno */}
 {hasMultipleDayEvents && (
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2">
 <span className="text-[10px] font-mono text-[var(--ink-2)] shrink-0 mr-1">Ver evento:</span>
 {dayEventsList.map(evt => {
 const isActive = evt.id === activeDayEventId;
 return (
 <button
 key={evt.id}
 type="button"
 onClick={() => setSelectedEventId(evt.id)}
 className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 ${
 isActive
 ? evt.kind ==='concert'
 ?'bg-[var(--acc)]/30 text-[var(--ink)] shadow-xs'
 :'bg-emerald-500/30 border-emerald-400 text-[var(--ink)] shadow-xs'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-[var(--surface)]/70'
 }`}
 >
 {evt.label}
 </button>
 );
 })}
 </div>
 )}

 {/* Tarjeta detallada del concierto activo */}
 {selectedConcert && (() => {
 const bandInfo = getBandIdentity(selectedConcert.band_id, (selectedConcert as any).bandName || (selectedConcert as any).band_name);
 return (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc-soft)] space-y-2.5">
 <div className="flex items-start justify-between gap-3 flex-wrap">
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-[var(--acc)] text-[var(--acc-ink)] shadow-xs">
 🎸 Concierto
 </span>
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
 {bandInfo.name}
 </span>
 {selectedConcert.cache ? (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-[var(--acc)]/70 bg-[var(--acc)]/10">
 💰 {selectedConcert.cache.toLocaleString('es-ES')} €
 </span>
 ) : null}
 <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
 selectedConcert.estado_pago ==='pagado'
 ?'bg-emerald-500/20 text-[var(--ink-2)]'
 : selectedConcert.estado_pago ==='anticipo'
 ?'bg-blue-500/20 text-blue-300'
 :'bg-[var(--acc)]/20 text-[var(--acc)]/70'
 }`}>
 {selectedConcert.estado_pago ==='pagado' ?'✓ Cobrado' : selectedConcert.estado_pago ==='anticipo' ?'Anticipo recibido' :'Pendiente cobro'}
 </span>
 </div>
 <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle} flex items-center gap-1.5 flex-wrap`}>
 <span>{selectedConcert.sala}</span>
 {selectedConcert.ciudad && (
 <span className="text-[var(--acc)] font-normal text-sm sm:text-base">
 ({selectedConcert.ciudad})
 </span>
 )}
 </h3>
 {selectedConcert.direccion && (
 <p className="text-[10px] font-mono text-[var(--ink-2)] mt-0.5">
 📍 {selectedConcert.direccion}
 </p>
 )}
 </div>

 {/* Botones de acción: Accesos directos y Abrir Ficha */}
 <div className="flex items-center gap-1.5 flex-wrap">
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('tecnica');
 setShowEventFichaModal(true);
 }}
 className="px-2 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 title="1. Logística técnica y rider"
 >
 <Wrench className="w-3 h-3" />
 <span>1. Técnica</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('contactos');
 setShowEventFichaModal(true);
 }}
 className="px-2 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 title="2. Contactos clave y WhatsApp directo"
 >
 <Phone className="w-3 h-3" />
 <span>2. Contactos</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('cierre');
 setShowEventFichaModal(true);
 }}
 className="px-2 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 title="5. Checklist de cierre de material y carga de furgoneta"
 >
 <ShieldCheck className="w-3 h-3" />
 <span>5. Cierre Material</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('resumen');
 setShowEventFichaModal(true);
 }}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-black bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-0/20 transition-all active:scale-95"
 >
 <Maximize2 className="w-3.5 h-3.5" />
 <span>Abrir Ficha Completa</span>
 </button>
 </div>
 </div>

 {/* Fila de metadatos adicionales */}
 <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--ink)] flex-wrap pt-1 border-t /20">
 {selectedConcert.aforo_total ? (
 <span className="flex items-center gap-1">
 <span>👥</span> Aforo: {selectedConcert.aforo_vendido || 0} / {selectedConcert.aforo_total}
 </span>
 ) : null}
 <span className="flex items-center gap-1">
 <span>📄</span> {selectedConcert.contrato_firmado ?'Contrato firmado' :'Contrato pendiente'}
 </span>
 {selectedConcert.tipo && (
 <span className="flex items-center gap-1 uppercase opacity-80">
 <span>🏷️</span> Tipo: {selectedConcert.tipo}
 </span>
 )}
 </div>

 {/* Botones secundarios */}
 <div className="flex items-center gap-2 pt-1 flex-wrap">
 <button
 type="button"
 onClick={() => {
 setReminderNotes('');
 setReminderSuccessMsg(null);
 setReminderErrorMsg(null);
 setShowReminderModal(true);
 }}
 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-sky-300 flex items-center gap-1 cursor-pointer"
 >
 <Bell className="w-3 h-3 text-sky-400" />
 <span>Notificar Banda</span>
 </button>
 <button
 type="button"
 onClick={() => setViewingConcert(selectedConcert)}
 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70 flex items-center gap-1 cursor-pointer"
 >
 <Edit className="w-3 h-3 text-[var(--acc)]" />
 <span>Editar Concierto</span>
 </button>
 {(selectedConcert.direccion || selectedConcert.sala) && (
 <a
 href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
 selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`
 )}`}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
 >
 <MapPin className="w-3 h-3 text-emerald-400" />
 <span>Google Maps</span>
 </a>
 )}
 </div>
 </div>
 );
 })()}

 {/* Tarjeta detallada del ensayo activo */}
 {selectedRehearsal && (() => {
 const isReu = selectedRehearsal.tipo_evento ==='reunion';
 const bandInfo = getBandIdentity(selectedRehearsal.band_id, (selectedRehearsal as any).bandName || (selectedRehearsal as any).band_name);
 return (
 <div className={`p-3.5 rounded-[var(--r-m)] space-y-2.5 ${
 isReu
 ?'bg-indigo-950/20 border-indigo-500/40'
 :'bg-[var(--ok-soft)] border-emerald-500/40'
 }`}>
 <div className="flex items-start justify-between gap-3 flex-wrap">
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider ${
 isReu ?'bg-indigo-500 text-white' :'bg-emerald-500 text-[var(--acc-ink)]'
 }`}>
 {isReu ?'🤝 Reunión' :'🥁 Ensayo'}
 </span>
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 text-[var(--ink-2)]">
 {bandInfo.name}
 </span>
 {selectedRehearsal.hora && (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[var(--ink)] bg-[var(--surface)]/80">
 🕒 {selectedRehearsal.hora}
 </span>
 )}
 </div>
 <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle}`}>
 {isReu ? (selectedRehearsal.asunto ||'Reunión de Banda') : selectedRehearsal.lugar}
 </h3>
 {isReu && selectedRehearsal.enlace_reunion && (
 <p className="text-[10px] font-mono text-sky-400 mt-0.5 truncate">
 🔗 {selectedRehearsal.enlace_reunion}
 </p>
 )}
 {!isReu && selectedRehearsal.notas && (
 <p className="text-[10px] font-mono text-[var(--ink-2)] mt-0.5 line-clamp-2">
 📝 {selectedRehearsal.notas}
 </p>
 )}
 </div>

 {/* Botón de acción principal: Abrir Ficha */}
 <button
 type="button"
 onClick={() => setShowEventFichaModal(true)}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
 isReu
 ?'bg-indigo-500 hover:bg-indigo-400 text-[var(--ink)] shadow-indigo-500/20'
 :'bg-emerald-500 hover:bg-emerald-400 text-[var(--acc-ink)] shadow-emerald-500/20'
 }`}
 >
 <Maximize2 className="w-3.5 h-3.5" />
 <span>Abrir Ficha</span>
 </button>
 </div>

 {/* Fila de asistentes */}
 {(() => {
 const raw = selectedRehearsal.asistentes;
 let list: string[] = [];
 if (Array.isArray(raw)) {
 list = raw;
 } else if (typeof raw ==='string' && (raw as string).trim()) {
 const s = (raw as string).trim();
 if (s.startsWith('[') && s.endsWith(']')) {
 try {
 const p = JSON.parse(s);
 if (Array.isArray(p)) list = p;
 } catch {}
 }
 if (list.length === 0) {
 list = s.split(',').map(x => x.trim()).filter(Boolean);
 }
 }
 if (list.length === 0) return null;
 return (
 <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--ink)] flex-wrap pt-1 border-t border-[var(--hair)]10">
 <span className="text-[var(--ink-2)]">Convocados:</span>
 {list.map((a, i) => (
 <span key={i} className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">
 {typeof a ==='string' ? a : String(a)}
 </span>
 ))}
 </div>
 );
 })()}

 {/* Botones secundarios */}
 <div className="flex items-center gap-2 pt-1 flex-wrap">
 <button
 type="button"
 onClick={() => {
 setReminderNotes('');
 setReminderSuccessMsg(null);
 setReminderErrorMsg(null);
 setShowReminderModal(true);
 }}
 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-sky-300 flex items-center gap-1 cursor-pointer"
 >
 <Bell className="w-3 h-3 text-sky-400" />
 <span>Notificar Convocatoria</span>
 </button>
 <button
 type="button"
 onClick={() => setViewingRehearsal(selectedRehearsal)}
 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] flex items-center gap-1 cursor-pointer"
 >
 <Edit className="w-3 h-3 text-emerald-400" />
 <span>Editar Ensayo</span>
 </button>
 </div>
 </div>
 );
 })()}
 </div>
 )}
 </div>

 {/* Legend */}
 <div className={`flex flex-wrap gap-4 text-[10px] font-mono pt-4 mt-6 ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ?'bg-sky-500' :'bg-[var(--acc)] shadow-[0_0_8px_var(--acc)]'}`} />
 <span>Concierto</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ?'bg-[var(--surface)]' :'bg-[var(--ok)] shadow-[0_0_8px_var(--ok)]'}`} />
 <span>Ensayo</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
 <span>Reunión</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
 <span>Posible concierto</span>
 </div>
 </div>
 </div>

 {/* RIGHT: LOGISTICS & CHECKLISTS SIDEBAR (1/3 width) */}
 <div className={`${colors.card} p-5 flex flex-col justify-between lg:col-span-1`}>
 {selectedEventDetails.type ==='free' ? (
 <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
 {getCampaignsForDate(selectedDateKey).length > 0 ? (
 <div className="w-full text-left rounded-[var(--r-l)] bg-gradient-to-br from-purple-950/40 via-purple-900/20 to-[var(--surface)] p-4 shadow-xl shadow-purple-950/20">
 <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-purple-500/30">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-[var(--r-s)] bg-purple-500/20 text-purple-300 flex items-center justify-center">
 <Target className="w-4 h-4" />
 </div>
 <div>
 <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
 🎯 Fecha Objetivo de Campaña
 </span>
 <p className="text-[11px] font-mono text-[var(--ink-2)] font-bold mt-0.5">
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>
 </div>
 </div>

 {getCampaignsForDate(selectedDateKey).map(camp => (
 <div key={camp.id} className="pt-3 space-y-2">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-bold font-display text-[var(--ink)] flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: camp.color ||'#8b5cf6' }} />
 {camp.name}
 </h4>
 {camp.isActive && (
 <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-purple-500 text-[var(--ink)]">
 ACTIVA
 </span>
 )}
 </div>

 <div className="flex flex-wrap gap-2 text-xs text-[var(--ink)]">
 <span className="inline-flex items-center gap-1 text-sky-300 text-[11px]">
 <MapPin className="w-3 h-3 text-sky-400" />
 {camp.targetCities?.join(',') ||'Cualquier ciudad'}
 </span>
 <span className="inline-flex items-center gap-1 text-[var(--acc)]/70 text-[11px]">
 <Users className="w-3 h-3 text-[var(--acc)]" />
 {camp.minCapacity} - {camp.maxCapacity} pax
 </span>
 </div>

 {camp.notes && (
 <p className="text-[11px] text-[var(--ink-2)] italic bg-black/20 p-2 rounded-[var(--r-m)]">
 &ldquo;{camp.notes}&rdquo;
 </p>
 )}

 <div className="pt-2 flex flex-col sm:flex-row gap-2">
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('booking', { campaignFilter: camp.id })}
 className="flex-1 py-1.5 px-2.5 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
 >
 <Building2 className="w-3 h-3 text-purple-300" />
 <span>Salas CRM</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => {
 setConcCiudad(camp.targetCities?.[0] ||'Madrid');
 setConcAforo(String(camp.minCapacity || 250));
 setConcNotas(`Concierto agendado para la campaña"${camp.name}".`);
 setShowCreateModal('concert');
 }}
 className="flex-1 py-1.5 px-2.5 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-purple-600 hover:bg-purple-500 text-[var(--ink)] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
 >
 <Plus className="w-3 h-3" />
 <span>Confirmar Concierto</span>
 </button>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <>
 <div className={`p-3 rounded-full ${isStitchLight ?'bg-[var(--sunken)] text-[var(--ink-2)]' :'bg-[var(--surface)]/80 text-[var(--ink-2)]'}`}>
 <Calendar className="w-6 h-6" />
 </div>
 <div>
 <p className={`text-xs font-mono font-bold uppercase tracking-wider ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 <h4 className={`text-sm font-bold font-display mt-1 ${textTitle}`}>
 Día sin eventos agendados
 </h4>
 <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
 Selecciona un día con concierto en el calendario para ver su logística y ubicación GPS.
 </p>
 </div>
 <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
 <button
 type="button"
 onClick={() => setShowCreateModal('rehearsal')}
 className={`py-1.5 px-3 rounded-[var(--r-m)] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight 
 ?'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25' 
 :'bg-[var(--surface)]/20 text-[var(--ok)] hover:bg-[var(--surface)]/30'
 }`}
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Agendar Ensayo</span>
 </button>

 <button
 type="button"
 onClick={() => setShowCreateModal('concert')}
 className={`py-1.5 px-3 rounded-[var(--r-m)] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
 isStitchLight 
 ?'bg-[var(--acc)]/15 text-amber-600 hover:bg-[var(--acc)]/25' 
 :'bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/50/30'
 }`}
 >
 <Plus className="w-3.5 h-3.5" />
 <span>+ Agendar Concierto</span>
 </button>
 </div>
 </>
 )}

 {/* Quick GPS & Upcoming Events List */}
 <div className={`w-full text-left mt-4 pt-3 space-y-2.5 ${isStitchLight ?'border-t' :'border-t'}`}>
 <div className="flex items-center justify-between gap-1 flex-wrap">
 <div className={`flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`}>
 <MapPin className="w-3.5 h-3.5" />
 <span>Próximas Fechas ({upcomingCalendarEvents.length})</span>
 </div>

 {/* Filter Buttons */}
 <div className="flex items-center gap-1">
 {[
 { id:'todos', label:'Todas' },
 { id:'conciertos', label:'Bolos' },
 { id:'campañas', label:'🎯 Campañas' }
 ].map(f => (
 <button
 key={f.id}
 onClick={() => setUpcomingFilter(f.id as any)}
 className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
 upcomingFilter === f.id
 ?'bg-[var(--acc)]/60/20 text-[var(--acc)]/70'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
 {upcomingCalendarEvents.filter(evt => {
 if (upcomingFilter ==='conciertos') return evt.type ==='concierto';
 if (upcomingFilter ==='ensayos') return evt.type ==='ensayo';
 if (upcomingFilter ==='campañas') return evt.type ==='campaña';
 return true;
 }).length === 0 ? (
 <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>
 No hay próximas fechas con el filtro seleccionado.
 </p>
 ) : (
 upcomingCalendarEvents.filter(evt => {
 if (upcomingFilter ==='conciertos') return evt.type ==='concierto';
 if (upcomingFilter ==='ensayos') return evt.type ==='ensayo';
 if (upcomingFilter ==='campañas') return evt.type ==='campaña';
 return true;
 }).map(evt => (
 <div
 key={evt.id}
 onClick={() => {
 if (evt.fecha) {
 const p = evt.fecha.split('-');
 if (p.length === 3) {
 setSelectedDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)));
 setViewDate(new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, 1));
 }
 }
 }}
 className={`p-2.5 rounded-[var(--r-m)] flex items-start gap-3 transition-all cursor-pointer ${
 evt.type ==='campaña'
 ?'bg-purple-950/20 hover:border-purple-500/50'
 : isStitchLight ?'bg-white hover:border-sky-400 hover:shadow-sm' :'bg-[var(--surface)] hover:/40 border-[var(--hair)]800'
 }`}
 >
 {/* Custom calendar badge: Day number top, short month bottom */}
 <div className={`w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 shadow-sm ${
 evt.type ==='campaña'
 ?'bg-purple-900/30 border-purple-500/40 text-purple-200'
 : isStitchLight ?'bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--surface)] /30 text-[var(--ink-2)]'
 }`}>
 <span className={`text-base font-mono font-black leading-none ${
 evt.type ==='campaña' ?'text-purple-300' : isStitchLight ?'text-sky-500' :'text-[var(--acc)]'
 }`}>
 {evt.day}
 </span>
 <span className={`text-[9px] font-mono font-extrabold uppercase tracking-widest mt-0.5 ${
 evt.type ==='campaña' ?'text-purple-200' : isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--acc)]/70'
 }`}>
 {evt.month}
 </span>
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
 evt.type ==='concierto'
 ? isStitchLight ?'bg-sky-500/15 text-sky-400' :'bg-[var(--acc)]/20 text-[var(--acc)]/70'
 : evt.type ==='campaña'
 ?'bg-purple-500/20 text-purple-300'
 : isStitchLight ?'bg-emerald-100 text-emerald-700' :'bg-emerald-500/20 text-[var(--ink-2)]'
 }`}>
 {evt.type ==='campaña' ?'🎯 Posible Bolo' : evt.type}
 </span>
 {evt.bandName && (
 <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[var(--sunken)]/80 text-[var(--ink)] truncate max-w-[100px]" title={evt.bandName}>
 {evt.bandName}
 </span>
 )}
 </div>
 <div className="text-xs sm:text-sm font-bold font-display text-[var(--ink)] mt-1 truncate">
 {evt.title}
 </div>
 {evt.direccion && (
 <p className={`text-[10px] font-sans ${textSub} mt-0.5`}>📍 {evt.direccion}</p>
 )}
 {evt.type !=='campaña' ? (
 <div className="mt-1 flex justify-center">
 <DirectionsCard 
 query={evt.locationQuery} 
 locationName={evt.salaOrLugar} 
 address={evt.direccion || evt.ciudad} 
 isStitchLight={isStitchLight} 
 />
 </div>
 ) : (
 <p className="text-[10px] font-mono text-purple-300/80 mt-0.5">
 {evt.salaOrLugar}
 </p>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 ) : (
 <div id="calendar-event-detail-sidebar" className="concert-detail-view">
 {/* Day details */}
 <div className={`pb-4 mb-4 flex items-center gap-3 border-b ${isStitchLight ?'' :'border-[var(--hair)]'}`}>
 <div className={`w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 shadow-sm ${
 isStitchLight ?'bg-[var(--sunken)] text-[var(--ink)]' :'bg-[var(--surface)] /30 text-[var(--ink-2)]'
 }`}>
 <span className={`text-base font-mono font-black leading-none ${isStitchLight ?'text-sky-500' :'text-[var(--acc)]'}`}>
 {selectedDate.getDate()}
 </span>
 <span className={`text-[9px] font-mono font-extrabold uppercase tracking-widest mt-0.5 ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--acc)]/70'}`}>
 {monthNames[selectedDate.getMonth()]?.slice(0, 3).toUpperCase()}
 </span>
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`}>Logística de Ensayos y Conciertos</div>
 {(selectedConcert || selectedRehearsal) && (
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 shadow-xs flex items-center gap-1">
 🎸 Banda: {getEventBandName(selectedConcert || selectedRehearsal)}
 </span>
 )}
 </div>
 <h3 className={`text-lg font-bold font-display tracking-wide mt-0.5 ${textTitle}`}>{selectedEventTitle}</h3>
 <p className={`text-[10px] font-mono mt-0.5 ${textSub}`}>
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>
 <div className="flex flex-col gap-1.5 shrink-0 self-start">
 {(selectedConcert || selectedRehearsal) && (
 <button
 type="button"
 onClick={() => setShowEventFichaModal(true)}
 className={`hidden lg:flex px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer items-center gap-1 ${
 isStitchLight
 ?'bg-amber-50 text-amber-800 hover:bg-amber-100'
 :'bg-gradient-to-r from-amber-0/20 to-yellow-600/20 /60 text-[var(--acc)]/70 hover:from-amber-0/30 hover:to-yellow-600/30'
 }`}
 title="Ampliar esta ficha en un modal centrado"
 >
 <Maximize2 className="w-3 h-3" />
 Ampliar
 </button>
 )}
 {(selectedConcert || selectedRehearsal) && (
 <button
 type="button"
 onClick={() => {
 setReminderNotes('');
 setReminderSuccessMsg(null);
 setReminderErrorMsg(null);
 setShowReminderModal(true);
 }}
 className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer flex items-center gap-1 ${
 isStitchLight
 ?'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
 :'bg-[var(--surface)] border-sky-500/40 text-sky-300 hover:bg-[var(--surface)]/80'
 }`}
 title="Enviar un recordatorio por correo/notificación a los convocados"
 >
 🔔 Notificar Banda
 </button>
 )}
 {selectedConcert && (
 <button
 type="button"
 onClick={() => setViewingConcert(selectedConcert)}
 className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer flex items-center gap-1 ${
 isStitchLight
 ?'bg-amber-50 text-amber-800 hover:bg-amber-100'
 :'bg-[var(--surface)] /40 text-[var(--acc)]/70 hover:bg-[var(--surface)]/80'
 }`}
 title="Editar ficha completa del concierto"
 >
 ✎ Editar Ficha
 </button>
 )}
 {selectedRehearsal && (
 <button
 type="button"
 onClick={() => setViewingRehearsal(selectedRehearsal)}
 className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer flex items-center gap-1 ${
 isStitchLight
 ?'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
 :'bg-[var(--surface)] border-emerald-500/40 text-[var(--ink-2)] hover:bg-[var(--surface)]/80'
 }`}
 title="Editar ficha completa del ensayo"
 >
 ✎ Editar Ficha
 </button>
 )}
 {selectedConcert && onDeleteConcert && (
 <button
 type="button"
 onClick={() => {
 if (window.confirm(`¿Eliminar el concierto en ${selectedConcert.sala}? Esta acción no se puede deshacer.`)) {
 setSelectedEventId(null);
 onDeleteConcert(selectedConcert.id);
 }
 }}
 className="px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50"
 >
 🗑 Eliminar
 </button>
 )}
 {selectedRehearsal && onDeleteRehearsal && (
 <button
 type="button"
 onClick={() => {
 if (window.confirm(`¿Eliminar este ensayo en ${selectedRehearsal.lugar}? Esta acción no se puede deshacer.`)) {
 setSelectedEventId(null);
 onDeleteRehearsal(selectedRehearsal.id);
 }
 }}
 className="px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/50"
 >
 🗑 Eliminar
 </button>
 )}
 </div>
 </div>

 {/* Selector de eventos: cuando el día tiene más de uno (2 conciertos, o concierto + ensayo),
 el panel de arriba solo muestra uno a la vez. Estos chips dejan entrar a cada uno. */}
 {hasMultipleDayEvents && (
 <div className="flex flex-wrap gap-1.5 mb-4 -mt-2">
 {dayEventsList.map(evt => {
 const isActive = evt.id === activeDayEventId;
 return (
 <button
 key={evt.id}
 type="button"
 onClick={() => setSelectedEventId(evt.id)}
 className={`px-2 py-1 rounded-full text-[9px] font-mono font-bold transition-colors cursor-pointer ${
 isActive
 ? (evt.kind ==='concert'
 ?'bg-[var(--acc)]/30 text-[var(--ink)]'
 :'bg-emerald-500/30 border-emerald-400 text-[var(--ink)]')
 : (isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface)]/80')
 }`}
 >
 {evt.label}
 </button>
 );
 })}
 </div>
 )}

 {/* Previsión Meteorológica Rápida en Panel Lateral */}
 {(selectedConcert?.ciudad || (selectedRehearsal?.lugar && selectedRehearsal.lugar.length > 2)) && (
 <div className="mb-4">
 <EventWeatherCard
 city={selectedConcert?.ciudad || selectedRehearsal?.lugar?.split(',')[1]?.trim() || selectedRehearsal?.lugar?.split('-')[1]?.trim() || selectedRehearsal?.lugar ||''}
 dateStr={selectedDateKey}
 timeStr={selectedConcert ?'21:30' : (selectedRehearsal?.hora ||'18:00')}
 isStitchLight={isStitchLight}
 />
 </div>
 )}

 {/* Core Info */}
 <div className={`space-y-3 mb-6 rounded-[var(--r-s)] p-3 ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'
 }`}>
 <div className="flex items-center gap-2 text-[10px]">
 <Clock className={`w-4 h-4 shrink-0 ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`} />
 <span className={`font-mono ${textSub}`}>Hora:</span>
 <span className={`font-bold font-mono ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`}>{selectedEventDetails.time}</span>
 </div>
 <div className="flex items-start gap-2 text-[10px]">
 <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`} />
 <div className="flex-1">
 <span className={`font-mono ${textSub}`}>Lugar:</span>
 <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
 {selectedEventDetails.direccion && (
 <p className={`text-[10px] font-sans mt-1 ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink)]'}`}>
 <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
 </p>
 )}
 </div>
 </div>
 {selectedEventDetails.locationQuery && selectedEventDetails.type !=='free' && (
 <div className="pt-3 mt-2.5 flex justify-center">
 <DirectionsCard 
 query={selectedEventDetails.locationQuery} 
 locationName={selectedEventDetails.lugar} 
 address={selectedEventDetails.direccion} 
 isStitchLight={isStitchLight} 
 />
 </div>
 )}
 {!isPromoPlan && selectedEventDetails.type ==='concert' && (
 <div className={`flex items-center gap-2 text-[10px] pt-2 mt-1 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <Sparkles className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className={`font-mono ${textSub}`}>Compensación:</span>
 <span className="text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
 </div>
 )}
 {selectedEventDetails.type ==='concert' && (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
 <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t /40">
 {selectedEventDetails.entradasUrl && (
 <a
 href={selectedEventDetails.entradasUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-emerald-500 text-[var(--acc-ink)] hover:bg-emerald-400 transition-colors w-fit"
 >
 <Ticket className="w-3.5 h-3.5" /> Comprar Entradas
 </a>
 )}
 {selectedEventDetails.entradasLugarFisico && (
 <div className="flex items-center gap-2 text-[10px]">
 <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className={`font-mono ${textSub}`}>También en:</span>
 <span className="font-semibold font-mono">{selectedEventDetails.entradasLugarFisico}</span>
 </div>
 )}
 </div>
 )}
 {!isPromoPlan && selectedEventDetails.type ==='concert' && selectedConcert && (() => {
 const g = selectedConcert.gastosDetalle;
 const totalG = g ? ((g.gasolina || 0) + (g.dietas || 0) + (g.alquilerVehiculo || 0) + (g.alojamiento || 0) + (g.otros || 0)) : (selectedConcert.gastosEstimadosTipicos || 150);
 const net = (selectedConcert.cache || 0) - totalG;
 return (
 <div className={`flex items-center justify-between text-[10px] pt-1.5 mt-1`}>
 <span className={`font-mono ${textSub}`}>Rentabilidad neta:</span>
 <span className={`font-bold font-mono px-2 py-0.5 rounded-full ${
 net < 0 ?'bg-[var(--alert-soft)] text-rose-400' :
 net < 150 ?'bg-[var(--acc-soft)] text-[var(--acc)]/70' :'bg-[var(--ok-soft)] text-emerald-400'
 }`}>
 {net >= 0 ? `+${net}€ Neto` : `${net}€ En pérdidas`}
 </span>
 </div>
 );
 })()}
 {selectedEventDetails.notes && (
 <div className={`text-[10px] font-sans italic pt-2 leading-relaxed ${isStitchLight ?'-slate-100 text-[var(--ink-2)]' :'-bg-[var(--surface)] text-[var(--ink-2)]'}`}>
 &ldquo;{selectedEventDetails.notes}&rdquo;
 </div>
 )}

 {selectedConcert?.giraNombre && (
 <div className="flex items-center gap-2 text-[10px] pt-2 border-t /60 mt-2">
 <Navigation className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span className={`font-mono ${textSub}`}>Gira:</span>
 <span className="font-bold font-mono text-[var(--acc)]">
 🚐 {selectedConcert.giraNombre}
 </span>
 </div>
 )}

 {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
 <div className="flex items-center gap-2 text-[10px] pt-2 border-t /60 mt-2">
 <Users className="w-4 h-4 text-sky-400 shrink-0" />
 <span className={`font-mono ${textSub}`}>Convocatoria:</span>
 <span className="font-bold font-mono text-sky-400">
 {(selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) ==='completa'
 ?'Banda Completa'
 : `Parcial (${(() => {
 const raw: any = selectedConcert?.convocados_nombres || selectedRehearsal?.convocados_nombres;
 if (Array.isArray(raw)) return raw.join(',') ||'Seleccionados';
 if (typeof raw ==='string' && raw.trim()) return raw.trim();
 return'Seleccionados';
 })()})`}
 </span>
 </div>
 )}

 {/* WIDGET QR DEL CONCIERTO (ACCESO RÁPIDO & CONFIGURACIÓN) */}
 {selectedConcert && (() => {
 const host = typeof window !=='undefined' ? window.location.origin :'https://bandmanager.io';
 const cleanCity = (selectedConcert.ciudad ||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const cleanSala = (selectedConcert.sala ||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
 const bandCode = (selectedConcert.band_id || currentBandId || activeBandId ||'').replace(/^(band|reg)-/,'');
 const defaultUrl = `${host}/unete${cleanCity || cleanSala ? `/${cleanCity}-${cleanSala}` :''}${bandCode ? `?band=${encodeURIComponent(bandCode)}` :''}`;
 const targetQrUrl = selectedConcert.customQrUrl || defaultUrl;

 return (
 <div className={`mt-3 pt-3 border-t ${isStitchLight ?'' :'/80'}`}>
 <div className="flex items-center justify-between gap-1 mb-2">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--acc)]">
 <QrCode className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
 <span>QR Bolo & Captación Fans:</span>
 </div>
 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('fans', { concertId: selectedConcert.id })}
 className="text-[9px] font-mono text-[var(--acc)]/90 hover:text-[var(--acc)]/70 hover:underline flex items-center gap-1 cursor-pointer font-bold"
 title="Configurar el QR y la experiencia del fan para este concierto"
 >
 <Settings className="w-3 h-3 text-[var(--acc)]" />
 <span>Configurar</span>
 </button>
 )}
 </div>

 <div className={`p-2 rounded-[var(--r-m)] flex items-center gap-2.5 ${
 isStitchLight ?'bg-white shadow-sm' :'bg-[var(--surface)]/80'
 }`}>
 <div 
 onClick={() => onNavigate?.('fans', { concertId: selectedConcert.id })}
 className="p-1 bg-white rounded-[var(--r-s)] shadow shrink-0 cursor-pointer hover:scale-105 transition-transform"
 title="Haz clic para abrir la configuración del QR"
 >
 <QRCode value={targetQrUrl} size={58} level="M" />
 </div>

 <div className="flex-1 min-w-0 space-y-1.5">
 <p className="text-[9px] font-mono text-[var(--ink-2)] truncate break-all bg-[var(--surface)]/60 p-1 rounded text-[var(--acc)]/70 font-semibold" title={targetQrUrl}>
 {targetQrUrl}
 </p>
 <div className="flex items-center gap-1.5">
 <a
 href={targetQrUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors"
 >
 <ExternalLink className="w-2.5 h-2.5" /> Abrir
 </a>
 <button
 type="button"
 onClick={() => {
 navigator.clipboard.writeText(targetQrUrl);
 setCopiedQrId(selectedConcert.id);
 setTimeout(() => setCopiedQrId(null), 2000);
 }}
 className="px-2 py-0.5 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
 >
 {copiedQrId === selectedConcert.id ? (
 <>
 <Check className="w-2.5 h-2.5 text-emerald-400" />
 <span className="text-emerald-400">¡Copiado!</span>
 </>
 ) : (
 <>
 <Copy className="w-2.5 h-2.5 text-[var(--ink-2)]" />
 <span>Copiar</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })()}
 {/* WIDGET REUNIÓN (ENLACE VIDEOCONFERENCIA / ASUNTO) */}
 {selectedRehearsal?.tipo_evento ==='reunion' && (
 <div className={`mt-3 pt-3 border-t ${isStitchLight ?'' :'/80'}`}>
 <div className="flex items-center justify-between gap-1 mb-2">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-indigo-400">
 <Video className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
 <span>Detalles de la Reunión:</span>
 </div>
 <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
 🤝 Coordinación
 </span>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] space-y-2 ${
 isStitchLight ?'bg-white shadow-sm' :'bg-[var(--surface)]/80 border-indigo-500/20'
 }`}>
 {selectedRehearsal.asunto && (
 <div className="text-[11px] font-semibold text-indigo-300">
 📌 {selectedRehearsal.asunto}
 </div>
 )}
 <div className="text-[10px] text-[var(--ink)] flex items-center gap-1.5">
 <span>📍 {selectedRehearsal.lugar}</span>
 </div>

 {selectedRehearsal.enlace_reunion && (
 <div className="pt-1 flex items-center gap-2">
 <a
 href={selectedRehearsal.enlace_reunion.startsWith('http') ? selectedRehearsal.enlace_reunion : `https://${selectedRehearsal.enlace_reunion}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-[var(--ink)] rounded-[var(--r-s)] text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
 >
 <Video className="w-3.5 h-3.5" />
 <span>Unirse a Videollamada</span>
 <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
 </a>
 </div>
 )}
 </div>
 </div>
 )}

 {/* REPERTORIO / SETLIST ASIGNADO */}
 {(!isPromoPlan || hasModuleAccess(currentUser?.plan,'repertorio')) && (selectedConcert || selectedRehearsal) && (
 <div className={` pt-2.5 mt-2.5 ${isStitchLight ?'-slate-100' :'-bg-[var(--surface)]'}`}>
 <div className="flex items-center justify-between gap-2 mb-1.5">
 <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--acc)]">
 <Disc3 className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
 <span>Repertorio Asignado:</span>
 </div>
 {assignedSetlist && (
 <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface)]/15 text-[var(--ok)] font-bold">
 {assignedSetlist.items?.length || 0} canciones/ítems
 </span>
 )}
 </div>

 <select
 value={currentSetlistId ||''}
 onChange={(e) => {
 const val = e.target.value;
 if (selectedConcert) {
 onUpdateConcert(selectedConcert.id, { setlistId: val });
 } else if (selectedRehearsal) {
 onUpdateRehearsal(selectedRehearsal.id, { setlistId: val });
 }
 }}
 className={`w-full text-[10px] font-mono p-1.5 rounded-[var(--r-s)] focus:outline-none cursor-pointer ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--acc)] font-bold'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} ({s.tipoFormato})
 </option>
 ))}
 </select>

 {assignedSetlist && (
 <div className="mt-2.5 flex items-center gap-2">
 <button
 type="button"
 id="calendar-launch-stage-mode-btn"
 onClick={() => {
 setActiveStageInitialMode(selectedConcert ?'directo' :'ensayo');
 setActiveStageSetlist(assignedSetlist);
 }}
 className="flex-1 py-2 px-3 rounded-[var(--r-s)] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[var(--ink)] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-0/20 transition-all cursor-pointer"
 title="Lanzar Modo Escenario / Vista de Directo para este evento"
 >
 <Radio className="w-3.5 h-3.5 animate-pulse text-[var(--ink)]" />
 <span>{selectedConcert ?'Lanzar Modo Escenario' :'Lanzar Modo Ensayo'}</span>
 </button>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Subtabs for Checklist */}
 <div className={`flex flex-wrap gap-1 mb-4 pb-1 border-b ${isStitchLight ?'' :''}`}>
 <button
 id="calendar-subtab-runofshow"
 onClick={() => setActiveTab('runofshow')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
 activeTab ==='runofshow'
 ? isStitchLight
 ?'bg-amber-100 text-amber-900 font-bold'
 :'bg-[var(--acc)]/60/20 text-[var(--acc)] font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 Timing
 </button>
 <button
 id="calendar-subtab-tecnica"
 onClick={() => setActiveTab('tecnica')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
 activeTab ==='tecnica'
 ? isStitchLight
 ?'bg-sky-100 text-sky-900 font-bold'
 :'bg-sky-500/20 text-sky-400 font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <Wrench className="w-2.5 h-2.5" />
 <span>1. Logística</span>
 </button>
 <button
 id="calendar-subtab-contactos"
 onClick={() => setActiveTab('contactos')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
 activeTab ==='contactos'
 ? isStitchLight
 ?'bg-emerald-100 text-emerald-900 font-bold'
 :'bg-emerald-500/20 text-emerald-400 font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <Users className="w-2.5 h-2.5" />
 <span>2. Contactos</span>
 </button>
 <button
 id="calendar-subtab-merchan"
 onClick={() => setActiveTab('merchan')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
 activeTab ==='merchan'
 ? isStitchLight
 ?'bg-amber-100 text-amber-900 font-bold'
 :'bg-[var(--acc)]/20 text-[var(--acc)] font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <Shirt className="w-2.5 h-2.5" />
 <span>3. Merchan</span>
 </button>
 <button
 id="calendar-subtab-cierre"
 onClick={() => setActiveTab('cierre')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
 activeTab ==='cierre'
 ? isStitchLight
 ?'bg-purple-100 text-purple-900 font-bold'
 :'bg-purple-500/20 text-purple-400 font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <ShieldCheck className="w-2.5 h-2.5" />
 <span>5. Cierre</span>
 </button>
 <button
 id="calendar-subtab-roadbook"
 onClick={() => setActiveTab('roadbook')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
 activeTab ==='roadbook'
 ? isStitchLight
 ?'bg-teal-100 text-teal-900 font-bold'
 :'bg-teal-500/20 text-[var(--ok)] font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 Ruta
 </button>
 <button
 id="calendar-subtab-gear"
 onClick={() => setActiveTab('gear')}
 className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
 activeTab ==='gear'
 ? isStitchLight
 ?'bg-orange-100 text-orange-900 font-bold'
 :'bg-orange-500/20 text-[var(--acc)] font-bold'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 Cacharros
 </button>
 </div>

 {/* Content for Subtabs */}
 {activeTab ==='roadbook' ? (
 <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = allRoadbooks[selectedDateKey] || {
 contactoPromotor:'Manuel (Producción)',
 telefonoPromotor:'+34 654 321 987',
 tecnicoSonido:'FOH Bakandeya',
 hotelNombre:'Hotel de Gira',
 hotelDireccion: selectedConcert?.ciudad ||'Por confirmar',
 cateringInfo:'Cena tras prueba de sonido',
 inputList:'1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)'
 };

 return (
 <div className="space-y-3">
 <div className={`p-3 rounded-[var(--r-s)] space-y-2 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/70'}`}>
 <div className="flex items-center justify-between">
 <span className={`text-[10px] font-mono uppercase font-bold ${isStitchLight ?'text-sky-400' :'text-[var(--ok)]'}`}>📞 Contacto Producción & Hotel</span>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[10px]">
 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Promotor / Sala</label>
 <input
 type="text"
 value={currentRb.contactoPromotor}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, contactoPromotor: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ?'bg-white' :'bg-black text-[var(--ink)]'}`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Teléfono</label>
 <input
 type="text"
 value={currentRb.telefonoPromotor}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, telefonoPromotor: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ?'bg-white' :'bg-black text-[var(--ink)]'}`}
 />
 </div>
 </div>

 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Hotel Alojamientos</label>
 <input
 type="text"
 value={currentRb.hotelNombre}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, hotelNombre: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ?'bg-white' :'bg-black text-[var(--ink)]'}`}
 />
 </div>

 <div>
 <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Catering & Menús</label>
 <input
 type="text"
 value={currentRb.cateringInfo}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, cateringInfo: e.target.value })}
 className={`w-full px-2 py-1 rounded text-[10px] ${isStitchLight ?'bg-white' :'bg-black text-[var(--ink)]'}`}
 />
 </div>
 </div>

 <div className={`p-3 rounded-[var(--r-s)] space-y-1.5 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/70'}`}>
 <span className={`text-[10px] font-mono uppercase font-bold ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`}>🎸 Input List / Rider de Canales</span>
 <textarea
 rows={4}
 value={currentRb.inputList}
 onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, inputList: e.target.value })}
 className={`w-full p-2 rounded font-mono text-[10px] ${isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black text-[var(--ink-2)]'}`}
 />
 </div>

 <button
 type="button"
 onClick={() => {
 const currentRbData = allRoadbooks[selectedDateKey] || currentRb;
 const printWindow = window.open('','_blank');
 if (!printWindow) return;
 printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>Hoja de Ruta Bakandeya - ${selectedConcert ? selectedConcert.sala :'Concierto'}</title>
 <style>
 body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #111; line-height: 1.5; }
 h1 { font-size: 22px; margin: 0; text-transform: uppercase; color: #d97706; }
 h2 { font-size: 14px; color: #555; margin-top: 2px; margin-bottom: 20px; font-weight: normal; }
 .badge { display: inline-block; padding: 4px 10px; background: #fef3c7; color: #92400e; font-weight: bold; border-radius: 4px; font-size: 11px; font-family: monospace; }
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
 .card { border: 1px solid #e5e7eb; padding: 12px 15px; border-radius: 8px; background: #fafafa; }
 .card-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 6px; }
 .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e5e7eb; font-size: 12px; }
 .time { font-weight: bold; font-family: monospace; color: #d97706; width: 60px; }
 pre { font-family: monospace; font-size: 11px; background: #fff; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; white-space: pre-wrap; margin: 0; }
 .footer { margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 10px; color: #888; text-align: center; }
 </style>
 </head>
 <body>
 <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--acc); padding-bottom:12px; margin-bottom:20px;">
 <div>
 <h1>Bakandeya — Hoja de Ruta de Gira</h1>
 <h2>${selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` : selectedEventTitle}</h2>
 </div>
 <div>
 <span class="badge">FECHA: ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}</span>
 </div>
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">📍 Ubicación & Logística</div>
 <p style="margin:2px 0; font-size:13px; font-weight:bold;">${selectedEventDetails.lugar}</p>
 <p style="margin:2px 0; font-size:11px; color:#555;">${selectedEventDetails.direccion ||'Dirección no especificada'}</p>
 ${!isPromoPlan ? `<p style="margin:8px 0 2px 0; font-size:11px;"><strong>Caché / Condición:</strong> ${selectedEventDetails.fee}</p>` :''}
 </div>

 <div class="card">
 <div class="card-title">📞 Contactos & Hotel</div>
 <p style="margin:2px 0; font-size:11px;"><strong>Promotor/Contacto:</strong> ${currentRbData.contactoPromotor} (${currentRbData.telefonoPromotor})</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Técnico Sonido:</strong> ${currentRbData.tecnicoSonido}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Hotel:</strong> ${currentRbData.hotelNombre}</p>
 <p style="margin:2px 0; font-size:11px;"><strong>Catering:</strong> ${currentRbData.cateringInfo}</p>
 </div>
 </div>

 <div class="card" style="margin-bottom: 20px;">
 <div class="card-title">⏱️ Horarios / Run of Show</div>
 ${currentRunOfShow.length === 0 ?'<p style="font-size:11px; color:#888;">Sin horarios definidos.</p>' : currentRunOfShow.map(i => `
 <div class="item-row">
 <span class="time">${i.time}</span>
 <span style="flex:1;">${i.activity}</span>
 </div>
 `).join('')}
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">🎸 Lista de Canales / Input List (Rider)</div>
 <pre>${currentRbData.inputList}</pre>
 </div>
 <div class="card">
 <div class="card-title">🎒 Check-list Cacharros & Backline</div>
 ${currentGear.length === 0 ?'<p style="font-size:11px; color:#888;">Sin material asignado.</p>' : currentGear.map(g => `
 <div class="item-row">
 <span>${g.checked ?'☑' :'☐'} ${g.label}</span>
 </div>
 `).join('')}
 </div>
 </div>

 <div class="footer">
 Documento Oficial de Gira • Generado por Bakandeya Band CRM
 </div>

 <script>
 window.onload = function() { window.print(); }
 </script>
 </body>
 </html>
 `);
 printWindow.document.close();
 }}
 className={`w-full py-2 px-3 rounded-[var(--r-m)] font-mono text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
 isStitchLight
 ?'bg-gradient-to-r from-indigo-600 to-blue-600 text-[var(--ink)]'
 :'bg-gradient-to-r from-emerald-500 to-teal-500 text-[var(--acc-ink)] font-extrabold'
 }`}
 >
 <Download className="w-3.5 h-3.5" />
 <span>Imprimir / Exportar Hoja de Ruta (PDF)</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : activeTab ==='tecnica' ? (
 <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
 return (
 <div className="space-y-2.5">
 <div className={`p-2.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-sky-50/70 border-sky-100' :'bg-sky-950/20 border-sky-800/40'}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="font-bold flex items-center gap-1 text-sky-400 font-mono uppercase text-[10px]">
 <Wrench className="w-3 h-3" /> 1. Logística Técnica
 </span>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('tecnica');
 setShowEventFichaModal(true);
 }}
 className="text-[9px] underline text-sky-400 hover:text-sky-300 font-mono cursor-pointer"
 >
 Editar Completo →
 </button>
 </div>
 <div className="grid grid-cols-2 gap-1.5 text-[9px]">
 <div className={`p-1.5 rounded ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Prueba de Sonido</span>
 <span className="font-bold text-[var(--acc)]">{currentRb.horaPruebaSonido ||'18:00'}</span>
 </div>
 <div className={`p-1.5 rounded ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Horario Show</span>
 <span className="font-bold text-emerald-400">{currentRb.horaShow ||'21:30'}</span>
 </div>
 <div className={`p-1.5 rounded ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Técnico Sonido FOH</span>
 <span className="font-medium truncate">{currentRb.tecnicoSonido ||'Propio / Sala'}</span>
 </div>
 <div className={`p-1.5 rounded ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Sistema P.A.</span>
 <span className="font-medium truncate">{currentRb.paEspecificaciones ?'Especificado' :'Estándar Sala'}</span>
 </div>
 </div>
 {currentRb.backlineInfo && (
 <div className={`mt-2 p-1.5 rounded text-[9px] ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Backline & Rider</span>
 <p className="line-clamp-2 text-[var(--ink)]">{currentRb.backlineInfo}</p>
 </div>
 )}
 </div>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('tecnica');
 setShowEventFichaModal(true);
 }}
 className="w-full py-1.5 px-2 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
 >
 <Wrench className="w-3 h-3" />
 <span>Abrir Logística Técnica Completa</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : activeTab ==='contactos' ? (
 <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
 const contacts = currentRb.contactosClave || [];
 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="font-mono uppercase font-bold text-emerald-400 text-[10px] flex items-center gap-1">
 <Users className="w-3 h-3" /> 2. Contactos Clave ({contacts.length})
 </span>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('contactos');
 setShowEventFichaModal(true);
 }}
 className="text-[9px] underline text-emerald-400 hover:text-[var(--ink-2)] font-mono cursor-pointer"
 >
 + Gestionar →
 </button>
 </div>
 {contacts.length === 0 ? (
 <p className={`text-[10px] italic text-center py-3 ${textMuted}`}>No hay contactos clave agregados.</p>
 ) : (
 <div className="space-y-1.5">
 {contacts.map((c) => (
 <div key={c.id} className={`p-2 rounded-[var(--r-s)] flex items-center justify-between gap-2 ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/80'}`}>
 <div className="min-w-0">
 <div className="font-bold truncate text-[10px]">{c.nombre}</div>
 <div className="text-[9px] text-[var(--ink-2)] font-mono flex items-center gap-1">
 <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[8px] uppercase">{c.rol}</span>
 <span>{c.telefono}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 shrink-0">
 {c.telefono && (
 <>
 <a
 href={`https://wa.me/${c.telefono.replace(/[^0-9]/g,'')}`}
 target="_blank"
 rel="noopener noreferrer"
 className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
 title="WhatsApp"
 >
 <MessageCircle className="w-3 h-3" />
 </a>
 <a
 href={`tel:${c.telefono}`}
 className="p-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
 title="Llamar"
 >
 <Phone className="w-3 h-3" />
 </a>
 </>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('contactos');
 setShowEventFichaModal(true);
 }}
 className="w-full py-1.5 px-2 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
 >
 <Plus className="w-3 h-3" />
 <span>Añadir Contactos Clave</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : activeTab ==='merchan' ? (
 <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
 const merch = currentRb.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 const items = merch.items || [];
 const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
 const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
 const totalVendidas = Math.max(0, totalInicial - totalFinal);
 const totalTeorico = items.reduce((acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0), 0);
 const totalCobrado = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
 const cuadreDiff = totalCobrado - totalTeorico;

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="font-mono uppercase font-bold text-[var(--acc)] text-[10px] flex items-center gap-1">
 <Shirt className="w-3 h-3" /> 3. Merch ({totalVendidas}/{totalInicial} uds)
 </span>
 <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70">
 {totalTeorico.toFixed(0)}€ ventas
 </span>
 </div>

 {/* Arqueo Rápido */}
 <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
 <div className="p-1.5 rounded bg-emerald-500/10 flex flex-col">
 <span className="text-emerald-400/80 text-[8px] flex items-center gap-0.5">
 <Banknote className="w-2.5 h-2.5" /> Efectivo
 </span>
 <span className="font-bold text-[var(--ink-2)] text-[11px]">
 {(merch.ingresosEfectivo || 0).toFixed(0)}€
 </span>
 </div>
 <div className="p-1.5 rounded bg-sky-500/10 flex flex-col">
 <span className="text-sky-400/80 text-[8px] flex items-center gap-0.5">
 <Smartphone className="w-2.5 h-2.5" /> Bizum / TPV
 </span>
 <span className="font-bold text-sky-300 text-[11px]">
 {(merch.ingresosBizum || 0).toFixed(0)}€
 </span>
 </div>
 </div>

 <div className="flex items-center justify-between text-[8.5px] font-mono px-1 py-0.5 rounded bg-[var(--surface)]/60">
 <span className="text-[var(--ink-2)]">Total cobrado: <strong className="text-[var(--ink)]">{totalCobrado.toFixed(0)}€</strong></span>
 <span className={`font-bold ${cuadreDiff === 0 ?'text-emerald-400' : cuadreDiff > 0 ?'text-sky-400' :'text-[var(--acc)]'}`}>
 {cuadreDiff === 0 ?'✓ Cuadrada' : cuadreDiff > 0 ? `+${cuadreDiff.toFixed(0)}€ propina` : `${cuadreDiff.toFixed(0)}€ descuadre`}
 </span>
 </div>

 {/* Stock furgoneta vs fin */}
 <div className="space-y-1">
 {items.slice(0, 4).map((item) => {
 const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
 return (
 <div
 key={item.id}
 className={`p-1.5 rounded flex items-center justify-between ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 <div className="truncate pr-2">
 <p className="font-medium truncate text-[9.5px]">
 {item.nombre} {item.talla ? `(${item.talla})` :''}
 </p>
 <p className="text-[8px] text-[var(--ink-2)] font-mono">
 {item.stockInicial} furgón ➔ {item.stockFinal} quedan
 </p>
 </div>
 <div className="text-right shrink-0">
 <span className="text-[9px] font-mono font-bold text-[var(--acc)]">
 {vendidas} vend.
 </span>
 <p className="text-[8px] font-mono text-[var(--ink-2)]">
 {(vendidas * item.precioUnitario).toFixed(0)}€
 </p>
 </div>
 </div>
 );
 })}
 </div>

 {items.length > 4 && (
 <p className="text-[8px] text-center font-mono text-[var(--ink-2)]">
 +{items.length - 4} productos más en inventario
 </p>
 )}

 <button
 type="button"
 onClick={() => {
 setModalActiveTab('merchan');
 setShowEventFichaModal(true);
 }}
 className="w-full py-1.5 px-2 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
 >
 <Shirt className="w-3 h-3" />
 <span>Control Merchandising Completo</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : activeTab ==='cierre' ? (
 <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
 {(() => {
 const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
 const items = currentRb.cierreMaterial || [];
 const checkedCount = items.filter(i => i.checked).length;
 const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="font-mono uppercase font-bold text-purple-400 text-[10px] flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" /> 5. Cierre Material ({checkedCount}/{items.length})
 </span>
 <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${progress === 100 ?'bg-emerald-500/20 text-emerald-400' :'bg-purple-500/20 text-purple-300'}`}>
 {progress}%
 </span>
 </div>
 <div className="w-full bg-[var(--surface)]/80 rounded-full h-1.5 overflow-hidden">
 <div
 className={`h-full transition-all duration-300 ${progress === 100 ?'bg-emerald-500' :'bg-purple-500'}`}
 style={{ width: `${progress}%` }}
 />
 </div>
 <div className="space-y-1">
 {items.map((item) => (
 <div
 key={item.id}
 onClick={() => handleToggleCierreItem(item.id, selectedDateKey)}
 className={`p-1.5 rounded flex items-center gap-2 cursor-pointer transition-colors ${
 item.checked
 ? isStitchLight ?'bg-emerald-50/70 text-[var(--ink-2)] line-through' :'bg-[var(--surface)]/40 text-[var(--ink-2)] line-through'
 : isStitchLight ?'bg-white text-[var(--ink)] hover:bg-[var(--bg)]' :'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-neutral-850'
 }`}
 >
 <input
 type="checkbox"
 checked={item.checked}
 onChange={() => {}}
 className="rounded text-purple-500 h-3 w-3 cursor-pointer"
 />
 <span className="flex-1 truncate text-[9.5px]">{item.item}</span>
 <span className="text-[8px] font-mono uppercase px-1 rounded bg-[var(--surface)]/80 text-[var(--ink-2)] shrink-0">
 {item.categoria}
 </span>
 </div>
 ))}
 </div>
 <button
 type="button"
 onClick={() => {
 setModalActiveTab('cierre');
 setShowEventFichaModal(true);
 }}
 className="w-full py-1.5 px-2 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
 >
 <ShieldCheck className="w-3 h-3" />
 <span>Checklist Cierre Completo</span>
 </button>
 </div>
 );
 })()}
 </div>
 ) : (
 <>
 {/* Form to add new item */}
 <div className="mb-3">
 {activeTab ==='runofshow' ? (
 <form onSubmit={handleAddRunOfShow} className="flex gap-1.5 items-center">
 <input
 type="text"
 placeholder="17:30"
 value={newRunTime}
 onChange={(e) => setNewRunTime(e.target.value)}
 className={`w-16 px-2 py-1 text-[10px] font-mono rounded outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <input
 type="text"
 placeholder="Nueva actividad/horario..."
 value={newRunActivity}
 onChange={(e) => setNewRunActivity(e.target.value)}
 className={`flex-1 px-2 py-1 text-[10px] rounded outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <button
 type="submit"
 className={`p-1.5 rounded transition-colors cursor-pointer ${
 isStitchLight ?'bg-sky-500/15 text-white hover:bg-sky-500/15' :'bg-[var(--acc)]/15 text-[var(--acc-ink)] hover:bg-[var(--acc)]/50/15 font-bold'
 }`}
 title="Añadir horario"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </form>
 ) : (
 <form onSubmit={handleAddGear} className="flex gap-1.5 items-center">
 <input
 type="text"
 placeholder="Añadir instrumento, cable o cacharro de directo..."
 value={newGearLabel}
 onChange={(e) => setNewGearLabel(e.target.value)}
 className={`flex-1 px-2 py-1 text-[10px] rounded outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <button
 type="submit"
 className={`p-1.5 rounded transition-colors cursor-pointer ${
 isStitchLight ?'bg-sky-500/15 text-white hover:bg-sky-500/15' :'bg-[var(--acc)]/15 text-[var(--acc-ink)] hover:bg-[var(--acc)]/50/15 font-bold'
 }`}
 title="Añadir material"
 >
 <Plus className="w-3.5 h-3.5" />
 </button>
 </form>
 )}
 </div>

 {/* Interactive Lists */}
 <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
 {activeTab ==='runofshow' ? (
 currentRunOfShow.length === 0 ? (
 <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay horarios registrados para este día.</p>
 ) : (
 currentRunOfShow.map((item) => {
 const isItemDone = item.done;
 return (
 <div 
 key={item.id}
 onClick={() => handleToggleRunOfShow(item.id)}
 className={`p-2 rounded-md flex items-center gap-2.5 cursor-pointer transition-colors group ${
 isItemDone 
 ? isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
 :'bg-[var(--surface)]/50 text-[var(--ink-2)] line-through'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:-indigo-300'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:-[#99907c]/35'
 }`}
 >
 <span className={`font-mono text-[10px] font-bold shrink-0 ${
 isItemDone 
 ? isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]' 
 : isStitchLight ?'text-sky-400' :'text-[var(--acc)]'
 }`}>
 {item.time}
 </span>
 <p className="text-[10px] font-sans leading-normal flex-1">{item.activity}</p>
 <button
 type="button"
 onClick={(e) => handleDeleteRunOfShow(item.id, e)}
 className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-2)] hover:text-rose-400 transition-opacity"
 title="Eliminar"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 );
 })
 )
 ) : (
 currentGear.length === 0 ? (
 <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay material registrado para este día.</p>
 ) : (
 currentGear.map(item => {
 const isChecked = item.checked;
 return (
 <div 
 key={item.id}
 onClick={() => handleToggleGear(item.id)}
 className={`p-2 rounded-md flex items-center gap-2.5 cursor-pointer transition-colors group ${
 isChecked 
 ? isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
 :'bg-[var(--surface)]/50 text-[var(--ink-2)] line-through'
 : isStitchLight
 ?'bg-white text-[var(--ink-2)] hover:-indigo-300'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:-[#99907c]/35'
 }`}
 >
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => {}} // handled by div click
 className={`rounded focus:ring-0 cursor-pointer h-3.5 w-3.5 ${
 isStitchLight
 ?'-slate-300 text-sky-400 bg-white'
 :'-[#99907c]/40 text-[var(--acc)] bg-[var(--surface)]'
 }`}
 />
 <p className="text-[10px] font-sans leading-normal flex-1">{item.label}</p>
 <button
 type="button"
 onClick={(e) => handleDeleteGear(item.id, e)}
 className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-2)] hover:text-rose-400 transition-opacity"
 title="Eliminar"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 );
 })
 )
 )}
 </div>
 </>
 )}
 </div>
 )}

 {/* Footer info */}
 <div className={` pt-4 mt-6 flex justify-between items-center text-[10px] font-mono ${
 isStitchLight ?'-slate-100 text-[var(--ink-2)]' :'-[#99907c]/15 text-[var(--ink-2)]'
 }`}>
 <span>Huso Horario: Madrid (UTC+2)</span>
 <span className="text-[var(--ok)]">● Sincronizado</span>
 </div>
 </div>

 {/* UNIFIED CREATE EVENT MODAL (Concierto | Ensayo | Reunión) */}
 {showCreateModal && (
 <ModalPortal isOpen={true} onClose={() => setShowCreateModal(null)}>
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-[var(--r-l)] p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 <button
 onClick={() => setShowCreateModal(null)}
 className="absolute top-4 right-4 p-1 rounded-full text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 ✕
 </button>

 {/* Segmented Event Type Selector */}
 <div className="flex items-center justify-between gap-1 p-1 bg-black/30 rounded-[var(--r-m)] mb-5 border-[var(--hair)]5">
 <button
 type="button"
 onClick={() => { setShowCreateModal('concert'); setConcIsPosible(false); }}
 className={`flex-1 py-1.5 px-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
 showCreateModal ==='concert' && !concIsPosible
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow-md font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <span>🎸</span>
 <span>Concierto</span>
 </button>
 <button
 type="button"
 onClick={() => { setShowCreateModal('concert'); setConcIsPosible(true); }}
 className={`flex-1 py-1.5 px-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
 showCreateModal ==='concert' && concIsPosible
 ?'bg-purple-500 text-[var(--ink)] shadow-md font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <span>🎯</span>
 <span>Posible</span>
 </button>
 <button
 type="button"
 onClick={() => setShowCreateModal('rehearsal')}
 className={`flex-1 py-1.5 px-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
 showCreateModal ==='rehearsal'
 ?'bg-emerald-500 text-[var(--acc-ink)] shadow-md font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <span>🥁</span>
 <span>Ensayo</span>
 </button>
 <button
 type="button"
 onClick={() => setShowCreateModal('reunion')}
 className={`flex-1 py-1.5 px-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
 showCreateModal ==='reunion'
 ?'bg-indigo-500 text-[var(--ink)] shadow-md font-black'
 :'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
 }`}
 >
 <span>🤝</span>
 <span>Reunión</span>
 </button>
 </div>

 {/* Header Date Info */}
 <div className="flex items-center gap-2 mb-4">
 <span className={`p-2 rounded-[var(--r-s)] ${
 showCreateModal ==='concert'
 ? concIsPosible
 ?'bg-purple-500/15 text-purple-400'
 :'bg-[var(--acc)]/15 text-[var(--acc)]'
 : showCreateModal ==='reunion'
 ?'bg-indigo-500/15 text-indigo-400'
 :'bg-[var(--surface)]/15 text-[var(--ok)]'
 }`}>
 {showCreateModal ==='concert' ? (
 <Sparkles className="w-5 h-5" />
 ) : showCreateModal ==='reunion' ? (
 <Handshake className="w-5 h-5" />
 ) : (
 <Calendar className="w-5 h-5" />
 )}
 </span>
 <div>
 <h3 className="font-bold text-base font-display">
 {showCreateModal ==='concert' && (concIsPosible ?'Crear Concierto Posible (Bolo Tentativo)' :'Crear Nuevo Concierto')}
 {showCreateModal ==='rehearsal' &&'Crear Nuevo Ensayo'}
 {showCreateModal ==='reunion' &&'Crear Nueva Reunión'}
 </h3>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">
 Fecha: {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 </div>
 </div>

 {/* FORM: REUNIÓN */}
 {showCreateModal ==='reunion' && (
 <form onSubmit={handleSaveNewReunion} className="space-y-4">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold">Asunto / Objetivo de la Reunión</label>
 <input
 type="text"
 value={reuAsunto}
 onChange={(e) => setReuAsunto(e.target.value)}
 placeholder="ej. Coordinación de gira de verano y reparto de tareas"
 required
 className={`w-full px-2 py-1.5 text-xs rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Horario</label>
 <input
 type="text"
 value={reuHora}
 onChange={(e) => setReuHora(e.target.value)}
 placeholder="ej. 19:00 - 20:00"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Lugar / Plataforma</label>
 <input
 type="text"
 value={reuLugar}
 onChange={(e) => setReuLugar(e.target.value)}
 placeholder="ej. Online (Google Meet) o Bar Local"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 flex items-center gap-1.5">
 <Video className="w-3.5 h-3.5 text-indigo-400" />
 <span>Enlace a Videollamada (Opcional)</span>
 </label>
 <input
 type="url"
 value={reuEnlace}
 onChange={(e) => setReuEnlace(e.target.value)}
 placeholder="https://meet.google.com/xxx-xxxx-xxx o Zoom"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 {isMultiBandUser && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Banda del Evento</label>
 <select
 value={selectedBandIdForNewEvent}
 onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 {effectiveBandsList.map(b => (
 <option key={b.band_id} value={b.band_id}>{b.bandName}</option>
 ))}
 </select>
 </div>
 )}

 {/* Convocatoria selector */}
 <div className="space-y-2 border-t pt-3">
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center gap-1">
 <Users className="w-3 h-3 text-indigo-400" />
 <span>Asistentes Convocados</span>
 </label>
 <select
 value={convocatoriaTipo}
 onChange={(e) => {
 const val = e.target.value as'completa' |'parcial';
 setConvocatoriaTipo(val);
 if (val ==='completa') {
 setConvocadosIds(effectiveBandMembers.map(m => m.id));
 }
 }}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="completa">Toda la Banda (Todos los miembros convocados)</option>
 <option value="parcial">Convocatoria Parcial (Seleccionar miembros)</option>
 </select>

 {convocatoriaTipo ==='parcial' && (
 <div className={`p-2.5 rounded-[var(--r-m)] space-y-2 text-[10px] ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] border-[var(--hair)]800 text-[var(--ink-2)]'
 }`}>
 <span className="font-mono font-bold block text-[var(--ink-2)]">Selecciona miembros convocados:</span>
 <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
 {effectiveBandMembers.map(member => {
 const isChecked = convocadosIds.includes(member.id);
 return (
 <label key={member.id} className="flex items-center gap-2 cursor-pointer select-none font-mono">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => {
 if (e.target.checked) {
 setConvocadosIds(prev => [...prev, member.id]);
 } else {
 setConvocadosIds(prev => prev.filter(id => id !== member.id));
 }
 }}
 className="rounded text-indigo-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
 />
 <span>{member.name} {member.role ==='leader' ?'(Líder)' :''}</span>
 </label>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Orden del Día / Notas</label>
 <textarea
 value={rehNotas}
 onChange={(e) => setRehNotas(e.target.value)}
 rows={3}
 placeholder="ej. 1. Definir fechas de estudio. 2. Presupuesto de merchandising. 3. Reparto de tareas de redes."
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-[var(--r-s)] text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer shadow-md ${
 isStitchLight ?'bg-indigo-600 hover:bg-indigo-500 text-white' :'bg-indigo-600 hover:bg-indigo-500 text-[var(--ink)] font-bold shadow-indigo-500/20'
 }`}
 >
 Guardar Reunión
 </button>
 </div>
 </form>
 )}

 {/* FORM: ENSAYO */}
 {showCreateModal ==='rehearsal' && (
 <form onSubmit={handleSaveNewRehearsal} className="space-y-4">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Horario del Ensayo</label>
 <input
 type="text"
 value={rehTime}
 onChange={(e) => setRehTime(e.target.value)}
 placeholder="ej. 18:00 - 21:00"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Lugar / Local</label>
 <input
 type="text"
 value={rehLugar}
 onChange={(e) => setRehLugar(e.target.value)}
 placeholder="ej. Rock Palace, Madrid (Local 4)"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 {isMultiBandUser && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Banda del Evento</label>
 <select
 value={selectedBandIdForNewEvent}
 onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 {effectiveBandsList.map(b => (
 <option key={b.band_id} value={b.band_id}>{b.bandName}</option>
 ))}
 </select>
 </div>
 )}

 {/* Convocatoria selector */}
 <div className="space-y-2 border-t pt-3">
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center gap-1">
 <Users className="w-3 h-3 text-sky-400" />
 <span>Tipo de Convocatoria</span>
 </label>
 <select
 value={convocatoriaTipo}
 onChange={(e) => {
 const val = e.target.value as'completa' |'parcial';
 setConvocatoriaTipo(val);
 if (val ==='completa') {
 setConvocadosIds(effectiveBandMembers.map(m => m.id));
 }
 }}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="completa">Banda Completa (Todos los miembros convocados)</option>
 <option value="parcial">Convocatoria Parcial (Seleccionar miembros)</option>
 </select>

 {convocatoriaTipo ==='parcial' && (
 <div className={`p-2.5 rounded-[var(--r-m)] space-y-2 text-[10px] ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] border-[var(--hair)]800 text-[var(--ink-2)]'
 }`}>
 <span className="font-mono font-bold block text-[var(--ink-2)]">Selecciona miembros convocados:</span>
 <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
 {effectiveBandMembers.map(member => {
 const isChecked = convocadosIds.includes(member.id);
 return (
 <label key={member.id} className="flex items-center gap-2 cursor-pointer select-none font-mono">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => {
 if (e.target.checked) {
 setConvocadosIds(prev => [...prev, member.id]);
 } else {
 setConvocadosIds(prev => prev.filter(id => id !== member.id));
 }
 }}
 className="rounded text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
 />
 <span>{member.name} {member.role ==='leader' ?'(Líder)' :''}</span>
 </label>
 );
 })}
 </div>
 <p className="text-[9px] text-[var(--acc)] font-mono italic mt-1">
 * Este ensayo solo aparecerá en el calendario de los miembros convocados.
 </p>
 </div>
 )}
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Estado</label>
 <select
 value={rehEstado}
 onChange={(e) => setRehEstado(e.target.value as any)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="programado">Programado</option>
 <option value="completado">Completado</option>
 <option value="cancelado">Cancelado</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
 <span className="flex items-center gap-1 text-[var(--ok)]">
 <Music className="w-3 h-3" />
 <span>Repertorio / Setlist a Ensayar</span>
 </span>
 {rehSetlistId && (
 <span className="text-[9px] font-mono text-[var(--ok)]">
 {availableSetlists.find((s: any) => s.id === rehSetlistId)?.items?.length || 0} temas
 </span>
 )}
 </label>
 <select
 value={rehSetlistId}
 onChange={(e) => setRehSetlistId(e.target.value)}
 className={`w-full px-2 py-1.5 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} {s.tipoFormato ? `(${s.tipoFormato.replace('_','')})` :''} • {s.items?.filter((i: any) => i.tipoItem ==='cancion')?.length ?? s.items?.length ?? 0} temas
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Notas / Objetivo del Ensayo</label>
 <textarea
 value={rehNotas}
 onChange={(e) => setRehNotas(e.target.value)}
 rows={3}
 placeholder="ej. Montar la estructura de la canción nueva y probar dinámicas de volumen."
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-[var(--r-s)] text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer shadow-md ${
 isStitchLight ?'bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)]' :'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc-ink)] font-bold shadow-emerald-500/20'
 }`}
 >
 Guardar Ensayo
 </button>
 </div>
 </form>
 )}

 {/* FORM: CONCIERTO */}
 {showCreateModal ==='concert' && (
 <form onSubmit={handleSaveNewConcert} className="space-y-3.5">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Ciudad</label>
 <input
 type="text"
 value={concCiudad}
 onChange={(e) => setConcCiudad(e.target.value)}
 placeholder="ej. Madrid"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Sala / Recinto</label>
 <input
 type="text"
 value={concSala}
 onChange={(e) => setConcSala(e.target.value)}
 placeholder="ej. Sala Sol"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Dirección Exacta</label>
 <input
 type="text"
 value={concDireccion}
 onChange={(e) => setConcDireccion(e.target.value)}
 placeholder="ej. Calle Jardines 3, 28013 Madrid"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 {/* Auditor de Festivos y Puentes */}
 <HolidayDateWarning date={selectedDate} city={concCiudad} />

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Caché (€)</label>
 <input
 type="number"
 value={concCache}
 onChange={(e) => setConcCache(e.target.value)}
 placeholder="800"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Estado de Pago</label>
 <select
 value={concEstadoPago}
 onChange={(e) => setConcEstadoPago(e.target.value as any)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="pendiente">Pendiente</option>
 <option value="pagado">Pagado</option>
 <option value="anticipo">Anticipo</option>
 </select>
 </div>
 </div>

 {isMultiBandUser && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Banda del Evento</label>
 <select
 value={selectedBandIdForNewEvent}
 onChange={(e) => setSelectedBandIdForNewEvent(e.target.value)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 {effectiveBandsList.map(b => (
 <option key={b.band_id} value={b.band_id}>{b.bandName}</option>
 ))}
 </select>
 </div>
 )}

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
 <span className="flex items-center gap-1 text-[var(--acc)]">
 <Music className="w-3 h-3" />
 <span>Repertorio / Setlist del Concierto</span>
 </span>
 {concSetlistId && (
 <span className="text-[9px] font-mono text-[var(--ok)]">
 {availableSetlists.find((s: any) => s.id === concSetlistId)?.items?.length || 0} temas
 </span>
 )}
 </label>
 <select
 value={concSetlistId}
 onChange={(e) => setConcSetlistId(e.target.value)}
 className={`w-full px-2 py-1.5 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} {s.tipoFormato ? `(${s.tipoFormato.replace('_','')})` :''} • {s.items?.filter((i: any) => i.tipoItem ==='cancion')?.length ?? s.items?.length ?? 0} temas
 </option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 py-1 px-2 rounded-[var(--r-s)] bg-purple-950/20">
 <input
 type="checkbox"
 id="concIsPosibleCheck"
 checked={concIsPosible}
 onChange={(e) => setConcIsPosible(e.target.checked)}
 className="rounded text-purple-500 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="concIsPosibleCheck" className="text-[10px] font-mono cursor-pointer select-none font-bold text-purple-300 flex items-center gap-1">
 🎯 Concierto Posible / En negociación (Bolo Tentativo)
 </label>
 </div>

 <div>
 <textarea
 value={concNotas}
 onChange={(e) => setConcNotas(e.target.value)}
 rows={2}
 placeholder="ej. Prueba de sonido a las 18:30h. Catering frío y 4 camerinos incluidos."
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-[var(--r-s)] text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer shadow-md ${
 isStitchLight ?'bg-amber-600 hover:bg-[var(--acc)] text-[var(--ink)]' :'bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold shadow-amber-0/20'
 }`}
 >
 Guardar Concierto
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 </ModalPortal>
 )}

 {/* EDIT CONCERT MODAL (Ficha del Concierto) */}
 {viewingConcert && editDraft && (
 <ModalPortal isOpen={true} onClose={() => setViewingConcert(null)}>
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-[var(--r-l)] p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 <button
 onClick={() => setViewingConcert(null)}
 className="absolute top-4 right-4 p-1 rounded-full text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors"
 >
 ✕
 </button>
 <div className="flex items-center gap-2 mb-4">
 <span className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Sparkles className="w-5 h-5" />
 </span>
 <div>
 <h3 className="font-bold text-base font-display">Ficha del Concierto</h3>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">{viewingConcert.sala} · {viewingConcert.ciudad}</p>
 </div>
 </div>

 <form onSubmit={handleSaveConcertEdit} className="space-y-3.5">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Ciudad</label>
 <input
 type="text"
 value={editDraft.ciudad}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, ciudad: e.target.value } : prev)}
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Sala / Evento</label>
 <input
 type="text"
 value={editDraft.sala}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, sala: e.target.value } : prev)}
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Fecha</label>
 <input
 type="date"
 value={editDraft.fecha}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, fecha: e.target.value } : prev)}
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className={isPromoPlan ?"grid grid-cols-1 gap-3" :"grid grid-cols-2 gap-3"}>
 {!isPromoPlan && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Caché (€)</label>
 <input
 type="number"
 value={editDraft.cache}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, cache: Number(e.target.value) } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 )}
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Aforo Máximo</label>
 <input
 type="number"
 value={editDraft.aforo_total}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, aforo_total: Number(e.target.value) } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Dirección de la Sala</label>
 <input
 type="text"
 value={editDraft.direccion ||''}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, direccion: e.target.value } : prev)}
 placeholder="ej. C/ San Vicente 34"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Entradas Vendidas</label>
 <input
 type="number"
 value={editDraft.aforo_vendido || 0}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, aforo_vendido: Number(e.target.value) } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 flex items-center gap-1">
 <Ticket className="w-3 h-3 text-emerald-400" />
 Enlace para Comprar Entradas
 </label>
 <input
 type="url"
 value={editDraft.entradasUrl ||''}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, entradasUrl: e.target.value } : prev)}
 placeholder="https://taquilla.com/tu-concierto"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Punto de Venta Físico</label>
 <input
 type="text"
 value={editDraft.entradasLugarFisico ||''}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, entradasLugarFisico: e.target.value } : prev)}
 placeholder="ej. Potential Hardcore, Vallecas"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Tipo de Evento</label>
 <select
 value={editDraft.tipo}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, tipo: e.target.value as any } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="propio">Concierto Propio</option>
 <option value="festival">Festival / Macroevento</option>
 <option value="privado">Evento Privado / Boda</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Estado de Pago</label>
 <select
 value={editDraft.estado_pago}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, estado_pago: e.target.value as any } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="pendiente">Pendiente</option>
 <option value="anticipo">Anticipo / Parcial</option>
 <option value="pagado">Cobrado 100%</option>
 </select>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Idioma del formulario"Únete" (QR de fans)</label>
 <select
 value={editDraft.idioma ||''}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, idioma: e.target.value } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="">Español (por defecto)</option>
 {FAN_FORM_LANGUAGES.filter(l => l.code !=='es').map(l => (
 <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 py-1">
 <input
 type="checkbox"
 id="editContrato"
 checked={editDraft.contrato_firmado}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, contrato_firmado: e.target.checked } : prev)}
 className="rounded text-[var(--acc)] focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="editContrato" className="text-[10px] font-mono cursor-pointer select-none">
 Contrato firmado y verificado
 </label>
 </div>

 <div className="flex items-center gap-2 py-1 px-2 rounded-[var(--r-s)] bg-purple-950/20">
 <input
 type="checkbox"
 id="editIsPosibleCheck"
 checked={Boolean(editDraft.is_posible ?? (editDraft as any).isPosible)}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, is_posible: e.target.checked } : prev)}
 className="rounded text-purple-500 focus:ring-0 w-4 h-4 cursor-pointer"
 />
 <label htmlFor="editIsPosibleCheck" className="text-[10px] font-mono cursor-pointer select-none font-bold text-purple-300 flex items-center gap-1">
 🎯 Concierto Posible / En negociación (Bolo Tentativo)
 </label>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
 <span className="flex items-center gap-1 text-[var(--acc)]">
 <Disc3 className="w-3 h-3" />
 <span>Repertorio / Setlist Asignado</span>
 </span>
 {editDraft.setlistId && (
 <span className="text-[9px] font-mono text-[var(--ok)]">
 {availableSetlists.find((s: any) => s.id === editDraft.setlistId)?.items?.length || 0} temas
 </span>
 )}
 </label>
 <select
 value={editDraft.setlistId ||''}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, setlistId: e.target.value || undefined } : prev)}
 className={`w-full px-2 py-1.5 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} {s.tipoFormato ? `(${s.tipoFormato.replace('_','')})` :''} • {s.items?.filter((i: any) => i.tipoItem ==='cancion')?.length ?? s.items?.length ?? 0} temas
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Notas / Cláusulas Técnicas</label>
 <textarea
 value={editDraft.notas}
 onChange={(e) => setEditDraft(prev => prev ? { ...prev, notas: e.target.value } : prev)}
 rows={2}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setViewingConcert(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-[var(--r-s)] text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer shadow-md ${
 isStitchLight ?'bg-amber-600 hover:bg-[var(--acc)] text-[var(--ink)]' :'bg-[var(--acc)] hover:bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold shadow-amber-0/20'
 }`}
 >
 Guardar Cambios
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* EDIT REHEARSAL MODAL (Ficha del Ensayo) */}
 {viewingRehearsal && editRehearsalDraft && (
 <ModalPortal isOpen={true} onClose={() => setViewingRehearsal(null)}>
 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
 <div className={`w-full max-w-md rounded-[var(--r-l)] p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}>
 <button
 onClick={() => setViewingRehearsal(null)}
 className="absolute top-4 right-4 p-1 rounded-full text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 ✕
 </button>
 <div className="flex items-center gap-2 mb-4">
 <span className={`p-2 rounded-[var(--r-s)] ${
 editRehearsalDraft.tipo_evento ==='reunion' ?'bg-indigo-500/15 text-indigo-400' :'bg-[var(--surface)]/15 text-[var(--ok)]'
 }`}>
 {editRehearsalDraft.tipo_evento ==='reunion' ? <Handshake className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
 </span>
 <div>
 <h3 className="font-bold text-base font-display">
 {editRehearsalDraft.tipo_evento ==='reunion' ?'Ficha de la Reunión' :'Ficha del Ensayo'}
 </h3>
 <p className="text-[10px] font-mono text-[var(--ink-2)]">{editRehearsalDraft.lugar} · {editRehearsalDraft.fecha}</p>
 </div>
 </div>

 <form onSubmit={handleSaveRehearsalEdit} className="space-y-3.5">
 {editRehearsalDraft.tipo_evento ==='reunion' && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold">Asunto / Objetivo</label>
 <input
 type="text"
 value={editRehearsalDraft.asunto ||''}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, asunto: e.target.value } : prev)}
 placeholder="ej. Coordinación de gira y reparto de tareas"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 )}

 {editRehearsalDraft.tipo_evento ==='reunion' && (
 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 flex items-center gap-1">
 <Video className="w-3 h-3 text-indigo-400" />
 <span>Enlace a Videollamada</span>
 </label>
 <input
 type="url"
 value={editRehearsalDraft.enlace_reunion ||''}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, enlace_reunion: e.target.value } : prev)}
 placeholder="https://meet.google.com/xxx o Zoom"
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 )}

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Horario</label>
 <input
 type="text"
 value={editRehearsalDraft.hora}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, hora: e.target.value } : prev)}
 placeholder="ej. 18:00 - 21:00"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Lugar / Local de Ensayo</label>
 <input
 type="text"
 value={editRehearsalDraft.lugar}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, lugar: e.target.value } : prev)}
 placeholder="ej. Rock Palace, Local 4"
 required
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Estado del Ensayo</label>
 <select
 value={editRehearsalDraft.estado ||'programado'}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, estado: e.target.value as any } : prev)}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="programado">Programado</option>
 <option value="completado">Completado</option>
 <option value="cancelado">Cancelado</option>
 </select>
 </div>

 {/* Convocatoria selector */}
 <div className="space-y-2 border-t pt-3">
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center gap-1">
 <Users className="w-3 h-3 text-sky-400" />
 <span>Tipo de Convocatoria</span>
 </label>
 <select
 value={editRehearsalDraft.convocatoria_tipo ||'completa'}
 onChange={(e) => {
 const val = e.target.value as'completa' |'parcial';
 setEditRehearsalDraft(prev => prev ? {
 ...prev,
 convocatoria_tipo: val,
 convocados_ids: val ==='completa' ? effectiveBandMembers.map(m => m.id) : (prev.convocados_ids || [])
 } : prev);
 }}
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="completa">Banda Completa (Todos convocados)</option>
 <option value="parcial">Convocatoria Parcial (Seleccionar miembros)</option>
 </select>

 {editRehearsalDraft.convocatoria_tipo ==='parcial' && (
 <div className={`p-2.5 rounded-[var(--r-m)] space-y-2 text-[10px] ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] border-[var(--hair)]800 text-[var(--ink-2)]'
 }`}>
 <span className="font-mono font-bold block text-[var(--ink-2)]">Selecciona miembros convocados:</span>
 <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
 {effectiveBandMembers.map(member => {
 const currentIds = editRehearsalDraft.convocados_ids || [];
 const isChecked = currentIds.includes(member.id);
 return (
 <label key={member.id} className="flex items-center gap-2 cursor-pointer select-none font-mono">
 <input
 type="checkbox"
 checked={isChecked}
 onChange={(e) => {
 if (e.target.checked) {
 setEditRehearsalDraft(prev => prev ? { ...prev, convocados_ids: [...(prev.convocados_ids || []), member.id] } : prev);
 } else {
 setEditRehearsalDraft(prev => prev ? { ...prev, convocados_ids: (prev.convocados_ids || []).filter(id => id !== member.id) } : prev);
 }
 }}
 className="rounded text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
 />
 <span>{member.name} {member.role ==='leader' ?'(Líder)' :''}</span>
 </label>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1 font-bold flex items-center justify-between">
 <span className="flex items-center gap-1 text-[var(--ok)]">
 <Music className="w-3 h-3" />
 <span>Repertorio / Setlist a Ensayar</span>
 </span>
 {editRehearsalDraft.setlistId && (
 <span className="text-[9px] font-mono text-[var(--ok)]">
 {availableSetlists.find((s: any) => s.id === editRehearsalDraft.setlistId)?.items?.length || 0} temas
 </span>
 )}
 </label>
 <select
 value={editRehearsalDraft.setlistId ||''}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, setlistId: e.target.value || undefined } : prev)}
 className={`w-full px-2 py-1.5 text-[10px] rounded-[var(--r-s)] outline-none font-mono ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 >
 <option value="">-- Sin repertorio asignado --</option>
 {availableSetlists.map((s: any) => (
 <option key={s.id} value={s.id}>
 {s.nombre} {s.tipoFormato ? `(${s.tipoFormato.replace('_','')})` :''} • {s.items?.filter((i: any) => i.tipoItem ==='cancion')?.length ?? s.items?.length ?? 0} temas
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[10px] font-mono text-[var(--ink-2)] mb-1">Notas / Objetivo del Ensayo</label>
 <textarea
 value={editRehearsalDraft.notas}
 onChange={(e) => setEditRehearsalDraft(prev => prev ? { ...prev, notas: e.target.value } : prev)}
 rows={3}
 placeholder="ej. Repasar repertorio del concierto del fin de semana."
 className={`w-full px-2 py-1 text-[10px] rounded-[var(--r-s)] outline-none ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="pt-2 flex justify-end gap-2">
 <button
 type="button"
 onClick={() => setViewingRehearsal(null)}
 className="px-2 py-1 text-[10px] font-mono rounded-[var(--r-s)] text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className={`px-3 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-all cursor-pointer shadow-md ${
 isStitchLight ?'bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)]' :'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc-ink)] font-bold shadow-emerald-500/20'
 }`}
 >
 Guardar Cambios
 </button>
 </div>
 </form>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* Modal de Sincronización Automática con Google Calendar / Apple iCal */}
 {showSyncModal && (
 <ModalPortal>
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
 <div className={`relative w-full max-w-xl rounded-[var(--r-l)] p-6 shadow-2xl ${
 isStitchLight ?"bg-white text-[var(--ink)]" :"bg-[var(--surface)] /30 text-[var(--ink)] shadow-amber-0/10"
 }`}>
 <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[var(--hair)]10">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc)]">
 <Radio className="w-5 h-5 animate-pulse" />
 </div>
 <div>
 <h3 className="text-base font-bold font-display uppercase tracking-wider text-[var(--acc)]">
 Sincronización Automática en Tiempo Real
 </h3>
 <p className="text-xs text-[var(--ink-2)]">
 Conciertos y ensayos siempre actualizados en tu móvil sin descargar archivos cada vez
 </p>
 </div>
 </div>
 <button
 onClick={() => setShowSyncModal(false)}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 ✕
 </button>
 </div>

 <div className="space-y-4 text-xs">
 <div className={`p-3.5 rounded-[var(--r-m)] ${
 isStitchLight ?"bg-amber-50 text-[var(--ink)]" :"bg-[var(--acc-soft)] /30 text-[var(--ink)]"
 }`}>
 <p className="font-semibold mb-1 flex items-center gap-1.5">
 <Sparkles className="w-4 h-4 text-[var(--acc)] shrink-0" />
 ¿Cómo funciona la sincronización automática?
 </p>
 <p className="text-[11px] opacity-90 leading-relaxed">
 Al suscribirte mediante la URL en vivo (feed webcal), tu app de calendario (Google Calendar, Apple Calendar en iPhone/Mac o Outlook) consultará automáticamente a BandManager. Cuando crees o actualices un bolo o ensayo en BandManager, aparecerá en tu calendario personal sin que tengas que volver a descargar nada.
 </p>
 </div>

 {isMultiBandUser && (
 <div className="p-3 rounded-[var(--r-m)] bg-black/40 border-[var(--hair)]10 space-y-2">
 <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--acc)] font-bold">
 ¿Qué bandas quieres incluir en tu agenda?
 </label>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => setSyncScope('all')}
 className={`px-3 py-2 rounded-[var(--r-s)] text-left transition-all cursor-pointer ${
 syncScope ==='all'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-neutral-750'
 }`}
 >
 <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
 <Users className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Todas mis Bandas</span>
 </div>
 <p className="text-[10px] opacity-75 leading-tight">
 {effectiveBandsList.map(b => b.bandName).join(' +')}
 </p>
 </button>

 <button
 type="button"
 onClick={() => setSyncScope('active')}
 className={`px-3 py-2 rounded-[var(--r-s)] text-left transition-all cursor-pointer ${
 syncScope ==='active'
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink-2)] hover:bg-neutral-750'
 }`}
 >
 <div className="flex items-center gap-1.5 text-xs font-bold mb-0.5">
 <Music className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Solo {activeBandName}</span>
 </div>
 <p className="text-[10px] opacity-75 leading-tight">
 Únicamente eventos de {activeBandName}
 </p>
 </button>
 </div>
 </div>
 )}

 <div>
 <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-2)] mb-1.5 font-bold">
 URL de Suscripción en Tiempo Real:
 </label>
 <div className="flex items-center gap-2">
 <input
 type="text"
 readOnly
 value={errorFeed || urlFeedAbsoluta ||'Generando enlace...'}
 className={`flex-1 px-3 py-2 text-xs font-mono rounded-[var(--r-s)] outline-none select-all ${
 isStitchLight ?"bg-[var(--sunken)] text-[var(--ink)]" :"bg-[var(--surface)] text-[var(--acc)]/70"
 }`}
 />
 <button
 onClick={() => {
 if (!urlFeedAbsoluta) return;
 navigator.clipboard.writeText(urlFeedAbsoluta);
 setCopiedFeed(true);
 setTimeout(() => setCopiedFeed(false), 2500);
 }}
 className={`px-3 py-2 rounded-[var(--r-s)] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
 copiedFeed
 ?"bg-emerald-600 text-[var(--ink)]"
 :"bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)]"
 }`}
 >
 {copiedFeed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
 <span>{copiedFeed ?"¡Copiado!" :"Copiar URL"}</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
 <a
 href={`https://calendar.google.com/calendar/r/settings/addbyurl?cid=${encodeURIComponent(urlFeedAbsoluta)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-center gap-2 p-2.5 rounded-[var(--r-m)] bg-blue-600 hover:bg-blue-500 text-[var(--ink)] font-bold transition-all shadow-md active:scale-95"
 >
 <ExternalLink className="w-4 h-4" />
 <span>Añadir a Google Calendar</span>
 </a>

 <a
 href={rutaFeed ? `webcal://${window.location.host}${rutaFeed}` : undefined}
 className="flex items-center justify-center gap-2 p-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] font-bold transition-all shadow-md active:scale-95"
 >
 <Radio className="w-4 h-4 text-emerald-400" />
 <span>Suscribir en iPhone / Mac</span>
 </a>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)]/60 border-[var(--hair)]5 space-y-1.5 text-[11px] text-[var(--ink)]">
 <p className="font-bold text-[var(--ink-2)]">Pasos en Google Calendar (1 minuto):</p>
 <ol className="list-decimal list-inside space-y-1 text-[var(--ink-2)]">
 <li>Haz clic en el botón azul <strong>"Añadir a Google Calendar"</strong> de arriba.</li>
 <li>Si lo añades manualmente: ve a <em>"Otros calendarios" (+)</em> ➔ <strong>"Desde URL"</strong> en Google Calendar.</li>
 <li>Pega la URL de suscripción y confirma.</li>
 <li>¡Listo! Google Calendar sincronizará los cambios automáticamente.</li>
 </ol>
 </div>
 </div>

 <div className="mt-5 pt-3 border-t border-[var(--hair)]10 flex items-center justify-between">
 <a
 href={rutaFeed || undefined}
 download={`calendar-${activeBandId ||'band'}.ics`}
 className="text-[11px] font-mono text-[var(--ink-2)] hover:text-[var(--acc)]/70 underline flex items-center gap-1"
 >
 <Download className="w-3 h-3" />
 <span>O si prefieres, descargar archivo .ics puntual</span>
 </a>
 <button
 onClick={() => setShowSyncModal(false)}
 className="px-4 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-xs font-bold text-[var(--ink)] transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* Modal de Enviar Recordatorio / Notificación de Calendario */}
 {showReminderModal && (
 <ModalPortal>
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
 <div className={`max-w-md w-full rounded-[var(--r-l)] p-5 shadow-2xl relative ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 <div className="flex items-center justify-between pb-3 border-b border-[var(--hair)]">
 <div className="flex items-center gap-2">
 <div className="p-2 rounded-[var(--r-m)] bg-sky-500/10 text-sky-400">
 <Bell className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-sm">Enviar Recordatorio a la Banda</h3>
 <p className="text-[10px] text-[var(--ink-2)] font-mono truncate max-w-[200px]">
 {selectedConcert ? `Concierto: ${selectedConcert.sala}` : (selectedRehearsal?.asunto || selectedRehearsal?.lugar ||'Evento')}
 </p>
 </div>
 </div>
 <button
 onClick={() => setShowReminderModal(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] text-sm font-bold cursor-pointer p-1"
 >
 ✕
 </button>
 </div>

 <div className="py-4 space-y-4 text-xs">
 {reminderSuccessMsg && (
 <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-[var(--r-m)] font-mono text-[11px]">
 {reminderSuccessMsg}
 </div>
 )}

 {reminderErrorMsg && (
 <div className="p-3 bg-red-500/10 text-red-400 rounded-[var(--r-m)] font-mono text-[11px]">
 {reminderErrorMsg}
 </div>
 )}

 <div className={`p-3 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/80'}`}>
 <div className="font-mono text-[10px] text-sky-400 font-bold mb-1 uppercase tracking-wider">Detalles del Evento</div>
 <p className="font-semibold">{selectedConcert ? `Concierto en ${selectedConcert.sala} (${selectedConcert.ciudad})` : (selectedRehearsal?.asunto || selectedRehearsal?.lugar ||'Ensayo/Reunión')}</p>
 <p className="text-[11px] text-[var(--ink-2)] font-mono mt-0.5">
 📅 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 {selectedRehearsal?.hora ? ` a las ${selectedRehearsal.hora}` :''}
 </p>
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-2)] mb-1">
 Destinatarios ({effectiveBandMembers.length} miembros)
 </label>
 <div className="flex flex-wrap gap-1 font-mono text-[10px]">
 {effectiveBandMembers.map((m: any, idx: number) => (
 <span key={idx} className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300">
 👤 {m.name} {m.email ? `(${m.email})` :''}
 </span>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--ink-2)] mb-1">
 Nota adicional / Indicaciones (Opcional)
 </label>
 <textarea
 value={reminderNotes}
 onChange={(e) => setReminderNotes(e.target.value)}
 placeholder="Ej: Traer la lista de repertorio revisada o llegar 15 min antes para probar sonido..."
 rows={3}
 className={`w-full p-2 text-xs rounded-[var(--r-m)] outline-none font-sans ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="space-y-2 pt-1 border-t /60">
 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="chk-send-push"
 checked={reminderSendPush}
 onChange={(e) => setReminderSendPush(e.target.checked)}
 className="rounded cursor-pointer accent-sky-500"
 />
 <label htmlFor="chk-send-push" className="text-[11px] text-sky-300 cursor-pointer font-mono font-medium flex items-center gap-1">
 📱 Notificación Push en móvil / navegador (PWA)
 </label>
 </div>

 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="chk-send-email"
 checked={reminderSendEmail}
 onChange={(e) => setReminderSendEmail(e.target.checked)}
 className="rounded cursor-pointer accent-sky-500"
 />
 <label htmlFor="chk-send-email" className="text-[11px] text-[var(--ink)] cursor-pointer font-mono flex items-center gap-1">
 📧 Enviar correo electrónico a la banda
 </label>
 </div>
</div>
 </div>

 <div className="pt-3 border-t flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowReminderModal(false)}
 className="px-3 py-1.5 rounded-[var(--r-m)] text-xs text-[var(--ink)] hover:bg-[var(--surface)]/80 font-mono cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 disabled={reminderSending}
 onClick={handleSendEventReminder}
 className="px-4 py-1.5 rounded-[var(--r-m)] bg-sky-500 hover:bg-sky-400 text-xs font-bold text-[var(--ink)] font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md"
 >
 {reminderSending ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Enviando...</span>
 </>
 ) : (
 <>
 <Send className="w-3.5 h-3.5" />
 <span>Enviar Recordatorio</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* Ficha Modal Emergente y Centrada del Evento, con navegación cronológica < / > entre
 todos los conciertos y ensayos de la banda activa. */}
 {showEventFichaModal && (() => {
 const modalEvent = selectedConcert || selectedRehearsal;
 const isConcert = !!selectedConcert;
 const modalBandInfo = getBandIdentity(modalEvent?.band_id, (modalEvent as any)?.bandName || (modalEvent as any)?.band_name);
 const modalPosLabel = allChronologicalEvents.length > 0
 ? `${activeChronoIndex >= 0 ? activeChronoIndex + 1 : 1} de ${allChronologicalEvents.length}`
 :'';
 const eventCity = selectedConcert?.ciudad || (selectedRehearsal?.lugar?.includes(',') ? selectedRehearsal.lugar.split(',').pop()?.trim() :'') || (selectedRehearsal && !selectedRehearsal.lugar?.toLowerCase().includes('online') ? selectedRehearsal.lugar :'') ||'';
 const eventDateStr = modalEvent ? modalEvent.fecha.split('T')[0] :'';
 const eventTimeStr = selectedConcert ?'21:30' : (selectedRehearsal?.hora ||'20:00');
 const isConfirmingDelete = deletingEventConfirmId === modalEvent?.id;
 const modalRoadbookKey = eventDateStr || selectedDateKey;
 const modalRoadbook = getCurrentRoadbook(modalRoadbookKey, selectedConcert);
 return (
 <ModalPortal isOpen={showEventFichaModal} onClose={() => setShowEventFichaModal(false)}>
 <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 sm:pt-16 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
 <div 
 onTouchStart={handleModalTouchStart}
 onTouchMove={handleModalTouchMove}
 onTouchEnd={handleModalTouchEnd}
 className={`relative w-full max-w-3xl rounded-[var(--r-l)] border-2 shadow-2xl max-h-[85vh] sm:max-h-[88vh] overflow-y-auto ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] /50 text-[var(--ink-2)] shadow-amber-0/10'
 }`}>
 {/* Barra superior del modal: navegación cronológica entre eventos */}
 <div className={`sticky top-0 z-10 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b backdrop-blur-md ${
 isStitchLight ?'bg-white/95' :'bg-[var(--surface)]/95 /30'
 }`}>
 <button
 type="button"
 onClick={() => goToAdjacentEvent(-1)}
 disabled={allChronologicalEvents.length === 0 || activeChronoIndex <= 0}
 className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold text-[var(--acc)] hover:bg-[var(--acc)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Evento anterior (←)"
 >
 <ChevronLeft className="w-4 h-4" />
 <span className="hidden sm:inline">Anterior</span>
 </button>

 <div className="flex flex-col items-center min-w-0">
 <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--acc)]/80 font-bold">Ficha de Evento</span>
 {modalPosLabel && (
 <span className={`text-[10px] font-mono font-bold ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>{modalPosLabel}</span>
 )}
 </div>

 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => goToAdjacentEvent(1)}
 disabled={allChronologicalEvents.length === 0 || activeChronoIndex < 0 || activeChronoIndex >= allChronologicalEvents.length - 1}
 className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold text-[var(--acc)] hover:bg-[var(--acc)]/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
 title="Evento siguiente (→)"
 >
 <span className="hidden sm:inline">Siguiente</span>
 <ChevronRight className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={() => setShowEventFichaModal(false)}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 title="Cerrar (Esc)"
 >
 ✕
 </button>
 </div>
 </div>

 <div className="p-5 sm:p-7 space-y-4">
 {/* Cabecera: Logo HD + identidad de banda + título + barra de acciones */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b /20">
 <div className="flex items-center gap-3.5 min-w-0 flex-1">
 {modalBandInfo.logoUrl ? (
 <img
 src={modalBandInfo.logoUrl}
 alt={modalBandInfo.name}
 className="w-14 h-14 sm:w-16 sm:h-16 rounded-[var(--r-l)] object-contain bg-black/40 p-1 shrink-0 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
 onError={(e) => {
 (e.currentTarget as HTMLElement).style.display ='none';
 const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials-modal');
 if (fb) (fb as HTMLElement).classList.remove('hidden');
 }}
 />
 ) : null}
 <span className={`fallback-initials-modal w-14 h-14 sm:w-16 sm:h-16 rounded-[var(--r-l)] shrink-0 flex items-center justify-center text-xl font-black drop-shadow-lg ${modalBandInfo.palette.badge} ${modalBandInfo.logoUrl ?'hidden' :''}`}>
 {modalBandInfo.initials}
 </span>
 <div className="min-w-0 flex-1">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 inline-flex items-center gap-1">
 🎸 {modalBandInfo.name}
 </span>
 <h3 className={`text-xl font-bold font-display tracking-wide mt-1 truncate ${textTitle}`}>{selectedEventTitle}</h3>
 <p className={`text-[11px] font-mono mt-0.5 ${textSub}`}>
 {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
 </p>
 {modalWeatherAlerts.length > 0 && (
 <div className="flex flex-wrap items-center gap-1.5 mt-2">
 {modalWeatherAlerts.map(alert => (
 <CalendarWeatherBadge key={alert.id} alert={alert} />
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Barra de Acciones del Evento (Editar, WhatsApp, Notificar, Copiar, Eliminar) */}
 {modalEvent && (
 <div className="flex flex-wrap items-center gap-1.5 shrink-0">
 <button
 type="button"
 onClick={() => {
 setShowEventFichaModal(false);
 if (selectedConcert) setViewingConcert(selectedConcert);
 if (selectedRehearsal) setViewingRehearsal(selectedRehearsal);
 }}
 className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-[var(--surface)] /40 text-[var(--acc)]/70 hover:bg-[var(--surface)]/80 flex items-center gap-1"
 title="Editar todos los campos de este evento"
 >
 ✎ Editar
 </button>

 <button
 type="button"
 onClick={() => handleShareEventWhatsApp(modalEvent, isConcert)}
 className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-[var(--ok-soft)] border-emerald-500/40 text-[var(--ink-2)] hover:bg-[var(--ok-soft)] flex items-center gap-1"
 title="Compartir convocatoria por WhatsApp"
 >
 <Share2 className="w-3.5 h-3.5" />
 <span className="hidden xs:inline">WhatsApp</span>
 </button>

 <button
 type="button"
 onClick={() => handleNotifyBandMembers(modalEvent, isConcert)}
 className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-sky-950/40 border-sky-500/40 text-sky-300 hover:bg-sky-900/50 flex items-center gap-1"
 title="Enviar recordatorio / notificación push a los músicos"
 >
 <Bell className="w-3.5 h-3.5" />
 <span className="hidden xs:inline">Notificar</span>
 </button>

 <button
 type="button"
 onClick={() => handleCopyEventFicha(modalEvent, isConcert)}
 className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer flex items-center gap-1 ${
 copiedEventModalId === modalEvent.id
 ?'bg-emerald-500 border-emerald-400 text-[var(--acc-ink)]'
 :'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 title="Copiar texto de convocatoria al portapapeles"
 >
 {copiedEventModalId === modalEvent.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
 <span className="hidden xs:inline">{copiedEventModalId === modalEvent.id ?'Copiado' :'Copiar'}</span>
 </button>

 <button
 type="button"
 onClick={() => setDeletingEventConfirmId(modalEvent.id)}
 className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-[var(--r-s)] transition-colors cursor-pointer bg-[var(--alert-soft)] border-rose-500/40 text-[var(--ink-2)] hover:bg-[var(--alert-soft)] flex items-center gap-1"
 title="Eliminar este evento del calendario"
 >
 <Trash2 className="w-3.5 h-3.5" />
 <span className="hidden xs:inline">Eliminar</span>
 </button>
 </div>
 )}
 </div>

 {/* Panel de Confirmación de Eliminación In-Modal */}
 {isConfirmingDelete && modalEvent && (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert-soft)] text-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
 <div className="flex items-center gap-2">
 <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
 <div>
 <p className="text-xs font-mono font-bold text-[var(--ink)]">
 ¿Confirmas que deseas eliminar este {isConcert ?'concierto' :'ensayo'}?
 </p>
 <p className="text-[10px] text-[var(--ink-2)]/80 font-sans">
 Esta acción es definitiva y retirará el evento del calendario y agenda de la banda.
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={() => setDeletingEventConfirmId(null)}
 className="px-3 py-1.5 text-xs font-mono rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink)] transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={() => handleDeleteEventFromModal(modalEvent.id, isConcert)}
 className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-[var(--r-s)] bg-rose-600 hover:bg-rose-500 text-[var(--ink)] shadow-lg transition-colors cursor-pointer"
 >
 Sí, Eliminar Definitivamente
 </button>
 </div>
 </div>
 )}

 {/* Previsión Meteorológica Open-Meteo para el Evento */}
 {eventCity && eventDateStr && (
 <EventWeatherCard
 city={eventCity}
 dateStr={eventDateStr}
 timeStr={eventTimeStr}
 isStitchLight={isStitchLight}
 onAlertsDetected={(alerts) => setModalWeatherAlerts(alerts)}
 />
 )}

 {/* Pestañas de Navegación de la Ficha */}
 <div className={`flex items-center gap-1.5 border-b pb-2.5 overflow-x-auto ${isStitchLight ?'' :''}`}>
 <button
 type="button"
 onClick={() => setModalActiveTab('resumen')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 modalActiveTab ==='resumen'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow-sm'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70'
 }`}
 >
 <span>📋 Resumen & Info</span>
 </button>
 <button
 type="button"
 onClick={() => setModalActiveTab('tecnica')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 modalActiveTab ==='tecnica'
 ?'bg-sky-500 text-[var(--acc-ink)] shadow-sm'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70'
 }`}
 >
 <Wrench className="w-3.5 h-3.5" />
 <span>1. Logística Técnica</span>
 </button>
 <button
 type="button"
 onClick={() => setModalActiveTab('contactos')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 modalActiveTab ==='contactos'
 ?'bg-emerald-500 text-[var(--acc-ink)] shadow-sm'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70'
 }`}
 >
 <Phone className="w-3.5 h-3.5" />
 <span>2. Contactos Clave</span>
 {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0 && (
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 font-mono">
 {modalRoadbook.contactosClave.length}
 </span>
 )}
 </button>
 <button
 type="button"
 onClick={() => setModalActiveTab('merchan')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 modalActiveTab ==='merchan'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow-sm'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70'
 }`}
 >
 <Shirt className="w-3.5 h-3.5" />
 <span>3. Control Merchandising</span>
 {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0 && (
 <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 font-mono">
 {modalRoadbook.merchControl.items.length}
 </span>
 )}
 </button>
 <button
 type="button"
 onClick={() => setModalActiveTab('cierre')}
 className={`px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
 modalActiveTab ==='cierre'
 ?'bg-purple-500 text-[var(--ink)] shadow-sm'
 : isStitchLight
 ?'bg-[var(--sunken)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70'
 }`}
 >
 <ShieldCheck className="w-3.5 h-3.5" />
 <span>5. Cierre Material</span>
 {modalRoadbook.cierreMaterial && modalRoadbook.cierreMaterial.length > 0 && (
 <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
 modalRoadbook.cierreMaterial.every(i => i.checked)
 ?'bg-emerald-500 text-[var(--acc-ink)] font-black'
 :'bg-black/25'
 }`}>
 {modalRoadbook.cierreMaterial.filter(i => i.checked).length}/{modalRoadbook.cierreMaterial.length}
 </span>
 )}
 </button>
 </div>

 {/* TAB 1: RESUMEN GENERAL & DETALLES */}
 {modalActiveTab ==='resumen' && (
 <div className="space-y-4">
 <div className={`space-y-3 rounded-[var(--r-m)] p-4 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/80'}`}>
 <div className="flex items-center gap-2 text-[11px]">
 <Clock className={`w-4 h-4 shrink-0 ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`} />
 <span className={`font-mono ${textSub}`}>Hora:</span>
 <span className={`font-bold font-mono ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`}>{selectedEventDetails.time}</span>
 </div>
 <div className="flex items-start gap-2 text-[11px]">
 <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isStitchLight ?'text-sky-400' :'text-[var(--acc)]'}`} />
 <div className="flex-1 min-w-0">
 <span className={`font-mono ${textSub}`}>Lugar:</span>
 <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
 {selectedEventDetails.direccion && (
 <p className={`text-[11px] font-sans mt-1 ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink)]'}`}>
 <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
 </p>
 )}
 </div>
 </div>
 {selectedEventDetails.locationQuery && selectedEventDetails.type !=='free' && (
 <div className="pt-2 flex justify-center">
 <DirectionsCard
 query={selectedEventDetails.locationQuery}
 locationName={selectedEventDetails.lugar}
 address={selectedEventDetails.direccion}
 isStitchLight={isStitchLight}
 />
 </div>
 )}
 {!isPromoPlan && selectedEventDetails.type ==='concert' && (
 <div className="flex items-center gap-2 text-[11px] pt-2 border-t /40">
 <Sparkles className="w-4 h-4 text-[var(--ok)] shrink-0" />
 <span className={`font-mono ${textSub}`}>Compensación:</span>
 <span className="text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
 </div>
 )}
 {selectedEventDetails.type ==='concert' && (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
 <div className="flex flex-col gap-1.5 pt-2 border-t /40">
 {selectedEventDetails.entradasUrl && (
 <a
 href={selectedEventDetails.entradasUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-[11px] font-mono font-bold bg-emerald-500 text-[var(--acc-ink)] hover:bg-emerald-400 transition-colors w-fit"
 >
 <Ticket className="w-3.5 h-3.5" /> Comprar Entradas
 </a>
 )}
 {selectedEventDetails.entradasLugarFisico && (
 <div className="flex items-center gap-2 text-[11px]">
 <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
 <span className={`font-mono ${textSub}`}>También en:</span>
 <span className="font-semibold font-mono">{selectedEventDetails.entradasLugarFisico}</span>
 </div>
 )}
 </div>
 )}
 {selectedConcert?.giraNombre && (
 <div className="flex items-center gap-2 text-[11px] pt-2 border-t /40">
 <Navigation className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span className={`font-mono ${textSub}`}>Gira:</span>
 <span className="font-bold font-mono text-[var(--acc)]">🚐 {selectedConcert.giraNombre}</span>
 </div>
 )}
 {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
 <div className="flex items-center gap-2 text-[11px] pt-2 border-t /40">
 <Users className="w-4 h-4 text-sky-400 shrink-0" />
 <span className={`font-mono ${textSub}`}>Convocatoria:</span>
 <span className="font-bold font-mono text-sky-400">
 {(selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) ==='completa'
 ?'Banda Completa'
 : `Parcial (${(() => {
 const raw: any = selectedConcert?.convocados_nombres || selectedRehearsal?.convocados_nombres;
 if (Array.isArray(raw)) return raw.join(',') ||'Seleccionados';
 if (typeof raw ==='string' && raw.trim()) return raw.trim();
 return'Seleccionados';
 })()})`}
 </span>
 </div>
 )}
 {selectedEventDetails.notes && (
 <div className={`text-[11px] font-sans italic pt-2 border-t /40 leading-relaxed ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 &ldquo;{selectedEventDetails.notes}&rdquo;
 </div>
 )}
 </div>

 {/* Accesos rápidos a los 3 módulos clave en el resumen */}
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
 <div 
 onClick={() => setModalActiveTab('tecnica')}
 className={`p-3 rounded-[var(--r-m)] transition-all cursor-pointer hover:border-sky-500/60 ${
 isStitchLight ?'bg-sky-50/70 border-sky-200' :'bg-sky-950/20 border-sky-500/30'
 }`}
 >
 <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-xs mb-1">
 <Wrench className="w-3.5 h-3.5" />
 <span>1. Logística Técnica</span>
 </div>
 <p className={`text-[11px] font-mono ${textSub}`}>
 {modalRoadbook.horaPruebaSonido ? `Prueba: ${modalRoadbook.horaPruebaSonido}` :'Configurar rider, P.A. y horarios'}
 </p>
 <span className="text-[10px] text-sky-400 font-mono font-semibold underline mt-1 inline-block">
 Abrir sección técnica →
 </span>
 </div>

 <div 
 onClick={() => setModalActiveTab('contactos')}
 className={`p-3 rounded-[var(--r-m)] transition-all cursor-pointer hover:border-emerald-500/60 ${
 isStitchLight ?'bg-emerald-50/70 border-emerald-200' :'bg-[var(--ok-soft)] border-emerald-500/30'
 }`}
 >
 <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs mb-1">
 <Phone className="w-3.5 h-3.5" />
 <span>2. Contactos Clave</span>
 </div>
 <p className={`text-[11px] font-mono ${textSub}`}>
 {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0
 ? `${modalRoadbook.contactosClave.length} contactos (WhatsApp directo)`
 :'Añadir contactos de sala y técnicos'}
 </p>
 <span className="text-[10px] text-emerald-400 font-mono font-semibold underline mt-1 inline-block">
 Ver directorio →
 </span>
 </div>

 <div 
 onClick={() => setModalActiveTab('merchan')}
 className={`p-3 rounded-[var(--r-m)] transition-all cursor-pointer hover:/60 ${
 isStitchLight ?'bg-amber-50/70' :'bg-[var(--acc-soft)] /30'
 }`}
 >
 <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
 <Shirt className="w-3.5 h-3.5" />
 <span>3. Control Merchandising</span>
 </div>
 <p className={`text-[11px] font-mono ${textSub}`}>
 {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0
 ? `${modalRoadbook.merchControl.items.length} productos | ${(modalRoadbook.merchControl.ingresosEfectivo || 0) + (modalRoadbook.merchControl.ingresosBizum || 0)}€ arqueo`
 :'Stock furgón vs final, Bizum y efectivo'}
 </p>
 <span className="text-[10px] text-[var(--acc)] font-mono font-semibold underline mt-1 inline-block">
 Abrir control de ventas →
 </span>
 </div>

 <div 
 onClick={() => setModalActiveTab('cierre')}
 className={`p-3 rounded-[var(--r-m)] transition-all cursor-pointer hover:border-purple-500/60 ${
 isStitchLight ?'bg-purple-50/70 border-purple-200' :'bg-purple-950/20 border-purple-500/30'
 }`}
 >
 <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-xs mb-1">
 <ShieldCheck className="w-3.5 h-3.5" />
 <span>5. Cierre Material</span>
 </div>
 <p className={`text-[11px] font-mono ${textSub}`}>
 {modalRoadbook.cierreMaterial
 ? `${modalRoadbook.cierreMaterial.filter(i => i.checked).length}/${modalRoadbook.cierreMaterial.length} verificados`
 :'Checklist de carga de furgoneta'}
 </p>
 <span className="text-[10px] text-purple-400 font-mono font-semibold underline mt-1 inline-block">
 Hacer checklist →
 </span>
 </div>
 </div>
 </div>
 )}

 {/* TAB 2: 1. LOGÍSTICA TÉCNICA */}
 {modalActiveTab ==='tecnica' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-1 border-b border-sky-500/20">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-sky-500 text-[var(--acc-ink)]">
 Sección 1
 </span>
 <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
 Logística Técnica, Horarios & Rider
 </h3>
 </div>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 Guardado automático local
 </span>
 </div>

 {/* Horarios de Producción */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 <span>Cronograma de Producción del Día</span>
 </h4>
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Llegada / Descarga</label>
 <input
 type="text"
 value={modalRoadbook.horaLlegada ||'17:00'}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaLlegada: e.target.value })}
 placeholder="17:00"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Prueba Sonido</label>
 <input
 type="text"
 value={modalRoadbook.horaPruebaSonido ||'18:00 - 19:30'}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaPruebaSonido: e.target.value })}
 placeholder="18:00 - 19:30"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Apertura Puertas</label>
 <input
 type="text"
 value={modalRoadbook.horaAperturaPuertas ||'20:30'}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaAperturaPuertas: e.target.value })}
 placeholder="20:30"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 text-[var(--acc)]`}>Show / Directo</label>
 <input
 type="text"
 value={modalRoadbook.horaShow ||'21:30'}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaShow: e.target.value })}
 placeholder="21:30"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold ${
 isStitchLight ?'bg-amber-50 text-[var(--ink)]' :'bg-[var(--acc-soft)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Toque de Queda</label>
 <input
 type="text"
 value={modalRoadbook.horaCierreToque ||'01:00'}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaCierreToque: e.target.value })}
 placeholder="01:00"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>
 </div>

 {/* Sonido P.A. & Monitores */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
 <Wrench className="w-3.5 h-3.5" />
 <span>Sistema de Sonido (P.A. & Monitoreo)</span>
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
 Especificaciones P.A. de Sala
 </label>
 <textarea
 rows={2}
 value={modalRoadbook.paEspecificaciones ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { paEspecificaciones: e.target.value })}
 placeholder="Ej: Line Array L-Acoustics / D&B, subwoofers estéreo, presión homogénea"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
 Monitoreo (In-Ears / Cuñas)
 </label>
 <textarea
 rows={2}
 value={modalRoadbook.monitoresTipo ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { monitoresTipo: e.target.value })}
 placeholder="Ej: In-Ears estéreo de la banda (traemos transmisores) + 2 cuñas de refuerzo"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
 Canales de Envíos Auxiliares
 </label>
 <input
 type="text"
 value={modalRoadbook.canalesMonitores ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { canalesMonitores: e.target.value })}
 placeholder="Ej: 4 envíos auxiliares XLR independientes a rack de IEMs"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 {/* Backline y Electricidad */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-3 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
 <Truck className="w-3.5 h-3.5" />
 <span>Backline Aportado vs Traído & Toma Eléctrica</span>
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
 Backline (Sala vs Banda)
 </label>
 <textarea
 rows={3}
 value={modalRoadbook.backlineInfo ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { backlineInfo: e.target.value })}
 placeholder="Sala aporta: Batería básica. Banda trae: Platos, pedal, guitarras, amplificadores y teclado."
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
 Potencia y Tomas Eléctricas en Escenario
 </label>
 <textarea
 rows={3}
 value={modalRoadbook.potenciaElectrica ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { potenciaElectrica: e.target.value })}
 placeholder="Ej: 2 líneas independientes Schuko 220V 16A limpias (frontal y trasera)"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>
 </div>

 {/* Input List / Rider de Canales */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-2.5 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
 <span>🎛️</span>
 <span>Input List / Lista de Canales de Microfonía</span>
 </h4>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 {(modalRoadbook.inputList ||'').split('\n').filter(Boolean).length} canales especificados
 </span>
 </div>
 <textarea
 rows={6}
 value={modalRoadbook.inputList ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { inputList: e.target.value })}
 placeholder="1. Bombo (Beta 52)&#10;2. Caja Top (SM57)&#10;3. Bajo (D.I. Radial)&#10;4. Guitarra (e906)&#10;5. Voz (Beta 58)..."
 className={`w-full px-3 py-2 rounded-[var(--r-s)] text-xs font-mono leading-relaxed ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/80 text-[var(--ink)]'
 }`}
 />
 </div>

 {/* Notas de Producción y Carga */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-2 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <label className={`block text-[10px] font-mono uppercase font-bold ${textSub}`}>
 Notas de Acceso, Muelle de Carga & Observaciones
 </label>
 <textarea
 rows={2}
 value={modalRoadbook.notasTecnicas ||''}
 onChange={(e) => updateRoadbookField(modalRoadbookKey, { notasTecnicas: e.target.value })}
 placeholder="Ej: Acceso por puerta trasera calle peatonal. Se requiere autorización de matrícula para la furgoneta."
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/60 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>
 )}

 {/* TAB 3: 2. CONTACTOS CLAVE */}
 {modalActiveTab ==='contactos' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20 flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500 text-[var(--acc-ink)]">
 Sección 2
 </span>
 <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
 Directorio de Contactos Clave de Producción
 </h3>
 </div>
 <button
 type="button"
 onClick={() => setShowAddContactForm(!showAddContactForm)}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-[var(--acc-ink)] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
 >
 <span>+</span> Añadir Contacto
 </button>
 </div>

 {/* Formulario de Nuevo Contacto */}
 {showAddContactForm && (
 <form 
 onSubmit={(e) => handleAddKeyContact(modalRoadbookKey, e)}
 className={`p-4 rounded-[var(--r-m)] space-y-3 animate-in fade-in ${
 isStitchLight ?'bg-emerald-50 border-emerald-300' :'bg-[var(--ok-soft)] border-emerald-500/40'
 }`}
 >
 <h4 className="text-xs font-mono font-bold text-emerald-400">Nuevo Contacto Clave</h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
 <div>
 <label className="block text-[10px] font-mono uppercase font-bold text-[var(--ink)] mb-1">Nombre y Apellidos *</label>
 <input
 type="text"
 required
 value={newContactNombre}
 onChange={(e) => setNewContactNombre(e.target.value)}
 placeholder="Ej: Manuel Producción"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/70 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono uppercase font-bold text-[var(--ink)] mb-1">Rol / Cargo</label>
 <select
 value={newContactRol}
 onChange={(e) => setNewContactRol(e.target.value)}
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/70 text-[var(--ink)]'
 }`}
 >
 <option value="Promotor / Sala">Promotor / Sala</option>
 <option value="Técnico de Sonido (P.A.)">Técnico de Sonido (P.A.)</option>
 <option value="Técnico de Monitores">Técnico de Monitores</option>
 <option value="Técnico de Iluminación">Técnico de Iluminación</option>
 <option value="Producción / Camerinos">Producción / Camerinos</option>
 <option value="Hotel / Alojamiento">Hotel / Alojamiento</option>
 <option value="Seguridad / Acceso">Seguridad / Acceso</option>
 <option value="Road Manager">Road Manager</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-mono uppercase font-bold text-[var(--ink)] mb-1">Teléfono (WhatsApp) *</label>
 <input
 type="tel"
 required
 value={newContactTelefono}
 onChange={(e) => setNewContactTelefono(e.target.value)}
 placeholder="+34 600 000 000"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/70 text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="block text-[10px] font-mono uppercase font-bold text-[var(--ink)] mb-1">Email</label>
 <input
 type="email"
 value={newContactEmail}
 onChange={(e) => setNewContactEmail(e.target.value)}
 placeholder="produccion@sala.com"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/70 text-[var(--ink)]'
 }`}
 />
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-mono uppercase font-bold text-[var(--ink)] mb-1">Notas u observaciones</label>
 <input
 type="text"
 value={newContactNotas}
 onChange={(e) => setNewContactNotas(e.target.value)}
 placeholder="Ej: Contacto para cobro de taquilla y apertura de puerta muelle"
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black/70 text-[var(--ink)]'
 }`}
 />
 </div>
 <div className="flex justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setShowAddContactForm(false)}
 className="px-3 py-1.5 text-xs font-mono rounded-[var(--r-s)] hover:bg-[var(--surface)]/80 text-[var(--ink)] transition-colors"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-4 py-1.5 text-xs font-mono font-bold rounded-[var(--r-s)] bg-emerald-500 hover:bg-emerald-400 text-[var(--acc-ink)] transition-colors"
 >
 Guardar Contacto
 </button>
 </div>
 </form>
 )}

 {/* Lista de Contactos */}
 <div className="space-y-2.5">
 {(modalRoadbook.contactosClave || []).length === 0 ? (
 <div className="text-center py-6 text-[var(--ink-2)] font-mono text-xs">
 No hay contactos clave registrados para este concierto.
 <p className="text-[10px] mt-1 text-emerald-400">Pulsa en &ldquo;+ Añadir Contacto&rdquo; para registrar promotor, técnico de sonido o producción.</p>
 </div>
 ) : (
 (modalRoadbook.contactosClave || []).map((contact) => (
 <div
 key={contact.id}
 className={`p-3.5 rounded-[var(--r-m)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
 isStitchLight ?'bg-white hover:border-emerald-400' :'bg-[var(--surface)] hover:border-emerald-500/40'
 }`}
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className="text-xs font-mono font-bold text-[var(--ink)]">
 {contact.nombre}
 </span>
 <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/20 text-[var(--ink-2)]">
 {contact.rol}
 </span>
 </div>
 <p className="text-xs font-mono text-[var(--ink)]">
 📞 {contact.telefono}
 {contact.email && <span className="ml-2 text-[var(--ink-2)]">✉️ {contact.email}</span>}
 </p>
 {contact.notas && (
 <p className="text-[11px] font-sans text-[var(--ink-2)] mt-1 italic">
 &ldquo;{contact.notas}&rdquo;
 </p>
 )}
 </div>

 {/* Botones de acción rápida: WhatsApp directo, llamada, eliminar */}
 <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
 <button
 type="button"
 onClick={() => openWhatsAppContact(contact, eventDateStr, selectedEventDetails.lugar ||'la sala')}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-[var(--ink)] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
 title="Abrir WhatsApp directo con mensaje predefinido"
 >
 <MessageSquare className="w-3.5 h-3.5" />
 <span>WhatsApp</span>
 </button>
 <a
 href={`tel:${contact.telefono.replace(/\s+/g,'')}`}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold text-[var(--ink-2)] hover:bg-emerald-500/10 flex items-center gap-1 transition-colors"
 title="Llamar directamente por teléfono"
 >
 <Phone className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Llamar</span>
 </a>
 <button
 type="button"
 onClick={() => handleDeleteKeyContact(contact.id, modalRoadbookKey)}
 className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-rose-400 hover:bg-[var(--alert-soft)] transition-colors cursor-pointer"
 title="Eliminar este contacto"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {/* TAB 3: 3. CONTROL DE MERCHANDISING POR BOLO */}
 {modalActiveTab ==='merchan' && (() => {
 const merch = modalRoadbook.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
 const items = merch.items || [];
 const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
 const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
 const totalVendidas = Math.max(0, totalInicial - totalFinal);
 const totalVentaTeorica = items.reduce((acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0), 0);
 const totalCobradoReal = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
 const diferenciaCuadre = totalCobradoReal - totalVentaTeorica;
 const porcentajeVendido = totalInicial > 0 ? Math.round((totalVendidas / totalInicial) * 100) : 0;

 const categoriaIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
 camisetas: { icon: <Shirt className="w-3.5 h-3.5" />, label:'Camisetas', color:'text-[var(--acc)] bg-[var(--acc)]/15 /30' },
 vinilos: { icon: <Disc3 className="w-3.5 h-3.5" />, label:'Vinilos', color:'text-sky-400 bg-sky-500/15 border-sky-500/30' },
 musica: { icon: <Music className="w-3.5 h-3.5" />, label:'Música (CD/Tape)', color:'text-purple-400 bg-purple-500/15 border-purple-500/30' },
 accesorios: { icon: <Tag className="w-3.5 h-3.5" />, label:'Accesorios & Púas', color:'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
 otro: { icon: <ShoppingBag className="w-3.5 h-3.5" />, label:'Otro', color:'text-rose-400 bg-rose-500/15 border-rose-500/30' }
 };

 return (
 <div className="space-y-4">
 {/* Cabecera de la Sección de Merchan */}
 <div className="flex items-center justify-between pb-1 border-b /20 flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-[var(--acc)] text-[var(--acc-ink)]">
 Sección 3
 </span>
 <div>
 <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
 Control de Merchandising por Bolo
 </h3>
 <p className={`text-[11px] font-mono ${textSub}`}>
 Inventario que sube a la furgoneta vs. stock final de noche, arqueo de Efectivo y Bizum
 </p>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => handleCopyMerchSummary(modalRoadbook, modalRoadbookKey, selectedConcert)}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 transition-colors flex items-center gap-1 cursor-pointer"
 title="Copiar arqueo y balance para WhatsApp"
 >
 {merchCopiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
 <span>{merchCopiedToast ?'¡Copiado!' :'Copiar Arqueo (WhatsApp)'}</span>
 </button>
 <button
 type="button"
 onClick={() => setShowAddMerchForm(!showAddMerchForm)}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-[var(--acc)] text-[var(--acc-ink)] hover:bg-[var(--acc)]/60 transition-colors flex items-center gap-1 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>{showAddMerchForm ?'Cerrar' :'+ Añadir Producto'}</span>
 </button>
 </div>
 </div>

 {/* Toast de copiado */}
 {merchCopiedToast && (
 <motion.div
 initial={{ opacity: 0, y: -6 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-2.5 rounded-[var(--r-s)] bg-emerald-500/20 text-[var(--ink-2)] text-xs font-mono flex items-center gap-2"
 >
 <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
 <span>¡Resumen de arqueo y ventas copiado al portapapeles con formato WhatsApp para el grupo de la banda!</span>
 </motion.div>
 )}

 {/* KPI Grid: Cuadre y Métricas Principales */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
 <div className={`p-2.5 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <Truck className="w-3 h-3 text-sky-400" /> Sube a Furgón
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalInicial}</span>
 <span className="text-[10px] text-[var(--ink-2)] font-mono">uds</span>
 </div>
 <p className="text-[9px] text-[var(--ink-2)] font-mono">Inventario de salida</p>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <ShoppingBag className="w-3 h-3 text-[var(--acc)]" /> Stock Final
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalFinal}</span>
 <span className="text-[10px] text-[var(--ink-2)] font-mono">uds</span>
 </div>
 <p className="text-[9px] text-[var(--ink-2)] font-mono">Quedan en furgoneta</p>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <Zap className="w-3 h-3 text-emerald-400" /> Vendidas
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className="text-lg font-bold font-mono text-emerald-400">{totalVendidas}</span>
 <span className="text-[10px] text-emerald-400/70 font-mono font-bold">({porcentajeVendido}%)</span>
 </div>
 <p className="text-[9px] text-[var(--ink-2)] font-mono">Salidas del bolo</p>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <Calculator className="w-3 h-3 text-purple-400" /> Venta Teórica
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className="text-lg font-bold font-mono text-purple-400">{totalVentaTeorica.toFixed(2)}</span>
 <span className="text-[10px] text-[var(--ink-2)] font-mono">€</span>
 </div>
 <p className="text-[9px] text-[var(--ink-2)] font-mono">Según inventario</p>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/60'}`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <Coins className="w-3 h-3 text-emerald-400" /> Cobrado Real
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className="text-lg font-bold font-mono text-emerald-400">{totalCobradoReal.toFixed(2)}</span>
 <span className="text-[10px] text-[var(--ink-2)] font-mono">€</span>
 </div>
 <p className="text-[9px] text-[var(--ink-2)] font-mono">Efectivo + Bizum</p>
 </div>

 <div className={`p-2.5 rounded-[var(--r-m)] ${
 diferenciaCuadre === 0
 ? isStitchLight ?'bg-emerald-50 border-emerald-300' :'bg-[var(--ok-soft)] border-emerald-500/40'
 : diferenciaCuadre > 0
 ? isStitchLight ?'bg-sky-50 border-sky-300' :'bg-sky-950/30 border-sky-500/40'
 : isStitchLight ?'bg-rose-50 border-rose-300' :'bg-[var(--alert-soft)] border-rose-500/40'
 }`}>
 <span className="text-[10px] font-mono uppercase text-[var(--ink-2)] flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" /> Cuadre Caja
 </span>
 <div className="mt-1 flex items-baseline gap-1">
 <span className={`text-base font-bold font-mono ${
 diferenciaCuadre === 0 ?'text-emerald-400' : diferenciaCuadre > 0 ?'text-sky-400' :'text-rose-400'
 }`}>
 {diferenciaCuadre === 0 ?'0.00' : (diferenciaCuadre > 0 ? `+${diferenciaCuadre.toFixed(2)}` : diferenciaCuadre.toFixed(2))}
 </span>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">€</span>
 </div>
 <p className={`text-[9px] font-mono font-bold ${
 diferenciaCuadre === 0 ?'text-emerald-400' : diferenciaCuadre > 0 ?'text-sky-400' :'text-rose-400'
 }`}>
 {diferenciaCuadre === 0 ?'✓ Caja exacta' : diferenciaCuadre > 0 ?'Superávit / Propinas' :'Descuadre faltante'}
 </p>
 </div>
 </div>

 {/* Formulario Añadir Producto */}
 <AnimatePresence>
 {showAddMerchForm && (
 <motion.form
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height:'auto' }}
 exit={{ opacity: 0, height: 0 }}
 onSubmit={(e) => handleAddMerchItem(modalRoadbookKey, e)}
 className={`p-3.5 rounded-[var(--r-m)] space-y-3 ${
 isStitchLight ?'bg-amber-50/70' :'bg-[var(--acc-soft)] /30'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
 <Plus className="w-3.5 h-3.5" /> Nuevo Artículo de Merchandising para este Concierto
 </span>
 <button
 type="button"
 onClick={() => setShowAddMerchForm(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink-2)] text-xs font-mono cursor-pointer"
 >
 ✕ Cancelar
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
 <div className="md:col-span-2">
 <label className={`block text-[10px] mb-1 ${textSub}`}>Nombre del Producto *</label>
 <input
 type="text"
 required
 placeholder="Ej: Camiseta Gira Oficial, Vinilo LP..."
 value={newMerchNombre}
 onChange={(e) => setNewMerchNombre(e.target.value)}
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] outline-none text-xs ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 </div>

 <div>
 <label className={`block text-[10px] mb-1 ${textSub}`}>Categoría</label>
 <select
 value={newMerchCategoria}
 onChange={(e) => setNewMerchCategoria(e.target.value as any)}
 className={`w-full px-2 py-1.5 rounded-[var(--r-s)] outline-none text-xs ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 <option value="camisetas">👕 Camisetas</option>
 <option value="vinilos">💿 Vinilos</option>
 <option value="musica">🎵 Música (CD/Tape)</option>
 <option value="accesorios">🎸 Púas / Accesorios</option>
 <option value="otro">🏷️ Otro</option>
 </select>
 </div>

 <div>
 <label className={`block text-[10px] mb-1 ${textSub}`}>Talla / Versión</label>
 <input
 type="text"
 placeholder="Ej: M, L, XL, 12'', Pack..."
 value={newMerchTalla}
 onChange={(e) => setNewMerchTalla(e.target.value)}
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] outline-none text-xs ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-1.5">
 <div>
 <label className={`block text-[10px] mb-1 ${textSub}`}>Precio (€)</label>
 <input
 type="number"
 step="0.5"
 min="0"
 value={newMerchPrecio}
 onChange={(e) => setNewMerchPrecio(e.target.value)}
 className={`w-full px-2 py-1.5 rounded-[var(--r-s)] outline-none text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 </div>
 <div>
 <label className={`block text-[10px] mb-1 ${textSub}`}>Furgón (uds)</label>
 <input
 type="number"
 min="0"
 value={newMerchStockInicial}
 onChange={(e) => setNewMerchStockInicial(e.target.value)}
 className={`w-full px-2 py-1.5 rounded-[var(--r-s)] outline-none text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 </div>
 </div>
 </div>

 <div className="flex justify-end pt-1">
 <button
 type="submit"
 className="px-4 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold bg-[var(--acc)] text-[var(--acc-ink)] hover:bg-[var(--acc)]/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Guardar Producto en el Bolo</span>
 </button>
 </div>
 </motion.form>
 )}
 </AnimatePresence>

 {/* Tabla de Artículos: Sube a Furgoneta vs Stock Final Noche */}
 <div className={`rounded-[var(--r-m)] overflow-hidden ${isStitchLight ?'bg-white' :'bg-[var(--surface)]/90'}`}>
 <div className="p-3 border-b /80 flex items-center justify-between flex-wrap gap-2">
 <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--acc)] flex items-center gap-1.5">
 <Shirt className="w-4 h-4" /> Inventario de Merchandising ({items.length} productos)
 </span>
 <span className={`text-[11px] font-mono ${textSub}`}>
 Ajusta las unidades al subir a la furgoneta y al terminar el bolo
 </span>
 </div>

 {items.length === 0 ? (
 <div className="p-8 text-center space-y-2">
 <Shirt className="w-8 h-8 text-[var(--ink-2)] mx-auto" />
 <p className={`text-xs font-mono ${textSub}`}>
 Aún no has registrado productos para este bolo.
 </p>
 <button
 type="button"
 onClick={() => setShowAddMerchForm(true)}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)]/70 hover:bg-[var(--acc)]/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Añadir primer producto</span>
 </button>
 </div>
 ) : (
 <div className="divide-y divide-[var(--hair)]800/60">
 {items.map((item) => {
 const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
 const subtotal = vendidas * (item.precioUnitario || 0);
 const catConfig = categoriaIcons[item.categoria] || categoriaIcons.otro;
 const pctVendido = item.stockInicial > 0 ? Math.round((vendidas / item.stockInicial) * 100) : 0;

 return (
 <div
 key={item.id}
 className={`p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
 isStitchLight ?'hover:bg-[var(--bg)]' :'hover:bg-[var(--surface)]/40'
 }`}
 >
 {/* Datos del producto */}
 <div className="flex items-center gap-2.5 min-w-[220px]">
 <div className={`p-2 rounded-[var(--r-s)] shrink-0 ${catConfig.color}`}>
 {catConfig.icon}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-1.5 flex-wrap">
 <h4 className={`text-xs font-bold font-sans ${textTitle}`}>
 {item.nombre}
 </h4>
 {item.talla && (
 <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[var(--surface)]/80 text-[var(--ink)]">
 {item.talla}
 </span>
 )}
 </div>
 <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[var(--ink-2)]">
 <span>Precio: <strong className="text-[var(--acc)]">{item.precioUnitario}€</strong></span>
 <span>•</span>
 <span>{catConfig.label}</span>
 </div>
 </div>
 </div>

 {/* Controles de Stock Inicial (Sube a Furgoneta) y Stock Final */}
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center flex-1 max-w-lg">
 {/* Sube a Furgoneta */}
 <div className={`p-1.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 <span className="block text-[9px] font-mono text-[var(--ink-2)] mb-1 flex items-center gap-1">
 <Truck className="w-2.5 h-2.5 text-sky-400" /> Sube Furgón
 </span>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockInicial: Math.max(0, (item.stockInicial || 0) - 1)
 })}
 className="w-5 h-5 rounded bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
 >
 -
 </button>
 <input
 type="number"
 min="0"
 value={item.stockInicial}
 onChange={(e) => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockInicial: Math.max(0, parseInt(e.target.value, 10) || 0)
 })}
 className={`w-12 text-center text-xs font-mono font-bold py-0.5 rounded outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <button
 type="button"
 onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockInicial: (item.stockInicial || 0) + 1
 })}
 className="w-5 h-5 rounded bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
 >
 +
 </button>
 </div>
 </div>

 {/* Stock Final (Fin de Noche) */}
 <div className={`p-1.5 rounded-[var(--r-s)] ${isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'}`}>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[9px] font-mono text-[var(--ink-2)] flex items-center gap-1">
 <DoorClosed className="w-2.5 h-2.5 text-[var(--acc)]" /> Stock Final
 </span>
 <button
 type="button"
 onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, { stockFinal: 0 })}
 className="text-[8px] font-mono px-1 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30 cursor-pointer"
 title="Marcar como agotado tras el concierto"
 >
 Agotado (0)
 </button>
 </div>
 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockFinal: Math.max(0, (item.stockFinal || 0) - 1)
 })}
 className="w-5 h-5 rounded bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
 >
 -
 </button>
 <input
 type="number"
 min="0"
 value={item.stockFinal}
 onChange={(e) => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockFinal: Math.max(0, parseInt(e.target.value, 10) || 0)
 })}
 className={`w-12 text-center text-xs font-mono font-bold py-0.5 rounded outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <button
 type="button"
 onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, {
 stockFinal: (item.stockFinal || 0) + 1
 })}
 className="w-5 h-5 rounded bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink)] text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
 >
 +
 </button>
 </div>
 </div>

 {/* Resumen Ventas del Artículo */}
 <div className="col-span-2 sm:col-span-1 flex flex-col items-end justify-center pr-2">
 <div className="text-right">
 <span className="text-xs font-mono font-black text-[var(--acc)]">
 {vendidas} vendidas
 </span>
 <span className="block text-xs font-mono font-bold text-emerald-400">
 {subtotal.toFixed(2)} €
 </span>
 </div>
 <div className="w-20 bg-[var(--surface)]/80 rounded-full h-1 mt-1 overflow-hidden">
 <div
 className="h-full bg-[var(--acc)]/60 transition-all duration-300"
 style={{ width: `${Math.min(100, pctVendido)}%` }}
 />
 </div>
 </div>
 </div>

 {/* Acciones */}
 <div className="flex items-center justify-end">
 <button
 type="button"
 onClick={() => handleDeleteMerchItem(modalRoadbookKey, item.id)}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-rose-400 hover:bg-[var(--alert-soft)] transition-colors cursor-pointer"
 title="Eliminar este artículo del bolo"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* Módulo de Arqueo de Caja y Cobros (Efectivo & Bizum) */}
 <div className={`p-4 rounded-[var(--r-m)] space-y-4 ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]/50'
 }`}>
 <div className="flex items-center justify-between border-b pb-2">
 <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
 <Coins className="w-4 h-4" /> Arqueo de Caja y Métodos de Cobro
 </span>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 Introduce los importes reales cobrados durante la noche
 </span>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {/* Efectivo Recaudado */}
 <div className={`p-3 rounded-[var(--r-m)] ${
 isStitchLight ?'bg-white border-emerald-200' :'bg-[var(--surface)] border-emerald-500/30'
 }`}>
 <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs mb-1">
 <Banknote className="w-4 h-4" />
 <span>Efectivo en Caja (€)</span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mb-2">
 Billetes y monedas cobrados en el bolo
 </p>
 <div className="flex items-center gap-1.5">
 <input
 type="number"
 step="1"
 min="0"
 value={merch.ingresosEfectivo ?? 0}
 onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, {
 ingresosEfectivo: Math.max(0, parseFloat(e.target.value) || 0)
 })}
 className={`w-full px-3 py-1.5 rounded-[var(--r-s)] font-mono font-bold text-sm outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
 </div>
 </div>

 {/* Bizum / TPV Recaudado */}
 <div className={`p-3 rounded-[var(--r-m)] ${
 isStitchLight ?'bg-white border-sky-200' :'bg-[var(--surface)] border-sky-500/30'
 }`}>
 <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-xs mb-1">
 <Smartphone className="w-4 h-4" />
 <span>Bizum / TPV (€)</span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mb-2">
 Pagos por móvil y datáfono del bolo
 </p>
 <div className="flex items-center gap-1.5">
 <input
 type="number"
 step="1"
 min="0"
 value={merch.ingresosBizum ?? 0}
 onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, {
 ingresosBizum: Math.max(0, parseFloat(e.target.value) || 0)
 })}
 className={`w-full px-3 py-1.5 rounded-[var(--r-s)] font-mono font-bold text-sm outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
 </div>
 </div>

 {/* Fondo de Caja Inicial */}
 <div className={`p-3 rounded-[var(--r-m)] ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)] /30'
 }`}>
 <div className="flex items-center gap-1.5 text-[var(--acc)] font-mono font-bold text-xs mb-1">
 <Coins className="w-4 h-4" />
 <span>Fondo de Caja (€)</span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-mono mb-2">
 Cambio que se llevó al inicio para la mesa
 </p>
 <div className="flex items-center gap-1.5">
 <input
 type="number"
 step="1"
 min="0"
 value={merch.fondoCajaInicial ?? 0}
 onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, {
 fondoCajaInicial: Math.max(0, parseFloat(e.target.value) || 0)
 })}
 className={`w-full px-3 py-1.5 rounded-[var(--r-s)] font-mono font-bold text-sm outline-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 <span className="font-mono text-xs font-bold text-[var(--ink-2)]">€</span>
 </div>
 </div>
 </div>

 {/* Desglose de Caja Total en Mano */}
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
 isStitchLight ?'bg-white' :'bg-[var(--surface)]'
 }`}>
 <div className="space-y-0.5">
 <span className="text-xs font-mono font-bold text-[var(--ink)]">
 Resumen del Dinero Recaudado en el Puesto:
 </span>
 <p className="text-[11px] font-mono text-[var(--ink-2)]">
 💵 {(merch.ingresosEfectivo || 0).toFixed(2)}€ Efectivo + 📱 {(merch.ingresosBizum || 0).toFixed(2)}€ Bizum = <strong className="text-emerald-400">{totalCobradoReal.toFixed(2)}€ Total Ventas</strong>
 </p>
 {merch.fondoCajaInicial ? (
 <p className="text-[10px] font-mono text-[var(--ink-2)]">
 (Efectivo físico total a retirar del cajón incluyendo fondo de caja: {((merch.ingresosEfectivo || 0) + (merch.fondoCajaInicial || 0)).toFixed(2)} €)
 </p>
 ) : null}
 </div>

 <div className="text-right shrink-0">
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold ${
 diferenciaCuadre === 0
 ?'bg-emerald-500/20 text-[var(--ink-2)] border-emerald-500/40'
 : diferenciaCuadre > 0
 ?'bg-sky-500/20 text-sky-300 border-sky-500/40'
 :'bg-rose-500/20 text-[var(--ink-2)] border-rose-500/40'
 }`}>
 {diferenciaCuadre === 0 ? (
 <>
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
 <span>¡Caja Cuadrada al Céntimo!</span>
 </>
 ) : diferenciaCuadre > 0 ? (
 <>
 <Sparkles className="w-3.5 h-3.5 text-sky-400" />
 <span>+{diferenciaCuadre.toFixed(2)} € (Superávit / Donaciones)</span>
 </>
 ) : (
 <>
 <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
 <span>{diferenciaCuadre.toFixed(2)} € (Descuadre por revisar)</span>
 </>
 )}
 </span>
 </div>
 </div>

 {/* Observaciones y Notas del Puesto de Merch */}
 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--ink-2)] mb-1">
 Notas del Puesto de Merchandising / Incidencias
 </label>
 <textarea
 rows={2}
 placeholder="Ej: Encargado de mesa: Andrea. Las camisetas talla L se agotaron antes del bis. Mucha demanda de púas."
 value={merch.notas ||''}
 onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, { notas: e.target.value })}
 className={`w-full p-2.5 rounded-[var(--r-s)] text-xs font-mono outline-none resize-none ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 />
 </div>
 </div>
 </div>
 );
 })()}

 {/* TAB 4: 5. CHECKLIST CIERRE DE MATERIAL */}
 {modalActiveTab ==='cierre' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between pb-1 border-b border-purple-500/20 flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500 text-[var(--ink)]">
 Sección 5
 </span>
 <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
 Checklist de Cierre de Material & Carga de Furgoneta
 </h3>
 </div>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => handleToggleAllCierreItems(modalRoadbookKey, true)}
 className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-[var(--ink-2)] hover:bg-emerald-500/30 transition-colors cursor-pointer"
 >
 ✓ Marcar Todo
 </button>
 <button
 type="button"
 onClick={() => handleToggleAllCierreItems(modalRoadbookKey, false)}
 className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70 transition-colors cursor-pointer"
 >
 ↺ Desmarcar
 </button>
 </div>
 </div>

 {/* Barra de Progreso y Banner de Estado */}
 {(() => {
 const items = modalRoadbook.cierreMaterial || [];
 const checkedCount = items.filter(i => i.checked).length;
 const totalCount = items.length;
 const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
 const isCompleted = totalCount > 0 && checkedCount === totalCount;

 return (
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs font-mono font-bold">
 <span className="text-purple-300">
 {checkedCount} de {totalCount} elementos verificados
 </span>
 <span className={isCompleted ?'text-emerald-400' :'text-[var(--acc)]'}>
 {pct}%
 </span>
 </div>
 <div className="w-full h-2.5 rounded-full bg-[var(--surface)]/80 overflow-hidden">
 <div
 className={`h-full transition-all duration-300 ${
 isCompleted ?'bg-emerald-500' : pct > 50 ?'bg-purple-500' :'bg-[var(--acc)]'
 }`}
 style={{ width: `${pct}%` }}
 />
 </div>

 {isCompleted ? (
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok-soft)] text-[var(--ink)] text-xs font-mono flex items-center gap-2">
 <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>¡TODO EL MATERIAL VERIFICADO! Escenario y camerinos despejados. Furgoneta cerrada y lista para partir.</span>
 </div>
 ) : (
 <div className="p-3 rounded-[var(--r-m)] bg-purple-950/30 text-purple-200 text-xs font-mono flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
 <span>Verifica uno a uno antes de cerrar la furgoneta para garantizar cero olvidos de cables, instrumentos o ropa.</span>
 </div>
 )}
 </div>
 );
 })()}

 {/* Listado clasificado por categoría */}
 {['escenario','camerino','furgoneta'].map((catKey) => {
 const catLabel = catKey ==='escenario' ?'🎸 Escenario (Backline & Sonido)' : catKey ==='camerino' ?'👕 Camerino (Ropa, Móviles & Merch)' :'🚐 Furgoneta & Vehículo (Estiba & Cierre)';
 const catItems = (modalRoadbook.cierreMaterial || []).filter(i => i.categoria === catKey);
 if (catItems.length === 0) return null;

 return (
 <div key={catKey} className={`p-3.5 rounded-[var(--r-m)] space-y-2 ${isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'}`}>
 <div className="flex items-center justify-between">
 <h4 className="text-xs font-mono font-bold text-purple-300">
 {catLabel}
 </h4>
 <span className="text-[10px] font-mono text-[var(--ink-2)]">
 {catItems.filter(i => i.checked).length}/{catItems.length}
 </span>
 </div>
 <div className="space-y-1.5">
 {catItems.map((item) => (
 <div
 key={item.id}
 onClick={() => handleToggleCierreItem(item.id, modalRoadbookKey)}
 className={`p-2.5 rounded-[var(--r-s)] transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
 item.checked
 ?'bg-[var(--ok-soft)] border-emerald-500/40 text-[var(--ink-2)] line-through'
 : isStitchLight
 ?'bg-white text-[var(--ink)] hover:border-purple-400'
 :'bg-black/50 /80 text-[var(--ink-2)] hover:border-purple-500/40'
 }`}
 >
 <div className="flex items-center gap-2.5 min-w-0 flex-1">
 <input
 type="checkbox"
 checked={item.checked}
 onChange={() => handleToggleCierreItem(item.id, modalRoadbookKey)}
 onClick={(e) => e.stopPropagation()}
 className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
 />
 <span className="text-xs font-mono font-medium">
 {item.item}
 </span>
 </div>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleDeleteCierreItem(item.id, modalRoadbookKey);
 }}
 className="p-1 text-[var(--ink-2)] hover:text-rose-400 transition-colors cursor-pointer"
 title="Eliminar este ítem"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 </div>
 );
 })}

 {/* Formulario para añadir ítem al checklist */}
 <form
 onSubmit={(e) => handleAddCierreItem(modalRoadbookKey, e)}
 className={`p-3 rounded-[var(--r-m)] flex items-center gap-2 flex-wrap ${
 isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]'
 }`}
 >
 <select
 value={newCierreItemCat}
 onChange={(e) => setNewCierreItemCat(e.target.value as any)}
 className={`px-2 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black text-[var(--ink)]'
 }`}
 >
 <option value="escenario">🎸 Escenario</option>
 <option value="camerino">👕 Camerino</option>
 <option value="furgoneta">🚐 Furgoneta</option>
 </select>
 <input
 type="text"
 value={newCierreItemText}
 onChange={(e) => setNewCierreItemText(e.target.value)}
 placeholder="Añadir ítem a comprobar (ej: soporte de guitarra, cargador portátil)..."
 className={`flex-1 min-w-[200px] px-2.5 py-1.5 rounded-[var(--r-s)] text-xs font-mono ${
 isStitchLight ?'bg-white text-[var(--ink)]' :'bg-black text-[var(--ink)]'
 }`}
 />
 <button
 type="submit"
 disabled={!newCierreItemText.trim()}
 className="px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-[var(--ink)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
 >
 + Añadir Ítem
 </button>
 </form>
 </div>
 )}
 </div>
 </div>
 </div>
 </ModalPortal>
 );
 })()}

 {/* Tutorial Interactivo Paso a Paso */}
 <ModuleTutorialModal
 moduleId="calendario"
 isOpen={isTutorialOpen}
 onClose={closeTutorial}
 />

 {/* Vista de Directo / Modo Escenario asociado a la fecha del calendario */}
 {activeStageSetlist && (
 <SetlistPerformanceView
 setlist={activeStageSetlist}
 songs={availableSongs}
 initialMode={activeStageInitialMode}
 onClose={() => setActiveStageSetlist(null)}
 currentUser={currentUser as any}
 />
 )}

 </div>
 );
}

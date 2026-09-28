import { CalendarViewsContainer } from "./calendar/CalendarViewsContainer";
import { CalendarSidebarLogistics } from "./calendar/CalendarSidebarLogistics";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rehearsal, Concert, ThemeColors, BookingCampaign, KeyContactItem, TechnicalLogistics, CierreMaterialItem, MerchBoloItem, MerchControlBolo } from '../types';
import { CalendarSyncModal } from "./calendar/CalendarSyncModal";
import { CalendarReminderModal } from "./calendar/CalendarReminderModal";
import { CalendarEventDetailModal } from "./calendar/CalendarEventDetailModal";

import { ConcertBreakEvenCard } from './calendar/ConcertBreakEvenCard';
import { CalendarCreateEventModal } from './calendar/CalendarCreateEventModal';
import { CalendarEditConcertModal } from './calendar/CalendarEditConcertModal';
import { CalendarEditRehearsalModal } from './calendar/CalendarEditRehearsalModal';
import DirectionsCard from './DirectionsCard';
import { Calendar, Mic, DoorClosed, Clock, MapPin, CheckSquare, Sparkles, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2, Download, Navigation, Disc3, Music, Users, Ticket, Link2, Check, Copy, ExternalLink, Radio, Target, Flame, Building2, Eye, QrCode, Settings, Smartphone, Monitor, Cloud, ChevronDown, Video, Handshake, Bell, Send, Loader2, List, CalendarDays, Maximize2, Minimize2, MessageCircle, MessageSquare, Share2, AlertTriangle, Thermometer, Edit, Phone, Wrench, ShieldCheck, Truck, Volume2, Zap, CheckCircle2, RotateCcw, UserCheck, Layers, ArrowUpRight, Shirt, Coins, CreditCard, Banknote, Calculator, ShoppingBag, Tag, Search, X } from 'lucide-react';
import { EventWeatherCard } from './calendar/EventWeatherCard';
import { CalendarWeatherBadge, AnimatedWeatherIcon } from './calendar/AnimatedWeatherIcon';
import { getCachedEventWeatherAlerts, WeatherAlert } from '../services/weatherService';
import QRCode from 'react-qr-code';
import { ModalPortal } from './common/ModalPortal';
import { api } from '../services/api';
import { apiFetch } from '../utils/api';
import { triggerNativeMobileNotification } from '../utils/webPush';
import { FAN_FORM_LANGUAGES } from '../i18n/fansTranslations';
import { normalizePlan, hasModuleAccess } from '../utils/planPermissions';
import { 
  getCalendarDefaultMonths, 
  setCalendarDefaultMonths, 
  isTwoMonthsDefault, 
  getAllDevicePreferences, 
  syncCalendarPreferencesFromUser, 
  detectDeviceType, 
  CalendarMonthsView, 
  DeviceType 
} from '../utils/calendarViewPreferences';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';
import { ModuleTutorialTrigger } from './common/ModuleTutorialTrigger';
import { SetlistPerformanceView } from './SetlistPerformanceView';
import { HolidayDateWarning } from './common/HolidayDateWarning';
import { openWhatsAppChat, getWhatsAppUrl, WHATSAPP_WINDOW_NAME } from '../utils/whatsapp';

import { 
  CalendarViewProps, 
  RunOfShowItem, 
  GearItem, 
  RoadbookInfo, 
  BAND_COLOR_PALETTES,
  getDetailedDateInfo 
} from './calendar/calendarTypes';
import { useCalendarRoadbook } from './calendar/useCalendarRoadbook';
export { getDetailedDateInfo };

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
 currentBandId = '',
 currentBandName = '',
 currentBandLogo = '',
 availableBands = [],
 bandUsers = [],
 currentUser,
 isPromoPlan: isPromoPlanProp,
 onShowNotification
}: CalendarViewProps) {
 const isPromoPlan = isPromoPlanProp ?? (
   normalizePlan(currentUser?.plan) === 'promo' ||
   Boolean(availableBands.find(b => (b.band_id === currentBandId || (b as any).id === currentBandId) && normalizePlan((b as any).plan) === 'promo'))
 );
 const { isOpen: isTutorialOpen, openTutorial, closeTutorial } = useModuleTutorial('calendario');
 const realToday = new Date();
 const [viewDate, setViewDate] = useState<Date>(() => new Date(realToday.getFullYear(), realToday.getMonth(), 1));
 const [selectedDate, setSelectedDate] = useState<Date>(() => realToday);
 // Cuando un día tiene varios eventos (2 conciertos, o concierto + ensayo), este id dice cuál se
 // ve en el panel de detalle. Sin esto, el panel siempre mostraba el primero del array y el resto
 // era invisible salvo el pequeño acceso directo de "editar ficha" en las chapas del día.
 const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
 const [copiedQrId, setCopiedQrId] = useState<string | null>(null);
 const [copiedEventModalId, setCopiedEventModalId] = useState<string | null>(null);
 const [deletingEventConfirmId, setDeletingEventConfirmId] = useState<string | null>(null);

 // Band view filter state: 'all' (Todas las bandas asignadas por defecto) vs 'active' (Solo la banda activa)
 const [filterBandMode, setFilterBandMode] = useState<'active' | 'all'>('all');

 const activeBandId = currentBandId;
 const activeBandName = currentBandName;

 // Helper to compare band IDs normalizing prefixes (e.g., 'band-' vs 'reg-')
 const isSameBandId = React.useCallback((id1?: string, id2?: string) => {
  if (!id1 && !id2) return true;
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  const clean1 = id1.replace(/^(band|reg)-/, '').trim().toLowerCase();
  const clean2 = id2.replace(/^(band|reg)-/, '').trim().toLowerCase();
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
   const cleanKey = id.replace(/^(band|reg)-/, '').trim().toLowerCase();

   let resolvedLogo = logo || customLogos[cleanKey] || '';
   if (!resolvedLogo && isSameBandId(id, activeBandId) && currentBandLogo) {
     resolvedLogo = currentBandLogo;
   }
   if (!resolvedLogo && (cleanKey === 'bakandeya' || name?.toLowerCase().includes('bakandeya') || id.toLowerCase().includes('bakandeya'))) {
     resolvedLogo = '/logo_bakandeya_bueno_sin_fondo.png';
   }

   if (!map.has(cleanKey)) {
    const displayName = name || (
     cleanKey === 'bakandeya' ? 'Bakandeya' :
     cleanKey === 'repercusion' ? 'Repercusion' :
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
  if (!e) return activeBandName || 'Tu Banda';
  if (e.bandName) return e.bandName;
  if (e.band_id) {
   const found = effectiveBandsList.find(b => isSameBandId(b.band_id, e.band_id));
   if (found?.bandName) return found.bandName;
   if (isSameBandId(e.band_id, 'band-bakandeya')) return 'Bakandeya';
   if (isSameBandId(e.band_id, 'band-repercusion')) return 'Repercusion';
   if (e.band_id.startsWith('band-') || e.band_id.startsWith('reg-')) {
    const slug = e.band_id.replace(/^(band|reg)-/, '');
    return slug.charAt(0).toUpperCase() + slug.slice(1);
   }
  }
  return activeBandName || 'Tu Banda';
 }, [effectiveBandsList, activeBandName, isSameBandId]);

 const getBandIdentity = React.useCallback((bandId?: string, bandNameFallback?: string) => {
  const name = getEventBandName({ band_id: bandId, bandName: bandNameFallback });
  const cleanId = (bandId || '').replace(/^(band|reg)-/, '').trim().toLowerCase();
  const cleanName = (name || '').trim().toLowerCase();

  const found = effectiveBandsList.find(b => isSameBandId(b.band_id, bandId));
  let logoUrl = found?.logoUrl || (found as any)?.logo_url || (found as any)?.imagen_url || (found as any)?.avatar_url || '';

  if (!logoUrl && availableBands && availableBands.length > 0) {
    const match = availableBands.find((b: any) => isSameBandId(b.band_id, bandId) || isSameBandId(b.id, bandId));
    if (match) {
      logoUrl = (match as any).logoUrl || (match as any).logo_url || (match as any).imagen_url || (match as any).avatar_url || '';
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
    logoUrl = currentBandLogo || '';
  }

  if (!logoUrl && (cleanId === 'bakandeya' || cleanName.includes('bakandeya') || cleanId === '' || !bandId)) {
    logoUrl = '/logo_bakandeya_bueno_sin_fondo.png';
  }
  
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length >= 2 
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name.slice(0, 2)).toUpperCase();

  let hash = 0;
  const str = (bandId || name || 'band');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const palette = BAND_COLOR_PALETTES[hash % BAND_COLOR_PALETTES.length];

  return { name, initials, logoUrl, palette };
 }, [effectiveBandsList, getEventBandName, isSameBandId, availableBands, activeBandId, activeBandName, currentBandLogo]);

 // Check if current user is in multiple bands or has access to multiple bands' events
 const isMultiBandUser =
  effectiveBandsList.length > 1 ||
  (availableBands && availableBands.length > 1) ||
  currentUser?.role === 'admin' ||
  currentUser?.role === 'leader' ||
  (currentUser as any)?.is_admin ||
  concerts.some(c => c.band_id && !isSameBandId(c.band_id, activeBandId)) ||
  rehearsals.some(r => r.band_id && !isSameBandId(r.band_id, activeBandId));

 // Form state for selected band when creating rehearsal/concert
 const [selectedBandIdForNewEvent, setSelectedBandIdForNewEvent] = useState(activeBandId);
 const [showSyncModal, setShowSyncModal] = useState(false);
 const [syncScope, setSyncScope] = useState<'all' | 'active'>('all');
 const [copiedFeed, setCopiedFeed] = useState(false);
 // La URL del feed .ics la firma el servidor: el enlace lleva una firma para que no baste con
 // saber el band_id para leerse los conciertos y ensayos de una banda cualquiera.
 const [rutaFeed, setRutaFeed] = useState<string | null>(null);
 const [errorFeed, setErrorFeed] = useState<string | null>(null);

 const bandasDelFeed = React.useMemo(
   () =>
     syncScope === 'all' && effectiveBandsList.length > 1
       ? effectiveBandsList.map(b => b.band_id).join(',')
       : activeBandId || '',
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
       else setErrorFeed(res.error || 'No se pudo generar el enlace del calendario.');
     })
     .catch((err: any) => {
       if (!cancelado) setErrorFeed(err?.message || 'No se pudo generar el enlace del calendario.');
     });
   return () => {
     cancelado = true;
   };
 }, [showSyncModal, bandasDelFeed]);

  const host = typeof window !== "undefined" ? window.location.origin : "https://bandmanager.io";
  const urlFeedAbsoluta = rutaFeed ? `${host}${rutaFeed}` : "";
  const webCalFeed = urlFeedAbsoluta ? urlFeedAbsoluta.replace(/^https?:\/\//i, "webcal://") : "";



 // Effective band members list for Convocatoria filtered by target band of the event
 // Antes esto era la formación real de Bakandeya (Diego, Filgue, Batería, Teclados) y se usaba
 // como lista por defecto de "miembros" para CUALQUIER banda sin integrantes cargados todavía:
 // cualquier banda nueva programando su primer ensayo veía a los compañeros de banda de Diego
 // como asistentes seleccionables. Sin datos reales, el único miembro real disponible es quien
 // ha iniciado sesión.
 const defaultMembers = React.useMemo(() => (
  currentUser
   ? [{ id: currentUser.id, name: currentUser.name || currentUser.username || 'Miembro', role: currentUser.role || 'member' }]
   : []
 ), [currentUser]);

   const effectiveBandMembers = React.useMemo(() => {
    const targetBandId = selectedBandIdForNewEvent || activeBandId || "";
    const targetClean = targetBandId.replace(/^(band|reg)-/, "").replace(/-\d+$/, "").toLowerCase();
    const targetIsBakandeya = targetClean === "bakandeya";

    if (bandUsers && bandUsers.length > 0) {
      const filtered = bandUsers.filter(u => {
        const uClean = (u.band_id || "").replace(/^(band|reg)-/, "").replace(/-\d+$/, "").toLowerCase();
        const uBandName = (u.bandName || "").toLowerCase();
        return targetIsBakandeya
          ? (!u.band_id || uClean === "bakandeya" || uClean === "")
          : (uClean === targetClean || uBandName.includes(targetClean));
      });

      const list = filtered.length > 0 ? filtered : bandUsers;
      return list.map(u => ({
        id: u.id,
        name: u.name || u.username || "Miembro",
        role: u.role || "member",
        instrument: u.instrument
      }));
    }
    return defaultMembers;
  }, [bandUsers, selectedBandIdForNewEvent, activeBandId, defaultMembers]);

 // Convocatoria form state
 const [convocatoriaTipo, setConvocatoriaTipo] = useState<'completa' | 'parcial'>('completa');
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

   const eventType = selectedConcert ? 'concierto' : (selectedRehearsal?.tipo_evento === 'reunion' ? 'reunion' : 'ensayo');
   const eventTitle = selectedConcert ? selectedConcert.sala : (selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Evento');
   const eventDate = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
   const eventTime = selectedRehearsal?.hora || '';
   const eventLocation = selectedConcert ? `${selectedConcert.sala}, ${selectedConcert.ciudad}` : (selectedRehearsal?.lugar || '');

   const recipientEmails = effectiveBandMembers
     .map((m: any) => m.email)
     .filter((e: string | undefined): e is string => !!e && e.includes('@'));

   if (recipientEmails.length === 0 && currentUser?.email) {
     recipientEmails.push(currentUser.email);
   }

   let pushSent = false;
   let emailSent = false;
   let pushMsg = '';
   let emailMsg = '';

   try {
     if (reminderSendPush) {
       const notifTitle = `🔔 ${eventType.toUpperCase()}: ${eventTitle}`;
       const notifBody = `📅 ${eventDate}${eventTime ? ` a las ${eventTime}` : ''}${eventLocation ? ` (${eventLocation})` : ''}${reminderNotes ? `\n💡 ${reminderNotes}` : ''}`;
       const pushResult = await triggerNativeMobileNotification(notifTitle, { body: notifBody });
       if (pushResult.success) {
         pushSent = true;
         pushMsg = '📱 Notificación enviada al dispositivo móvil';
       } else {
         pushMsg = `📱 Móvil: ${pushResult.status}`;
       }
     }

     if (reminderSendEmail) {
       try {
         const data = await apiFetch<any>('/api/bands/send-reminder', {
           method: 'POST',
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
           emailMsg = '📧 Correo enviado a la banda';
         } else {
           emailMsg = data?.error || 'No se pudo enviar el correo';
         }
       } catch (apiErr: any) {
         console.warn('Error enviando correo de recordatorio:', apiErr);
         emailMsg = apiErr?.message || 'Error en envío de correo';
       }
     }

     if (pushSent || emailSent) {
       const messages = [pushSent ? pushMsg : null, emailSent ? emailMsg : null].filter(Boolean).join(' y ');
       setReminderSuccessMsg(`¡Recordatorio enviado con éxito! (${messages})`);
       onShowNotification?.('🔔 Recordatorio enviado correctamente', 'success');
       setTimeout(() => {
         setShowReminderModal(false);
         setReminderSuccessMsg(null);
         setReminderNotes('');
       }, 2200);
     } else {
       const errDetails = [
         reminderSendPush ? pushMsg : null,
         reminderSendEmail ? emailMsg : null
       ].filter(Boolean).join('. ');
       setReminderErrorMsg(`No se pudo enviar el recordatorio: ${errDetails}`);
     }
   } catch (err: any) {
     console.error('Error enviando recordatorio:', err);
     setReminderErrorMsg(err?.message || 'Error al procesar el recordatorio');
   } finally {
     setReminderSending(false);
   }
 };

 // Filter helper by Convocatoria (Banda Completa vs Convocatoria Parcial)
 const matchesConvocatoria = React.useCallback((evt: Concert | Rehearsal) => {
  if (evt.convocatoria_tipo === 'parcial' && evt.convocados_ids && evt.convocados_ids.length > 0) {
    if (currentUser) {
      const uId = currentUser.id;
      const uEmail = (currentUser.email || '').toLowerCase().trim();
      const uUsername = (currentUser.username || '').toLowerCase().trim();
      
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

      const isLeader = currentUser.role === 'leader';
      return isSummoned || isLeader;
    }
  }
  return true; // 'completa' or omitted -> visible to all
 }, [currentUser]);

 // Estado de búsqueda rápida por palabra clave / sala / ciudad / notas / artista
 const [calendarSearchTerm, setCalendarSearchTerm] = useState<string>('');
 const [agendaFilterPast, setAgendaFilterPast] = useState<'all' | 'future' | 'past'>('all');

 // Filtered concerts & rehearsals depending on filterBandMode, Convocatoria and search term
 const filteredConcerts = React.useMemo(() => {
  let list = concerts;
  if (filterBandMode === 'active') {
   list = concerts.filter(c => {
    if (!c.band_id) return isSameBandId(activeBandId, 'band-bakandeya');
    return isSameBandId(c.band_id, activeBandId);
   });
  }
  list = list.filter(matchesConvocatoria);

  if (calendarSearchTerm.trim()) {
   const q = calendarSearchTerm.trim().toLowerCase();
   list = list.filter(c => {
    const matchSala = (c.sala || '').toLowerCase().includes(q);
    const matchCiudad = (c.ciudad || '').toLowerCase().includes(q);
    const matchDireccion = (c.direccion || '').toLowerCase().includes(q);
    const matchNotas = (c.notas || '').toLowerCase().includes(q);
    const matchBand = getEventBandName(c).toLowerCase().includes(q);
    const matchTipo = (c.tipo || '').toLowerCase().includes(q);
    const matchFecha = (c.fecha || '').toLowerCase().includes(q);
    return matchSala || matchCiudad || matchDireccion || matchNotas || matchBand || matchTipo || matchFecha;
   });
  }
  return list;
 }, [concerts, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId, calendarSearchTerm, getEventBandName]);

 
  const activeBandConcerts = React.useMemo(() => {
    return concerts.filter(c => {
      if (!c.band_id) return isSameBandId(activeBandId, "band-bakandeya");
      return isSameBandId(c.band_id, activeBandId);
    }).filter(matchesConvocatoria);
  }, [concerts, activeBandId, isSameBandId, matchesConvocatoria]);

  const activeBandRehearsals = React.useMemo(() => {
    return rehearsals.filter(r => {
      if (!r.band_id) return isSameBandId(activeBandId, "band-bakandeya");
      return isSameBandId(r.band_id, activeBandId);
    }).filter(matchesConvocatoria);
  }, [rehearsals, activeBandId, isSameBandId, matchesConvocatoria]);

  const filteredRehearsals = React.useMemo(() => {
  let list = rehearsals;
  if (filterBandMode === 'active') {
   list = rehearsals.filter(r => {
    if (!r.band_id) return isSameBandId(activeBandId, 'band-bakandeya');
    return isSameBandId(r.band_id, activeBandId);
   });
  }
  list = list.filter(matchesConvocatoria);

  if (calendarSearchTerm.trim()) {
   const q = calendarSearchTerm.trim().toLowerCase();
   list = list.filter(r => {
    const matchLugar = (r.lugar || '').toLowerCase().includes(q);
    const matchAsunto = (r.asunto || '').toLowerCase().includes(q);
    const matchNotas = (r.notas || '').toLowerCase().includes(q);
    const matchBand = getEventBandName(r).toLowerCase().includes(q);
    const matchFecha = (r.fecha || '').toLowerCase().includes(q);
    return matchLugar || matchAsunto || matchNotas || matchBand || matchFecha;
   });
  }
  return list;
 }, [rehearsals, filterBandMode, activeBandId, matchesConvocatoria, isSameBandId, calendarSearchTerm, getEventBandName]);

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
 const [calendarViewMode, setCalendarViewMode] = useState<'1m' | '2m' | 'week' | 'agenda'>(() => isTwoMonthsDefault() ? '2m' : '1m');
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
   const is2m = updated[curDev] === '2';
   setTwoMonthsMode(is2m);
   setCalendarViewMode(prev => (prev === 'week' || prev === 'agenda') ? prev : (is2m ? '2m' : '1m'));
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
   if (e.key === 'Escape') setShowViewConfigPopover(false);
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
   setTwoMonthsMode(mode === '2');
   setCalendarViewMode(mode === '2' ? '2m' : '1m');
  }

  const isCloudSaved = await setCalendarDefaultMonths(mode, targetDevice, true);
  setIsSavingPref(false);

  const devLabel = targetDevice === 'mobile' ? 'móviles' : 'ordenadores';
  const modeLabel = mode === '1' ? '1 mes' : '2 meses';
  setConfigToast(isCloudSaved
   ? `Guardado en Supabase: ${modeLabel} por defecto para ${devLabel}`
   : `Guardado en local: ${modeLabel} por defecto para ${devLabel}`
  );

  setTimeout(() => {
   setConfigToast(null);
  }, 2200);
 };
 const [activeTab, setActiveTab] = useState<'runofshow' | 'tecnica' | 'contactos' | 'merchan' | 'cierre' | 'gear' | 'roadbook'>('runofshow');
 const [modalActiveTab, setModalActiveTab] = useState<'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre'>('resumen');

  // Creation Modals state
 const [showCreateModal, setShowCreateModal] = useState<'rehearsal' | 'concert' | 'reunion' | null>(null);
  const [showAddEventDropdown, setShowAddEventDropdown] = useState(false);

  // Form fields for new Reunion
  const [reuHora, setReuHora] = useState('19:30 - 20:30');
  const [reuLugar, setReuLugar] = useState('Online (Google Meet)');
  const [reuAsunto, setReuAsunto] = useState('Coordinación de gira y tareas');
  const [reuEnlace, setReuEnlace] = useState('');
  const [reuNotas, setReuNotas] = useState('1. Repasar próximas fechas y logística.\n2. Presupuestos y gastos.\n3. Nuevos temas del repertorio.');
  const [reuEstado, setReuEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');

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
 const [rehEstado, setRehEstado] = useState<'programado' | 'completado' | 'cancelado'>('programado');
 const [rehSetlistId, setRehSetlistId] = useState<string>('');

 // Form fields for new Concert
 const [concCiudad, setConcCiudad] = useState('Madrid');
 const [concSala, setConcSala] = useState('');
 const [concDireccion, setConcDireccion] = useState('');
 const [concCache, setConcCache] = useState('1200');
 const [concAforo, setConcAforo] = useState('300');
 const [concContrato, setConcContrato] = useState(true);
 const [concEstadoPago, setConcEstadoPago] = useState<'pendiente' | 'pagado' | 'anticipo'>('pendiente');
 const [concTipo, setConcTipo] = useState<'propio' | 'festival' | 'privado'>('propio');
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
 const [activeStageInitialMode, setActiveStageInitialMode] = useState<'directo' | 'ensayo'>('directo');

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
 // dos ya respetan el toggle "Todos / banda activa" y la convocatoria con el que se pintan el
 // resto de vistas del calendario (mes, semana, agenda). Si la navegación de la Ficha Modal
 // usara solo la banda activa, un clic en un evento de "Todos" caía fuera de la lista y el
 // contador se quedaba clavado en "1 de 1" aunque hubiera 8 eventos visibles en pantalla.
 const allChronologicalEvents = React.useMemo(() => {
   type ChronoEvent = { id: string; fecha: string; kind: 'concert' | 'rehearsal'; data: Concert | Rehearsal };
   const combined: ChronoEvent[] = [
     ...filteredConcerts.map(c => ({ id: c.id, fecha: c.fecha, kind: 'concert' as const, data: c })),
     ...filteredRehearsals.map(r => ({ id: r.id, fecha: r.fecha, kind: 'rehearsal' as const, data: r })),
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
     if (e.key === 'ArrowLeft') goToAdjacentEvent(-1);
     else if (e.key === 'ArrowRight') goToAdjacentEvent(1);
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
 ciudad: editDraft.ciudad.trim() || 'Madrid',
 sala: editDraft.sala.trim() || 'Sala Directo',
 fecha: editDraft.fecha,
 direccion: editDraft.direccion?.trim() || undefined,
 cache: Number(editDraft.cache) || 0,
 aforo_vendido: Number(editDraft.aforo_vendido) || 0,
 aforo_total: Number(editDraft.aforo_total) || 0,
 contrato_firmado: editDraft.contrato_firmado,
 estado_pago: editDraft.estado_pago,
 tipo: editDraft.tipo,
 is_posible: editDraft.is_posible,
 notas: editDraft.notas?.trim() || '',
 idioma: editDraft.idioma || undefined,
 setlistId: editDraft.setlistId || undefined,
 entradasUrl: editDraft.entradasUrl?.trim() || undefined,
 entradasLugarFisico: editDraft.entradasLugarFisico?.trim() || undefined,
  precioEntradaEstimado: Number(editDraft.precioEntradaEstimado) || undefined,
 asistencia_propia: Number(editDraft.asistencia_propia) || 0,
 asistencia_otras_bandas: Number(editDraft.asistencia_otras_bandas) || 0,
 bandas_compartidas: Array.isArray(editDraft.bandas_compartidas) ? editDraft.bandas_compartidas : (typeof editDraft.bandas_compartidas === 'string' ? (editDraft.bandas_compartidas as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []),
 post_show_review: editDraft.post_show_review?.trim() || '',
 es_hito_destacado: Boolean(editDraft.es_hito_destacado)
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
    const isReu = editRehearsalDraft.tipo_evento === 'reunion';
    onUpdateRehearsal(viewingRehearsal.id, {
      fecha: editRehearsalDraft.fecha,
      hora: editRehearsalDraft.hora?.trim() || '',
      lugar: editRehearsalDraft.lugar?.trim() || (isReu ? 'Online' : 'Local de Ensayo'),
      tipo_evento: editRehearsalDraft.tipo_evento || 'ensayo',
      asunto: editRehearsalDraft.asunto?.trim() || undefined,
      enlace_reunion: editRehearsalDraft.enlace_reunion?.trim() || undefined,
      estado: editRehearsalDraft.estado || 'programado',
      notas: editRehearsalDraft.notas?.trim() || '',
      convocatoria_tipo: editRehearsalDraft.convocatoria_tipo,
      convocados_ids: editRehearsalDraft.convocados_ids,
      setlistId: editRehearsalDraft.setlistId || undefined
    });
    setViewingRehearsal(null);
    setSyncSuccessMessage(`¡${isReu ? 'Reunión' : 'Ensayo'} ${isReu ? (editRehearsalDraft.asunto || 'actualizada') : `en ${editRehearsalDraft.lugar}`} actualizada!`);
    setTimeout(() => setSyncSuccessMessage(''), 5000);
  };

 const currentYear = viewDate.getFullYear();
 const currentMonth = viewDate.getMonth(); // 0 to 11

 // Second month calculations for dual month view
 const nextMonth = (currentMonth + 1) % 12;
 const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;

 const monthNames = [
 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
 ];

 const fullWeekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
 }, []);

 // Helper to find campaigns that target a specific date
 const getCampaignsForDate = React.useCallback((dateStr: string): BookingCampaign[] => {
   if (!campaigns || campaigns.length === 0) return [];
   return campaigns.filter(c => Array.isArray(c.targetDates) && c.targetDates.includes(dateStr));
 }, [campaigns]);

 // Upcoming events filter state: 'todos' | 'conciertos' | 'ensayos' | 'campañas'
 const [upcomingFilter, setUpcomingFilter] = useState<'todos' | 'conciertos' | 'ensayos' | 'campañas'>('todos');

 // Upcoming events starting from today (filters out past dates)
 const upcomingCalendarEvents = React.useMemo(() => {
 const list: Array<{
 id: string;
 type: 'concierto' | 'ensayo' | 'campaña';
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
 const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';

 list.push({
 id: c.id,
 type: 'concierto',
 title: `${c.sala}${c.ciudad ? ` (${c.ciudad})` : ''}`,
 fecha: c.fecha,
 day,
 month,
 salaOrLugar: c.sala,
 ciudad: c.ciudad,
 direccion: c.direccion,
 locationQuery: c.direccion || `${c.sala}, ${c.ciudad}`,
 bandName: getEventBandName(c),
 badge: c.contrato_firmado ? 'Contrato Firmado' : 'Confirmado'
 });
 });

 // Filter rehearsals that are today or in the future
 filteredRehearsals.forEach(r => {
    if (!r.fecha || r.fecha < todayStr) return;
    const parts = r.fecha.split('-');
    if (parts.length !== 3) return;
    const day = parts[2];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';
    const isReu = r.tipo_evento === 'reunion';

    list.push({
      id: r.id,
      type: (isReu ? 'reunion' : 'ensayo') as any,
      title: isReu ? (r.asunto || 'Reunión de Banda') : (r.lugar ? `Ensayo en ${r.lugar}` : 'Ensayo General'),
      fecha: r.fecha,
      day,
      month,
      salaOrLugar: isReu ? (r.lugar || 'Online') : (r.lugar || 'Local de Ensayo'),
      ciudad: undefined,
      direccion: undefined,
      locationQuery: isReu ? (r.lugar && !r.lugar.toLowerCase().includes('online') && !r.lugar.toLowerCase().includes('http') ? r.lugar : undefined) : `${r.lugar || 'Local de Ensayo'}, Madrid`,
      bandName: getEventBandName(r),
      badge: isReu ? (r.estado === 'completado' ? 'Realizada' : 'Convocada') : (r.estado === 'completado' ? 'Completado' : 'Programado')
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
     const month = monthNames[monthIdx] ? monthNames[monthIdx].slice(0, 3).toUpperCase() : 'ENE';

     list.push({
       id: `camp-date-${camp.id}-${tDate}`,
       type: 'campaña',
       title: `🎯 Posible Concierto: ${camp.name}`,
       fecha: tDate,
       day,
       month,
       salaOrLugar: `Salas en ${camp.targetCities?.join(', ') || 'Ciudad objetivo'}`,
       ciudad: camp.targetCities?.[0] || 'Madrid',
       direccion: undefined,
       locationQuery: `Salas ${camp.targetCities?.join(' ')}, España`,
       bandName: activeBandName || 'Bakandeya',
       badge: camp.isActive ? 'Campaña Activa' : 'Objetivo Campaña',
       campaign: camp
     });
   });
 });

 list.sort((a, b) => a.fecha.localeCompare(b.fecha));
 return list;
 }, [filteredConcerts, filteredRehearsals, campaigns, todayStr, activeBandName, monthNames]);

  // Estado para dirección de deslizamiento y desplazamiento visual
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
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
    if (calendarViewMode === 'week') {
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
    if (calendarViewMode === 'week') {
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
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
 const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
 const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
 const newRehearsal: Rehearsal = {
 id: `reh-${Date.now()}`,
 fecha: formattedDate,
 hora: rehTime.trim() || '18:00 - 21:00',
 lugar: rehLugar.trim() || 'Locales de Ensayo',
 asistentes: convocatoriaTipo === 'completa' ? ['Banda Completa'] : selectedMembers.map(m => m.name),
 notas: rehNotas.trim() || 'Ensayo general',
 estado: rehEstado,
 band_id: targetBand.band_id,
 bandName: targetBand.bandName,
 convocatoria_tipo: convocatoriaTipo,
 convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
 convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map(m => m.name) : undefined,
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
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
    const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
    const newReunion: Rehearsal = {
      id: `reu-${Date.now()}`,
      fecha: formattedDate,
      hora: reuHora.trim() || '19:30 - 20:30',
      lugar: reuLugar.trim() || 'Online (Google Meet)',
      tipo_evento: 'reunion',
      asunto: reuAsunto.trim() || 'Reunión de Banda',
      enlace_reunion: reuEnlace.trim() || undefined,
      asistentes: convocatoriaTipo === 'completa' ? ['Banda Completa'] : selectedMembers.map(m => m.name),
      notas: reuNotas.trim() || 'Orden del día',
      estado: reuEstado,
      band_id: targetBand.band_id,
      bandName: targetBand.bandName,
      convocatoria_tipo: convocatoriaTipo,
      convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
      convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map(m => m.name) : undefined,
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
 const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
 const targetBand = effectiveBandsList.find(b => b.band_id === selectedBandIdForNewEvent) || { band_id: activeBandId, bandName: activeBandName };
 const selectedMembers = effectiveBandMembers.filter(m => convocadosIds.includes(m.id));
 const newConcert: Concert = {
 id: `conc-${Date.now()}`,
 fecha: formattedDate,
 ciudad: concCiudad.trim() || 'Madrid',
 sala: concSala.trim() || 'Sala Directo',
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
 convocados_ids: convocatoriaTipo === 'parcial' ? convocadosIds : undefined,
 convocados_nombres: convocatoriaTipo === 'parcial' ? selectedMembers.map(m => m.name) : undefined,
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSyncSuccessMessage(data.message || 'Conciertos sincronizados con éxito.');
        // clear after 6 seconds
        setTimeout(() => setSyncSuccessMessage(''), 6000);
      } else {
        setSyncErrorMessage(data.error || 'Error al intentar sincronizar los conciertos.');
      }
    } catch (error) {
      console.error('Error synchronizing concerts:', error);
      setSyncErrorMessage('Error de conexión con el servidor.');
    } finally {
      setIsSyncingConcerts(false);
    }
  };

 // Dynamic state for per-date schedules and gear checklists with localStorage persistence
 const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

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

 const defaultInitialRunOfShow: Record<string, RunOfShowItem[]> = {
 '2026-07-23': [
 { id: 'ros-1', time: '17:00', activity: 'Llegada a la sala y descarga de bártulos', done: true },
 { id: 'ros-2', time: '17:30', activity: 'Montaje de escenario e in-ears', done: true },
 { id: 'ros-3', time: '18:15', activity: 'Prueba de sonido (Soundcheck de violín, sintes y bases)', done: true },
 { id: 'ros-4', time: '19:30', activity: 'Cena de la banda / Catering', done: false },
 { id: 'ros-5', time: '21:00', activity: 'Apertura de puertas', done: false },
 { id: 'ros-6', time: '21:30', activity: 'SHOWTIME: ¡Comienza el bolo de Bakandeya! 🎻💥', done: false },
 { id: 'ros-7', time: '23:30', activity: 'Merchandising, firmas y recogida de equipo', done: false },
 ],
 '2026-07-15': [
 { id: 'ros-10', time: '17:00', activity: 'Camerinos Rock Palace - Montaje y chequeo', done: true },
 { id: 'ros-11', time: '18:00', activity: 'Prueba de loops con Jon y violín', done: true },
 { id: 'ros-12', time: '20:30', activity: 'Cierre del ensayo y notas generales', done: false },
 ]
 };

 const defaultInitialGear: Record<string, GearItem[]> = {
 '2026-07-23': [
 { id: 'gear-1', label: 'Teclado Korg SV-2 + Stand', checked: true },
 { id: 'gear-2', label: 'Estuche Violín electroacústico + Arco y resina', checked: true },
 { id: 'gear-3', label: 'Banderola de Escenario Bakandeya', checked: false },
 { id: 'gear-4', label: 'Merchandising (Camisetas, Pegatinas, CDs)', checked: false },
 { id: 'gear-5', label: 'Cables Jack / XLR de recambio', checked: true },
 { id: 'gear-6', label: 'DI-Box estéreo para teclados', checked: false },
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
   const token = localStorage.getItem('auth_token') || '';
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
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ dateKey, items })
 }).catch(err => console.error("Error saving run of show:", err));
 };

 const saveGearToServer = (dateKey: string, items: GearItem[]) => {
 fetch('/api/logistics/gear', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
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
 { id: 'ros-def-1', time: '17:00', activity: 'Llegada y descarga', done: false },
 { id: 'ros-def-2', time: '18:00', activity: 'Prueba de sonido', done: false },
 { id: 'ros-def-3', time: '21:00', activity: 'Comienzo de actuación / actividad', done: false }
 ];

 const currentGear = allGear[selectedDateKey] || [
 { id: 'gear-def-1', label: 'Instrumentos principales y fundas', checked: false },
 { id: 'gear-def-2', label: 'In-Ears y receptores', checked: false },
 { id: 'gear-def-3', label: 'Cables de audio y alimentación', checked: false }
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
 const timeVal = newRunTime.trim() || '12:00';
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
 const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

 // Helper function to get events for any date string "YYYY-MM-DD"
 const getEventsForDateStr = (formattedDate: string) => {
 const dayConcerts = filteredConcerts.filter(c => c.fecha === formattedDate);
 const dayRehearsals = filteredRehearsals.filter(r => r.fecha === formattedDate);
 return { concerts: dayConcerts, rehearsals: dayRehearsals };
 };

 // Get current event for the selected day
 const selectedEvents = getEventsForDateStr(selectedDateKey);

 // Lista combinada del día, para el selector de eventos cuando hay más de uno (2 conciertos, o
 // concierto + ensayo). El orden importa poco aquí: solo hace falta encontrar cuál es "el activo".
 const dayEventsList: Array<{ kind: 'concert' | 'rehearsal' | 'reunion'; id: string; label: string }> = [
    ...selectedEvents.concerts.map(c => ({ kind: 'concert' as const, id: c.id, label: `Concierto: ${c.sala}` })),
    ...selectedEvents.rehearsals.map(r => ({
      kind: (r.tipo_evento === 'reunion' ? 'reunion' : 'rehearsal') as 'reunion' | 'rehearsal',
      id: r.id,
      label: r.tipo_evento === 'reunion' ? `Reunión: ${r.asunto || r.lugar}` : `Ensayo: ${r.lugar.split(',')[0]}`
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
 const rehearsalTypeLabel = isGeneralRehearsal ? 'Ensayo General' : 'Ensayo';

 const isReunion = selectedRehearsal?.tipo_evento === 'reunion';
  const selectedEventTitle = selectedConcert
    ? `Concierto: ${selectedConcert.sala}`
    : selectedRehearsal
    ? (isReunion ? `Reunión: ${selectedRehearsal.asunto || 'Reunión de Banda'}` : `${rehearsalTypeLabel}: ${selectedRehearsal.lugar.split(',')[0]}`)
    : `Día Libre`;

 const currentSetlistId = selectedConcert?.setlistId || selectedRehearsal?.setlistId;
 const assignedSetlist = availableSetlists.find((s: any) => s.id === currentSetlistId);

 const selectedEventDetails = selectedConcert
    ? {
        type: 'concert',
        time: '21:30',
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
        type: isReunion ? 'reunion' : (isGeneralRehearsal ? 'rehearsal_general' : 'rehearsal'),
        time: selectedRehearsal.hora,
        lugar: selectedRehearsal.lugar,
        asunto: selectedRehearsal.asunto,
        enlace_reunion: selectedRehearsal.enlace_reunion,
        direccion: undefined,
        fee: isReunion ? 'Reunión Interna' : 'Gratuito',
        notes: selectedRehearsal.notas,
        locationQuery: isReunion && (selectedRehearsal.lugar.toLowerCase().includes('online') || selectedRehearsal.lugar.toLowerCase().includes('http')) ? undefined : selectedRehearsal.lugar
      }
    : {
        type: 'free',
        time: '--:--',
        lugar: 'Sin evento agendado',
        direccion: undefined,
        fee: '--',
        notes: 'Día de descanso de la banda para composing o ensayos individuales.',
        locationQuery: undefined
      };

 const isStitchLight = colors.name?.toLowerCase().includes('light') || colors.bg.includes('f8fafc') || colors.bg.includes('white') || colors.bg.includes('slate-50') || false;
 const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
 const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';
 const textMuted = isStitchLight ? 'text-slate-400' : 'text-neutral-500';

  // Roadbooks & Merch state per event date (Encapsulated in custom hook)
  const {
    allRoadbooks,
    setAllRoadbooks,
    saveRoadbook,
    getDefaultRoadbook,
    getCurrentRoadbook,
    updateRoadbookField,
    handleToggleCierreItem,
    handleToggleAllCierreItems,
    handleAddCierreItem,
    handleDeleteCierreItem,
    handleAddKeyContact,
    handleDeleteKeyContact,
    openWhatsAppContact,
    handleUpdateMerchItem,
    handleAddMerchItem,
    handleDeleteMerchItem,
    handleUpdateMerchTotals,
    handleCopyMerchSummary,
    newCierreItemText,
    setNewCierreItemText,
    newCierreItemCat,
    setNewCierreItemCat,
    showAddContactForm,
    setShowAddContactForm,
    newContactNombre,
    setNewContactNombre,
    newContactRol,
    setNewContactRol,
    newContactTelefono,
    setNewContactTelefono,
    newContactEmail,
    setNewContactEmail,
    newContactNotas,
    setNewContactNotas,
    showAddMerchForm,
    setShowAddMerchForm,
    newMerchNombre,
    setNewMerchNombre,
    newMerchCategoria,
    setNewMerchCategoria,
    newMerchTalla,
    setNewMerchTalla,
    newMerchPrecio,
    setNewMerchPrecio,
    newMerchStockInicial,
    setNewMerchStockInicial,
    merchCopiedToast
  } = useCalendarRoadbook(selectedConcert, getBandIdentity);

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
   openWhatsAppChat(undefined, msg);
 }, [getEventShareText]);

 const handleCopyEventFicha = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
   const msg = getEventShareText(event, isConcert);
   navigator.clipboard.writeText(msg);
   setCopiedEventModalId(event.id);
   setTimeout(() => setCopiedEventModalId(null), 2500);
   if (onShowNotification) onShowNotification('Ficha del evento copiada al portapapeles', 'success');
 }, [getEventShareText, onShowNotification]);

 const handleNotifyBandMembers = React.useCallback((event: Concert | Rehearsal, isConcert: boolean) => {
   const title = isConcert ? `Concierto en ${(event as Concert).sala}` : `Ensayo en ${(event as Rehearsal).lugar}`;
   const body = `Convocatoria: ${event.fecha} a las ${isConcert ? '21:30' : (event as Rehearsal).hora}`;
   triggerNativeMobileNotification(title, { body });
   setShowReminderModal(true);
   if (onShowNotification) onShowNotification('Convocatoria enviada a los músicos de la banda', 'success');
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
   if (onShowNotification) onShowNotification('Evento eliminado del calendario', 'info');
 }, [onDeleteConcert, onDeleteRehearsal, onShowNotification]);

  return (
    <div
      ref={calendarContainerRef}
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${isStitchLight ? 'text-slate-800 bg-slate-100' : 'text-[#e5e2e1] bg-neutral-950'} font-sans items-stretch w-full max-w-full overflow-x-hidden ${
        isCalendarFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-6 overflow-y-auto' : ''
      }`}
    >
      {/* LEFT: MONTH GRID CALENDAR (2/3 width) */}
      <div className={`${colors.card} p-6 flex flex-col justify-between lg:col-span-2`}>
        <div>
          {/* Header */}
          <div className={`pb-4 mb-4 border-b ${isStitchLight ? "border-slate-200" : "border-zinc-800"}`}>
            {/* Top title & Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h4 className={`text-[10px] font-mono uppercase tracking-widest ${isStitchLight ? "text-sky-500 font-bold" : "text-[#f2ca50]"}`}>
                  Calendario de Directos, Ensayos y Reuniones
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold mt-1 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1" title="Eventos visibles vs Total">
                    <Calendar className="w-3 h-3" /> {filteredConcerts.length + filteredRehearsals.length}/{concerts.length + rehearsals.length}
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1 border border-emerald-500/20" title="Directos y conciertos públicos">
                    <Mic className="w-3 h-3 text-emerald-400" /> {filteredConcerts.length} directos
                  </span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 flex items-center gap-1 border border-purple-500/20" title="Ensayos de banda">
                    <DoorClosed className="w-3 h-3 text-purple-400" /> {filteredRehearsals.filter(r => r.tipo_evento !== 'reunion').length} ensayos
                  </span>
                  {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center gap-1 border border-indigo-500/20" title="Reuniones de coordinación">
                      <span>🤝</span> {filteredRehearsals.filter(r => r.tipo_evento === 'reunion').length} reuniones
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
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs ${
                      isStitchLight
                        ? "bg-amber-600 hover:bg-amber-500 text-white"
                        : "bg-[#d1b375] hover:bg-[#e2c486] text-stone-950 font-bold"
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
                      <div className={`absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl z-50 py-1.5 border overflow-hidden animate-in fade-in duration-150 backdrop-blur-md ${
                        isStitchLight ? "bg-white/95 border-slate-200 text-slate-800" : "bg-neutral-900/95 border-zinc-800 text-neutral-100"
                      }`}>
                        <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-neutral-400 border-b border-neutral-800/40 mb-1">
                          Añadir al Calendario
                        </div>
                        <button
                          type="button"
                          onClick={() => { setShowAddEventDropdown(false); setConcIsPosible(false); setShowCreateModal('concert'); }}
                          className="w-full px-3 py-2 text-left text-xs font-mono font-bold flex items-center gap-2 hover:bg-amber-500/15 hover:text-amber-400 transition-colors cursor-pointer"
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
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs ${
                      isStitchLight
                        ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300/80"
                        : "bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30"
                    }`}
                    title="Sincronizar automáticamente con Google Calendar, Apple Calendar o Outlook"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Sincronizar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Search Bar across calendar events (Palabras clave, sala, ciudad, banda, evento) */}
          <div className="mt-3 pt-2">
            <div className="flex items-center gap-2">
              <div className={`relative flex-1 flex items-center rounded-xl border transition-all ${
                isStitchLight
                  ? "bg-white border-slate-300 focus-within:border-sky-500 shadow-xs"
                  : "bg-neutral-900/90 border-zinc-800 focus-within:border-amber-500/80 shadow-inner"
              }`}>
                <Search className="w-4 h-4 ml-3 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={calendarSearchTerm}
                  onChange={(e) => setCalendarSearchTerm(e.target.value)}
                  placeholder="Buscar evento, sala, ciudad, artista, notas (ej. Joy Eslava, Madrid, acústico)..."
                  className={`w-full px-2.5 py-1.5 text-xs font-sans bg-transparent outline-none ${
                    isStitchLight ? "text-slate-900 placeholder:text-slate-400" : "text-neutral-100 placeholder:text-neutral-500"
                  }`}
                />
                {calendarSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCalendarSearchTerm("")}
                    className="p-1 mr-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                    title="Borrar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {calendarSearchTerm && (
                <div className="text-[11px] font-mono shrink-0 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {filteredConcerts.length + filteredRehearsals.length} resultados
                </div>
              )}
            </div>
          </div>

          {/* Month Navigation & Band Selector */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-3 pt-2">
      {/* Left: Navigation Buttons + Month/Period Title (Rock-solid, never jumps) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isStitchLight ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            }`}
            title="Meses anteriores (o desliza a la derecha)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isStitchLight ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
            }`}
            title="Meses siguientes (o desliza a la izquierda)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleGoToday}
            className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-[#d1b375]/15 text-[#d1b375] hover:bg-[#d1b375]/25 transition-all cursor-pointer shrink-0"
            title="Ir al mes y día actual"
          >
            Hoy
          </button>
        </div>

        <h2 className={`text-base sm:text-lg lg:text-xl font-bold font-display uppercase tracking-wider truncate min-w-0 ${textTitle}`}>
          {calendarViewMode === '2m' ? (
            <>
              {monthNames[currentMonth]} - {monthNames[nextMonth]} <span className="text-[#d1b375] font-mono text-base">{currentYear === nextMonthYear ? currentYear : `${currentYear}/${nextMonthYear}`}</span>
            </>
          ) : calendarViewMode === 'week' ? (
            (() => {
              const week = getWeekDays(selectedDate);
              const first = week[0];
              const last = week[6];
              return (
                <>
                  Semana {first.getDate()} {monthNames[first.getMonth()].slice(0, 3)} - {last.getDate()} {monthNames[last.getMonth()].slice(0, 3)} <span className="text-[#d1b375] font-mono text-base">{last.getFullYear()}</span>
                </>
              );
            })()
          ) : calendarViewMode === 'agenda' ? (
            <>
              Agenda <span className="text-[#d1b375] font-mono text-base">{monthNames[currentMonth]} {currentYear}</span>
            </>
          ) : (
            <>
              {monthNames[currentMonth]} <span className="text-[#d1b375] font-mono text-base">{currentYear}</span>
            </>
          )}
        </h2>
      </div>

      {/* Right: View Switchers + Band Filter */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end shrink-0">
        {/* Vistas estilo Google Calendar: 1M | 2M | Semana | Agenda + Configuración */}
        <div className="relative inline-flex items-center shrink-0" ref={viewConfigRef}>
            <div className={`flex items-center rounded-lg p-0.5 ${
              isStitchLight ? "bg-slate-200" : "bg-neutral-900 border border-zinc-800"
            }`}>
              <button
                id="calendar-view-1m-btn"
                onClick={() => {
                  setCalendarViewMode('1m');
                  setTwoMonthsMode(false);
                }}
                title={devicePrefs[currentDeviceType] === '1' ? "Ver 1 mes (predeterminado al iniciar en este dispositivo)" : "Ver 1 mes"}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                  calendarViewMode === '1m'
                    ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
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
                title={devicePrefs[currentDeviceType] === '2' ? "Ver 2 meses (predeterminado al iniciar en este dispositivo)" : "Ver 2 meses"}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                  calendarViewMode === '2m'
                    ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                2M
              </button>
              <button
                id="calendar-view-week-btn"
                onClick={() => setCalendarViewMode('week')}
                title="Vista Semana estilo Google Calendar (7 días detallados)"
                className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer flex items-center gap-1 ${
                  calendarViewMode === 'week'
                    ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
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
                  calendarViewMode === 'agenda'
                    ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                    : "text-neutral-400 hover:text-neutral-200"
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
                    ? isStitchLight ? "bg-slate-300 text-slate-800" : "bg-neutral-800 text-[#d1b375]"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Settings className="w-3 h-3" />
                {devicePrefs[currentDeviceType] === '2' && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#d1b375]" title="Vista personalizada activa: 2 meses" />
                )}
              </button>
            </div>

            {/* Botón de Pantalla Completa */}
            <button
              id="calendar-fullscreen-btn"
              onClick={toggleCalendarFullscreen}
              title={isCalendarFullscreen ? "Salir de pantalla completa (Esc)" : "Ver el calendario a pantalla completa"}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isCalendarFullscreen
                  ? "bg-amber-500 text-black border-amber-400 font-black shadow-lg shadow-amber-500/20"
                  : isStitchLight
                  ? "bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300"
                  : "bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-amber-500/30"
              }`}
            >
              {isCalendarFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCalendarFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
            </button>

            {/* Popover desplegable de configuración de vista por defecto por dispositivo */}
            {showViewConfigPopover && (
              <div className={`absolute top-full right-0 sm:left-0 sm:right-auto mt-2 z-50 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl border ${
                isStitchLight
                  ? "bg-white border-slate-200 text-slate-900 shadow-slate-300/60"
                  : "bg-neutral-950 border-zinc-800 text-white shadow-black/90"
              } animate-in fade-in zoom-in-95 duration-150`}>
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#d1b375]/15 text-[#d1b375]">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold font-display uppercase tracking-wider">
                        Vista por defecto
                      </h4>
                      <p className={`text-[10px] font-mono ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Diferenciada por dispositivo · Supabase
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewConfigPopover(false)}
                    className="p-1 rounded-md text-neutral-400 hover:text-white text-xs cursor-pointer"
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>

                {/* Selector de dispositivo (Móvil vs Escritorio) */}
                <div className={`p-1 rounded-xl flex items-center gap-1 mb-3 border ${
                  isStitchLight ? "bg-slate-100 border-slate-200" : "bg-neutral-900 border-zinc-800"
                }`}>
                  <button
                    onClick={() => setSelectedConfigDevice('mobile')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedConfigDevice === 'mobile'
                        ? isStitchLight ? "bg-white text-sky-600 shadow-xs" : "bg-neutral-800 text-amber-300 shadow-xs"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Móvil</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 dark:bg-white/10">
                      {devicePrefs.mobile}M
                    </span>
                    {currentDeviceType === 'mobile' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dispositivo actual" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedConfigDevice('desktop')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedConfigDevice === 'desktop'
                        ? isStitchLight ? "bg-white text-sky-600 shadow-xs" : "bg-neutral-800 text-amber-300 shadow-xs"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Ordenador</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/20 dark:bg-white/10">
                      {devicePrefs.desktop}M
                    </span>
                    {currentDeviceType === 'desktop' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Dispositivo actual" />
                    )}
                  </button>
                </div>

                <div className="mb-2">
                  <span className={`text-[10px] font-mono block ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Al entrar desde un <strong>{selectedConfigDevice === 'mobile' ? 'móvil o pantalla estrecha' : 'ordenador o pantalla ancha'}</strong>:
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Opción 1: 1 Mes */}
                  <button
                    disabled={isSavingPref}
                    onClick={() => handleSetDefaultMonthsForDevice('1', selectedConfigDevice)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      devicePrefs[selectedConfigDevice] === '1'
                        ? isStitchLight
                          ? "bg-sky-50 border-sky-400/80 text-sky-950 shadow-xs"
                          : "bg-amber-500/10 border-[#d1b375] text-amber-200 shadow-xs"
                        : isStitchLight
                          ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          : "bg-neutral-900 hover:bg-neutral-800/80 border-zinc-800 text-neutral-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs font-mono">1 Mes</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          devicePrefs[selectedConfigDevice] === '1'
                            ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                            : isStitchLight ? "bg-slate-200 text-slate-600" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {devicePrefs[selectedConfigDevice] === '1' ? 'Predeterminado' : 'Recomendado móvil'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 leading-snug ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Vista limpia y despejada de 1 mes (por defecto en dispositivos móviles).
                      </p>
                    </div>
                    {devicePrefs[selectedConfigDevice] === '1' && (
                      <Check className="w-4 h-4 text-[#d1b375] shrink-0 mt-0.5" />
                    )}
                  </button>

                  {/* Opción 2: 2 Meses */}
                  <button
                    disabled={isSavingPref}
                    onClick={() => handleSetDefaultMonthsForDevice('2', selectedConfigDevice)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      devicePrefs[selectedConfigDevice] === '2'
                        ? isStitchLight
                          ? "bg-sky-50 border-sky-400/80 text-sky-950 shadow-xs"
                          : "bg-amber-500/10 border-[#d1b375] text-amber-200 shadow-xs"
                        : isStitchLight
                          ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          : "bg-neutral-900 hover:bg-neutral-800/80 border-zinc-800 text-neutral-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs font-mono">2 Meses</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          devicePrefs[selectedConfigDevice] === '2'
                            ? isStitchLight ? "bg-sky-500 text-white" : "bg-[#d1b375] text-stone-950 font-black"
                            : isStitchLight ? "bg-slate-200 text-slate-600" : "bg-neutral-800 text-neutral-400"
                        }`}>
                          {devicePrefs[selectedConfigDevice] === '2' ? 'Predeterminado' : 'Recomendado ordenador'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 leading-snug ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Vista bimestral extendida (por defecto al entrar desde ordenador o pantalla grande).
                      </p>
                    </div>
                    {devicePrefs[selectedConfigDevice] === '2' && (
                      <Check className="w-4 h-4 text-[#d1b375] shrink-0 mt-0.5" />
                    )}
                  </button>
                </div>

                {/* Toast feedback */}
                {configToast && (
                  <div className="mt-3 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{configToast}</span>
                  </div>
                )}

                <div className={`mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono ${
                  isStitchLight ? "text-slate-400" : "text-neutral-400"
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-[#d1b375]" />
                    <span>Sincronizado con Supabase</span>
                  </span>
                  <span className="font-bold text-[#d1b375]">
                    {selectedConfigDevice === 'mobile' ? 'Móvil' : 'Ordenador'}: {devicePrefs[selectedConfigDevice]}M
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Band Filter Mode Segment Toggle */}
        {isMultiBandUser && (
          <div className={`flex items-center rounded-xl p-1 gap-1 border shrink-0 ${
          isStitchLight ? "bg-slate-100 border-slate-200" : "bg-zinc-900/90 border-zinc-800"
        }`}>
          <button
            id="calendar-view-all-bands-btn"
            onClick={() => setFilterBandMode("all")}
            className={`flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
              filterBandMode === "all"
                ? isStitchLight ? "bg-sky-500 text-white shadow-xs" : "bg-[#d1b375] text-stone-950 font-black shadow-xs"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title="Ver eventos de todos los grupos"
          >
            <Users className="w-3 h-3 shrink-0" />
            <span className="truncate">Todas las bandas</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
              filterBandMode === "all" ? "bg-black/20 text-stone-950" : "bg-black/30 dark:bg-white/10 text-neutral-300"
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
            className={`flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
              filterBandMode === "active"
                ? isStitchLight ? "bg-sky-500 text-white shadow-xs" : "bg-[#d1b375] text-stone-950 font-black shadow-xs"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title={`Filtrar solo ${activeBandName}`}
          >
            <Music className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[90px] sm:max-w-none">{activeBandName}</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
              filterBandMode === "active" ? "bg-black/20 text-stone-950" : "bg-black/30 dark:bg-white/10 text-neutral-300"
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
 <div className={`mb-4 p-2 px-3 rounded-lg text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]') 
 : (isStitchLight ? 'bg-emerald-100 text-emerald-700' : 'bg-[#10b981]/15 text-[#10b981]')
 }`}>
 <CheckSquare className="w-4 h-4 text-[#10b981] shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncSuccessMessage}</span>
 <button onClick={() => setSyncSuccessMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}
 {syncErrorMessage && (
 <div className={`mb-4 p-2 px-3 rounded-lg text-[10px] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-250 ${
 isStitchLight 
 ? 'bg-rose-500/15 text-rose-400' 
 : 'bg-rose-500/15 text-rose-400'
 }`}>
 <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
 <span className="flex-1 font-mono text-[10px]">{syncErrorMessage}</span>
 <button onClick={() => setSyncErrorMessage('')} className="text-[10px] hover:opacity-80 font-bold px-1 font-mono">×</button>
 </div>
 )}

 {/* Month Grids Container (Single or Dual) con soporte para cambiar de mes deslizando (Touch/Mouse/Trackpad) */}
 <div
 className="relative overflow-hidden touch-pan-y select-none cursor-grab active:cursor-grabbing rounded-2xl"
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
 enter: (direction: 'left' | 'right' | null) => ({
 x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
 opacity: 0.85,
 }),
 center: {
 x: 0,
 opacity: 1,
 },
 exit: (direction: 'left' | 'right' | null) => ({
 x: direction === 'left' ? -30 : direction === 'right' ? 30 : 0,
 opacity: 0.85,
 }),
 }}
 initial={slideDirection ? "enter" : false}
 animate="center"
 exit="exit"
 transition={{ duration: 0.18, ease: "easeOut" }}
 style={dragOffset !== 0 ? { transform: `translateX(${dragOffset}px)` } : undefined}
 className={`flex flex-col ${calendarViewMode === '2m' ? 'xl:flex-row gap-6' : 'gap-4'} transition-transform duration-75`}
 >
<CalendarViewsContainer
              calendarViewMode={calendarViewMode}
              calendarSearchTerm={calendarSearchTerm}
              viewDate={viewDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedEventId={selectedEventId}
              setSelectedEventId={setSelectedEventId}
              handleSelectEvent={handleSelectEvent}
              realToday={realToday}
              isStitchLight={isStitchLight}
              textTitle={textTitle}
              textSub={textSub}
              textMuted={textMuted}
              monthNames={monthNames}
              weekdays={weekdays}
              currentYear={currentYear}
              currentMonth={currentMonth}
              nextMonthYear={nextMonthYear}
              nextMonth={nextMonth}
              getEventsForDateStr={getEventsForDateStr}
              getCampaignsForDate={getCampaignsForDate}
              getBandIdentity={getBandIdentity}
              getCachedEventWeatherAlerts={getCachedEventWeatherAlerts}
              setShowCreateModal={setShowCreateModal}
              setShowEventFichaModal={setShowEventFichaModal}
              setModalActiveTab={setModalActiveTab}
              setViewingConcert={setViewingConcert}
              setViewingRehearsal={setViewingRehearsal}
              onDeleteConcert={onDeleteConcert}
              onDeleteRehearsal={onDeleteRehearsal}
              onNavigate={onNavigate}
              allRoadbooks={allRoadbooks}
              getDefaultRoadbook={getDefaultRoadbook}
              filteredConcerts={filteredConcerts}
              filteredRehearsals={filteredRehearsals}
              concerts={concerts}
              rehearsals={rehearsals}
              isPromoPlan={isPromoPlan}
              onShowNotification={onShowNotification}
            />
 </motion.div>
 </AnimatePresence>
 </div>

 {/* SELECTED DAY AGENDA CARD - Inmediatamente visible bajo el calendario */}
 <div
   id="calendar-selected-day-banner"
   className={`mt-5 p-4 rounded-2xl border transition-all duration-200 ${
     isStitchLight
       ? 'bg-white border-slate-200 shadow-sm'
       : 'bg-neutral-900/95 border-zinc-800 shadow-xl'
   }`}
 >
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
     <div className="flex items-center gap-3">
       <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 border ${
         isStitchLight
           ? 'bg-sky-50 border-sky-200 text-sky-700'
           : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
       }`}>
         <span className="text-sm leading-none">{selectedDate.getDate()}</span>
         <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">
           {monthNames[selectedDate.getMonth()]?.slice(0, 3)}
         </span>
       </div>
       <div>
         <div className="flex items-center gap-2 flex-wrap">
           <h4 className={`text-sm sm:text-base font-bold font-display capitalize ${textTitle}`}>
             {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
           </h4>
           {dayEventsList.length > 0 && (
             <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
               {dayEventsList.length} {dayEventsList.length === 1 ? 'evento' : 'eventos'}
             </span>
           )}
         </div>
         <p className={`text-[11px] font-mono ${textSub}`}>
           {dayEventsList.length === 0
             ? 'Día libre · Sin actividad programada'
             : selectedConcert
             ? `Concierto en ${selectedConcert.sala}${selectedConcert.ciudad ? ` (${selectedConcert.ciudad})` : ''}`
             : selectedRehearsal
             ? (selectedRehearsal.tipo_evento === 'reunion' ? `Reunión: ${selectedRehearsal.asunto || 'Coordinación'}` : `Ensayo en ${selectedRehearsal.lugar}`)
             : 'Eventos del día'}
         </p>
       </div>
     </div>

     {/* Botones de acción rápida para la fecha seleccionada */}
     <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
       <button
         type="button"
         onClick={() => setShowCreateModal('concert')}
         className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
       >
         <span>🎸</span> + Concierto
       </button>
       <button
         type="button"
         onClick={() => setShowCreateModal('rehearsal')}
         className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
       >
         <span>🥁</span> + Ensayo
       </button>
     </div>
   </div>

   {/* Contenido de eventos del día */}
   {dayEventsList.length === 0 ? (
     <div className="py-4 text-center">
       <p className={`text-xs font-mono ${textSub}`}>
         No hay conciertos ni ensayos programados para este día.
       </p>
       <p className={`text-[10px] font-mono mt-1 ${textMuted}`}>
         Pulsa en <span className="text-amber-400 font-bold">+ Concierto</span> o <span className="text-emerald-400 font-bold">+ Ensayo</span> para agendar en esta fecha.
       </p>
     </div>
   ) : (
     <div className="mt-3 space-y-2.5">
       {/* Selector de eventos si el día tiene más de uno */}
       {hasMultipleDayEvents && (
         <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2">
           <span className="text-[10px] font-mono text-neutral-400 shrink-0 mr-1">Ver evento:</span>
           {dayEventsList.map(evt => {
             const isActive = evt.id === activeDayEventId;
             return (
               <button
                 key={evt.id}
                 type="button"
                 onClick={() => setSelectedEventId(evt.id)}
                 className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer shrink-0 ${
                   isActive
                     ? evt.kind === 'concert'
                       ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-xs'
                       : 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-xs'
                     : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
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
           <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2.5">
             <div className="flex items-start justify-between gap-3 flex-wrap">
               <div className="min-w-0">
                 <div className="flex items-center gap-2 flex-wrap mb-1">
                   <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500 text-stone-950 shadow-xs">
                     🎸 Concierto
                   </span>
                   <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200 border border-neutral-700">
                     {bandInfo.name}
                   </span>
                   {selectedConcert.cache ? (
                     <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/30">
                       💰 {selectedConcert.cache.toLocaleString('es-ES')} €
                     </span>
                   ) : null}
                   <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${
                     selectedConcert.estado_pago === 'pagado'
                       ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                       : selectedConcert.estado_pago === 'anticipo'
                       ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                       : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                   }`}>
                     {selectedConcert.estado_pago === 'pagado' ? '✓ Cobrado' : selectedConcert.estado_pago === 'anticipo' ? 'Anticipo recibido' : 'Pendiente cobro'}
                   </span>
                 </div>
                 <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle} flex items-center gap-1.5 flex-wrap`}>
                   <span>{selectedConcert.sala}</span>
                   {selectedConcert.ciudad && (
                     <span className="text-amber-400 font-normal text-sm sm:text-base">
                       ({selectedConcert.ciudad})
                     </span>
                   )}
                 </h3>
                 {selectedConcert.direccion && (
                   <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
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
                   className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
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
                   className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
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
                   className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
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
                   className="px-3 py-1.5 rounded-lg text-xs font-mono font-black bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transition-all active:scale-95"
                 >
                   <Maximize2 className="w-3.5 h-3.5" />
                   <span>Abrir Ficha Completa</span>
                 </button>
               </div>
             </div>

             {/* Fila de metadatos adicionales */}
             <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-300 flex-wrap pt-1 border-t border-amber-500/20">
               {selectedConcert.aforo_total ? (
                 <span className="flex items-center gap-1">
                   <span>👥</span> Aforo: {selectedConcert.aforo_vendido || 0} / {selectedConcert.aforo_total}
                 </span>
               ) : null}
               <span className="flex items-center gap-1">
                 <span>📄</span> {selectedConcert.contrato_firmado ? 'Contrato firmado' : 'Contrato pendiente'}
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
                 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-sky-300 border border-sky-500/30 flex items-center gap-1 cursor-pointer"
               >
                 <Bell className="w-3 h-3 text-sky-400" />
                 <span>Notificar Banda</span>
               </button>
               <button
                 type="button"
                 onClick={() => setViewingConcert(selectedConcert)}
                 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer"
               >
                 <Edit className="w-3 h-3 text-amber-400" />
                 <span>Editar Concierto</span>
               </button>
               {(selectedConcert.direccion || selectedConcert.sala) && (
                 <a
                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                     selectedConcert.direccion || `${selectedConcert.sala}, ${selectedConcert.ciudad}`
                   )}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
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
         const isReu = selectedRehearsal.tipo_evento === 'reunion';
         const bandInfo = getBandIdentity(selectedRehearsal.band_id, (selectedRehearsal as any).bandName || (selectedRehearsal as any).band_name);
         return (
           <div className={`p-3.5 rounded-xl border space-y-2.5 ${
             isReu
               ? 'bg-indigo-950/20 border-indigo-500/40'
               : 'bg-emerald-950/20 border-emerald-500/40'
           }`}>
             <div className="flex items-start justify-between gap-3 flex-wrap">
               <div className="min-w-0">
                 <div className="flex items-center gap-2 flex-wrap mb-1">
                   <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider ${
                     isReu ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-stone-950'
                   }`}>
                     {isReu ? '🤝 Reunión' : '🥁 Ensayo'}
                   </span>
                   <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200 border border-neutral-700">
                     {bandInfo.name}
                   </span>
                   {selectedRehearsal.hora && (
                     <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-neutral-300 bg-neutral-800 border border-neutral-700">
                       🕒 {selectedRehearsal.hora}
                     </span>
                   )}
                 </div>
                 <h3 className={`text-base sm:text-lg font-bold font-display ${textTitle}`}>
                   {isReu ? (selectedRehearsal.asunto || 'Reunión de Banda') : selectedRehearsal.lugar}
                 </h3>
                 {isReu && selectedRehearsal.enlace_reunion && (
                   <p className="text-[10px] font-mono text-sky-400 mt-0.5 truncate">
                     🔗 {selectedRehearsal.enlace_reunion}
                   </p>
                 )}
                 {!isReu && selectedRehearsal.notas && (
                   <p className="text-[10px] font-mono text-neutral-400 mt-0.5 line-clamp-2">
                     📝 {selectedRehearsal.notas}
                   </p>
                 )}
               </div>

               {/* Botón de acción principal: Abrir Ficha */}
               <button
                 type="button"
                 onClick={() => setShowEventFichaModal(true)}
                 className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 ${
                   isReu
                     ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                     : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/20'
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
               } else if (typeof raw === 'string' && (raw as string).trim()) {
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
                 <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-300 flex-wrap pt-1 border-t border-white/10">
                   <span className="text-neutral-400">Convocados:</span>
                   {list.map((a, i) => (
                     <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">
                       {typeof a === 'string' ? a : String(a)}
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
                 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-sky-300 border border-sky-500/30 flex items-center gap-1 cursor-pointer"
               >
                 <Bell className="w-3 h-3 text-sky-400" />
                 <span>Notificar Convocatoria</span>
               </button>
               <button
                 type="button"
                 onClick={() => setViewingRehearsal(selectedRehearsal)}
                 className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer"
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
 <div className={`flex flex-wrap gap-4 text-[10px] font-mono pt-4 mt-6 ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-sky-500' : 'bg-[#f2ca50] shadow-[0_0_8px_#f2ca50]'}`} />
 <span>Concierto</span>
 </div>
 <div className="flex items-center gap-1.5">
 <span className={`w-2 h-2 rounded-full ${isStitchLight ? 'bg-[#10b981]' : 'bg-[#b8d6b8] shadow-[0_0_8px_#b8d6b8]'}`} />
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
        <CalendarSidebarLogistics
          colors={colors}
          isStitchLight={isStitchLight}
          textTitle={textTitle}
          textSub={textSub}
          textMuted={textMuted}
          selectedDate={selectedDate}
          selectedDateKey={selectedDateKey}
          selectedEventDetails={selectedEventDetails}
          selectedEventTitle={selectedEventTitle}
          selectedConcert={selectedConcert}
          selectedRehearsal={selectedRehearsal}
          hasMultipleDayEvents={hasMultipleDayEvents}
          dayEventsList={dayEventsList}
          activeDayEventId={activeDayEventId}
          setSelectedEventId={setSelectedEventId}
          monthNames={monthNames}
          weekdays={weekdays}
          onNavigate={onNavigate}
          currentBandId={currentBandId}
          activeBandId={activeBandId}
          activeBandName={activeBandName}
          getEventBandName={getEventBandName}
          getBandIdentity={getBandIdentity}
          getCampaignsForDate={getCampaignsForDate}
          isPromoPlan={isPromoPlan}
          currentUser={currentUser}
          setShowCreateModal={setShowCreateModal}
          setShowEventFichaModal={setShowEventFichaModal}
          setShowReminderModal={setShowReminderModal}
          setViewingConcert={setViewingConcert}
          setViewingRehearsal={setViewingRehearsal}
          onDeleteConcert={onDeleteConcert}
          onDeleteRehearsal={onDeleteRehearsal}
          setReminderNotes={setReminderNotes}
          setReminderSuccessMsg={setReminderSuccessMsg}
          setReminderErrorMsg={setReminderErrorMsg}
          setConcCiudad={setConcCiudad}
          setConcAforo={setConcAforo}
          setConcNotas={setConcNotas}
          setModalActiveTab={setModalActiveTab}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          allRoadbooks={allRoadbooks}
          getCurrentRoadbook={getCurrentRoadbook}
          updateRoadbookField={updateRoadbookField}
          getDefaultRoadbook={getDefaultRoadbook}
          handleToggleCierreItem={handleToggleCierreItem}
          handleToggleAllCierreItems={handleToggleAllCierreItems}
          handleAddCierreItem={handleAddCierreItem}
          handleDeleteCierreItem={handleDeleteCierreItem}
          newCierreItemText={newCierreItemText}
          setNewCierreItemText={setNewCierreItemText}
          newCierreItemCat={newCierreItemCat}
          setNewCierreItemCat={setNewCierreItemCat}
          showAddContactForm={showAddContactForm}
          setShowAddContactForm={setShowAddContactForm}
          newContactNombre={newContactNombre}
          setNewContactNombre={setNewContactNombre}
          newContactRol={newContactRol}
          setNewContactRol={setNewContactRol}
          newContactTelefono={newContactTelefono}
          setNewContactTelefono={setNewContactTelefono}
          newContactEmail={newContactEmail}
          setNewContactEmail={setNewContactEmail}
          newContactNotas={newContactNotas}
          setNewContactNotas={setNewContactNotas}
          handleAddKeyContact={handleAddKeyContact}
          handleDeleteKeyContact={handleDeleteKeyContact}
          openWhatsAppContact={openWhatsAppContact}
          handleUpdateMerchItem={handleUpdateMerchItem}
          handleAddMerchItem={handleAddMerchItem}
          handleDeleteMerchItem={handleDeleteMerchItem}
          handleUpdateMerchTotals={handleUpdateMerchTotals}
          handleCopyMerchSummary={handleCopyMerchSummary}
          showAddMerchForm={showAddMerchForm}
          setShowAddMerchForm={setShowAddMerchForm}
          newMerchNombre={newMerchNombre}
          setNewMerchNombre={setNewMerchNombre}
          newMerchCategoria={newMerchCategoria}
          setNewMerchCategoria={setNewMerchCategoria}
          newMerchTalla={newMerchTalla}
          setNewMerchTalla={setNewMerchTalla}
          newMerchPrecio={newMerchPrecio}
          setNewMerchPrecio={setNewMerchPrecio}
          newMerchStockInicial={newMerchStockInicial}
          setNewMerchStockInicial={setNewMerchStockInicial}
          merchCopiedToast={merchCopiedToast}
          currentRunOfShow={currentRunOfShow}
          currentGear={currentGear}
          handleToggleRunOfShow={handleToggleRunOfShow}
          handleAddRunOfShow={handleAddRunOfShow}
          handleDeleteRunOfShow={handleDeleteRunOfShow}
          handleToggleGear={handleToggleGear}
          handleAddGear={handleAddGear}
          handleDeleteGear={handleDeleteGear}
          newRunTime={newRunTime}
          setNewRunTime={setNewRunTime}
          newRunActivity={newRunActivity}
          setNewRunActivity={setNewRunActivity}
          newGearLabel={newGearLabel}
          setNewGearLabel={setNewGearLabel}
          copiedQrId={copiedQrId}
          setCopiedQrId={setCopiedQrId}
          assignedSetlist={assignedSetlist}
          setSelectedDate={setSelectedDate}
          upcomingCalendarEvents={upcomingCalendarEvents}
          upcomingFilter={upcomingFilter}
          setUpcomingFilter={setUpcomingFilter}
          setViewDate={setViewDate}
          currentSetlistId={currentSetlistId}
          onUpdateConcert={onUpdateConcert}
          onUpdateRehearsal={onUpdateRehearsal}
          availableSetlists={availableSetlists}
          setActiveStageInitialMode={setActiveStageInitialMode}
          setActiveStageSetlist={setActiveStageSetlist}
          saveRoadbook={saveRoadbook}
        />

        {/* UNIFIED CREATE EVENT MODAL (Concierto | Ensayo | Reunión) */}
  <CalendarCreateEventModal
    showCreateModal={showCreateModal}
    setShowCreateModal={setShowCreateModal}
    selectedDate={selectedDate}
    isStitchLight={isStitchLight}
    effectiveBandsList={effectiveBandsList}
    activeBandId={activeBandId}
    activeBandName={activeBandName}
    effectiveBandMembers={effectiveBandMembers}
    onAddRehearsal={onAddRehearsal}
    onAddConcert={onAddConcert}
    setSyncSuccessMessage={setSyncSuccessMessage}
    availableSetlists={availableSetlists}
  />
       {/* EDIT CONCERT MODAL (Ficha del Concierto) */}
       <CalendarEditConcertModal
         viewingConcert={viewingConcert}
         setViewingConcert={setViewingConcert}
         editDraft={editDraft}
         setEditDraft={setEditDraft}
         isStitchLight={isStitchLight}
         onUpdateConcert={onUpdateConcert}
         onDeleteConcert={onDeleteConcert}
         setSyncSuccessMessage={setSyncSuccessMessage}
         availableSetlists={availableSetlists}
       />

       {/* EDIT REHEARSAL MODAL (Ficha del Ensayo) */}
       <CalendarEditRehearsalModal
         viewingRehearsal={viewingRehearsal}
         setViewingRehearsal={setViewingRehearsal}
         editRehearsalDraft={editRehearsalDraft}
         setEditRehearsalDraft={setEditRehearsalDraft}
         isStitchLight={isStitchLight}
         onUpdateRehearsal={onUpdateRehearsal}
         onDeleteRehearsal={onDeleteRehearsal}
         setSyncSuccessMessage={setSyncSuccessMessage}
         availableSetlists={availableSetlists}
       />

  {/* Modal de Sincronización Automática */}
  <CalendarSyncModal
    isOpen={showSyncModal}
    onClose={() => setShowSyncModal(false)}
    isStitchLight={isStitchLight}
    activeBandId={activeBandId}
    host={host}
    webCalFeed={webCalFeed}
    rutaFeed={rutaFeed}
  />

  {/* Modal de Enviar Recordatorio */}
  <CalendarReminderModal
    isOpen={showReminderModal}
    onClose={() => setShowReminderModal(false)}
    isStitchLight={isStitchLight}
    selectedConcert={selectedConcert}
    selectedRehearsal={selectedRehearsal}
    selectedDate={selectedDate}
    monthNames={monthNames}
    effectiveBandMembers={effectiveBandMembers}
    reminderNotes={reminderNotes}
    setReminderNotes={setReminderNotes}
    reminderSendPush={reminderSendPush}
    setReminderSendPush={setReminderSendPush}
    reminderSendEmail={reminderSendEmail}
    setReminderSendEmail={setReminderSendEmail}
    reminderSending={reminderSending}
    reminderSuccessMsg={reminderSuccessMsg}
    reminderErrorMsg={reminderErrorMsg}
    handleSendEventReminder={handleSendEventReminder}
  />

  {/* Ficha Modal Emergente y Centrada del Evento */}
  <CalendarEventDetailModal
    showEventFichaModal={showEventFichaModal}
    setShowEventFichaModal={setShowEventFichaModal}
    selectedConcert={selectedConcert}
    selectedRehearsal={selectedRehearsal}
    allChronologicalEvents={allChronologicalEvents}
    currentEventIndex={activeChronoIndex}
    handleNavigateChronologicalEvent={(dir) => goToAdjacentEvent(dir === "next" ? 1 : -1)}
    activeBandId={activeBandId}
    currentBandId={activeBandId}
    getBandIdentity={getBandIdentity}
    isStitchLight={isStitchLight}
    isPromoPlan={isPromoPlan}
    modalActiveTab={modalActiveTab}
    setModalActiveTab={setModalActiveTab}
    selectedDateKey={selectedDateKey}
    allRoadbooks={allRoadbooks}
    getCurrentRoadbook={getCurrentRoadbook}
    updateRoadbookField={updateRoadbookField}
    getDefaultRoadbook={getDefaultRoadbook}
    handleToggleCierreItem={handleToggleCierreItem}
    handleToggleAllCierreItems={handleToggleAllCierreItems}
    handleAddCierreItem={handleAddCierreItem}
    handleDeleteCierreItem={handleDeleteCierreItem}
    handleAddKeyContact={handleAddKeyContact}
    handleDeleteKeyContact={handleDeleteKeyContact}
    openWhatsAppContact={openWhatsAppContact}
    handleUpdateMerchItem={handleUpdateMerchItem}
    handleAddMerchItem={handleAddMerchItem}
    handleDeleteMerchItem={handleDeleteMerchItem}
    handleUpdateMerchTotals={handleUpdateMerchTotals}
    handleCopyMerchSummary={handleCopyMerchSummary}
    setViewingConcert={setViewingConcert}
    setViewingRehearsal={setViewingRehearsal}
    setShowReminderModal={setShowReminderModal}
    handleDeleteEventFromModal={handleDeleteEventFromModal}
    deletingEventConfirmId={deletingEventConfirmId}
    setDeletingEventConfirmId={setDeletingEventConfirmId}
    newContactNombre={newContactNombre}
    setNewContactNombre={setNewContactNombre}
    newContactRol={newContactRol}
    setNewContactRol={setNewContactRol}
    newContactEmail={newContactEmail}
    setNewContactEmail={setNewContactEmail}
    newMerchNombre={newMerchNombre}
    setNewMerchNombre={setNewMerchNombre}
    newMerchTalla={newMerchTalla}
    setNewMerchTalla={setNewMerchTalla}
    newMerchPrecio={Number(newMerchPrecio) || 0}
    setNewMerchPrecio={(v) => setNewMerchPrecio(String(v))}
    setlists={availableSetlists}
    songs={availableSongs}
    activeTutorial={null}
    setActiveTutorial={() => {}}
    handleOpenDirectoEscenarioFromModal={(dk) => {
      const parts = dk.split("-");
      if (parts.length === 3) {
        setSelectedDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      }
    }}
    modalWeatherAlerts={modalWeatherAlerts}
    handleShareEventWhatsApp={handleShareEventWhatsApp}
    handleNotifyBandMembers={handleNotifyBandMembers}
    handleCopyEventFicha={handleCopyEventFicha}
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

import React, { useState, useMemo, useCallback } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import DirectionsCard from '../DirectionsCard';
import { EventWeatherCard } from './EventWeatherCard';
import { ModuleTutorialModal } from '../common/ModuleTutorialModal';
import { CalendarWeatherBadge } from './AnimatedWeatherIcon';
import { Concert, Rehearsal, KeyContactItem, MerchBoloItem, MerchControlBolo } from '../../types';
import { RoadbookInfo } from './calendarTypes';
import { WeatherAlert } from '../../services/weatherService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Bell,
  Calculator,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Disc3,
  DoorClosed,
  Edit,
  MapPin,
  MessageSquare,
  Music,
  Navigation,
  Phone,
  Plus,
  Share2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  Truck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

export interface CalendarEventDetailModalProps {
  showEventFichaModal: boolean;
  setShowEventFichaModal: (show: boolean) => void;
  selectedConcert: Concert | null;
  selectedRehearsal: Rehearsal | null;
  allChronologicalEvents: any[];
  currentEventIndex: number;
  handleNavigateChronologicalEvent: (direction: 'prev' | 'next') => void;
  activeBandId?: string;
  currentBandId?: string;
  getBandIdentity: (bandId?: string, fallbackName?: string) => { name: string; logoUrl?: string; palette?: any; initials?: string };
  isStitchLight?: boolean;
  isPromoPlan?: boolean;
  modalActiveTab: 'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre';
  setModalActiveTab: (tab: 'resumen' | 'tecnica' | 'contactos' | 'merchan' | 'postshow' | 'cierre') => void;
  selectedDateKey: string;
  allRoadbooks: Record<string, RoadbookInfo>;
  getCurrentRoadbook: (dateKey: string, concert?: Concert | null) => RoadbookInfo;
  updateRoadbookField: (dateKey: string, partial: Partial<RoadbookInfo>) => void;
  getDefaultRoadbook: (concert?: Concert | null) => RoadbookInfo;
  handleToggleCierreItem: (itemId: string, dateKey: string) => void;
  handleToggleAllCierreItems: (dateKey: string, checkAll: boolean) => void;
  handleAddCierreItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteCierreItem: (itemId: string, dateKey: string) => void;
  handleAddKeyContact: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteKeyContact: (contactId: string, dateKey: string) => void;
  openWhatsAppContact: (contact: KeyContactItem, dateStr: string, venueName: string) => void;
  handleUpdateMerchItem: (dateKey: string, itemId: string, updates: Partial<MerchBoloItem>) => void;
  handleAddMerchItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteMerchItem: (dateKey: string, itemId: string) => void;
  handleUpdateMerchTotals: (dateKey: string, updates: Partial<MerchControlBolo>) => void;
  handleCopyMerchSummary: (roadbook: RoadbookInfo, dateKey: string, concert?: Concert | null) => void;
  setViewingConcert?: (concert: Concert | null) => void;
  setViewingRehearsal?: (rehearsal: Rehearsal | null) => void;
  setShowReminderModal: (show: boolean) => void;
  handleDeleteEventFromModal: (eventId: string, isConcert: boolean) => void;
  deletingEventConfirmId: string | null;
  setDeletingEventConfirmId: (id: string | null) => void;
  newContactNombre: string;
  setNewContactNombre: (val: string) => void;
  newContactRol: string;
  setNewContactRol: (val: string) => void;
  newContactEmail: string;
  setNewContactEmail: (val: string) => void;
  newMerchNombre: string;
  setNewMerchNombre: (val: string) => void;
  newMerchTalla: string;
  setNewMerchTalla: (val: string) => void;
  newMerchPrecio: number;
  setNewMerchPrecio: (val: number) => void;
  setlists: any[];
  songs: any[];
  activeTutorial: string | null;
  setActiveTutorial: (tut: string | null) => void;
  handleOpenDirectoEscenarioFromModal: (dateKey: string) => void;
  modalWeatherAlerts?: WeatherAlert[];
  handleShareEventWhatsApp?: (event: any, isConcert: boolean) => void;
  handleNotifyBandMembers?: (event: any, isConcert: boolean) => void;
  handleCopyEventFicha?: (event: any, isConcert: boolean) => void;
}

export const CalendarEventDetailModal: React.FC<CalendarEventDetailModalProps> = (props) => {
  const {
    showEventFichaModal,
    setShowEventFichaModal,
    selectedConcert,
    selectedRehearsal,
    allChronologicalEvents,
    currentEventIndex,
    handleNavigateChronologicalEvent,
    activeBandId,
    currentBandId,
    getBandIdentity,
    isStitchLight = false,
    isPromoPlan = false,
    modalActiveTab,
    setModalActiveTab,
    selectedDateKey,
    allRoadbooks,
    getCurrentRoadbook,
    updateRoadbookField,
    getDefaultRoadbook,
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
    setViewingConcert,
    setViewingRehearsal,
    setShowReminderModal,
    handleDeleteEventFromModal,
    deletingEventConfirmId,
    setDeletingEventConfirmId,
    newContactNombre,
    setNewContactNombre,
    newContactRol,
    setNewContactRol,
    newContactEmail,
    setNewContactEmail,
    newMerchNombre,
    setNewMerchNombre,
    newMerchTalla,
    setNewMerchTalla,
    newMerchPrecio,
    setNewMerchPrecio,
    setlists,
    songs,
    activeTutorial,
    setActiveTutorial,
    handleOpenDirectoEscenarioFromModal,
    modalWeatherAlerts = [],
    handleShareEventWhatsApp,
    handleNotifyBandMembers,
    handleCopyEventFicha,
  } = props;

  const handleModalTouchStart = (e: React.TouchEvent) => {};
  const handleModalTouchMove = (e: React.TouchEvent) => {};
  const handleModalTouchEnd = () => {};

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const textTitle = isStitchLight ? 'text-slate-900' : 'text-neutral-100';
  const textSub = isStitchLight ? 'text-slate-500' : 'text-neutral-400';

  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactTelefono, setNewContactTelefono] = useState('');
  const [newContactNotas, setNewContactNotas] = useState('');

  const [showAddMerchForm, setShowAddMerchForm] = useState(false);
  const [merchCopiedToast, setMerchCopiedToast] = useState(false);
  const [newMerchCategoria, setNewMerchCategoria] = useState('camisetas');
  const [newMerchStockInicial, setNewMerchStockInicial] = useState<number>(0);
  const [copiedEventModalId, setCopiedEventModalId] = useState<string | null>(null);
  const [modalWeatherAlertsState, setModalWeatherAlertsState] = useState<WeatherAlert[]>(modalWeatherAlerts || []);

  const activeChronoIndex = currentEventIndex;

  const goToAdjacentEvent = useCallback(
    (direction: 1 | -1) => {
      handleNavigateChronologicalEvent(direction === 1 ? 'next' : 'prev');
    },
    [handleNavigateChronologicalEvent]
  );

  const selectedEventTitle = selectedConcert
    ? `${selectedConcert.sala}${selectedConcert.ciudad ? ` (${selectedConcert.ciudad})` : ''}`
    : selectedRehearsal?.asunto || selectedRehearsal?.lugar || 'Ensayo';

  const selectedEventDetails = useMemo(() => {
    if (selectedConcert) {
      return {
        type: 'concert',
        time: (selectedConcert as any).hora || '21:30',
        lugar: selectedConcert.sala,
        direccion: selectedConcert.direccion || '',
        locationQuery: selectedConcert.direccion ? `${selectedConcert.sala}, ${selectedConcert.direccion}` : selectedConcert.sala,
        fee: selectedConcert.cache ? `${selectedConcert.cache} €` : 'A convenir',
        entradasUrl: selectedConcert.entradasUrl,
        entradasLugarFisico: selectedConcert.entradasLugarFisico,
        notes: selectedConcert.notas,
      };
    } else if (selectedRehearsal) {
      return {
        type: 'rehearsal',
        time: selectedRehearsal.hora || '20:00',
        lugar: selectedRehearsal.lugar || 'Local de Ensayo',
        direccion: selectedRehearsal.lugar || '',
        locationQuery: selectedRehearsal.lugar || 'Local de Ensayo',
        fee: 'N/A',
        notes: selectedRehearsal.notas,
      };
    }
    return { type: 'free', time: '', lugar: '', direccion: '', locationQuery: '', fee: '', notes: '' };
  }, [selectedConcert, selectedRehearsal]);

  const selectedDate = useMemo(() => {
    const dStr = selectedConcert?.fecha || selectedRehearsal?.fecha || selectedDateKey;
    return dStr ? new Date(dStr) : new Date();
  }, [selectedConcert, selectedRehearsal, selectedDateKey]);

  const [newCierreItemCat, setNewCierreItemCat] = React.useState<'escenario' | 'camerino' | 'furgoneta'>('escenario');
  const [newCierreItemText, setNewCierreItemText] = React.useState('');
  if (!showEventFichaModal) return null;

  const modalEvent = selectedConcert || selectedRehearsal;
  const isConcert = !!selectedConcert;
  const modalBandInfo = getBandIdentity(modalEvent?.band_id, (modalEvent as any)?.bandName || (modalEvent as any)?.band_name);
  const modalPosLabel =
    allChronologicalEvents.length > 0 ? `${activeChronoIndex >= 0 ? activeChronoIndex + 1 : 1} de ${allChronologicalEvents.length}` : '';
  const eventCity =
    selectedConcert?.ciudad ||
    (selectedRehearsal?.lugar?.includes(',') ? selectedRehearsal.lugar.split(',').pop()?.trim() : '') ||
    (selectedRehearsal && !selectedRehearsal.lugar?.toLowerCase().includes('online') ? selectedRehearsal.lugar : '') ||
    '';
  const eventDateStr = modalEvent ? modalEvent.fecha.split('T')[0] : '';
  const eventTimeStr = selectedConcert ? '21:30' : selectedRehearsal?.hora || '20:00';
  const isConfirmingDelete = deletingEventConfirmId === modalEvent?.id;
  const modalRoadbookKey = eventDateStr || selectedDateKey;
  const modalRoadbook = getCurrentRoadbook(modalRoadbookKey, selectedConcert);
  return (
    <ModalPortal isOpen={showEventFichaModal} onClose={() => setShowEventFichaModal(false)}>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 sm:pt-16 bg-[var(--scrim)]/70 backdrop-blur-md animate-in fade-in duration-200">
        <div
          onTouchStart={handleModalTouchStart}
          onTouchMove={handleModalTouchMove}
          onTouchEnd={handleModalTouchEnd}
          className={`relative w-full max-w-3xl rounded-2xl border-2 shadow-2xl max-h-[85vh] sm:max-h-[88vh] overflow-y-auto ${
            isStitchLight
              ? 'bg-[var(--surface)] border-[var(--acc)] text-slate-900'
              : 'bg-[#141414] border-[var(--acc)]/50 text-neutral-100 shadow-amber-500/10'
          }`}
        >
          {/* Barra superior del modal: navegación cronológica entre eventos */}
          <div
            className={`sticky top-0 z-10 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b backdrop-blur-md ${
              isStitchLight ? 'bg-white/95 border-[var(--acc)]' : 'bg-[#141414]/95 border-[var(--acc)]/30'
            }`}
          >
            <button
              type="button"
              onClick={() => goToAdjacentEvent(-1)}
              disabled={allChronologicalEvents.length === 0 || activeChronoIndex <= 0}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold border border-[var(--acc)]/40 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Evento anterior (←)"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex flex-col items-center min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400/80 font-bold">Ficha de Evento</span>
              {modalPosLabel && (
                <span className={`text-[10px] font-mono font-bold ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {modalPosLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goToAdjacentEvent(1)}
                disabled={
                  allChronologicalEvents.length === 0 || activeChronoIndex < 0 || activeChronoIndex >= allChronologicalEvents.length - 1
                }
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold border border-[var(--acc)]/40 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Evento siguiente (→)"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowEventFichaModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bgbg-[var(--surface)] transition-colors cursor-pointer"
                title="Cerrar (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-7 space-y-4">
            {/* Cabecera: Logo HD + identidad de banda + título + barra de acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--acc)]/20">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {modalBandInfo.logoUrl ? (
                  <img
                    src={modalBandInfo.logoUrl}
                    alt={modalBandInfo.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-[var(--sunken)] p-1 shrink-0 border border-[var(--acc)]/40 drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials-modal');
                      if (fb) (fb as HTMLElement).classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span
                  className={`fallback-initials-modal w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 flex items-center justify-center text-xl font-black drop-shadow-lg ${modalBandInfo.palette.badge} ${modalBandInfo.logoUrl ? 'hidden' : ''}`}
                >
                  {modalBandInfo.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-[var(--acc)]/40 inline-flex items-center gap-1">
                    🎸 {modalBandInfo.name}
                  </span>
                  <h3 className={`text-xl font-bold font-display tracking-wide mt-1 truncate ${textTitle}`}>{selectedEventTitle}</h3>
                  <p className={`text-[11px] font-mono mt-0.5 ${textSub}`}>
                    {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                  </p>
                  {modalWeatherAlerts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {modalWeatherAlerts.map((alert) => (
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
                    className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer bg-neutral-900 border-[var(--acc)]/40 text-amber-300 hover:bgbg-[var(--surface)] flex items-center gap-1"
                    title="Editar todos los campos de este evento"
                  >
                    ✎ Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareEventWhatsApp(modalEvent, isConcert)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer bg-emerald-950/40 border-[var(--ok)]/40 text-emerald-300 hover:bg-emerald-900/50 flex items-center gap-1"
                    title="Compartir convocatoria por WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNotifyBandMembers(modalEvent, isConcert)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer bg-sky-950/40 border-[var(--acc)]/40 text-sky-300 hover:bg-sky-900/50 flex items-center gap-1"
                    title="Enviar recordatorio / notificación push a los músicos"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Notificar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyEventFicha(modalEvent, isConcert)}
                    className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                      copiedEventModalId === modalEvent.id
                        ? 'bg-emerald-500 border-[var(--ok)] text-stone-950'
                        : 'bg-neutral-900 border-[var(--hair)] text-neutral-300 hover:bgbg-[var(--surface)]'
                    }`}
                    title="Copiar texto de convocatoria al portapapeles"
                  >
                    {copiedEventModalId === modalEvent.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden xs:inline">{copiedEventModalId === modalEvent.id ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingEventConfirmId(modalEvent.id)}
                    className="px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-lg border transition-colors cursor-pointer bg-rose-950/40 border-[var(--alert)]/40 text-rose-300 hover:bg-rose-900/50 flex items-center gap-1"
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
              <div className="p-3.5 rounded-xl border border-[var(--alert)]/50 bg-rose-950/60 text-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <p className="text-xs font-mono font-bold text-rose-200">
                      ¿Confirmas que deseas eliminar este {isConcert ? 'concierto' : 'ensayo'}?
                    </p>
                    <p className="text-[10px] text-rose-300/80 font-sans">
                      Esta acción es definitiva y retirará el evento del calendario y agenda de la banda.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDeletingEventConfirmId(null)}
                    className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--hair)] bg-neutral-900 hover:bgbg-[var(--surface)] text-neutral-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEventFromModal(modalEvent.id, isConcert)}
                    className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors cursor-pointer"
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
                onAlertsDetected={(alerts) => setModalWeatherAlertsState(alerts)}
              />
            )}

            {/* Pestañas de Navegación de la Ficha */}
            <div
              className={`flex items-center gap-1.5 border-b pb-2.5 overflow-x-auto ${isStitchLight ? 'border-[var(--acc)]' : 'borderbg-[var(--surface)]'}`}
            >
              <button
                type="button"
                onClick={() => setModalActiveTab('resumen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'resumen'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <span>📋 Resumen & Info</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('tecnica')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'tecnica'
                    ? 'bg-sky-500 text-stone-950 shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>1. Logística Técnica</span>
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('contactos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'contactos'
                    ? 'bg-emerald-500 text-stone-950 shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>2. Contactos Clave</span>
                {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--sunken)] font-mono">
                    {modalRoadbook.contactosClave.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('merchan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'merchan'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>3. Control Merchandising</span>
                {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--sunken)] font-mono">
                    {modalRoadbook.merchControl.items.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('postshow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'postshow'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>4. Público & Post-Show</span>
                {selectedConcert?.es_hito_destacado && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-[var(--ink)] font-black">⭐ Hito</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setModalActiveTab('cierre')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  modalActiveTab === 'cierre'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : isStitchLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bgbg-[var(--surface)]/80 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>5. Cierre Material</span>
                {modalRoadbook.cierreMaterial && modalRoadbook.cierreMaterial.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      modalRoadbook.cierreMaterial.every((i) => i.checked) ? 'bg-emerald-500 text-stone-950 font-black' : 'bg-[var(--sunken)]'
                    }`}
                  >
                    {modalRoadbook.cierreMaterial.filter((i) => i.checked).length}/{modalRoadbook.cierreMaterial.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: RESUMEN GENERAL & DETALLES */}
            {modalActiveTab === 'resumen' && (
              <div className="space-y-4">
                <div
                  className={`space-y-3 rounded-xl p-4 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#131313]/80 border borderbg-[var(--surface)]'}`}
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock className={`w-4 h-4 shrink-0 ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`} />
                    <span className={`font-mono ${textSub}`}>Hora:</span>
                    <span className={`font-bold font-mono ${isStitchLight ? 'text-sky-400' : 'text-[#f2ca50]'}`}>
                      {selectedEventDetails.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px]">
                    <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isStitchLight ? 'text-sky-400' : 'text-[#ffb596]'}`} />
                    <div className="flex-1 min-w-0">
                      <span className={`font-mono ${textSub}`}>Lugar:</span>
                      <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
                      {selectedEventDetails.direccion && (
                        <p className={`text-[11px] font-sans mt-1 ${isStitchLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                          <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedEventDetails.locationQuery && selectedEventDetails.type !== 'free' && (
                    <div className="pt-2 flex justify-center">
                      <DirectionsCard
                        query={selectedEventDetails.locationQuery}
                        locationName={selectedEventDetails.lugar}
                        address={selectedEventDetails.direccion}
                        isStitchLight={isStitchLight}
                      />
                    </div>
                  )}
                  {!isPromoPlan && selectedEventDetails.type === 'concert' && (
                    <div className="flex items-center gap-2 text-[11px] pt-2 border-t borderbg-[var(--surface)]/40">
                      <Sparkles className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span className={`font-mono ${textSub}`}>Compensación:</span>
                      <span className="text-[#10b981] dark:text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
                    </div>
                  )}
                  {selectedEventDetails.type === 'concert' &&
                    (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
                      <div className="flex flex-col gap-1.5 pt-2 border-t borderbg-[var(--surface)]/40">
                        {selectedEventDetails.entradasUrl && (
                          <a
                            href={selectedEventDetails.entradasUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-500 text-stone-950 hover:bg-emerald-400 transition-colors w-fit"
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
                    <div className="flex items-center gap-2 text-[11px] pt-2 border-t borderbg-[var(--surface)]/40">
                      <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className={`font-mono ${textSub}`}>Gira:</span>
                      <span className="font-bold font-mono text-amber-400">🚐 {selectedConcert.giraNombre}</span>
                    </div>
                  )}
                  {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
                    <div className="flex items-center gap-2 text-[11px] pt-2 border-t borderbg-[var(--surface)]/40">
                      <Users className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className={`font-mono ${textSub}`}>Convocatoria:</span>
                      <span className="font-bold font-mono text-sky-400">
                        {(selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) === 'completa'
                          ? 'Banda Completa'
                          : `Parcial (${(() => {
                              const raw: any = selectedConcert?.convocados_nombres || selectedRehearsal?.convocados_nombres;
                              if (Array.isArray(raw)) return raw.join(', ') || 'Seleccionados';
                              if (typeof raw === 'string' && raw.trim()) return raw.trim();
                              return 'Seleccionados';
                            })()})`}
                      </span>
                    </div>
                  )}
                  {selectedEventDetails.notes && (
                    <div
                      className={`text-[11px] font-sans italic pt-2 border-t borderbg-[var(--surface)]/40 leading-relaxed ${isStitchLight ? 'text-slate-500' : 'text-neutral-400'}`}
                    >
                      &ldquo;{selectedEventDetails.notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Accesos rápidos a los 3 módulos clave en el resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div
                    onClick={() => setModalActiveTab('tecnica')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--acc)]/60 ${
                      isStitchLight ? 'bg-sky-50/70 border-[var(--acc)]' : 'bg-sky-950/20 border-[var(--acc)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-xs mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>1. Logística Técnica</span>
                    </div>
                    <p className={`text-[11px] font-mono ${textSub}`}>
                      {modalRoadbook.horaPruebaSonido ? `Prueba: ${modalRoadbook.horaPruebaSonido}` : 'Configurar rider, P.A. y horarios'}
                    </p>
                    <span className="text-[10px] text-sky-400 font-mono font-semibold underline mt-1 inline-block">
                      Abrir sección técnica →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('contactos')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--ok)]/60 ${
                      isStitchLight ? 'bg-emerald-50/70 border-[var(--ok)]' : 'bg-emerald-950/20 border-[var(--ok)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs mb-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>2. Contactos Clave</span>
                    </div>
                    <p className={`text-[11px] font-mono ${textSub}`}>
                      {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0
                        ? `${modalRoadbook.contactosClave.length} contactos (WhatsApp directo)`
                        : 'Añadir contactos de sala y técnicos'}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold underline mt-1 inline-block">
                      Ver directorio →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('merchan')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--acc)]/60 ${
                      isStitchLight ? 'bg-amber-50/70 border-[var(--acc)]' : 'bg-amber-950/20 border-[var(--acc)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs mb-1">
                      <Shirt className="w-3.5 h-3.5" />
                      <span>3. Control Merchandising</span>
                    </div>
                    <p className={`text-[11px] font-mono ${textSub}`}>
                      {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0
                        ? `${modalRoadbook.merchControl.items.length} productos | ${(modalRoadbook.merchControl.ingresosEfectivo || 0) + (modalRoadbook.merchControl.ingresosBizum || 0)}€ arqueo`
                        : 'Stock furgón vs final, Bizum y efectivo'}
                    </p>
                    <span className="text-[10px] text-amber-400 font-mono font-semibold underline mt-1 inline-block">
                      Abrir control de ventas →
                    </span>
                  </div>

                  <div
                    onClick={() => setModalActiveTab('cierre')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--acc)]/60 ${
                      isStitchLight ? 'bg-purple-50/70 border-[var(--acc)]' : 'bg-purple-950/20 border-[var(--acc)]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-purple-400 font-mono font-bold text-xs mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>5. Cierre Material</span>
                    </div>
                    <p className={`text-[11px] font-mono ${textSub}`}>
                      {modalRoadbook.cierreMaterial
                        ? `${modalRoadbook.cierreMaterial.filter((i) => i.checked).length}/${modalRoadbook.cierreMaterial.length} verificados`
                        : 'Checklist de carga de furgoneta'}
                    </p>
                    <span className="text-[10px] text-purple-400 font-mono font-semibold underline mt-1 inline-block">
                      Hacer checklist →
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 1. LOGÍSTICA TÉCNICA */}
            {modalActiveTab === 'tecnica' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--acc)]/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-sky-500 text-stone-950">
                      Sección 1
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Logística Técnica, Horarios & Rider</h3>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">Guardado automático local</span>
                </div>

                {/* Horarios de Producción */}
                <div
                  className={`p-4 rounded-xl space-y-3 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#141414] border borderbg-[var(--surface)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Cronograma de Producción del Día</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Llegada / Descarga</label>
                      <input
                        type="text"
                        value={modalRoadbook.horaLlegada || '17:00'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaLlegada: e.target.value })}
                        placeholder="17:00"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Prueba Sonido</label>
                      <input
                        type="text"
                        value={modalRoadbook.horaPruebaSonido || '18:00 - 19:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaPruebaSonido: e.target.value })}
                        placeholder="18:00 - 19:30"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Apertura Puertas</label>
                      <input
                        type="text"
                        value={modalRoadbook.horaAperturaPuertas || '20:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaAperturaPuertas: e.target.value })}
                        placeholder="20:30"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 text-amber-400`}>Show / Directo</label>
                      <input
                        type="text"
                        value={modalRoadbook.horaShow || '21:30'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaShow: e.target.value })}
                        placeholder="21:30"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border border-[var(--acc)]/50 font-bold ${
                          isStitchLight ? 'bg-amber-50 text-slate-900' : 'bg-amber-950/30 text-amber-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Toque de Queda</label>
                      <input
                        type="text"
                        value={modalRoadbook.horaCierreToque || '01:00'}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { horaCierreToque: e.target.value })}
                        placeholder="01:00"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Sonido P.A. & Monitores */}
                <div
                  className={`p-4 rounded-xl space-y-3 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#141414] border borderbg-[var(--surface)]'}`}
                >
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
                        value={modalRoadbook.paEspecificaciones || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { paEspecificaciones: e.target.value })}
                        placeholder="Ej: Line Array L-Acoustics / D&B, subwoofers estéreo, presión homogénea"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
                        Monitoreo (In-Ears / Cuñas)
                      </label>
                      <textarea
                        rows={2}
                        value={modalRoadbook.monitoresTipo || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { monitoresTipo: e.target.value })}
                        placeholder="Ej: In-Ears estéreo de la banda (traemos transmisores) + 2 cuñas de refuerzo"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
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
                      value={modalRoadbook.canalesMonitores || ''}
                      onChange={(e) => updateRoadbookField(modalRoadbookKey, { canalesMonitores: e.target.value })}
                      placeholder="Ej: 4 envíos auxiliares XLR independientes a rack de IEMs"
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                        isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Backline y Electricidad */}
                <div
                  className={`p-4 rounded-xl space-y-3 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#141414] border borderbg-[var(--surface)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Backline Aportado vs Traído & Toma Eléctrica</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>Backline (Sala vs Banda)</label>
                      <textarea
                        rows={3}
                        value={modalRoadbook.backlineInfo || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { backlineInfo: e.target.value })}
                        placeholder="Sala aporta: Batería básica. Banda trae: Platos, pedal, guitarras, amplificadores y teclado."
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${textSub}`}>
                        Potencia y Tomas Eléctricas en Escenario
                      </label>
                      <textarea
                        rows={3}
                        value={modalRoadbook.potenciaElectrica || ''}
                        onChange={(e) => updateRoadbookField(modalRoadbookKey, { potenciaElectrica: e.target.value })}
                        placeholder="Ej: 2 líneas independientes Schuko 220V 16A limpias (frontal y trasera)"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Input List / Rider de Canales */}
                <div
                  className={`p-4 rounded-xl space-y-2.5 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#141414] border borderbg-[var(--surface)]'}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                      <span>🎛️</span>
                      <span>Input List / Lista de Canales de Microfonía</span>
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {(modalRoadbook.inputList || '').split('\n').filter(Boolean).length} canales especificados
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={modalRoadbook.inputList || ''}
                    onChange={(e) => updateRoadbookField(modalRoadbookKey, { inputList: e.target.value })}
                    placeholder="1. Bombo (Beta 52)&#10;2. Caja Top (SM57)&#10;3. Bajo (D.I. Radial)&#10;4. Guitarra (e906)&#10;5. Voz (Beta 58)..."
                    className={`w-full px-3 py-2 rounded-lg text-xs font-mono leading-relaxed border ${
                      isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/80 border-[var(--hair)] text-white'
                    }`}
                  />
                </div>

                {/* Notas de Producción y Carga */}
                <div
                  className={`p-4 rounded-xl space-y-2 ${isStitchLight ? 'bg-slate-50 border border-[var(--hair)]' : 'bg-[#141414] border borderbg-[var(--surface)]'}`}
                >
                  <label className={`block text-[10px] font-mono uppercase font-bold ${textSub}`}>
                    Notas de Acceso, Muelle de Carga & Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={modalRoadbook.notasTecnicas || ''}
                    onChange={(e) => updateRoadbookField(modalRoadbookKey, { notasTecnicas: e.target.value })}
                    placeholder="Ej: Acceso por puerta trasera calle peatonal. Se requiere autorización de matrícula para la furgoneta."
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/60 border-[var(--hair)] text-white'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: 2. CONTACTOS CLAVE */}
            {modalActiveTab === 'contactos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--ok)]/20 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500 text-stone-950">
                      Sección 2
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Directorio de Contactos Clave de Producción</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddContactForm(!showAddContactForm)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <span>+</span> Añadir Contacto
                  </button>
                </div>

                {/* Formulario de Nuevo Contacto */}
                {showAddContactForm && (
                  <form
                    onSubmit={(e) => handleAddKeyContact(modalRoadbookKey, e)}
                    className={`p-4 rounded-xl border space-y-3 animate-in fade-in ${
                      isStitchLight ? 'bg-emerald-50 border-[var(--ok)]' : 'bg-emerald-950/30 border-[var(--ok)]/40'
                    }`}
                  >
                    <h4 className="text-xs font-mono font-bold text-emerald-400">Nuevo Contacto Clave</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-bold text-neutral-300 mb-1">
                          Nombre y Apellidos *
                        </label>
                        <input
                          type="text"
                          required
                          value={newContactNombre}
                          onChange={(e) => setNewContactNombre(e.target.value)}
                          placeholder="Ej: Manuel Producción"
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                            isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/70 border-[var(--hair)] text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-bold text-neutral-300 mb-1">Rol / Cargo</label>
                        <select
                          value={newContactRol}
                          onChange={(e) => setNewContactRol(e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                            isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/70 border-[var(--hair)] text-white'
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
                        <label className="block text-[10px] font-mono uppercase font-bold text-neutral-300 mb-1">
                          Teléfono (WhatsApp) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newContactTelefono}
                          onChange={(e) => setNewContactTelefono(e.target.value)}
                          placeholder="+34 600 000 000"
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                            isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/70 border-[var(--hair)] text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-bold text-neutral-300 mb-1">Email</label>
                        <input
                          type="email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          placeholder="produccion@sala.com"
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                            isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/70 border-[var(--hair)] text-white'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase font-bold text-neutral-300 mb-1">Notas u observaciones</label>
                      <input
                        type="text"
                        value={newContactNotas}
                        onChange={(e) => setNewContactNotas(e.target.value)}
                        placeholder="Ej: Contacto para cobro de taquilla y apertura de puerta muelle"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                          isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black/70 border-[var(--hair)] text-white'
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddContactForm(false)}
                        className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--hair)] hover:bgbg-[var(--surface)] text-neutral-300 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 transition-colors"
                      >
                        Guardar Contacto
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Contactos */}
                <div className="space-y-2.5">
                  {(modalRoadbook.contactosClave || []).length === 0 ? (
                    <div className="text-center py-6 text-neutral-400 font-mono text-xs">
                      No hay contactos clave registrados para este concierto.
                      <p className="text-[10px] mt-1 text-emerald-400">
                        Pulsa en &ldquo;+ Añadir Contacto&rdquo; para registrar promotor, técnico de sonido o producción.
                      </p>
                    </div>
                  ) : (
                    (modalRoadbook.contactosClave || []).map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isStitchLight
                            ? 'bg-[var(--surface)] border-[var(--hair)] hover:border-[var(--ok)]'
                            : 'bg-[#141414] borderbg-[var(--surface)] hover:border-[var(--ok)]/40'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono font-bold text-white">{contact.nombre}</span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-[var(--ok)]/30">
                              {contact.rol}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-300">
                            📞 {contact.telefono}
                            {contact.email && <span className="ml-2 text-neutral-400">✉️ {contact.email}</span>}
                          </p>
                          {contact.notas && (
                            <p className="text-[11px] font-sans text-neutral-400 mt-1 italic">&ldquo;{contact.notas}&rdquo;</p>
                          )}
                        </div>

                        {/* Botones de acción rápida: WhatsApp directo, llamada, eliminar */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openWhatsAppContact(contact, eventDateStr, selectedEventDetails.lugar || 'la sala')}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                            title="Abrir WhatsApp directo con mensaje predefinido"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                          <a
                            href={`tel:${contact.telefono.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border border-[var(--ok)]/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1 transition-colors"
                            title="Llamar directamente por teléfono"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Llamar</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteKeyContact(contact.id, modalRoadbookKey)}
                            className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
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
            {modalActiveTab === 'merchan' &&
              (() => {
                const merch = modalRoadbook.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
                const items = merch.items || [];
                const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
                const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
                const totalVendidas = Math.max(0, totalInicial - totalFinal);
                const totalVentaTeorica = items.reduce(
                  (acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0),
                  0
                );
                const totalCobradoReal = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
                const diferenciaCuadre = totalCobradoReal - totalVentaTeorica;
                const porcentajeVendido = totalInicial > 0 ? Math.round((totalVendidas / totalInicial) * 100) : 0;

                const categoriaIcons: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
                  camisetas: {
                    icon: <Shirt className="w-3.5 h-3.5" />,
                    label: 'Camisetas',
                    color: 'text-amber-400 bg-amber-500/15 border-[var(--acc)]/30',
                  },
                  vinilos: {
                    icon: <Disc3 className="w-3.5 h-3.5" />,
                    label: 'Vinilos',
                    color: 'text-sky-400 bg-sky-500/15 border-[var(--acc)]/30',
                  },
                  musica: {
                    icon: <Music className="w-3.5 h-3.5" />,
                    label: 'Música (CD/Tape)',
                    color: 'text-purple-400 bg-purple-500/15 border-[var(--acc)]/30',
                  },
                  accesorios: {
                    icon: <Tag className="w-3.5 h-3.5" />,
                    label: 'Accesorios & Púas',
                    color: 'text-emerald-400 bg-emerald-500/15 border-[var(--ok)]/30',
                  },
                  otro: {
                    icon: <ShoppingBag className="w-3.5 h-3.5" />,
                    label: 'Otro',
                    color: 'text-rose-400 bg-rose-500/15 border-[var(--alert)]/30',
                  },
                };

                return (
                  <div className="space-y-4">
                    {/* Cabecera de la Sección de Merchan */}
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--acc)]/20 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500 text-stone-950">
                          Sección 3
                        </span>
                        <div>
                          <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Control de Merchandising por Bolo</h3>
                          <p className={`text-[11px] font-mono ${textSub}`}>
                            Inventario que sube a la furgoneta vs. stock final de noche, arqueo de Efectivo y Bizum
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyMerchSummary(modalRoadbook, modalRoadbookKey, selectedConcert)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-[var(--acc)]/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copiar arqueo y balance para WhatsApp"
                        >
                          {merchCopiedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{merchCopiedToast ? '¡Copiado!' : 'Copiar Arqueo (WhatsApp)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddMerchForm(!showAddMerchForm)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showAddMerchForm ? 'Cerrar' : '+ Añadir Producto'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Toast de copiado */}
                    {merchCopiedToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-2.5 rounded-lg bg-emerald-500/20 border border-[var(--ok)]/40 text-emerald-300 text-xs font-mono flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>¡Resumen de arqueo y ventas copiado al portapapeles con formato WhatsApp para el grupo de la banda!</span>
                      </motion.div>
                    )}

                    {/* KPI Grid: Cuadre y Métricas Principales */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      <div
                        className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/60 borderbg-[var(--surface)]'}`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-sky-400" /> Sube a Furgón
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalInicial}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">uds</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-mono">Inventario de salida</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/60 borderbg-[var(--surface)]'}`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-amber-400" /> Stock Final
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className={`text-lg font-bold font-mono ${textTitle}`}>{totalFinal}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">uds</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-mono">Quedan en furgoneta</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/60 borderbg-[var(--surface)]'}`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-400" /> Vendidas
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-lg font-bold font-mono text-emerald-400">{totalVendidas}</span>
                          <span className="text-[10px] text-emerald-400/70 font-mono font-bold">({porcentajeVendido}%)</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-mono">Salidas del bolo</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/60 borderbg-[var(--surface)]'}`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-purple-400" /> Venta Teórica
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-lg font-bold font-mono text-purple-400">{totalVentaTeorica.toFixed(2)}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">€</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-mono">Según inventario</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/60 borderbg-[var(--surface)]'}`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-emerald-400" /> Cobrado Real
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-lg font-bold font-mono text-emerald-400">{totalCobradoReal.toFixed(2)}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">€</span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-mono">Efectivo + Bizum</p>
                      </div>

                      <div
                        className={`p-2.5 rounded-xl border ${
                          diferenciaCuadre === 0
                            ? isStitchLight
                              ? 'bg-emerald-50 border-[var(--ok)]'
                              : 'bg-emerald-950/30 border-[var(--ok)]/40'
                            : diferenciaCuadre > 0
                              ? isStitchLight
                                ? 'bg-sky-50 border-[var(--acc)]'
                                : 'bg-sky-950/30 border-[var(--acc)]/40'
                              : isStitchLight
                                ? 'bg-rose-50 border-[var(--alert)]'
                                : 'bg-rose-950/30 border-[var(--alert)]/40'
                        }`}
                      >
                        <span className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Cuadre Caja
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span
                            className={`text-base font-bold font-mono ${
                              diferenciaCuadre === 0 ? 'text-emerald-400' : diferenciaCuadre > 0 ? 'text-sky-400' : 'text-rose-400'
                            }`}
                          >
                            {diferenciaCuadre === 0
                              ? '0.00'
                              : diferenciaCuadre > 0
                                ? `+${diferenciaCuadre.toFixed(2)}`
                                : diferenciaCuadre.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">€</span>
                        </div>
                        <p
                          className={`text-[9px] font-mono font-bold ${
                            diferenciaCuadre === 0 ? 'text-emerald-400' : diferenciaCuadre > 0 ? 'text-sky-400' : 'text-rose-400'
                          }`}
                        >
                          {diferenciaCuadre === 0 ? '✓ Caja exacta' : diferenciaCuadre > 0 ? 'Superávit / Propinas' : 'Descuadre faltante'}
                        </p>
                      </div>
                    </div>

                    {/* Formulario Añadir Producto */}
                    <AnimatePresence>
                      {showAddMerchForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={(e) => handleAddMerchItem(modalRoadbookKey, e)}
                          className={`p-3.5 rounded-xl border space-y-3 ${
                            isStitchLight ? 'bg-amber-50/70 border-[var(--acc)]' : 'bg-amber-950/20 border-[var(--acc)]/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5" /> Nuevo Artículo de Merchandising para este Concierto
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAddMerchForm(false)}
                              className="text-neutral-400 hover:text-neutral-200 text-xs font-mono cursor-pointer"
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
                                className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs ${
                                  isStitchLight
                                    ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                    : 'bg-neutral-900 border-[var(--hair)] text-neutral-100'
                                }`}
                              />
                            </div>

                            <div>
                              <label className={`block text-[10px] mb-1 ${textSub}`}>Categoría</label>
                              <select
                                value={newMerchCategoria}
                                onChange={(e) => setNewMerchCategoria(e.target.value as any)}
                                className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs ${
                                  isStitchLight
                                    ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                    : 'bg-neutral-900 border-[var(--hair)] text-neutral-100'
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
                                className={`w-full px-2.5 py-1.5 rounded-lg border outline-none text-xs ${
                                  isStitchLight
                                    ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                    : 'bg-neutral-900 border-[var(--hair)] text-neutral-100'
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
                                  onChange={(e) => setNewMerchPrecio(Number(e.target.value) || 0)}
                                  className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs font-mono ${
                                    isStitchLight
                                      ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                      : 'bg-neutral-900 border-[var(--hair)] text-neutral-100'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`block text-[10px] mb-1 ${textSub}`}>Furgón (uds)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={newMerchStockInicial}
                                  onChange={(e) => setNewMerchStockInicial(Number(e.target.value) || 0)}
                                  className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs font-mono ${
                                    isStitchLight
                                      ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                      : 'bg-neutral-900 border-[var(--hair)] text-neutral-100'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar Producto en el Bolo</span>
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Tabla de Artículos: Sube a Furgoneta vs Stock Final Noche */}
                    <div
                      className={`rounded-xl border overflow-hidden ${isStitchLight ? 'bg-white border-[var(--hair)]' : 'bg-[#131313]/90 borderbg-[var(--surface)]'}`}
                    >
                      <div className="p-3 border-b borderbg-[var(--surface)]/80 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Shirt className="w-4 h-4" /> Inventario de Merchandising ({items.length} productos)
                        </span>
                        <span className={`text-[11px] font-mono ${textSub}`}>
                          Ajusta las unidades al subir a la furgoneta y al terminar el bolo
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Shirt className="w-8 h-8 text-neutral-600 mx-auto" />
                          <p className={`text-xs font-mono ${textSub}`}>Aún no has registrado productos para este bolo.</p>
                          <button
                            type="button"
                            onClick={() => setShowAddMerchForm(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-[var(--acc)]/40 hover:bg-amber-500/30 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir primer producto</span>
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y dividebg-[var(--surface)]/60">
                          {items.map((item) => {
                            const vendidas = Math.max(0, (item.stockInicial || 0) - (item.stockFinal || 0));
                            const subtotal = vendidas * (item.precioUnitario || 0);
                            const catConfig = categoriaIcons[item.categoria] || categoriaIcons.otro;
                            const pctVendido = item.stockInicial > 0 ? Math.round((vendidas / item.stockInicial) * 100) : 0;

                            return (
                              <div
                                key={item.id}
                                className={`p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                  isStitchLight ? 'hover:bg-slate-50' : 'hover:bg-neutral-900/40'
                                }`}
                              >
                                {/* Datos del producto */}
                                <div className="flex items-center gap-2.5 min-w-[220px]">
                                  <div className={`p-2 rounded-lg border shrink-0 ${catConfig.color}`}>{catConfig.icon}</div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className={`text-xs font-bold font-sans ${textTitle}`}>{item.nombre}</h4>
                                      {item.talla && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bgbg-[var(--surface)] text-neutral-300 border border-[var(--hair)]">
                                          {item.talla}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-neutral-400">
                                      <span>
                                        Precio: <strong className="text-amber-400">{item.precioUnitario}€</strong>
                                      </span>
                                      <span>•</span>
                                      <span>{catConfig.label}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Controles de Stock Inicial (Sube a Furgoneta) y Stock Final */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center flex-1 max-w-lg">
                                  {/* Sube a Furgoneta */}
                                  <div
                                    className={`p-1.5 rounded-lg border ${isStitchLight ? 'bg-slate-100 border-[var(--hair)]' : 'bg-neutral-900 borderbg-[var(--surface)]'}`}
                                  >
                                    <span className="block text-[9px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                                      <Truck className="w-2.5 h-2.5 text-sky-400" /> Sube Furgón
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockInicial: Math.max(0, (item.stockInicial || 0) - 1),
                                          })
                                        }
                                        className="w-5 h-5 rounded bgbg-[var(--surface)] hover:bg-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.stockInicial}
                                        onChange={(e) =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockInicial: Math.max(0, parseInt(e.target.value, 10) || 0),
                                          })
                                        }
                                        className={`w-12 text-center text-xs font-mono font-bold py-0.5 rounded border outline-none ${
                                          isStitchLight
                                            ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                            : 'bg-neutral-950 border-[var(--hair)] text-neutral-100'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockInicial: (item.stockInicial || 0) + 1,
                                          })
                                        }
                                        className="w-5 h-5 rounded bgbg-[var(--surface)] hover:bg-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Stock Final (Fin de Noche) */}
                                  <div
                                    className={`p-1.5 rounded-lg border ${isStitchLight ? 'bg-slate-100 border-[var(--hair)]' : 'bg-neutral-900 borderbg-[var(--surface)]'}`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[9px] font-mono text-neutral-400 flex items-center gap-1">
                                        <DoorClosed className="w-2.5 h-2.5 text-amber-400" /> Stock Final
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateMerchItem(modalRoadbookKey, item.id, { stockFinal: 0 })}
                                        className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer"
                                        title="Marcar como agotado tras el concierto"
                                      >
                                        Agotado (0)
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockFinal: Math.max(0, (item.stockFinal || 0) - 1),
                                          })
                                        }
                                        className="w-5 h-5 rounded bgbg-[var(--surface)] hover:bg-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={item.stockFinal}
                                        onChange={(e) =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockFinal: Math.max(0, parseInt(e.target.value, 10) || 0),
                                          })
                                        }
                                        className={`w-12 text-center text-xs font-mono font-bold py-0.5 rounded border outline-none ${
                                          isStitchLight
                                            ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                            : 'bg-neutral-950 border-[var(--hair)] text-neutral-100'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateMerchItem(modalRoadbookKey, item.id, {
                                            stockFinal: (item.stockFinal || 0) + 1,
                                          })
                                        }
                                        className="w-5 h-5 rounded bgbg-[var(--surface)] hover:bg-neutral-700 text-neutral-300 text-xs flex items-center justify-center font-mono cursor-pointer shrink-0"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Resumen Ventas del Artículo */}
                                  <div className="col-span-2 sm:col-span-1 flex flex-col items-end justify-center pr-2">
                                    <div className="text-right">
                                      <span className="text-xs font-mono font-black text-amber-400">{vendidas} vendidas</span>
                                      <span className="block text-xs font-mono font-bold text-emerald-400">{subtotal.toFixed(2)} €</span>
                                    </div>
                                    <div className="w-20 bgbg-[var(--surface)] rounded-full h-1 mt-1 overflow-hidden">
                                      <div
                                        className="h-full bg-amber-400 transition-all duration-300"
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
                                    className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
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
                    <div
                      className={`p-4 rounded-xl border space-y-4 ${
                        isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900/50 borderbg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b borderbg-[var(--surface)] pb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Coins className="w-4 h-4" /> Arqueo de Caja y Métodos de Cobro
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Introduce los importes reales cobrados durante la noche
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Efectivo Recaudado */}
                        <div
                          className={`p-3 rounded-xl border ${
                            isStitchLight ? 'bg-white border-[var(--ok)]' : 'bg-neutral-900 border-[var(--ok)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs mb-1">
                            <Banknote className="w-4 h-4" />
                            <span>Efectivo en Caja (€)</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mb-2">Billetes y monedas cobrados en el bolo</p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={merch.ingresosEfectivo ?? 0}
                              onChange={(e) =>
                                handleUpdateMerchTotals(modalRoadbookKey, {
                                  ingresosEfectivo: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className={`w-full px-3 py-1.5 rounded-lg border font-mono font-bold text-sm outline-none ${
                                isStitchLight
                                  ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                  : 'bg-neutral-950 border-[var(--hair)] text-neutral-100'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-neutral-400">€</span>
                          </div>
                        </div>

                        {/* Bizum / TPV Recaudado */}
                        <div
                          className={`p-3 rounded-xl border ${
                            isStitchLight ? 'bg-white border-[var(--acc)]' : 'bg-neutral-900 border-[var(--acc)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-sky-400 font-mono font-bold text-xs mb-1">
                            <Smartphone className="w-4 h-4" />
                            <span>Bizum / TPV (€)</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mb-2">Pagos por móvil y datáfono del bolo</p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={merch.ingresosBizum ?? 0}
                              onChange={(e) =>
                                handleUpdateMerchTotals(modalRoadbookKey, {
                                  ingresosBizum: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className={`w-full px-3 py-1.5 rounded-lg border font-mono font-bold text-sm outline-none ${
                                isStitchLight
                                  ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                  : 'bg-neutral-950 border-[var(--hair)] text-neutral-100'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-neutral-400">€</span>
                          </div>
                        </div>

                        {/* Fondo de Caja Inicial */}
                        <div
                          className={`p-3 rounded-xl border ${
                            isStitchLight ? 'bg-white border-[var(--acc)]' : 'bg-neutral-900 border-[var(--acc)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs mb-1">
                            <Coins className="w-4 h-4" />
                            <span>Fondo de Caja (€)</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono mb-2">Cambio que se llevó al inicio para la mesa</p>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={merch.fondoCajaInicial ?? 0}
                              onChange={(e) =>
                                handleUpdateMerchTotals(modalRoadbookKey, {
                                  fondoCajaInicial: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className={`w-full px-3 py-1.5 rounded-lg border font-mono font-bold text-sm outline-none ${
                                isStitchLight
                                  ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                                  : 'bg-neutral-950 border-[var(--hair)] text-neutral-100'
                              }`}
                            />
                            <span className="font-mono text-xs font-bold text-neutral-400">€</span>
                          </div>
                        </div>
                      </div>

                      {/* Desglose de Caja Total en Mano */}
                      <div
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isStitchLight ? 'bg-white border-[var(--hair)]' : 'bg-neutral-950 borderbg-[var(--surface)]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-bold text-neutral-300">Resumen del Dinero Recaudado en el Puesto:</span>
                          <p className="text-[11px] font-mono text-neutral-400">
                            💵 {(merch.ingresosEfectivo || 0).toFixed(2)}€ Efectivo + 📱 {(merch.ingresosBizum || 0).toFixed(2)}€ Bizum ={' '}
                            <strong className="text-emerald-400">{totalCobradoReal.toFixed(2)}€ Total Ventas</strong>
                          </p>
                          {merch.fondoCajaInicial ? (
                            <p className="text-[10px] font-mono text-neutral-500">
                              (Efectivo físico total a retirar del cajón incluyendo fondo de caja:{' '}
                              {((merch.ingresosEfectivo || 0) + (merch.fondoCajaInicial || 0)).toFixed(2)} €)
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                              diferenciaCuadre === 0
                                ? 'bg-emerald-500/20 text-emerald-300 border-[var(--ok)]/40'
                                : diferenciaCuadre > 0
                                  ? 'bg-sky-500/20 text-sky-300 border-[var(--acc)]/40'
                                  : 'bg-rose-500/20 text-rose-300 border-[var(--alert)]/40'
                            }`}
                          >
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
                        <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                          Notas del Puesto de Merchandising / Incidencias
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ej: Encargado de mesa: Andrea. Las camisetas talla L se agotaron antes del bis. Mucha demanda de púas."
                          value={merch.notas || ''}
                          onChange={(e) => handleUpdateMerchTotals(modalRoadbookKey, { notas: e.target.value })}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none resize-none ${
                            isStitchLight
                              ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-900'
                              : 'bg-neutral-950 border-[var(--hair)] text-neutral-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* TAB 4: PÚBLICO & RESUMEN POST-SHOW */}
            {modalActiveTab === 'postshow' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--acc)]/20 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500 text-stone-950">
                      Sección 4
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>
                      Convocatoria Real, Bandas del Cartel & Sensaciones Post-Show
                    </h3>
                  </div>
                  {selectedConcert && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventFichaModal(false);
                        setViewingConcert(selectedConcert);
                      }}
                      className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Convocatoria / Dictar Nota</span>
                    </button>
                  )}
                </div>

                <p className={`text-xs font-sans leading-relaxed ${textSub}`}>
                  Registra la asistencia propia real y las impresiones tras el directo. Esta información alimenta directamente la
                  inteligencia del <strong className="text-amber-400">Agente de IA Booking</strong> para usarse como prueba social
                  irrefutable y objetiva al negociar con nuevas salas y festivales.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-xl border ${isStitchLight ? 'bg-amber-50/60 border-[var(--acc)]' : 'bg-amber-950/20 border-[var(--acc)]/30'}`}
                  >
                    <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                      👥 Asistencia Propia Estimada
                    </div>
                    <div className="text-2xl font-black font-mono text-amber-300">
                      {selectedConcert?.asistencia_propia ?? selectedConcert?.aforo_vendido ?? 0}{' '}
                      <span className="text-xs font-normal text-neutral-400">espectadores</span>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 mt-1">Público que acudió específicamente a ver a la banda.</p>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900 borderbg-[var(--surface)]'}`}
                  >
                    <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider mb-1">
                      🎸 Público de Otros Grupos
                    </div>
                    <div className="text-2xl font-black font-mono text-white">
                      {selectedConcert?.asistencia_otras_bandas ?? 0}{' '}
                      <span className="text-xs font-normal text-neutral-400">espectadores</span>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-400 mt-1">Afluencia aportada por el resto del cartel.</p>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-neutral-900 borderbg-[var(--surface)]'}`}
                  >
                    <div className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider mb-1">⭐ Hito de Booking</div>
                    <div className="text-sm font-bold font-mono mt-1">
                      {selectedConcert?.es_hito_destacado ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-[var(--ok)]/40 inline-flex items-center gap-1">
                          ⭐ HITO DESTACADO DE LA BANDA
                        </span>
                      ) : (
                        <span className="text-neutral-400 font-normal text-xs">Estándar (marcar si fue un lleno/éxito clave)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${isStitchLight ? 'bg-white border-[var(--hair)]' : 'bg-[#131313] borderbg-[var(--surface)]'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" />
                    <span>Bandas & Cartel Compartido</span>
                  </h4>
                  <p className={`text-xs font-mono ${textTitle}`}>
                    {Array.isArray(selectedConcert?.bandas_compartidas) && selectedConcert.bandas_compartidas.length > 0
                      ? selectedConcert.bandas_compartidas.join(', ')
                      : selectedConcert?.bandas_compartidas || 'Concierto individual en solitario'}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${isStitchLight ? 'bg-amber-50/40 border-[var(--acc)]' : 'bg-neutral-900 border-[var(--acc)]/30'}`}
                >
                  <h4 className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Resumen / Sensaciones Post-Show (Usado por la IA)</span>
                  </h4>
                  {selectedConcert?.post_show_review ? (
                    <p className={`text-xs font-sans italic leading-relaxed ${textTitle}`}>
                      &ldquo;{selectedConcert.post_show_review}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-neutral-400 italic">
                      Sin nota de voz ni resumen escrito registrado todavía. Pulsa &quot;Editar Convocatoria&quot; arriba para añadir la
                      nota de voz desde el camerino o furgoneta.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: CHECKLIST CIERRE DE MATERIAL */}
            {modalActiveTab === 'cierre' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--acc)]/20 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500 text-white">
                      Sección 5
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Checklist de Cierre de Material & Carga de Furgoneta</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleAllCierreItems(modalRoadbookKey, true)}
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-[var(--ok)]/40 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    >
                      ✓ Marcar Todo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllCierreItems(modalRoadbookKey, false)}
                      className="px-2 py-1 rounded text-[10px] font-mono font-bold bgbg-[var(--surface)] text-neutral-300 border border-[var(--hair)] hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      ↺ Desmarcar
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso y Banner de Estado */}
                {(() => {
                  const items = modalRoadbook.cierreMaterial || [];
                  const checkedCount = items.filter((i) => i.checked).length;
                  const totalCount = items.length;
                  const pct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
                  const isCompleted = totalCount > 0 && checkedCount === totalCount;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-purple-300">
                          {checkedCount} de {totalCount} elementos verificados
                        </span>
                        <span className={isCompleted ? 'text-emerald-400' : 'text-amber-400'}>{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bgbg-[var(--surface)] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-500' : pct > 50 ? 'bg-purple-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {isCompleted ? (
                        <div className="p-3 rounded-xl bg-emerald-950/60 border border-[var(--ok)]/50 text-emerald-200 text-xs font-mono flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            ¡TODO EL MATERIAL VERIFICADO! Escenario y camerinos despejados. Furgoneta cerrada y lista para partir.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-[var(--acc)]/40 text-purple-200 text-xs font-mono flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>
                            Verifica uno a uno antes de cerrar la furgoneta para garantizar cero olvidos de cables, instrumentos o ropa.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Listado clasificado por categoría */}
                {['escenario', 'camerino', 'furgoneta'].map((catKey) => {
                  const catLabel =
                    catKey === 'escenario'
                      ? '🎸 Escenario (Backline & Sonido)'
                      : catKey === 'camerino'
                        ? '👕 Camerino (Ropa, Móviles & Merch)'
                        : '🚐 Furgoneta & Vehículo (Estiba & Cierre)';
                  const catItems = (modalRoadbook.cierreMaterial || []).filter((i) => i.categoria === catKey);
                  if (catItems.length === 0) return null;

                  return (
                    <div
                      key={catKey}
                      className={`p-3.5 rounded-xl border space-y-2 ${isStitchLight ? 'bg-slate-50 border-[var(--hair)]' : 'bg-[#141414] borderbg-[var(--surface)]'}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold text-purple-300">{catLabel}</h4>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {catItems.filter((i) => i.checked).length}/{catItems.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleCierreItem(item.id, modalRoadbookKey)}
                            className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                              item.checked
                                ? 'bg-emerald-950/30 border-[var(--ok)]/40 text-neutral-400 line-through'
                                : isStitchLight
                                  ? 'bg-[var(--surface)] border-[var(--hair)] text-slate-800 hover:border-[var(--acc)]'
                                  : 'bg-[var(--sunken)] border-[var(--hair)]/80 text-neutral-200 hover:border-[var(--acc)]/40'
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
                              <span className="text-xs font-mono font-medium">{item.item}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCierreItem(item.id, modalRoadbookKey);
                              }}
                              className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
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
                  className={`p-3 rounded-xl border flex items-center gap-2 flex-wrap ${
                    isStitchLight ? 'bg-slate-100 border-[var(--hair)]' : 'bg-neutral-900 borderbg-[var(--surface)]'
                  }`}
                >
                  <select
                    value={newCierreItemCat}
                    onChange={(e) => setNewCierreItemCat(e.target.value as any)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono border ${
                      isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black border-[var(--hair)] text-white'
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
                    className={`flex-1 min-w-[200px] px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isStitchLight ? 'bg-white border-[var(--hair)] text-slate-900' : 'bg-black border-[var(--hair)] text-white'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newCierreItemText.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
};

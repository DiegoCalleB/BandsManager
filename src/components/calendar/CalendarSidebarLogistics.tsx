import React from 'react';
import {
  Calendar,
  Mic,
  DoorClosed,
  Clock,
  MapPin,
  CheckSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  Navigation,
  Disc3,
  Music,
  Users,
  Ticket,
  Link2,
  Check,
  Copy,
  ExternalLink,
  Radio,
  Target,
  Flame,
  Building2,
  Eye,
  QrCode,
  Settings,
  Smartphone,
  Monitor,
  Cloud,
  ChevronDown,
  Video,
  Handshake,
  Bell,
  Send,
  Loader2,
  List,
  CalendarDays,
  Maximize2,
  Minimize2,
  MessageCircle,
  MessageSquare,
  Share2,
  AlertTriangle,
  Thermometer,
  Edit,
  Phone,
  Wrench,
  ShieldCheck,
  Truck,
  Volume2,
  Zap,
  CheckCircle2,
  RotateCcw,
  UserCheck,
  Layers,
  ArrowUpRight,
  Shirt,
  Coins,
  CreditCard,
  Banknote,
  Calculator,
  ShoppingBag,
  Tag,
  Search,
  X,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import {
  Concert,
  Rehearsal,
  ThemeColors,
  BookingCampaign,
  KeyContactItem,
  CierreMaterialItem,
  MerchBoloItem,
  MerchControlBolo,
} from '../../types';
import { RunOfShowItem, GearItem, RoadbookInfo } from './calendarTypes';
import DirectionsCard from '../DirectionsCard';
import { ConcertBreakEvenCard } from './ConcertBreakEvenCard';
import { EventWeatherCard } from './EventWeatherCard';
import { hasModuleAccess } from '../../utils/planPermissions';
import { openWhatsAppChat, getWhatsAppUrl, WHATSAPP_WINDOW_NAME } from '../../utils/whatsapp';

export interface CalendarSidebarLogisticsProps {
  colors: ThemeColors;
  isStitchLight: boolean;
  textTitle: string;
  textSub: string;
  textMuted: string;
  selectedDate: Date;
  selectedDateKey: string;
  selectedEventDetails: any;
  selectedEventTitle: string;
  selectedConcert: Concert | null;
  selectedRehearsal: Rehearsal | null;
  hasMultipleDayEvents: boolean;
  dayEventsList: any[];
  activeDayEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  monthNames: string[];
  weekdays: string[];
  onNavigate?: (view: string, options?: any) => void;
  currentBandId: string;
  activeBandId: string;
  activeBandName: string;
  getEventBandName: (e: any) => string;
  getBandIdentity: (bandId?: string, fallback?: string) => any;
  getCampaignsForDate: (dateKey: string) => BookingCampaign[];
  isPromoPlan: boolean;
  currentUser?: any;
  upcomingCalendarEvents?: any[];
  upcomingFilter?: any;
  setUpcomingFilter?: (f: any) => void;
  setViewDate?: (d: any) => void;
  currentSetlistId?: string;
  onUpdateConcert?: (id: string, updates: Partial<Concert>) => void;
  onUpdateRehearsal?: (id: string, updates: Partial<Rehearsal>) => void;
  availableSetlists?: any[];
  setActiveStageInitialMode?: (mode: any) => void;
  setActiveStageSetlist?: (s: any) => void;
  saveRoadbook?: (dateKey: string, info: RoadbookInfo) => void;
  setShowCreateModal: (type: 'rehearsal' | 'concert' | 'reunion' | null) => void;
  setShowEventFichaModal: (show: boolean) => void;
  setShowReminderModal: (show: boolean) => void;
  setViewingConcert: (c: Concert | null) => void;
  setViewingRehearsal: (r: Rehearsal | null) => void;
  onDeleteConcert?: (id: string) => void;
  onDeleteRehearsal?: (id: string) => void;
  setReminderNotes: (notes: string) => void;
  setReminderSuccessMsg: (msg: string | null) => void;
  setReminderErrorMsg: (msg: string | null) => void;
  setConcCiudad: (ciudad: string) => void;
  setConcAforo: (aforo: string) => void;
  setConcNotas: (notas: string) => void;
  setModalActiveTab: (tab: any) => void;
  activeTab: 'runofshow' | 'tecnica' | 'contactos' | 'merchan' | 'cierre' | 'gear' | 'roadbook';
  setActiveTab: (tab: any) => void;
  allRoadbooks: Record<string, RoadbookInfo>;
  getCurrentRoadbook: (dateKey: string, concert?: Concert | null) => RoadbookInfo;
  updateRoadbookField: (dateKey: string, partial: Partial<RoadbookInfo>) => void;
  getDefaultRoadbook: (concert?: Concert | null) => RoadbookInfo;
  handleToggleCierreItem: (id: string, dateKey: string) => void;
  handleToggleAllCierreItems: (dateKey: string, checkAll: boolean) => void;
  handleAddCierreItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteCierreItem: (id: string, dateKey: string) => void;
  newCierreItemText: string;
  setNewCierreItemText: (v: string) => void;
  newCierreItemCat: 'escenario' | 'camerino' | 'furgoneta';
  setNewCierreItemCat: (cat: any) => void;
  showAddContactForm: boolean;
  setShowAddContactForm: (v: boolean) => void;
  newContactNombre: string;
  setNewContactNombre: (v: string) => void;
  newContactRol: string;
  setNewContactRol: (v: string) => void;
  newContactTelefono: string;
  setNewContactTelefono: (v: string) => void;
  newContactEmail: string;
  setNewContactEmail: (v: string) => void;
  newContactNotas: string;
  setNewContactNotas: (v: string) => void;
  handleAddKeyContact: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteKeyContact: (id: string, dateKey: string) => void;
  openWhatsAppContact: (contact: KeyContactItem, dateStr: string, venueName: string) => void;
  handleUpdateMerchItem: (dateKey: string, id: string, updates: Partial<MerchBoloItem>) => void;
  handleAddMerchItem: (dateKey: string, e?: React.FormEvent) => void;
  handleDeleteMerchItem: (dateKey: string, id: string) => void;
  handleUpdateMerchTotals: (dateKey: string, updates: Partial<MerchControlBolo>) => void;
  handleCopyMerchSummary: (roadbook: RoadbookInfo, dateKey: string, concert?: Concert | null) => void;
  showAddMerchForm: boolean;
  setShowAddMerchForm: (v: boolean) => void;
  newMerchNombre: string;
  setNewMerchNombre: (v: string) => void;
  newMerchCategoria: any;
  setNewMerchCategoria: (cat: any) => void;
  newMerchTalla: string;
  setNewMerchTalla: (v: string) => void;
  newMerchPrecio: string;
  setNewMerchPrecio: (v: string) => void;
  newMerchStockInicial: string;
  setNewMerchStockInicial: (v: string) => void;
  merchCopiedToast: boolean;
  currentRunOfShow: RunOfShowItem[];
  currentGear: GearItem[];
  handleToggleRunOfShow: (id: string) => void;
  handleAddRunOfShow: (e: React.FormEvent) => void;
  handleDeleteRunOfShow: (id: string, e: React.MouseEvent) => void;
  handleToggleGear: (id: string) => void;
  handleAddGear: (e: React.FormEvent) => void;
  handleDeleteGear: (id: string, e: React.MouseEvent) => void;
  newRunTime: string;
  setNewRunTime: (v: string) => void;
  newRunActivity: string;
  setNewRunActivity: (v: string) => void;
  newGearLabel: string;
  setNewGearLabel: (v: string) => void;
  copiedQrId: string | null;
  setCopiedQrId: (id: string | null) => void;
  assignedSetlist?: any;
  setSelectedDate: (d: Date) => void;
}

export function CalendarSidebarLogistics(props: CalendarSidebarLogisticsProps) {
  const {
    colors,
    isStitchLight,
    textTitle,
    textSub,
    textMuted,
    selectedDate,
    selectedDateKey,
    selectedEventDetails,
    selectedEventTitle,
    selectedConcert,
    selectedRehearsal,
    hasMultipleDayEvents,
    dayEventsList,
    activeDayEventId,
    setSelectedEventId,
    monthNames,
    weekdays,
    onNavigate,
    currentBandId,
    activeBandId,
    activeBandName,
    getEventBandName,
    getBandIdentity,
    getCampaignsForDate,
    isPromoPlan,
    currentUser,
    setShowCreateModal,
    setShowEventFichaModal,
    setShowReminderModal,
    setViewingConcert,
    setViewingRehearsal,
    onDeleteConcert,
    onDeleteRehearsal,
    setReminderNotes,
    setReminderSuccessMsg,
    setReminderErrorMsg,
    setConcCiudad,
    setConcAforo,
    setConcNotas,
    setModalActiveTab,
    activeTab,
    setActiveTab,
    allRoadbooks,
    getCurrentRoadbook,
    updateRoadbookField,
    getDefaultRoadbook,
    handleToggleCierreItem,
    handleToggleAllCierreItems,
    handleAddCierreItem,
    handleDeleteCierreItem,
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
    handleAddKeyContact,
    handleDeleteKeyContact,
    openWhatsAppContact,
    handleUpdateMerchItem,
    handleAddMerchItem,
    handleDeleteMerchItem,
    handleUpdateMerchTotals,
    handleCopyMerchSummary,
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
    merchCopiedToast,
    currentRunOfShow,
    currentGear,
    handleToggleRunOfShow,
    handleAddRunOfShow,
    handleDeleteRunOfShow,
    handleToggleGear,
    handleAddGear,
    handleDeleteGear,
    newRunTime,
    setNewRunTime,
    newRunActivity,
    setNewRunActivity,
    newGearLabel,
    setNewGearLabel,
    copiedQrId,
    setCopiedQrId,
    assignedSetlist,
    setSelectedDate,
    upcomingCalendarEvents = [],
    upcomingFilter = 'all',
    setUpcomingFilter = () => {},
    setViewDate = () => {},
    currentSetlistId,
    onUpdateConcert,
    onUpdateRehearsal,
    availableSetlists = [],
    setActiveStageInitialMode = () => {},
    setActiveStageSetlist = () => {},
    saveRoadbook = () => {},
  } = props;

  return (
    <div className={`${colors.card} p-5 flex flex-col justify-between lg:col-span-1`}>
      {selectedEventDetails.type === 'free' ? (
        <div className="flex flex-col items-center justify-center text-center py-4 space-y-3">
          {getCampaignsForDate(selectedDateKey).length > 0 ? (
            <div className="w-full text-left rounded-[var(--r-l)] bg-gradient-to-br from-[var(--acc)]/40 via-[var(--acc)]/20 to-[var(--surface)] border border-[var(--acc)]/50 p-4 shadow-xl shadow-[var(--acc)]/20">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--acc)]/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/20 border border-[var(--acc)]/40 text-[var(--acc)] flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-[var(--acc)] bg-[var(--acc)]/20 px-2 py-0.5 rounded-[var(--r-pill)] border border-[var(--acc)]/30">
                      🎯 Fecha Objetivo de Campaña
                    </span>
                    <p className="text-[11px] font-mono text-[var(--ink-2)] font-bold mt-0.5">
                      {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                    </p>
                  </div>
                </div>
              </div>

              {getCampaignsForDate(selectedDateKey).map((camp) => (
                <div key={camp.id} className="pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold font-display text-[var(--ink-2)] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-[var(--r-pill)]" style={{ backgroundColor: camp.color || '#8b5cf6' }} />
                      {camp.name}
                    </h4>
                    {camp.isActive && (
                      <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-[var(--acc)] text-[var(--ink)]">
                        ACTIVA
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-[var(--ink-2)]">
                    <span className="inline-flex items-center gap-1 text-[var(--acc)] text-[11px]">
                      <MapPin className="w-3 h-3 text-[var(--acc)]" />
                      {camp.targetCities?.join(', ') || 'Cualquier ciudad'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[var(--acc)] text-[11px]">
                      <Users className="w-3 h-3 text-[var(--acc)]" />
                      {camp.minCapacity} - {camp.maxCapacity} pax
                    </span>
                  </div>

                  {camp.notes && (
                    <p className="text-[11px] text-[var(--ink-2)] italic bg-[var(--sunken)] p-2 rounded-[var(--r-m)] border borderbg-[var(--surface)]">
                      &ldquo;{camp.notes}&rdquo;
                    </p>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate('booking', { campaignFilter: camp.id })}
                        className="flex-1 py-1.5 px-2.5 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--acc)]/30 hover:bg-[var(--acc)]/50 text-[var(--acc)] border border-[var(--acc)]/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Building2 className="w-3 h-3 text-[var(--acc)]" />
                        <span>Salas CRM</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setConcCiudad(camp.targetCities?.[0] || 'Madrid');
                        setConcAforo(String(camp.minCapacity || 250));
                        setConcNotas(`Concierto agendado para la campaña "${camp.name}".`);
                        setShowCreateModal('concert');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
              <div className={`p-3 rounded-[var(--r-pill)] ${'bg-[var(--sunken)] text-[var(--ink-2)]'}`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${'text-[var(--ink-2)]'}`}
                >
                  {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
                </p>
                <h4 className={`text-sm font-bold font-display mt-1 ${textTitle}`}>Día sin eventos agendados</h4>
                <p className={`text-[10px] font-mono mt-1 ${textSub}`}>
                  Selecciona un día con concierto en el calendario para ver su logística y ubicación GPS.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal('rehearsal')}
                  className={`py-1.5 px-3 rounded-[var(--r-m)] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    'bg-[var(--ok)]/15 text-[var(--ok)] hover:bg-[var(--ok)]/25'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agendar Ensayo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal('concert')}
                  className={`py-1.5 px-3 rounded-[var(--r-m)] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    'bg-[var(--acc)]/15 text-[var(--acc)] hover:bg-[var(--acc)]/25'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agendar Concierto</span>
                </button>
              </div>
            </>
          )}

          {/* Quick GPS & Upcoming Events List */}
          <div
            className={`w-full text-left mt-4 pt-3 space-y-2.5 ${'border-t border-[var(--hair)]'}`}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div
                className={`flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider ${'text-[var(--acc)]'}`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Próximas Fechas ({upcomingCalendarEvents.length})</span>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'todos', label: 'Todas' },
                  { id: 'conciertos', label: 'Bolos' },
                  { id: 'campañas', label: '🎯 Campañas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUpcomingFilter(f.id as any)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                      upcomingFilter === f.id
                        ? 'bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40'
                        : 'text-[var(--ink-2)] hover:text-[var(--ink-2)]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {upcomingCalendarEvents.filter((evt) => {
                if (upcomingFilter === 'conciertos') return evt.type === 'concierto';
                if (upcomingFilter === 'ensayos') return evt.type === 'ensayo';
                if (upcomingFilter === 'campañas') return evt.type === 'campaña';
                return true;
              }).length === 0 ? (
                <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay próximas fechas con el filtro seleccionado.</p>
              ) : (
                upcomingCalendarEvents
                  .filter((evt) => {
                    if (upcomingFilter === 'conciertos') return evt.type === 'concierto';
                    if (upcomingFilter === 'ensayos') return evt.type === 'ensayo';
                    if (upcomingFilter === 'campañas') return evt.type === 'campaña';
                    return true;
                  })
                  .map((evt) => (
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
                        evt.type === 'campaña'
                          ? 'bg-[var(--acc)]/20 hover:border-[var(--acc)]/50 border border-[var(--acc)]/30'
                          : 'bg-[var(--surface)] hover:border-[var(--acc)] hover:shadow-sm border border-[var(--hair)]'
                      }`}
                    >
                      {/* Custom calendar badge: Day number top, short month bottom */}
                      <div
                        className={`w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 shadow-sm border ${
                          evt.type === 'campaña'
                            ? 'bg-[var(--acc)]/30 border-[var(--acc)]/40 text-[var(--acc)]'
                            : 'bg-[var(--sunken)] border-[var(--hair)] text-[var(--ink)]'
                        }`}
                      >
                        <span
                          className={`text-base font-mono font-black leading-none ${
                            evt.type === 'campaña' ? 'text-[var(--acc)]' : 'text-[var(--acc)]'
                          }`}
                        >
                          {evt.day}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-extrabold uppercase tracking-widest mt-0.5 ${
                            evt.type === 'campaña' ? 'text-[var(--acc)]' : 'text-[var(--ink-2)]'
                          }`}
                        >
                          {evt.month}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                              evt.type === 'concierto'
                                ? 'bg-[var(--acc)]/15 text-[var(--acc)]'
                                : evt.type === 'campaña'
                                  ? 'bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40'
                                  : 'bg-[var(--ok-soft)] text-[var(--ok)]'
                            }`}
                          >
                            {evt.type === 'campaña' ? '🎯 Posible Bolo' : evt.type}
                          </span>
                          {evt.bandName && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[var(--surface)]/80 text-[var(--acc)] border border-[var(--acc)]/30 truncate max-w-[100px]"
                              title={evt.bandName}
                            >
                              {evt.bandName}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-bold font-display text-[var(--ink-2)] mt-1 truncate">{evt.title}</div>
                        {evt.direccion && <p className={`text-[10px] font-sans ${textSub} mt-0.5`}>📍 {evt.direccion}</p>}
                        {evt.type !== 'campaña' ? (
                          <div className="mt-1 flex justify-center">
                            <DirectionsCard
                              query={evt.locationQuery}
                              locationName={evt.salaOrLugar}
                              address={evt.direccion || evt.ciudad}
                              isStitchLight={isStitchLight}
                            />
                          </div>
                        ) : (
                          <p className="text-[10px] font-mono text-[var(--acc)]/80 mt-0.5">{evt.salaOrLugar}</p>
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
          <div className={`pb-4 mb-4 flex items-center gap-3 border-b ${'border-[var(--hair)]'}`}>
            <div
              className={`w-11 h-11 rounded-[var(--r-m)] flex flex-col items-center justify-center shrink-0 shadow-sm border ${
                'bg-[var(--sunken)] border-[var(--hair)] text-[var(--ink)]'
              }`}
            >
              <span className={`text-base font-mono font-black leading-none ${'text-[var(--acc)]'}`}>
                {selectedDate.getDate()}
              </span>
              <span
                className={`text-[9px] font-mono font-extrabold uppercase tracking-widest mt-0.5 ${'text-[var(--ink-2)]'}`}
              >
                {monthNames[selectedDate.getMonth()]?.slice(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div
                  className={`text-[10px] font-mono uppercase tracking-widest font-bold ${'text-[var(--acc)]'}`}
                >
                  Logística de Ensayos y Conciertos
                </div>
                {(selectedConcert || selectedRehearsal) && (
                  <span className="px-2 py-0.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] border border-[var(--acc)]/40 shadow-xs flex items-center gap-1">
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
                  className={`hidden lg:flex px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer items-center gap-1 ${
                    'bg-[var(--acc-soft)] border-[var(--acc)] text-[var(--acc)] hover:bg-[var(--acc-soft)]'
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
                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer flex items-center gap-1 ${
                    'bg-[var(--acc-soft)] border-[var(--acc)] text-[var(--acc)] hover:bg-[var(--acc-soft)]'
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
                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer flex items-center gap-1 ${
                    'bg-[var(--acc-soft)] border-[var(--acc)] text-[var(--acc)] hover:bg-[var(--acc-soft)]'
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
                  className={`px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer flex items-center gap-1 ${
                    'bg-[var(--ok-soft)] border-[var(--ok)] text-[var(--ok)] hover:bg-[var(--ok-soft)]'
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
                  className="px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer bg-[var(--alert)]/40 border-[var(--alert)]/40 text-[var(--alert)] hover:bg-[var(--alert)]/50"
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
                  className="px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-[var(--r-m)] border transition-colors cursor-pointer bg-[var(--alert)]/40 border-[var(--alert)]/40 text-[var(--alert)] hover:bg-[var(--alert)]/50"
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
              {dayEventsList.map((evt) => {
                const isActive = evt.id === activeDayEventId;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`px-2 py-1 rounded-[var(--r-pill)] text-[9px] font-mono font-bold border transition-colors cursor-pointer ${
                      isActive
                        ? evt.kind === 'concert'
                          ? 'bg-[var(--acc)]/30 border-[var(--acc)] text-[var(--acc)]'
                          : 'bg-[var(--ok)]/30 border-[var(--ok)] text-[var(--ok)]'
                        : 'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
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
                city={
                  selectedConcert?.ciudad ||
                  selectedRehearsal?.lugar?.split(',')[1]?.trim() ||
                  selectedRehearsal?.lugar?.split('-')[1]?.trim() ||
                  selectedRehearsal?.lugar ||
                  ''
                }
                dateStr={selectedDateKey}
                timeStr={selectedConcert ? '21:30' : selectedRehearsal?.hora || '18:00'}
                isStitchLight={isStitchLight}
              />
            </div>
          )}

          {/* Core Info */}
          <div className={`space-y-3 mb-6 rounded-[var(--r-m)] p-3 ${'bg-[var(--surface)]'}`}>
            <div className="flex items-center gap-2 text-[10px]">
              <Clock className={`w-4 h-4 shrink-0 ${'text-[var(--acc)]'}`} />
              <span className={`font-mono ${textSub}`}>Hora:</span>
              <span className={`font-bold font-mono ${'text-[var(--acc)]'}`}>
                {selectedEventDetails.time}
              </span>
            </div>
            <div className="flex items-start gap-2 text-[10px]">
              <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${'text-[var(--acc)]'}`} />
              <div className="flex-1">
                <span className={`font-mono ${textSub}`}>Lugar:</span>
                <p className={`font-medium font-sans mt-0.5 ${textTitle}`}>{selectedEventDetails.lugar}</p>
                {selectedEventDetails.direccion && (
                  <p className={`text-[10px] font-sans mt-1 ${'text-[var(--ink-2)]'}`}>
                    <span className="font-semibold font-mono">Dirección:</span> {selectedEventDetails.direccion}
                  </p>
                )}
              </div>
            </div>
            {selectedEventDetails.locationQuery && selectedEventDetails.type !== 'free' && (
              <div className="pt-3 mt-2.5 flex justify-center">
                <DirectionsCard
                  query={selectedEventDetails.locationQuery}
                  locationName={selectedEventDetails.lugar}
                  address={selectedEventDetails.direccion}
                  isStitchLight={isStitchLight}
                />
              </div>
            )}
            {!isPromoPlan && selectedEventDetails.type === 'concert' && (
              <div className={`flex items-center gap-2 text-[10px] pt-2 mt-1 ${'-slate-100'}`}>
                <Sparkles className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span className={`font-mono ${textSub}`}>Compensación:</span>
                <span className="text-[var(--ok)] dark:text-[var(--ok)] font-bold font-mono">{selectedEventDetails.fee}</span>
              </div>
            )}
            {selectedEventDetails.type === 'concert' && (selectedEventDetails.entradasUrl || selectedEventDetails.entradasLugarFisico) && (
              <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t borderbg-[var(--surface)]/40">
                {selectedEventDetails.entradasUrl && (
                  <a
                    href={selectedEventDetails.entradasUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--ok)] text-[var(--ink)] hover:bg-[var(--ok)] transition-colors w-fit"
                  >
                    <Ticket className="w-3.5 h-3.5" /> Comprar Entradas
                  </a>
                )}
                {selectedEventDetails.entradasLugarFisico && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <MapPin className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    <span className={`font-mono ${textSub}`}>También en:</span>
                    <span className="font-semibold font-mono">{selectedEventDetails.entradasLugarFisico}</span>
                  </div>
                )}
              </div>
            )}
            {!isPromoPlan && selectedEventDetails.type === 'concert' && selectedConcert && (
              <ConcertBreakEvenCard concert={selectedConcert} isStitchLight={isStitchLight} textTitle={textTitle} textSub={textSub} />
            )}
            {selectedEventDetails.notes && (
              <div
                className={`text-[10px] font-sans italic pt-2 leading-relaxed ${'-slate-100 text-[var(--ink-2)]'}`}
              >
                &ldquo;{selectedEventDetails.notes}&rdquo;
              </div>
            )}

            {selectedConcert?.giraNombre && (
              <div className="flex items-center gap-2 text-[10px] pt-2 border-t borderbg-[var(--surface)]/60 mt-2">
                <Navigation className="w-4 h-4 text-[var(--acc)] shrink-0" />
                <span className={`font-mono ${textSub}`}>Gira:</span>
                <span className="font-bold font-mono text-[var(--acc)]">🚐 {selectedConcert.giraNombre}</span>
              </div>
            )}

            {!isPromoPlan && (selectedConcert?.convocatoria_tipo || selectedRehearsal?.convocatoria_tipo) && (
              <div className="flex items-center gap-2 text-[10px] pt-2 border-t borderbg-[var(--surface)]/60 mt-2">
                <Users className="w-4 h-4 text-[var(--acc)] shrink-0" />
                <span className={`font-mono ${textSub}`}>Convocatoria:</span>
                <span className="font-bold font-mono text-[var(--acc)]">
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

            {/* WIDGET QR DEL CONCIERTO (ACCESO RÁPIDO & CONFIGURACIÓN) */}
            {selectedConcert &&
              (() => {
                const host = typeof window !== 'undefined' ? window.location.origin : 'https://bandmanager.io';
                const cleanCity = (selectedConcert.ciudad || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const cleanSala = (selectedConcert.sala || '')
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '');
                const bandCode = (selectedConcert.band_id || currentBandId || activeBandId || '').replace(/^(band|reg)-/, '');
                const defaultUrl = `${host}/unete${cleanCity || cleanSala ? `/${cleanCity}-${cleanSala}` : ''}${bandCode ? `?band=${encodeURIComponent(bandCode)}` : ''}`;
                const targetQrUrl = selectedConcert.customQrUrl || defaultUrl;

                return (
                  <div className={`mt-3 pt-3 border-t ${'border-[var(--hair)]'}`}>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--acc)]">
                        <QrCode className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
                        <span>QR Bolo & Captación Fans:</span>
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('fans', { concertId: selectedConcert.id })}
                          className="text-[9px] font-mono text-[var(--acc)]/90 hover:text-[var(--acc)] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          title="Configurar el QR y la experiencia del fan para este concierto"
                        >
                          <Settings className="w-3 h-3 text-[var(--acc)]" />
                          <span>Configurar</span>
                        </button>
                      )}
                    </div>

                    <div
                      className={`p-2 rounded-[var(--r-m)] border flex items-center gap-2.5 ${
                        'bg-[var(--surface)] border-[var(--hair)] shadow-sm'
                      }`}
                    >
                      <div
                        onClick={() => onNavigate?.('fans', { concertId: selectedConcert.id })}
                        className="p-1 bg-[var(--surface)] rounded-[var(--r-m)] shadow border border-[var(--acc)]/40 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                        title="Haz clic para abrir la configuración del QR"
                      >
                        <QRCode value={targetQrUrl} size={58} level="M" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p
                          className="text-[9px] font-mono text-[var(--ink-2)] truncate break-all bg-[var(--surface)]/60 p-1 rounded border border-[var(--hair)]/60 text-[var(--acc)] font-semibold"
                          title={targetQrUrl}
                        >
                          {targetQrUrl}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={targetQrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)] rounded text-[9px] font-mono font-bold flex items-center gap-1 border border-[var(--acc)]/30 transition-colors"
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
                            className="px-2 py-0.5 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] rounded text-[9px] font-mono font-bold flex items-center gap-1 border border-[var(--hair)] transition-colors cursor-pointer"
                          >
                            {copiedQrId === selectedConcert.id ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-[var(--ok)]" />
                                <span className="text-[var(--ok)]">¡Copiado!</span>
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
            {selectedRehearsal?.tipo_evento === 'reunion' && (
              <div className={`mt-3 pt-3 border-t ${'border-[var(--hair)]'}`}>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--acc)]">
                    <Video className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />
                    <span>Detalles de la Reunión:</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/15 text-[var(--acc)] border border-[var(--acc)]/30">
                    🤝 Coordinación
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-[var(--r-m)] border space-y-2 ${
                    'bg-[var(--surface)] border-[var(--hair)] shadow-sm'
                  }`}
                >
                  {selectedRehearsal.asunto && (
                    <div className="text-[11px] font-semibold text-[var(--acc)]">📌 {selectedRehearsal.asunto}</div>
                  )}
                  <div className="text-[10px] text-[var(--ink-2)] flex items-center gap-1.5">
                    <span>📍 {selectedRehearsal.lugar}</span>
                  </div>

                  {selectedRehearsal.enlace_reunion && (
                    <div className="pt-1 flex items-center gap-2">
                      <a
                        href={
                          selectedRehearsal.enlace_reunion.startsWith('http')
                            ? selectedRehearsal.enlace_reunion
                            : `https://${selectedRehearsal.enlace_reunion}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-1.5 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] rounded-[var(--r-m)] text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[var(--acc)]/20 transition-all cursor-pointer"
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
            {(!isPromoPlan || hasModuleAccess(currentUser?.plan, 'repertorio')) && (selectedConcert || selectedRehearsal) && (
              <div className={` pt-2.5 mt-2.5 ${'-slate-100'}`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--acc)]">
                    <Disc3 className="w-3.5 h-3.5 shrink-0 animate-spin-slow" />
                    <span>Repertorio Asignado:</span>
                  </div>
                  {assignedSetlist && (
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--ok)]/15 text-[var(--ok)] font-bold">
                      {assignedSetlist.items?.length || 0} canciones/ítems
                    </span>
                  )}
                </div>

                <select
                  value={currentSetlistId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (selectedConcert) {
                      onUpdateConcert(selectedConcert.id, { setlistId: val });
                    } else if (selectedRehearsal) {
                      onUpdateRehearsal(selectedRehearsal.id, { setlistId: val });
                    }
                  }}
                  className={`w-full text-[10px] font-mono p-1.5 rounded-[var(--r-m)] focus:outline-none cursor-pointer ${
                    'bg-[var(--surface)] text-[var(--ink)]'
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
                        setActiveStageInitialMode(selectedConcert ? 'directo' : 'ensayo');
                        setActiveStageSetlist(assignedSetlist);
                      }}
                      className="flex-1 py-2 px-3 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] to-[var(--acc)] hover:from-[var(--acc)] hover:to-[var(--acc)] text-[var(--ink)] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[var(--acc)]/20 transition-all cursor-pointer"
                      title="Lanzar Modo Escenario / Vista de Directo para este evento"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse text-[var(--ink)]" />
                      <span>{selectedConcert ? 'Lanzar Modo Escenario' : 'Lanzar Modo Ensayo'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtabs for Checklist */}
          <div className={`flex flex-wrap gap-1 mb-4 pb-1 border-b ${'border-[var(--hair)]'}`}>
            <button
              id="calendar-subtab-runofshow"
              onClick={() => setActiveTab('runofshow')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
                activeTab === 'runofshow'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Timing
            </button>
            <button
              id="calendar-subtab-tecnica"
              onClick={() => setActiveTab('tecnica')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'tecnica'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Wrench className="w-2.5 h-2.5" />
              <span>1. Logística</span>
            </button>
            <button
              id="calendar-subtab-contactos"
              onClick={() => setActiveTab('contactos')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'contactos'
                  ? 'bg-[var(--ok-soft)] text-[var(--ok)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Users className="w-2.5 h-2.5" />
              <span>2. Contactos</span>
            </button>
            <button
              id="calendar-subtab-merchan"
              onClick={() => setActiveTab('merchan')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'merchan'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc-ink)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <Shirt className="w-2.5 h-2.5" />
              <span>3. Merchan</span>
            </button>
            <button
              id="calendar-subtab-cierre"
              onClick={() => setActiveTab('cierre')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'cierre'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>5. Cierre</span>
            </button>
            <button
              id="calendar-subtab-roadbook"
              onClick={() => setActiveTab('roadbook')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
                activeTab === 'roadbook'
                  ? 'bg-[var(--ok-soft)] text-[var(--ok)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Ruta
            </button>
            <button
              id="calendar-subtab-gear"
              onClick={() => setActiveTab('gear')}
              className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded cursor-pointer transition-colors ${
                activeTab === 'gear'
                  ? 'bg-[var(--acc-soft)] text-[var(--acc)] font-bold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Cacharros
            </button>
          </div>

          {/* Content for Subtabs */}
          {activeTab === 'roadbook' ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-[10px]">
              {(() => {
                const currentRb = allRoadbooks[selectedDateKey] || {
                  contactoPromotor: 'Manuel (Producción)',
                  telefonoPromotor: '+34 654 321 987',
                  tecnicoSonido: 'FOH Bakandeya',
                  hotelNombre: 'Hotel de Gira',
                  hotelDireccion: selectedConcert?.ciudad || 'Por confirmar',
                  cateringInfo: 'Cena tras prueba de sonido',
                  inputList:
                    '1. Bombo (Beta 52)\n2. Caja Top (SM57)\n3. Bajo (DI Radial)\n4. Gtr L (e609)\n5. Teclado L/R\n6. Tpt (Clip)\n7. Voz Ppal (Beta 58)\n8. Coros (SM58)',
                };

                return (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-[var(--r-m)] space-y-2 ${'bg-[var(--surface)]'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono uppercase font-bold ${'text-[var(--acc)]'}`}>
                          📞 Contacto Producción & Hotel
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Promotor / Sala</label>
                          <input
                            type="text"
                            value={currentRb.contactoPromotor}
                            onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, contactoPromotor: e.target.value })}
                            className={`w-full px-2 py-1 rounded text-[10px] ${'bg-[var(--surface)]'}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Teléfono</label>
                          <input
                            type="text"
                            value={currentRb.telefonoPromotor}
                            onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, telefonoPromotor: e.target.value })}
                            className={`w-full px-2 py-1 rounded text-[10px] ${'bg-[var(--surface)]'}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Hotel Alojamientos</label>
                        <input
                          type="text"
                          value={currentRb.hotelNombre}
                          onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, hotelNombre: e.target.value })}
                          className={`w-full px-2 py-1 rounded text-[10px] ${'bg-[var(--surface)]'}`}
                        />
                      </div>

                      <div>
                        <label className={`block text-[10px] font-mono uppercase ${textSub}`}>Catering & Menús</label>
                        <input
                          type="text"
                          value={currentRb.cateringInfo}
                          onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, cateringInfo: e.target.value })}
                          className={`w-full px-2 py-1 rounded text-[10px] ${'bg-[var(--surface)]'}`}
                        />
                      </div>
                    </div>

                    <div className={`p-3 rounded-[var(--r-m)] space-y-1.5 ${'bg-[var(--surface)]'}`}>
                      <span className={`text-[10px] font-mono uppercase font-bold ${'text-[var(--acc)]'}`}>
                        🎸 Input List / Rider de Canales
                      </span>
                      <textarea
                        rows={4}
                        value={currentRb.inputList}
                        onChange={(e) => saveRoadbook(selectedDateKey, { ...currentRb, inputList: e.target.value })}
                        className={`w-full p-2 rounded font-mono text-[10px] ${'bg-[var(--surface)] text-[var(--ink)]'}`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const currentRbData = allRoadbooks[selectedDateKey] || currentRb;
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        printWindow.document.write(`
 <!DOCTYPE html>
 <html>
 <head>
 <title>Hoja de Ruta Bakandeya - ${selectedConcert ? selectedConcert.sala : 'Concierto'}</title>
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
 <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f59e0b; padding-bottom:12px; margin-bottom:20px;">
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
 <p style="margin:2px 0; font-size:11px; color:#555;">${selectedEventDetails.direccion || 'Dirección no especificada'}</p>
 ${!isPromoPlan ? `<p style="margin:8px 0 2px 0; font-size:11px;"><strong>Caché / Condición:</strong> ${selectedEventDetails.fee}</p>` : ''}
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
 ${
   currentRunOfShow.length === 0
     ? '<p style="font-size:11px; color:#888;">Sin horarios definidos.</p>'
     : currentRunOfShow
         .map(
           (i) => `
 <div class="item-row">
 <span class="time">${i.time}</span>
 <span style="flex:1;">${i.activity}</span>
 </div>
 `
         )
         .join('')
 }
 </div>

 <div class="grid">
 <div class="card">
 <div class="card-title">🎸 Lista de Canales / Input List (Rider)</div>
 <pre>${currentRbData.inputList}</pre>
 </div>
 <div class="card">
 <div class="card-title">🎒 Check-list Cacharros & Backline</div>
 ${
   currentGear.length === 0
     ? '<p style="font-size:11px; color:#888;">Sin material asignado.</p>'
     : currentGear
         .map(
           (g) => `
 <div class="item-row">
 <span>${g.checked ? '☑' : '☐'} ${g.label}</span>
 </div>
 `
         )
         .join('')
 }
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
                        'bg-gradient-to-r from-[var(--acc)] to-[var(--acc)] text-[var(--ink)]'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Imprimir / Exportar Hoja de Ruta (PDF)</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : activeTab === 'tecnica' ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
              {(() => {
                const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
                return (
                  <div className="space-y-2.5">
                    <div
                      className={`p-2.5 rounded-[var(--r-m)] border ${'bg-[var(--acc-soft)]/70 border-[var(--acc)]'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold flex items-center gap-1 text-[var(--acc)] font-mono uppercase text-[10px]">
                          <Wrench className="w-3 h-3" /> 1. Logística Técnica
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setModalActiveTab('tecnica');
                            setShowEventFichaModal(true);
                          }}
                          className="text-[9px] underline text-[var(--acc)] hover:text-[var(--acc)] font-mono cursor-pointer"
                        >
                          Editar Completo →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                        <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                          <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Prueba de Sonido</span>
                          <span className="font-bold text-[var(--acc)]">{currentRb.horaPruebaSonido || '18:00'}</span>
                        </div>
                        <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                          <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Horario Show</span>
                          <span className="font-bold text-[var(--ok)]">{currentRb.horaShow || '21:30'}</span>
                        </div>
                        <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                          <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Técnico Sonido FOH</span>
                          <span className="font-medium truncate">{currentRb.tecnicoSonido || 'Propio / Sala'}</span>
                        </div>
                        <div className={`p-1.5 rounded ${'bg-[var(--surface)]'}`}>
                          <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Sistema P.A.</span>
                          <span className="font-medium truncate">{currentRb.paEspecificaciones ? 'Especificado' : 'Estándar Sala'}</span>
                        </div>
                      </div>
                      {currentRb.backlineInfo && (
                        <div className={`mt-2 p-1.5 rounded text-[9px] ${'bg-[var(--surface)]'}`}>
                          <span className="block text-[var(--ink-2)] font-mono uppercase text-[8px]">Backline & Rider</span>
                          <p className="line-clamp-2 text-[var(--ink-2)]">{currentRb.backlineInfo}</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalActiveTab('tecnica');
                        setShowEventFichaModal(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Abrir Logística Técnica Completa</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : activeTab === 'contactos' ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
              {(() => {
                const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
                const contacts = currentRb.contactosClave || [];
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono uppercase font-bold text-[var(--ok)] text-[10px] flex items-center gap-1">
                        <Users className="w-3 h-3" /> 2. Contactos Clave ({contacts.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setModalActiveTab('contactos');
                          setShowEventFichaModal(true);
                        }}
                        className="text-[9px] underline text-[var(--ok)] hover:text-[var(--ok)] font-mono cursor-pointer"
                      >
                        + Gestionar →
                      </button>
                    </div>
                    {contacts.length === 0 ? (
                      <p className={`text-[10px] italic text-center py-3 ${textMuted}`}>No hay contactos clave agregados.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {contacts.map((c) => (
                          <div
                            key={c.id}
                            className={`p-2 rounded-[var(--r-m)] border flex items-center justify-between gap-2 ${'bg-[var(--surface)] border-[var(--hair)]'}`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold truncate text-[10px]">{c.nombre}</div>
                              <div className="text-[9px] text-[var(--ink-2)] font-mono flex items-center gap-1">
                                <span className="px-1 py-0.2 rounded bg-[var(--ok)]/10 text-[var(--ok)] text-[8px] uppercase">{c.rol}</span>
                                <span>{c.telefono}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {c.telefono && (
                                <>
                                  <a
                                    href={getWhatsAppUrl(c.telefono)}
                                    target={WHATSAPP_WINDOW_NAME}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openWhatsAppChat(c.telefono);
                                    }}
                                    className="p-1 rounded bg-[var(--ok)]/20 text-[var(--ok)] hover:bg-[var(--ok)]/30"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={`tel:${c.telefono}`}
                                    className="p-1 rounded bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30"
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
                      className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--ok)]/20 text-[var(--ok)] hover:bg-[var(--ok)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Añadir Contactos Clave</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : activeTab === 'merchan' ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
              {(() => {
                const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
                const merch = currentRb.merchControl || getDefaultRoadbook(selectedConcert).merchControl!;
                const items = merch.items || [];
                const totalInicial = items.reduce((acc, i) => acc + (i.stockInicial || 0), 0);
                const totalFinal = items.reduce((acc, i) => acc + (i.stockFinal || 0), 0);
                const totalVendidas = Math.max(0, totalInicial - totalFinal);
                const totalTeorico = items.reduce(
                  (acc, i) => acc + Math.max(0, (i.stockInicial || 0) - (i.stockFinal || 0)) * (i.precioUnitario || 0),
                  0
                );
                const totalCobrado = (merch.ingresosEfectivo || 0) + (merch.ingresosBizum || 0);
                const cuadreDiff = totalCobrado - totalTeorico;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono uppercase font-bold text-[var(--acc)] text-[10px] flex items-center gap-1">
                        <Shirt className="w-3 h-3" /> 3. Merch ({totalVendidas}/{totalInicial} uds)
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]">
                        {totalTeorico.toFixed(0)}€ ventas
                      </span>
                    </div>

                    {/* Arqueo Rápido */}
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                      <div className="p-1.5 rounded bg-[var(--ok)]/10 border border-[var(--ok)]/20 flex flex-col">
                        <span className="text-[var(--ok)]/80 text-[8px] flex items-center gap-0.5">
                          <Banknote className="w-2.5 h-2.5" /> Efectivo
                        </span>
                        <span className="font-bold text-[var(--ok)] text-[11px]">{(merch.ingresosEfectivo || 0).toFixed(0)}€</span>
                      </div>
                      <div className="p-1.5 rounded bg-[var(--acc)]/10 border border-[var(--acc)]/20 flex flex-col">
                        <span className="text-[var(--acc)]/80 text-[8px] flex items-center gap-0.5">
                          <Smartphone className="w-2.5 h-2.5" /> Bizum / TPV
                        </span>
                        <span className="font-bold text-[var(--acc)] text-[11px]">{(merch.ingresosBizum || 0).toFixed(0)}€</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8.5px] font-mono px-1 py-0.5 rounded bg-[var(--surface)]/60 border borderbg-[var(--surface)]">
                      <span className="text-[var(--ink-2)]">
                        Total cobrado: <strong className="text-[var(--ink)]">{totalCobrado.toFixed(0)}€</strong>
                      </span>
                      <span
                        className={`font-bold ${cuadreDiff === 0 ? 'text-[var(--ok)]' : cuadreDiff > 0 ? 'text-[var(--acc)]' : 'text-[var(--acc)]'}`}
                      >
                        {cuadreDiff === 0
                          ? '✓ Cuadrada'
                          : cuadreDiff > 0
                            ? `+${cuadreDiff.toFixed(0)}€ propina`
                            : `${cuadreDiff.toFixed(0)}€ descuadre`}
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
                              'bg-[var(--surface)] text-[var(--ink)]'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="font-medium truncate text-[9.5px]">
                                {item.nombre} {item.talla ? `(${item.talla})` : ''}
                              </p>
                              <p className="text-[8px] text-[var(--ink-2)] font-mono">
                                {item.stockInicial} furgón ➔ {item.stockFinal} quedan
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-mono font-bold text-[var(--acc)]">{vendidas} vend.</span>
                              <p className="text-[8px] font-mono text-[var(--ink-2)]">{(vendidas * item.precioUnitario).toFixed(0)}€</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {items.length > 4 && (
                      <p className="text-[8px] text-center font-mono text-[var(--ink-2)]">+{items.length - 4} productos más en inventario</p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setModalActiveTab('merchan');
                        setShowEventFichaModal(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Shirt className="w-3 h-3" />
                      <span>Control Merchandising Completo</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : activeTab === 'cierre' ? (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-[10px]">
              {(() => {
                const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
                const items = currentRb.cierreMaterial || [];
                const checkedCount = items.filter((i) => i.checked).length;
                const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono uppercase font-bold text-[var(--acc)] text-[10px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 5. Cierre Material ({checkedCount}/{items.length})
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${progress === 100 ? 'bg-[var(--ok)]/20 text-[var(--ok)]' : 'bg-[var(--acc)]/20 text-[var(--acc)]'}`}
                      >
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bgbg-[var(--surface)] rounded-[var(--r-pill)] h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-[var(--ok)]' : 'bg-[var(--acc)]'}`}
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
                              ? 'bg-[var(--ok-soft)]/70 text-[var(--ink-2)] line-through'
                              : 'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sunken)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => {}}
                            className="rounded text-[var(--acc)] h-3 w-3 cursor-pointer"
                          />
                          <span className="flex-1 truncate text-[9.5px]">{item.item}</span>
                          <span className="text-[8px] font-mono uppercase px-1 rounded bgbg-[var(--surface)] text-[var(--ink-2)] shrink-0">
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
                      className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-[10px] font-mono font-bold bg-[var(--acc)]/20 text-[var(--acc)] hover:bg-[var(--acc)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
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
                {activeTab === 'runofshow' ? (
                  <form onSubmit={handleAddRunOfShow} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="17:30"
                      value={newRunTime}
                      onChange={(e) => setNewRunTime(e.target.value)}
                      className={`w-16 px-2 py-1 text-[10px] font-mono rounded outline-none ${
                        'bg-[var(--surface)] text-[var(--ink)]'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Nueva actividad/horario..."
                      value={newRunActivity}
                      onChange={(e) => setNewRunActivity(e.target.value)}
                      className={`flex-1 px-2 py-1 text-[10px] rounded outline-none ${
                        'bg-[var(--surface)] text-[var(--ink)]'
                      }`}
                    />
                    <button
                      type="submit"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        'bg-[var(--acc)]/15 text-[var(--ink)] hover:bg-[var(--acc)]/15'
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
                        'bg-[var(--surface)] text-[var(--ink)]'
                      }`}
                    />
                    <button
                      type="submit"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        'bg-[var(--acc)]/15 text-[var(--ink)] hover:bg-[var(--acc)]/15'
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
                {activeTab === 'runofshow' ? (
                  currentRunOfShow.length === 0 ? (
                    <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay horarios registrados para este día.</p>
                  ) : (
                    currentRunOfShow.map((item) => {
                      const isItemDone = item.done;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleRunOfShow(item.id)}
                          className={`p-2 rounded-[var(--r-s)] flex items-center gap-2.5 cursor-pointer transition-colors group ${
                            isItemDone
                              ? 'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
                              : 'bg-[var(--surface)] text-[var(--ink)] hover:-indigo-300'
                          }`}
                        >
                          <span
                            className={`font-mono text-[10px] font-bold shrink-0 ${
                              isItemDone
                                ? 'text-[var(--ink-2)]'
                                : 'text-[var(--acc)]'
                            }`}
                          >
                            {item.time}
                          </span>
                          <p className="text-[10px] font-sans leading-normal flex-1">{item.activity}</p>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRunOfShow(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-2)] hover:text-[var(--alert)] transition-opacity"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )
                ) : currentGear.length === 0 ? (
                  <p className={`text-[10px] italic text-center py-4 ${textMuted}`}>No hay material registrado para este día.</p>
                ) : (
                  currentGear.map((item) => {
                    const isChecked = item.checked;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleGear(item.id)}
                        className={`p-2 rounded-[var(--r-s)] flex items-center gap-2.5 cursor-pointer transition-colors group ${
                          isChecked
                            ? 'bg-[var(--sunken)] text-[var(--ink-2)] line-through'
                            : 'bg-[var(--surface)] text-[var(--ink)] hover:-indigo-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div click
                          className={`rounded focus:ring-0 cursor-pointer h-3.5 w-3.5 ${
                            '-slate-300 text-[var(--acc)] bg-[var(--surface)]'
                          }`}
                        />
                        <p className="text-[10px] font-sans leading-normal flex-1">{item.label}</p>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteGear(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-2)] hover:text-[var(--alert)] transition-opacity"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer info */}
      <div
        className={` pt-4 mt-6 flex justify-between items-center text-[10px] font-mono ${
          '-slate-100 text-[var(--ink-2)]'
        }`}
      >
        <span>Huso Horario: Madrid (UTC+2)</span>
        <span className="text-[var(--ok)] dark:text-[var(--ok)]">● Sincronizado</span>
      </div>
    </div>
  );
}

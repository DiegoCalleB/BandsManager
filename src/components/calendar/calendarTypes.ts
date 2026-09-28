import { Rehearsal, Concert, ThemeColors, BookingCampaign, KeyContactItem, TechnicalLogistics, CierreMaterialItem, MerchBoloItem, MerchControlBolo } from '../../types';

export interface CalendarViewProps {
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
  onShowNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export interface RunOfShowItem {
  id: string;
  time: string;
  activity: string;
  done: boolean;
}

export interface GearItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface RoadbookInfo {
  runOfShow?: RunOfShowItem[];
  tecnica?: Partial<TechnicalLogistics>;
  contactosClave?: KeyContactItem[];
  merchControl?: MerchControlBolo;
  cierreMaterial?: CierreMaterialItem[];
  gearItems?: GearItem[];
  hotelNotes?: string;
  travelNotes?: string;
  contactoPromotor?: string;
  telefonoPromotor?: string;
  tecnicoSonido?: string;
  hotelNombre?: string;
  hotelDireccion?: string;
  cateringInfo?: string;
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
  inputList?: string;
  notasTecnicas?: string;
}

export const BAND_COLOR_PALETTES = [
  { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', badge: 'bg-amber-500 text-stone-950', dot: 'bg-amber-400', accent: '#f59e0b' },
  { bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40', badge: 'bg-sky-500 text-white', dot: 'bg-sky-400', accent: '#0284c7' },
  { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', badge: 'bg-purple-500 text-white', dot: 'bg-purple-400', accent: '#a855f7' },
  { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', badge: 'bg-emerald-500 text-stone-950', dot: 'bg-emerald-400', accent: '#10b981' },
  { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', badge: 'bg-rose-500 text-white', dot: 'bg-rose-400', accent: '#f43f5e' },
  { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', badge: 'bg-indigo-500 text-white', dot: 'bg-indigo-400', accent: '#6366f1' },
  { bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40', badge: 'bg-teal-500 text-stone-950', dot: 'bg-teal-400', accent: '#14b8a6' },
  { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', badge: 'bg-orange-500 text-stone-950', dot: 'bg-orange-400', accent: '#f97316' },
];

export const getDetailedDateInfo = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return null;
  let d: Date;
  if (typeof dateInput === 'string') {
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

  const dayNamesLong = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayNamesShort = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const monthNamesLong = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthNamesShort = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

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

  let relativeLabel = '';
  let relativeBadgeClass = '';
  if (diffDays === 0) {
    relativeLabel = '¡HOY!';
    relativeBadgeClass = 'bg-emerald-500 text-stone-950 font-black shadow-xs animate-pulse';
  } else if (diffDays === 1) {
    relativeLabel = 'Mañana';
    relativeBadgeClass = 'bg-amber-400 text-stone-950 font-black shadow-xs';
  } else if (diffDays === 2) {
    relativeLabel = 'Pasado mañana';
    relativeBadgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  } else if (diffDays > 2 && diffDays <= 7) {
    relativeLabel = `En ${diffDays} días`;
    relativeBadgeClass = 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
  } else if (diffDays > 7 && diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    relativeLabel = `En ${diffDays} días (${weeks} sem)`;
    relativeBadgeClass = 'bg-sky-950/40 text-sky-300 border border-sky-500/30';
  } else if (diffDays > 30) {
    const months = Math.round(diffDays / 30);
    relativeLabel = `En ${diffDays} días (~${months} mes${months > 1 ? 'es' : ''})`;
    relativeBadgeClass = 'bg-neutral-800 text-neutral-300 border border-neutral-700';
  } else if (diffDays === -1) {
    relativeLabel = 'Ayer';
    relativeBadgeClass = 'bg-neutral-800 text-neutral-400 border border-neutral-700';
  } else {
    relativeLabel = `Celebrado (hace ${Math.abs(diffDays)} d)`;
    relativeBadgeClass = 'bg-neutral-900 text-neutral-500 border border-neutral-800';
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

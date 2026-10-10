import type { User } from "../../types";
import {
  Rehearsal,
  Concert,
  ThemeColors,
  BookingCampaign,
  KeyContactItem,
  TechnicalLogistics,
  CierreMaterialItem,
  MerchBoloItem,
  MerchControlBolo,
} from '../../types';

/** Banda seleccionable en el calendario; incluye los alias de logo heredados de distintas APIs. */
export interface CalendarBand {
  band_id: string;
  bandName: string;
  id?: string;
  name?: string;
  nombre_banda?: string;
  plan?: string;
  logoUrl?: string;
  logo_url?: string;
  imagen_url?: string;
  avatar_url?: string;
}

/** Usuario activo tal y como lo necesita el calendario. */
export interface CalendarUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  band_id?: string;
  instrument?: string;
  plan?: string;
  is_admin?: boolean;
  ui_preferences?: User["ui_preferences"];
}

/** Campos de banda que algunos endpoints añaden a conciertos y ensayos. */
export interface BandTaggedEvent {
  bandName?: string;
  band_name?: string;
  bandLogo?: string;
  logoUrl?: string;
}

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
  availableBands?: CalendarBand[];
  bandUsers?: Array<{
    id: string;
    name: string;
    username?: string;
    role?: string;
    instrument?: string;
    email?: string;
    band_id?: string;
    bandName?: string;
  }>;
  currentUser?: CalendarUser;
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

/**
 * Paleta categórica para distinguir bandas en un calendario compartido (multi-banda).
 * No es color de módulo Espectro — aquí el matiz variado ES la información (qué
 * banda es cada evento), así que se sale a propósito de la paleta de un solo acento.
 * `text` en tono 700/800 para que se lea sobre el `bg` translúcido en claro y oscuro
 * a la vez, sin depender de `dark:` (prohibido en componentes por el sistema Espectro).
 */
export const BAND_COLOR_PALETTES = [
  {
    bg: 'bg-amber-500/20 text-amber-800',
    badge: 'bg-amber-500 text-stone-950',
    dot: 'bg-amber-400',
    accent: '#f59e0b',
  },
  { bg: 'bg-sky-500/20 text-sky-800', badge: 'bg-sky-500 text-white', dot: 'bg-sky-400', accent: '#0284c7' },
  {
    bg: 'bg-purple-500/20 text-purple-800',
    badge: 'bg-purple-500 text-white',
    dot: 'bg-purple-400',
    accent: '#a855f7',
  },
  {
    bg: 'bg-emerald-500/20 text-emerald-800',
    badge: 'bg-emerald-500 text-stone-950',
    dot: 'bg-emerald-400',
    accent: '#10b981',
  },
  { bg: 'bg-rose-500/20 text-rose-800', badge: 'bg-rose-500 text-white', dot: 'bg-rose-400', accent: '#f43f5e' },
  {
    bg: 'bg-indigo-500/20 text-indigo-800',
    badge: 'bg-indigo-500 text-white',
    dot: 'bg-indigo-400',
    accent: '#6366f1',
  },
  { bg: 'bg-teal-500/20 text-teal-800', badge: 'bg-teal-500 text-stone-950', dot: 'bg-teal-400', accent: '#14b8a6' },
  {
    bg: 'bg-orange-500/20 text-orange-800',
    badge: 'bg-orange-500 text-stone-950',
    dot: 'bg-orange-400',
    accent: '#f97316',
  },
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
    relativeBadgeClass = 'bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)]';
  } else if (diffDays === -1) {
    relativeLabel = 'Ayer';
    relativeBadgeClass = 'bg-[var(--sunken)] text-[var(--ink-2)] border border-[var(--hair)]';
  } else {
    relativeLabel = `Celebrado (hace ${Math.abs(diffDays)} d)`;
    relativeBadgeClass = 'bg-[var(--sunken)]/60 text-[var(--ink-2)]/80 border border-[var(--hair)]';
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
    relativeBadgeClass,
  };
};

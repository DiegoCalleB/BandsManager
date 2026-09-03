import type { LucideIcon } from 'lucide-react';
import { Table, Building2, Radio, Users, CalendarRange, Truck, BookOpen, QrCode, Video, Disc3, Guitar, Coins, Sparkles } from 'lucide-react';

export type NavItemId =
  | 'resumen' | 'booking' | 'medios' | 'bandas' | 'calendario' | 'giras'
  | 'epk' | 'fans' | 'reels' | 'repertorio' | 'chat' | 'finanzas' | 'merchan';

export interface NavItemDef {
  id: NavItemId;
  icon: LucideIcon;
  labelKey: string;
  labelDefault: string;
  adminOnly?: boolean;
}

// labelKey siempre resuelve contra el diccionario de LanguageContext (TRANSLATIONS['es']
// define todas las claves 'nav.*' usadas aquí), así que labelDefault en la práctica solo
// se usa si esa clave llegara a faltar del diccionario — mismo texto en los tres navs.
export const NAV_ITEMS: Record<NavItemId, NavItemDef> = {
  resumen: { id: 'resumen', icon: Table, labelKey: 'nav.resumen', labelDefault: 'Resumen' },
  booking: { id: 'booking', icon: Building2, labelKey: 'nav.booking', labelDefault: 'Booking Salas' },
  medios: { id: 'medios', icon: Radio, labelKey: 'nav.medios', labelDefault: 'Medios y Prensa' },
  bandas: { id: 'bandas', icon: Users, labelKey: 'nav.bandas', labelDefault: 'Grupos & Agencias' },
  calendario: { id: 'calendario', icon: CalendarRange, labelKey: 'nav.calendario', labelDefault: 'Calendario' },
  giras: { id: 'giras', icon: Truck, labelKey: 'nav.giras', labelDefault: 'Tour Manager' },
  epk: { id: 'epk', icon: BookOpen, labelKey: 'nav.epk', labelDefault: 'Dossier (EPK)' },
  fans: { id: 'fans', icon: QrCode, labelKey: 'nav.fans', labelDefault: 'Captura QR & Fans' },
  reels: { id: 'reels', icon: Video, labelKey: 'nav.reels', labelDefault: 'Reels Center' },
  repertorio: { id: 'repertorio', icon: Disc3, labelKey: 'nav.repertorio', labelDefault: 'Repertorio' },
  chat: { id: 'chat', icon: Guitar, labelKey: 'nav.chat', labelDefault: 'Agente Mánager' },
  finanzas: { id: 'finanzas', icon: Coins, labelKey: 'nav.finanzas', labelDefault: 'Finanzas', adminOnly: true },
  merchan: { id: 'merchan', icon: Sparkles, labelKey: 'nav.merchan', labelDefault: 'Merchandising', adminOnly: true },
};

export interface NavGroupDef {
  id: string;
  titleKey: string;
  titleDefault: string;
  itemIds: NavItemId[];
}

/** Ítem fijo que siempre se muestra arriba, fuera de cualquier grupo colapsable. */
export const NAV_PINNED_TOP_IDS: NavItemId[] = ['resumen'];

/**
 * Agrupación usada cuando el plan de la banda desbloquea suficientes módulos
 * (ver MIN_MODULES_FOR_GROUPED_NAV) para justificar un menú por secciones
 * colapsables en vez de una lista plana.
 */
export const NAV_GROUPS: NavGroupDef[] = [
  {
    id: 'booking-gestion',
    titleKey: 'navGroup.bookingGestion',
    titleDefault: 'Booking & Gestión',
    itemIds: ['booking', 'medios', 'bandas', 'giras', 'finanzas', 'merchan'],
  },
  {
    id: 'musica',
    titleKey: 'navGroup.musica',
    titleDefault: 'Música',
    itemIds: ['calendario', 'repertorio', 'chat'],
  },
  {
    id: 'difusion-contenido',
    titleKey: 'navGroup.difusionContenido',
    titleDefault: 'Difusión & Contenido',
    itemIds: ['epk', 'fans', 'reels'],
  },
];

/**
 * Orden plano actual del <aside> de escritorio y del drawer móvil. Se usa tal cual
 * cuando el plan no supera MIN_MODULES_FOR_GROUPED_NAV (hoy, solo `promo`), para no
 * cambiar nada visualmente en ese caso.
 */
export const FLAT_NAV_ORDER_IDS: NavItemId[] = [
  'resumen', 'booking', 'medios', 'bandas', 'calendario', 'giras', 'epk', 'fans', 'reels', 'repertorio', 'chat', 'finanzas', 'merchan',
];

/**
 * Orden propio de la barra de tabs horizontal móvil (fila de scroll, nunca se agrupa
 * ni se colapsa, independientemente del plan).
 */
export const TOP_TABS_ORDER_IDS: NavItemId[] = [
  'resumen', 'booking', 'medios', 'calendario', 'bandas', 'giras', 'epk', 'fans', 'reels', 'repertorio', 'chat', 'finanzas', 'merchan',
];

// Un plan con pocos módulos desbloqueados (p.ej. `promo`, 4 módulos) ya tiene un
// menú corto de por sí: agrupar/colapsar no aporta y solo añade fricción.
// Los ítems bloqueados por plan se siguen mostrando (con candado) dentro de cada
// grupo igual que hoy, así que este umbral no depende de cuántos estén accesibles
// dentro de cada grupo, solo de si el total global (allowedModules.length) justifica
// agrupar.
export const MIN_MODULES_FOR_GROUPED_NAV = 6;

export function findNavGroupIdForItem(itemId: string): string | undefined {
  return NAV_GROUPS.find((g) => g.itemIds.includes(itemId as NavItemId))?.id;
}

// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import type { LucideIcon } from 'lucide-react';
import { Table, Building2, Radio, Users, CalendarRange, Truck, BookOpen, QrCode, Video, Disc3, Guitar, Coins, Sparkles, Clock, Music, Disc2, Briefcase, Mic2 } from 'lucide-react';

export type NavItemId =
  | 'resumen' | 'booking' | 'medios' | 'management' | 'bandas' | 'calendario' | 'giras'
  | 'epk' | 'fans' | 'reels' | 'repertorio' | 'ensayos' | 'catalogo' | 'discografia' | 'chat' | 'finanzas' | 'merchan'
  | 'metronome' | 'tuner';

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
  booking: { id: 'booking', icon: Building2, labelKey: 'nav.booking', labelDefault: 'Escenarios' },
  medios: { id: 'medios', icon: Radio, labelKey: 'nav.medios', labelDefault: 'Medios' },
  management: { id: 'management', icon: Briefcase, labelKey: 'nav.management', labelDefault: 'Management' },
  bandas: { id: 'bandas', icon: Users, labelKey: 'nav.bandas', labelDefault: 'Grupos' },
  calendario: { id: 'calendario', icon: CalendarRange, labelKey: 'nav.calendario', labelDefault: 'Calendario' },
  giras: { id: 'giras', icon: Truck, labelKey: 'nav.giras', labelDefault: 'Tour Manager' },
  epk: { id: 'epk', icon: BookOpen, labelKey: 'nav.epk', labelDefault: 'Dossier (EPK)' },
  fans: { id: 'fans', icon: QrCode, labelKey: 'nav.fans', labelDefault: 'Captura QR & Fans' },
  reels: { id: 'reels', icon: Video, labelKey: 'nav.reels', labelDefault: 'Reels Center' },
  repertorio: { id: 'repertorio', icon: Disc3, labelKey: 'nav.repertorio', labelDefault: 'Repertorios' },
  ensayos: { id: 'ensayos', icon: Mic2, labelKey: 'nav.ensayos', labelDefault: 'Ensayos' },
  catalogo: { id: 'catalogo', icon: Music, labelKey: 'nav.discografia', labelDefault: 'Discografía' },
  discografia: { id: 'discografia', icon: Disc2, labelKey: 'nav.discografia', labelDefault: 'Discografía' },
  chat: { id: 'chat', icon: Guitar, labelKey: 'nav.chat', labelDefault: 'Agente Mánager' },
  finanzas: { id: 'finanzas', icon: Coins, labelKey: 'nav.finanzas', labelDefault: 'Finanzas', adminOnly: true },
  merchan: { id: 'merchan', icon: Sparkles, labelKey: 'nav.merchan', labelDefault: 'Merchandising', adminOnly: true },
  metronome: { id: 'metronome', icon: Clock, labelKey: 'nav.metronome', labelDefault: 'Metrónomo' },
  tuner: { id: 'tuner', icon: Guitar, labelKey: 'nav.tuner', labelDefault: 'Afinador' },
};

export interface NavGroupDef {
  id: string;
  titleKey: string;
  titleDefault: string;
  itemIds: NavItemId[];
}

/**
 * Ítems fijos que siempre se muestran arriba, fuera de cualquier grupo colapsable.
 * Resumen y Calendario son las dos vistas que más se abren — quedan siempre a un
 * clic, nunca escondidas dentro de un grupo cerrado.
 */
export const NAV_PINNED_TOP_IDS: NavItemId[] = ['resumen', 'calendario'];

/**
 * Ítems fijos que siempre se muestran abajo, fuera de cualquier grupo colapsable.
 * Agente Mánager es accesible también desde el chat flotante, pero merece su propio
 * botón pinned en el sidebar para acceso rápido.
 */
export const NAV_PINNED_BOTTOM_IDS: NavItemId[] = ['chat'];

/**
 * Agrupación para desktop: incluye los 3 módulos de música
 * (repertorios, ensayos y discografía) cuando el plan desbloquea
 * suficientes módulos (ver MIN_MODULES_FOR_GROUPED_NAV).
 */
export const NAV_GROUPS_DESKTOP: NavGroupDef[] = [
  {
    id: 'contactos',
    titleKey: 'navGroup.contactos',
    titleDefault: 'Contactos',
    itemIds: ['booking', 'medios', 'management', 'bandas'],
  },
  {
    id: 'musica',
    titleKey: 'navGroup.musica',
    titleDefault: 'Música',
    itemIds: ['repertorio', 'ensayos', 'discografia'],
  },
  {
    id: 'promocion',
    titleKey: 'navGroup.promocion',
    titleDefault: 'Promoción',
    itemIds: ['epk', 'fans', 'reels'],
  },
  {
    id: 'negocio',
    titleKey: 'navGroup.negocio',
    titleDefault: 'Negocio',
    itemIds: ['giras', 'finanzas', 'merchan'],
  },
  {
    id: 'herramientas',
    titleKey: 'navGroup.herramientas',
    titleDefault: 'Herramientas',
    itemIds: ['metronome', 'tuner'],
  },
];

/**
 * Agrupación para móvil: mismos 3 módulos de música que desktop (repertorio,
 * ensayos, discografia).
 */
export const NAV_GROUPS_MOBILE: NavGroupDef[] = [
  {
    id: 'contactos',
    titleKey: 'navGroup.contactos',
    titleDefault: 'Contactos',
    itemIds: ['booking', 'medios', 'management', 'bandas'],
  },
  {
    id: 'musica',
    titleKey: 'navGroup.musica',
    titleDefault: 'Música',
    itemIds: ['repertorio', 'ensayos', 'discografia'],
  },
  {
    id: 'promocion',
    titleKey: 'navGroup.promocion',
    titleDefault: 'Promoción',
    itemIds: ['epk', 'fans', 'reels'],
  },
  {
    id: 'negocio',
    titleKey: 'navGroup.negocio',
    titleDefault: 'Negocio',
    itemIds: ['giras', 'finanzas', 'merchan'],
  },
  {
    id: 'herramientas',
    titleKey: 'navGroup.herramientas',
    titleDefault: 'Herramientas',
    itemIds: ['metronome', 'tuner'],
  },
];

// Mantener NAV_GROUPS como alias para compatibilidad (apunta a desktop)
export const NAV_GROUPS = NAV_GROUPS_DESKTOP;

/**
 * Orden plano actual del <aside> de escritorio y del drawer móvil. Se usa tal cual
 * cuando el plan no supera MIN_MODULES_FOR_GROUPED_NAV (hoy, solo `promo`), para no
 * cambiar nada visualmente en ese caso. Incluye 'repertorio' (no los 4 submódulos que
 * solo aparecen en el grupo Música de la vista agrupada). metronome/tuner también
 * solo en vista agrupada.
 */
export const FLAT_NAV_ORDER_IDS: NavItemId[] = [
  'resumen', 'booking', 'medios', 'management', 'bandas', 'calendario', 'giras', 'epk', 'fans', 'reels', 'repertorio', 'ensayos', 'discografia', 'chat', 'finanzas', 'merchan',
];

/**
 * Orden propio de la barra de tabs horizontal móvil (fila de scroll, nunca se agrupa
 * ni se colapsa, independientemente del plan).
 * (Chat está en NAV_PINNED_BOTTOM_IDS en el sidebar, pero la barra de tabs no es un
 * sidebar — mantiene la lista de módulos principales para scroll horizontal.)
 */
export const TOP_TABS_ORDER_IDS: NavItemId[] = [
  'resumen', 'booking', 'medios', 'management', 'calendario', 'bandas', 'giras', 'epk', 'fans', 'reels', 'repertorio', 'ensayos', 'discografia', 'chat', 'finanzas', 'merchan',
];

// Todos los planes (incluyendo `promo` y `promo_plus`) agrupan sus secciones en el menú (Música, Promoción, etc.).
export const MIN_MODULES_FOR_GROUPED_NAV = 4;

export function shouldGroupNavForPlan(planId?: string): boolean {
  if (!planId) return true;
  return true;
}

export function findNavGroupIdForItem(itemId: string): string | undefined {
  return NAV_GROUPS.find((g) => g.itemIds.includes(itemId as NavItemId))?.id;
}

export interface BottomNavSlotDef {
  id: string;
  kind: 'view' | 'group' | 'more';
  /** Solo para kind 'view' o vista inicial por defecto de 'group': navega directo a este NavItemId. */
  itemId?: NavItemId;
  /** Solo para kind 'group': abre un sheet con los itemIds de este NAV_GROUPS_MOBILE. */
  groupId?: string;
  labelKey: string;
  labelDefault: string;
}

/**
 * Slots de la bottom tab bar móvil (sustituye la fila de tabs horizontal + el
 * hamburger). Solo 5 slots fijos, icon-only: Resumen/Calendario/Repertorio/Dossier
 * navegan directo al primer toque. Si ya se está en Música o Promoción, un segundo
 * toque despliega el sheet con los sub-módulos. Más abre el drawer completo con el
 * resto (Contactos, Negocio, Herramientas, Chat, perfil...).
 */
export const NAV_BOTTOM_BAR_SLOTS: BottomNavSlotDef[] = [
  { id: 'resumen', kind: 'view', itemId: 'resumen', labelKey: 'nav.resumen', labelDefault: 'Resumen' },
  { id: 'calendario', kind: 'view', itemId: 'calendario', labelKey: 'nav.calendario', labelDefault: 'Calendario' },
  { id: 'musica', kind: 'group', groupId: 'musica', itemId: 'repertorio', labelKey: 'nav.repertorio', labelDefault: 'Repertorios' },
  { id: 'promocion', kind: 'group', groupId: 'promocion', itemId: 'epk', labelKey: 'nav.epk', labelDefault: 'Dossier' },
  { id: 'more', kind: 'more', labelKey: 'nav.mas', labelDefault: 'Más' },
];

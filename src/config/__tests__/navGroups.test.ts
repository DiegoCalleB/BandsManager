import { describe, it, expect } from 'vitest';
import {
  NAV_ITEMS,
  NAV_GROUPS,
  NAV_PINNED_TOP_IDS,
  NAV_PINNED_BOTTOM_IDS,
  FLAT_NAV_ORDER_IDS,
  TOP_TABS_ORDER_IDS,
  MIN_MODULES_FOR_GROUPED_NAV,
  shouldGroupNavForPlan,
  findNavGroupIdForItem,
  NavItemId,
} from '../navGroups';
import { PLANS } from '../../utils/planPermissions';

describe('navGroups config', () => {
  it('every id referenced by groups/pinned/flat lists exists in NAV_ITEMS', () => {
    const allKnownIds = new Set(Object.keys(NAV_ITEMS));
    const referenced = [
      ...NAV_PINNED_TOP_IDS,
      ...NAV_PINNED_BOTTOM_IDS,
      ...NAV_GROUPS.flatMap((g) => g.itemIds),
      ...FLAT_NAV_ORDER_IDS,
      ...TOP_TABS_ORDER_IDS,
    ];
    for (const id of referenced) {
      expect(allKnownIds.has(id)).toBe(true);
    }
  });

  it('FLAT_NAV_ORDER_IDS and TOP_TABS_ORDER_IDS carry the exact same set of items', () => {
    // Los dos navs "planos" (aside/drawer sin agrupar y la barra de tabs móvil) deben
    // mostrar siempre el mismo conjunto de módulos, aunque el orden visual difiera.
    expect(new Set(FLAT_NAV_ORDER_IDS)).toEqual(new Set(TOP_TABS_ORDER_IDS));
  });

  it('groups + pinned-top + pinned-bottom contain FLAT_NAV_ORDER_IDS plus tools', () => {
    // Cuando hay agrupación (planes >7 módulos), mostramos:
    // - Todos los módulos de FLAT_NAV_ORDER_IDS (que incluye 'repertorio' y 'discografia')
    // - Plus las herramientas (metronome/tuner) que solo aparecen en la vista agrupada
    const grouped: NavItemId[] = [...NAV_PINNED_TOP_IDS, ...NAV_PINNED_BOTTOM_IDS, ...NAV_GROUPS.flatMap((g) => g.itemIds)];
    const toolIds: NavItemId[] = ['metronome', 'tuner'];
    const groupedWithoutExtraItems = grouped.filter(id => !toolIds.includes(id));
    expect(new Set(groupedWithoutExtraItems)).toEqual(new Set(FLAT_NAV_ORDER_IDS));
    expect(grouped.length).toBe(FLAT_NAV_ORDER_IDS.length + toolIds.length);
  });

  it('findNavGroupIdForItem resolves grouped items and returns undefined for pinned/unknown ids', () => {
    expect(findNavGroupIdForItem('repertorio')).toBe('musica');
    expect(findNavGroupIdForItem('discografia')).toBe('musica');
    expect(findNavGroupIdForItem('metronome')).toBe('herramientas');
    expect(findNavGroupIdForItem('tuner')).toBe('herramientas');
    expect(findNavGroupIdForItem('booking')).toBe('contactos');
    expect(findNavGroupIdForItem('epk')).toBe('promocion');
    expect(findNavGroupIdForItem('giras')).toBe('negocio');
    // Resumen, Calendario y Chat están fijos (arriba y abajo), fuera de cualquier grupo colapsable.
    expect(findNavGroupIdForItem('resumen')).toBeUndefined();
    expect(findNavGroupIdForItem('calendario')).toBeUndefined();
    expect(findNavGroupIdForItem('chat')).toBeUndefined();
    expect(findNavGroupIdForItem('no-existe')).toBeUndefined();
  });

  it('pins exactly resumen and calendario at top, chat at bottom outside any group', () => {
    expect(new Set(NAV_PINNED_TOP_IDS)).toEqual(new Set(['resumen', 'calendario']));
    expect(new Set(NAV_PINNED_BOTTOM_IDS)).toEqual(new Set(['chat']));
  });

  it('shouldGroupNavForPlan groups for all plans including promo and promo_plus', () => {
    expect(shouldGroupNavForPlan('promo')).toBe(true);
    expect(shouldGroupNavForPlan('promo_plus')).toBe(true);
    expect(shouldGroupNavForPlan('ensayo')).toBe(true);
    expect(shouldGroupNavForPlan('local')).toBe(true);
    expect(shouldGroupNavForPlan('de_gira')).toBe(true);
    expect(shouldGroupNavForPlan('cabeza_de_cartel')).toBe(true);
    expect(shouldGroupNavForPlan(undefined)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  NAV_ITEMS,
  NAV_GROUPS,
  NAV_GROUPS_MOBILE,
  NAV_GROUPS_DESKTOP,
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

  it('groups + pinned-top + pinned-bottom contain exactly FLAT_NAV_ORDER_IDS', () => {
    const grouped: NavItemId[] = [...NAV_PINNED_TOP_IDS, ...NAV_PINNED_BOTTOM_IDS, ...NAV_GROUPS.flatMap((g) => g.itemIds)];
    expect(new Set(grouped)).toEqual(new Set(FLAT_NAV_ORDER_IDS));
    expect(grouped.length).toBe(FLAT_NAV_ORDER_IDS.length);
  });

  it('metrónomo y afinador no están en el menú: viven como botones del Atril', () => {
    expect(Object.keys(NAV_ITEMS)).not.toContain('metronome');
    expect(Object.keys(NAV_ITEMS)).not.toContain('tuner');
    const atril = readFileSync(new URL('../../components/Atril.tsx', import.meta.url), 'utf8');
    expect(atril).toContain('label="Metrónomo"');
    expect(atril).toContain('label="Afinador"');
  });

  it('findNavGroupIdForItem resolves grouped items and returns undefined for pinned/unknown ids', () => {
    expect(findNavGroupIdForItem('repertorio')).toBe('musica');
    expect(findNavGroupIdForItem('discografia')).toBe('musica');
    expect(NAV_GROUPS.some((g) => g.id === 'herramientas')).toBe(false);
    expect(findNavGroupIdForItem('booking')).toBe('directorio');
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

describe('un solo menú agrupado', () => {
  it('móvil y escritorio comparten exactamente los mismos grupos', () => {
    expect(NAV_GROUPS_MOBILE).toBe(NAV_GROUPS_DESKTOP);
  });
});

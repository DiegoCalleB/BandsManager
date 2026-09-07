import { describe, it, expect } from 'vitest';
import {
  NAV_ITEMS,
  NAV_GROUPS,
  NAV_PINNED_TOP_IDS,
  NAV_PINNED_BOTTOM_IDS,
  FLAT_NAV_ORDER_IDS,
  TOP_TABS_ORDER_IDS,
  MIN_MODULES_FOR_GROUPED_NAV,
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

  it('groups + pinned-top + pinned-bottom contain FLAT_NAV_ORDER_IDS plus music modules and tools', () => {
    // Cuando hay agrupación (planes >6 módulos), mostramos:
    // - Todos los módulos de FLAT_NAV_ORDER_IDS (que incluye 'repertorio' como ítem de menú único)
    // - Plus los 2 módulos derivados de repertorio: catalogo, discografia (solo vista agrupada)
    // - Plus las herramientas (metronome/tuner) que solo aparecen en la vista agrupada
    const grouped: NavItemId[] = [...NAV_PINNED_TOP_IDS, ...NAV_PINNED_BOTTOM_IDS, ...NAV_GROUPS.flatMap((g) => g.itemIds)];
    const onlyGroupedMusicModules: NavItemId[] = ['catalogo', 'discografia'];
    const toolIds: NavItemId[] = ['metronome', 'tuner'];
    const groupedWithoutExtraItems = grouped.filter(id => !onlyGroupedMusicModules.includes(id) && !toolIds.includes(id));
    expect(new Set(groupedWithoutExtraItems)).toEqual(new Set(FLAT_NAV_ORDER_IDS));
    expect(grouped.length).toBe(FLAT_NAV_ORDER_IDS.length + onlyGroupedMusicModules.length + toolIds.length);
  });

  it('findNavGroupIdForItem resolves grouped items and returns undefined for pinned/unknown ids', () => {
    expect(findNavGroupIdForItem('repertorio')).toBe('musica');
    expect(findNavGroupIdForItem('catalogo')).toBe('musica');
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

  it('threshold matches the intended split: only `promo` stays ungrouped', () => {
    // Esta prueba fija en negro sobre blanco la decisión de producto: si algún día se
    // añade o quita un módulo a un plan, este test debe fallar y forzar una revisión
    // consciente de qué planes ven el menú agrupado.
    const groupedPlans = (Object.keys(PLANS) as (keyof typeof PLANS)[]).filter(
      (planId) => PLANS[planId].allowedModules.length > MIN_MODULES_FOR_GROUPED_NAV
    );
    expect(groupedPlans.sort()).toEqual(['cabeza_de_cartel', 'de_gira', 'ensayo', 'local'].sort());
    expect(PLANS.promo.allowedModules.length).toBeLessThanOrEqual(MIN_MODULES_FOR_GROUPED_NAV);
  });
});

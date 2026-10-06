// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import {
  PLANS,
  normalizePlan,
  hasModuleAccess,
  PLAN_LIMITS,
  getPlanDefinition,
  getPlanTierLevel
} from '../planPermissions';

describe('planPermissions - PROMO y PROMO+', () => {
  it('define correctamente el plan promo básico', () => {
    const promo = PLANS.promo;
    expect(promo.id).toBe('promo');
    expect(promo.allowedModules).toEqual(['resumen', 'calendario', 'epk', 'fans', 'repertorio', 'ensayos', 'catalogo', 'discografia']);
    expect(hasModuleAccess('promo', 'resumen')).toBe(true);
    expect(hasModuleAccess('promo', 'calendario')).toBe(true);
    expect(hasModuleAccess('promo', 'epk')).toBe(true);
    expect(hasModuleAccess('promo', 'fans')).toBe(true);
    expect(hasModuleAccess('promo', 'repertorio')).toBe(true);
    expect(hasModuleAccess('promo', 'ensayos')).toBe(true);
    expect(hasModuleAccess('promo', 'discografia')).toBe(true);
    expect(hasModuleAccess('promo', 'catalogo')).toBe(true);
    expect(hasModuleAccess('promo', 'booking')).toBe(false);
  });

  it('define el nuevo plan PROMO+ idéntico a PROMO con repertorio y discografía añadidos', () => {
    const promoPlus = PLANS.promo_plus;
    expect(promoPlus.id).toBe('promo_plus');
    expect(promoPlus.name).toBe('Promo+');

    // Módulos base de PROMO
    expect(hasModuleAccess('promo_plus', 'resumen')).toBe(true);
    expect(hasModuleAccess('promo_plus', 'calendario')).toBe(true);
    expect(hasModuleAccess('promo_plus', 'epk')).toBe(true);
    expect(hasModuleAccess('promo_plus', 'fans')).toBe(true);

    // Módulos añadidos solicitados
    expect(hasModuleAccess('promo_plus', 'repertorio')).toBe(true);
    expect(hasModuleAccess('promo_plus', 'discografia')).toBe(true);
    expect(hasModuleAccess('promo_plus', 'catalogo')).toBe(true);

    // Módulos excluidos (CRM de booking, agentes IA, finanzas, etc.)
    expect(hasModuleAccess('promo_plus', 'booking')).toBe(false);
    expect(hasModuleAccess('promo_plus', 'medios')).toBe(false);
    expect(hasModuleAccess('promo_plus', 'reels')).toBe(false);
    expect(hasModuleAccess('promo_plus', 'finanzas')).toBe(false);
  });

  it('normaliza las variantes de PROMO+', () => {
    expect(normalizePlan('promo_plus')).toBe('promo_plus');
    expect(normalizePlan('promo+')).toBe('promo_plus');
    expect(normalizePlan('promoplus')).toBe('promo_plus');
    expect(normalizePlan('promo plus')).toBe('promo_plus');
    expect(normalizePlan('PROMO+')).toBe('promo_plus');
  });

  it('asigna límites numéricos adecuados para PROMO+', () => {
    const limits = PLAN_LIMITS.promo_plus;
    expect(limits.maxLeads).toBe(0);
    expect(limits.maxPressContacts).toBe(0);
    expect(limits.maxBands).toBe(1);
    expect(limits.maxSongs).toBe(25);
    expect(limits.maxFans).toBe(250);
  });

  it('getPlanDefinition devuelve la definición correcta para promo_plus', () => {
    const def = getPlanDefinition('promo+');
    expect(def.id).toBe('promo_plus');
    expect(def.name).toBe('Promo+');
  });

  it('getPlanTierLevel ubica promo_plus en el nivel 0.5 (entre promo y ensayo)', () => {
    expect(getPlanTierLevel('promo')).toBe(0);
    expect(getPlanTierLevel('promo_plus')).toBe(0.5);
    expect(getPlanTierLevel('ensayo')).toBe(1);
    expect(getPlanTierLevel('local')).toBe(2);
    expect(getPlanTierLevel('de_gira')).toBe(3);
    expect(getPlanTierLevel('cabeza_de_cartel')).toBe(4);
  });
});

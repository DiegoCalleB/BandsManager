// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from 'vitest';
import { getPlanLimits, checkRecordLimit } from '../planLimits';

describe('planLimits', () => {
  it('retorna los límites específicos para el plan promo', () => {
    const limits = getPlanLimits('promo');
    expect(limits.maxLeads).toBe(0);
    expect(limits.maxPressContacts).toBe(0);
    expect(limits.maxBands).toBe(1);
    expect(limits.maxSongs).toBe(25);
    expect(limits.maxFans).toBe(250);
  });

  it('retorna los límites específicos para el plan promo_plus (con repertorio)', () => {
    const limits = getPlanLimits('promo_plus');
    expect(limits.maxLeads).toBe(0);
    expect(limits.maxPressContacts).toBe(0);
    expect(limits.maxBands).toBe(1);
    expect(limits.maxSongs).toBe(25);
    expect(limits.maxFans).toBe(250);
  });

  it('permite canciones en promo y promo_plus hasta el límite de 25', () => {
    expect(checkRecordLimit('promo', 'songs', 0).allowed).toBe(true);
    expect(checkRecordLimit('promo', 'songs', 24).allowed).toBe(true);
    expect(checkRecordLimit('promo', 'songs', 25).allowed).toBe(false);
    expect(checkRecordLimit('promo_plus', 'songs', 0).allowed).toBe(true);
    expect(checkRecordLimit('promo_plus', 'songs', 24).allowed).toBe(true);
    expect(checkRecordLimit('promo_plus', 'songs', 25).allowed).toBe(false);
  });

  it('bloquea creación de leads en promo y promo_plus', () => {
    expect(checkRecordLimit('promo', 'leads', 0).allowed).toBe(false);
    expect(checkRecordLimit('promo_plus', 'leads', 0).allowed).toBe(false);
  });

  it('permite captación de fans hasta 250 en promo y promo_plus', () => {
    expect(checkRecordLimit('promo', 'fans', 249).allowed).toBe(true);
    expect(checkRecordLimit('promo', 'fans', 250).allowed).toBe(false);
    expect(checkRecordLimit('promo_plus', 'fans', 249).allowed).toBe(true);
    expect(checkRecordLimit('promo_plus', 'fans', 250).allowed).toBe(false);
  });
});

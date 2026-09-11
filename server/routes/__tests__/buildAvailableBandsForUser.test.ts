import { describe, it, expect, vi } from 'vitest';
import { normalizePlan } from '../../db/core.js';

// buildAvailableBandsForUser (server/routes/users.ts) construye la lista de bandas que ve el
// selector de bandas del usuario (AuthContext.availableBands) - nunca se había testeado
// directamente a pesar de tener dos fallbacks a BAKANDEYA_BAND_ID (para "cuál es la banda
// principal" y para "banda actual" cuando al usuario le falta band_id) y, hasta este cambio, un
// segundo hack de "si el email contiene lorenzo, fuerza el plan a promo" que corría en CADA
// petición (no solo en el arranque, a diferencia del que ya se quitó de server/db/bands.ts).

vi.mock('../../state.js', () => ({
  loadState: vi.fn(),
  saveState: vi.fn(),
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireLeader: (_req: any, _res: any, next: any) => next(),
  getUserFromRequestLocal: vi.fn(),
  BAKANDEYA_BAND_ID: 'band-bakandeya',
  // Mismo contrato que el real: exige un band_id no vacío (server/state.ts línea 654) para no
  // devolver en silencio el EPK del fundador a un llamador que se olvidó de pasar la banda.
  getEpkConfigForBand: (state: any, bandId: string) => {
    if (!bandId || !String(bandId).trim()) {
      throw new Error('getEpkConfigForBand: se requiere un band_id válido; no hay banda por defecto.');
    }
    const clean = bandId.replace(/^(band|reg)-/, '');
    return state.epkConfigsByBand?.[bandId] || state.epkConfigsByBand?.[clean] || null;
  }
}));

vi.mock('../../db.js', () => ({
  dbGetUsers: vi.fn(),
  dbUpsertUser: vi.fn(),
  dbDeleteUser: vi.fn(),
  dbGetUserBands: vi.fn(),
  dbUpsertUserBand: vi.fn(),
  dbDeleteUserBand: vi.fn(),
  dbDeleteUserFromBand: vi.fn(),
  dbGetRegisteredBands: vi.fn(),
  dbUpsertRegisteredBand: vi.fn(),
  dbDeleteRegisteredBand: vi.fn(),
  dbUpsertEpkConfig: vi.fn(),
  dbGetEpkLogosMap: vi.fn().mockResolvedValue({}),
  normalizePlan,
  dbMigrateAllPlansToNewTiers: vi.fn().mockResolvedValue(undefined),
  dbCleanCorruptedLeadFields: vi.fn().mockResolvedValue(undefined)
}));

import { buildAvailableBandsForUser } from '../users';

function baseState() {
  return {
    userBands: [],
    registeredBands: [
      { band_id: 'band-lostigres', nombre_banda: 'Los Tigres', plan: 'de_gira' }
    ],
    users: [],
    epkConfigsByBand: {}
  };
}

describe('buildAvailableBandsForUser', () => {
  it('marca como banda principal la que coincide con main_band_id/band_id del usuario', async () => {
    const state = baseState();
    const user = { id: 'u1', email: 'lider@lostigres.com', band_id: 'band-lostigres', plan: 'de_gira' };

    const bands = await buildAvailableBandsForUser(state, user);
    const propia = bands.find((b: any) => b.band_id === 'band-lostigres');
    expect(propia?.is_main).toBe(true);
    expect(propia?.plan).toBe('de_gira');
  });

  it('ya NO fuerza el plan a promo solo porque el email contenga "lorenzo" (bug corregido)', async () => {
    const state = baseState();
    const user = { id: 'u2', email: 'lorenzo@agenciamusical.com', band_id: 'band-lostigres', plan: 'de_gira' };

    const bands = await buildAvailableBandsForUser(state, user);
    const propia = bands.find((b: any) => b.band_id === 'band-lostigres');
    expect(propia?.plan).toBe('de_gira');
  });

  it('sí fuerza a promo cuando el plan real del usuario es promo (comportamiento legítimo, no el hack)', async () => {
    const state = baseState();
    const user = { id: 'u3', email: 'festivalero@ejemplo.com', band_id: 'band-lostigres', plan: 'promo' };

    const bands = await buildAvailableBandsForUser(state, user);
    const propia = bands.find((b: any) => b.band_id === 'band-lostigres');
    expect(propia?.plan).toBe('promo');
  });

  it('permite que un usuario tenga planes distintos en cada banda a la que pertenece', async () => {
    const state = {
      userBands: [
        { user_id: 'u5', band_id: 'band-promo', role: 'member' },
        { user_id: 'u5', band_id: 'band-plus', role: 'leader' }
      ],
      registeredBands: [
        { band_id: 'band-promo', nombre_banda: 'Banda Festival', plan: 'promo' },
        { band_id: 'band-plus', nombre_banda: 'Banda Repertoire', plan: 'promo_plus' }
      ],
      users: [],
      epkConfigsByBand: {}
    };
    const user = { id: 'u5', email: 'musico@ejemplo.com', band_id: 'band-promo', plan: 'promo' };

    const bands = await buildAvailableBandsForUser(state, user);
    const bandaPromo = bands.find((b: any) => b.band_id === 'band-promo');
    const bandaPlus = bands.find((b: any) => b.band_id === 'band-plus');

    expect(bandaPromo?.plan).toBe('promo');
    expect(bandaPlus?.plan).toBe('promo_plus');
  });

  it('un usuario sin band_id no se etiqueta con la identidad de Bakandeya', async () => {
    const state = baseState();
    const user = { id: 'u4', email: 'cuenta-rota@ejemplo.com' }; // sin band_id ni main_band_id

    const bands = await buildAvailableBandsForUser(state, user);
    expect(bands.length).toBe(1);
    expect(bands[0].band_id).not.toBe('band-bakandeya');
    expect(bands[0].bandName).not.toMatch(/bakandeya/i);
  });
});

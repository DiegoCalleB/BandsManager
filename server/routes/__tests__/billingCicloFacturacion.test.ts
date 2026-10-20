// El regalo de pegatinas exige facturación ANUAL (`ciclo_facturacion`). Ese dato solo vivía en memoria
// (data.json): tras un reinicio de Railway la banda volvía a cargarse de Supabase sin él y nadie podía
// pedir el pack. Estos tests fijan que billing lo GUARDA en la base de datos.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizePlan } from '../../db/core.js';

let estado: any;
const actualizaciones: any[] = [];
const upsertBanda = vi.fn().mockResolvedValue(undefined);

vi.mock('../../state.js', () => ({
  loadState: () => estado,
  saveState: (s: any) => { estado = s; },
  requireAuth: (_q: any, _s: any, n: any) => n(),
}));
vi.mock('../../db.js', () => ({
  normalizePlan,
  getSupabase: () => ({
    from: (tabla: string) => ({
      update: (payload: any) => {
        if (tabla === 'registered_bands') actualizaciones.push(payload);
        return { eq: async () => ({ error: null }), or: async () => ({ error: null }), ilike: async () => ({ error: null }) };
      },
    }),
  }),
  dbUpsertRegisteredBand: (...a: any[]) => upsertBanda(...a),
  dbIsWebhookEventProcessed: vi.fn().mockResolvedValue(false),
  dbRecordWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

import { applyPlanUpgrade } from '../billing';

describe('applyPlanUpgrade guarda el ciclo de facturación en Supabase', () => {
  beforeEach(() => {
    actualizaciones.length = 0;
    upsertBanda.mockClear();
    estado = { registeredBands: [{ id: 'reg-uno', band_id: 'band-uno', nombre_banda: 'Uno', email: 'a@x.com', plan: 'ensayo' }], users: [] };
  });

  it('en una banda existente, el UPDATE de Supabase lleva el ciclo anual', async () => {
    await applyPlanUpgrade('band-uno', 'de_gira', 'a@x.com', { billingInterval: 'annual' });
    expect(actualizaciones[0]).toMatchObject({ plan: 'de_gira', estado_suscripcion: 'activo', ciclo_facturacion: 'annual' });
  });

  it('un cambio sin intervalo no pisa el ciclo guardado', async () => {
    await applyPlanUpgrade('band-uno', 'de_gira', 'a@x.com', {});
    expect(actualizaciones[0]).not.toHaveProperty('ciclo_facturacion');
  });

  it('en una banda nueva, el upsert recibe el ciclo', async () => {
    estado.registeredBands = [];
    await applyPlanUpgrade('band-nueva', 'cabeza_de_cartel', 'n@x.com', { billingInterval: 'annual' });
    expect(upsertBanda).toHaveBeenCalledWith(expect.objectContaining({ ciclo_facturacion: 'annual' }));
  });
});

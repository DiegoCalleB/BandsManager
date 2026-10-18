import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => resultadoTerminal),
    single: vi.fn(async () => resultadoTerminal)
  };
  return builder;
}

const upsertMock = vi.fn();
const fromMock = vi.fn();
let selectResult: any = { data: null, error: null };

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertConcert } from '../concerts';

describe('dbUpsertConcert: gastos_detalle no se resetea en un guardado parcial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it('preserva gastos_detalle existente cuando el payload no lo trae', async () => {
    selectResult = {
      data: { band_id: 'band-test', gastos_detalle: { transporte: 150, catering: 80 } },
      error: null
    };

    await dbUpsertConcert({ id: 'cnc-1', fecha: '2026-10-01', ciudad: 'Madrid' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.gastos_detalle).toEqual({ transporte: 150, catering: 80 });
  });

  it('sí actualiza gastos_detalle cuando el payload lo trae explícitamente', async () => {
    selectResult = {
      data: { band_id: 'band-test', gastos_detalle: { transporte: 150 } },
      error: null
    };

    await dbUpsertConcert(
      { id: 'cnc-1', fecha: '2026-10-01', gastos_detalle: { transporte: 200 } },
      'band-test'
    );

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.gastos_detalle).toEqual({ transporte: 200 });
  });

  it('gana el camelCase del frontend sobre el snake_case viejo de la fila (Finanzas manda gastosDetalle)', async () => {
    selectResult = {
      data: { band_id: 'band-test', gastos_detalle: { transporte: 150 }, setlist_id: 'set-viejo' },
      error: null
    };

    await dbUpsertConcert(
      { id: 'cnc-1', gastosDetalle: { transporte: 300 }, setlistId: 'set-nuevo' },
      'band-test'
    );

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.gastos_detalle).toEqual({ transporte: 300 });
    expect(payload.setlist_id).toBe('set-nuevo');
  });

  it('preserva el resto de campos de la fila en un guardado parcial', async () => {
    selectResult = {
      data: { band_id: 'band-test', ciudad: 'Sevilla', sala: 'Sala X', cache: 900 },
      error: null
    };

    await dbUpsertConcert({ id: 'cnc-1', notas: 'solo cambio esto' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload).toMatchObject({ ciudad: 'Sevilla', sala: 'Sala X', cache: 900, notas: 'solo cambio esto' });
  });
});

describe('dbUpsertConcert: el cartel solo lo escribe su ruta validada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResult = { data: { band_id: 'band-test', cartel_url: 'https://x.supabase.co/ok.png' }, error: null };
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  // `cartel_url` sale en la página pública del bolo y en su vista previa de WhatsApp: si la edición
  // normal del bolo lo aceptara del cliente, se podría colgar cualquier imagen saltándose
  // PUT /api/cartel/:id/imagen (que exige un PNG de la carpeta de la banda).
  it('ignora cartel_url y cartel_config que vengan del cliente', async () => {
    await dbUpsertConcert(
      { id: 'cnc-1', fecha: '2026-10-01', ciudad: 'Madrid', cartel_url: 'https://evil.com/x.png', cartelUrl: 'https://evil.com/y.png', cartel_config: { foto: 'https://evil.com' } },
      'band-test'
    );
    const payload = upsertMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty('cartel_url');
    expect(payload).not.toHaveProperty('cartel_config');
  });
});

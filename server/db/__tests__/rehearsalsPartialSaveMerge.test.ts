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

import { dbUpsertRehearsal } from '../rehearsals';

describe('dbUpsertRehearsal: no resetea agenda/objetivos/acta/grabaciones/cronómetro en un guardado parcial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it('preserva agenda/objetivos/acta/grabaciones/cronómetro existentes cuando el payload no los trae', async () => {
    selectResult = {
      data: {
        id: 'reh-1',
        band_id: 'test',
        agenda: [{ id: 'a1', titulo: 'Repasar Kelefaba' }],
        objetivos: ['Cerrar arreglo del bis'],
        grabaciones: [{ url: 'https://x/grabacion.mp3' }],
        cronometro_estado: { transcurridoSeg: 1200 },
        acta: { resumen: 'Buen ensayo' }
      },
      error: null
    };

    await dbUpsertRehearsal({ id: 'reh-1', fecha: '2026-10-01' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.agenda).toEqual(selectResult.data.agenda);
    expect(payload.objetivos).toEqual(selectResult.data.objetivos);
    expect(payload.grabaciones).toEqual(selectResult.data.grabaciones);
    expect(payload.cronometro_estado).toEqual(selectResult.data.cronometro_estado);
    expect(payload.acta).toEqual(selectResult.data.acta);
  });

  it('sí actualiza esos campos cuando el payload los trae explícitamente', async () => {
    selectResult = {
      data: { id: 'reh-1', band_id: 'test', agenda: [{ id: 'a1', titulo: 'Viejo' }] },
      error: null
    };

    await dbUpsertRehearsal(
      { id: 'reh-1', fecha: '2026-10-01', agenda: [{ id: 'a2', titulo: 'Nuevo' }] },
      'band-test'
    );

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.agenda).toEqual([{ id: 'a2', titulo: 'Nuevo' }]);
  });
});

describe('dbUpsertRehearsal: vaciar un campo opcional SÍ se guarda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it("con '' (lo que manda ahora la UI al vaciar el campo) se borra el valor anterior", async () => {
    selectResult = {
      data: { id: 'reh-1', band_id: 'test', asunto: 'Reunión', enlace_reunion: 'https://meet/x', setlist_id: 'set-1' },
      error: null
    };
    await dbUpsertRehearsal({ id: 'reh-1', asunto: '', enlace_reunion: '', setlistId: '' }, 'band-test');
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.asunto).toBe('');
    expect(payload.enlace_reunion).toBe('');
    expect(payload.setlist_id).toBeNull();
  });

  it('con undefined (campo no enviado) se conserva el valor anterior', async () => {
    selectResult = { data: { id: 'reh-1', band_id: 'test', asunto: 'Reunión', setlist_id: 'set-1' }, error: null };
    await dbUpsertRehearsal({ id: 'reh-1', asunto: undefined, setlistId: undefined }, 'band-test');
    const payload = upsertMock.mock.calls[0][0];
    expect(payload.asunto).toBe('Reunión');
    expect(payload.setlist_id).toBe('set-1');
  });
});

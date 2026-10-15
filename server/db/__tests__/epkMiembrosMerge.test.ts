import { describe, it, expect, vi, beforeEach } from 'vitest';

function crearQueryBuilderMock(resultadoTerminal: any = { data: null, error: null }) {
  const builder: any = {
    select: vi.fn(() => builder),
    in: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    limit: vi.fn(() => builder),
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

import { dbUpsertEpkConfig } from '../epk';

describe('dbUpsertEpkConfig: merge de miembros por id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  // Bug real: guardar el EPK desde un formulario que solo gestiona nombre/rol/instagram (sin
  // foto/bio) borraba esos campos en TODOS los miembros existentes, porque el array se
  // reemplazaba entero en vez de mezclarse por id. Pasó de verdad con los 4 integrantes de
  // Banda Ejemplo.
  it('preserva foto/bio de un miembro existente cuando el payload entrante no los trae', async () => {
    selectResult = {
      data: {
        band_id: 'band-test',
        miembros: [
          { id: 'm-1', nombre: 'Ana', rol: 'Voz', bio: 'Bio original de Ana', foto: 'https://x/ana.jpg' }
        ]
      },
      error: null
    };

    await dbUpsertEpkConfig('band-test', {
      miembros: [
        { id: 'm-1', nombre: 'Ana', rol: 'Voz' } // sin bio ni foto
      ]
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        miembros: [
          expect.objectContaining({
            id: 'm-1',
            nombre: 'Ana',
            bio: 'Bio original de Ana',
            foto: 'https://x/ana.jpg'
          })
        ]
      })
    );
  });

  it('actualiza un campo cuando el payload entrante lo trae explícitamente distinto', async () => {
    selectResult = {
      data: {
        band_id: 'band-test',
        miembros: [{ id: 'm-1', nombre: 'Ana', bio: 'Bio vieja' }]
      },
      error: null
    };

    await dbUpsertEpkConfig('band-test', {
      miembros: [{ id: 'm-1', nombre: 'Ana', bio: 'Bio nueva' }]
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        miembros: [expect.objectContaining({ id: 'm-1', bio: 'Bio nueva' })]
      })
    );
  });

  it('deja fuera a un miembro que ya no viene en el payload (borrado real, no fuga)', async () => {
    selectResult = {
      data: {
        band_id: 'band-test',
        miembros: [
          { id: 'm-1', nombre: 'Ana', bio: 'Bio de Ana' },
          { id: 'm-2', nombre: 'Beto', bio: 'Bio de Beto' }
        ]
      },
      error: null
    };

    await dbUpsertEpkConfig('band-test', {
      miembros: [{ id: 'm-1', nombre: 'Ana', bio: 'Bio de Ana' }]
    });

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.miembros).toHaveLength(1);
    expect(payload.miembros[0].id).toBe('m-1');
  });

  it('sin miembros en el body, conserva la lista existente tal cual', async () => {
    selectResult = {
      data: {
        band_id: 'band-test',
        miembros: [{ id: 'm-1', nombre: 'Ana', bio: 'Bio de Ana' }]
      },
      error: null
    };

    await dbUpsertEpkConfig('band-test', { biografia: 'Solo actualizo la bio general' });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        miembros: [expect.objectContaining({ id: 'm-1', bio: 'Bio de Ana' })]
      })
    );
  });
});

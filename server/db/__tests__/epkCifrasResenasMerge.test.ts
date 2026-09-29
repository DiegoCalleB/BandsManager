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

describe('dbUpsertEpkConfig: cifras_clave/resenas_prensa se mezclan, no se reemplazan enteros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  // El wizard de onboarding SÍ manda cifrasClave/resenasPrensa (sin hacer spread de lo
  // existente, a diferencia de datosContratacion/enlacesRedes), así que un objeto entrante
  // incompleto no debe borrar sub-claves que el editor completo del EPK sí conocía.
  it('conserva sub-claves existentes que el payload entrante no trae', async () => {
    selectResult = {
      data: {
        band_id: 'band-test',
        cifras_clave: { seguidoresInstagram: 5000, oyentesMensuales: 12000 },
        resenas_prensa: { medio1: { titulo: 'Gran directo', url: 'https://x' } }
      },
      error: null
    };

    await dbUpsertEpkConfig('band-test', {
      cifras_clave: { seguidoresInstagram: 5200 } // solo trae una sub-clave
    });

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.cifras_clave).toEqual({ seguidoresInstagram: 5200, oyentesMensuales: 12000 });
    expect(payload.resenas_prensa).toEqual({ medio1: { titulo: 'Gran directo', url: 'https://x' } });
  });
});

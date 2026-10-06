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

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));

vi.mock('../bands.js', () => ({
  ensureRegisteredBandExists: vi.fn().mockResolvedValue(undefined)
}));

import { dbUpsertFan } from '../fans';

describe('dbUpsertFan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      // La única fila que dbUpsertFan pide con maybeSingle() es la comprobación de id
      // duplicado entre bandas; sin ninguna coincidencia, el upsert final se hace tal cual.
      const qb = crearQueryBuilderMock({ data: null, error: null });
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
    upsertMock.mockClear();
  });

  // Esta función también se alcanza desde el alta pública sin autenticar (/api/public/fans),
  // donde la propia ruta ya resuelve 'targetBandId' desde la URL antes de llamar aquí. Si en
  // una ruta CON sesión priorizara 'fan.band_id' del cuerpo, un usuario autenticado podría
  // registrar un fan (datos RGPD: nombre, email) en la banda de otro con solo mandar
  // {"band_id": "banda-ajena"}.
  it('usa SIEMPRE la banda de la sesión, nunca el band_id que venga en el cuerpo', async () => {
    await dbUpsertFan(
      { nombre: 'Ana', email: 'ana@example.com', band_id: 'banda-ajena' },
      'la-banda-real'
    );

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });

  it('funciona igual cuando el cuerpo no trae band_id en absoluto', async () => {
    await dbUpsertFan({ nombre: 'Ana', email: 'ana@example.com' }, 'la-banda-real');

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ band_id: 'la-banda-real' })
    );
  });
});

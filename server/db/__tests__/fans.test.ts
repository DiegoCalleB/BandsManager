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

describe('dbContarFans', () => {
  it('cuenta solo los fans de la banda pedida y devuelve el número', async () => {
    const eqMock = vi.fn().mockResolvedValue({ count: 8, error: null });
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockImplementation(() => ({ select: selectMock }));
    const { dbContarFans } = await import('../fans');

    expect(await dbContarFans('band-la-banda')).toBe(8);
    expect(selectMock).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(eqMock).toHaveBeenCalledWith('band_id', 'la-banda');
  });
});

describe('nombreDePilaPublico', () => {
  it('se queda con la primera palabra y quita todo lo que no sean letras, guion o apóstrofo', async () => {
    const { nombreDePilaPublico } = await import('../fans');
    expect(nombreDePilaPublico('  Brais Moure ')).toBe('Brais');
    expect(nombreDePilaPublico('José-María <b>x</b>')).toBe('José-María');
    expect(nombreDePilaPublico("D'Arcy")).toBe("D'Arcy");
    expect(nombreDePilaPublico('12345 ***')).toBe('');
    expect(nombreDePilaPublico(undefined)).toBe('');
    expect(nombreDePilaPublico('A'.repeat(60))).toHaveLength(24);
  });
});

describe('dbUltimoFanReciente', () => {
  const montar = (fila: unknown) => {
    const limitMock = vi.fn().mockResolvedValue({ data: fila ? [fila] : [], error: null });
    const orderMock = vi.fn(() => ({ limit: limitMock }));
    const eqMock = vi.fn(() => ({ order: orderMock }));
    fromMock.mockImplementation(() => ({ select: vi.fn(() => ({ eq: eqMock })) }));
    return eqMock;
  };

  it('devuelve el nombre de pila si el fan es de hace menos de la ventana, y la banda pedida', async () => {
    const eqMock = montar({ nombre: 'Brais Moure', created_at: new Date(Date.now() - 20_000).toISOString() });
    const { dbUltimoFanReciente } = await import('../fans');
    const r = await dbUltimoFanReciente('band-la-banda', 180);
    expect(r?.nombre).toBe('Brais');
    expect(eqMock).toHaveBeenCalledWith('band_id', 'la-banda');
  });

  it('no devuelve nada si el último fan es más antiguo que la ventana', async () => {
    montar({ nombre: 'Ana', created_at: new Date(Date.now() - 600_000).toISOString() });
    const { dbUltimoFanReciente } = await import('../fans');
    expect(await dbUltimoFanReciente('band-la-banda', 180)).toBeNull();
  });

  it('no devuelve nada si no hay fans', async () => {
    montar(null);
    const { dbUltimoFanReciente } = await import('../fans');
    expect(await dbUltimoFanReciente('band-la-banda', 180)).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const resultado: { count: number | null; error: { message: string } | null } = { count: 0, error: null };
const select = vi.fn();
const eq = vi.fn();
const fromMock = vi.fn();

vi.mock('../core.js', () => ({
  getSupabase: () => ({ from: fromMock }),
  cleanBandId: (bandId?: string) => (bandId || '').replace(/^(band|reg)-/, '')
}));
vi.mock('../bands.js', () => ({ ensureRegisteredBandExists: vi.fn() }));

import { dbContarFans } from '../fans';

beforeEach(() => {
  vi.clearAllMocks();
  resultado.count = 0;
  resultado.error = null;
  const builder: any = {
    select: (...a: unknown[]) => (select(...a), builder),
    eq: (...a: unknown[]) => (eq(...a), builder),
    then: (ok: (r: typeof resultado) => unknown) => Promise.resolve(resultado).then(ok),
  };
  fromMock.mockReturnValue(builder);
});

describe('dbContarFans', () => {
  it('cuenta solo los fans de la banda pedida, sin traer las filas', async () => {
    resultado.count = 42;
    await expect(dbContarFans('band-a')).resolves.toBe(42);
    expect(fromMock).toHaveBeenCalledWith('fans');
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(eq).toHaveBeenCalledWith('band_id', 'a');
  });

  it('devuelve 0 si Supabase no da recuento', async () => {
    resultado.count = null;
    await expect(dbContarFans('band-a')).resolves.toBe(0);
  });

  it('propaga el error de Supabase', async () => {
    resultado.error = { message: 'boom' };
    await expect(dbContarFans('band-a')).rejects.toThrow(/Supabase Error \(fans\): boom/);
  });
});

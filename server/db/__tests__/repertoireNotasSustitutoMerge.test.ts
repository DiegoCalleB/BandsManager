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

import { dbUpsertSong } from '../repertoire';

describe('dbUpsertSong: notas_miembros/notas_por_miembro/guia_sustituto no se resetean en un guardado parcial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation(() => {
      const qb = crearQueryBuilderMock(selectResult);
      qb.upsert = upsertMock.mockReturnValue(qb);
      return qb;
    });
  });

  it('preserva notas_miembros/notas_por_miembro/guia_sustituto existentes cuando el payload no los trae', async () => {
    selectResult = {
      data: {
        id: 'song-1',
        band_id: 'test',
        notas_miembros: { 'm-1': 'Ojo con el cambio de compás' },
        notas_por_miembro: [{ miembroId: 'm-1', nota: 'Entra tarde en el estribillo' }],
        guia_sustituto: { acordes: 'Em-C-G-D', notas: 'Tempo 100bpm' }
      },
      error: null
    };

    await dbUpsertSong({ id: 'song-1', titulo: 'Kelefaba' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.notas_miembros).toEqual({ 'm-1': 'Ojo con el cambio de compás' });
    expect(payload.notas_por_miembro).toEqual([{ miembroId: 'm-1', nota: 'Entra tarde en el estribillo' }]);
    expect(payload.guia_sustituto).toEqual({ acordes: 'Em-C-G-D', notas: 'Tempo 100bpm' });
  });

  it('sí actualiza esos campos cuando el payload los trae explícitamente', async () => {
    selectResult = {
      data: { id: 'song-1', band_id: 'test', notas_miembros: { 'm-1': 'Vieja' } },
      error: null
    };

    await dbUpsertSong(
      { id: 'song-1', titulo: 'Kelefaba', notasMiembros: { 'm-1': 'Nueva' } },
      'band-test'
    );

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.notas_miembros).toEqual({ 'm-1': 'Nueva' });
  });
});

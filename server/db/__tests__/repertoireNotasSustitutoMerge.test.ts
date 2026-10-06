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
      // dbUpsertSong escribe con delete + insert (no upsert) desde 78cfa53 en main: el payload
      // que se comprueba es el del insert.
      qb.delete = vi.fn(() => qb);
      qb.insert = upsertMock.mockReturnValue(qb);
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

  it('no pierde analisis_acordes en un guardado que no lo trae (el guardado es DELETE + INSERT)', async () => {
    selectResult = {
      data: { id: 'song-1', band_id: 'test', analisis_acordes: { version: 1, segmentos: [{ t0: 0, t1: 2, acorde: 'Am', confianza: 0.9 }] } },
      error: null
    };

    await dbUpsertSong({ id: 'song-1', titulo: 'Kelefaba' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect(payload.analisis_acordes).toEqual({ version: 1, segmentos: [{ t0: 0, t1: 2, acorde: 'Am', confianza: 0.9 }] });
  });

  it('no envía analisis_acordes si la canción no lo tiene (columna sin migrar no rompe el guardado)', async () => {
    selectResult = { data: { id: 'song-1', band_id: 'test' }, error: null };

    await dbUpsertSong({ id: 'song-1', titulo: 'Kelefaba' }, 'band-test');

    const payload = upsertMock.mock.calls[0][0];
    expect('analisis_acordes' in payload).toBe(false);
  });

  it('respeta el análisis que trae el payload (p. ej. reanálisis o corrección manual)', async () => {
    selectResult = { data: { id: 'song-1', band_id: 'test', analisis_acordes: { version: 1, segmentos: [] } }, error: null };

    await dbUpsertSong({ id: 'song-1', titulo: 'Kelefaba', analisisAcordes: { version: 2, segmentos: [] } }, 'band-test');

    expect(upsertMock.mock.calls[0][0].analisis_acordes).toEqual({ version: 2, segmentos: [] });
  });
});

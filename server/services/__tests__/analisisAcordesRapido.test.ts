import { describe, it, expect, vi, beforeEach } from 'vitest';

const estado = vi.hoisted(() => ({ canciones: [] as Array<Record<string, unknown>> }));
const guardar = vi.hoisted(() => vi.fn());
const analizar = vi.hoisted(() => vi.fn());

vi.mock('../../db/core.js', () => ({
  getSupabase: () => ({
    from: () => ({ select: () => ({ eq: () => ({ in: () => ({ maybeSingle: async () => ({ data: estado.canciones.shift() ?? null, error: null }) }) }) }) }),
  }),
}));
vi.mock('../../db/repertoire.js', () => ({ mapSongRecord: (s: unknown) => s, dbGuardarAnalisisAcordes: guardar }));
vi.mock('../acordesCancion.js', () => ({ analizarAcordesDeCancion: analizar }));

import { afinarCompasesEnSegundoPlano } from '../analisisAcordesRapido';

const cancion = (analisis: Record<string, unknown>) => ({ id: 's1', titulo: 'Tema', analisisAcordes: { segmentos: [{ t0: 0, t1: 1, acorde: 'Em' }], ...analisis } });
const conRed = { ok: true, analisis: { analizadoEn: 'nuevo', pulso: { fuente: 'red' }, segmentos: [] } };

beforeEach(() => { guardar.mockReset(); analizar.mockReset(); estado.canciones = []; });

describe('afinarCompasesEnSegundoPlano', () => {
  it('guarda el análisis con la red si el rápido sigue intacto', async () => {
    estado.canciones = [cancion({ analizadoEn: 'rapido' }), cancion({ analizadoEn: 'rapido' })];
    analizar.mockResolvedValue(conRed);
    afinarCompasesEnSegundoPlano('s1', 'b1', 'rapido');
    await vi.waitFor(() => expect(guardar).toHaveBeenCalledTimes(1));
    expect(guardar.mock.calls[0][2]).toBe(conRed.analisis);
  });

  it('NO pisa una corrección hecha a mano mientras la red trabajaba', async () => {
    estado.canciones = [cancion({ analizadoEn: 'rapido' }), cancion({ analizadoEn: 'rapido', editadoEn: 'ahora' })];
    analizar.mockResolvedValue(conRed);
    afinarCompasesEnSegundoPlano('s2', 'b1', 'rapido');
    await vi.waitFor(() => expect(analizar).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(guardar).not.toHaveBeenCalled();
  });

  it('NO guarda si ya hay otro análisis más reciente', async () => {
    estado.canciones = [cancion({ analizadoEn: 'otro' })];
    afinarCompasesEnSegundoPlano('s3', 'b1', 'rapido');
    await new Promise((r) => setTimeout(r, 20));
    expect(analizar).not.toHaveBeenCalled();
    expect(guardar).not.toHaveBeenCalled();
  });

  it('si la red no está disponible (pulso clásico) no cambia nada', async () => {
    estado.canciones = [cancion({ analizadoEn: 'rapido' })];
    analizar.mockResolvedValue({ ok: true, analisis: { analizadoEn: 'n', pulso: { fuente: 'clasico' }, segmentos: [] } });
    afinarCompasesEnSegundoPlano('s4', 'b1', 'rapido');
    await vi.waitFor(() => expect(analizar).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(guardar).not.toHaveBeenCalled();
  });
});

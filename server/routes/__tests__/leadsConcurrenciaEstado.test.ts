/**
 * PUT /leads/:id respeta `expectedStatus`: si el estado cambió entre que el usuario decidió y
 * que guarda, responde 409 en vez de pisarlo. Antes el servidor ignoraba el campo.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbGetLeadById = vi.fn();
const dbUpsertLead = vi.fn(async (l: any) => l);
vi.mock('../../db.js', async (orig) => ({
  ...(await orig<any>()),
  dbGetLeadById: (...a: any[]) => dbGetLeadById(...a),
  dbUpsertLead: (...a: any[]) => dbUpsertLead(...a),
}));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), requireAuth: (_q: any, _s: any, n: any) => n() }));
vi.mock('../../utils/bandAccess.js', async (orig) => ({ ...(await orig<any>()), getTargetBandId: () => 'band-a' }));
vi.mock('../../auto_enrichment.js', async (orig) => ({ ...(await orig<any>()), autoEnrichLead: async () => {} }));
vi.mock('../../db/pitchLearning.js', () => ({ dbRecordPitchHumanEdit: async () => {} }));

import router from '../leads/crud.js';

function manejador() {
  const capa: any = (router as any).stack.find((s: any) => s.route && s.route.path === '/leads/:id' && s.route.methods.put);
  expect(capa).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const put = async (body: any) => {
  const res = resFalso();
  await manejador()({ params: { id: 'l1' }, body, headers: {}, query: {} }, res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  dbGetLeadById.mockResolvedValue({ id: 'l1', band_id: 'band-a', nombre_sala: 'Sala', estado: 'respondido', email_contacto: 'a@b.com' });
});

describe('PUT /leads/:id con expectedStatus', () => {
  it('si el estado cambió mientras tanto responde 409 y NO guarda', async () => {
    const res = await put({ estado: 'aprobado', expectedStatus: 'pendiente_aprobacion' });
    expect(res.code).toBe(409);
    expect(res.body.estado_actual).toBe('respondido');
    expect(dbUpsertLead).not.toHaveBeenCalled();
  });

  it('si coincide, guarda, y expectedStatus no se mezcla en el lead', async () => {
    const res = await put({ estado: 'negociando', expectedStatus: 'respondido' });
    expect(res.code).toBeUndefined();
    const guardado = dbUpsertLead.mock.calls[0][0];
    expect(guardado.estado).toBe('negociando');
    expect('expectedStatus' in guardado).toBe(false);
  });

  it('sin expectedStatus se comporta como siempre', async () => {
    const res = await put({ telefono: '600' });
    expect(res.code).toBeUndefined();
    expect(dbUpsertLead).toHaveBeenCalledTimes(1);
  });
});

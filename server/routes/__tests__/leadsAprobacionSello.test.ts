/**
 * PUT /leads/:id deja constancia de la aprobación humana (quién, cuándo, huella del texto) y
 * devuelve a revisión un lead aprobado cuyo texto se edita sin aprobarlo de nuevo. El cliente no
 * puede fijar el sello por el cuerpo de la petición.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbGetLeadById = vi.fn();
const dbUpsertLead = vi.fn(async (l: any) => l);
const actualizaciones: any[] = [];
vi.mock('../../db/core.js', async (orig) => ({
  ...(await orig<any>()),
  getSupabase: () => ({
    from: () => ({
      update: (fila: any) => {
        actualizaciones.push(fila);
        const cadena: any = { eq: () => cadena, then: (r: any) => Promise.resolve({ error: null }).then(r) };
        return cadena;
      },
    }),
  }),
}));
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
import { hashTextoAprobado } from '../../utils/aprobacionLead.js';

function manejador() {
  const capa: any = (router as any).stack.find((s: any) => s.route && s.route.path === '/leads/:id' && s.route.methods.put);
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const put = async (body: any, role = 'leader') => {
  const res = resFalso();
  await manejador()({ params: { id: 'l1' }, body, headers: {}, query: {}, user: { id: 'u1', email: 'diego@banda.es', username: 'diego', role } }, res);
  return res;
};

const texto = 'hola, os proponemos un concierto';
beforeEach(() => {
  vi.clearAllMocks();
  actualizaciones.length = 0;
  dbGetLeadById.mockResolvedValue({ id: 'l1', band_id: 'band-a', nombre_sala: 'Sala', estado: 'pendiente_aprobacion', pitch_generado: texto, email_contacto: 'a@b.com' });
});

describe('PUT /leads/:id: constancia de aprobación', () => {
  it('al aprobar sella quién, cuándo y la huella del texto', async () => {
    dbUpsertLead.mockImplementation(async (l: any) => l);
    await put({ estado: 'aprobado_propuesta' });
    expect(actualizaciones).toHaveLength(1);
    expect(actualizaciones[0]).toMatchObject({ aprobado_por: 'diego@banda.es', pitch_aprobado_hash: hashTextoAprobado(texto) });
    expect(actualizaciones[0].aprobado_at).toBeTruthy();
  });

  it('el cliente no puede fijar el sello: esos campos no llegan a guardarse', async () => {
    await put({ estado: 'aprobado_propuesta', aprobado_por: 'otro', pitch_aprobado_hash: 'falsa', aprobado_at: '2000-01-01' });
    const guardado = dbUpsertLead.mock.calls[0][0];
    for (const campo of ['aprobado_por', 'aprobado_at', 'pitch_aprobado_hash']) expect(campo in guardado).toBe(false);
    expect(actualizaciones[0].pitch_aprobado_hash).toBe(hashTextoAprobado(texto));
  });

  it('editar el texto de un lead aprobado, sin aprobarlo de nuevo, lo devuelve a revisión y quita el sello', async () => {
    dbGetLeadById.mockResolvedValue({ id: 'l1', band_id: 'band-a', nombre_sala: 'Sala', estado: 'aprobado_propuesta', pitch_generado: texto, email_contacto: 'a@b.com' });
    const res = await put({ pitch_generado: texto + ' por 3000 euros' });
    expect(actualizaciones[0]).toMatchObject({ estado: 'pendiente_aprobacion', aprobado_por: null, pitch_aprobado_hash: null });
    expect(res.body.lead.estado).toBe('pendiente_aprobacion');
  });

  it('un cambio que no toca la aprobación no escribe ningún sello', async () => {
    await put({ telefono: '600' });
    expect(actualizaciones).toHaveLength(0);
  });

  it.each(['aprobado', 'aprobado_propuesta', 'aprobado_respuesta'])('un miembro no puede aprobar (%s): 403 y no se guarda nada', async (estado) => {
    const res = await put({ estado }, 'member');
    expect(res.code).toBe(403);
    expect(dbUpsertLead).not.toHaveBeenCalled();
    expect(actualizaciones).toHaveLength(0);
  });

  it('un miembro sí puede editar la sala sin aprobarla', async () => {
    const res = await put({ notas: 'llamar el lunes' }, 'member');
    expect(res.code).toBeUndefined();
    expect(dbUpsertLead).toHaveBeenCalled();
  });

  it('el admin también puede aprobar', async () => {
    const res = await put({ estado: 'aprobado_propuesta' }, 'admin');
    expect(res.code).toBeUndefined();
  });

  it('un miembro tampoco puede crear una sala ya aprobada (POST /leads)', async () => {
    const capa: any = (router as any).stack.find((x: any) => x.route && x.route.path === '/leads' && x.route.methods.post);
    const pila = capa.route.stack;
    const res = resFalso();
    await pila[pila.length - 1].handle(
      { body: { nombre_sala: 'Sala X', estado: 'aprobado_propuesta' }, headers: {}, query: {}, user: { id: 'u1', role: 'member' } },
      res,
    );
    expect(res.code).toBe(403);
    expect(dbUpsertLead).not.toHaveBeenCalled();
  });
});

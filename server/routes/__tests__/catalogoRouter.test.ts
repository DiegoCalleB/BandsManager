import { describe, it, expect, vi, beforeEach } from 'vitest';

const SALA = {
  id: 'sala-1',
  clave: 'nc:alfa|madrid',
  place_id: null,
  nombre: 'Alfa',
  ciudad: 'Madrid',
  region: 'Comunidad de Madrid',
  direccion: null,
  tipo: 'sala',
  aforo: 200,
  genero: 'Rock',
  website: null,
  instagram: null,
  email_contacto: 'booking@ejemplo.es',
  telefono: '910000000',
  nivel: 'probable',
  puntuacion: 50,
  verificada_en: null,
  bandas_con_respuesta: 1,
  bandas_con_entrega: 1,
  rebotes: 0,
  no_contactar: false,
};

const m = vi.hoisted(() => ({
  agenda: [] as Array<Record<string, unknown>>,
  leadsDeLaBanda: [] as Array<Record<string, unknown>>,
  guardados: [] as Array<{ lead: Record<string, unknown>; bandId: string }>,
  enlaces: [] as Array<{ leadId: string; salaId: string }>,
}));

vi.mock('../../state.js', () => ({ requireAuth: (_q: unknown, _s: unknown, n: () => void) => n() }));
vi.mock('../../middleware/rateLimiter.js', () => ({ apiAutenticadaRateLimiter: (_q: unknown, _s: unknown, n: () => void) => n() }));
vi.mock('../../utils/bandAccess.js', () => ({ getTargetBandId: () => 'banda-sesion' }));
vi.mock('../../db.js', () => ({
  dbGetLeads: async () => m.leadsDeLaBanda,
  dbUpsertLead: async (lead: Record<string, unknown>, bandId: string) => {
    m.guardados.push({ lead, bandId });
    return { ...lead, id: lead.id };
  },
}));
vi.mock('../../db/salasCatalogo.js', () => ({
  leadsDeAgendaDeBanda: async () => m.agenda,
  puertoCatalogoSupabase: {
    leerSalas: async () => [SALA],
    enlazarLeads: async (e: Array<{ leadId: string; salaId: string }>) => void m.enlaces.push(...e),
  },
}));

import router from '../catalogo.js';

function manejador(ruta: string, metodo: 'get' | 'post') {
  const capa = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: (...a: unknown[]) => Promise<void> }> } }> }).stack.find(
    (s) => s.route && s.route.path === ruta && s.route.methods[metodo],
  );
  expect(capa).toBeDefined();
  const pila = capa!.route!.stack;
  return pila[pila.length - 1].handle;
}

function resFalso() {
  const r = { code: 200, body: undefined as unknown, status(c: number) { r.code = c; return r; }, json(b: unknown) { r.body = b; return r; } };
  return r;
}

const peticion = (extra: Record<string, unknown> = {}) => ({ user: { plan: 'ensayo', band_id: 'banda-sesion' }, query: {}, params: {}, body: {}, headers: {}, ...extra });

beforeEach(() => {
  m.agenda = [];
  m.leadsDeLaBanda = [];
  m.guardados = [];
  m.enlaces = [];
});

describe('GET /catalogo/salas', () => {
  it('devuelve la ficha pública: ni el email ni el teléfono salen en la consulta', async () => {
    const res = resFalso();
    await manejador('/catalogo/salas', 'get')(peticion({ query: { texto: 'alfa' } }), res);
    const volcado = JSON.stringify(res.body);
    expect(res.code).toBe(200);
    expect(volcado).toContain('Alfa');
    expect(volcado).not.toContain('booking@ejemplo.es');
    expect(volcado).not.toContain('910000000');
  });

  it('marca las salas que la banda ya tiene', async () => {
    m.agenda = [{ id: 'l1', sala_id: 'sala-1', nombre_sala: 'Alfa', ciudad: 'Madrid', place_id: null }];
    const res = resFalso();
    await manejador('/catalogo/salas', 'get')(peticion(), res);
    expect((res.body as { salas: Array<{ ya_en_agenda: boolean }> }).salas[0].ya_en_agenda).toBe(true);
  });
});

describe('POST /catalogo/salas/:id/anadir', () => {
  it('crea el lead en la banda de la SESIÓN (ignora el band_id del cuerpo) y entrega el contacto', async () => {
    const res = resFalso();
    await manejador('/catalogo/salas/:id/anadir', 'post')(peticion({ params: { id: 'sala-1' }, body: { band_id: 'banda-ajena', bandId: 'banda-ajena' } }), res);
    expect(res.code).toBe(200);
    expect(m.guardados).toHaveLength(1);
    expect(m.guardados[0].bandId).toBe('banda-sesion');
    expect(m.guardados[0].lead).toMatchObject({ band_id: 'banda-sesion', email_contacto: 'booking@ejemplo.es', telefono: '910000000' });
    expect(m.enlaces).toEqual([{ leadId: m.guardados[0].lead.id, salaId: 'sala-1' }]);
  });

  it('409 si la banda ya la tiene, sin guardar nada', async () => {
    m.agenda = [{ id: 'l1', sala_id: 'sala-1', nombre_sala: 'Alfa', ciudad: 'Madrid', place_id: null }];
    const res = resFalso();
    await manejador('/catalogo/salas/:id/anadir', 'post')(peticion({ params: { id: 'sala-1' } }), res);
    expect(res.code).toBe(409);
    expect(m.guardados).toHaveLength(0);
  });

  it('404 si la sala no existe', async () => {
    const res = resFalso();
    await manejador('/catalogo/salas/:id/anadir', 'post')(peticion({ params: { id: 'sala-fantasma' } }), res);
    expect(res.code).toBe(404);
    expect(m.guardados).toHaveLength(0);
  });

  it('403 si la banda ha llegado al límite de salas de su plan, sin guardar nada', async () => {
    m.leadsDeLaBanda = Array.from({ length: 5000 }, (_, i) => ({ id: `l${i}`, tipo: 'sala' }));
    const res = resFalso();
    await manejador('/catalogo/salas/:id/anadir', 'post')(peticion({ params: { id: 'sala-1' } }), res);
    expect(res.code).toBe(403);
    expect((res.body as { codigo: string }).codigo).toBe('limite_plan_alcanzado');
    expect(m.guardados).toHaveLength(0);
  });
});

describe('GET /catalogo/sugerencias', () => {
  it('sugiere por ciudad y género, sin contacto, y deja fuera lo que la banda ya tiene', async () => {
    const res = resFalso();
    await manejador('/catalogo/sugerencias', 'get')(peticion({ query: { ciudad: 'Madrid, España', genero: 'Rock' } }), res);
    const cuerpo = res.body as { sugerencias: Array<{ id: string; motivos: string[] }> };
    expect(cuerpo.sugerencias.map((s) => s.id)).toEqual(['sala-1']);
    expect(cuerpo.sugerencias[0].motivos).toContain('En tu ciudad');
    expect(JSON.stringify(res.body)).not.toContain('booking@ejemplo.es');

    m.agenda = [{ id: 'l1', sala_id: 'sala-1', nombre_sala: 'Alfa', ciudad: 'Madrid', place_id: null }];
    const res2 = resFalso();
    await manejador('/catalogo/sugerencias', 'get')(peticion({ query: { ciudad: 'Madrid', genero: 'Rock' } }), res2);
    expect((res2.body as { sugerencias: unknown[] }).sugerencias).toEqual([]);
  });

  it('ignora parámetros que no son texto en vez de fallar', async () => {
    const res = resFalso();
    await manejador('/catalogo/sugerencias', 'get')(peticion({ query: { ciudad: ['a', 'b'], genero: { x: 1 }, limite: 'abc' } }), res);
    expect(res.code).toBe(200);
  });
});

describe('POST /catalogo/salas/anadir-varias', () => {
  it('añade en la banda de la sesión, ignora el band_id del cuerpo y devuelve el informe', async () => {
    const res = resFalso();
    await manejador('/catalogo/salas/anadir-varias', 'post')(peticion({ body: { salaIds: ['sala-1', 'sala-fantasma'], band_id: 'banda-ajena' } }), res);
    expect(res.body).toEqual({ success: true, anadidas: 1, yaEnAgenda: 0, noDisponibles: 1, limiteAlcanzado: false });
    expect(m.guardados).toHaveLength(1);
    expect(m.guardados[0].bandId).toBe('banda-sesion');
  });

  it('400 si no hay ids, si no son texto o si son demasiados', async () => {
    for (const body of [{}, { salaIds: [] }, { salaIds: [1, { a: 1 }] }, { salaIds: Array.from({ length: 11 }, (_, i) => `sala-${i}`) }]) {
      const res = resFalso();
      await manejador('/catalogo/salas/anadir-varias', 'post')(peticion({ body }), res);
      expect(res.code).toBe(400);
    }
    expect(m.guardados).toHaveLength(0);
  });

  it('respeta el límite del plan: sin plazas no guarda nada y avisa', async () => {
    m.leadsDeLaBanda = Array.from({ length: 5000 }, (_, i) => ({ id: `l${i}`, tipo: 'sala' }));
    const res = resFalso();
    await manejador('/catalogo/salas/anadir-varias', 'post')(peticion({ body: { salaIds: ['sala-1'] } }), res);
    expect((res.body as { limiteAlcanzado: boolean; anadidas: number })).toMatchObject({ limiteAlcanzado: true, anadidas: 0 });
    expect(m.guardados).toHaveLength(0);
  });
});

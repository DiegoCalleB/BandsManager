/**
 * Referidos e insignia. Invariantes: la primera atribución manda, solo las altas recientes pueden
 * atribuirse, una banda no se auto-refiere, la respuesta no revela de quién es un código y lo
 * único que una banda ve de las demás es un número.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas();
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));
vi.mock('../../services/perfilPublicoBanda.js', () => ({
  obtenerPerfilPublicoBandaCacheado: async (bandId: string) => ({
    bandId,
    nombre: bandId,
    logoUrl: null,
    mostrarInsignia: bandId !== 'band-pago',
    refCode: bandId === 'band-a' ? 'AAAA2222' : null,
  }),
}));

import { referidosRouter } from '../referidos';
import { encodeBandId } from '../../utils/bandHash';

process.env.APP_URL = 'https://bandmanager.io';

function manejador(ruta: string, metodo: 'get' | 'post') {
  const capa = (referidosRouter as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}
const resFalso = () => {
  const r: any = { cabeceras: {} };
  r.setHeader = (k: string, v: any) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
const reqSesion = (bandId: string, extra: any = {}) => ({ user: { band_id: bandId, allowedBandIds: [bandId], role: 'leader' }, headers: {}, query: {}, body: {}, ...extra });

const hace = (horas: number) => new Date(Date.now() - horas * 3_600_000).toISOString();
const banda = (id: string) => fake.tablas.registered_bands.find((b) => b.band_id === id);

async function atribuir(bandId: string, codigo: unknown) {
  const res = resFalso();
  await manejador('/referidos/atribuir', 'post')(reqSesion(bandId, { body: { codigo } }), res);
  return res;
}

beforeEach(() => {
  fake.tablas.registered_bands = [
    { band_id: 'band-a', nombre_banda: 'Banda A', plan: 'de_gira', ref_code: 'AAAA2222', fecha_registro: hace(24 * 90), referido_por: null },
    { band_id: 'band-nueva', nombre_banda: 'Nueva', plan: 'ensayo', ref_code: 'NNNN3333', fecha_registro: hace(1), referido_por: null },
    { band_id: 'band-nueva2', nombre_banda: 'Nueva 2', plan: 'ensayo', ref_code: null, fecha_registro: hace(2), referido_por: null },
    { band_id: 'band-vieja', nombre_banda: 'Vieja', plan: 'ensayo', ref_code: 'VVVV4444', fecha_registro: hace(24 * 30), referido_por: null },
    { band_id: 'band-c', nombre_banda: 'C', plan: 'ensayo', ref_code: 'CCCC5555', fecha_registro: hace(1), referido_por: 'band-z' },
  ];
  fake.estado.fallosPorTabla = {};
});

describe('POST /referidos/atribuir', () => {
  it('atribuye un alta reciente a la banda dueña del código', async () => {
    const res = await atribuir('band-nueva', 'aaaa2222');
    expect(res.body).toEqual({ atribuido: true });
    expect(banda('band-nueva')).toMatchObject({ referido_por: 'band-a' });
    expect(banda('band-nueva').referido_en).toBeTruthy();
  });

  it('la primera atribución manda: no se reescribe', async () => {
    await atribuir('band-nueva', 'AAAA2222');
    const segunda = await atribuir('band-nueva', 'CCCC5555');
    expect(segunda.body).toEqual({ atribuido: false });
    expect(banda('band-nueva').referido_por).toBe('band-a');
    // Y una banda que ya venía referida de antes tampoco cambia.
    expect((await atribuir('band-c', 'AAAA2222')).body).toEqual({ atribuido: false });
    expect(banda('band-c').referido_por).toBe('band-z');
  });

  it('una banda antigua no puede reclamar una invitación a posteriori', async () => {
    expect((await atribuir('band-vieja', 'AAAA2222')).body).toEqual({ atribuido: false });
    expect(banda('band-vieja').referido_por).toBeNull();
  });

  it('no se puede auto-referir', async () => {
    expect((await atribuir('band-nueva', 'NNNN3333')).body).toEqual({ atribuido: false });
    expect(banda('band-nueva').referido_por).toBeNull();
  });

  it('la respuesta es idéntica con un código inexistente, mal formado o ausente (no revela nada)', async () => {
    for (const codigo of ['ZZZZ9999', 'raro', '', null, undefined, { $ne: 1 }, "'; drop table"]) {
      const res = await atribuir('band-nueva', codigo);
      expect(res.code).toBeUndefined();
      expect(res.body).toEqual({ atribuido: false });
    }
    expect(banda('band-nueva').referido_por).toBeNull();
  });

  it('el band_id que mande el cliente no sirve para atribuir a otra banda: manda la sesión', async () => {
    const res = resFalso();
    await manejador('/referidos/atribuir', 'post')(reqSesion('band-nueva', { body: { codigo: 'AAAA2222', band_id: 'band-vieja', bandId: 'band-vieja' } }), res);
    expect(banda('band-nueva').referido_por).toBe('band-a');
    expect(banda('band-vieja').referido_por).toBeNull();
  });

  it('un fallo de base de datos no rompe el flujo de alta: responde «no atribuido»', async () => {
    fake.estado.fallosPorTabla.registered_bands = { message: 'boom' };
    const res = await atribuir('band-nueva', 'AAAA2222');
    expect(res.body).toEqual({ atribuido: false });
  });
});

describe('GET /referidos', () => {
  it('devuelve el código, el enlace y SOLO el número de bandas invitadas', async () => {
    await atribuir('band-nueva', 'AAAA2222');
    await atribuir('band-nueva2', 'AAAA2222');
    const res = resFalso();
    await manejador('/referidos', 'get')(reqSesion('band-a'), res);
    expect(res.body).toEqual({ codigo: 'AAAA2222', url: expect.stringContaining('ref=AAAA2222'), invitadas: 2 });
    const json = JSON.stringify(res.body);
    expect(json).not.toContain('Nueva');
    expect(json).not.toContain('band-nueva');
  });

  it('crea el código la primera vez si la banda aún no lo tiene', async () => {
    const res = resFalso();
    await manejador('/referidos', 'get')(reqSesion('band-nueva2'), res);
    expect(res.body.codigo).toMatch(/^[A-Z0-9]{8}$/);
    expect(banda('band-nueva2').ref_code).toBe(res.body.codigo);
    // Pedirlo otra vez devuelve el mismo.
    const otra = resFalso();
    await manejador('/referidos', 'get')(reqSesion('band-nueva2'), otra);
    expect(otra.body.codigo).toBe(res.body.codigo);
  });

  it('una banda sin invitadas ve 0', async () => {
    const res = resFalso();
    await manejador('/referidos', 'get')(reqSesion('band-nueva'), res);
    expect(res.body.invitadas).toBe(0);
  });
});

describe('GET /public/insignia', () => {
  const pedir = async (query: any) => {
    const res = resFalso();
    await manejador('/public/insignia', 'get')({ query, headers: {} }, res);
    return res;
  };

  it('devuelve el enlace con el código de la banda y la procedencia', async () => {
    const res = await pedir({ b: encodeBandId('band-a'), o: 'fans' });
    const u = new URL(res.body.href);
    expect(u.searchParams.get('ref')).toBe('AAAA2222');
    expect(u.searchParams.get('utm_medium')).toBe('fans');
    expect(res.cabeceras['Cache-Control']).toContain('max-age=300');
  });

  it('las bandas de pago no llevan insignia', async () => {
    expect((await pedir({ b: encodeBandId('band-pago') })).body).toEqual({ href: null });
  });

  it('con parámetros raros devuelve null sin romper nada (ni filtrar el plan)', async () => {
    for (const b of [undefined, '', "x'; drop", ['a', 'b'], '<script>']) {
      const res = await pedir({ b });
      expect(res.body).toEqual({ href: null });
    }
    const res = await pedir({ b: encodeBandId('band-a'), o: '<img onerror>' });
    expect(new URL(res.body.href).searchParams.get('utm_medium')).toBe('epk');
  });

  it('nunca expone el plan', async () => {
    const res = await pedir({ b: encodeBandId('band-a') });
    expect(JSON.stringify(res.body)).not.toMatch(/plan|de_gira|ensayo/i);
  });
});

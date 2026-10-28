/**
 * Asesor de Marketing. Invariantes:
 *  · el bandId sale de la sesión: lo que una banda guarda nunca lo lee ni lo pisa otra;
 *  · lo que se guarda va saneado por lista blanca (ni enums inventados ni campos extra);
 *  · el plan de hoy ignora bolos privados o sin confirmar y respeta la estrategia guardada;
 *  · la propuesta de la IA nunca se guarda sola, nunca trae líneas rojas ni fechas, y sin IA es un 503 claro;
 *  · pieza y acción solo aceptan ideas de hoy (el cliente manda el id, el formato lo pone el servidor);
 *  · la pieza que devuelve la IA llega saneada.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({ band_estrategia_marketing: [['band_id']], asesor_acciones: [['band_id', 'fecha', 'tarjeta_id']] });
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));
vi.mock('../../db.js', () => ({ dbGetEpkConfig: async () => null, dbGetRegisteredBandById: async () => ({ band_id: 'band-a', nombre_banda: 'Los Gatos', estilo_musical: 'rock' }) }));

const ia = { cliente: null as unknown, texto: '' };
vi.mock('../../ai.js', () => ({
  getAiClient: () => ia.cliente,
  generateContentWithFallback: async () => ({ text: ia.texto }),
}));

import { asesorRouter } from '../asesor';

const handler = (metodo: string, ruta: string) => {
  const capa = (asesorRouter as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
};
const resFalso = () => {
  const r: any = {};
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  return r;
};
async function llamar(metodo: string, ruta: string, { body, bandId = 'band-a' }: { body?: any; bandId?: string } = {}) {
  const res = resFalso();
  await handler(metodo, ruta)({ user: { band_id: bandId, allowedBandIds: [bandId], role: 'leader' }, headers: {}, query: {}, params: {}, body }, res);
  return res;
}

beforeEach(() => {
  for (const t of Object.keys(fake.tablas)) fake.tablas[t].length = 0;
  ia.cliente = null;
  ia.texto = '';
});
afterEach(() => vi.useRealTimers());

describe('estrategia', () => {
  it('se guarda saneada y bajo la banda de la sesión, no la del body', async () => {
    const res = await llamar('put', '/asesor/estrategia', { body: { band_id: 'band-b', objetivo: 'hackear', pilares: ['La furgo'], extra: 'x' } });
    expect(res.code).toBeUndefined();
    expect(fake.tablas.band_estrategia_marketing).toHaveLength(1);
    const fila = fake.tablas.band_estrategia_marketing[0];
    expect(fila.band_id).toBe('band-a');
    expect(fila.estrategia.objetivo).toBe('llenar_salas');
    expect(fila.estrategia.pilares).toEqual(['La furgo']);
    expect(fila.estrategia.extra).toBeUndefined();
  });

  it('rechaza lo que no es un objeto', async () => {
    expect((await llamar('put', '/asesor/estrategia', { body: 'hola' })).code).toBe(400);
  });

  it('otra banda no ve la estrategia ajena: recibe la inicial', async () => {
    await llamar('put', '/asesor/estrategia', { body: { pilares: ['Secreto'] } });
    const res = await llamar('get', '/asesor/estrategia', { bandId: 'band-b' });
    expect(res.body.guardada).toBe(false);
    expect(res.body.estrategia.pilares).toEqual([]);
    expect((await llamar('get', '/asesor/estrategia')).body.estrategia.pilares).toEqual(['Secreto']);
  });
});

describe('hoy', () => {
  it('planifica con el bolo público más cercano y la estrategia guardada', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-28T10:00:00Z'));
    fake.tablas.concerts = [
      { id: 'privado', band_id: 'band-a', fecha: '2026-10-30', sala: 'Boda', tipo: 'privado' },
      { id: 'b1', band_id: 'band-a', fecha: '2026-11-04', sala: 'Sala El Sol', ciudad: 'Madrid', tipo: 'sala' },
      { id: 'ajeno', band_id: 'band-b', fecha: '2026-10-29', sala: 'Otra', tipo: 'sala' },
    ];
    await llamar('put', '/asesor/estrategia', { body: { horasSemana: 1 } });
    const res = await llamar('get', '/asesor/hoy');
    expect(res.body.diagnostico.modo).toBe('concierto');
    expect(res.body.diagnostico.concierto.id).toBe('b1');
    expect(res.body.opciones.recomendadas).toHaveLength(1);
    expect(res.body.semana).toHaveLength(7);
    expect(res.body.tieneEstrategia).toBe(true);
  });

  it('sin bolos ni estrategia propone el modo fondo', async () => {
    const res = await llamar('get', '/asesor/hoy');
    expect(res.body.diagnostico.modo).toBe('fondo');
    expect(res.body.tieneEstrategia).toBe(false);
  });
});

describe('sugerir', () => {
  it('sin IA responde 503 y no escribe nada', async () => {
    const res = await llamar('post', '/asesor/estrategia/sugerir');
    expect(res.code).toBe(503);
    expect(fake.tablas.band_estrategia_marketing ?? []).toHaveLength(0);
  });

  it('devuelve un borrador saneado, sin líneas rojas ni fechas, y no lo guarda', async () => {
    ia.cliente = {};
    ia.texto = JSON.stringify({
      objetivo: 'festivales', pilares: ['Rock de barrio', 'La furgo'], lineasRojas: ['nada'],
      lanzamiento: { titulo: 'Inventado', fecha: '2026-12-01' }, revisada: true,
    });
    const res = await llamar('post', '/asesor/estrategia/sugerir');
    expect(res.body.estrategia.objetivo).toBe('festivales');
    expect(res.body.estrategia.lineasRojas).toEqual([]);
    expect(res.body.estrategia.lanzamiento).toBeNull();
    expect(res.body.estrategia.revisada).toBe(false);
    expect(fake.tablas.band_estrategia_marketing ?? []).toHaveLength(0);
  });
});

describe('acciones', () => {
  it('guarda hecho y saltado con el formato del servidor, y saltar promociona otra idea', async () => {
    await llamar('put', '/asesor/estrategia', { body: { horasSemana: 1 } });
    const antes = (await llamar('get', '/asesor/hoy')).body.opciones.recomendadas[0];
    const res = await llamar('post', '/asesor/accion', { body: { tarjetaId: antes.id, accion: 'saltado', formato: 'post', band_id: 'band-b' } });
    expect(res.body.ok).toBe(true);
    const fila = fake.tablas.asesor_acciones[0];
    expect(fila).toMatchObject({ band_id: 'band-a', tarjeta_id: antes.id, formato: antes.formato, accion: 'saltado' });
    const despues = (await llamar('get', '/asesor/hoy')).body.opciones.recomendadas[0];
    expect(despues.id).not.toBe(antes.id);
  });

  it('pendiente deshace, y una idea saltada se puede deshacer', async () => {
    await llamar('post', '/asesor/accion', { body: { tarjetaId: 'fondo-pilar', accion: 'saltado' } });
    await llamar('post', '/asesor/accion', { body: { tarjetaId: 'fondo-pilar', accion: 'pendiente' } });
    expect(fake.tablas.asesor_acciones).toHaveLength(0);
  });

  it('rechaza acciones e ideas inventadas', async () => {
    expect((await llamar('post', '/asesor/accion', { body: { tarjetaId: 'fondo-pilar', accion: 'toString' } })).code).toBe(400);
    expect((await llamar('post', '/asesor/accion', { body: { tarjetaId: 'inventada', accion: 'hecho' } })).code).toBe(404);
    expect(fake.tablas.asesor_acciones ?? []).toHaveLength(0);
  });

  it('las acciones de una banda no tocan el plan de otra', async () => {
    await llamar('post', '/asesor/accion', { body: { tarjetaId: 'fondo-pilar', accion: 'saltado' } });
    const otra = (await llamar('get', '/asesor/hoy', { bandId: 'band-b' })).body.opciones.recomendadas;
    expect(otra.map((t: any) => t.id)).toContain('fondo-pilar');
  });
});

describe('pieza', () => {
  it('sin IA responde 503; con una idea inventada, 404', async () => {
    expect((await llamar('post', '/asesor/pieza', { body: { tarjetaId: 'fondo-pilar' } })).code).toBe(503);
    ia.cliente = {};
    expect((await llamar('post', '/asesor/pieza', { body: { tarjetaId: 'inventada' } })).code).toBe(404);
  });

  it('devuelve la pieza saneada para las redes de la idea', async () => {
    ia.cliente = {};
    ia.texto = JSON.stringify({
      gancho: 'La furgo — otra vez', pasos: [{ titulo: 'Plano 1', detalle: 'Arranque' }],
      textos: [{ red: 'instagram', texto: 'Vamos', hashtags: ['#fyp', 'rockmadrid'] }, { red: 'tiktok', texto: 'Rock', hashtags: [] }],
      cta: 'Guárdalo', portada: 'La furgo',
    });
    const res = await llamar('post', '/asesor/pieza', { body: { tarjetaId: 'fondo-pilar' } });
    expect(res.body.pieza.gancho).toBe('La furgo, otra vez');
    expect(res.body.pieza.textos[0].hashtags).toEqual(['#rockmadrid']);
    expect(res.body.pieza.textos.map((t: any) => t.red)).toEqual(['instagram', 'tiktok']);
  });

  it('si la IA devuelve basura, 503 y no una pieza vacía', async () => {
    ia.cliente = {};
    ia.texto = 'lo siento';
    expect((await llamar('post', '/asesor/pieza', { body: { tarjetaId: 'fondo-pilar' } })).code).toBe(503);
  });
});

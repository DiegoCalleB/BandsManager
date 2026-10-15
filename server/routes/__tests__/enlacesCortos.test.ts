/**
 * Enlaces cortos: redirección pública y API. Prueba los handlers reales contra un Supabase
 * falso en memoria (sin levantar Express). Invariantes que protege:
 *  · un enlace nunca resuelve datos (entradas, concierto) de OTRA banda;
 *  · el dominio de la marca solo redirige a destinos que resuelve el servidor;
 *  · un rastreador/vista previa no cuenta como clic y un fallo de BD nunca da un 500 al fan;
 *  · la API solo crea/lista/borra enlaces de la banda de la sesión.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({ short_links: [['code'], ['band_id', 'clave']] });
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));
vi.mock('../../services/perfilPublicoBanda.js', () => ({
  obtenerPerfilPublicoBandaCacheado: async (bandId: string) => ({
    bandId,
    nombre: bandId === 'band-a' ? 'Banda A' : 'Banda B',
    logoUrl: null,
    mostrarInsignia: true,
    refCode: null,
  }),
}));

import { enlacesCortosApiRouter, enlacesCortosPublicoRouter } from '../enlacesCortos';
import { MAX_ENLACES_POR_BANDA } from '../../utils/enlacesCortos';

process.env.APP_URL = 'https://bandmanager.io';
const BASE = 'https://bandmanager.io';
const UA_MOVIL = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

function manejador(router: any, ruta: string, metodo: 'get' | 'post' | 'delete') {
  const capa = router.stack.find((s: any) => s.route?.path === ruta && s.route.methods[metodo]);
  expect(capa, `${metodo} ${ruta}`).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}

const resFalso = () => {
  const r: any = { cabeceras: {}, headersSent: false };
  r.setHeader = (k: string, v: any) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.json = (b: any) => ((r.body = b), r);
  r.send = (b: any) => ((r.body = b), r);
  r.redirect = (c: number, u: string) => ((r.code = c), (r.destino = u), (r.headersSent = true), r);
  return r;
};

const usuario = (bandId: string) => ({ band_id: bandId, allowedBandIds: [bandId], role: 'leader' });
const reqApi = (bandId: string, extra: any = {}) => ({ user: usuario(bandId), headers: {}, query: {}, body: {}, params: {}, ...extra });
const esperar = () => new Promise((r) => setTimeout(r, 20));

async function pulsar(code: string, headers: Record<string, string> = { 'user-agent': UA_MOVIL, 'x-forwarded-for': '203.0.113.7' }) {
  const res = resFalso();
  await manejador(enlacesCortosPublicoRouter, '/r/:code', 'get')({ params: { code }, headers, query: {}, ip: '203.0.113.7' }, res);
  await esperar();
  return res;
}

function sembrar() {
  fake.tablas.concerts.push(
    { id: 'c1', band_id: 'band-a', fecha: '2026-10-16', sala: 'Capitol', ciudad: 'Santiago', tipo: 'sala', is_posible: false, entradas_url: 'https://www.ticketmaster.es/event/1', cache: 1500 },
    { id: 'c2', band_id: 'band-a', fecha: '2026-10-17', sala: 'Playa Club', ciudad: 'A Coruña', tipo: 'sala', is_posible: false, entradas_url: null },
    { id: 'c3', band_id: 'band-a', fecha: '2026-10-18', sala: 'Boda de Marta', ciudad: 'Lugo', tipo: 'privado', is_posible: false, entradas_url: 'https://secreto.example/boda' },
    { id: 'cb', band_id: 'band-b', fecha: '2026-10-20', sala: 'Sala de B', ciudad: 'Vigo', tipo: 'sala', is_posible: false, entradas_url: 'https://entradas-de-b.example/secreto' }
  );
  const enlace = (code: string, band_id: string, concert_id: string | null, destino: string, canal = 'instagram') =>
    fake.tablas.short_links.push({ code, band_id, concert_id, destino, canal, clave: `${concert_id || '-'}|${destino}|${canal}` });
  enlace('aaaaaaa', 'band-a', 'c1', 'entradas');
  enlace('bbbbbbb', 'band-a', 'c2', 'entradas');
  enlace('ccccccc', 'band-a', 'c3', 'entradas');
  // Un enlace de la banda A que apunta (por error o a propósito) al concierto de la banda B.
  enlace('ddddddd', 'band-a', 'cb', 'entradas');
  enlace('eeeeeee', 'band-a', 'c1', 'concierto', 'tiktok');
  enlace('fffffff', 'band-a', null, 'epk', 'whatsapp');
}

beforeEach(() => {
  for (const k of ['short_links', 'short_link_clicks', 'concerts']) fake.tablas[k] = [];
  fake.estado.fallosPorTabla = {};
  sembrar();
});

describe('GET /r/:code', () => {
  it('manda a las entradas externas de ESE concierto y cuenta el clic', async () => {
    const res = await pulsar('aaaaaaa');
    expect(res.code).toBe(302);
    expect(res.destino).toBe('https://www.ticketmaster.es/event/1');
    expect(fake.tablas.short_link_clicks).toHaveLength(1);
    const clic = fake.tablas.short_link_clicks[0];
    expect(clic).toMatchObject({ code: 'aaaaaaa', band_id: 'band-a', dispositivo: 'movil' });
    expect(clic.visitante).toHaveLength(16);
  });

  it('no guarda la IP (ni en claro ni dentro de otro campo)', async () => {
    await pulsar('aaaaaaa');
    expect(JSON.stringify(fake.tablas.short_link_clicks)).not.toContain('203.0.113.7');
  });

  it('cabeceras: sin caché y sin indexar', async () => {
    const res = await pulsar('aaaaaaa');
    expect(res.cabeceras['Cache-Control']).toBe('no-store');
    expect(res.cabeceras['X-Robots-Tag']).toContain('noindex');
  });

  it('un rastreador o vista previa recibe la redirección pero NO suma un clic', async () => {
    for (const ua of ['WhatsApp/2.23.20.0 A', 'facebookexternalhit/1.1', 'Mozilla/5.0 (compatible; Googlebot/2.1)', '']) {
      const res = await pulsar('aaaaaaa', { 'user-agent': ua });
      expect(res.destino).toBe('https://www.ticketmaster.es/event/1');
    }
    expect(fake.tablas.short_link_clicks).toHaveLength(0);
  });

  it('sin enlace de entradas degrada a la página pública del concierto, con UTM del canal', async () => {
    const res = await pulsar('bbbbbbb');
    const u = new URL(res.destino);
    expect(u.origin).toBe(BASE);
    expect(u.pathname).toBe('/e/banda-a-playa-club-2026-10-17--c2');
    expect(u.searchParams.get('utm_source')).toBe('instagram');
    expect(u.searchParams.get('utm_campaign')).toBe('c2');
  });

  it('un concierto PRIVADO nunca se enseña ni se filtra: cae en el dossier de la banda', async () => {
    const res = await pulsar('ccccccc');
    expect(res.destino).not.toContain('secreto.example');
    expect(res.destino).not.toContain('/e/');
    expect(res.destino.startsWith(`${BASE}/epk?b=`)).toBe(true);
  });

  it('AISLAMIENTO: un enlace de la banda A que apunta al concierto de la B no resuelve las entradas de B', async () => {
    const res = await pulsar('ddddddd');
    expect(res.destino).not.toContain('entradas-de-b.example');
    expect(res.destino.startsWith(`${BASE}/epk?b=`)).toBe(true);
    // Y el clic se atribuye a la banda del ENLACE, no a la del concierto ajeno.
    expect(fake.tablas.short_link_clicks[0].band_id).toBe('band-a');
  });

  it('el destino «concierto» lleva a su página con el canal en la UTM', async () => {
    const res = await pulsar('eeeeeee');
    const u = new URL(res.destino);
    expect(u.pathname).toBe('/e/banda-a-capitol-2026-10-16--c1');
    expect(u.searchParams.get('utm_source')).toBe('tiktok');
  });

  it('el destino «epk» lleva al dossier de la banda', async () => {
    const res = await pulsar('fffffff');
    expect(res.destino.startsWith(`${BASE}/epk?b=`)).toBe(true);
    expect(new URL(res.destino).searchParams.get('utm_source')).toBe('whatsapp');
  });

  it('el código se acepta en mayúsculas y con espacios (se normaliza), por si lo teclea una persona', async () => {
    const res = await pulsar(' AAAAAAA ');
    expect(res.destino).toBe('https://www.ticketmaster.es/event/1');
  });

  it('códigos inventados o con formato raro van a la portada, nunca a un error', async () => {
    for (const code of ['inexist', 'xx', '../../etc', '<script>', 'aaaaaa0']) {
      const res = await pulsar(code);
      expect(res.code).toBe(302);
      expect(res.destino).toBe(BASE);
    }
    expect(fake.tablas.short_link_clicks).toHaveLength(0);
  });

  it('si la base de datos falla, el fan llega a la portada y no ve un 500', async () => {
    fake.estado.fallosPorTabla.short_links = { message: 'connection refused' };
    const res = await pulsar('aaaaaaa');
    expect(res.code).toBe(302);
    expect(res.destino).toBe(BASE);
  });

  it('si falla SOLO el registro del clic, la redirección ya se ha hecho', async () => {
    fake.estado.fallosPorTabla.short_link_clicks = { message: 'tabla sin crear' };
    const res = await pulsar('aaaaaaa');
    expect(res.destino).toBe('https://www.ticketmaster.es/event/1');
  });

  it('un enlace cuyo concierto se borró sigue llevando a algún sitio válido', async () => {
    fake.tablas.concerts.length = 0;
    const res = await pulsar('aaaaaaa');
    expect(res.code).toBe(302);
    expect(res.destino.startsWith(`${BASE}/epk?b=`)).toBe(true);
  });

  it('si el dueño cambia el enlace de entradas, el enlace ya repartido sigue la nueva URL', async () => {
    fake.tablas.concerts.find((c) => c.id === 'c1').entradas_url = 'https://dice.fm/event/nuevo';
    expect((await pulsar('aaaaaaa')).destino).toBe('https://dice.fm/event/nuevo');
  });

  it('un «javascript:» guardado como enlace de entradas no se sigue', async () => {
    fake.tablas.concerts.find((c) => c.id === 'c1').entradas_url = 'javascript:alert(1)';
    const res = await pulsar('aaaaaaa');
    expect(res.destino).not.toMatch(/^javascript:/i);
    expect(res.destino.startsWith(BASE)).toBe(true);
  });
});

describe('POST /api/short-links', () => {
  const crear = async (bandId: string, body: any) => {
    const res = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links', 'post')(reqApi(bandId, { body }), res);
    return res;
  };

  it('crea el enlace (201) y devuelve la URL corta; repetirlo devuelve el mismo (200)', async () => {
    fake.tablas.short_links.length = 0;
    const a = await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: 'tiktok' });
    expect(a.code).toBe(201);
    expect(a.body.url).toBe(`${BASE}/r/${a.body.code}`);
    const b = await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: 'tiktok' });
    expect(b.code).toBe(200);
    expect(b.body.code).toBe(a.body.code);
    expect(b.body.creado).toBe(false);
  });

  it('valida destino, canal y que el concierto venga cuando hace falta', async () => {
    expect((await crear('band-a', { concertId: 'c1', destino: 'https://evil.com', canal: 'web' })).code).toBe(400);
    expect((await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: '__proto__' })).code).toBe(400);
    expect((await crear('band-a', { destino: 'entradas', canal: 'web' })).code).toBe(400);
    expect((await crear('band-a', { concertId: "c1'; drop", destino: 'entradas', canal: 'web' })).code).toBe(400);
  });

  it('AISLAMIENTO: no se puede crear un enlace para el concierto de otra banda (404, sin pistas)', async () => {
    const res = await crear('band-a', { concertId: 'cb', destino: 'concierto', canal: 'web' });
    expect(res.code).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain('Sala de B');
    expect(fake.tablas.short_links.some((l) => l.concert_id === 'cb' && l.canal === 'web')).toBe(false);
  });

  it('no deja crear un enlace de entradas si el concierto no tiene enlace de entradas', async () => {
    const res = await crear('band-a', { concertId: 'c2', destino: 'entradas', canal: 'web' });
    expect(res.code).toBe(409);
    expect(res.body.error).toMatch(/enlace de entradas/i);
  });

  it('no deja crear la página pública de un concierto privado o sin confirmar', async () => {
    expect((await crear('band-a', { concertId: 'c3', destino: 'concierto', canal: 'web' })).code).toBe(409);
    // Ni siquiera el enlace de entradas de un evento privado.
    expect((await crear('band-a', { concertId: 'c3', destino: 'entradas', canal: 'web' })).code).toBe(409);
    fake.tablas.concerts.find((c) => c.id === 'c1').is_posible = true;
    expect((await crear('band-a', { concertId: 'c1', destino: 'concierto', canal: 'web' })).code).toBe(409);
  });

  it('el id de banda que llega en el cuerpo NO manda: se usa la banda de la sesión', async () => {
    fake.tablas.short_links.length = 0;
    const res = await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: 'web', band_id: 'band-b', bandId: 'band-b' });
    expect(res.code).toBe(201);
    expect(fake.tablas.short_links[0].band_id).toBe('band-a');
  });

  it('responde 409 con un mensaje claro al llegar al tope por banda', async () => {
    fake.tablas.short_links.length = 0;
    for (let i = 0; i < MAX_ENLACES_POR_BANDA; i++) {
      fake.tablas.short_links.push({ code: `c${i}`, band_id: 'band-a', concert_id: `x${i}`, destino: 'epk', canal: 'web', clave: `x${i}|epk|web` });
    }
    const res = await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: 'web' });
    expect(res.code).toBe(409);
    expect(res.body.error).toContain(String(MAX_ENLACES_POR_BANDA));
  });

  it('un fallo de BD es un 500 con mensaje, no un cuelgue', async () => {
    fake.estado.fallosPorTabla.short_links = { message: 'boom' };
    expect((await crear('band-a', { concertId: 'c1', destino: 'entradas', canal: 'web' })).code).toBe(500);
  });
});

describe('GET /api/short-links y DELETE', () => {
  it('lista SOLO los enlaces de la banda de la sesión, con sus estadísticas', async () => {
    fake.tablas.short_links.push({ code: 'ppppppp', band_id: 'band-b', concert_id: 'cb', destino: 'epk', canal: 'web', clave: 'cb|epk|web' });
    await pulsar('aaaaaaa');
    await pulsar('aaaaaaa', { 'user-agent': UA_MOVIL.replace('iPhone', 'Pixel'), 'x-forwarded-for': '198.51.100.9' });
    const res = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links', 'get')(reqApi('band-a'), res);
    expect(res.body.enlaces.every((e: any) => !e.code.startsWith('ppppppp'))).toBe(true);
    const e = res.body.enlaces.find((x: any) => x.code === 'aaaaaaa');
    expect(e.clics).toBe(2);
    expect(e.personas).toBe(2);
    expect(e.url).toBe(`${BASE}/r/aaaaaaa`);
    expect(res.body.totales.clics).toBe(2);
    expect(res.body.porCanal[0]).toEqual({ canal: 'instagram', clics: 2 });
  });

  it('puede filtrar por concierto', async () => {
    const res = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links', 'get')(reqApi('band-a', { query: { concertId: 'c1' } }), res);
    expect(res.body.enlaces.every((e: any) => e.concertId === 'c1')).toBe(true);
    expect(res.body.enlaces).toHaveLength(2);
  });

  it('la banda B no ve los clics de la A', async () => {
    await pulsar('aaaaaaa');
    fake.tablas.short_links.push({ code: 'ppppppp', band_id: 'band-b', concert_id: 'cb', destino: 'epk', canal: 'web', clave: 'cb|epk|web' });
    const res = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links', 'get')(reqApi('band-b'), res);
    expect(res.body.totales.clics).toBe(0);
    expect(res.body.enlaces).toHaveLength(1);
  });

  it('borrar un enlace ajeno da 404 y no lo borra; el propio sí', async () => {
    const intento = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links/:code', 'delete')(reqApi('band-b', { params: { code: 'aaaaaaa' } }), intento);
    expect(intento.code).toBe(404);
    expect(fake.tablas.short_links.some((l) => l.code === 'aaaaaaa')).toBe(true);

    const ok = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links/:code', 'delete')(reqApi('band-a', { params: { code: 'aaaaaaa' } }), ok);
    expect(ok.body).toEqual({ success: true });
    expect(fake.tablas.short_links.some((l) => l.code === 'aaaaaaa')).toBe(false);
  });

  it('rechaza un código con formato raro al borrar', async () => {
    const res = resFalso();
    await manejador(enlacesCortosApiRouter, '/short-links/:code', 'delete')(reqApi('band-a', { params: { code: "x' or 1=1" } }), res);
    expect(res.code).toBe(400);
  });
});

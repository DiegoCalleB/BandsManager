/**
 * Página pública de un concierto (/e/:slug), sitemap y robots.txt. Invariantes:
 *  · eventos privados, sin confirmar o inexistentes dan EL MISMO 404 (no se revela cuál es);
 *  · la página nunca contiene datos privados de la banda (caché, notas, contrato);
 *  · el slug no canónico se redirige (301) a la URL canónica;
 *  · el sitemap solo lista conciertos futuros y públicos.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { crearFakeSupabaseTablas } from '../../db/__tests__/helpers/fakeSupabaseTablas';

const fake = crearFakeSupabaseTablas({ short_links: [['code'], ['band_id', 'clave']] });
vi.mock('../../db/core.js', async (orig) => ({ ...(await orig<any>()), getSupabase: () => fake.client }));
vi.mock('../../state.js', async (orig) => ({ ...(await orig<any>()), loadState: () => ({}), saveState: () => {} }));
vi.mock('../../services/perfilPublicoBanda.js', () => ({
  obtenerPerfilPublicoBandaCacheado: async (bandId: string) => ({
    bandId,
    nombre: bandId === 'band-a' ? 'Os Herdeiros' : 'Otra Banda',
    logoUrl: 'https://cdn.example.com/logo.png',
    mostrarInsignia: bandId === 'band-a',
    refCode: bandId === 'band-a' ? 'ABCD2345' : null,
  }),
}));

import router, { _vaciarCacheSitemap } from '../paginaConcierto';

process.env.APP_URL = 'https://bandmanager.io';
const BASE = 'https://bandmanager.io';

function manejador(ruta: string) {
  const capa = (router as any).stack.find((s: any) => s.route?.path === ruta && s.route.methods.get);
  expect(capa, ruta).toBeDefined();
  const pila = capa.route.stack;
  return pila[pila.length - 1].handle;
}

const resFalso = () => {
  const r: any = { cabeceras: {}, headersSent: false };
  r.setHeader = (k: string, v: any) => (r.cabeceras[k] = v);
  r.status = (c: number) => ((r.code = c), r);
  r.send = (b: any) => ((r.body = b), (r.headersSent = true), r);
  r.json = (b: any) => ((r.body = b), r);
  r.redirect = (c: number, u: string) => ((r.code = c), (r.destino = u), (r.headersSent = true), r);
  return r;
};

async function pedir(slug: string) {
  const res = resFalso();
  await manejador('/e/:slug')({ params: { slug }, headers: {}, query: {} }, res);
  return res;
}

const FUTURO = '2099-10-16';
const SLUG_C1 = `os-herdeiros-capitol-${FUTURO}--c1`;

beforeEach(() => {
  _vaciarCacheSitemap();
  for (const k of ['short_links', 'short_link_clicks', 'concerts']) fake.tablas[k] = [];
  fake.estado.fallosPorTabla = {};
  fake.tablas.concerts.push(
    { id: 'c1', band_id: 'band-a', fecha: FUTURO, sala: 'Capitol', ciudad: 'Santiago', direccion: 'Rúa Nova 1', tipo: 'sala', is_posible: false, entradas_url: 'https://www.ticketmaster.es/event/1', cartel_url: 'https://cdn.example.com/cartel.jpg', cache: 1500, notas: 'cobrar la mitad en B', contrato_firmado: true },
    { id: 'c2', band_id: 'band-a', fecha: FUTURO, sala: 'Boda de Marta', ciudad: 'Lugo', tipo: 'privado', is_posible: false, entradas_url: null },
    { id: 'c3', band_id: 'band-a', fecha: FUTURO, sala: 'Sala sin cerrar', ciudad: 'Vigo', tipo: 'sala', is_posible: true },
    { id: 'c4', band_id: 'band-a', fecha: '2020-01-01', sala: 'Antigua', ciudad: 'Madrid', tipo: 'sala', is_posible: false, entradas_url: 'https://www.ticketmaster.es/event/viejo' },
    { id: 'c5', band_id: 'band-b', fecha: FUTURO, sala: 'Sala de B', ciudad: 'Vigo', tipo: 'festival', is_posible: false }
  );
});

describe('GET /e/:slug', () => {
  it('sirve la página de un concierto público con HTML, caché corta y metadatos', async () => {
    const res = await pedir(SLUG_C1);
    expect(res.code).toBe(200);
    expect(res.cabeceras['Content-Type']).toContain('text/html');
    expect(res.cabeceras['Cache-Control']).toContain('s-maxage');
    expect(res.body).toContain('<title>Os Herdeiros en Capitol (Santiago)');
    expect(res.body).toContain(`<link rel="canonical" href="${BASE}/e/${SLUG_C1}">`);
    expect(res.body).toContain('application/ld+json');
    expect(res.body).toContain('index,follow');
    expect(res.body).toContain('Rúa Nova 1');
    expect(res.body).toContain('Hecho con <a href="https://bandmanager.io/?ref=ABCD2345');
  });

  it('el botón de entradas pasa por un enlace corto del canal «web» y el JSON-LD lleva la URL directa', async () => {
    const res = await pedir(SLUG_C1);
    expect(fake.tablas.short_links).toHaveLength(1);
    expect(fake.tablas.short_links[0]).toMatchObject({ band_id: 'band-a', concert_id: 'c1', destino: 'entradas', canal: 'web' });
    const code = fake.tablas.short_links[0].code;
    expect(res.body).toContain(`href="${BASE}/r/${code}"`);
    expect(res.body).toContain('"offers":{"@type":"Offer","url":"https://www.ticketmaster.es/event/1"');
  });

  it('visitar dos veces la página no crea dos enlaces cortos', async () => {
    await pedir(SLUG_C1);
    await pedir(SLUG_C1);
    expect(fake.tablas.short_links).toHaveLength(1);
  });

  it('si no se puede crear el enlace corto, enlaza directo a las entradas (la página no se cae)', async () => {
    fake.estado.fallosPorTabla.short_links = { message: 'boom' };
    const res = await pedir(SLUG_C1);
    expect(res.code).toBe(200);
    expect(res.body).toContain('href="https://www.ticketmaster.es/event/1"');
  });

  it('NUNCA incluye datos privados: caché, notas, contrato', async () => {
    const res = await pedir(SLUG_C1);
    expect(res.body).not.toContain('1500');
    expect(res.body).not.toContain('cobrar la mitad');
    expect(res.body).not.toMatch(/contrato/i);
  });

  it('privado, sin confirmar e inexistente dan EL MISMO 404 (no se revela cuál es)', async () => {
    const privado = await pedir(`boda-de-marta-${FUTURO}--c2`);
    const posible = await pedir(`sala-sin-cerrar-${FUTURO}--c3`);
    const inexistente = await pedir(`nada-${FUTURO}--no-existe`);
    for (const r of [privado, posible, inexistente]) {
      expect(r.code).toBe(404);
      expect(r.body).toContain('noindex');
      expect(r.body).not.toContain('Boda de Marta');
      expect(r.body).not.toContain('Sala sin cerrar');
    }
    expect(privado.body).toBe(posible.body);
    expect(privado.body).toBe(inexistente.body);
  });

  it('slugs sin id o con id raro dan 404 sin tocar la base de datos', async () => {
    fake.estado.consultas.length = 0;
    for (const slug of ['sin-id', 'a--', "a--x'; drop table concerts", 'a--../../etc/passwd']) {
      expect((await pedir(slug)).code).toBe(404);
    }
    expect(fake.estado.consultas.filter((c) => c.includes('concerts'))).toHaveLength(0);
  });

  it('un slug distinto del canónico (banda renombrada, mayúsculas) redirige 301 a la URL buena', async () => {
    const res = await pedir(`nombre-antiguo-de-la-banda-${FUTURO}--c1`);
    expect(res.code).toBe(301);
    expect(res.destino).toBe(`/e/${SLUG_C1}`);
  });

  it('un concierto pasado se sirve pero no se indexa y no vende entradas', async () => {
    const res = await pedir('os-herdeiros-antigua-2020-01-01--c4');
    expect(res.code).toBe(200);
    expect(res.body).toContain('noindex,follow');
    expect(res.body).toContain('Este concierto ya ha pasado.');
    expect(res.body).not.toContain('ticketmaster.es/event/viejo');
    // Y no se crean enlaces cortos para un concierto que ya pasó.
    expect(fake.tablas.short_links).toHaveLength(0);
  });

  it('la insignia solo sale en bandas que la llevan', async () => {
    const res = await pedir(`otra-banda-sala-de-b-${FUTURO}--c5`);
    expect(res.code).toBe(200);
    expect(res.body).not.toContain('Hecho con');
  });

  it('un fallo de la base de datos devuelve una página, no un volcado de error', async () => {
    fake.estado.fallosPorTabla.concerts = { message: 'secreto interno: password=abc' };
    const res = await pedir(SLUG_C1);
    expect(res.code).toBe(500);
    expect(String(res.body)).not.toContain('password=abc');
    expect(res.cabeceras['Cache-Control']).toBe('no-store');
  });
});

describe('GET /sitemap.xml', () => {
  it('lista la portada y SOLO los conciertos públicos futuros', async () => {
    const res = resFalso();
    await manejador('/sitemap.xml')({ headers: {} }, res);
    expect(res.cabeceras['Content-Type']).toContain('application/xml');
    expect(res.body).toContain(`<loc>${BASE}/</loc>`);
    expect(res.body).toContain(`<loc>${BASE}/e/${SLUG_C1}</loc>`);
    expect(res.body).toContain(`${BASE}/e/otra-banda-sala-de-b-${FUTURO}--c5`);
    expect(res.body).not.toContain('--c2'); // privado
    expect(res.body).not.toContain('--c3'); // sin confirmar
    expect(res.body).not.toContain('--c4'); // pasado
  });

  it('si la base de datos falla devuelve un sitemap válido con la portada (no un 500)', async () => {
    fake.estado.fallosPorTabla.concerts = { message: 'boom' };
    const res = resFalso();
    await manejador('/sitemap.xml')({ headers: {} }, res);
    expect(res.body).toContain('<urlset');
    expect(res.body).toContain(`<loc>${BASE}/</loc>`);
    expect(res.cabeceras['Cache-Control']).toBe('no-store');
  });
});

describe('GET /robots.txt', () => {
  it('permite todo salvo la API y los enlaces cortos, y apunta al sitemap', () => {
    const res = resFalso();
    manejador('/robots.txt')({ headers: {} }, res);
    expect(res.cabeceras['Content-Type']).toContain('text/plain');
    expect(res.body).toContain('Disallow: /api/');
    expect(res.body).toContain('Disallow: /r/');
    expect(res.body).toContain(`Sitemap: ${BASE}/sitemap.xml`);
  });
});

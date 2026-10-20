import { describe, expect, it, vi } from 'vitest';
import { ciudadesDe, comunidadesDe, indexableCiudad, indexableComunidad, indexableIndice, MIN_SALAS_CIUDAD, MIN_SALAS_COMUNIDAD, MIN_SALAS_INDEX, salaPublica, salasPublicas } from '../salas/publicas.js';
import { renderizarCiudad, renderizarComunidad, renderizarIndiceSalas, renderizarSala } from '../salas/render.js';
import type { FilaSalaPublica } from '../salas/tipos.js';
import { renderizarListados } from '../listados.js';
import { entradasSeo } from '../sitemap.js';
import { crearProveedorSalas } from '../../../services/salasPublicas.js';

const BASE = 'https://bandmanager.io';
const fila = (extra: Partial<FilaSalaPublica> = {}): FilaSalaPublica => ({
  id: 'sala-abc123def', nombre: 'Sala Ejemplo', ciudad: 'Madrid', region: 'Comunidad de Madrid', direccion: 'Calle Mayor 1', tipo: 'sala', aforo: 300, genero: 'Rock',
  website: 'https://ejemplo.example/', instagram: null, nivel: 'probable', no_contactar: false, estado_negocio: 'operativo', fuentes: [], ...extra,
});
const muchas = (n: number, extra: (i: number) => Partial<FilaSalaPublica> = () => ({})) => salasPublicas(Array.from({ length: n }, (_, i) => fila({ id: `sala-id${i}xxxxxx`, nombre: `Sala ${i}`, ...extra(i) })));

describe('reglas de publicación', () => {
  it('publica una sala abierta, de España y con web oficial', () => {
    const s = salaPublica(fila())!;
    expect(s).toMatchObject({ nombre: 'Sala Ejemplo', comunidad: 'Comunidad de Madrid', provincia: 'Madrid', comunidadSlug: 'comunidad-de-madrid', ciudadSlug: 'madrid', web: 'https://ejemplo.example/' });
    expect(s.slug).toMatch(/^sala-ejemplo-[a-z0-9]{6}$/);
  });
  it.each([
    ['una marcada no contactar', { no_contactar: true }],
    ['una cerrada permanentemente', { estado_negocio: 'cerrado_permanente' as const }],
    ['una que viene de otro directorio (Bandflow): se usa en la app, no se republica', { fuentes: ['bandflow'] }],
    ['una sin web', { website: null }],
    ['una con web no https', { website: 'http://ejemplo.example/' }],
    ['una con web que no es una URL', { website: 'javascript:alert(1)' }],
    ['un festival o un medio', { tipo: 'festival' }],
    ['una sin ciudad', { ciudad: null }],
    ['una de Lisboa', { region: 'Lisboa', ciudad: 'Lisboa' }],
    ['una con región ilegible', { region: 'xyz', ciudad: 'Villa Imaginaria' }],
  ])('no publica %s', (_n, extra) => {
    expect(salaPublica(fila(extra))).toBeNull();
  });
  it('una cerrada temporalmente sí sigue en el directorio', () => {
    expect(salaPublica(fila({ estado_negocio: 'cerrado_temporal' }))).not.toBeNull();
  });
  it('el aforo solo se muestra si la sala está contrastada', () => {
    expect(salaPublica(fila({ nivel: 'sin_verificar' }))!.aforo).toBeNull();
    expect(salaPublica(fila({ nivel: 'probable' }))!.aforo).toBe(300);
    expect(salaPublica(fila({ nivel: 'verificada', aforo: 0 }))!.aforo).toBeNull();
  });
  it('dos salas con el mismo nombre en la misma ciudad no comparten URL', () => {
    const [a, b] = salasPublicas([fila({ id: 'sala-aaaaaa111' }), fila({ id: 'sala-bbbbbb222' })]);
    expect(a.slug).not.toBe(b.slug);
  });
  it('marca la procedencia OpenStreetMap', () => {
    expect(salaPublica(fila({ fuentes: ['osm'] }))!.deOsm).toBe(true);
    expect(salaPublica(fila({ fuentes: null }))!.deOsm).toBe(false);
  });
  it('el tipo de la sala no puede llevar contactos: la fila pública no los tiene', () => {
    const s = salaPublica({ ...fila(), email_contacto: 'info@x.example', telefono: '910000000' } as FilaSalaPublica)!;
    expect(JSON.stringify(s)).not.toMatch(/info@x\.example|910000000/);
  });
});

describe('agrupación y umbrales de indexación', () => {
  const salas = muchas(MIN_SALAS_INDEX, (i) => (i < 12 ? {} : { region: 'Andalucía', ciudad: 'Sevilla' }));
  it('agrupa por comunidad y ciudad, de más a menos salas', () => {
    expect(comunidadesDe(salas).map((g) => [g.slug, g.salas.length])).toEqual([['andalucia', 18], ['comunidad-de-madrid', 12]]);
    expect(ciudadesDe(salas, 'andalucia').map((g) => g.nombre)).toEqual(['Sevilla']);
  });
  it('las listas solo se indexan con volumen suficiente', () => {
    expect(indexableIndice(salas)).toBe(true);
    expect(indexableIndice(salas.slice(1))).toBe(false);
    expect(indexableComunidad(salas, 'comunidad-de-madrid')).toBe(12 >= MIN_SALAS_COMUNIDAD);
    expect(indexableCiudad(muchas(MIN_SALAS_CIUDAD - 1), 'comunidad-de-madrid', 'madrid')).toBe(false);
    expect(indexableCiudad(muchas(MIN_SALAS_CIUDAD), 'comunidad-de-madrid', 'madrid')).toBe(true);
  });
});

describe.each(['es', 'en'] as const)('páginas (%s)', (idioma) => {
  const salas = muchas(MIN_SALAS_INDEX);
  it('el índice, la comunidad y la ciudad van con index con volumen y noindex sin él', () => {
    expect(renderizarIndiceSalas(BASE, idioma, salas)).toContain('index,follow');
    expect(renderizarIndiceSalas(BASE, idioma, salas.slice(0, 3))).toContain('noindex,follow');
    expect(renderizarComunidad(BASE, idioma, salas, 'comunidad-de-madrid')).toContain('index,follow');
    expect(renderizarCiudad(BASE, idioma, salas, 'comunidad-de-madrid', 'madrid')).toContain('index,follow');
    expect(renderizarCiudad(BASE, idioma, salas.slice(0, 2), 'comunidad-de-madrid', 'madrid')).toContain('noindex,follow');
  });
  it('una zona sin salas devuelve null (404)', () => {
    expect(renderizarComunidad(BASE, idioma, salas, 'no-existe')).toBeNull();
    expect(renderizarCiudad(BASE, idioma, salas, 'comunidad-de-madrid', 'no-existe')).toBeNull();
  });
  it('la ficha de una sala va siempre con noindex, enlaza su web y no lleva contactos', () => {
    const html = renderizarSala(BASE, idioma, salas[0]);
    expect(html).toContain('noindex,follow');
    expect(html).toContain('https://ejemplo.example/');
    expect(html).toContain('"@type":"MusicVenue"');
    expect(html).not.toMatch(/mailto:|tel:/);
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });
  it('escapa el texto de las salas', () => {
    const [s] = salasPublicas([fila({ nombre: '<img src=x onerror=alert(1)>', genero: '"><script>x</script>' })]);
    const html = renderizarSala(BASE, idioma, s);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>x</script>');
  });
  it('cita a OpenStreetMap solo cuando algún dato procede de allí', () => {
    const conOsm = salasPublicas([fila({ fuentes: ['osm'] })]);
    expect(renderizarIndiceSalas(BASE, idioma, conOsm)).toContain('openstreetmap.org/copyright');
    expect(renderizarIndiceSalas(BASE, idioma, salasPublicas([fila()]))).not.toContain('openstreetmap.org');
  });
  it('los títulos y descripciones caben en los límites de Google', () => {
    for (const html of [renderizarIndiceSalas(BASE, idioma, salas), renderizarComunidad(BASE, idioma, salas, 'comunidad-de-madrid')!, renderizarCiudad(BASE, idioma, salas, 'comunidad-de-madrid', 'madrid')!, renderizarSala(BASE, idioma, salas[0])]) {
      expect(html.match(/<title>(.*?)<\/title>/)![1].length).toBeLessThanOrEqual(70);
      expect(html.match(/name="description" content="(.*?)"/)![1].length).toBeLessThanOrEqual(160);
    }
  });
});

describe('sitemap y portada de listados', () => {
  it('el sitemap incluye las listas con volumen, con hreflang, y nunca las fichas de sala', () => {
    const salas = muchas(MIN_SALAS_INDEX);
    const e = entradasSeo(BASE, '2026-10-19', [], salas);
    const locs = e.map((x) => x.loc);
    expect(locs).toContain(`${BASE}/directories/venues`);
    expect(locs).toContain(`${BASE}/en/directories/venues/comunidad-de-madrid`);
    expect(locs.some((l) => /venues\/comunidad-de-madrid\/madrid\/sala-/.test(l))).toBe(false);
    expect(e.find((x) => x.loc.endsWith('/directories/venues'))!.alternativas!.map((a) => a.hreflang)).toEqual(['es', 'en', 'x-default']);
  });
  it('lastmod es la fecha real más reciente de las salas de la zona, y cae a la del contenido sin datos', () => {
    const salas = muchas(MIN_SALAS_INDEX, (i) => ({ updated_at: i === 3 ? '2026-10-17T08:00:00Z' : '2026-09-01T00:00:00Z' }));
    const e = entradasSeo(BASE, '2026-10-19', [], salas);
    expect(e.find((x) => x.loc.endsWith('/directories/venues'))!.lastmod).toBe('2026-10-17');
    const sin = entradasSeo(BASE, '2026-10-19', [], muchas(MIN_SALAS_INDEX));
    expect(sin.find((x) => x.loc.endsWith('/directories/venues'))!.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('el índice declara dateModified, fecha visible y un Dataset', () => {
    const html = renderizarIndiceSalas(BASE, 'en', muchas(MIN_SALAS_INDEX, () => ({ updated_at: '2026-10-17T08:00:00Z' })));
    expect(html).toContain('"dateModified":"2026-10-17"');
    expect(html).toContain('<time datetime="2026-10-17">');
    expect(html).toContain('"@type":"Dataset"');
  });
  it('con pocas salas no entra nada de salas en el sitemap', () => {
    expect(entradasSeo(BASE, '2026-10-19', [], muchas(3)).some((x) => x.loc.includes('/venues'))).toBe(false);
  });
  it('la portada de listados se indexa con dos directorios indexables y no antes', () => {
    expect(renderizarListados(BASE, 'es', 1)).toContain('noindex,follow');
    expect(renderizarListados(BASE, 'es', 2)).toContain('index,follow');
    expect(renderizarListados(BASE, 'es')).toContain('/directories/venues');
  });
});

describe('proveedor de salas', () => {
  it('guarda la lectura el TTL y, si la base falla, sigue sirviendo la última buena', async () => {
    let t = 0;
    const buenas = muchas(2);
    const cargar = vi.fn().mockResolvedValueOnce(buenas).mockRejectedValue(new Error('caída'));
    const alFallar = vi.fn();
    const p = crearProveedorSalas(cargar, () => t, alFallar);
    expect(await p()).toBe(buenas);
    t = 60_000; expect(await p()).toBe(buenas);
    expect(cargar).toHaveBeenCalledTimes(1);
    t = 11 * 60_000; expect(await p()).toBe(buenas);
    expect(alFallar).toHaveBeenCalledOnce();
    t = 11 * 60_000 + 10_000; await p();
    expect(cargar).toHaveBeenCalledTimes(2);
  });
  it('sin lectura buena previa y con la base caída devuelve una lista vacía', async () => {
    const p = crearProveedorSalas(async () => { throw new Error('x'); }, () => 0);
    expect(await p()).toEqual([]);
  });
});

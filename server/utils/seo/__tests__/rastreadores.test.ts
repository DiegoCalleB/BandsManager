import { describe, expect, it } from 'vitest';
import { RASTREADORES_IA, estadoDirectorios, renderizarLlmsTxt, renderizarRobots } from '../rastreadores.js';
import { conEntidadesDelSitio } from '../cabeza.js';
import { renderizarCiudad, renderizarComunidad, renderizarIndiceSalas } from '../salas/render.js';
import type { SalaPublica } from '../salas/tipos.js';

const BASE = 'https://bandmanager.io';

const sala = (i: number, ciudad = 'Madrid', ciudadSlug = 'madrid'): SalaPublica => ({
  id: `s${i}`, nombre: `Sala ${i}`, slug: `sala-${i}`, ciudad, ciudadSlug, provincia: 'Madrid', comunidad: 'Comunidad de Madrid', comunidadSlug: 'comunidad-de-madrid',
  direccion: null, aforo: null, genero: null, web: `https://sala${i}.example/`, instagram: null, deOsm: false,
} as SalaPublica);

const extraerJsonLd = (html: string) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1]);

describe('robots.txt', () => {
  const robots = renderizarRobots(BASE);
  it('permite todo salvo la API y los enlaces cortos, y apunta al sitemap y a llms.txt', () => {
    expect(robots).toContain('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /r/');
    expect(robots).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    expect(robots).toContain(`${BASE}/llms.txt`);
  });
  it('nombra a los rastreadores de IA y a los buscadores y no les cierra ninguna página pública', () => {
    for (const bot of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']) {
      expect(RASTREADORES_IA).toContain(bot);
      expect(robots).toContain(`User-agent: ${bot}`);
    }
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  });
});

describe('llms.txt', () => {
  const vacio = estadoDirectorios([], []);
  it('sigue el formato: título, resumen, secciones y enlaces con descripción', () => {
    const txt = renderizarLlmsTxt(BASE, 'es', vacio);
    expect(txt.startsWith('# BandManager.io\n\n> ')).toBe(true);
    expect(txt).toMatch(/## Guías para bandas\n\n- \[[^\]]+\]\(https:\/\/bandmanager\.io\/guides\/[a-z0-9-]+\): /);
    expect(txt).toContain(`(${BASE}/technical-rider-template)`);
  });
  it('en inglés enlaza las rutas en inglés', () => {
    const txt = renderizarLlmsTxt(BASE, 'en', vacio);
    expect(txt).toContain(`(${BASE}/en/guides/`);
    expect(txt).not.toContain(`(${BASE}/guides/`);
  });
  it('no anuncia un directorio que todavía es noindex', () => {
    const txt = renderizarLlmsTxt(BASE, 'es', vacio);
    expect(txt).not.toContain('/directories/');
  });
  it('anuncia las salas y las comunidades cuando pasan los umbrales de indexación', () => {
    const salas = Array.from({ length: 30 }, (_, i) => sala(i));
    const txt = renderizarLlmsTxt(BASE, 'es', estadoDirectorios([], salas));
    expect(txt).toContain(`(${BASE}/directories/venues)`);
    expect(txt).toContain(`(${BASE}/directories/venues/comunidad-de-madrid): 30 salas`);
  });
  it('pide citar con la fecha de comprobación y atribuye OpenStreetMap', () => {
    const txt = renderizarLlmsTxt(BASE, 'es', vacio);
    expect(txt).toMatch(/fecha de comprobación/);
    expect(txt).toMatch(/OpenStreetMap/);
  });
});

describe('JSON-LD común', () => {
  it('añade la organización y el sitio con @id estable a cualquier página, con o sin @graph', () => {
    const conGrafo = conEntidadesDelSitio({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Article' }] }, BASE, 'es') as { '@graph': Array<Record<string, unknown>> };
    expect(conGrafo['@graph'].map((n) => n['@type'])).toEqual(['Article', 'Organization', 'WebSite']);
    const suelto = conEntidadesDelSitio({ '@context': 'https://schema.org', '@type': 'CollectionPage' }, BASE, 'en') as { '@graph': Array<Record<string, unknown>> };
    expect(suelto['@graph'][0]).toEqual({ '@type': 'CollectionPage' });
    expect(suelto['@graph'].find((n) => n['@type'] === 'WebSite')).toMatchObject({ '@id': `${BASE}/#website`, inLanguage: 'en', publisher: { '@id': `${BASE}/#organization` } });
  });
});

describe('listas de salas: preguntas frecuentes y lista estructurada', () => {
  const salas = [...Array.from({ length: 6 }, (_, i) => sala(i)), sala(10, 'Alcalá de Henares', 'alcala-de-henares')];
  it('el índice, la comunidad y la ciudad llevan preguntas visibles y FAQPage con las mismas respuestas', () => {
    const paginas = [renderizarIndiceSalas(BASE, 'es', salas), renderizarComunidad(BASE, 'es', salas, 'comunidad-de-madrid')!, renderizarCiudad(BASE, 'es', salas, 'comunidad-de-madrid', 'madrid')!];
    for (const html of paginas) {
      const faq = extraerJsonLd(html)['@graph'].find((n: { '@type': string }) => n['@type'] === 'FAQPage');
      expect(faq.mainEntity.length).toBeGreaterThanOrEqual(2);
      for (const p of faq.mainEntity) {
        expect(html).toContain(`<summary>${p.name.replace(/&/g, '&amp;')}</summary>`);
      }
    }
  });
  it('las respuestas salen de los datos reales de la zona', () => {
    const html = renderizarComunidad(BASE, 'es', salas, 'comunidad-de-madrid')!;
    expect(html).toContain('recoge 7 salas en Comunidad de Madrid');
    expect(html).toContain('2 ciudades');
  });
  it('la ciudad publica una ItemList con todas sus salas en orden', () => {
    const lista = extraerJsonLd(renderizarCiudad(BASE, 'es', salas, 'comunidad-de-madrid', 'madrid')!)['@graph'].find((n: { '@type': string }) => n['@type'] === 'CollectionPage').mainEntity;
    expect(lista['@type']).toBe('ItemList');
    expect(lista.numberOfItems).toBe(6);
    expect(lista.itemListElement[0]).toMatchObject({ position: 1, name: 'Sala 0' });
  });
  it('todas las páginas públicas llevan la organización y el sitio', () => {
    const grafo = extraerJsonLd(renderizarIndiceSalas(BASE, 'en', salas))['@graph'];
    expect(grafo.map((n: { '@type': string }) => n['@type'])).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
  });
});

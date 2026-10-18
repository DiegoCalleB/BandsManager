import { describe, expect, it } from 'vitest';
import { renderizarPaginaRider } from '../../paginaRider.js';
import { GUIAS, GUIAS_EN, enlaceDeRelacionada, guiaPorSlug, guiasDe, slugEquivalente } from '../indice.js';
import { renderizarGuia, renderizarIndiceGuias } from '../render.js';
import { RUTAS, type IdiomaSeo } from '../rutas.js';
import { entradasSeo } from '../sitemap.js';

const BASE = 'https://bandmanager.io';
const IDIOMAS: IdiomaSeo[] = ['es', 'en'];

describe.each(IDIOMAS)('guías de SEO (%s)', (idioma) => {
  const guias = guiasDe(idioma);

  it('los slugs son únicos y seguros para una URL', () => {
    const slugs = guias.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(guias.map((g) => [g.slug, g] as const))('%s: metadatos y estructura completos', (_slug, g) => {
    expect(g.descripcion.length).toBeLessThanOrEqual(160);
    expect(g.titulo.length).toBeLessThanOrEqual(70);
    expect(g.secciones.length).toBeGreaterThanOrEqual(3);
    expect(g.faq.length).toBeGreaterThanOrEqual(3);
    for (const r of g.relacionadas) expect(enlaceDeRelacionada(r, idioma), `relacionada rota: ${r}`).not.toBeNull();
    expect(JSON.stringify(g)).not.toMatch(/—|--/);
  });

  it('cada guía renderiza un h1, canónica propia, hreflang recíproco y JSON-LD que no puede cerrar el script', () => {
    for (const g of guias) {
      const html = renderizarGuia(g, BASE, idioma);
      expect(html).toContain(`<html lang="${idioma}">`);
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).toContain(`<link rel="canonical" href="${BASE}${RUTAS[idioma].guia(g.slug)}">`);
      expect(html).toContain('hreflang="es"');
      expect(html).toContain('hreflang="en"');
      expect(html).toContain(`utm_campaign=${g.slug}`);
      const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '';
      expect(ld).not.toContain('<');
      expect(JSON.parse(ld)['@graph']).toHaveLength(3);
    }
  });

  it('el índice enlaza todas las guías de su idioma y la plantilla de rider', () => {
    const html = renderizarIndiceGuias(BASE, idioma);
    for (const g of guias) expect(html).toContain(`${BASE}${RUTAS[idioma].guia(g.slug)}`);
    expect(html).toContain(`${BASE}${RUTAS[idioma].rider}`);
  });

  it('la plantilla de rider tiene un h1, la plantilla editable y su canónica', () => {
    const html = renderizarPaginaRider(BASE, idioma);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain('contenteditable="true"');
    expect(html).toContain(`<link rel="canonical" href="${BASE}${RUTAS[idioma].rider}">`);
    expect(html).toContain('utm_campaign=rider_tecnico');
  });
});

describe('las dos versiones de cada guía', () => {
  it('hay las mismas guías en español y en inglés, y cada par se apunta de ida y vuelta', () => {
    expect(GUIAS_EN).toHaveLength(GUIAS.length);
    for (const g of GUIAS) {
      const en = slugEquivalente(g.slug, 'es');
      expect(en, `${g.slug} sin versión en inglés`).not.toBeNull();
      expect(slugEquivalente(en!, 'en')).toBe(g.slug);
    }
  });

  it('el sitemap lista cada página en los dos idiomas con las mismas alternativas', () => {
    const entradas = entradasSeo(BASE);
    expect(entradas).toHaveLength((GUIAS.length + 2) * 2);
    for (const e of entradas) expect(e.alternativas?.map((a) => a.hreflang)).toEqual(['es', 'en', 'x-default']);
  });
});

describe('búsqueda por slug', () => {
  it('un slug desconocido, de otro idioma o no textual no encuentra guía', () => {
    expect(guiaPorSlug('no-existe')).toBeNull();
    expect(guiaPorSlug('como-hacer-un-epk', 'en')).toBeNull();
    expect(guiaPorSlug('how-to-make-an-epk', 'es')).toBeNull();
    expect(guiaPorSlug({ toString: () => 'como-hacer-un-epk' })).toBeNull();
    expect(guiaPorSlug('__proto__')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { GUIAS, enlaceDeRelacionada, guiaPorSlug } from '../indice.js';
import { renderizarGuia, renderizarIndiceGuias } from '../render.js';

const BASE = 'https://bandmanager.io';

describe('guías de SEO', () => {
  it('los slugs son únicos y seguros para una URL', () => {
    const slugs = GUIAS.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it.each(GUIAS.map((g) => [g.slug, g] as const))('%s: metadatos y estructura completos', (_slug, g) => {
    expect(g.descripcion.length).toBeLessThanOrEqual(160);
    expect(g.titulo.length).toBeLessThanOrEqual(70);
    expect(g.secciones.length).toBeGreaterThanOrEqual(3);
    expect(g.faq.length).toBeGreaterThanOrEqual(3);
    for (const r of g.relacionadas) expect(enlaceDeRelacionada(r), `relacionada rota: ${r}`).not.toBeNull();
    // Texto de personas: ni guiones largos ni mayúsculas gritadas.
    expect(JSON.stringify(g)).not.toMatch(/—|--/);
  });

  it('cada guía renderiza un h1, canónica propia y JSON-LD que no puede cerrar el script', () => {
    for (const g of GUIAS) {
      const html = renderizarGuia(g, BASE);
      expect(html.match(/<h1[ >]/g)).toHaveLength(1);
      expect(html).toContain(`<link rel="canonical" href="${BASE}/guias/${g.slug}">`);
      expect(html).toContain(`utm_campaign=${g.slug}`);
      const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '';
      expect(ld).not.toContain('<');
      expect(JSON.parse(ld)['@graph']).toHaveLength(3);
    }
  });

  it('el índice enlaza todas las guías y la plantilla de rider', () => {
    const html = renderizarIndiceGuias(BASE);
    for (const g of GUIAS) expect(html).toContain(`${BASE}/guias/${g.slug}`);
    expect(html).toContain(`${BASE}/plantilla-rider-tecnico`);
  });

  it('un slug desconocido o no textual no encuentra guía', () => {
    expect(guiaPorSlug('no-existe')).toBeNull();
    expect(guiaPorSlug({ toString: () => 'como-hacer-un-epk' })).toBeNull();
    expect(guiaPorSlug('__proto__')).toBeNull();
  });
});

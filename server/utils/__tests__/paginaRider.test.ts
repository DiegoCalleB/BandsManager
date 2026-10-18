import { describe, expect, it } from 'vitest';
import { RUTA_PLANTILLA_RIDER, renderizarPaginaRider } from '../paginaRider.js';

const BASE = 'https://bandmanager.io';

describe('renderizarPaginaRider', () => {
  const html = renderizarPaginaRider(BASE);

  it('es indexable y declara su URL canónica', () => {
    expect(html).toContain('content="index,follow');
    expect(html).toContain(`<link rel="canonical" href="${BASE}${RUTA_PLANTILLA_RIDER}">`);
  });

  it('lleva un solo h1, la plantilla editable y la llamada al registro con UTM', () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(html).toContain('contenteditable="true"');
    expect(html).toContain('utm_campaign=rider_tecnico');
  });

  it('incluye FAQPage en JSON-LD sin poder cerrar la etiqueta script', () => {
    const ld = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '';
    expect(ld).not.toContain('<');
    expect(JSON.parse(ld)['@graph'].some((n: { '@type': string }) => n['@type'] === 'FAQPage')).toBe(true);
  });

  it('escapa una base hostil en los atributos', () => {
    expect(renderizarPaginaRider('https://x.test/"><script>alert(1)</script>')).not.toContain('<script>alert(1)');
  });
});

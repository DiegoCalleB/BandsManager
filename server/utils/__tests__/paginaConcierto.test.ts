import { describe, expect, it } from 'vitest';
import {
  baseUrlPublica,
  construirJsonLd,
  esConciertoPublicable,
  fechaLarga,
  fechaValida,
  haPasado,
  idDesdeSlug,
  jsonLdSeguro,
  renderizarNoEncontrado,
  renderizarPaginaConcierto,
  renderizarSitemap,
  slugConcierto,
  urlConcierto,
  type DatosPaginaConcierto,
} from '../paginaConcierto';

const datos: DatosPaginaConcierto = {
  baseUrl: 'https://bandmanager.io',
  canonicalUrl: 'https://bandmanager.io/e/os-herdeiros-sala-capitol-2026-10-16--cnc-hdc-1',
  id: 'cnc-hdc-1',
  fecha: '2026-10-16',
  sala: 'Sala Capitol',
  ciudad: 'Santiago de Compostela',
  direccion: 'Rúa Concheiros 1',
  cartelUrl: 'https://cdn.example.com/cartel.jpg',
  bandaNombre: 'Os Herdeiros do Código',
  logoUrl: 'https://cdn.example.com/logo.png',
  entradasHref: 'https://bandmanager.io/r/abcdefg',
  entradasDirectaUrl: 'https://www.ticketmaster.es/event/1',
  epkUrl: 'https://bandmanager.io/epk?b=t_x',
  fansUrl: 'https://bandmanager.io/unete?b=t_x',
  pasado: false,
  insigniaHref: 'https://bandmanager.io/?ref=ABC123',
};

describe('qué se publica', () => {
  const ok = { id: 'c1', fecha: '2026-10-16', sala: 'Capitol', ciudad: 'Santiago', tipo: 'sala', is_posible: false };

  it('publica un concierto normal', () => {
    expect(esConciertoPublicable(ok)).toBe(true);
    for (const tipo of ['festival', 'propio', 'ayuntamiento', 'sala']) expect(esConciertoPublicable({ ...ok, tipo })).toBe(true);
  });

  it('NO publica eventos privados, bolos sin confirmar ni filas incompletas', () => {
    expect(esConciertoPublicable({ ...ok, tipo: 'privado' })).toBe(false);
    expect(esConciertoPublicable({ ...ok, tipo: 'PRIVADO' })).toBe(false);
    expect(esConciertoPublicable({ ...ok, is_posible: true })).toBe(false);
    expect(esConciertoPublicable({ ...ok, sala: '   ' })).toBe(false);
    expect(esConciertoPublicable({ ...ok, fecha: '2026-02-31' })).toBe(false);
    expect(esConciertoPublicable({ ...ok, fecha: 'mañana' })).toBe(false);
    expect(esConciertoPublicable({ ...ok, id: '' })).toBe(false);
    expect(esConciertoPublicable(null)).toBe(false);
    expect(esConciertoPublicable(undefined)).toBe(false);
  });

  it('valida fechas reales', () => {
    expect(fechaValida('2026-10-16')).toBe(true);
    expect(fechaValida('2026-13-01')).toBe(false);
    expect(fechaValida('16/10/2026')).toBe(false);
    expect(fechaValida(20261016)).toBe(false);
  });

  it('un concierto ya ha pasado a partir del día siguiente (hora de Madrid)', () => {
    expect(haPasado('2026-10-15', new Date('2026-10-16T10:00:00Z'))).toBe(true);
    expect(haPasado('2026-10-16', new Date('2026-10-16T10:00:00Z'))).toBe(false);
    expect(haPasado('2026-10-17', new Date('2026-10-16T10:00:00Z'))).toBe(false);
  });
});

describe('slug', () => {
  const c = { id: 'cnc-hdc-1', sala: 'Sala Capitol', fecha: '2026-10-16' };

  it('hace un slug legible con el id al final y vuelve a sacar el id', () => {
    const s = slugConcierto('Os Herdeiros do Código', c);
    expect(s).toBe('os-herdeiros-do-codigo-sala-capitol-2026-10-16--cnc-hdc-1');
    expect(idDesdeSlug(s)).toBe('cnc-hdc-1');
  });

  it('el id sobrevive a nombres raros', () => {
    const s = slugConcierto('Ñandú & Los <script>', { id: 'abc_1.2', sala: 'Café "Ñ"', fecha: '2026-10-16' });
    expect(s).toMatch(/^[a-z0-9-]+--abc_1\.2$/);
    expect(idDesdeSlug(s)).toBe('abc_1.2');
  });

  it('rechaza slugs sin id o con id peligroso', () => {
    for (const malo of ['sin-id', '', 'a--', 'a--id con espacios', "a--id'; drop table", 'a--../../etc', 'a--' + 'x'.repeat(200), undefined, 7]) {
      expect(idDesdeSlug(malo as any)).toBeNull();
    }
  });

  it('urlConcierto cuelga de /e/', () => {
    expect(urlConcierto('https://bandmanager.io/', 'Banda', c)).toBe('https://bandmanager.io/e/banda-sala-capitol-2026-10-16--cnc-hdc-1');
  });
});

describe('baseUrlPublica', () => {
  it('usa APP_URL solo si es una URL http(s) válida y devuelve su origen', () => {
    expect(baseUrlPublica({ APP_URL: 'https://bandmanager.io/algo/' })).toBe('https://bandmanager.io');
    expect(baseUrlPublica({ APP_URL: 'http://localhost:3000' })).toBe('http://localhost:3000');
  });
  it('cae en producción con valores ausentes o basura', () => {
    for (const APP_URL of [undefined, '', 'MY_APP_URL', 'javascript:alert(1)']) {
      expect(baseUrlPublica({ APP_URL })).toBe('https://bandmanager.io');
    }
  });
});

describe('JSON-LD', () => {
  it('es un MusicEvent con lo que Google exige', () => {
    const ld = construirJsonLd(datos) as any;
    expect(ld['@type']).toBe('MusicEvent');
    expect(ld.name).toBe('Os Herdeiros do Código en Sala Capitol');
    expect(ld.startDate).toBe('2026-10-16');
    expect(ld.location.name).toBe('Sala Capitol');
    expect(ld.location.address.addressLocality).toBe('Santiago de Compostela');
    expect(ld.performer.name).toBe('Os Herdeiros do Código');
    expect(ld.offers.url).toBe('https://www.ticketmaster.es/event/1');
    expect(ld.image).toEqual(['https://cdn.example.com/cartel.jpg', 'https://cdn.example.com/logo.png']);
  });

  it('la oferta usa el enlace DIRECTO, no el corto con atribución', () => {
    const ld = construirJsonLd(datos) as any;
    expect(ld.offers.url).not.toContain('/r/');
  });

  it('sin entradas o con el concierto pasado no hay oferta', () => {
    expect((construirJsonLd({ ...datos, entradasDirectaUrl: null }) as any).offers).toBeUndefined();
    expect((construirJsonLd({ ...datos, pasado: true }) as any).offers).toBeUndefined();
    expect((construirJsonLd({ ...datos, entradasDirectaUrl: 'javascript:alert(1)' }) as any).offers).toBeUndefined();
  });

  it('un nombre con </script> no puede cerrar la etiqueta', () => {
    const s = jsonLdSeguro({ name: '</script><script>alert(1)</script>' });
    expect(s).not.toContain('</script>');
    expect(JSON.parse(s).name).toBe('</script><script>alert(1)</script>');
  });

  it('escapa los separadores de línea Unicode (rompen un <script> en algunos navegadores)', () => {
    const s = jsonLdSeguro({ name: 'a' + String.fromCharCode(0x2028) + 'b' + String.fromCharCode(0x2029) + 'c' });
    expect(s).not.toContain(String.fromCharCode(0x2028));
    expect(s).not.toContain(String.fromCharCode(0x2029));
    expect(JSON.parse(s).name).toBe('a' + String.fromCharCode(0x2028) + 'b' + String.fromCharCode(0x2029) + 'c');
  });
});

describe('renderizarPaginaConcierto', () => {
  it('lleva título, canónica, Open Graph, datos estructurados y el botón de entradas', () => {
    const html = renderizarPaginaConcierto(datos);
    expect(html).toContain('<title>Os Herdeiros do Código en Sala Capitol (Santiago de Compostela)');
    expect(html).toContain('<link rel="canonical" href="https://bandmanager.io/e/os-herdeiros-sala-capitol-2026-10-16--cnc-hdc-1">');
    expect(html).toContain('property="og:image" content="https://cdn.example.com/cartel.jpg"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('href="https://bandmanager.io/r/abcdefg"');
    expect(html).toContain('Comprar entradas');
    expect(html).toContain('index,follow');
    expect(html).toContain('Viernes, 16 de octubre de 2026');
    expect(html).toContain('Hecho con <a href="https://bandmanager.io/?ref=ABC123"');
  });

  it('NUNCA pinta datos privados aunque vengan en el objeto', () => {
    const html = renderizarPaginaConcierto({ ...datos, ...({ cache: 1500, notas: 'cobrar en B', contrato_firmado: true } as any) });
    expect(html).not.toContain('1500');
    expect(html).not.toContain('cobrar en B');
  });

  it('escapa todo el texto de la banda (sin inyección HTML)', () => {
    const html = renderizarPaginaConcierto({
      ...datos,
      bandaNombre: '<img src=x onerror=alert(1)>',
      sala: '"><script>alert(2)</script>',
      ciudad: "O'Brien & <b>Co</b>",
      direccion: '<i>calle</i>',
    });
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<b>Co</b>');
    expect(html).not.toContain('<i>calle</i>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('descarta URL con esquema peligroso en cualquier atributo', () => {
    const html = renderizarPaginaConcierto({
      ...datos,
      entradasHref: 'javascript:alert(1)',
      cartelUrl: 'data:text/html,<script>alert(1)</script>',
      logoUrl: 'javascript:alert(3)',
      insigniaHref: 'javascript:alert(4)',
    });
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="(javascript|data):/i);
    expect(html).toContain('Las entradas todavía no están a la venta.');
    expect(html).toContain('property="og:image" content="https://bandmanager.io/og-cover.png"');
  });

  it('un concierto pasado no se indexa, no vende entradas y no pide avisos', () => {
    const html = renderizarPaginaConcierto({ ...datos, pasado: true });
    expect(html).toContain('noindex,follow');
    expect(html).toContain('Este concierto ya ha pasado.');
    expect(html).not.toContain('Comprar entradas');
    expect(html).not.toContain('Avisadme');
  });

  it('sin enlace de entradas avisa en vez de enseñar un botón roto', () => {
    const html = renderizarPaginaConcierto({ ...datos, entradasHref: null });
    expect(html).toContain('Las entradas todavía no están a la venta.');
    expect(html).not.toContain('Comprar entradas');
  });

  it('no incluye insignia si la banda no la lleva', () => {
    expect(renderizarPaginaConcierto({ ...datos, insigniaHref: null })).not.toContain('Hecho con');
  });

  it('no usa bordes ni mayúsculas decorativas (identidad Espectro)', () => {
    const html = renderizarPaginaConcierto(datos);
    expect(html).not.toMatch(/border\s*:/);
    expect(html).not.toMatch(/text-transform\s*:\s*(uppercase|capitalize)/);
  });
});

describe('otras salidas', () => {
  it('«no encontrado» no indexa y no filtra nada', () => {
    const html = renderizarNoEncontrado('https://bandmanager.io');
    expect(html).toContain('noindex');
    expect(html).toContain('no está disponible');
  });

  it('el sitemap escapa y descarta URL no http', () => {
    const xml = renderizarSitemap([
      { loc: 'https://bandmanager.io/e/a?x=1&y=2', lastmod: '2026-10-16' },
      { loc: 'javascript:alert(1)' },
    ]);
    expect(xml).toContain('<loc>https://bandmanager.io/e/a?x=1&amp;y=2</loc>');
    expect(xml).toContain('<lastmod>2026-10-16</lastmod>');
    expect(xml).not.toContain('javascript');
    expect(xml.startsWith('<?xml')).toBe(true);
  });

  it('formatea fechas largas en español', () => {
    expect(fechaLarga('2026-10-16')).toBe('viernes, 16 de octubre de 2026');
  });
});

import { describe, expect, it } from 'vitest';
import { FESTIVALES } from '../festivales/datos.js';
import { renderizarFestival, renderizarIndiceFestivales } from '../festivales/render.js';
import type { Festival } from '../festivales/tipos.js';
import { DIAS_VALIDEZ, MIN_FICHAS_INDEXABLES, convocatoriaAbierta, estaVigente, festivalesVigentes, indexable } from '../festivales/vigencia.js';
import { entradasSeo } from '../sitemap.js';

const BASE = 'https://bandmanager.io';
const HOY = '2026-10-19';
const ficha = (n: number, extra: Partial<Festival> = {}): Festival => ({ ...FESTIVALES[0], slug: `f-${n}`, nombre: `Festival ${n}`, ...extra });

describe('datos del directorio de festivales', () => {
  it('cada ficha tiene slug seguro y único, fuente https y fecha de comprobación válida', () => {
    expect(new Set(FESTIVALES.map((f) => f.slug)).size).toBe(FESTIVALES.length);
    for (const f of FESTIVALES) {
      expect(f.slug).toMatch(/^[a-z0-9-]+$/);
      expect(f.fuente).toMatch(/^https:\/\//);
      expect(f.verificadoEn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.estilos.length).toBeGreaterThan(0);
      expect(f.descripcion.es.length).toBeGreaterThan(20);
      expect(f.descripcion.en.length).toBeGreaterThan(20);
      if (f.web) expect(f.web).toMatch(/^https:\/\//);
      if (f.convocatoria) expect(f.convocatoria.url).toMatch(/^https:\/\//);
    }
  });
  it('ninguna ficha se comprueba en el futuro', () => {
    for (const f of FESTIVALES) expect(f.verificadoEn <= new Date().toISOString().slice(0, 10)).toBe(true);
  });
});

describe('frescura y convocatorias', () => {
  it('una ficha caduca pasado el año sin comprobar', () => {
    const f = ficha(1, { verificadoEn: '2025-01-01' });
    expect(estaVigente(f, '2025-12-31')).toBe(true);
    expect(estaVigente(f, '2026-01-02')).toBe(false);
    expect(DIAS_VALIDEZ).toBe(365);
  });
  it('la convocatoria solo está abierta con plazo confirmado y no vencido', () => {
    const c = FESTIVALES[0].convocatoria!;
    expect(convocatoriaAbierta(ficha(1, { convocatoria: { ...c, cierre: '2026-10-19' } }), HOY)).toBe(true);
    expect(convocatoriaAbierta(ficha(1, { convocatoria: { ...c, cierre: '2026-10-18' } }), HOY)).toBe(false);
    expect(convocatoriaAbierta(ficha(1, { convocatoria: { ...c, cierre: undefined } }), HOY)).toBe(false);
    expect(convocatoriaAbierta(ficha(1, { convocatoria: undefined }), HOY)).toBe(false);
  });
  it('con pocas fichas vigentes el directorio va con noindex y fuera del sitemap', () => {
    expect(indexable(FESTIVALES, HOY)).toBe(false);
    expect(renderizarIndiceFestivales(BASE, 'es', HOY)).toContain('noindex,follow');
    expect(entradasSeo(BASE, HOY).some((e) => e.loc.includes('/festivales') || e.loc.includes('/festivals'))).toBe(false);
  });
  it('con fichas suficientes se indexa y entra en el sitemap con hreflang recíproco', () => {
    const muchas = Array.from({ length: MIN_FICHAS_INDEXABLES }, (_, i) => ficha(i));
    expect(festivalesVigentes(muchas, HOY)).toHaveLength(MIN_FICHAS_INDEXABLES);
    expect(indexable(muchas, HOY)).toBe(true);
    expect(renderizarIndiceFestivales(BASE, 'es', HOY, muchas)).toContain('index,follow');
  });
});

describe.each(['es', 'en'] as const)('páginas (%s)', (idioma) => {
  it('el índice lista las fichas vigentes y enlaza las dos versiones', () => {
    const html = renderizarIndiceFestivales(BASE, idioma, HOY);
    for (const f of FESTIVALES) expect(html).toContain(f.nombre.replace('&', '&amp;'));
    expect(html).toContain('hreflang="es"');
    expect(html).toContain('hreflang="en"');
  });
  it('una ficha escapa el texto, lleva JSON-LD y la fuente', () => {
    const f = ficha(1, { nombre: '<b>X</b> & Co', descripcion: { es: 'Descripción de prueba <script>', en: 'Test description <script>' } });
    const html = renderizarFestival(f, BASE, idioma, HOY);
    expect(html).not.toContain('<b>X</b>');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain(f.fuente);
    expect(html).toContain('application/ld+json');
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });
});

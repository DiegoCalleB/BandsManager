import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { htmlConIdioma, htmlConMetadatos, idiomaDeRuta, metadatosDeRuta, servirIndex } from '../cabeceraIdioma.js';

const HTML = `<!doctype html>
<html lang="es" class="x">
  <head>
    <title>BandManager.io</title>
    <meta name="description" content="Plataforma integral" />
    <meta property="og:title" content="Titulo" />
    <meta property="og:description" content="Desc" />
    <meta property="og:locale" content="es_ES" />
  </head>
</html>`;
const BASE = 'https://bandmanager.io';

describe('idiomaDeRuta', () => {
  it('reconoce la raíz y /en, con o sin barra final', () => {
    expect(idiomaDeRuta('/')).toBe('es');
    expect(idiomaDeRuta('/index.html')).toBe('es');
    expect(idiomaDeRuta('/en')).toBe('en');
    expect(idiomaDeRuta('/EN/')).toBe('en');
  });
  it('ignora el resto de rutas', () => {
    expect(idiomaDeRuta('/login')).toBeNull();
    expect(idiomaDeRuta('/en/algo')).toBeNull();
    expect(idiomaDeRuta('/e/mi-concierto')).toBeNull();
  });
});

describe('htmlConIdioma', () => {
  it('español: solo añade canonical y alternativas, no toca los textos', () => {
    const out = htmlConIdioma(HTML, 'es', BASE);
    expect(out).toContain('<html lang="es"');
    expect(out).toContain('<title>BandManager.io</title>');
    expect(out).toContain(`<link rel="canonical" href="${BASE}/" />`);
    expect(out).toContain(`hreflang="es" href="${BASE}/"`);
    expect(out).toContain(`hreflang="en" href="${BASE}/en"`);
    expect(out).toContain(`hreflang="x-default" href="${BASE}/"`);
  });
  it('inglés: cambia lang, título, descripciones y og:locale, y apunta el canonical a /en', () => {
    const out = htmlConIdioma(HTML, 'en', BASE);
    expect(out).toContain('<html lang="en"');
    expect(out).toContain('<title>BandManager.io — the manager in your pocket</title>');
    expect(out).toMatch(/name="description" content="Venues to write to/);
    expect(out).toContain('property="og:locale" content="en_US"');
    expect(out).toContain(`<link rel="canonical" href="${BASE}/en" />`);
    expect(out).not.toContain('es_ES');
  });
});

describe('servirIndex', () => {
  function respuesta() {
    const r = { cabeceras: {} as Record<string, string>, cuerpo: '', archivo: '' } as {
      cabeceras: Record<string, string>; cuerpo: string; archivo: string;
      setHeader?: (k: string, v: string) => void; type?: () => unknown; send?: (b: string) => void; sendFile?: (f: string) => void;
    };
    r.setHeader = (k, v) => { r.cabeceras[k] = v; };
    r.type = () => r;
    r.send = (b) => { r.cuerpo = b; };
    r.sendFile = (f) => { r.archivo = f; };
    return r;
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idx-'));
  fs.writeFileSync(path.join(dir, 'index.html'), HTML);

  it('/en devuelve el HTML en inglés y el resto de rutas el archivo tal cual', () => {
    const manejador = servirIndex(dir, BASE);
    const en = respuesta();
    manejador({ path: '/en' } as never, en as never);
    expect(en.cuerpo).toContain('<html lang="en"');
    expect(en.cabeceras['Cache-Control']).toBe('no-store');

    const otra = respuesta();
    manejador({ path: '/login' } as never, otra as never);
    expect(otra.archivo).toBe(path.join(dir, 'index.html'));
    expect(otra.cuerpo).toBe('');
  });
});

describe('servirIndex en /musicos', () => {
  it('sirve el HTML con metadatos propios y respeta ?lang=en', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idx-m-'));
    fs.writeFileSync(path.join(dir, 'index.html'), HTML);
    const r = { cuerpo: '', setHeader: () => undefined, type() { return this; }, send(b: string) { this.cuerpo = b; }, sendFile: () => undefined };
    servirIndex(dir, BASE)({ path: '/para-musicos', query: { lang: 'en' } } as never, r as never);
    expect(r.cuerpo).toContain(`<link rel="canonical" href="${BASE}/musicos?lang=en" />`);
    expect(r.cuerpo).toContain('<html lang="en"');
  });
});

describe('landing de músicos: metadatos propios y canónica única', () => {
  it.each(['/musicos', '/musicians', '/para-musicos', '/waitlist-musicos/', '/MUSICOS'])('%s apunta al mismo canónico', (ruta) => {
    const m = metadatosDeRuta(ruta, undefined, BASE)!;
    expect(m.ruta).toBe('/musicos');
    const out = htmlConMetadatos(HTML, m, BASE);
    expect(out).toContain(`<link rel="canonical" href="${BASE}/musicos" />`);
    expect(out).toContain('<title>BandManager.io para músicos y bandas independientes');
  });

  it('?lang=en cambia idioma, textos y canónica, y el par hreflang es recíproco', () => {
    const out = htmlConMetadatos(HTML, metadatosDeRuta('/musicos', 'en', BASE)!, BASE);
    expect(out).toContain('<html lang="en"');
    expect(out).toContain('property="og:locale" content="en_US"');
    expect(out).toContain(`<link rel="canonical" href="${BASE}/musicos?lang=en" />`);
    expect(out).toContain(`hreflang="es" href="${BASE}/musicos"`);
    expect(out).toContain(`hreflang="x-default" href="${BASE}/musicos"`);
  });

  it('un lang raro o con intento de inyección nunca llega al HTML', () => {
    const m = metadatosDeRuta('/musicos', '"><script>alert(1)</script>', BASE)!;
    expect(m.idioma).toBe('es');
    expect(htmlConMetadatos(HTML, m, BASE)).not.toContain('<script>');
  });

  it('no toca otras rutas', () => {
    expect(metadatosDeRuta('/epk', undefined, BASE)).toBeNull();
    expect(metadatosDeRuta('/musicos/otra', undefined, BASE)).toBeNull();
  });
});

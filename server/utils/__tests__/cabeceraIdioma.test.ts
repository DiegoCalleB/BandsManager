import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { htmlConIdioma, idiomaDeRuta, servirIndex } from '../cabeceraIdioma.js';

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

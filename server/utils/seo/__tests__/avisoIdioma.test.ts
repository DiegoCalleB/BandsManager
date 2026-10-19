import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import { CLAVE_AVISO, CLAVE_IDIOMA_APP, avisoIdiomaHtml, scriptAvisoIdioma } from '../avisoIdioma.js';
import { renderizarGuia, renderizarIndiceGuias } from '../render.js';
import { renderizarListados } from '../listados.js';
import { renderizarIndiceFestivales } from '../festivales/render.js';
import { renderizarPaginaRider } from '../../paginaRider.js';
import { GUIAS } from '../indice.js';
import type { IdiomaSeo } from '../rutas.js';

const BASE = 'https://bandmanager.io';

/** Ejecuta el script del aviso contra un DOM y un navegador falsos. */
function ejecutar(idiomaPagina: IdiomaSeo, idiomasNavegador: string[], almacen: Record<string, string> = {}) {
  const clics: Record<string, () => void> = {};
  const aviso: any = {
    hidden: true,
    querySelector: (s: string) => ({ addEventListener: (_e: string, f: () => void) => (clics[s] = f) }),
  };
  const contexto = {
    document: { getElementById: (id: string) => (id === 'aviso-idioma' ? aviso : null) },
    navigator: { languages: idiomasNavegador, language: idiomasNavegador[0] },
    localStorage: { getItem: (k: string) => almacen[k] ?? null, setItem: (k: string, v: string) => (almacen[k] = v) },
  };
  vm.runInNewContext(scriptAvisoIdioma(idiomaPagina), contexto);
  return { aviso, clics, almacen };
}

describe('aviso de idioma en las páginas públicas', () => {
  it('una página en español para un navegador en inglés o japonés muestra el aviso', () => {
    expect(ejecutar('es', ['en-US']).aviso.hidden).toBe(false);
    expect(ejecutar('es', ['ja-JP', 'en']).aviso.hidden).toBe(false);
  });
  it('una página en español para un navegador en español (o catalán, gallego, euskera) no lo muestra', () => {
    for (const l of ['es-ES', 'es-MX', 'ca-ES', 'gl', 'eu']) expect(ejecutar('es', [l]).aviso.hidden, l).toBe(true);
  });
  it('una página en inglés para un navegador en español sí lo muestra, y para uno en inglés no', () => {
    expect(ejecutar('en', ['es-ES']).aviso.hidden).toBe(false);
    expect(ejecutar('en', ['en-GB']).aviso.hidden).toBe(true);
    expect(ejecutar('en', ['ja']).aviso.hidden).toBe(true);
  });
  it('si ya lo cerró no vuelve a salir', () => {
    expect(ejecutar('es', ['en-US'], { [CLAVE_AVISO]: '1' }).aviso.hidden).toBe(true);
  });
  it('cerrarlo lo oculta y lo recuerda; aceptar fija el idioma de la app', () => {
    const a = ejecutar('es', ['en-US']);
    a.clics['button']();
    expect(a.aviso.hidden).toBe(true);
    expect(a.almacen[CLAVE_AVISO]).toBe('1');
    const b = ejecutar('es', ['en-US']);
    b.clics['a']();
    expect(b.almacen[CLAVE_IDIOMA_APP]).toBe('en');
    expect(b.almacen[CLAVE_AVISO]).toBe('1');
    const c = ejecutar('en', ['es-ES']);
    c.clics['a']();
    expect(c.almacen[CLAVE_IDIOMA_APP]).toBe('es');
  });
  it('sin el aviso en el DOM o con el almacenamiento bloqueado no falla', () => {
    expect(() => vm.runInNewContext(scriptAvisoIdioma('es'), { document: { getElementById: () => null }, navigator: { languages: ['en'] } })).not.toThrow();
    expect(() =>
      vm.runInNewContext(scriptAvisoIdioma('es'), {
        document: { getElementById: () => ({ hidden: true, querySelector: () => ({ addEventListener() {} }) }) },
        navigator: { languages: ['en'] },
        localStorage: { getItem() { throw new Error('bloqueado'); } },
      })
    ).not.toThrow();
  });
  it('el aviso va en el idioma al que invita y enlaza la otra versión, sin redirigir', () => {
    const es = avisoIdiomaHtml(BASE, 'es', '/en/guides/x');
    expect(es).toContain('Read in English');
    expect(es).toContain('href="https://bandmanager.io/en/guides/x"');
    expect(es).toContain(' hidden ');
    expect(avisoIdiomaHtml(BASE, 'en', '/guides/y')).toContain('Leer en español');
  });
  it.each(['es', 'en'] as const)('todas las páginas públicas de SEO (%s) llevan el aviso', (i) => {
    const paginas = [renderizarIndiceGuias(BASE, i), renderizarGuia(GUIAS[0], BASE, 'es'), renderizarListados(BASE, i), renderizarIndiceFestivales(BASE, i, '2026-10-19'), renderizarPaginaRider(BASE, i)];
    for (const html of paginas) {
      expect(html).toContain('id="aviso-idioma"');
      expect(html).not.toContain('http-equiv="refresh"');
    }
  });
});

describe('botón de idioma de la barra', () => {
  it('una página en español ofrece «English» y una en inglés ofrece «Español»', () => {
    expect(renderizarIndiceGuias(BASE, 'es')).toMatch(/hreflang="en" href="[^"]*">English<\/a>/);
    expect(renderizarIndiceGuias(BASE, 'en')).toMatch(/hreflang="es" href="[^"]*">Español<\/a>/);
  });
});

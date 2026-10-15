// Cabecera por idioma de la landing: `/` (español) y `/en` (inglés).
// El HTML de la SPA es el mismo para todas las rutas; aquí solo se ajusta el <head> para que
// Google vea el idioma de cada URL y sus alternativas (hreflang) sin ejecutar JavaScript.

import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';

export type IdiomaLanding = 'es' | 'en';

const TEXTOS_EN = {
  title: 'BandManager.io — the manager in your pocket',
  description:
    'Venues to write to, dates, repertoire, EPK and fans. Everything to play more and manage less: booking, tour logistics and finances for independent bands, with AI.',
  ogDescription: 'Venues to write to, dates, repertoire, EPK and fans. Everything to play more and manage less.',
};

/** Idioma de la landing para una ruta, o null si la ruta no es una landing con versión por idioma. */
export function idiomaDeRuta(ruta: string): IdiomaLanding | null {
  const limpia = ruta.split('?')[0].replace(/\/+$/, '').toLowerCase();
  if (limpia === '' || limpia === '/index.html') return 'es';
  if (limpia === '/en') return 'en';
  return null;
}

export function alternativasLanding(base: string): Array<{ hreflang: string; href: string }> {
  return [
    { hreflang: 'es', href: `${base}/` },
    { hreflang: 'en', href: `${base}/en` },
    { hreflang: 'x-default', href: `${base}/` },
  ];
}

function cambiarMeta(html: string, atributo: 'name' | 'property', clave: string, contenido: string): string {
  const patron = new RegExp(`(<meta ${atributo}="${clave}" content=")[^"]*(")`);
  return html.replace(patron, (_m, a: string, b: string) => `${a}${contenido}${b}`);
}

export function htmlConIdioma(html: string, idioma: IdiomaLanding, base: string): string {
  let salida = html;
  if (idioma === 'en') {
    salida = salida
      .replace('<html lang="es"', '<html lang="en"')
      .replace(/<title>[^<]*<\/title>/, `<title>${TEXTOS_EN.title}</title>`);
    salida = cambiarMeta(salida, 'name', 'description', TEXTOS_EN.description);
    salida = cambiarMeta(salida, 'property', 'og:title', TEXTOS_EN.title);
    salida = cambiarMeta(salida, 'property', 'og:description', TEXTOS_EN.ogDescription);
    salida = cambiarMeta(salida, 'property', 'og:locale', 'en_US');
  }
  const propia = idioma === 'en' ? `${base}/en` : `${base}/`;
  const enlaces = [
    `<link rel="canonical" href="${propia}" />`,
    ...alternativasLanding(base).map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`),
  ].join('\n    ');
  return salida.replace('</head>', `    ${enlaces}\n  </head>`);
}

/** Fallback de la SPA: index.html, con el <head> por idioma en `/` y `/en`. */
export function servirIndex(distPath: string, base: string) {
  const archivo = path.join(distPath, 'index.html');
  let html: string | null = null;
  return (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const idioma = idiomaDeRuta(req.path);
    if (idioma) {
      try {
        html ??= fs.readFileSync(archivo, 'utf8');
        res.type('html').send(htmlConIdioma(html, idioma, base));
        return;
      } catch {
        /* sin index.html legible se cae al sendFile, que informa del error */
      }
    }
    res.sendFile(archivo);
  };
}

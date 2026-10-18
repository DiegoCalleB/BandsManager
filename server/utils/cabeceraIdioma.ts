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

/* ---------------------------------------------------------------- landing de músicos */

// /musicos, /musicians, /para-musicos y /waitlist-musicos sirven la misma pantalla. Sin canónica Google
// las ve como cuatro páginas duplicadas y sin título propio. El idioma de esa pantalla lo decide `?lang=`
// (o el navegador), no la ruta, así que el par hreflang es /musicos y /musicos?lang=en.
const RUTA_MUSICOS = /^\/(musicos|musicians|para-musicos|waitlist-musicos)\/?$/i;

const TEXTOS_MUSICOS = {
  es: {
    title: 'BandManager.io para músicos y bandas independientes | Lista de espera',
    description: 'Captación de fans con QR en tus conciertos, dossier EPK interactivo y gestión de repertorio para bandas independientes. Apúntate y recibe acceso prioritario.',
    locale: 'es_ES',
  },
  en: {
    title: 'BandManager.io for independent musicians and bands | Waitlist',
    description: 'Live QR fan capture, an interactive EPK press kit and repertoire management for independent bands. Join the waitlist for priority access.',
    locale: 'en_US',
  },
} as const;

export interface MetadatosPagina {
  idioma: IdiomaLanding;
  /** Ruta canónica con su query (nunca contiene entrada del usuario: solo valores de esta tabla). */
  ruta: string;
  titulo: string;
  descripcion: string;
  locale: string;
  alternativas: Array<{ hreflang: string; href: string }>;
}

/** Metadatos propios de una ruta pública que no es la landing, o null si la ruta no tiene. */
export function metadatosDeRuta(ruta: string, lang: unknown, base: string): MetadatosPagina | null {
  if (!RUTA_MUSICOS.test(ruta.split('?')[0])) return null;
  const idioma: IdiomaLanding = typeof lang === 'string' && lang.toLowerCase() === 'en' ? 'en' : 'es';
  const t = TEXTOS_MUSICOS[idioma];
  return {
    idioma,
    ruta: idioma === 'en' ? '/musicos?lang=en' : '/musicos',
    titulo: t.title,
    descripcion: t.description,
    locale: t.locale,
    alternativas: [
      { hreflang: 'es', href: `${base}/musicos` },
      { hreflang: 'en', href: `${base}/musicos?lang=en` },
      { hreflang: 'x-default', href: `${base}/musicos` },
    ],
  };
}

export function htmlConMetadatos(html: string, m: MetadatosPagina, base: string): string {
  let salida = html
    .replace(/<html lang="[^"]*"/, `<html lang="${m.idioma}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${m.titulo}</title>`);
  salida = cambiarMeta(salida, 'name', 'description', m.descripcion);
  salida = cambiarMeta(salida, 'property', 'og:title', m.titulo);
  salida = cambiarMeta(salida, 'property', 'og:description', m.descripcion);
  salida = cambiarMeta(salida, 'property', 'og:locale', m.locale);
  const url = `${base}${m.ruta}`;
  const enlaces = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    ...m.alternativas.map((a) => `<link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`),
  ].join('\n    ');
  return salida.replace('</head>', `    ${enlaces}\n  </head>`);
}

/** Fallback de la SPA: index.html, con el <head> por idioma en `/` y `/en` y metadatos propios en /musicos. */
export function servirIndex(distPath: string, base: string) {
  const archivo = path.join(distPath, 'index.html');
  let html: string | null = null;
  return (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const idioma = idiomaDeRuta(req.path);
    const meta = idioma ? null : metadatosDeRuta(req.path, req.query?.lang, base);
    if (idioma || meta) {
      try {
        html ??= fs.readFileSync(archivo, 'utf8');
        res.type('html').send(idioma ? htmlConIdioma(html, idioma, base) : htmlConMetadatos(html, meta!, base));
        return;
      } catch {
        /* sin index.html legible se cae al sendFile, que informa del error */
      }
    }
    res.sendFile(archivo);
  };
}

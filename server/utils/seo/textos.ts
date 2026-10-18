/** Textos de interfaz de las páginas de SEO (el contenido de cada guía vive en sus propios ficheros). */
import type { IdiomaSeo } from './rutas.js';

interface TextosSeo {
  ogLocale: string;
  inicio: string;
  guias: string;
  faq: string;
  seguirLeyendo: string;
  otroIdiomaEtiqueta: string;
  lectura: (minutos: number) => string;
  resumen: string;
  enEstaGuia: string;
  actualizado: (fecha: string) => string;
  indiceTitulo: string;
  indiceDescripcion: string;
  indiceH1: string;
  indiceIntro: string;
  riderTitulo: string;
  riderResumen: string;
  noEncontradaTitulo: string;
  noEncontradaH1: string;
  noEncontradaIntro: string;
  verTodas: string;
  lema: string;
}

export const TEXTOS: Record<IdiomaSeo, TextosSeo> = {
  es: {
    ogLocale: 'es_ES',
    inicio: 'BandManager',
    guias: 'Guías',
    faq: 'Preguntas frecuentes',
    seguirLeyendo: 'Sigue leyendo',
    otroIdiomaEtiqueta: 'English',
    lectura: (m) => `${m} min de lectura`,
    resumen: 'En resumen',
    enEstaGuia: 'En esta guía',
    actualizado: (f) => `Actualizado el ${f}`,
    indiceTitulo: 'Guías y plantillas para bandas de música | BandManager',
    indiceDescripcion: 'Guías prácticas para bandas independientes: cómo hacer un EPK, conseguir bolos, escribir a las salas, cobrar, repartir el dinero y organizar la gira.',
    indiceH1: 'Guías y plantillas para bandas',
    indiceIntro: 'Lo que aprendemos hablando con bandas independientes, sin humo: pasos concretos para tocar más y gestionar menos.',
    riderTitulo: 'Plantilla de rider técnico',
    riderResumen: 'Rellénala, imprímela o guárdala en PDF.',
    noEncontradaTitulo: 'Guía no encontrada · BandManager',
    noEncontradaH1: 'Esta guía no existe',
    noEncontradaIntro: 'Puede que la hayamos movido.',
    verTodas: 'Ver todas las guías',
    lema: 'el mánager que llevas en el bolsillo',
  },
  en: {
    ogLocale: 'en_US',
    inicio: 'BandManager',
    guias: 'Guides',
    faq: 'Frequently asked questions',
    seguirLeyendo: 'Keep reading',
    otroIdiomaEtiqueta: 'Español',
    lectura: (m) => `${m} min read`,
    resumen: 'In short',
    enEstaGuia: 'In this guide',
    actualizado: (f) => `Updated ${f}`,
    indiceTitulo: 'Guides and templates for bands | BandManager',
    indiceDescripcion: 'Practical guides for independent bands: how to build an EPK, get gigs, email venues, set your fee, split the money and plan a tour.',
    indiceH1: 'Guides and templates for bands',
    indiceIntro: 'What we learn talking to independent bands, no fluff: concrete steps to play more and manage less.',
    riderTitulo: 'Technical rider template',
    riderResumen: 'Fill it in, print it or save it as a PDF.',
    noEncontradaTitulo: 'Guide not found · BandManager',
    noEncontradaH1: "This guide doesn't exist",
    noEncontradaIntro: 'We may have moved it.',
    verTodas: 'See all guides',
    lema: 'the manager in your pocket',
  },
};

/**
 * Fecha (AAAA-MM-DD) de la última revisión del contenido de las guías. Se muestra en la página, va como
 * `dateModified` en el JSON-LD y como `lastmod` en el sitemap: actualízala SOLO cuando se revise el texto.
 */
export const FECHA_CONTENIDO = '2026-10-18';

export function fechaLegible(idioma: IdiomaSeo, iso: string = FECHA_CONTENIDO): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(idioma === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

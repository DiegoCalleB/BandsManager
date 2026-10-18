/** `<head>` y barra superior comunes a las páginas de SEO, con `hreflang` y `og:locale` por idioma. */
import { escapeHtml } from '../html.js';
import { jsonLdSeguro } from '../paginaConcierto.js';
import { ESTILOS_PAGINA_PUBLICA } from './estilos.js';
import { OTRO_IDIOMA, RUTAS, type IdiomaSeo } from './rutas.js';
import { TEXTOS } from './textos.js';

export interface OpcionesCabeza {
  base: string;
  idioma: IdiomaSeo;
  ruta: string;
  titulo: string;
  descripcion: string;
  jsonLd: unknown;
  tipoOg: 'article' | 'website';
  alternativas: Array<{ hreflang: string; href: string }>;
}

export function cabezaHtml(o: OpcionesCabeza): string {
  const url = `${o.base}${o.ruta}`;
  const alternas = o.alternativas.map((a) => `<link rel="alternate" hreflang="${escapeHtml(a.hreflang)}" href="${escapeHtml(a.href)}">`).join('\n');
  return `<!doctype html>
<html lang="${o.idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(o.titulo)}</title>
<meta name="description" content="${escapeHtml(o.descripcion)}">
<link rel="canonical" href="${escapeHtml(url)}">
${alternas}
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="${o.tipoOg}">
<meta property="og:site_name" content="BandManager">
<meta property="og:locale" content="${TEXTOS[o.idioma].ogLocale}">
<meta property="og:title" content="${escapeHtml(o.titulo)}">
<meta property="og:description" content="${escapeHtml(o.descripcion)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(o.base)}/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F7F9">
<script type="application/ld+json">${jsonLdSeguro(o.jsonLd)}</script>
<style>${ESTILOS_PAGINA_PUBLICA}</style>
</head>`;
}

/** Marca a la izquierda y enlace a la misma página en el otro idioma a la derecha. */
export function barraHtml(base: string, idioma: IdiomaSeo, hrefOtroIdioma: string): string {
  const otro = OTRO_IDIOMA[idioma];
  return `<div class="barra no-imprimir"><a href="${escapeHtml(base)}${RUTAS[idioma].landing}">BandManager.io</a><a class="idioma" lang="${otro}" hreflang="${otro}" href="${escapeHtml(base)}${escapeHtml(hrefOtroIdioma)}">${TEXTOS[otro].otroIdiomaEtiqueta}</a></div>`;
}

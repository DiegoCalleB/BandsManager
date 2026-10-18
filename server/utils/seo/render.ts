/**
 * Renderizador de las guías de SEO (`/guias` y `/guias/<slug>`), en el servidor y sin I/O.
 * Mismo criterio que `paginaConcierto.ts`: HTML completo para Google sin ejecutar JavaScript, todo
 * texto pasa por `escapeHtml` y el JSON-LD se serializa con `jsonLdSeguro`.
 */
import { escapeHtml } from '../html.js';
import { jsonLdSeguro } from '../paginaConcierto.js';
import { ESTILOS_PAGINA_PUBLICA, RUTA_PLANTILLA_RIDER } from '../paginaRider.js';
import { GUIAS, enlaceDeRelacionada, guiaPorSlug } from './indice.js';
import type { GuiaSeo, SeccionGuia } from './tipos.js';

export const RUTA_GUIAS = '/guias';

const ESTILOS_EXTRA = `
ol.pasos{margin:0 0 .9rem;padding-left:1.4rem}ol.pasos li{margin:0 0 .5rem}
ul.vinetas{margin:0 0 .9rem;padding-left:1.2rem}ul.vinetas li{margin:0 0 .35rem}
.migas{font-size:13px;color:var(--ink-2);margin:0 0 .5rem}.migas a{color:var(--ink-2)}
.rel{display:grid;gap:.5rem;margin:.5rem 0 0;padding:0;list-style:none}
.rel a{display:block;padding:.8rem 1rem;border-radius:18px;background:var(--surface);color:var(--ink);text-decoration:none;font-weight:600}
.rel small{display:block;font-weight:400;color:var(--ink-2)}
section.seccion{margin:1.5rem 0}
`;

function cabeza(base: string, ruta: string, titulo: string, descripcion: string, jsonLd: unknown, tipoOg: 'article' | 'website'): string {
  const url = `${base}${ruta}`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descripcion)}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="${tipoOg}">
<meta property="og:site_name" content="BandManager">
<meta property="og:title" content="${escapeHtml(titulo)}">
<meta property="og:description" content="${escapeHtml(descripcion)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(base)}/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F6F7F9">
<script type="application/ld+json">${jsonLdSeguro(jsonLd)}</script>
<style>${ESTILOS_PAGINA_PUBLICA}${ESTILOS_EXTRA}</style>
</head>`;
}

function seccion(s: SeccionGuia): string {
  const parrafos = (s.parrafos ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const lista = s.lista ? `<ul class="vinetas">${s.lista.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '';
  const pasos = s.pasos ? `<ol class="pasos">${s.pasos.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>` : '';
  return `<section class="seccion"><h2>${escapeHtml(s.h2)}</h2>${parrafos}${lista}${pasos}</section>`;
}

function pie(base: string): string {
  return `<p class="pie"><a href="${escapeHtml(base)}/">BandManager.io</a> · <a href="${escapeHtml(base)}${RUTA_GUIAS}">Guías para bandas</a></p>`;
}

export function renderizarGuia(g: GuiaSeo, base: string): string {
  const ruta = `${RUTA_GUIAS}/${g.slug}`;
  const registro = `${base}/?utm_source=seo&utm_medium=guia&utm_campaign=${encodeURIComponent(g.slug)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: g.h1,
        description: g.descripcion,
        inLanguage: 'es',
        mainEntityOfPage: `${base}${ruta}`,
        publisher: { '@type': 'Organization', name: 'BandManager.io', url: base },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'BandManager', item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Guías', item: `${base}${RUTA_GUIAS}` },
          { '@type': 'ListItem', position: 3, name: g.h1, item: `${base}${ruta}` },
        ],
      },
      { '@type': 'FAQPage', mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  const relacionadas = g.relacionadas.map(enlaceDeRelacionada).filter((r): r is NonNullable<typeof r> => !!r);
  return `${cabeza(base, ruta, g.titulo, g.descripcion, jsonLd, 'article')}
<body>
<main>
<p class="migas"><a href="${escapeHtml(base)}${RUTA_GUIAS}">Guías</a> › ${escapeHtml(g.h1)}</p>
<h1>${escapeHtml(g.h1)}</h1>
<p class="intro">${escapeHtml(g.intro)}</p>
${g.secciones.map(seccion).join('\n')}
<section class="seccion"><h2>Preguntas frecuentes</h2>
${g.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join('')}
</section>
<div class="cta">
<h2>${escapeHtml(g.cta.titulo)}</h2>
<p>${escapeHtml(g.cta.texto)}</p>
<div class="acciones"><a class="boton" href="${escapeHtml(registro)}">${escapeHtml(g.cta.boton)}</a></div>
</div>
${relacionadas.length ? `<section class="seccion"><h2>Sigue leyendo</h2><ul class="rel">${relacionadas.map((r) => `<li><a href="${escapeHtml(base)}${escapeHtml(r.ruta)}">${escapeHtml(r.titulo)}<small>${escapeHtml(r.resumen)}</small></a></li>`).join('')}</ul></section>` : ''}
${pie(base)}
</main>
</body>
</html>`;
}

export function renderizarIndiceGuias(base: string): string {
  const titulo = 'Guías y plantillas para bandas de música | BandManager';
  const descripcion = 'Guías prácticas para bandas independientes: cómo hacer un EPK, conseguir bolos, escribir a las salas, cobrar, repartir el dinero y organizar la gira.';
  const items = [{ ruta: RUTA_PLANTILLA_RIDER, titulo: 'Plantilla de rider técnico', resumen: 'Rellénala, imprímela o guárdala en PDF.' }, ...GUIAS.map((g) => ({ ruta: `${RUTA_GUIAS}/${g.slug}`, titulo: g.h1, resumen: g.descripcion }))];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: titulo,
    url: `${base}${RUTA_GUIAS}`,
    inLanguage: 'es',
    hasPart: items.map((i) => ({ '@type': 'WebPage', name: i.titulo, url: `${base}${i.ruta}` })),
  };
  return `${cabeza(base, RUTA_GUIAS, titulo, descripcion, jsonLd, 'website')}
<body>
<main>
<h1>Guías y plantillas para bandas</h1>
<p class="intro">Lo que aprendemos hablando con bandas independientes, sin humo: pasos concretos para tocar más y gestionar menos.</p>
<ul class="rel">${items.map((i) => `<li><a href="${escapeHtml(base)}${escapeHtml(i.ruta)}">${escapeHtml(i.titulo)}<small>${escapeHtml(i.resumen)}</small></a></li>`).join('')}</ul>
${pie(base)}
</main>
</body>
</html>`;
}

export function renderizarGuiaNoEncontrada(base: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Guía no encontrada · BandManager</title><meta name="robots" content="noindex"><style>${ESTILOS_PAGINA_PUBLICA}</style></head>
<body><main><h1>Esta guía no existe</h1><p class="intro">Puede que la hayamos movido.</p><div class="acciones"><a class="boton suave" href="${escapeHtml(base)}${RUTA_GUIAS}">Ver todas las guías</a></div></main></body></html>`;
}

export { guiaPorSlug };

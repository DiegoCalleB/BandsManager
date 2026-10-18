/**
 * Renderizador de las guías de SEO (`/guias`, `/en/guides` y sus guías), en el servidor y sin I/O.
 * Mismo criterio que `paginaConcierto.ts`: HTML completo para Google sin ejecutar JavaScript, todo
 * texto pasa por `escapeHtml` y el JSON-LD se serializa con `jsonLdSeguro`.
 */
import { escapeHtml } from '../html.js';
import { slugify } from '../slug.js';
import { barraHtml, cabezaHtml } from './cabeza.js';
import { ESTILOS_PAGINA_PUBLICA } from './estilos.js';
import { enlaceDeRelacionada, guiasDe, slugEquivalente } from './indice.js';
import { RUTAS, alternativasPar, type IdiomaSeo } from './rutas.js';
import { FECHA_CONTENIDO, TEXTOS, fechaLegible } from './textos.js';
import type { GuiaSeo, SeccionGuia } from './tipos.js';

export const RUTA_GUIAS = RUTAS.es.guias;

/** Ancla de cada sección: el slug del h2, con sufijo si se repite. Es estable mientras no cambie el título. */
export function anclasDe(secciones: SeccionGuia[]): string[] {
  const vistas = new Set<string>();
  return secciones.map((s, i) => {
    const base = slugify(s.h2) || `seccion-${i + 1}`;
    let id = base;
    for (let n = 2; vistas.has(id); n++) id = `${base}-${n}`;
    vistas.add(id);
    return id;
  });
}

function seccion(s: SeccionGuia, id: string): string {
  const parrafos = (s.parrafos ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const lista = s.lista ? `<ul class="vinetas">${s.lista.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '';
  const pasos = s.pasos ? `<ol class="pasos">${s.pasos.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>` : '';
  return `<section class="seccion"><h2 id="${escapeHtml(id)}">${escapeHtml(s.h2)}</h2>${parrafos}${lista}${pasos}</section>`;
}

function pie(base: string, idioma: IdiomaSeo): string {
  const t = TEXTOS[idioma];
  return `<p class="pie"><a href="${escapeHtml(base)}${RUTAS[idioma].landing}">BandManager.io</a> · <a href="${escapeHtml(base)}${RUTAS[idioma].guias}">${escapeHtml(t.guias)}</a> · ${escapeHtml(t.lema)}</p>`;
}

/** Minutos de lectura a ~200 palabras por minuto (nunca menos de 1). */
export function minutosDeLectura(g: GuiaSeo): number {
  const texto = [g.intro, ...g.secciones.flatMap((s) => [...(s.parrafos ?? []), ...(s.lista ?? []), ...(s.pasos ?? [])]), ...g.faq.flatMap((f) => [f.q, f.a])].join(' ');
  return Math.max(1, Math.round(texto.split(/\s+/).length / 200));
}

function enlaceRegistro(base: string, idioma: IdiomaSeo, slug: string): string {
  return `${base}${idioma === 'en' ? '/en' : '/'}?utm_source=seo&utm_medium=guia&utm_campaign=${encodeURIComponent(slug)}`;
}

/** Pares de rutas (es, en) de una guía; sirve para el `hreflang` y para el sitemap. */
export function rutasDeGuia(g: GuiaSeo, idioma: IdiomaSeo): { es: string; en: string } | null {
  const otro = slugEquivalente(g.slug, idioma);
  if (!otro) return null;
  return idioma === 'es' ? { es: RUTAS.es.guia(g.slug), en: RUTAS.en.guia(otro) } : { es: RUTAS.es.guia(otro), en: RUTAS.en.guia(g.slug) };
}

export function renderizarGuia(g: GuiaSeo, base: string, idioma: IdiomaSeo = 'es'): string {
  const t = TEXTOS[idioma];
  const rutas = RUTAS[idioma];
  const ruta = rutas.guia(g.slug);
  const par = rutasDeGuia(g, idioma);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: g.h1, description: g.descripcion, inLanguage: idioma, mainEntityOfPage: `${base}${ruta}`, image: `${base}/og-cover.png`, dateModified: FECHA_CONTENIDO, author: { '@type': 'Organization', name: 'BandManager.io', url: base }, publisher: { '@type': 'Organization', name: 'BandManager.io', url: base } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.inicio, item: `${base}${rutas.landing}` },
          { '@type': 'ListItem', position: 2, name: t.guias, item: `${base}${rutas.guias}` },
          { '@type': 'ListItem', position: 3, name: g.h1, item: `${base}${ruta}` },
        ],
      },
      { '@type': 'FAQPage', mainEntity: g.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  };
  const anclas = anclasDe(g.secciones);
  const relacionadas = g.relacionadas.map((r) => enlaceDeRelacionada(r, idioma)).filter((r): r is NonNullable<typeof r> => !!r);
  return `${cabezaHtml({ base, idioma, ruta, titulo: g.titulo, descripcion: g.descripcion, jsonLd, tipoOg: 'article', alternativas: par ? alternativasPar(base, par.es, par.en) : [] })}
<body>
<main>
${barraHtml(base, idioma, par ? (idioma === 'es' ? par.en : par.es) : RUTAS[idioma === 'es' ? 'en' : 'es'].guias)}
<p class="migas"><a href="${escapeHtml(base)}${rutas.guias}">${escapeHtml(t.guias)}</a> › ${escapeHtml(g.h1)}</p>
<h1>${escapeHtml(g.h1)}</h1>
<p class="lectura">${escapeHtml(t.lectura(minutosDeLectura(g)))} · <time datetime="${FECHA_CONTENIDO}">${escapeHtml(t.actualizado(fechaLegible(idioma)))}</time></p>
<p class="intro">${escapeHtml(g.intro)}</p>
<aside class="resumen"><h2>${escapeHtml(t.resumen)}</h2><ul>${g.resumen.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></aside>
${g.secciones.length >= 4 ? `<nav class="toc" aria-label="${escapeHtml(t.enEstaGuia)}"><p>${escapeHtml(t.enEstaGuia)}</p><ol>${g.secciones.map((x, i) => `<li><a href="#${escapeHtml(anclas[i])}">${escapeHtml(x.h2)}</a></li>`).join('')}<li><a href="#faq">${escapeHtml(t.faq)}</a></li></ol></nav>` : ''}
${g.secciones.map((x, i) => seccion(x, anclas[i])).join('\n')}
<section class="seccion"><h2 id="faq">${escapeHtml(t.faq)}</h2>
${g.faq.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join('')}
</section>
<div class="cta">
<h2>${escapeHtml(g.cta.titulo)}</h2>
<p>${escapeHtml(g.cta.texto)}</p>
<div class="acciones"><a class="boton" href="${escapeHtml(enlaceRegistro(base, idioma, g.slug))}">${escapeHtml(g.cta.boton)}</a></div>
</div>
${relacionadas.length ? `<section class="seccion"><h2>${escapeHtml(t.seguirLeyendo)}</h2><ul class="rel">${relacionadas.map((r) => `<li><a href="${escapeHtml(base)}${escapeHtml(r.ruta)}">${escapeHtml(r.titulo)}<small>${escapeHtml(r.resumen)}</small></a></li>`).join('')}</ul></section>` : ''}
${pie(base, idioma)}
</main>
</body>
</html>`;
}

export function renderizarIndiceGuias(base: string, idioma: IdiomaSeo = 'es'): string {
  const t = TEXTOS[idioma];
  const rutas = RUTAS[idioma];
  const items = [
    { ruta: rutas.rider, titulo: t.riderTitulo, resumen: t.riderResumen },
    ...guiasDe(idioma).map((g) => ({ ruta: rutas.guia(g.slug), titulo: g.h1, resumen: g.descripcion })),
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.indiceTitulo,
    url: `${base}${rutas.guias}`,
    inLanguage: idioma,
    hasPart: items.map((i) => ({ '@type': 'WebPage', name: i.titulo, url: `${base}${i.ruta}` })),
  };
  return `${cabezaHtml({ base, idioma, ruta: rutas.guias, titulo: t.indiceTitulo, descripcion: t.indiceDescripcion, jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, RUTAS.es.guias, RUTAS.en.guias) })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].guias)}
<h1>${escapeHtml(t.indiceH1)}</h1>
<p class="intro">${escapeHtml(t.indiceIntro)}</p>
<ul class="rel">${items.map((i) => `<li><a href="${escapeHtml(base)}${escapeHtml(i.ruta)}">${escapeHtml(i.titulo)}<small>${escapeHtml(i.resumen)}</small></a></li>`).join('')}</ul>
${pie(base, idioma)}
</main>
</body>
</html>`;
}

export function renderizarGuiaNoEncontrada(base: string, idioma: IdiomaSeo = 'es'): string {
  const t = TEXTOS[idioma];
  return `<!doctype html>
<html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(t.noEncontradaTitulo)}</title><meta name="robots" content="noindex"><style>${ESTILOS_PAGINA_PUBLICA}</style></head>
<body><main><h1>${escapeHtml(t.noEncontradaH1)}</h1><p class="intro">${escapeHtml(t.noEncontradaIntro)}</p><div class="acciones"><a class="boton suave" href="${escapeHtml(base)}${RUTAS[idioma].guias}">${escapeHtml(t.verTodas)}</a></div></main></body></html>`;
}

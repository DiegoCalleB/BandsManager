/** Directorio público de festivales (`/festivales`, `/en/festivals`): HTML completo en servidor, sin I/O. */
import { escapeHtml } from '../../html.js';
import { barraHtml, cabezaHtml } from '../cabeza.js';
import { ESTILOS_PAGINA_PUBLICA } from '../estilos.js';
import { slugEquivalente } from '../indice.js';
import { RUTAS, alternativasPar, registroUrl, type IdiomaSeo } from '../rutas.js';
import { TEXTOS, fechaLegible } from '../textos.js';
import { FESTIVALES } from './datos.js';
import { ESTILOS, TEXTOS_FESTIVALES } from './textos.js';
import type { Festival } from './tipos.js';
import { convocatoriaAbierta, festivalesVigentes, indexable } from './vigencia.js';

const NOINDEX = 'noindex,follow';
const SLUG_GUIA_FESTIVAL = 'presentar-banda-festival';

const lugar = (f: Festival) => `${f.ciudad} (${f.provincia})`;
const rangoEdicion = (f: Festival, idioma: IdiomaSeo): string => (f.edicion ? `${fechaLegible(idioma, f.edicion.inicio)} – ${fechaLegible(idioma, f.edicion.fin)}` : '');

function estadoConvocatoria(f: Festival, hoy: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  if (!f.convocatoria) return t.sinConvocatoria;
  if (!f.convocatoria.cierre) return t.sinPlazo;
  return convocatoriaAbierta(f, hoy) ? `${t.abierta} · ${fechaLegible(idioma, f.convocatoria.cierre)}` : t.cerrada;
}

const tarjeta = (f: Festival, base: string, idioma: IdiomaSeo, hoy: string) =>
  `<li><a href="${escapeHtml(base)}${escapeHtml(RUTAS[idioma].festival(f.slug))}">${escapeHtml(f.nombre)}<small>${escapeHtml(`${lugar(f)} · ${estadoConvocatoria(f, hoy, idioma)}`)}</small></a></li>`;

export function renderizarIndiceFestivales(base: string, idioma: IdiomaSeo, hoy: string, todos: readonly Festival[] = FESTIVALES): string {
  const t = TEXTOS_FESTIVALES[idioma];
  const rutas = RUTAS[idioma];
  const vigentes = festivalesVigentes(todos, hoy);
  const abiertas = vigentes.filter((f) => convocatoriaAbierta(f, hoy));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.h1,
    url: `${base}${rutas.festivales}`,
    inLanguage: idioma,
    hasPart: vigentes.map((f) => ({ '@type': 'WebPage', name: f.nombre, url: `${base}${rutas.festival(f.slug)}` })),
  };
  return `${cabezaHtml({ base, idioma, ruta: rutas.festivales, titulo: t.titulo, descripcion: t.descripcion, jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, RUTAS.es.festivales, RUTAS.en.festivales), robots: indexable(todos, hoy) ? undefined : NOINDEX })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].festivales, 'festivales')}
<h1>${escapeHtml(t.h1)}</h1>
<p class="intro">${escapeHtml(t.intro)}</p>
<section class="seccion"><h2>${escapeHtml(t.abiertas)}</h2>
${abiertas.length ? `<ul class="rel">${abiertas.map((f) => tarjeta(f, base, idioma, hoy)).join('')}</ul>` : `<p>${escapeHtml(t.sinAbiertas)}</p>`}
</section>
<section class="seccion"><h2>${escapeHtml(t.todos)}</h2>
<ul class="rel">${vigentes.map((f) => tarjeta(f, base, idioma, hoy)).join('')}</ul>
</section>
<section class="seccion"><h2>${escapeHtml(t.metodo)}</h2><p>${escapeHtml(t.metodoTexto)}</p></section>
<p class="pie"><a href="${escapeHtml(base)}${rutas.landing}">BandManager.io</a> · <a href="${escapeHtml(base)}${rutas.guias}">${escapeHtml(TEXTOS[idioma].guias)}</a> · ${escapeHtml(TEXTOS[idioma].lema)}</p>
</main>
</body>
</html>`;
}

export function renderizarFestival(f: Festival, base: string, idioma: IdiomaSeo, hoy: string, todos: readonly Festival[] = FESTIVALES): string {
  const t = TEXTOS_FESTIVALES[idioma];
  const rutas = RUTAS[idioma];
  const ruta = rutas.festival(f.slug);
  const guiaSlug = idioma === 'es' ? SLUG_GUIA_FESTIVAL : slugEquivalente(SLUG_GUIA_FESTIVAL, 'es');
  const filas: Array<[string, string]> = [
    [t.dondeEsta, lugar(f)],
    [t.estilo, f.estilos.map((e) => ESTILOS[idioma][e]).join(', ')],
    ...(f.edicion ? ([[t.edicion, rangoEdicion(f, idioma)]] as Array<[string, string]>) : []),
    [t.convocatoria, estadoConvocatoria(f, hoy, idioma)],
    [t.verificado, fechaLegible(idioma, f.verificadoEn)],
  ];
  const evento = f.edicion
    ? { '@type': 'Festival', name: f.nombre, startDate: f.edicion.inicio, endDate: f.edicion.fin, ...(f.web ? { url: f.web } : {}), location: { '@type': 'Place', name: f.ciudad, address: { '@type': 'PostalAddress', addressLocality: f.ciudad, addressRegion: f.provincia, addressCountry: f.pais } } }
    : { '@type': 'WebPage', name: f.nombre, url: `${base}${ruta}`, inLanguage: idioma };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      evento,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: TEXTOS[idioma].inicio, item: `${base}${rutas.landing}` },
        { '@type': 'ListItem', position: 2, name: t.h1, item: `${base}${rutas.festivales}` },
        { '@type': 'ListItem', position: 3, name: f.nombre, item: `${base}${ruta}` },
      ] },
    ],
  };
  const descripcion = `${f.descripcion[idioma]} ${f.convocatoria ? estadoConvocatoria(f, hoy, idioma) : ''}`.trim().slice(0, 160);
  return `${cabezaHtml({ base, idioma, ruta, titulo: t.tituloFicha(f.nombre, f.ciudad).slice(0, 70), descripcion, jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, RUTAS.es.festival(f.slug), RUTAS.en.festival(f.slug)), robots: indexable(todos, hoy) ? undefined : NOINDEX })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].festival(f.slug), f.slug)}
<p class="migas"><a href="${escapeHtml(base)}${rutas.festivales}">${escapeHtml(t.h1)}</a> › ${escapeHtml(f.nombre)}</p>
<ul class="etiquetas">${f.estilos.map((e) => `<li>${escapeHtml(ESTILOS[idioma][e])}</li>`).join('')}</ul>
<h1>${escapeHtml(f.nombre)}</h1>
<p class="intro">${escapeHtml(f.descripcion[idioma])}</p>
<div class="scroll"><table class="tabla"><tbody>${filas.map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody></table></div>
${f.convocatoria ? `<section class="seccion"><h2>${escapeHtml(t.convocatoria)}</h2><p>${escapeHtml(f.convocatoria.resumen[idioma])}</p><div class="acciones"><a class="boton suave" rel="noopener" href="${escapeHtml(f.convocatoria.url)}">${escapeHtml(t.verBases)}</a></div></section>` : ''}
<p class="aviso"><strong>${escapeHtml(t.consejo)}.</strong> ${escapeHtml(t.consejoTexto)}${guiaSlug ? ` <a href="${escapeHtml(base)}${escapeHtml(rutas.guia(guiaSlug))}">${escapeHtml(t.guia)}</a>.` : ''}</p>
<p class="lectura">${escapeHtml(t.fuente)}: <a rel="noopener" href="${escapeHtml(f.fuente)}">${escapeHtml(new URL(f.fuente).hostname)}</a>${f.web ? ` · <a rel="noopener" href="${escapeHtml(f.web)}">${escapeHtml(t.web)}</a>` : ''}</p>
<div class="cta">
<h2>${escapeHtml(t.ctaTitulo)}</h2>
<p>${escapeHtml(t.ctaTexto)}</p>
<div class="acciones"><a class="boton" href="${escapeHtml(registroUrl(base, idioma, 'festival', f.slug))}">${escapeHtml(t.ctaBoton)}</a></div>
</div>
<p class="pie"><a href="${escapeHtml(base)}${rutas.festivales}">${escapeHtml(t.volver)}</a> · ${escapeHtml(TEXTOS[idioma].lema)}</p>
</main>
</body>
</html>`;
}

export function renderizarFestivalNoEncontrado(base: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  return `<!doctype html>
<html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(t.noEncontradoTitulo)}</title><meta name="robots" content="noindex"><style>${ESTILOS_PAGINA_PUBLICA}</style></head>
<body><main><h1>${escapeHtml(t.noEncontradoH1)}</h1><p class="intro">${escapeHtml(t.noEncontradoIntro)}</p><div class="acciones"><a class="boton suave" href="${escapeHtml(base)}${RUTAS[idioma].festivales}">${escapeHtml(t.volver)}</a></div></main></body></html>`;
}

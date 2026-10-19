/** Páginas públicas del directorio de salas (`/directories/venues…`): HTML completo en servidor, sin I/O. */
import { escapeHtml } from '../../html.js';
import { barraHtml, cabezaHtml } from '../cabeza.js';
import { ESTILOS_PAGINA_PUBLICA } from '../estilos.js';
import { slugEquivalente } from '../indice.js';
import { RUTAS, alternativasPar, registroUrl, type IdiomaSeo } from '../rutas.js';
import { TEXTOS } from '../textos.js';
import { ciudadesDe, comunidadesDe, indexableCiudad, indexableComunidad, indexableIndice, type GrupoZona } from './publicas.js';
import { TEXTOS_SALAS } from './textos.js';
import type { SalaPublica } from './tipos.js';

const NOINDEX = 'noindex,follow';
const SLUG_GUIA_SALAS = 'email-a-una-sala';
const otro = (i: IdiomaSeo): IdiomaSeo => (i === 'es' ? 'en' : 'es');

/** Pie común: marca, enlace a las guías y, si algún dato viene de OpenStreetMap, su atribución (obligatoria por la licencia ODbL). */
function pie(base: string, idioma: IdiomaSeo, osm: boolean): string {
  const t = TEXTOS_SALAS[idioma];
  return `${osm ? `<p class="lectura">${escapeHtml(t.osm)} <a rel="noopener" href="https://www.openstreetmap.org/copyright">${escapeHtml(t.osmNombre)}</a>.</p>` : ''}<p class="pie"><a href="${escapeHtml(base)}${RUTAS[idioma].landing}">BandManager.io</a> · <a href="${escapeHtml(base)}${RUTAS[idioma].guias}">${escapeHtml(TEXTOS[idioma].guias)}</a> · ${escapeHtml(TEXTOS[idioma].lema)}</p>`;
}

const migas = (base: string, idioma: IdiomaSeo, tramos: Array<{ nombre: string; ruta?: string }>): string =>
  `<p class="migas">${tramos.map((m) => (m.ruta ? `<a href="${escapeHtml(base)}${escapeHtml(m.ruta)}">${escapeHtml(m.nombre)}</a>` : escapeHtml(m.nombre))).join(' › ')}</p>`;

const listaGrupos = (base: string, idioma: IdiomaSeo, grupos: GrupoZona[], ruta: (g: GrupoZona) => string): string =>
  `<ul class="rel">${grupos.map((g) => `<li><a href="${escapeHtml(base)}${escapeHtml(ruta(g))}">${escapeHtml(g.nombre)}<small>${escapeHtml(TEXTOS_SALAS[idioma].nSalas(g.salas.length))}</small></a></li>`).join('')}</ul>`;

const listaSalas = (base: string, idioma: IdiomaSeo, salas: readonly SalaPublica[]): string =>
  `<ul class="rel">${salas.map((s) => `<li><a href="${escapeHtml(base)}${escapeHtml(RUTAS[idioma].sala(s.comunidadSlug, s.ciudadSlug, s.slug))}">${escapeHtml(s.nombre)}<small>${escapeHtml([s.ciudad, s.genero, s.aforo ? TEXTOS_SALAS[idioma].aforoPersonas(s.aforo) : ''].filter(Boolean).join(' · '))}</small></a></li>`).join('')}</ul>`;

function breadcrumbLd(base: string, items: Array<{ nombre: string; ruta: string }>) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.nombre, item: `${base}${it.ruta}` })) };
}

function pagina(o: { base: string; idioma: IdiomaSeo; ruta: string; paresRutas: { es: string; en: string }; titulo: string; descripcion: string; indexar: boolean; jsonLd: unknown; campana: string; cuerpo: string }): string {
  const { base, idioma } = o;
  return `${cabezaHtml({ base, idioma, ruta: o.ruta, titulo: o.titulo.slice(0, 70), descripcion: o.descripcion.slice(0, 160), jsonLd: o.jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, o.paresRutas.es, o.paresRutas.en), robots: o.indexar ? undefined : NOINDEX })}
<body>
<main>
${barraHtml(base, idioma, o.paresRutas[otro(idioma)], o.campana)}
${o.cuerpo}
</main>
</body>
</html>`;
}

const pares = (f: (i: IdiomaSeo) => string) => ({ es: f('es'), en: f('en') });

export function renderizarIndiceSalas(base: string, idioma: IdiomaSeo, salas: readonly SalaPublica[]): string {
  const t = TEXTOS_SALAS[idioma];
  const r = RUTAS[idioma];
  const comunidades = comunidadesDe(salas);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: t.h1, url: `${base}${r.salas}`, inLanguage: idioma, hasPart: comunidades.map((g) => ({ '@type': 'WebPage', name: g.nombre, url: `${base}${r.salasComunidad(g.slug)}` })) }, breadcrumbLd(base, [{ nombre: TEXTOS[idioma].inicio, ruta: r.landing }, { nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }])] };
  return pagina({
    base, idioma, ruta: r.salas, paresRutas: pares((i) => RUTAS[i].salas), titulo: t.tituloIndice, descripcion: t.descripcionIndice, indexar: indexableIndice(salas), jsonLd, campana: 'salas',
    cuerpo: `${migas(base, idioma, [{ nombre: t.directorios, ruta: r.listados }, { nombre: t.h1 }])}
<h1>${escapeHtml(t.h1)}</h1>
<p class="intro">${escapeHtml(t.intro)}</p>
<section class="seccion"><h2>${escapeHtml(t.comunidades)}</h2>${comunidades.length ? listaGrupos(base, idioma, comunidades, (g) => r.salasComunidad(g.slug)) : `<p>${escapeHtml(t.sinSalas)}</p>`}</section>
<section class="seccion"><h2>${escapeHtml(t.metodo)}</h2><p>${escapeHtml(t.metodoTexto)}</p></section>
${pie(base, idioma, salas.some((s) => s.deOsm))}`,
  });
}

/** Null si la comunidad no tiene ninguna sala publicada. */
export function renderizarComunidad(base: string, idioma: IdiomaSeo, salas: readonly SalaPublica[], comunidadSlug: string): string | null {
  const delas = salas.filter((s) => s.comunidadSlug === comunidadSlug);
  if (!delas.length) return null;
  const t = TEXTOS_SALAS[idioma];
  const r = RUTAS[idioma];
  const nombre = delas[0].comunidad;
  const ciudades = ciudadesDe(salas, comunidadSlug);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: t.h1Comunidad(nombre), url: `${base}${r.salasComunidad(comunidadSlug)}`, inLanguage: idioma, hasPart: ciudades.map((g) => ({ '@type': 'WebPage', name: g.nombre, url: `${base}${r.salasCiudad(comunidadSlug, g.slug)}` })) }, breadcrumbLd(base, [{ nombre: TEXTOS[idioma].inicio, ruta: r.landing }, { nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre, ruta: r.salasComunidad(comunidadSlug) }])] };
  return pagina({
    base, idioma, ruta: r.salasComunidad(comunidadSlug), paresRutas: pares((i) => RUTAS[i].salasComunidad(comunidadSlug)), titulo: t.tituloComunidad(nombre, delas.length), descripcion: t.descripcionComunidad(nombre, delas.length), indexar: indexableComunidad(salas, comunidadSlug), jsonLd, campana: `salas-${comunidadSlug}`,
    cuerpo: `${migas(base, idioma, [{ nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre }])}
<h1>${escapeHtml(t.h1Comunidad(nombre))}</h1>
<p class="intro">${escapeHtml(t.nSalas(delas.length))}</p>
<section class="seccion"><h2>${escapeHtml(t.ciudades)}</h2>${listaGrupos(base, idioma, ciudades, (g) => r.salasCiudad(comunidadSlug, g.slug))}</section>
${pie(base, idioma, delas.some((s) => s.deOsm))}`,
  });
}

export function renderizarCiudad(base: string, idioma: IdiomaSeo, salas: readonly SalaPublica[], comunidadSlug: string, ciudadSlug: string): string | null {
  const delas = salas.filter((s) => s.comunidadSlug === comunidadSlug && s.ciudadSlug === ciudadSlug);
  if (!delas.length) return null;
  const t = TEXTOS_SALAS[idioma];
  const r = RUTAS[idioma];
  const { ciudad, comunidad } = delas[0];
  const ruta = r.salasCiudad(comunidadSlug, ciudadSlug);
  const jsonLd = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: t.h1Ciudad(ciudad), url: `${base}${ruta}`, inLanguage: idioma, hasPart: delas.map((s) => ({ '@type': 'WebPage', name: s.nombre, url: `${base}${r.sala(s.comunidadSlug, s.ciudadSlug, s.slug)}` })) }, breadcrumbLd(base, [{ nombre: TEXTOS[idioma].inicio, ruta: r.landing }, { nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre: comunidad, ruta: r.salasComunidad(comunidadSlug) }, { nombre: ciudad, ruta }])] };
  return pagina({
    base, idioma, ruta, paresRutas: pares((i) => RUTAS[i].salasCiudad(comunidadSlug, ciudadSlug)), titulo: t.tituloCiudad(ciudad, delas.length), descripcion: t.descripcionCiudad(ciudad, comunidad), indexar: indexableCiudad(salas, comunidadSlug, ciudadSlug), jsonLd, campana: `salas-${ciudadSlug}`,
    cuerpo: `${migas(base, idioma, [{ nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre: comunidad, ruta: r.salasComunidad(comunidadSlug) }, { nombre: ciudad }])}
<h1>${escapeHtml(t.h1Ciudad(ciudad))}</h1>
<p class="intro">${escapeHtml(t.nSalas(delas.length))}</p>
<section class="seccion"><h2>${escapeHtml(t.salas)}</h2>${listaSalas(base, idioma, delas)}</section>
${pie(base, idioma, delas.some((s) => s.deOsm))}`,
  });
}

/** La ficha de una sala va siempre con `noindex`: sin contacto ni más datos propios es una página fina; el valor SEO está en las listas. */
export function renderizarSala(base: string, idioma: IdiomaSeo, s: SalaPublica): string {
  const t = TEXTOS_SALAS[idioma];
  const r = RUTAS[idioma];
  const ruta = r.sala(s.comunidadSlug, s.ciudadSlug, s.slug);
  const guiaSlug = idioma === 'es' ? SLUG_GUIA_SALAS : slugEquivalente(SLUG_GUIA_SALAS, 'es');
  const filas: Array<[string, string]> = [
    [t.dondeEsta, [s.ciudad, s.provincia && s.provincia !== s.ciudad ? s.provincia : '', s.comunidad].filter(Boolean).join(', ')],
    ...(s.direccion ? ([[t.direccion, s.direccion]] as Array<[string, string]>) : []),
    ...(s.aforo ? ([[t.aforo, t.aforoPersonas(s.aforo)]] as Array<[string, string]>) : []),
    ...(s.genero ? ([[t.estilo, s.genero]] as Array<[string, string]>) : []),
  ];
  const jsonLd = { '@context': 'https://schema.org', '@graph': [{ '@type': 'MusicVenue', name: s.nombre, url: s.web, address: { '@type': 'PostalAddress', addressLocality: s.ciudad, addressRegion: s.provincia ?? s.comunidad, addressCountry: 'ES', ...(s.direccion ? { streetAddress: s.direccion } : {}) }, ...(s.aforo ? { maximumAttendeeCapacity: s.aforo } : {}) }, breadcrumbLd(base, [{ nombre: TEXTOS[idioma].inicio, ruta: r.landing }, { nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre: s.comunidad, ruta: r.salasComunidad(s.comunidadSlug) }, { nombre: s.ciudad, ruta: r.salasCiudad(s.comunidadSlug, s.ciudadSlug) }, { nombre: s.nombre, ruta }])] };
  return pagina({
    base, idioma, ruta, paresRutas: pares((i) => RUTAS[i].sala(s.comunidadSlug, s.ciudadSlug, s.slug)), titulo: t.tituloSala(s.nombre, s.ciudad), descripcion: t.descripcionSala(s.nombre, s.ciudad), indexar: false, jsonLd, campana: `sala-${s.slug}`,
    cuerpo: `${migas(base, idioma, [{ nombre: t.directorios, ruta: r.listados }, { nombre: t.h1, ruta: r.salas }, { nombre: s.comunidad, ruta: r.salasComunidad(s.comunidadSlug) }, { nombre: s.ciudad, ruta: r.salasCiudad(s.comunidadSlug, s.ciudadSlug) }, { nombre: s.nombre }])}
<h1>${escapeHtml(s.nombre)}</h1>
<div class="scroll"><table class="tabla"><tbody>${filas.map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody></table></div>
<div class="acciones"><a class="boton suave" rel="noopener nofollow" href="${escapeHtml(s.web)}">${escapeHtml(t.verWeb)}</a></div>
<p class="aviso"><strong>${escapeHtml(t.consejo)}.</strong> ${escapeHtml(t.consejoTexto)}${guiaSlug ? ` <a href="${escapeHtml(base)}${escapeHtml(r.guia(guiaSlug))}">${escapeHtml(t.guia)}</a>.` : ''}</p>
<div class="cta"><h2>${escapeHtml(t.ctaTitulo)}</h2><p>${escapeHtml(t.ctaTexto)}</p><div class="acciones"><a class="boton" href="${escapeHtml(registroUrl(base, idioma, 'sala', s.slug))}">${escapeHtml(t.ctaBoton)}</a></div></div>
${pie(base, idioma, s.deOsm)}`,
  });
}

export function renderizarSalaNoEncontrada(base: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_SALAS[idioma];
  return `<!doctype html>
<html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(t.noEncontradaTitulo)}</title><meta name="robots" content="noindex"><style>${ESTILOS_PAGINA_PUBLICA}</style></head>
<body><main><h1>${escapeHtml(t.noEncontradaH1)}</h1><p class="intro">${escapeHtml(t.noEncontradaIntro)}</p><div class="acciones"><a class="boton suave" href="${escapeHtml(base)}${RUTAS[idioma].salas}">${escapeHtml(t.h1)}</a></div></main></body></html>`;
}

/** Directorio público de festivales (`/festivales`, `/en/festivals`): HTML completo en servidor, sin I/O. */
import { escapeHtml } from '../../html.js';
import { barraHtml, cabezaHtml } from '../cabeza.js';
import { ESTILOS_PAGINA_PUBLICA } from '../estilos.js';
import { slugEquivalente } from '../indice.js';
import { RUTAS, alternativasPar, registroUrl, type IdiomaSeo } from '../rutas.js';
import { TEXTOS, fechaLegible } from '../textos.js';
import { FESTIVALES } from './datos.js';
import { codigoIso, nombrePais } from './paises.js';
import { ESTILOS, TEXTOS_FESTIVALES } from './textos.js';
import type { Festival, Tri } from './tipos.js';
import { convocatoriaAbierta, fichaIndexable, festivalesVigentes, indexable } from './vigencia.js';

const NOINDEX = 'noindex,follow';
const SLUG_GUIA_FESTIVAL = 'presentar-banda-festival';

/** «Ciudad (Provincia)» en España; fuera, «Ciudad (País)» o «Ciudad, Región (País)». */
export function lugar(f: Festival, idioma: IdiomaSeo = 'es'): string {
  const pais = nombrePais(f.pais, idioma);
  if (!f.ciudad) return `${TEXTOS_FESTIVALES[idioma].ciudadPorConfirmar} (${f.pais.toUpperCase() === 'ES' && f.provincia !== nombrePais(f.pais, 'es') ? f.provincia : pais})`;
  if (f.pais.toUpperCase() === 'ES') return `${f.ciudad} (${f.provincia})`;
  return f.provincia && f.provincia !== nombrePais(f.pais, 'es') && f.provincia !== pais ? `${f.ciudad}, ${f.provincia} (${pais})` : `${f.ciudad} (${pais})`;
}
const rangoEdicion = (f: Festival, idioma: IdiomaSeo): string => (f.edicion ? `${fechaLegible(idioma, f.edicion.inicio)} – ${fechaLegible(idioma, f.edicion.fin)}` : '');

function estadoConvocatoria(f: Festival, hoy: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  if (!f.convocatoria) return t.sinConvocatoria;
  if (!f.convocatoria.cierre) return t.sinPlazo;
  return convocatoriaAbierta(f, hoy) ? `${t.abierta} · ${fechaLegible(idioma, f.convocatoria.cierre)}` : t.cerrada;
}

function requisitosHtml(f: Festival, idioma: IdiomaSeo): string {
  const r = f.convocatoria?.requisitos;
  if (!r) return '';
  const t = TEXTOS_FESTIVALES[idioma];
  const si = (v: Tri) => t[v];
  const filas: Array<[string, string]> = [
    [t.independientes, si(r.independientes)],
    [t.sello, si(r.exigeSelloOAgencia)],
    [t.residencia, si(r.exigeResidencia)],
    [t.cuota, si(r.cuota)],
    ...(r.remuneracion ? ([[t.remuneracion, r.remuneracion]] as Array<[string, string]>) : []),
  ];
  return `<div class="scroll"><table class="tabla"><caption>${escapeHtml(t.requisitos)}</caption><tbody>${filas.map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody></table></div>`;
}

const mesDe = (f: Festival): string => (f.edicion ? String(Number(f.edicion.inicio.slice(5, 7))) : '');

/** Cada tarjeta lleva sus datos de filtro (país, estilos, mes, convocatoria) para filtrar en el navegador sin recargar. */
const tarjeta = (f: Festival, base: string, idioma: IdiomaSeo, hoy: string) =>
  `<li data-pais="${escapeHtml(f.pais.toUpperCase())}" data-estilos="${escapeHtml(f.estilos.join(' '))}" data-mes="${mesDe(f)}" data-abierta="${convocatoriaAbierta(f, hoy) ? 1 : 0}" data-nombre="${escapeHtml(`${f.nombre} ${f.ciudad}`.toLowerCase())}"><a href="${escapeHtml(base)}${escapeHtml(RUTAS[idioma].festival(f.slug))}">${escapeHtml(f.nombre)}<small>${escapeHtml(`${lugar(f, idioma)} · ${estadoConvocatoria(f, hoy, idioma)}`)}${f.enBandManager?.email ? ` · <span class="chk">✓ ${escapeHtml(TEXTOS_FESTIVALES[idioma].chkEmailCorto)}</span>` : ''}</small></a></li>`;

const opcion = (valor: string, texto: string) => `<option value="${escapeHtml(valor)}">${escapeHtml(texto)}</option>`;

/** Barra de filtros: solo ofrece los países, estilos y meses que tienen algún festival (un filtro vacío espanta). */
function filtrosHtml(vigentes: Festival[], idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  const cuenta = (claves: string[]) => claves.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>());
  const paises = [...cuenta(vigentes.map((f) => f.pais.toUpperCase()))].sort((a, b) => b[1] - a[1]);
  const estilos = [...cuenta(vigentes.flatMap((f) => f.estilos))].sort((a, b) => b[1] - a[1]);
  const meses = [...new Set(vigentes.map(mesDe).filter(Boolean))].map(Number).sort((a, b) => a - b);
  const nombreMes = (m: number) => new Date(Date.UTC(2027, m - 1, 1)).toLocaleDateString(idioma, { month: 'long', timeZone: 'UTC' });
  return `<form class="filtros" id="filtros-festivales" role="search" onsubmit="return false">
<label>${escapeHtml(t.filtroBuscar)}<input type="search" name="q" autocomplete="off"></label>
${paises.length > 1 ? `<label>${escapeHtml(t.filtroPais)}<select name="pais">${opcion('', t.filtroTodos)}${paises.map(([p, n]) => opcion(p, `${nombrePais(p, idioma)} (${n})`)).join('')}</select></label>` : ''}
<label>${escapeHtml(t.filtroEstilo)}<select name="estilo">${opcion('', t.filtroTodos)}${estilos.map(([e, n]) => opcion(e, `${ESTILOS[idioma][e as keyof (typeof ESTILOS)['es']]} (${n})`)).join('')}</select></label>
${meses.length ? `<label>${escapeHtml(t.filtroMes)}<select name="mes">${opcion('', t.filtroTodos)}${meses.map((m) => opcion(String(m), nombreMes(m))).join('')}</select></label>` : ''}
<label class="casilla"><input type="checkbox" name="abierta"> ${escapeHtml(t.filtroAbierta)}</label>
<p class="lectura" aria-live="polite"><span data-total>${vigentes.length}</span> ${escapeHtml(t.filtroResultados)}</p>
</form>
<script>(function(){var f=document.getElementById('filtros-festivales');if(!f)return;var n=f.querySelector('[data-total]');function run(){var l=document.querySelectorAll('.lista-festivales li'),q=(f.q.value||'').toLowerCase().trim(),p=f.pais?f.pais.value:'',e=f.estilo.value,m=f.mes?f.mes.value:'',a=f.abierta.checked,c=0;l.forEach(function(li){var d=li.dataset,ok=(!q||d.nombre.indexOf(q)>=0)&&(!p||d.pais===p)&&(!e||(' '+d.estilos+' ').indexOf(' '+e+' ')>=0)&&(!m||d.mes===m)&&(!a||d.abierta==='1');li.hidden=!ok;if(ok)c++});n.textContent=c;var o=document.getElementById('otras-ciudades');if(o)o.hidden=!o.querySelector('li:not([hidden])')}f.addEventListener('input',run);f.addEventListener('change',run)})();</script>`;
}

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
<p class="migas"><a href="${escapeHtml(base)}${rutas.listados}">${escapeHtml(t.listados)}</a> › ${escapeHtml(t.h1)}</p>
<h1>${escapeHtml(t.h1)}</h1>
<p class="intro">${escapeHtml(t.intro)}</p>
<section class="seccion"><h2>${escapeHtml(t.abiertas)}</h2>
${abiertas.length ? `<ul class="rel">${abiertas.map((f) => tarjeta(f, base, idioma, hoy)).join('')}</ul>` : `<p>${escapeHtml(t.sinAbiertas)}</p>`}
</section>
<section class="seccion"><h2>${escapeHtml(t.todos)}</h2>
${filtrosHtml(vigentes, idioma)}
<ul class="rel lista-festivales" id="lista-festivales">${vigentes.filter((f) => f.ciudad).map((f) => tarjeta(f, base, idioma, hoy)).join('')}</ul>
${vigentes.some((f) => !f.ciudad) ? `<div id="otras-ciudades"><h3>${escapeHtml(t.otrasCiudades)}</h3><p class="lectura">${escapeHtml(t.otrasCiudadesTexto)}</p><ul class="rel lista-festivales">${vigentes.filter((f) => !f.ciudad).map((f) => tarjeta(f, base, idioma, hoy)).join('')}</ul></div>` : ''}
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
    [t.dondeEsta, lugar(f, idioma)],
    [t.estilo, f.estilos.map((e) => ESTILOS[idioma][e]).join(', ')],
    ...(f.edicion ? ([[t.edicion, rangoEdicion(f, idioma)]] as Array<[string, string]>) : []),
    [t.convocatoria, estadoConvocatoria(f, hoy, idioma)],
    [t.verificado, fechaLegible(idioma, f.verificadoEn)],
  ];
  const evento = f.edicion
    ? { '@type': 'Festival', name: f.nombre, startDate: f.edicion.inicio, endDate: f.edicion.fin, ...(f.web ? { url: f.web } : {}), location: { '@type': 'Place', name: f.ciudad || nombrePais(f.pais, idioma), address: { '@type': 'PostalAddress', ...(f.ciudad ? { addressLocality: f.ciudad } : {}), ...(f.provincia ? { addressRegion: f.provincia } : {}), addressCountry: codigoIso(f.pais) } } }
    : { '@type': 'WebPage', name: f.nombre, url: `${base}${ruta}`, inLanguage: idioma };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      evento,
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: TEXTOS[idioma].inicio, item: `${base}${rutas.landing}` },
        { '@type': 'ListItem', position: 2, name: t.listados, item: `${base}${rutas.listados}` },
        { '@type': 'ListItem', position: 3, name: t.h1, item: `${base}${rutas.festivales}` },
        { '@type': 'ListItem', position: 4, name: f.nombre, item: `${base}${ruta}` },
      ] },
    ],
  };
  const descripcion = `${f.descripcion[idioma]} ${f.convocatoria ? estadoConvocatoria(f, hoy, idioma) : ''}`.trim().slice(0, 160);
  return `${cabezaHtml({ base, idioma, ruta, titulo: t.tituloFicha(f.nombre, f.ciudad || nombrePais(f.pais, idioma)).slice(0, 70), descripcion, jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, RUTAS.es.festival(f.slug), RUTAS.en.festival(f.slug)), robots: fichaIndexable(f, todos, hoy) ? undefined : NOINDEX })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].festival(f.slug), f.slug)}
<p class="migas"><a href="${escapeHtml(base)}${rutas.listados}">${escapeHtml(t.listados)}</a> › <a href="${escapeHtml(base)}${rutas.festivales}">${escapeHtml(t.h1)}</a> › ${escapeHtml(f.nombre)}</p>
<ul class="etiquetas">${f.estilos.map((e) => `<li>${escapeHtml(ESTILOS[idioma][e])}</li>`).join('')}</ul>
<h1>${escapeHtml(f.nombre)}</h1>
<p class="intro">${escapeHtml(f.descripcion[idioma])}</p>
<div class="scroll"><table class="tabla"><tbody>${filas.map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</tbody></table></div>
${f.convocatoria ? `<section class="seccion"><h2>${escapeHtml(t.convocatoria)}</h2><p>${escapeHtml(f.convocatoria.resumen[idioma])}</p>${requisitosHtml(f, idioma)}<div class="acciones"><a class="boton suave" rel="noopener" href="${escapeHtml(f.convocatoria.url)}">${escapeHtml(t.verBases)}</a></div></section>` : ''}
<p class="aviso"><strong>${escapeHtml(t.consejo)}.</strong> ${escapeHtml(t.consejoTexto)}${guiaSlug ? ` <a href="${escapeHtml(base)}${escapeHtml(rutas.guia(guiaSlug))}">${escapeHtml(t.guia)}</a>.` : ''}</p>
<p class="lectura">${escapeHtml(t.fuente)}: <a rel="noopener" href="${escapeHtml(f.fuente)}">${escapeHtml(new URL(f.fuente).hostname)}</a>${f.web ? ` · <a rel="noopener" href="${escapeHtml(f.web)}">${escapeHtml(t.web)}</a>` : ''}</p>
${contactoHtml(f, base, idioma)}
${aportarHtml(f, idioma)}
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

/** Qué contacto tiene BandManager de este festival: marcas de sí/no, nunca el dato (se da al añadirlo en la app). */
function contactoHtml(f: Festival, base: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  const c = f.enBandManager ?? { email: false, telefono: false, instagram: false };
  const items: Array<[string, boolean]> = [[t.chkEmail, c.email], [t.chkTelefono, c.telefono], [t.chkInstagram, c.instagram], [t.chkWeb, !!f.web]];
  const alguno = c.email || c.telefono || c.instagram;
  return `<section class="seccion" id="contacto"><h2>${escapeHtml(t.chkTitulo)}</h2>
<ul class="checks">${items.map(([txt, si]) => `<li class="${si ? 'si' : 'no'}"><span aria-hidden="true">${si ? '✓' : '–'}</span> ${escapeHtml(txt)}<span class="sr">: ${escapeHtml(si ? t.si : t.no)}</span></li>`).join('')}</ul>
<p class="lectura">${escapeHtml(alguno ? t.chkConDatos : t.chkSinDatos)}${alguno ? ` <a href="${escapeHtml(registroUrl(base, idioma, 'festival', f.slug))}">${escapeHtml(t.ctaBoton)}</a>.` : ''}</p>
</section>`;
}

/** «¿Sabes algo que no sabemos?»: la aportación se guarda pendiente de revisión, nunca se publica sola. */
function aportarHtml(f: Festival, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  const campos = Object.entries(t.aportarCampos).map(([v, txt]) => `<option value="${v}">${escapeHtml(txt)}</option>`).join('');
  return `<section class="seccion" id="aportar"><h2>${escapeHtml(t.aportarTitulo)}</h2><p>${escapeHtml(t.aportarIntro)}</p>
<form class="filtros" id="form-aportar" onsubmit="return false">
<input type="hidden" name="ficha_id" value="${escapeHtml(f.slug)}">
<label>${escapeHtml(t.aportarCampo)}<select name="campo" required>${campos}</select></label>
<label>${escapeHtml(t.aportarValor)}<input type="text" name="valor" maxlength="300"></label>
<label>${escapeHtml(t.aportarFuente)}<input type="url" name="fuente" maxlength="500" placeholder="https://"></label>
<label>${escapeHtml(t.aportarContacto)}<input type="email" name="contacto" maxlength="200"></label>
<label class="trampa" aria-hidden="true">Web<input type="text" name="web" tabindex="-1" autocomplete="off"></label>
<button class="boton" type="submit">${escapeHtml(t.aportarEnviar)}</button>
<p class="lectura" data-estado aria-live="polite">${escapeHtml(t.aportarAviso)}</p>
</form>
<script>(function(){var f=document.getElementById('form-aportar');if(!f)return;var e=f.querySelector('[data-estado]'),b=f.querySelector('button');f.addEventListener('submit',function(){var d={tipo:'festival',idioma:'${idioma}'};new FormData(f).forEach(function(v,k){d[k]=v});b.disabled=true;fetch('/api/public/aportaciones',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){if(x.ok){e.textContent=${JSON.stringify(t.aportarGracias)};f.reset()}else{e.textContent=x.j.error||${JSON.stringify(t.aportarError)};b.disabled=false}}).catch(function(){e.textContent=${JSON.stringify(t.aportarError)};b.disabled=false})})})();</script>
</section>`;
}

export function renderizarFestivalNoEncontrado(base: string, idioma: IdiomaSeo): string {
  const t = TEXTOS_FESTIVALES[idioma];
  return `<!doctype html>
<html lang="${idioma}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(t.noEncontradoTitulo)}</title><meta name="robots" content="noindex"><style>${ESTILOS_PAGINA_PUBLICA}</style></head>
<body><main><h1>${escapeHtml(t.noEncontradoH1)}</h1><p class="intro">${escapeHtml(t.noEncontradoIntro)}</p><div class="acciones"><a class="boton suave" href="${escapeHtml(base)}${RUTAS[idioma].festivales}">${escapeHtml(t.volver)}</a></div></main></body></html>`;
}

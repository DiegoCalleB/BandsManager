/** Portada de los listados (`/listados`, `/en/directories`): enlaza cada directorio público. Hoy solo festivales. */
import { escapeHtml } from '../html.js';
import { barraHtml, cabezaHtml } from './cabeza.js';
import { RUTAS, alternativasPar, type IdiomaSeo } from './rutas.js';
import { TEXTOS } from './textos.js';

interface Directorio {
  ruta: (i: IdiomaSeo) => string;
  titulo: Record<IdiomaSeo, string>;
  resumen: Record<IdiomaSeo, string>;
}

/** Añadir un directorio nuevo (salas…) = añadirlo aquí. */
export const DIRECTORIOS: readonly Directorio[] = [
  {
    ruta: (i) => RUTAS[i].festivales,
    titulo: { es: 'Festivales y convocatorias', en: 'Festivals and open calls' },
    resumen: { es: 'Festivales de España que programan bandas, con plazos de inscripción y requisitos.', en: 'Festivals in Spain that book bands, with application deadlines and requirements.' },
  },
  {
    ruta: (i) => RUTAS[i].salas,
    titulo: { es: 'Salas de conciertos en España', en: 'Live music venues in Spain' },
    resumen: { es: 'Salas por comunidad y ciudad, con web oficial, para bandas que buscan dónde tocar.', en: 'Venues by region and city, with official websites, for bands looking for places to play.' },
  },
];

/** La portada solo se indexa cuando al menos dos de sus directorios son indexables: con menos es una página fina. */
export const MIN_DIRECTORIOS_INDEXABLES = 2;

const T = {
  es: { titulo: 'Listados para bandas: festivales y más | BandManager', descripcion: 'Directorios de festivales y otros recintos para bandas, con fuente y fecha de comprobación en cada ficha.', h1: 'Listados para bandas', intro: 'Directorios cuidados, con la fuente y la fecha de comprobación de cada dato. Si buscas consejos y plantillas, están en las guías.', guias: 'Ver las guías' },
  en: { titulo: 'Directories for bands: festivals and more | BandManager', descripcion: 'Directories of festivals and other venues for bands, with the source and check date on every listing.', h1: 'Directories for bands', intro: 'Carefully kept directories, with the source and check date of every piece of data. If you want tips and templates, they are in the guides.', guias: 'See the guides' },
} as const;

export function renderizarListados(base: string, idioma: IdiomaSeo, directoriosIndexables = 0): string {
  const t = T[idioma];
  const rutas = RUTAS[idioma];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.h1,
    url: `${base}${rutas.listados}`,
    inLanguage: idioma,
    hasPart: DIRECTORIOS.map((d) => ({ '@type': 'WebPage', name: d.titulo[idioma], url: `${base}${d.ruta(idioma)}` })),
  };
  return `${cabezaHtml({ base, idioma, ruta: rutas.listados, titulo: t.titulo, descripcion: t.descripcion, jsonLd, tipoOg: 'website', alternativas: alternativasPar(base, RUTAS.es.listados, RUTAS.en.listados), robots: directoriosIndexables >= MIN_DIRECTORIOS_INDEXABLES ? undefined : 'noindex,follow' })}
<body>
<main>
${barraHtml(base, idioma, RUTAS[idioma === 'es' ? 'en' : 'es'].listados, 'listados')}
<h1>${escapeHtml(t.h1)}</h1>
<p class="intro">${escapeHtml(t.intro)}</p>
<ul class="rel">${DIRECTORIOS.map((d) => `<li><a href="${escapeHtml(base)}${escapeHtml(d.ruta(idioma))}">${escapeHtml(d.titulo[idioma])}<small>${escapeHtml(d.resumen[idioma])}</small></a></li>`).join('')}</ul>
<p class="pie"><a href="${escapeHtml(base)}${rutas.landing}">BandManager.io</a> · <a href="${escapeHtml(base)}${rutas.guias}">${escapeHtml(TEXTOS[idioma].guias)}</a> · ${escapeHtml(TEXTOS[idioma].lema)}</p>
</main>
</body>
</html>`;
}

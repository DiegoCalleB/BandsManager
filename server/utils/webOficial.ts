/**
 * Elige la web oficial de una sala o festival entre los resultados de un buscador, sin adivinar: solo vale un dominio que lleve
 * el nombre propio de la ficha (no «sala», «teatro», «festival»…) y, si la ficha tiene ciudad, que el resultado la mencione o el
 * dominio la lleve. Redes sociales, venta de entradas, agendas y enciclopedias nunca son la web oficial. Pura, sin red.
 */
import { dominioRegistrable } from './emailsDeContacto.js';
import { ciudadPrincipal, normalizarTexto, urlPublica } from './salaCatalogo.js';

export interface ResultadoBusqueda {
  link: string;
  title?: string;
  snippet?: string;
}

/** Palabras que no identifican a un recinto: con solo estas, el nombre es demasiado ambiguo para fiarse de un dominio. */
const GENERICAS = new Set([
  'sala', 'salas', 'club', 'teatro', 'teatre', 'theatre', 'theater', 'festival', 'fest', 'music', 'musica', 'live', 'cafe', 'bar', 'pub',
  'discoteca', 'disco', 'auditorio', 'auditori', 'centro', 'centre', 'center', 'cultural', 'casa', 'espacio', 'espai', 'palacio', 'plaza',
  'arena', 'social', 'principal', 'municipal', 'gran', 'nuevo', 'nueva', 'real', 'central', 'rock', 'the', 'and', 'del', 'los', 'las', 'les',
  'els', 'por', 'con', 'san', 'santa', 'open', 'air', 'days', 'weekend', 'edicion', 'concert', 'concerts', 'conciertos', 'hall', 'room',
]);

/** Dominios que pueden hablar del recinto pero nunca son su web: redes, entradas, agendas, mapas, prensa generalista. */
const NO_OFICIALES = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'youtube.com', 'linkedin.com', 'pinterest.com', 'threads.net',
  'wikipedia.org', 'wikidata.org', 'tripadvisor', 'yelp.', 'google.', 'foursquare.com', 'spotify.com', 'apple.com', 'soundcloud.com',
  'bandcamp.com', 'ticketmaster', 'entradas.com', 'eventbrite', 'dice.fm', 'songkick.com', 'bandsintown.com', 'wegow.com', 'feverup.com',
  'fever.', 'giglon.com', 'entradium.com', 'taquilla.com', 'seetickets', 'festicket.com', 'ra.co', 'residentadvisor', 'setlist.fm',
  'ticketea', 'ticketswap', 'viagogo', 'stubhub', 'salasdeconcierto.net', 'timeout.', 'guiadelocio', 'festivales.com', 'festivalfinder',
  'festivalticker', 'last.fm', 'concertful', 'allevents', 'jambase', 'booking.com', 'airbnb', 'eldiario.es', 'elpais.com', 'elmundo.es',
  'lavanguardia.com', 'abc.es', '20minutos.es', 'europapress.es', 'linktr.ee', 'beacons.ai', 'wix.com', 'blogspot.', 'wordpress.com',
];

// Los dominios no llevan «ñ»: «Castañar» se compara como «castanar».
const comparable = (s: string) => normalizarTexto(s).replace(/ñ/g, 'n');
const compacto = (s: string) => comparable(s).replace(/\s+/g, '');
const tokens = (s: string) => comparable(s).split(' ').filter((t) => t.length >= 3);

function noOficial(host: string): boolean {
  return NO_OFICIALES.some((d) => (d.endsWith('.') ? host.includes(d) : host === d || host.endsWith(`.${d}`) || host.includes(d)));
}

/** Etiqueta de marca del dominio sin guiones: «www.sala-wagon.es» → «salawagon». */
function marca(host: string): string {
  return dominioRegistrable(host).split('.')[0].replace(/-/g, '');
}

/** El dominio lleva el nombre propio de la ficha. La ciudad no cuenta como nombre propio («Sunblast Festival Tenerife» → «sunblast»). */
export function dominioDelNombre(host: string, nombre: string, ciudad: string | null = null): boolean {
  const etiqueta = marca(host);
  const deCiudad = new Set(tokens(ciudadPrincipal(ciudad ?? '')));
  const propios = tokens(nombre).filter((t) => !GENERICAS.has(t) && !deCiudad.has(t));
  if (propios.length === 0 || etiqueta.length < 3) return false;
  const nucleo = propios.join('');
  if (nucleo.length >= 5 && etiqueta.includes(nucleo)) return true;
  if (etiqueta === nucleo || etiqueta === compacto(nombre)) return true;
  // «Teatro Circo Murcia» → teatrocircomurcia.es: todos los propios de 5+ letras en la marca.
  const largos = propios.filter((t) => t.length >= 5);
  if (largos.length > 0 && largos.length === propios.length && largos.every((t) => etiqueta.includes(t))) return true;
  // «Festival Mejillón Rock de San Martín…» → mejillonrock.es: la marca empieza por el primer nombre propio, si es largo.
  return propios[0].length >= 5 && etiqueta.startsWith(propios[0]);
}

function mencionaCiudad(r: ResultadoBusqueda, host: string, ciudad: string): boolean {
  const c = compacto(ciudadPrincipal(ciudad));
  if (!c) return true;
  return marca(host).includes(c) || compacto(`${r.title ?? ''} ${r.snippet ?? ''} ${r.link}`).includes(c);
}

/** La web oficial (origen, «https://dominio/») o null si ningún resultado lo es con seguridad. Mira solo los primeros resultados. */
export function elegirWebOficial(resultados: readonly ResultadoBusqueda[], nombre: string, ciudad: string | null): string | null {
  for (const r of resultados.slice(0, 6)) {
    const url = urlPublica(r.link);
    if (!url) continue;
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (noOficial(host) || !dominioDelNombre(host, nombre, ciudad)) continue;
    if (ciudad && !mencionaCiudad(r, host, ciudad)) continue;
    return `${new URL(url).protocol}//${new URL(url).hostname.toLowerCase()}/`;
  }
  return null;
}

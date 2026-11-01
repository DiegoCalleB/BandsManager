/**
 * Auditoría 360 de la presencia de una banda: cada especialista (SEO, Instagram, TikTok, YouTube,
 * CTR y conversión) revisa lo que BandManager sabe de ella y dice qué arreglar primero. Lógica pura
 * y determinista: sin IA, y sin inventar. Lo que no se sabe (la bio de TikTok, por ejemplo) sale como
 * «sin datos» y pide el dato, nunca se da por bueno ni por malo.
 *
 * Cada hallazgo lleva su fuente. `criterio-musica` es criterio propio del asesor; el resto sale de
 * una lección del temario (`ETIQUETA_ORIGEN` lo traduce a «Del temario» / «Criterio propio»).
 */
import type { Fuente, Red } from './reglasFormato';
import { diaMes, LIMITE_BIO, normalizar, primerValor } from './seo';

/** A dónde lleva un enlace corto (el mismo vocabulario que `server/utils/enlacesCortos.ts`). */
export type DestinoEnlace = 'entradas' | 'concierto' | 'epk' | 'fans';

export type Especialista = 'seo' | 'instagram' | 'tiktok' | 'youtube' | 'ctr';
export type EstadoHallazgo = 'ok' | 'mejorar' | 'sin_datos';

export const NOMBRE_ESPECIALISTA: Record<Especialista, string> = {
  seo: 'SEO y descubrimiento',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube Shorts',
  ctr: 'CTR y conversión',
};

export const ETIQUETA_ORIGEN = (f: Fuente): 'Del temario' | 'Criterio propio' => (f === 'criterio-musica' ? 'Criterio propio' : 'Del temario');

export interface Hallazgo {
  id: string;
  especialista: Especialista;
  estado: EstadoHallazgo;
  /** Cuánto mueve la aguja si se arregla: 1 poco, 3 mucho. */
  impacto: 1 | 2 | 3;
  /** Minutos que cuesta arreglarlo. */
  esfuerzoMin: number;
  titulo: string;
  /** Qué pasa, con los datos de la banda. */
  detalle: string;
  /** Qué hacer; vacío si ya está bien. */
  arreglo: string;
  fuente: Fuente;
}

export interface PerfilEnRed {
  url?: string;
  /** La bio (o descripción) de esa red, si se conoce: pegada por la banda o leída de la cuenta. */
  bio?: string | null;
}

export interface EnlaceDeSeguimiento {
  destino: DestinoEnlace;
  concertId: string | null;
}

export interface DatosAuditoria {
  hoy: string;
  nombre: string;
  genero: string;
  ciudad: string;
  /** Las redes en las que está la banda (su estrategia): solo esas se auditan. */
  redes: readonly Red[];
  perfiles: Partial<Record<Red, PerfilEnRed>>;
  /** Nombre (no el @) del perfil de Instagram, si se ha podido leer. */
  nombreInstagram?: string | null;
  spotify?: string;
  biografiaEpk: string;
  logo: boolean;
  fotos: number;
  emailBooking: boolean;
  /** El próximo bolo público de la banda. */
  proximoBolo: { id: string; fecha: string; sala: string; dias: number; tieneEntradas: boolean } | null;
  /** Enlaces con seguimiento que ya tiene, por red (canal). */
  enlaces: Partial<Record<Red, EnlaceDeSeguimiento>>;
}

export interface ResultadoEspecialista {
  id: Especialista;
  nombre: string;
  hallazgos: Hallazgo[];
  ok: number;
  mejorar: number;
  sinDatos: number;
}

export interface Auditoria {
  especialistas: ResultadoEspecialista[];
  /** Lo primero que arreglar: máximo 3, por impacto y, a igual impacto, lo más rápido. */
  prioridades: Hallazgo[];
  resumen: { ok: number; mejorar: number; sinDatos: number };
}

export const MAX_PRIORIDADES = 3;
/** Días a partir de los cuales un bolo ya manda sobre el enlace de la bio (`VENTANA.concierto`). */
const DIAS_BOLO_CERCANO = 21;

/* ----------------------------------------------------------------- utilidades */

/** El @ de una URL de perfil. null si no se puede sacar (canales de YouTube con id, por ejemplo). */
export function handleDe(url: string | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const partes = u.pathname.split('/').filter(Boolean);
  const primera = partes[0]?.replace(/^@/, '');
  if (!primera) return null;
  if (host === 'youtube.com') {
    // Solo vale la forma /@nombre: /channel/UC... es un id, no un nombre.
    return partes[0]?.startsWith('@') ? partes[0].slice(1).toLowerCase() : null;
  }
  if (host === 'instagram.com' || host === 'tiktok.com' || host === 'facebook.com') return primera.toLowerCase();
  return null;
}

const tieneGenero = (texto: string, genero: string) => {
  const g = normalizar(primerValor(genero));
  return g.length > 0 && normalizar(texto).includes(g);
};
const tieneCiudad = (texto: string, ciudad: string) => {
  const c = normalizar(primerValor(ciudad));
  return c.length > 0 && normalizar(texto).includes(c);
};

const CTA = /(enlace|link|entradas|escucha|escucha[dr]|bolo|bolos|proxim|agenda|fechas|nuevo|nueva|contrat|booking|ven\b|ven a)/;

type Base = Pick<Hallazgo, 'id' | 'especialista' | 'impacto' | 'esfuerzoMin' | 'titulo' | 'fuente'>;
const ok = (b: Base, detalle: string): Hallazgo => ({ ...b, estado: 'ok', detalle, arreglo: '' });
const mejorar = (b: Base, detalle: string, arreglo: string): Hallazgo => ({ ...b, estado: 'mejorar', detalle, arreglo });
const sinDatos = (b: Base, detalle: string, arreglo: string): Hallazgo => ({ ...b, estado: 'sin_datos', detalle, arreglo });

/* ----------------------------------------------------------------- especialistas */

function seo(d: DatosAuditoria): Hallazgo[] {
  const h: Hallazgo[] = [];
  const genero = primerValor(d.genero);
  const ciudad = primerValor(d.ciudad);

  const base1: Base = { id: 'genero-ciudad', especialista: 'seo', impacto: 3, esfuerzoMin: 2, titulo: 'Género y ciudad en vuestro perfil', fuente: 'criterio-musica' };
  h.push(genero && ciudad
    ? ok(base1, `Os buscan por «${genero.toLowerCase()} ${ciudad}»: lo tenéis definido.`)
    : mejorar(base1, `Falta ${[!genero && 'el género', !ciudad && 'la ciudad'].filter(Boolean).join(' y ')} en el perfil de la banda.`,
      'Rellenadlo en el perfil de BandManager: sin eso el SEO y el asesor trabajan a ciegas.'));

  const conUrl = d.redes.map((r) => ({ red: r, handle: handleDe(d.perfiles[r]?.url) })).filter((x) => x.handle);
  const base2: Base = { id: 'mismo-arroba', especialista: 'seo', impacto: 2, esfuerzoMin: 15, titulo: 'El mismo @ en todas las redes', fuente: 'criterio-musica' };
  if (conUrl.length < 2) h.push(sinDatos(base2, 'Con menos de dos redes con enlace no se puede comparar.', 'Añadid los enlaces de vuestras redes en el dossier.'));
  else if (new Set(conUrl.map((x) => x.handle)).size === 1) h.push(ok(base2, `Sois @${conUrl[0].handle} en todas.`));
  else h.push(mejorar(base2, `Tenéis nombres distintos: ${conUrl.map((x) => `@${x.handle}`).join(', ')}.`, 'Unificad el @ donde podáis: quien os ve en una red os encuentra antes en las demás.'));

  if (d.redes.includes('instagram')) {
    const base3: Base = { id: 'nombre-instagram', especialista: 'seo', impacto: 2, esfuerzoMin: 5, titulo: 'El nombre de Instagram con género y ciudad', fuente: 'criterio-musica' };
    const n = d.nombreInstagram;
    if (!n) h.push(sinDatos(base3, 'No sabemos qué pone en el campo «Nombre» (no el @), que es el que se busca.', `Comprobad que sea algo como «${d.nombre} | ${[genero, ciudad].filter(Boolean).join(' ')}».`));
    else if (tieneGenero(n, d.genero) || tieneCiudad(n, d.ciudad)) h.push(ok(base3, `Vuestro nombre dice «${n}».`));
    else h.push(mejorar(base3, `Vuestro nombre dice «${n}»: sin género ni ciudad.`, `Cambiadlo por «${d.nombre} | ${[genero, ciudad].filter(Boolean).join(' ')}».`));
  }

  const baseS: Base = { id: 'escucha-fuera', especialista: 'seo', impacto: 2, esfuerzoMin: 5, titulo: 'Dónde escucharos fuera de las redes', fuente: 'criterio-musica' };
  h.push(d.spotify ? ok(baseS, 'Tenéis Spotify enlazado.') : mejorar(baseS, 'No hay un sitio de escucha enlazado.', 'Añadid vuestro Spotify (u otro) en el dossier: quien os descubre en un vídeo busca dónde escucharos.'));

  const baseB: Base = { id: 'bio-dossier', especialista: 'seo', impacto: 2, esfuerzoMin: 20, titulo: 'La biografía del dossier, lo que enseña Google', fuente: 'criterio-musica' };
  const bio = d.biografiaEpk.trim();
  if (!bio) h.push(mejorar(baseB, 'No hay biografía en el dossier.', 'Escribid 3 o 4 frases: género y ciudad en las dos primeras.'));
  else if (!tieneGenero(bio, d.genero) || !tieneCiudad(bio, d.ciudad)) h.push(mejorar(baseB, 'La biografía no dice género y ciudad.', 'Que las dos primeras frases digan qué tocáis y desde dónde.'));
  else h.push(ok(baseB, 'La biografía dice género y ciudad.'));
  return h;
}

/** Bio de una red: longitud, palabras clave y llamada a la acción. */
function bioDeRed(d: DatosAuditoria, red: Red, especialista: Especialista, nombreRed: string, conCta: boolean): Hallazgo[] {
  const h: Hallazgo[] = [];
  const perfil = d.perfiles[red];
  const bio = perfil?.bio?.trim() ?? '';
  const pegar = `Pegad vuestra bio de ${nombreRed} en «Pega tus bios» y la revisamos.`;
  const limite = LIMITE_BIO[red];

  const bL: Base = { id: `${red}-bio-longitud`, especialista, impacto: 1, esfuerzoMin: 5, titulo: `La bio de ${nombreRed} cabe (${limite} caracteres)`, fuente: 'criterio-musica' };
  h.push(!bio ? sinDatos(bL, `No conocemos vuestra bio de ${nombreRed}.`, pegar)
    : bio.length <= limite ? ok(bL, `Ocupa ${bio.length} de ${limite} caracteres.`)
    : mejorar(bL, `Ocupa ${bio.length} y el límite es ${limite}.`, `Recortadla: ${nombreRed} la corta y se pierde justo el final, que suele ser la llamada a la acción.`));

  const bK: Base = { id: `${red}-bio-palabras`, especialista, impacto: 3, esfuerzoMin: 5, titulo: `Género y ciudad en la bio de ${nombreRed}`, fuente: 'criterio-musica' };
  if (!bio) h.push(sinDatos(bK, `No conocemos vuestra bio de ${nombreRed}.`, pegar));
  else {
    const faltan = [!tieneGenero(bio, d.genero) && 'el género', !tieneCiudad(bio, d.ciudad) && 'la ciudad'].filter(Boolean);
    h.push(faltan.length === 0 ? ok(bK, 'Dice qué tocáis y desde dónde.')
      : mejorar(bK, `No dice ${faltan.join(' ni ')}.`, 'Quien os busca escribe «género + ciudad»: que la bio lo diga en la primera línea.'));
  }

  if (conCta) {
    const bC: Base = { id: `${red}-bio-cta`, especialista, impacto: 2, esfuerzoMin: 5, titulo: `Una llamada a la acción en la bio de ${nombreRed}`, fuente: 'criterio-musica' };
    h.push(!bio ? sinDatos(bC, `No conocemos vuestra bio de ${nombreRed}.`, pegar)
      : CTA.test(normalizar(bio)) ? ok(bC, 'Dice qué hacer a continuación.')
      : mejorar(bC, 'No dice qué hacer a continuación.', 'Cerrad con una sola acción: «Próximos bolos y entradas en el enlace».'));
  }
  return h;
}

function red(d: DatosAuditoria, r: Red, especialista: Especialista, nombreRed: string, conCta: boolean): Hallazgo[] {
  const base: Base = { id: `${r}-perfil`, especialista, impacto: 3, esfuerzoMin: 5, titulo: `Enlace a vuestro ${nombreRed}`, fuente: 'criterio-musica' };
  const url = d.perfiles[r]?.url;
  return [
    url ? ok(base, 'Está enlazado en el dossier.') : mejorar(base, `No hay enlace a vuestro ${nombreRed} en el dossier.`, `Añadidlo en el dossier: es el primer sitio donde un programador os busca.`),
    ...bioDeRed(d, r, especialista, nombreRed, conCta),
  ];
}

function youtube(d: DatosAuditoria): Hallazgo[] {
  const h = red(d, 'youtube', 'youtube', 'YouTube', false);
  const desc = d.perfiles.youtube?.bio?.trim() ?? '';
  const base: Base = { id: 'youtube-descripcion-enlace', especialista: 'youtube', impacto: 2, esfuerzoMin: 5, titulo: 'Un enlace en la descripción del canal', fuente: 'yt-ctr' };
  h.push(!desc ? sinDatos(base, 'No conocemos la descripción de vuestro canal.', 'Pegad la descripción del canal en «Pega tus bios».')
    : /https?:\/\/|bandmanager\.io\/r\//i.test(desc) ? ok(base, 'La descripción lleva un enlace.')
    : mejorar(base, 'La descripción no lleva ningún enlace.', 'Añadid el enlace de entradas o de vuestra página: es lo que convierte la visita en acción.'));
  return h;
}

function ctr(d: DatosAuditoria): Hallazgo[] {
  const h: Hallazgo[] = [];
  const bolo = d.proximoBolo;

  const baseSeg: Base = { id: 'enlace-seguimiento', especialista: 'ctr', impacto: 3, esfuerzoMin: 5, titulo: 'Un enlace con seguimiento por red', fuente: 'ig-metricas' };
  const sin = d.redes.filter((r) => !d.enlaces[r]);
  h.push(sin.length === 0 ? ok(baseSeg, 'Cada red tiene su enlace: sabéis cuál os trae clics.')
    : mejorar(baseSeg, `Sin enlace con seguimiento en ${sin.join(', ')}.`, 'Crearlo en «Enlaces y clics» y ponerlo en la bio: sin él no sabéis qué red os trae gente.'));

  const baseDest: Base = { id: 'enlace-destino', especialista: 'ctr', impacto: 3, esfuerzoMin: 3, titulo: 'El enlace de la bio lleva donde se vende', fuente: 'criterio-musica' };
  const con = d.redes.flatMap((r) => (d.enlaces[r] ? [{ red: r, ...d.enlaces[r]! }] : []));
  if (con.length === 0) h.push(sinDatos(baseDest, 'Aún no hay enlaces con seguimiento que revisar.', 'Crea uno en «Enlaces y clics».'));
  else if (bolo && bolo.dias <= DIAS_BOLO_CERCANO) {
    const mal = con.filter((e) => !(e.concertId === bolo.id && (e.destino === 'entradas' || e.destino === 'concierto')));
    h.push(mal.length === 0 ? ok(baseDest, `Los enlaces llevan al bolo del ${diaMes(bolo.fecha)}.`)
      : mejorar(baseDest, `Faltan ${bolo.dias} días para el bolo y el enlace de ${mal.map((e) => e.red).join(', ')} no lleva a él.`,
        'Cambiad el enlace de la bio por el del bolo: a esta distancia cada clic tiene que acabar en entradas.'));
  } else h.push(ok(baseDest, 'Sin bolo cerca, un enlace al dossier o a vuestra página vale.'));

  if (bolo) {
    const baseEnt: Base = { id: 'bolo-entradas', especialista: 'ctr', impacto: 3, esfuerzoMin: 3, titulo: 'El próximo bolo tiene enlace de entradas', fuente: 'criterio-musica' };
    h.push(bolo.tieneEntradas ? ok(baseEnt, `El bolo de ${bolo.sala} tiene entradas enlazadas.`)
      : mejorar(baseEnt, `El bolo de ${bolo.sala} (${diaMes(bolo.fecha)}) no tiene enlace de entradas.`, 'Añadidlo en el calendario: sin él, cada clic de interés se pierde.'));
  }

  const baseV: Base = { id: 'identidad-visual', especialista: 'ctr', impacto: 2, esfuerzoMin: 20, titulo: 'Un elemento visual que os reconozca en el scroll', fuente: 'yt-ctr' };
  h.push(d.logo && d.fotos >= 3 ? ok(baseV, `Tenéis logo y ${d.fotos} fotos para las portadas.`)
    : mejorar(baseV, `${d.logo ? '' : 'Falta el logo. '}${d.fotos >= 3 ? '' : `Hay ${d.fotos} fotos (faltan para variar portadas y stories).`}`.trim(),
      'Subid el logo y al menos 3 fotos buenas al dossier: las portadas con un elemento recurrente se reconocen en el scroll.'));

  const baseC: Base = { id: 'contacto-booking', especialista: 'ctr', impacto: 2, esfuerzoMin: 3, titulo: 'Quien quiere contrataros sabe cómo', fuente: 'criterio-musica' };
  h.push(d.emailBooking ? ok(baseC, 'Hay un email de contratación.') : mejorar(baseC, 'No hay email de contratación en el dossier.', 'Añadidlo: una sala que os quiere no va a buscarlo.'));
  return h;
}

/* ----------------------------------------------------------------- la auditoría */

const ORDEN: Especialista[] = ['seo', 'instagram', 'tiktok', 'youtube', 'ctr'];

export function auditar(d: DatosAuditoria): Auditoria {
  const porEspecialista: Record<Especialista, Hallazgo[]> = {
    seo: seo(d),
    instagram: d.redes.includes('instagram') ? red(d, 'instagram', 'instagram', 'Instagram', true) : [],
    tiktok: d.redes.includes('tiktok') ? red(d, 'tiktok', 'tiktok', 'TikTok', true) : [],
    youtube: d.redes.includes('youtube') ? youtube(d) : [],
    ctr: ctr(d),
  };
  const especialistas: ResultadoEspecialista[] = ORDEN.filter((id) => porEspecialista[id].length > 0).map((id) => {
    const hallazgos = porEspecialista[id];
    return {
      id, nombre: NOMBRE_ESPECIALISTA[id], hallazgos,
      ok: hallazgos.filter((x) => x.estado === 'ok').length,
      mejorar: hallazgos.filter((x) => x.estado === 'mejorar').length,
      sinDatos: hallazgos.filter((x) => x.estado === 'sin_datos').length,
    };
  });
  const todos = especialistas.flatMap((e) => e.hallazgos);
  const prioridades = todos
    .filter((x) => x.estado === 'mejorar')
    .sort((a, b) => b.impacto - a.impacto || a.esfuerzoMin - b.esfuerzoMin)
    .slice(0, MAX_PRIORIDADES);
  return {
    especialistas, prioridades,
    resumen: { ok: todos.filter((x) => x.estado === 'ok').length, mejorar: todos.filter((x) => x.estado === 'mejorar').length, sinDatos: todos.filter((x) => x.estado === 'sin_datos').length },
  };
}

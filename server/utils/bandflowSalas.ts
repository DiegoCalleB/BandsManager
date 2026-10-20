/**
 * Salas de Bandflow (directorio colaborativo de salas, bandflow.es) a partir de lo que muestra su ficha pública: reglas
 * puras, sin red. Se recogen solo hechos de la sala (nombre, dirección, aforo, web, redes y contacto de la sala) y con las
 * mismas reglas de privacidad que el resto del catálogo: email solo de rol, teléfono solo fijo, Instagram solo si se parece
 * al nombre de la sala. No se recogen las reseñas ni los perfiles de usuarios, ni la descripción de la sala.
 */
import {
  claveSala, emailDeRol, instagramDeLaSala, instagramPublico, telefonoFijoEs, textoPublico, urlPublica,
  type CamposPublicosSala,
} from './salaCatalogo.js';
import { regionDeCodigoPostal } from './regionesEspana.js';

/** Lo que se lee de una ficha: los datos estructurados (JSON-LD) y los enlaces de contacto de la página. */
export interface FichaBandflow {
  url: string;
  sala?: {
    name?: string;
    address?: { addressLocality?: string; streetAddress?: string; postalCode?: string; addressRegion?: string };
    email?: string;
    telephone?: string;
    sameAs?: string[];
    maximumAttendeeCapacity?: number;
  } | null;
  tel?: string[];
  mail?: string[];
  instagram?: string[];
  web?: string[];
}

/** Nombres de comunidad como los usa el resto del catálogo. */
const COMUNIDADES: Record<string, string> = {
  madrid: 'Comunidad de Madrid', 'comunidad de madrid': 'Comunidad de Madrid',
  cataluna: 'Cataluña', catalunya: 'Cataluña',
  andalucia: 'Andalucía', galicia: 'Galicia', 'pais vasco': 'País Vasco', euskadi: 'País Vasco',
  'comunidad valenciana': 'Comunidad Valenciana', 'comunitat valenciana': 'Comunidad Valenciana', valencia: 'Comunidad Valenciana',
  murcia: 'Región de Murcia', 'region de murcia': 'Región de Murcia',
  asturias: 'Asturias', 'principado de asturias': 'Asturias',
  'castilla y leon': 'Castilla y León', 'castilla-la mancha': 'Castilla-La Mancha', 'castilla la mancha': 'Castilla-La Mancha',
  aragon: 'Aragón', navarra: 'Navarra', 'la rioja': 'La Rioja', cantabria: 'Cantabria', canarias: 'Canarias',
  'islas baleares': 'Islas Baleares', 'illes balears': 'Islas Baleares', baleares: 'Islas Baleares', extremadura: 'Extremadura',
  ceuta: 'Ceuta', melilla: 'Melilla',
};

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** La comunidad de una ficha: la que declara (normalizada) o, si no, la que sale de su código postal. */
export function regionDeBandflow(region: unknown, codigoPostal: unknown): string | null {
  const declarada = typeof region === 'string' ? COMUNIDADES[sinAcentos(region)] : undefined;
  return declarada ?? regionDeCodigoPostal(codigoPostal);
}

const primero = <T>(valores: Array<T | null | undefined>): T | null => valores.find((v): v is T => v !== null && v !== undefined) ?? null;
const limpiar = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const esInstagram = (u: string) => /instagram\.com/i.test(u);

/** La sala que describe una ficha, o null si no se puede identificar (sin nombre o sin ciudad). */
export function salaDesdeBandflow(f: FichaBandflow): CamposPublicosSala | null {
  const s = f.sala;
  const nombre = textoPublico(s?.name);
  const ciudad = textoPublico(s?.address?.addressLocality, 80);
  const clave = nombre && ciudad ? claveSala({ nombre, ciudad }) : null;
  if (!s || !nombre || !ciudad || !clave) return null;

  const enlaces = [...(s.sameAs ?? []), ...(f.web ?? [])].map(limpiar).filter(Boolean);
  const usuarioIg = primero([...(f.instagram ?? []), ...enlaces.filter(esInstagram)].map((u) => instagramPublico(u)));
  const direccion = textoPublico([limpiar(s.address?.streetAddress), limpiar(s.address?.postalCode)].filter(Boolean).join(', '), 160);
  const aforo = typeof s.maximumAttendeeCapacity === 'number' && Number.isInteger(s.maximumAttendeeCapacity) && s.maximumAttendeeCapacity > 0 && s.maximumAttendeeCapacity <= 200_000 ? s.maximumAttendeeCapacity : null;

  return {
    clave,
    place_id: null,
    nombre,
    ciudad,
    region: regionDeBandflow(s.address?.addressRegion, s.address?.postalCode),
    direccion,
    tipo: 'sala',
    aforo,
    genero: null,
    website: primero(enlaces.filter((u) => !esInstagram(u) && !/\.pdf(\?|$)/i.test(u)).map((u) => urlPublica(/^https?:/i.test(u) ? u : `https://${u}`))),
    instagram: instagramDeLaSala(usuarioIg, nombre),
    email_contacto: primero([s.email, ...(f.mail ?? [])].map((e) => emailDeRol(limpiar(e)))),
    telefono: primero([s.telephone, ...(f.tel ?? [])].map((t) => telefonoFijoEs(limpiar(t)))),
  };
}

/** Salas de una carga completa, una por clave (una sala repetida no se cuenta dos veces). */
export function salasDeBandflow(fichas: readonly FichaBandflow[]): CamposPublicosSala[] {
  const porClave = new Map<string, CamposPublicosSala>();
  for (const f of fichas) {
    const sala = salaDesdeBandflow(f);
    if (sala && !porClave.has(sala.clave)) porClave.set(sala.clave, sala);
  }
  return [...porClave.values()];
}

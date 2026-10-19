/**
 * Salas de España a partir de OpenStreetMap (datos abiertos, ODbL): reglas puras, sin red ni base de datos.
 *
 * Se usa OSM y no Google Places porque Google no permite guardar sus fichas de forma masiva. De cada elemento solo se
 * recogen los campos públicos de la sala, con las mismas reglas de privacidad que el resto del catálogo: email solo
 * de rol, teléfono solo fijo e Instagram solo si se parece al nombre de la sala.
 */
import {
  claveSala, emailDeRol, instagramDeLaSala, instagramPublico, telefonoFijoEs, textoPublico, urlPublica,
  type CamposPublicosSala,
} from './salaCatalogo.js';
import { regionDeCodigoPostal } from './regionesEspana.js';

export interface ElementoOsm {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

/**
 * Comunidades y ciudades autónomas de España (códigos ISO 3166-2). Una sola consulta para todo el país hace que los
 * servidores públicos de Overpass respondan 500 o 502 por exceso de carga; por comunidad pasa sin problema.
 */
export const REGIONES_OSM = ['ES-AN', 'ES-AR', 'ES-AS', 'ES-CB', 'ES-CE', 'ES-CL', 'ES-CM', 'ES-CN', 'ES-CT', 'ES-EX', 'ES-GA', 'ES-IB', 'ES-MC', 'ES-MD', 'ES-ML', 'ES-NC', 'ES-PV', 'ES-RI', 'ES-VC'] as const;

/**
 * Consulta Overpass de las salas de música en directo y los locales de conciertos de una comunidad (código ISO 3166-2,
 * por ejemplo `ES-MD`). Sin bares, cafés ni discotecas: meten mucho ruido y a una banda le sirven poco.
 */
export const consultaOverpassSalas = (region: string): string => `[out:json][timeout:90];
area["ISO3166-2"="${region.replace(/[^A-Z0-9-]/g, '')}"]->.r;
(
  nwr["amenity"="music_venue"](area.r);
  nwr["amenity"="concert_hall"](area.r);
);
out tags;`;

const CAPACIDAD_MAXIMA = 200_000;

const etiqueta = (t: Record<string, string>, ...claves: string[]): string | undefined => claves.map((c) => t[c]).find((v) => typeof v === 'string' && v.trim());

/** Primer valor válido de una etiqueta que puede traer varios separados por «;». */
const primerValido = <T>(valor: string | undefined, validar: (v: string) => T | null): T | null => {
  for (const parte of (valor ?? '').split(';')) {
    const ok = validar(parte.trim());
    if (ok) return ok;
  }
  return null;
};

function aforoDe(valor: string | undefined): number | null {
  const n = Number(String(valor ?? '').replace(/[^\d]/g, ''));
  return Number.isInteger(n) && n > 0 && n <= CAPACIDAD_MAXIMA ? n : null;
}

/** La sala que describe un elemento de OSM, o null si no tiene nombre o ciudad (sin ellos no se puede identificar). */
export function salaDesdeOsm(el: ElementoOsm): CamposPublicosSala | null {
  const t = el.tags ?? {};
  const nombre = textoPublico(t.name);
  const ciudad = textoPublico(etiqueta(t, 'addr:city', 'addr:municipality', 'addr:place'), 80);
  const clave = nombre && ciudad ? claveSala({ nombre, ciudad }) : null;
  if (!nombre || !clave) return null;

  const calle = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  const direccion = textoPublico([calle, t['addr:postcode']].filter(Boolean).join(', '), 160);
  const usuarioIg = instagramPublico(etiqueta(t, 'contact:instagram', 'instagram'));

  return {
    clave,
    place_id: null,
    nombre,
    ciudad,
    region: regionDeCodigoPostal(t['addr:postcode']) ?? textoPublico(t['addr:state'] ?? t['addr:province'], 60),
    direccion,
    tipo: t.amenity === 'nightclub' ? 'discoteca' : 'sala',
    aforo: aforoDe(t.capacity),
    genero: textoPublico(t['music:genre'] ?? t.genre, 80),
    website: urlPublica(etiqueta(t, 'website', 'contact:website', 'url')),
    instagram: instagramDeLaSala(usuarioIg, nombre),
    email_contacto: primerValido(etiqueta(t, 'email', 'contact:email'), emailDeRol),
    telefono: primerValido(etiqueta(t, 'phone', 'contact:phone'), telefonoFijoEs),
  };
}

/** Los campos que tiene `a` los conserva; los que le faltan se completan con los de `b`. */
function completar(a: CamposPublicosSala, b: CamposPublicosSala): CamposPublicosSala {
  const hueco = (v: unknown) => v === null || v === undefined || v === '';
  const resultado = { ...a } as Record<string, unknown>;
  for (const [k, v] of Object.entries(b)) if (hueco(resultado[k])) resultado[k] = v;
  return resultado as unknown as CamposPublicosSala;
}

/** Salas de una descarga de OSM, una por clave: el mismo local mapeado dos veces (nodo y edificio) se fusiona. */
export function salasDeOsm(elementos: ElementoOsm[]): CamposPublicosSala[] {
  const porClave = new Map<string, CamposPublicosSala>();
  for (const el of elementos) {
    const sala = salaDesdeOsm(el);
    if (!sala) continue;
    const previa = porClave.get(sala.clave);
    porClave.set(sala.clave, previa ? completar(previa, sala) : sala);
  }
  return [...porClave.values()];
}

export { completar as completarSala };

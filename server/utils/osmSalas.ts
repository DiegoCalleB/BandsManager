/**
 * Salas de España a partir de OpenStreetMap (datos abiertos, ODbL): reglas puras, sin red ni base de datos.
 *
 * Se usa OSM y no Google Places porque Google no permite guardar sus fichas de forma masiva. De cada elemento solo se
 * recogen los campos públicos de la sala, con las mismas reglas de privacidad que el resto del catálogo: email solo
 * de rol, teléfono solo fijo e Instagram solo si se parece al nombre de la sala.
 */
import {
  claveSala, emailDeRol, esRecintoMasivo, instagramDeLaSala, instagramPublico, telefonoFijoEs, textoPublico, urlPublica,
  type CamposPublicosSala,
} from './salaCatalogo.js';
import { regionDeCodigoPostal } from './regionesEspana.js';

export interface ElementoOsm {
  type: string;
  id: number;
  tags?: Record<string, string>;
  /** Coordenadas de un nodo. */
  lat?: number;
  lon?: number;
  /** Punto central de una vía o relación (`out center`). */
  center?: { lat: number; lon: number };
}

/**
 * Comunidades y ciudades autónomas de España (códigos ISO 3166-2). Una sola consulta para todo el país hace que los
 * servidores públicos de Overpass respondan 500 o 502 por exceso de carga; por comunidad pasa sin problema.
 */
export const REGIONES_OSM = ['ES-AN', 'ES-AR', 'ES-AS', 'ES-CB', 'ES-CE', 'ES-CL', 'ES-CM', 'ES-CN', 'ES-CT', 'ES-EX', 'ES-GA', 'ES-IB', 'ES-MC', 'ES-MD', 'ES-ML', 'ES-NC', 'ES-PV', 'ES-RI', 'ES-VC'] as const;

/**
 * Consulta Overpass de las salas de música en directo y los locales de conciertos de una comunidad (código ISO 3166-2,
 * por ejemplo `ES-MD`). Discotecas, teatros y centros de arte solo si declaran música en directo; sin bares ni cafés: meten
 * mucho ruido y a una banda le sirven poco. Trae también las
 * ciudades, pueblos y aldeas de la comunidad: muchas salas no llevan `addr:city` y su ciudad se saca del núcleo más cercano.
 */
const FILTROS_SALAS = `  nwr["amenity"="music_venue"](area.r);
  nwr["amenity"="concert_hall"](area.r);
  nwr["amenity"~"^(nightclub|theatre|arts_centre)$"]["live_music"="yes"](area.r);`;

const areaDe = (region: string) => `area["ISO3166-2"="${region.replace(/[^A-Z0-9-]/g, '')}"]->.r;`;

export const consultaOverpassSalas = (region: string): string => `[out:json][timeout:90];
${areaDe(region)}
(
${FILTROS_SALAS}
);
out tags center;
node["place"~"^(city|town|village)$"](area.r);
out tags center;`;

/**
 * Lo mismo sin los núcleos de población: es mucho más ligera (los pueblos de una comunidad son miles de nodos) y responde
 * cuando el servicio público está saturado. Las salas sin `addr:city` se quedan fuera esta vez y entran cuando la consulta completa pase.
 */
export const consultaOverpassSoloSalas = (region: string): string => `[out:json][timeout:60];
${areaDe(region)}
(
${FILTROS_SALAS}
);
out tags center;`;

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
  if (esRecintoMasivo({ nombre, aforo: aforoDe(t.capacity), tipo: 'sala' })) return null;

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

/** Por qué se descartan elementos de OSM: sin nombre o sin ciudad no se pueden identificar. Sirve para explicar un resultado corto. */
export function contarDescartes(elementos: ElementoOsm[]): { sinNombre: number; sinCiudad: number } {
  let sinNombre = 0;
  let sinCiudad = 0;
  for (const el of elementos) {
    const t = el.tags ?? {};
    if (!textoPublico(t.name)) sinNombre++;
    else if (!textoPublico(etiqueta(t, 'addr:city', 'addr:municipality', 'addr:place'), 80)) sinCiudad++;
  }
  return { sinNombre, sinCiudad };
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

/** Dónde está cada sala de una descarga de OSM, por clave. Una sala mapeada dos veces conserva el primer punto. */
export function coordenadasDeOsm(elementos: ElementoOsm[]): Map<string, { lat: number; lon: number }> {
  const puntos = new Map<string, { lat: number; lon: number }>();
  for (const el of elementos) {
    const sala = salaDesdeOsm(el);
    const p = sala && punto(el);
    if (sala && p && !puntos.has(sala.clave)) puntos.set(sala.clave, p);
  }
  return puntos;
}

const KM_MAXIMOS_AL_NUCLEO = 12;

const punto = (el: ElementoOsm): { lat: number; lon: number } | null => {
  const p = el.center ?? (typeof el.lat === 'number' && typeof el.lon === 'number' ? { lat: el.lat, lon: el.lon } : null);
  return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? p : null;
};

/** Distancia en km entre dos puntos (fórmula de Haversine). */
export function distanciaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const NUCLEO = /^(city|town|village)$/;
const tieneCiudad = (t: Record<string, string>) => !!textoPublico(etiqueta(t, 'addr:city', 'addr:municipality', 'addr:place'), 80);

/**
 * Las salas de una descarga con su ciudad resuelta. Muchas no llevan `addr:city`; a esas se les pone el nombre del núcleo
 * de población (ciudad, pueblo o aldea) más cercano, si está a menos de 12 km. Es una aproximación, no una dirección, así que
 * se cuenta aparte (`porCercania`). Los núcleos no son salas y no salen en el resultado.
 */
export function conCiudadResuelta(elementos: ElementoOsm[]): { salas: ElementoOsm[]; porCercania: number } {
  const nucleos: Array<{ nombre: string; p: { lat: number; lon: number } }> = [];
  const candidatas: ElementoOsm[] = [];
  for (const el of elementos) {
    const t = el.tags ?? {};
    const p = punto(el);
    if (t.place && NUCLEO.test(t.place) && !t.amenity) {
      const nombre = textoPublico(t.name, 80);
      if (nombre && p) nucleos.push({ nombre, p });
    } else candidatas.push(el);
  }

  let porCercania = 0;
  const salas = candidatas.map((el) => {
    const t = el.tags ?? {};
    const p = punto(el);
    if (tieneCiudad(t) || !p) return el;
    let mejor: { nombre: string; km: number } | null = null;
    for (const n of nucleos) {
      const km = distanciaKm(p, n.p);
      if (km <= KM_MAXIMOS_AL_NUCLEO && (!mejor || km < mejor.km)) mejor = { nombre: n.nombre, km };
    }
    if (!mejor) return el;
    porCercania++;
    return { ...el, tags: { ...t, 'addr:city': mejor.nombre } };
  });
  return { salas, porCercania };
}

export { completar as completarSala };

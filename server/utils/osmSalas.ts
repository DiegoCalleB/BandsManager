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

/** Consulta Overpass de los recintos de música en directo de España. */
export const CONSULTA_OVERPASS_SALAS = `[out:json][timeout:240];
area["ISO3166-1"="ES"][admin_level=2]->.es;
(
  nwr["amenity"="music_venue"](area.es);
  nwr["amenity"="concert_hall"](area.es);
  nwr["amenity"="nightclub"](area.es);
  nwr["amenity"~"^(bar|pub|cafe|restaurant)$"]["live_music"="yes"](area.es);
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

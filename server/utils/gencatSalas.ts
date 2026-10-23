/**
 * Salas de Cataluña del conjunto «Equipaments culturals de Catalunya» (Departament de Cultura de la Generalitat, datos abiertos):
 * reglas puras, sin red. Se recogen solo hechos del local (nombre, dirección, municipio, aforo, web, teléfono fijo y su punto en
 * el mapa), con las reglas de privacidad del catálogo: email solo de rol y teléfono solo fijo. Hay que citar la fuente.
 *
 * Entran solo las «Sales de concerts» (unas 50). Las salas polivalentes (unas 310) son sobre todo centros sociales, ateneos y salas
 * municipales de pueblo con nombres genéricos: no le sirven a una banda que busca dónde tocar y meterían ruido en el catálogo.
 */
import { claveSala, emailDeRol, esRecintoMasivo, telefonoFijoEs, textoPublico, urlPublica, type CamposPublicosSala } from './salaCatalogo.js';
import type { FichaDeFuente } from '../services/importarDeFuente.js';

export const FUENTE_GENCAT = 'gencat';
export const URL_GENCAT = 'https://analisi.transparenciacatalunya.cat/resource/48s6-82h2.json';
/** Página del conjunto de datos, para citarla. */
export const PAGINA_GENCAT = 'https://analisi.transparenciacatalunya.cat/d/48s6-82h2';

export const consultaGencat = (): string =>
  `${URL_GENCAT}?${new URLSearchParams({ $where: "subtipus = 'Sales de concerts'", $limit: '500' })}`;

export interface FilaGencat {
  nom?: string;
  subtipus?: string;
  titularitat?: string;
  adre_a?: string;
  codi_postal?: string;
  municipi?: string;
  latitud?: string;
  longitud?: string;
  tel_fon?: string;
  adre_a_electr_nica?: string;
  adre_a_web?: string;
  aforament_total?: string;
}

/** Palabras que en un nombre de local van en minúscula (salvo la primera). */
const CONECTORES = new Set(['de', 'del', 'la', 'el', 'els', 'les', 'i', 'y', 'd', 'l', 'en', 'a', 'al']);

/** Los nombres del conjunto vienen en mayúsculas («BIKINI BARCELONA»): se pasan a «Bikini Barcelona». Los que ya mezclan se respetan. */
export function nombreLegible(nombre: string): string {
  if (nombre !== nombre.toUpperCase() || nombre === nombre.toLowerCase()) return nombre;
  let primera = true;
  return nombre.toLowerCase().replace(/\p{L}+/gu, (palabra) => {
    const esPrimera = primera;
    primera = false;
    return !esPrimera && CONECTORES.has(palabra) ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1);
  });
}

/** Un nombre que solo dice qué tipo de espacio es («Sala», «Sala de concerts») no identifica a la sala. */
const NOMBRE_GENERICO = /^(sala|espai|local)( de concerts| municipal| polivalent)?$/i;

const numero = (v: string | undefined): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 200_000 ? n : null;
};

const punto = (lat: string | undefined, lon: string | undefined): { lat: number; lon: number } | null => {
  const p = { lat: Number(lat), lon: Number(lon) };
  return Number.isFinite(p.lat) && Number.isFinite(p.lon) && p.lat >= 27 && p.lat <= 44.2 && p.lon >= -18.5 && p.lon <= 4.6 ? p : null;
};

export function fichasDeGencat(filas: readonly FilaGencat[]): FichaDeFuente[] {
  const fichas: FichaDeFuente[] = [];
  for (const f of filas) {
    if (f.subtipus !== 'Sales de concerts') continue;
    const nombre = textoPublico(f.nom ? nombreLegible(f.nom.trim()) : null);
    const ciudad = textoPublico(f.municipi, 80);
    if (!nombre || !ciudad || NOMBRE_GENERICO.test(nombre)) continue;
    const clave = claveSala({ nombre, ciudad });
    const aforo = numero(f.aforament_total);
    if (!clave || esRecintoMasivo({ nombre, aforo, tipo: 'sala' })) continue;
    const campos: CamposPublicosSala = {
      clave,
      place_id: null,
      nombre,
      ciudad,
      region: 'Cataluña',
      direccion: textoPublico([f.adre_a, f.codi_postal].filter((x) => x && x !== 'NA').join(', '), 160),
      tipo: 'sala',
      aforo,
      genero: null,
      website: urlPublica(f.adre_a_web),
      instagram: null,
      email_contacto: emailDeRol(f.adre_a_electr_nica),
      telefono: telefonoFijoEs(f.tel_fon),
    };
    fichas.push({ campos, punto: punto(f.latitud, f.longitud) });
  }
  return fichas;
}

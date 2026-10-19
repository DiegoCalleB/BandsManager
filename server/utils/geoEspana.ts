/**
 * Geografía de España para el directorio público de salas: de los textos de `region` y `ciudad` del catálogo
 * (que vienen de leads escritos a mano, a veces «Madrid», a veces «Comunidad de Madrid» o «Galicia (A Coruña)»)
 * a una comunidad y, si se puede, una provincia. Puro. Lo que no encaja devuelve `null`: una sala de Lisboa
 * o con una región ilegible no entra en las páginas por zona en vez de colocarse a ojo.
 */
import { regionDeCodigoPostal } from './regionesEspana.js';

export interface Zona {
  comunidad: string;
  /** Null cuando el texto solo permite saber la comunidad («País Vasco», «Galicia»). */
  provincia: string | null;
}

/** [prefijo del código postal, nombre de la provincia, otros nombres con los que se la conoce (sin tildes, en minúsculas)]. */
const PROVINCIAS: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  ['01', 'Álava', ['alava', 'araba', 'vitoria', 'vitoria gasteiz']],
  ['02', 'Albacete', []],
  ['03', 'Alicante', ['alacant']],
  ['04', 'Almería', []],
  ['05', 'Ávila', []],
  ['06', 'Badajoz', []],
  ['07', 'Baleares', ['islas baleares', 'illes balears', 'palma', 'palma de mallorca', 'mallorca', 'ibiza', 'eivissa', 'menorca', 'formentera']],
  ['08', 'Barcelona', []],
  ['09', 'Burgos', []],
  ['10', 'Cáceres', []],
  ['11', 'Cádiz', []],
  ['12', 'Castellón', ['castello', 'castellon de la plana']],
  ['13', 'Ciudad Real', []],
  ['14', 'Córdoba', []],
  ['15', 'A Coruña', ['la coruna', 'coruna']],
  ['16', 'Cuenca', []],
  ['17', 'Girona', ['gerona']],
  ['18', 'Granada', []],
  ['19', 'Guadalajara', []],
  ['20', 'Gipuzkoa', ['guipuzcoa', 'san sebastian', 'donostia', 'donostia san sebastian']],
  ['21', 'Huelva', []],
  ['22', 'Huesca', []],
  ['23', 'Jaén', []],
  ['24', 'León', []],
  ['25', 'Lleida', ['lerida']],
  ['26', 'La Rioja', ['rioja', 'logrono']],
  ['27', 'Lugo', []],
  ['28', 'Madrid', ['comunidad de madrid']],
  ['29', 'Málaga', []],
  ['30', 'Murcia', ['region de murcia', 'cartagena']],
  ['31', 'Navarra', ['pamplona', 'iruna', 'comunidad foral de navarra']],
  ['32', 'Ourense', ['orense']],
  ['33', 'Asturias', ['principado de asturias', 'oviedo', 'gijon']],
  ['34', 'Palencia', []],
  ['35', 'Las Palmas', ['las palmas de gran canaria', 'gran canaria']],
  ['36', 'Pontevedra', ['vigo']],
  ['37', 'Salamanca', []],
  ['38', 'Santa Cruz de Tenerife', ['tenerife', 'santa cruz']],
  ['39', 'Cantabria', ['santander']],
  ['40', 'Segovia', []],
  ['41', 'Sevilla', []],
  ['42', 'Soria', []],
  ['43', 'Tarragona', []],
  ['44', 'Teruel', []],
  ['45', 'Toledo', []],
  ['46', 'Valencia', []],
  ['47', 'Valladolid', []],
  ['48', 'Bizkaia', ['vizcaya', 'bilbao']],
  ['49', 'Zamora', []],
  ['50', 'Zaragoza', []],
  ['51', 'Ceuta', []],
  ['52', 'Melilla', []],
];

/** Comunidades que se nombran sin provincia. El valor es una provincia cualquiera de la comunidad, solo para sacar su nombre oficial. */
const COMUNIDADES: Readonly<Record<string, string>> = {
  galicia: '15', 'pais vasco': '01', euskadi: '01', cataluna: '08', catalunya: '08', andalucia: '41', aragon: '50',
  'castilla y leon': '47', 'castilla la mancha': '45', extremadura: '06', 'comunidad valenciana': '46', valenciana: '46',
  canarias: '35', 'comunidad de madrid': '28',
};

const sinTildes = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9()]+/g, ' ').trim();

const POR_NOMBRE = new Map<string, readonly [string, string]>();
for (const [cp, nombre, otros] of PROVINCIAS) for (const n of [nombre, ...otros]) POR_NOMBRE.set(sinTildes(n), [cp, nombre]);

const zonaDeCp = (cp: string, provincia: string | null): Zona | null => {
  const comunidad = regionDeCodigoPostal(`${cp}000`);
  return comunidad ? { comunidad, provincia } : null;
};

/** Comunidad (y provincia si consta) de una sala. Se mira primero un nombre de provincia (entre paréntesis, en la región o en la ciudad). */
export function zonaDeSala(region: string | null | undefined, ciudad: string | null | undefined): Zona | null {
  const r = sinTildes(String(region ?? ''));
  const c = sinTildes(String(ciudad ?? ''));
  const entreParentesis = r.match(/\(([^)]+)\)/)?.[1]?.trim();
  const sinParentesis = r.replace(/\([^)]*\)/g, '').trim();
  // La igualdad exacta evita falsos positivos como «San Sebastián de los Reyes», que es de Madrid y no de Gipuzkoa.
  for (const texto of [entreParentesis, sinParentesis, c]) {
    const p = texto ? POR_NOMBRE.get(texto) : undefined;
    if (p) return zonaDeCp(p[0], p[1]);
  }
  const cp = COMUNIDADES[sinParentesis];
  return cp ? zonaDeCp(cp, null) : null;
}

/** Fragmento de URL seguro y estable de un nombre de zona o ciudad. */
export const slugZona = (nombre: string): string => sinTildes(nombre).replace(/[()]/g, '').replace(/ +/g, '-');

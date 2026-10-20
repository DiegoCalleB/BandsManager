/**
 * Salas de conciertos y festivales de música de España desde Wikidata: reglas puras, sin red.
 *
 * Wikidata es dominio público (CC0): se puede guardar y mostrar sin condiciones. De cada elemento solo se recogen hechos de la
 * sala o del festival (nombre, ciudad, comunidad, web, aforo y punto en el mapa); nunca contactos. Los cerrados o terminados
 * (fecha de disolución, de cierre o de fin) no entran. Un elemento sin nombre en ningún idioma (solo su código Q) se descarta.
 */
import { claveSala, esRecintoMasivo, textoPublico, urlPublica, type CamposPublicosSala } from './salaCatalogo.js';
import type { FichaDeFuente } from '../services/importarDeFuente.js';

export const FUENTE_WIKIDATA = 'wikidata';
export const URL_WIKIDATA = 'https://query.wikidata.org/sparql';

/** Clases de Wikidata de cada tipo: festival de música, sala de música en directo y sala de conciertos (y sus subclases). */
const CLASES = { festival: ['wd:Q868557'], sala: ['wd:Q8719053', 'wd:Q1060829'] } as const;

export type TipoWikidata = keyof typeof CLASES;

export const consultaWikidata = (tipo: TipoWikidata): string => `SELECT ?item ?itemLabel ?web ?ciudadLabel ?ccaaLabel ?coord ?aforo WHERE {
  VALUES ?clase { ${CLASES[tipo].join(' ')} }
  ?item wdt:P31/wdt:P279* ?clase ;
        wdt:P17 wd:Q29 .
  FILTER NOT EXISTS { ?item wdt:P576 [] }
  FILTER NOT EXISTS { ?item wdt:P3999 [] }
  FILTER NOT EXISTS { ?item wdt:P582 [] }
  OPTIONAL { ?item wdt:P856 ?web }
  OPTIONAL {
    ?item wdt:P131 ?ciudad .
    OPTIONAL { ?ciudad wdt:P131* ?ccaa . ?ccaa wdt:P31 wd:Q10742 . }
  }
  OPTIONAL { ?item wdt:P625 ?coord }
  OPTIONAL { ?item wdt:P1083 ?aforo }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,ca,gl,eu,en". }
}`;

/** Una fila de la respuesta SPARQL (formato `application/sparql-results+json`). */
export type FilaWikidata = Partial<Record<'item' | 'itemLabel' | 'web' | 'ciudadLabel' | 'ccaaLabel' | 'coord' | 'aforo', { value: string }>>;

const ES_CODIGO_Q = /^Q\d+$/;
const etiqueta = (v: string | undefined, max = 120): string | null => (v && !ES_CODIGO_Q.test(v.trim()) ? textoPublico(v, max) : null);

/** `Point(-3.7 40.4)` (lon lat) a punto; null si no es un punto válido de España. */
export function puntoDeWkt(wkt: string | undefined): { lat: number; lon: number } | null {
  const m = wkt?.match(/^Point\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/);
  if (!m) return null;
  const p = { lon: Number(m[1]), lat: Number(m[2]) };
  return p.lat >= 27 && p.lat <= 44.2 && p.lon >= -18.5 && p.lon <= 4.6 ? p : null;
}

const aforoDe = (v: string | undefined): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 200_000 ? n : null;
};

/**
 * Fichas del catálogo a partir de las filas de una consulta. Un mismo elemento llega en varias filas cuando tiene varias webs o
 * ciudades: se queda con la primera de cada dato. Sin nombre o sin ciudad no se puede identificar y no entra.
 */
export function fichasDeWikidata(filas: readonly FilaWikidata[], tipo: TipoWikidata): FichaDeFuente[] {
  const porItem = new Map<string, FilaWikidata>();
  for (const f of filas) {
    const id = f.item?.value;
    if (!id) continue;
    const previa = porItem.get(id);
    if (!previa) porItem.set(id, { ...f });
    else for (const [k, v] of Object.entries(f) as Array<[keyof FilaWikidata, { value: string }]>) if (!previa[k]) previa[k] = v;
  }
  const fichas: FichaDeFuente[] = [];
  for (const f of porItem.values()) {
    const nombre = etiqueta(f.itemLabel?.value);
    const ciudad = etiqueta(f.ciudadLabel?.value, 80);
    const clave = claveSala({ nombre, ciudad });
    if (!nombre || !ciudad || !clave) continue;
    const aforo = aforoDe(f.aforo?.value);
    const tipoSala = tipo === 'festival' ? 'festival' : 'sala';
    if (esRecintoMasivo({ nombre, aforo, tipo: tipoSala })) continue;
    const campos: CamposPublicosSala = {
      clave,
      place_id: null,
      nombre,
      ciudad,
      region: etiqueta(f.ccaaLabel?.value, 80),
      direccion: null,
      tipo: tipoSala,
      aforo,
      genero: null,
      website: urlPublica(f.web?.value),
      instagram: null,
      email_contacto: null,
      telefono: null,
    };
    fichas.push({ campos, punto: puntoDeWkt(f.coord?.value) });
  }
  return fichas;
}

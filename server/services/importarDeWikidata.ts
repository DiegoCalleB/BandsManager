/**
 * Importación de salas de conciertos y festivales de España desde Wikidata (CC0) al catálogo compartido.
 * Dos consultas SPARQL (festivales y salas), sus filas a fichas (server/utils/wikidataSalas.ts) y la importación común
 * (importarDeFuente): solo añade, rellena huecos y no toca las verificadas.
 */
import { FUENTE_WIKIDATA, URL_WIKIDATA, consultaWikidata, fichasDeWikidata, type FilaWikidata, type TipoWikidata } from '../utils/wikidataSalas.js';
import { importarDeFuente, type InformeFuente, type PuertoFuente } from './importarDeFuente.js';

export type ConsultarWikidata = (sparql: string) => Promise<FilaWikidata[]>;

export interface InformeWikidata extends InformeFuente {
  porTipo: Record<TipoWikidata, number>;
}

export async function importarDeWikidata(p: { puerto: PuertoFuente; consultar: ConsultarWikidata; simulacion?: boolean; ahora?: () => Date }): Promise<InformeWikidata> {
  const festivales = fichasDeWikidata(await p.consultar(consultaWikidata('festival')), 'festival');
  const salas = fichasDeWikidata(await p.consultar(consultaWikidata('sala')), 'sala');
  const informe = await importarDeFuente({ puerto: p.puerto, fuente: FUENTE_WIKIDATA, fichas: [...festivales, ...salas], simulacion: p.simulacion, ahora: p.ahora });
  return { ...informe, porTipo: { festival: festivales.length, sala: salas.length } };
}

/** Consulta real al servicio SPARQL de Wikidata, identificándose como pide su política de uso. */
export const consultarWikidata: ConsultarWikidata = async (sparql) => {
  const r = await fetch(URL_WIKIDATA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json', 'User-Agent': 'BandManager/1.0 (https://bandmanager.io; catalogo de salas)' },
    body: `query=${encodeURIComponent(sparql)}`,
    signal: AbortSignal.timeout(90_000),
  });
  if (!r.ok) throw new Error(`Wikidata respondió ${r.status}`);
  return ((await r.json()) as { results?: { bindings?: FilaWikidata[] } }).results?.bindings ?? [];
};

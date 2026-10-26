/** Importación de las salas de Cataluña (datos abiertos de la Generalitat) al catálogo compartido, con la importación común de fuentes. */
import { FUENTE_GENCAT, consultaGencat, fichasDeGencat, type FilaGencat } from '../utils/gencatSalas.js';
import { importarDeFuente, type InformeFuente, type PuertoFuente } from './importarDeFuente.js';

export type DescargarGencat = () => Promise<FilaGencat[]>;

export const importarDeGencat = async (p: { puerto: PuertoFuente; descargar: DescargarGencat; simulacion?: boolean; ahora?: () => Date }): Promise<InformeFuente> =>
  importarDeFuente({ puerto: p.puerto, fuente: FUENTE_GENCAT, fichas: fichasDeGencat(await p.descargar()), simulacion: p.simulacion, ahora: p.ahora });

/** Descarga real del conjunto de datos (API abierta de la Generalitat). */
export const descargarGencat: DescargarGencat = async () => {
  const r = await fetch(consultaGencat(), { headers: { Accept: 'application/json', 'User-Agent': 'BandManager/1.0 (https://bandmanager.io; catalogo de salas)' }, signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`La Generalitat respondió ${r.status}`);
  return (await r.json()) as FilaGencat[];
};

/**
 * Importación de las salas de España desde OpenStreetMap al catálogo compartido.
 *
 * Solo AÑADE: una sala que ya está en el catálogo no se pisa, únicamente se le rellenan los campos que le faltan, y
 * nunca se toca una verificada. Las nuevas entran como «sin verificar» (la fiabilidad la dan las bandas, no el mapa).
 * Depende de un puerto y de una función de descarga, así que se prueba sin red ni base de datos.
 */
import { calcularFiabilidad, idDeSala, type CamposPublicosSala } from '../utils/salaCatalogo.js';
import { CONSULTA_OVERPASS_SALAS, completarSala, salasDeOsm, type ElementoOsm } from '../utils/osmSalas.js';
import type { PuertoCatalogo, SalaAGuardar, SalaGuardada } from './catalogoSalas.js';

export type PuertoImportacion = Pick<PuertoCatalogo, 'leerSalas' | 'guardarSalas'>;
export type DescargarOsm = () => Promise<ElementoOsm[]>;

export interface InformeImportacion {
  simulacion: boolean;
  elementosLeidos: number;
  salasEnOsm: number;
  nuevas: number;
  completadas: number;
  sinCambios: number;
}

const TAMANO_LOTE = 200;
const CAMPOS: Array<keyof CamposPublicosSala> = ['place_id', 'nombre', 'ciudad', 'region', 'direccion', 'tipo', 'aforo', 'genero', 'website', 'instagram', 'email_contacto', 'telefono'];

const fichaDe = (s: SalaGuardada): CamposPublicosSala => ({ clave: s.clave, ...(Object.fromEntries(CAMPOS.map((c) => [c, s[c]])) as Omit<CamposPublicosSala, 'clave'>) });

function nuevaSala(c: CamposPublicosSala, ahora: Date): SalaAGuardar {
  const { puntuacion, nivel } = calcularFiabilidad({ placeId: false, webDeclarada: !!c.website, emailValido: !!c.email_contacto, bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0 }, ahora);
  return { ...c, id: idDeSala(c.clave), nivel, puntuacion, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, fuentes: ['osm'] };
}

export async function importarSalasDeOsm(p: { puerto: PuertoImportacion; descargar: DescargarOsm; simulacion?: boolean; ahora?: () => Date }): Promise<InformeImportacion> {
  const ahora = (p.ahora ?? (() => new Date()))();
  const elementos = await p.descargar();
  const deOsm = salasDeOsm(elementos);
  const existentes = new Map((await p.puerto.leerSalas()).map((s) => [s.clave, s]));

  const aGuardar: SalaAGuardar[] = [];
  const informe: InformeImportacion = { simulacion: !!p.simulacion, elementosLeidos: elementos.length, salasEnOsm: deOsm.length, nuevas: 0, completadas: 0, sinCambios: 0 };

  for (const c of deOsm) {
    const previa = existentes.get(c.clave);
    if (!previa) {
      aGuardar.push(nuevaSala(c, ahora));
      informe.nuevas++;
      continue;
    }
    if (previa.nivel === 'verificada') {
      informe.sinCambios++;
      continue;
    }
    const completa = completarSala(fichaDe(previa), c);
    if (CAMPOS.every((k) => (completa[k] ?? null) === (previa[k] ?? null))) {
      informe.sinCambios++;
      continue;
    }
    const { clave: _clave, ...campos } = completa;
    const { no_contactar: _nc, estado_negocio: _en, estado_negocio_en: _ene, ...base } = previa;
    // Si OpenStreetMap ha aportado algo a esta sala, hay que citarlo (ODbL).
    aGuardar.push({ ...base, ...campos, fuentes: [...new Set([...(previa.fuentes ?? []), 'osm'])] });
    informe.completadas++;
  }

  if (!p.simulacion) for (let i = 0; i < aGuardar.length; i += TAMANO_LOTE) await p.puerto.guardarSalas(aGuardar.slice(i, i + TAMANO_LOTE));
  return informe;
}

/** Descarga real de Overpass. Tarda: la consulta recorre toda España. */
export const descargarOsmSalas: DescargarOsm = async () => {
  const r = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BandManager/1.0 (https://bandmanager.io)' },
    body: `data=${encodeURIComponent(CONSULTA_OVERPASS_SALAS)}`,
    signal: AbortSignal.timeout(300_000),
  });
  if (!r.ok) throw new Error(`Overpass respondió ${r.status}`);
  return ((await r.json()) as { elements?: ElementoOsm[] }).elements ?? [];
};

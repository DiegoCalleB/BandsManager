/**
 * Pone coordenadas a las salas del catálogo que no las tienen (las de Bandflow, las de las bandas y las de OSM sin punto).
 *
 * Unas pocas por pasada, a un ritmo de una consulta por segundo (política de uso de Nominatim). Una sala que no se sitúa
 * se anota para no volver a intentarlo hasta pasados `DIAS_HASTA_REINTENTAR`. Las coordenadas de un local se distinguen de
 * las de su ciudad (`aprox`), y el mapa avisa de las segundas.
 */
import { consultaDeCiudad, consultaDeSala, puntoDeLaCiudad, puntoDeLaSala, urlNominatim, type PuntoGeo, type ResultadoNominatim } from '../utils/geocodificacion.js';
import type { SalaGuardada } from './catalogoSalas.js';

export const SALAS_A_GEOLOCALIZAR_POR_PASADA = 80;
export const DIAS_HASTA_REINTENTAR = 30;
const MS_DIA = 86_400_000;

export interface PuertoGeolocalizacion {
  salasSinCoordenadas(limite: number, antesDe: Date): Promise<SalaGuardada[]>;
  /** `null` = ninguna fuente la supo situar: solo se anota el intento. */
  guardarPunto(salaId: string, punto: (PuntoGeo & { aprox: boolean }) | null, en: Date): Promise<void>;
}

export type BuscarEnNominatim = (url: string) => Promise<ResultadoNominatim[]>;

export interface InformeGeolocalizacion {
  revisadas: number;
  exactas: number;
  deLaCiudad: number;
  sinPunto: number;
  errores: number;
}

const pausa = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

export async function geolocalizarSalas(p: {
  puerto: PuertoGeolocalizacion;
  buscar: BuscarEnNominatim;
  limite?: number;
  pausaMs?: number;
  ahora?: () => Date;
}): Promise<InformeGeolocalizacion> {
  const ahora = (p.ahora ?? (() => new Date()))();
  const pausaMs = p.pausaMs ?? 1100;
  const salas = await p.puerto.salasSinCoordenadas(p.limite ?? SALAS_A_GEOLOCALIZAR_POR_PASADA, new Date(ahora.getTime() - DIAS_HASTA_REINTENTAR * MS_DIA));
  const informe: InformeGeolocalizacion = { revisadas: 0, exactas: 0, deLaCiudad: 0, sinPunto: 0, errores: 0 };
  // Muchas salas comparten ciudad: el punto de cada ciudad se pide una sola vez por pasada.
  const ciudades = new Map<string, PuntoGeo | null>();

  for (const [i, sala] of salas.entries()) {
    if (i > 0) await pausa(pausaMs);
    try {
      const exacta = puntoDeLaSala(await p.buscar(urlNominatim(consultaDeSala(sala))), sala.ciudad);
      if (exacta) {
        await p.puerto.guardarPunto(sala.id, { ...exacta, aprox: false }, ahora);
        informe.exactas++;
      } else {
        const consulta = consultaDeCiudad(sala);
        let ciudad: PuntoGeo | null = null;
        if (consulta) {
          if (!ciudades.has(consulta)) {
            await pausa(pausaMs);
            ciudades.set(consulta, puntoDeLaCiudad(await p.buscar(urlNominatim(consulta))));
          }
          ciudad = ciudades.get(consulta) ?? null;
        }
        await p.puerto.guardarPunto(sala.id, ciudad ? { ...ciudad, aprox: true } : null, ahora);
        if (ciudad) informe.deLaCiudad++;
        else informe.sinPunto++;
      }
      informe.revisadas++;
    } catch {
      // Un error de red no se anota como intento: la sala vuelve a salir en la próxima pasada.
      informe.errores++;
    }
  }
  return informe;
}

/** Consulta real a Nominatim (identificándose, como pide su política de uso). */
export const buscarEnNominatim: BuscarEnNominatim = async (url) => {
  const r = await fetch(url, { headers: { 'User-Agent': 'BandManager/1.0 (https://bandmanager.io)', 'Accept-Language': 'es' }, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`Nominatim respondió ${r.status}`);
  return (await r.json()) as ResultadoNominatim[];
};

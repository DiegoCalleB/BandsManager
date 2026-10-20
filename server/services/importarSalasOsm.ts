/**
 * Importación de las salas de España desde OpenStreetMap al catálogo compartido.
 *
 * Solo AÑADE: una sala que ya está en el catálogo no se pisa, únicamente se le rellenan los campos que le faltan, y
 * nunca se toca una verificada. Las nuevas entran como «sin verificar» (la fiabilidad la dan las bandas, no el mapa).
 * Depende de un puerto y de una función de descarga, así que se prueba sin red ni base de datos.
 */
import { calcularFiabilidad, idDeSala, type CamposPublicosSala } from '../utils/salaCatalogo.js';
import { REGIONES_OSM, completarSala, conCiudadResuelta, coordenadasDeOsm, consultaOverpassSalas, contarDescartes, salasDeOsm, type ElementoOsm } from '../utils/osmSalas.js';
import type { FilaCoordenadas, PuertoCatalogo, PuertoCoordenadas, SalaAGuardar, SalaGuardada } from './catalogoSalas.js';

export type PuertoImportacion = Pick<PuertoCatalogo, 'leerSalas' | 'guardarSalas' | 'leerAlias'> & Partial<PuertoCoordenadas>;
export type DescargarOsm = () => Promise<ElementoOsm[]>;

export interface InformeImportacion {
  simulacion: boolean;
  elementosLeidos: number;
  /** Elementos sin nombre (no se pueden identificar) y con nombre pero sin ciudad (tampoco): lo que hace que entren menos salas de las que hay en el mapa. */
  descartados: { sinNombre: number; sinCiudad: number };
  /** Salas a las que se les puso la ciudad del núcleo de población más cercano porque OSM no la traía. */
  ciudadPorCercania: number;
  salasEnOsm: number;
  nuevas: number;
  completadas: number;
  sinCambios: number;
  /** Salas a las que se les puso el punto exacto de OSM (en el mapa). */
  conCoordenadas: number;
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
  const { salas: elementos, porCercania } = conCiudadResuelta(await p.descargar());
  // Una sala de OSM con un alias es la canónica: no se crea otra fila con su nombre.
  const alias = new Map((await p.puerto.leerAlias()).map((a) => [a.aliasClave, a.clave]));
  const porClave = new Map<string, CamposPublicosSala>();
  for (const c of salasDeOsm(elementos)) {
    const clave = alias.get(c.clave) ?? c.clave;
    const previa = porClave.get(clave);
    porClave.set(clave, previa ? completarSala(previa, c) : { ...c, clave });
  }
  const deOsm = [...porClave.values()];
  const existentes = new Map((await p.puerto.leerSalas()).map((s) => [s.clave, s]));
  const puntos = new Map<string, { lat: number; lon: number }>();
  for (const [clave, punto] of coordenadasDeOsm(elementos)) puntos.set(alias.get(clave) ?? clave, punto);

  const aGuardar: SalaAGuardar[] = [];
  const informe: InformeImportacion = { simulacion: !!p.simulacion, elementosLeidos: elementos.length, descartados: contarDescartes(elementos), ciudadPorCercania: porCercania, salasEnOsm: deOsm.length, nuevas: 0, completadas: 0, sinCambios: 0, conCoordenadas: 0 };

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

  // El punto exacto de OSM sirve a toda sala que no lo tenga o solo tenga el de su ciudad, también a las verificadas (no cambia ningún dato suyo).
  const coordenadas: FilaCoordenadas[] = [];
  for (const c of deOsm) {
    const punto = puntos.get(c.clave);
    const previa = existentes.get(c.clave);
    if (punto && !(previa && previa.lat != null && !previa.coordenadas_aprox)) coordenadas.push({ salaId: previa?.id ?? idDeSala(c.clave), ...punto, aprox: false });
  }
  informe.conCoordenadas = coordenadas.length;

  if (!p.simulacion) {
    for (let i = 0; i < aGuardar.length; i += TAMANO_LOTE) await p.puerto.guardarSalas(aGuardar.slice(i, i + TAMANO_LOTE));
    // Después de guardar: las salas nuevas tienen que existir para poder ponerles el punto.
    await p.puerto.guardarCoordenadas?.(coordenadas);
  }
  return informe;
}

/** Servidores públicos de Overpass: si uno está saturado o no responde, se prueba el siguiente. */
export const SERVIDORES_OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

/** Motivo legible de un fallo de red: undici solo dice «fetch failed» y deja la causa real en `cause`. */
export function motivoDeRed(e: unknown): string {
  const causa = e instanceof Error ? (e.cause as { code?: string; message?: string } | undefined) : undefined;
  const base = e instanceof Error ? e.message : String(e);
  return causa?.code || causa?.message ? `${base} (${causa.code ?? causa.message})` : base;
}

export interface OpcionesDescargaOsm {
  /** Comunidades a descargar (por defecto, todas). */
  regiones?: readonly string[];
  /** Pausa entre comunidades, para no saturar un servicio público. */
  pausaMs?: number;
  /** Se llama con cada comunidad que ningún servidor pudo dar; las demás siguen. */
  alFallarRegion?: (region: string, motivo: string) => void;
}

const pausa = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

/**
 * Descarga real de Overpass, comunidad por comunidad (una consulta para toda España satura los servidores públicos:
 * respondían 500 y 502). Cada comunidad prueba los servidores en orden. Si algunas fallan, se importa lo que sí llegó
 * (la importación es idempotente: la próxima vez se completa); solo falla si no llegó ninguna.
 */
export function crearDescargaOsm(servidores: readonly string[] = SERVIDORES_OVERPASS, fetcher: typeof fetch = fetch, timeoutMs = 120_000, o: OpcionesDescargaOsm = {}): DescargarOsm {
  const regiones = o.regiones ?? REGIONES_OSM;
  const pausaMs = o.pausaMs ?? 3000;
  return async () => {
    const elementos = new Map<string, ElementoOsm>();
    const fallos: string[] = [];
    for (const [i, region] of regiones.entries()) {
      if (i > 0) await pausa(pausaMs);
      const motivos: string[] = [];
      let llegaron = false;
      for (const url of servidores) {
        try {
          const r = await fetcher(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BandManager/1.0 (https://bandmanager.io)' },
            body: `data=${encodeURIComponent(consultaOverpassSalas(region))}`,
            signal: AbortSignal.timeout(timeoutMs),
          });
          if (!r.ok) throw new Error(`respondió ${r.status}`);
          for (const el of ((await r.json()) as { elements?: ElementoOsm[] }).elements ?? []) elementos.set(`${el.type}/${el.id}`, el);
          llegaron = true;
          break;
        } catch (e) {
          motivos.push(`${new URL(url).host}: ${motivoDeRed(e)}`);
        }
      }
      if (!llegaron) {
        const motivo = motivos.join('; ');
        fallos.push(`${region} (${motivo})`);
        o.alFallarRegion?.(region, motivo);
      }
    }
    if (fallos.length === regiones.length) throw new Error(`Overpass no respondió en ningún servidor — ${fallos[0]}`);
    return [...elementos.values()];
  };
}

export const descargarOsmSalas: DescargarOsm = crearDescargaOsm(SERVIDORES_OVERPASS, fetch, 120_000, {
  alFallarRegion: (region, motivo) => console.warn(`[Catálogo] Overpass: sin datos de ${region} esta vez (${motivo}).`),
});

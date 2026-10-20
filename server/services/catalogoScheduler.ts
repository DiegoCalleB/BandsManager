/**
 * Sincronización periódica del catálogo compartido de salas.
 *
 * Sin esto el catálogo solo se pondría al día cuando alguien ejecutase `npm run catalogo:salas -- --aplicar`: las
 * salas nuevas de las bandas no entrarían y la fiabilidad (respuestas, rebotes, caducidad de la verificación) se
 * quedaría congelada. La sincronización es idempotente y solo escribe lo que cambia, así que repetirla es barato.
 *
 * Primera pasada unos minutos tras arrancar (los despliegues son frecuentes y un temporizador de 24 h nunca llegaría a
 * disparar) y después cada `CATALOGO_SYNC_MS` (24 h por defecto). `CATALOGO_SYNC=false` la apaga.
 */
import { puertoCatalogoSupabase, puertoEnriquecimientoWebSupabase, puertoVerificacionSupabase } from "../db/salasCatalogo.js";
import { captureError } from "../utils/errorTracking.js";
import { sincronizarCatalogo, type InformeCatalogo } from "./catalogoSalas.js";
import { crearConsultaMaps } from "./consultaMapsSala.js";
import { datosDeWebSala } from "../utils/datosDeWebSala.js";
import { enriquecerSalasDesdeSuWeb } from "./enriquecerSalasDesdeSuWeb.js";
import { importarSalasDeBandflow } from "./importarSalasBandflow.js";
import { leerWebDeSala } from "./leerWebDeSala.js";
import { descargarOsmSalas, importarSalasDeOsm } from "./importarSalasOsm.js";
import { verificarSalasEnMaps } from "./verificarSalasEnMaps.js";

const PERIODO_MS = Number(process.env.CATALOGO_SYNC_MS) || 24 * 60 * 60 * 1000;
const RETRASO_INICIAL_MS = 5 * 60 * 1000;

let intervalo: ReturnType<typeof setInterval> | null = null;
let primera: ReturnType<typeof setTimeout> | null = null;
let enCurso = false;
let importacion: ReturnType<typeof setTimeout> | null = null;
let semilla: ReturnType<typeof setTimeout> | null = null;

/** Una pasada. Nunca lanza: un fallo se registra y la siguiente pasada lo reintenta. Devuelve null si falló o ya había una en curso. */
export async function sincronizarCatalogoAhora(sincronizar: () => Promise<InformeCatalogo> = () => sincronizarCatalogo(puertoCatalogoSupabase)): Promise<InformeCatalogo | null> {
  if (enCurso) return null;
  enCurso = true;
  try {
    const r = await sincronizar();
    console.log(
      `[Catálogo] Sincronizado: ${r.salasResultantes} salas (${r.salasNuevas} nuevas, ${r.salasActualizadas} actualizadas), ` +
        `${r.leadsEnlazados} leads enlazados. Verificadas ${r.porNivel.verificada}, probables ${r.porNivel.probable}.`,
    );
    await verificarEnMapsAhora();
    await enriquecerDesdeLaWebAhora();
    return r;
  } catch (e) {
    console.warn("[Catálogo] La sincronización falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "sincronizarCatalogo" });
    return null;
  } finally {
    enCurso = false;
  }
}

/**
 * Tras cada sincronización, comprueba en Google Maps unas pocas salas (las que más tiempo llevan sin comprobarse).
 * Necesita `GOOGLE_PLACES_API_KEY`; `CATALOGO_VERIFICAR_MAPS=false` la apaga. Nunca lanza: no debe estropear la sincronización.
 */
async function verificarEnMapsAhora(): Promise<void> {
  const clave = process.env.GOOGLE_PLACES_API_KEY;
  if (!clave || process.env.CATALOGO_VERIFICAR_MAPS === "false") return;
  try {
    const r = await verificarSalasEnMaps({ puerto: puertoVerificacionSupabase, consultarMaps: crearConsultaMaps(clave) });
    if (r.revisadas + r.errores > 0) {
      console.log(
        `[Catálogo] Verificación en Maps: ${r.revisadas} revisadas (${r.operativas} abiertas, ${r.cerradasTemporal} cerradas temporalmente, ` +
          `${r.cerradasPermanente} cerradas definitivamente, ${r.sinCoincidencia} sin coincidencia), ${r.errores} errores.`,
      );
    }
  } catch (e) {
    console.warn("[Catálogo] La verificación en Maps falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "verificarSalasEnMaps" });
  }
}

/**
 * Importa al catálogo las salas de España de OpenStreetMap. Es opt-in (`CATALOGO_IMPORTAR_OSM=true`) porque descarga
 * miles de elementos de un servicio público; solo añade salas nuevas y rellena huecos, así que repetirla es inofensivo.
 */
export async function importarSalasOsmAhora(): Promise<boolean> {
  try {
    const r = await importarSalasDeOsm({ puerto: puertoCatalogoSupabase, descargar: descargarOsmSalas });
    console.log(`[Catálogo] Importación OSM: ${r.elementosLeidos} elementos leídos (${r.descartados.sinNombre} sin nombre, ${r.descartados.sinCiudad} sin ciudad), ${r.salasEnOsm} salas en OSM (${r.ciudadPorCercania} con la ciudad del núcleo más cercano), ${r.nuevas} nuevas, ${r.completadas} completadas, ${r.sinCambios} sin cambios.`);
    return true;
  } catch (e) {
    console.warn("[Catálogo] La importación de OSM falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "importarSalasOsm" });
    return false;
  }
}

/**
 * Tras cada sincronización, completa unas pocas salas con lo que dice su propia web (Instagram, email de rol, teléfono fijo, género):
 * las que más tiempo llevan sin revisarse. Solo rellena huecos. `CATALOGO_ENRIQUECER_WEB=false` la apaga. Nunca lanza.
 */
export async function enriquecerDesdeLaWebAhora(): Promise<void> {
  if (process.env.CATALOGO_ENRIQUECER_WEB === "false") return;
  try {
    const r = await enriquecerSalasDesdeSuWeb({ puerto: puertoEnriquecimientoWebSupabase, leerWeb: leerWebDeSala, extraer: datosDeWebSala, pausaMs: 1000 });
    if (r.revisadas > 0) {
      const c = r.camposRellenados;
      console.log(`[Catálogo] Enriquecimiento desde la web: ${r.revisadas} salas revisadas (${r.sinWeb} sin web legible), ${r.completadas} completadas (${c.instagram} Instagram, ${c.email_contacto} email, ${c.telefono} teléfono, ${c.genero} género).`);
    }
  } catch (e) {
    console.warn("[Catálogo] El enriquecimiento desde la web falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "enriquecerSalasDesdeSuWeb" });
  }
}

/**
 * Carga la semilla de Bandflow en el catálogo. Va con el código (no hay red) y solo añade lo que falta, así que repetirla en cada
 * arranque es inofensiva. `CATALOGO_SEMILLA_BANDFLOW=false` la apaga.
 */
export async function importarSalasBandflowAhora(): Promise<void> {
  try {
    const r = await importarSalasDeBandflow({ puerto: puertoCatalogoSupabase });
    if (r.nuevas + r.completadas > 0) console.log(`[Catálogo] Semilla Bandflow: ${r.salasEnSemilla} salas, ${r.nuevas} nuevas, ${r.completadas} completadas, ${r.sinCambios} sin cambios.`);
  } catch (e) {
    console.warn("[Catálogo] La semilla de Bandflow falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "importarSalasBandflow" });
  }
}

const REINTENTOS_IMPORTACION = 3;
const ESPERA_REINTENTO_MS = 60 * 60 * 1000;

/** Una importación y, si no llega nada (Overpass caído o saturado), otra a la hora, hasta tres veces. */
function programarImportacion(espera: number, reintentos = REINTENTOS_IMPORTACION): void {
  importacion = setTimeout(async () => {
    importacion = null;
    if (!(await importarSalasOsmAhora()) && reintentos > 0) programarImportacion(ESPERA_REINTENTO_MS, reintentos - 1);
  }, espera);
  importacion.unref?.();
}

export function iniciarSincronizacionDelCatalogo(): void {
  if (intervalo || primera || process.env.CATALOGO_SYNC === "false") return;
  console.log(`[Catálogo] Sincronización del catálogo de salas cada ${Math.round(PERIODO_MS / 3_600_000)} h.`);
  primera = setTimeout(() => {
    primera = null;
    void sincronizarCatalogoAhora();
  }, RETRASO_INICIAL_MS);
  intervalo = setInterval(() => void sincronizarCatalogoAhora(), PERIODO_MS);
  primera.unref?.();
  intervalo.unref?.();
  if (process.env.CATALOGO_SEMILLA_BANDFLOW !== "false") {
    semilla = setTimeout(() => void importarSalasBandflowAhora(), 8 * 60 * 1000);
    semilla.unref?.();
  }
  if (process.env.CATALOGO_IMPORTAR_OSM === "true") {
    // Después de la primera sincronización, para que las salas de las bandas ya estén y no se dupliquen.
    programarImportacion(15 * 60 * 1000);
  }
}

export function detenerSincronizacionDelCatalogo(): void {
  if (primera) clearTimeout(primera);
  if (intervalo) clearInterval(intervalo);
  if (importacion) clearTimeout(importacion);
  if (semilla) clearTimeout(semilla);
  importacion = null;
  semilla = null;
  primera = null;
  intervalo = null;
}

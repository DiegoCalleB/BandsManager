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
import { puertoCatalogoSupabase, puertoVerificacionSupabase } from "../db/salasCatalogo.js";
import { captureError } from "../utils/errorTracking.js";
import { sincronizarCatalogo, type InformeCatalogo } from "./catalogoSalas.js";
import { crearConsultaMaps } from "./consultaMapsSala.js";
import { verificarSalasEnMaps } from "./verificarSalasEnMaps.js";

const PERIODO_MS = Number(process.env.CATALOGO_SYNC_MS) || 24 * 60 * 60 * 1000;
const RETRASO_INICIAL_MS = 5 * 60 * 1000;

let intervalo: ReturnType<typeof setInterval> | null = null;
let primera: ReturnType<typeof setTimeout> | null = null;
let enCurso = false;

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
}

export function detenerSincronizacionDelCatalogo(): void {
  if (primera) clearTimeout(primera);
  if (intervalo) clearInterval(intervalo);
  primera = null;
  intervalo = null;
}

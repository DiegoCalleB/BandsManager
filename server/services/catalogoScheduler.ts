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
import { puertoCatalogoSupabase } from "../db/salasCatalogo.js";
import { captureError } from "../utils/errorTracking.js";
import { sincronizarCatalogo, type InformeCatalogo } from "./catalogoSalas.js";

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
    return r;
  } catch (e) {
    console.warn("[Catálogo] La sincronización falló:", e instanceof Error ? e.message : e);
    captureError(e, { fase: "sincronizarCatalogo" });
    return null;
  } finally {
    enCurso = false;
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

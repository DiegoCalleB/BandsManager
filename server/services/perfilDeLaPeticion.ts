/**
 * Perfil de la banda de la petición (nombre, estilo, tono, enlaces) para inyectarlo en los
 * prompts de Reels. Nunca falla: si algo no carga, devuelve un perfil vacío y lo avisa.
 * Extraído de `routes/reels.ts` para compartirlo con `routes/reelsTexto.ts`.
 */
import type express from "express";
import { loadState } from "../state.js";
import { dbGetRegisteredBandById, dbGetEpkConfig } from "../db.js";
import { getTargetBandId } from "../utils/bandAccess.js";
import { loadBandProfile, emptyBandProfile, type BandProfile } from "../utils/bandProfile.js";
import { comoErrorCapturado } from "../../src/utils/errorCapturado.js";

export async function perfilDeLaPeticion(req: express.Request): Promise<BandProfile> {
  try {
    const bandId = getTargetBandId(req);
    return await loadBandProfile(bandId, {
      getBand: (id) => dbGetRegisteredBandById(id),
      getEpk: (id) => dbGetEpkConfig(id),
      getState: () => loadState()
    });
  } catch (errCapturado) {
    const err = comoErrorCapturado(errCapturado);
    console.warn("[Reels] No se pudo cargar el perfil de la banda:", err?.message || err);
    return emptyBandProfile();
  }
}

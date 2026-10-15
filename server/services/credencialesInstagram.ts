/**
 * Credenciales de Instagram de UNA banda (las que guardó al conectar Instagram en Métricas).
 * Nunca el INSTAGRAM_ACCESS_TOKEN global del entorno: con él todas las bandas publicarían en, y
 * leerían métricas de, la misma cuenta. null si la banda no tiene cuenta profesional conectada.
 */
import { dbGetEpkConfig } from "../db/epk.js";
import type { CredencialesInstagram } from "./publicadores/instagramReels.js";

export async function credencialesInstagram(bandId: string): Promise<CredencialesInstagram | null> {
  const epk = await dbGetEpkConfig(bandId).catch((e: unknown) => {
    console.warn("[Social Publisher] No se pudo leer la conexión de Instagram:", e);
    return null;
  });
  const redes = (epk?.enlacesRedes || {}) as Record<string, unknown>;
  const token = typeof redes.instagram_access_token === "string" ? redes.instagram_access_token : "";
  const igUserId = typeof redes.instagram_account_id === "string" ? redes.instagram_account_id : "";
  return token && igUserId ? { token, igUserId } : null;
}

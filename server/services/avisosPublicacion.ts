/**
 * Envía el aviso de Reels que no se han publicado (ver utils/avisoPublicacionFallida.ts).
 * Nunca lanza: un fallo al avisar no debe tumbar la pasada del worker de publicación, que ya ha
 * dejado los posts en «fallido» con su motivo.
 */
import { dbGetAlertSettings } from "../db/alertSettings.js";
import { getSupabase } from "../db/core.js";
import { destinatarioDeAvisoPublicacion, renderAvisoPublicacionesFallidas, type AjustesDeAvisos, type PostFallido } from "../utils/avisoPublicacionFallida.js";
import { sendTransactionalEmail, getProductionAppUrl } from "./transactionalEmail.js";
import { captureError } from "../utils/errorTracking.js";

export interface DepsAviso {
  ajustes: (bandId: string) => Promise<AjustesDeAvisos | null>;
  banda: (bandId: string) => Promise<{ nombre_banda?: string; email?: string } | null>;
  enviar: (o: { to: string; subject: string; html: string }) => Promise<{ success: boolean; error?: string }>;
  appUrl: () => string;
}

const porDefecto: DepsAviso = {
  ajustes: (b) => dbGetAlertSettings(b),
  banda: async (b) => {
    const { data } = await getSupabase().from("registered_bands").select("nombre_banda, email").eq("band_id", b).maybeSingle();
    return data;
  },
  enviar: (o) => sendTransactionalEmail(o),
  appUrl: () => getProductionAppUrl()
};

export type ResultadoAviso = { enviado: true } | { enviado: false; motivo: "sin_fallos" | "sin_destinatario" | "error_envio" | "error" };

export async function avisarPublicacionesFallidas(bandId: string, posts: PostFallido[], deps: DepsAviso = porDefecto): Promise<ResultadoAviso> {
  if (posts.length === 0) return { enviado: false, motivo: "sin_fallos" };
  try {
    const [ajustes, banda] = await Promise.all([deps.ajustes(bandId), deps.banda(bandId)]);
    const para = destinatarioDeAvisoPublicacion({ ajustes, emailBanda: banda?.email });
    if (!para) return { enviado: false, motivo: "sin_destinatario" };

    const { subject, html } = renderAvisoPublicacionesFallidas({ nombreBanda: banda?.nombre_banda || "tu banda", posts, appUrl: deps.appUrl() });
    const r = await deps.enviar({ to: para, subject, html });
    if (!r.success) {
      console.warn("[Avisos publicación] No se pudo avisar a la banda:", bandId, r.error);
      return { enviado: false, motivo: "error_envio" };
    }
    return { enviado: true };
  } catch (e) {
    console.warn("[Avisos publicación] Fallo avisando a la banda:", bandId, e);
    captureError(e, { contexto: "avisosPublicacion", bandId });
    return { enviado: false, motivo: "error" };
  }
}

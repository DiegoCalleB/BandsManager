/**
 * Comprueba, contra tu entorno real, que un Reel programado puede salir solo y avisar si falla.
 * Solo lee: no publica, no envía correos y no escribe nada.
 *
 *   npm run probar:publicacion                  # entorno (Resend, APP_URL, Supabase, migraciones)
 *   npm run probar:publicacion -- ID_DE_BANDA   # y además los ajustes y la conexión de esa banda
 *
 * Necesita las mismas variables que el servidor (.env en local o las de Railway).
 */
import dotenv from "dotenv";
dotenv.config();

const { getSupabase } = await import("../server/db/core.js");
const { resolveResendApiKey } = await import("../server/services/transactionalEmail.js");
const { dbGetAlertSettings } = await import("../server/db/alertSettings.js");
const { credencialesInstagram } = await import("../server/services/credencialesInstagram.js");
const { destinatarioDeAvisoPublicacion } = await import("../server/utils/avisoPublicacionFallida.js");
const { evaluarPreparacion, formatearPreparacion } = await import("../server/utils/preparacionPublicacion.js");
import type { EstadoPreparacion } from "../server/utils/preparacionPublicacion.js";

const TABLAS = ["reel_clips", "reel_metricas", "band_alert_settings"];
const COLUMNAS_POSTS = ["auto_publish", "video_url", "published_id", "published_at", "publish_error", "publish_started_at"];

async function existe(sb: ReturnType<typeof getSupabase>, tabla: string, columnas = "*"): Promise<boolean> {
  const { error } = await sb.from(tabla).select(columnas).limit(1);
  return !error;
}

async function reunirEstado(bandId?: string): Promise<EstadoPreparacion> {
  const estado: EstadoPreparacion = {
    resendKey: Boolean(resolveResendApiKey()),
    appUrl: process.env.APP_URL,
    supabaseOk: false,
    tablas: {},
    columnasPostsFaltan: []
  };
  let sb: ReturnType<typeof getSupabase>;
  try {
    sb = getSupabase();
    estado.supabaseOk = await existe(sb, "social_posts");
  } catch {
    return estado;
  }
  if (!estado.supabaseOk) return estado;

  for (const t of TABLAS) estado.tablas[t] = await existe(sb, t);
  for (const c of COLUMNAS_POSTS) if (!(await existe(sb, "social_posts", c))) estado.columnasPostsFaltan.push(c);

  if (bandId) {
    const { data: banda } = await sb.from("registered_bands").select("email").eq("band_id", bandId).maybeSingle();
    if (!banda) {
      estado.banda = { existe: false, avisosActivados: false, destinatario: null, instagramConectado: false, pendientesDeSalir: 0 };
      return estado;
    }
    const ajustes = await dbGetAlertSettings(bandId);
    const { count } = await sb.from("social_posts").select("id", { count: "exact", head: true }).eq("band_id", bandId).in("estado", ["aprobado", "en_cola"]);
    estado.banda = {
      existe: true,
      avisosActivados: Boolean(ajustes?.email_notifications_enabled),
      destinatario: destinatarioDeAvisoPublicacion({ ajustes, emailBanda: banda.email }),
      instagramConectado: Boolean(await credencialesInstagram(bandId)),
      pendientesDeSalir: count ?? 0
    };
  }
  return estado;
}

const comprobaciones = evaluarPreparacion(await reunirEstado(process.argv[2]));
console.log(formatearPreparacion(comprobaciones));
process.exit(comprobaciones.some((c) => c.estado === "falta") ? 1 : 0);

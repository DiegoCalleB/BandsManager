// Seguidores de las cuentas de Instagram de las bandas amigas con `business_discovery` (API oficial de Meta).
// Solo devuelve datos de cuentas PROFESIONALES; la consulta sale de la cuenta de Instagram conectada de la banda.

import { dbGetEpkConfig } from "../db.js";
import { handleInstagram } from "../utils/redesBanda.js";
import type { Resultado } from "./metricasBandaService.js";

const API = "https://graph.facebook.com/v19.0";

export type CredencialesInstagram = { token: string; cuentaId: string } | { motivo: string };

const mensajeDe = (err: unknown) => (err instanceof Error ? err.message : "error");

/** Motivo legible de un error de Meta (código del cuerpo `error` o estado HTTP). */
export function motivoErrorInstagram(status: number, cuerpo: unknown): string {
  const e = (cuerpo as { error?: { code?: number; error_subcode?: number; message?: string } } | null)?.error;
  if (e?.code === 190) return "El token de Instagram ha caducado o no es válido";
  if (e?.code === 4 || e?.code === 17 || e?.code === 32 || e?.code === 613) return "Meta ha limitado las peticiones de Instagram; reintenta más tarde";
  if (e?.code === 110 || e?.code === 100 || e?.error_subcode === 2207013 || /unable to find|does not exist|not.*(business|creator)/i.test(e?.message || "")) {
    return "Instagram no encuentra una cuenta profesional con ese usuario";
  }
  return `Instagram respondió ${status}`;
}

/**
 * Token y cuenta de Instagram de la banda activa: los de su configuración EPK, con respaldo en las variables
 * de entorno. Sin ID guardado se busca la cuenta profesional enlazada a sus páginas de Facebook.
 */
export async function credencialesInstagram(bandId: string): Promise<CredencialesInstagram> {
  const epk = await dbGetEpkConfig(bandId).catch(() => null);
  const token = String(epk?.enlacesRedes?.instagram_access_token || process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_GRAPH_TOKEN || "").trim();
  if (!token) return { motivo: "Instagram sin conectar (falta el token de Meta)" };
  if (token.startsWith("IG")) {
    return { motivo: "El token de Instagram es de «Instagram Login»; business_discovery necesita el de Facebook Login" };
  }
  const guardada = epk?.enlacesRedes?.instagram_account_id;
  if (guardada) return { token, cuentaId: String(guardada) };

  try {
    const res = await fetch(`${API}/me/accounts?fields=instagram_business_account%7Bid%7D&access_token=${encodeURIComponent(token)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { motivo: motivoErrorInstagram(res.status, await res.json().catch(() => null)) };
    const datos = (await res.json()) as { data?: { instagram_business_account?: { id?: string } }[] };
    const cuentaId = datos.data?.find((p) => p.instagram_business_account?.id)?.instagram_business_account?.id;
    return cuentaId ? { token, cuentaId } : { motivo: "El token no tiene ninguna cuenta profesional de Instagram enlazada" };
  } catch (err) {
    return { motivo: `Meta no responde (${mensajeDe(err)})` };
  }
}

/** Seguidores de la cuenta de Instagram del enlace, vía `business_discovery` desde la cuenta conectada. */
export async function seguidoresInstagram(cred: CredencialesInstagram, enlace?: string): Promise<Resultado> {
  if ("motivo" in cred) return { motivo: cred.motivo };
  const handle = handleInstagram(enlace);
  if (!handle) return { motivo: "sin enlace de Instagram" };
  try {
    const campos = encodeURIComponent(`business_discovery.username(${handle}){followers_count}`);
    const res = await fetch(`${API}/${encodeURIComponent(cred.cuentaId)}?fields=${campos}&access_token=${encodeURIComponent(cred.token)}`, {
      signal: AbortSignal.timeout(6000),
    });
    const cuerpo = (await res.json().catch(() => null)) as { business_discovery?: { followers_count?: number } } | null;
    if (!res.ok) return { motivo: motivoErrorInstagram(res.status, cuerpo) };
    const seguidores = cuerpo?.business_discovery?.followers_count;
    if (typeof seguidores !== "number") return { motivo: "Instagram no devuelve seguidores de esa cuenta" };
    return { fila: { fuente: "instagram", seguidores } };
  } catch (err) {
    return { motivo: `Instagram no responde (${mensajeDe(err)})` };
  }
}

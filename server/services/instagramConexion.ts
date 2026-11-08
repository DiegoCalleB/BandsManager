// Conexión de la cuenta de Instagram de una banda: verifica un token de Meta, descubre la cuenta
// Business y la guarda en epk_configs.enlacesRedes. Lo comparten el alta manual por token
// (POST /api/metrics/instagram/connect) y el OAuth (server/routes/instagramOAuth.ts).

import { dbGetEpkConfig, dbUpsertEpkConfig, dbGetSocialMetrics, dbUpsertSocialMetric } from "../db.js";
import type { SocialMetric } from "../../src/types.js";
import type { CuentaInstagramVerificada, PaginaFacebook } from "../routes/tiposMetricas.js";

export const GRAPH_VERSION = "v19.0";

export interface ConexionInstagramVerificada {
  account: CuentaInstagramVerificada;
  authSource: "meta_platform_insights_api" | "instagram_basic_api";
}

/** Comprueba el token contra Meta y devuelve la cuenta, o null si no vale / no tiene IG Business. */
export async function verificarTokenInstagram(token: string): Promise<ConexionInstagramVerificada | null> {
  // 1. Cuenta Business vía páginas de Facebook (Instagram Platform Insights).
  const fbRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?fields=instagram_business_account{id,username,followers_count,media_count,name}&access_token=${encodeURIComponent(token)}`,
    { signal: AbortSignal.timeout(8000) }
  ).catch(() => null);

  if (fbRes && fbRes.ok) {
    const fbData = await fbRes.json();
    const pageWithIg = fbData?.data?.find((p: PaginaFacebook) => p.instagram_business_account);
    if (pageWithIg?.instagram_business_account) {
      const igAcc = pageWithIg.instagram_business_account;
      return {
        authSource: "meta_platform_insights_api",
        account: {
          id: igAcc.id,
          username: igAcc.username,
          name: igAcc.name || igAcc.username,
          followers_count: igAcc.followers_count !== undefined ? Number(igAcc.followers_count) : null,
          media_count: igAcc.media_count !== undefined ? Number(igAcc.media_count) : null
        }
      };
    }
  }

  // 2. Respaldo: usuario directo de Instagram (Basic Display).
  const igRes = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me?fields=id,username,followers_count,media_count,name&access_token=${encodeURIComponent(token)}`,
    { signal: AbortSignal.timeout(8000) }
  ).catch(() => null);

  if (igRes && igRes.ok) {
    const igData = await igRes.json();
    return {
      authSource: "instagram_basic_api",
      account: {
        id: igData.id,
        username: igData.username,
        name: igData.name || igData.username,
        followers_count: igData.followers_count !== undefined ? Number(igData.followers_count) : null,
        media_count: igData.media_count !== undefined ? Number(igData.media_count) : null
      }
    };
  }

  return null;
}

/** Guarda token y cuenta en la config de la banda y apunta los seguidores de hoy en las métricas. */
export async function guardarConexionInstagram(bandId: string, token: string, account: CuentaInstagramVerificada): Promise<void> {
  const epk = (await dbGetEpkConfig(bandId).catch(() => null)) || {};
  await dbUpsertEpkConfig(bandId, {
    ...epk,
    enlacesRedes: {
      ...(epk.enlacesRedes || {}),
      instagram_access_token: token,
      instagram_account_id: account.id,
      instagram_username: account.username,
      instagram_verified_at: new Date().toISOString()
    }
  });

  if (account.followers_count === null) return;
  const today = new Date().toISOString().split("T")[0];
  const existing = await dbGetSocialMetrics(bandId).catch(() => []);
  const currentToday: Partial<SocialMetric> = existing.find((m: SocialMetric) => m.fecha === today) || existing[0] || {};

  const newEntry: SocialMetric = {
    id: currentToday.id || `metric-${bandId}-${today}`,
    fecha: today,
    instagram: account.followers_count,
    tiktok: currentToday.tiktok || 0,
    youtube: currentToday.youtube || 0,
    spotify: currentToday.spotify || 0,
    notas: `Instagram Platform Insights API Oficial (@${account.username})`,
    instagram_followers: account.followers_count,
    instagram_posts_count: account.media_count || currentToday.instagram_posts_count || 0
  };
  await dbUpsertSocialMetric(newEntry, bandId).catch(() => null);
}

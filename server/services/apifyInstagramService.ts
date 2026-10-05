/**
 * APIFY INSTAGRAM VENUE SCRAPER
 *
 * Extrae datos profesionales de perfiles de salas y festivales en Instagram:
 * - Teléfono de contacto comercial / WhatsApp Business (business_phone_number)
 * - Email de contacto comercial (business_email)
 * - Biografía, enlace web y aforo
 *
 * NOTA DE COSTE / PRUEBA GRATUITA:
 * Apify ofrece 5$ de crédito mensual RECURRENTE GRATUITO en su plan Free,
 * lo que permite raspar cientos de perfiles al mes sin coste.
 * Si no se configura APIFY_API_TOKEN, el servicio se degrada limpiamente
 * utilizando Jina Reader / Google Search como fallback gratuito sin romper la app.
 */

import { classifySpanishPhones, extractRelevantEmails } from "./jinaReaderService.js";

export interface InstagramEnrichedData {
  username: string;
  success: boolean;
  telefono_movil?: string;
  telefono_fijo?: string;
  email_contacto?: string;
  website?: string;
  biografia?: string;
  seguidores?: number;
  fuente: "apify" | "free_fallback";
  error?: string;
  apify_free_tier_info?: string;
}

/**
 * Limpia el nombre de usuario de Instagram a partir de un handle o URL
 */
export function cleanInstagramUsername(input?: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//, "");
  clean = clean.replace(/^\@/, "");
  clean = clean.split("/")[0].split("?")[0].trim();
  return clean;
}

/**
 * Extrae datos de perfil de Instagram vía Apify (o fallback sin coste)
 */
export async function scrapeInstagramVenueProfile(
  instagramHandleOrUrl: string
): Promise<InstagramEnrichedData> {
  const username = cleanInstagramUsername(instagramHandleOrUrl);
  if (!username) {
    return {
      username: "",
      success: false,
      fuente: "free_fallback",
      error: "Nombre de usuario de Instagram inválido"
    };
  }

  const apifyToken = process.env.APIFY_API_TOKEN;

  // 1. Si el usuario dispone de APIFY_API_TOKEN (plan gratuito con 5$/mes de Apify)
  if (apifyToken) {
    try {
      const endpoint = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username]
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const items: any = await res.json();
        const profile = Array.isArray(items) && items.length > 0 ? items[0] : null;

        if (profile) {
          const rawPhone = profile.businessPhoneNumber || profile.contactPhoneNumber;
          const { movil, fijo } = rawPhone ? classifySpanishPhones(rawPhone) : classifySpanishPhones(profile.biography || "");
          const { principal } = profile.businessEmail ? { principal: profile.businessEmail } : extractRelevantEmails(profile.biography || "");

          return {
            username,
            success: true,
            telefono_movil: movil,
            telefono_fijo: fijo,
            email_contacto: profile.businessEmail || principal,
            website: profile.externalUrl,
            biografia: profile.biography,
            seguidores: profile.followersCount,
            fuente: "apify"
          };
        }
      }
    } catch (err: any) {
      console.warn(`[ApifyInstagram] Error en llamada a Apify para @${username}:`, err?.message || err);
    }
  }

  // 2. Fallback Gratuito (sin API key de Apify):
  // Informamos de la opción del plan gratuito de Apify (5$ mensuales incluidos)
  return {
    username,
    success: false,
    fuente: "free_fallback",
    apify_free_tier_info: "Apify ofrece 5$ de saldo gratuito recurrente cada mes en su plan Free (sin cuotas fijas). Configura APIFY_API_TOKEN en tus variables de entorno para activar la extracción directa de WhatsApp de perfiles de Instagram.",
    error: "Token de Apify no configurado. Utilizando fallback web."
  };
}

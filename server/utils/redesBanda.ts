// Identificadores de redes sacados de los enlaces guardados de una banda (lógica pura, sin red).

import type { EnlacesPorPlataforma } from "./enlacesBandas.js";

export interface EnlacesParaMetricas {
  spotify?: string;
  youtube?: string;
  instagram?: string;
}

/** Reparte los enlaces por plataforma (tabla `enlaces_bandas_amigas`) en las URLs que usan las métricas. */
export function enlacesParaMetricas(enlaces?: EnlacesPorPlataforma): EnlacesParaMetricas {
  return {
    spotify: enlaces?.spotify?.url,
    youtube: enlaces?.youtube?.url,
    instagram: enlaces?.instagram?.url,
  };
}

export interface CanalYoutube {
  tipo: "id" | "handle" | "usuario";
  valor: string;
}

const HOST_YOUTUBE = /(^|\.)youtube\.com$/i;
const HOST_INSTAGRAM = /(^|\.)(instagram\.com|instagr\.am)$/i;

function comoUrl(texto: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }
}

/**
 * Canal de YouTube que identifica un enlace (`/channel/UC…`, `/@handle`, `/user/nombre`).
 * null si no se resuelve sin buscar por nombre (`/c/…`, vídeos, listas, otros dominios).
 */
export function canalYoutubeDeEnlace(enlace?: string | null): CanalYoutube | null {
  const texto = (enlace || "").trim();
  if (!texto) return null;
  const url = comoUrl(texto);
  if (!url || !HOST_YOUTUBE.test(url.hostname)) return null;
  const [primero = "", segundo = ""] = url.pathname.split("/").filter(Boolean);
  if (/^@[A-Za-z0-9_.-]{3,30}$/.test(primero)) return { tipo: "handle", valor: primero.slice(1) };
  if (primero === "channel" && /^UC[A-Za-z0-9_-]{22}$/.test(segundo)) return { tipo: "id", valor: segundo };
  if (primero === "user" && /^[A-Za-z0-9_.-]{1,50}$/.test(segundo)) return { tipo: "usuario", valor: segundo };
  return null;
}

const RUTAS_INSTAGRAM_QUE_NO_SON_USUARIO = new Set(["p", "reel", "reels", "explore", "accounts", "stories", "tv", "direct", "about"]);

/** Usuario de Instagram (en minúsculas) de una URL o de un `@usuario`; null si no es un perfil. */
export function handleInstagram(enlace?: string | null): string | null {
  const texto = (enlace || "").trim().replace(/^@/, "");
  if (!texto) return null;
  let candidato = texto;
  if (/instagram\.com|instagr\.am/i.test(texto)) {
    const url = comoUrl(texto);
    if (!url || !HOST_INSTAGRAM.test(url.hostname)) return null;
    const [primero = ""] = url.pathname.split("/").filter(Boolean);
    if (!primero || RUTAS_INSTAGRAM_QUE_NO_SON_USUARIO.has(primero.toLowerCase())) return null;
    candidato = primero;
  }
  return /^[A-Za-z0-9._]{1,30}$/.test(candidato) ? candidato.toLowerCase() : null;
}

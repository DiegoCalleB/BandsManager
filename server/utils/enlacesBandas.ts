// Enlaces de bandas amigas (tabla `enlaces_bandas_amigas`, una fila por banda y plataforma).
// Lógica pura, sin base de datos: el formulario sigue enviando un único campo `spotify_youtube`
// que mezcla Spotify, YouTube y web; aquí se reparte por plataforma.

export type PlataformaEnlace = "spotify" | "youtube" | "instagram" | "tiktok" | "web";

export interface EnlaceFila {
  url: string;
  verificado: boolean;
}

export type EnlacesPorPlataforma = Partial<Record<PlataformaEnlace, EnlaceFila>>;

/** Una escritura pendiente: url null = borrar la fila de esa plataforma. */
export interface CambioEnlace {
  plataforma: PlataformaEnlace;
  url: string | null;
  verificado: boolean;
}

/** Plataformas que comparten el campo mezclado `spotify_youtube`. */
const PLATAFORMAS_MEZCLADAS: PlataformaEnlace[] = ["spotify", "youtube", "web"];

/** Plataforma de un enlace suelto. Cualquier spotify.com va a 'spotify' (el barrido ya lo valida). */
export function clasificarEnlaceUnico(valor: string | null | undefined): "spotify" | "youtube" | "web" | null {
  const v = (valor || "").trim();
  if (!v) return null;
  if (/spotify\.com/i.test(v)) return "spotify";
  if (/(youtube\.com|youtu\.be)/i.test(v)) return "youtube";
  return "web";
}

/** Usuario (@x) o URL de Instagram → URL canónica. Vacío → "". */
export function normalizarInstagram(valor: string | null | undefined): string {
  const v = (valor || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

/** Valor que ve el formulario: prioriza Spotify, luego YouTube y luego web. */
export function valorVisibleSpotifyYoutube(enlaces: EnlacesPorPlataforma | undefined): string {
  return enlaces?.spotify?.url || enlaces?.youtube?.url || enlaces?.web?.url || "";
}

/**
 * Qué filas hay que escribir o borrar para que la banda refleje lo que envía el formulario.
 * `undefined` = el formulario no mandó ese campo → no se toca. Sin cambios reales → [].
 */
export function planificarSincronizacion(
  actuales: EnlacesPorPlataforma,
  valorSpotifyYoutube: string | undefined,
  instagram: string | undefined,
): CambioEnlace[] {
  const cambios: CambioEnlace[] = [];

  if (valorSpotifyYoutube !== undefined) {
    const v = valorSpotifyYoutube.trim();
    const plataforma = clasificarEnlaceUnico(v);
    if (!plataforma) {
      // Campo vacío: se borran las filas del campo mezclado.
      for (const p of PLATAFORMAS_MEZCLADAS) {
        if (actuales[p]) cambios.push({ plataforma: p, url: null, verificado: false });
      }
    } else if (actuales[plataforma]?.url !== v) {
      cambios.push({ plataforma, url: v, verificado: false });
    }
  }

  if (instagram !== undefined) {
    const u = normalizarInstagram(instagram);
    if (!u) {
      if (actuales.instagram) cambios.push({ plataforma: "instagram", url: null, verificado: false });
    } else if (actuales.instagram?.url !== u) {
      cambios.push({ plataforma: "instagram", url: u, verificado: false });
    }
  }

  return cambios;
}

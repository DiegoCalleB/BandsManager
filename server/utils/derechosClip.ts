/**
 * ¿Puede la banda publicar este vídeo de YouTube como suyo?
 *
 * Auto-publicar en Instagram un clip sacado de un vídeo ajeno es la forma más rápida de que le
 * den un strike de copyright a la banda. Se acredita de dos maneras, y queda guardada la que fue:
 *  - `canal_de_la_banda`: el canal que subió el vídeo coincide con el YouTube (o el nombre) de la banda.
 *  - `declarado_por_la_banda`: la banda afirma expresamente que tiene los derechos (casilla en el
 *    editor). No lo verifica nadie, pero queda constancia de quién lo declaró y la responsabilidad
 *    es suya, igual que aprobar un email antes de enviarlo.
 * Sin ninguna de las dos, el clip se puede renderizar y descargar, pero no se autopublica.
 */
import type { DerechosClip } from "../db/reelClips.js";

const normalizar = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]/g, "");

/** `@handle`, `/c/nombre` o `/user/nombre` de una URL de canal. Un `/channel/UC…` no sirve para comparar por nombre. */
export function nombreDeCanalEnUrl(url: string): string {
  const m = /youtube\.com\/(?:@([^/?#]+)|(?:c|user)\/([^/?#]+))/i.exec(url || "");
  return normalizar(decodeURIComponent(m?.[1] || m?.[2] || ""));
}

export function derechosDelClip(entrada: {
  canalOrigen?: string;
  youtubeDeLaBanda?: string;
  nombreDeLaBanda?: string;
  declaradoPorLaBanda?: boolean;
}): DerechosClip | null {
  const canal = normalizar(entrada.canalOrigen || "");
  if (canal.length >= 3) {
    const candidatos = [nombreDeCanalEnUrl(entrada.youtubeDeLaBanda || ""), normalizar(entrada.nombreDeLaBanda || "")].filter((c) => c.length >= 3);
    if (candidatos.includes(canal)) return "canal_de_la_banda";
  }
  return entrada.declaradoPorLaBanda ? "declarado_por_la_banda" : null;
}

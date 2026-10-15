/**
 * Auditoría del copy del análisis inicial. Los highlights que devuelve el modelo traen el texto de
 * cada red, pero solo "mejorar copy" pasaba por la auditoría: lo que se veía al analizar el vídeo
 * podía llevar hashtags dentro del texto, cebo de interacción o un título de Shorts cortado.
 * Aquí se sanea (arreglos mecánicos) y se anota la auditoría para que la interfaz avise.
 */
import { auditarCopyReel, sanearCopyReel, type CopyReel, type ProblemaCopy } from "./auditoriaCopyReel.js";
import type { NormalizedHighlight } from "./reelsCore.js";

export interface ResumenAuditoria {
  puntuacion: number;
  apto: boolean;
  problemas: Pick<ProblemaCopy, "campo" | "codigo" | "gravedad" | "mensaje">[];
}

export type HighlightAuditado = NormalizedHighlight & { auditoriaCopy: ResumenAuditoria };

export function sanearYAuditarHighlights(highlights: NormalizedHighlight[]): HighlightAuditado[] {
  return highlights.map((h) => {
    const copy: CopyReel = sanearCopyReel({
      hookText: h.hookText,
      recommendedCopy: h.recommendedCopy,
      copyTikTok: h.copyTikTok,
      copyYouTube: h.copyYouTube,
      copyFacebook: h.copyFacebook,
      hashtags: h.hashtags
    });
    const { puntuacion, apto, problemas } = auditarCopyReel(copy);
    return { ...h, ...copy, auditoriaCopy: { puntuacion, apto, problemas } };
  });
}

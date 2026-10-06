// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

/**
 * Feedback del usuario sobre un plan/análisis de setlist generado por IA, con memoria
 * persistente — mismo patrón que `server/utils/reelFeedback.ts` para los Reels: valorar con
 * estrellas + comentario libre al regenerar, y que ese aprendizaje quede disponible para las
 * próximas generaciones (no solo para este mismo setlist), salvo que el usuario marque el ajuste
 * como puntual ("este_setlist"). Sin capa de "auto-refinamiento" aparte (a diferencia del ADN de
 * Tono de los pitches de booking): el propio prompt de generación lee el historial reciente tal
 * cual, sin una llamada extra de IA para destilarlo primero.
 */

export interface SetlistFeedbackLogEntry {
  id: string;
  fecha: string;
  comentario: string;
  intensidadRating?: number;
  contenidoRating?: number;
  alcance: "este_setlist" | "global";
}

/** Últimas entradas útiles (con señal real) para inyectar como memoria en el prompt — solo las
 * de alcance "global"; las marcadas "este_setlist" fueron un ajuste puntual, no una preferencia
 * a recordar. */
export function formatGlobalSetlistFeedbackForPrompt(historial: SetlistFeedbackLogEntry[] | undefined | null): string {
  const lista = Array.isArray(historial) ? historial : [];
  const utiles = lista.filter(
    (h) => h && h.alcance !== "este_setlist" && (h.comentario || h.intensidadRating || h.contenidoRating)
  );
  if (!utiles.length) return "";

  // Se guardan más recientes primero (unshift al loguear), así que ya vienen ordenadas.
  return utiles
    .slice(0, 15)
    .map((log, idx) => {
      const partes: string[] = [];
      if (log.comentario) partes.push(`Instrucción: "${log.comentario}"`);
      if (log.intensidadRating) partes.push(`Intensidad/energía: ${log.intensidadRating}/5`);
      if (log.contenidoRating) partes.push(`Contenido/selección de temas: ${log.contenidoRating}/5`);
      return `${idx + 1}. ${partes.join(" | ")}`;
    })
    .join("\n");
}

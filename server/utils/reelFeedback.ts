/**
 * Feedback del usuario sobre títulos y descripciones de Reels, con memoria persistente.
 *
 * Mismo patrón que `server/routes/leads/feedback.ts` para los pitches de booking: valorar con
 * estrellas + comentario libre al reanalizar un corte, y que ese aprendizaje quede disponible
 * para las próximas generaciones (no solo para ese mismo corte), salvo que el usuario marque el
 * ajuste como puntual ("este_reel").
 */

export interface ReelFeedbackLogEntry {
  id: string;
  fecha: string;
  tituloPrevio: string;
  descripcionPrevia: string;
  comentario: string;
  tonoRating?: number;
  contenidoRating?: number;
  tituloNuevo: string;
  descripcionNueva: string;
  alcance: "este_reel" | "global";
}

/** Últimas entradas útiles (con señal real) para inyectar como memoria en el prompt. */
export function formatGlobalReelFeedbackForPrompt(historial: ReelFeedbackLogEntry[] | undefined | null): string {
  const lista = Array.isArray(historial) ? historial : [];
  const utiles = lista.filter(
    (h) => h && h.alcance !== "este_reel" && (h.comentario || h.tonoRating || h.contenidoRating)
  );
  if (!utiles.length) return "";

  // Se guardan más recientes primero (unshift al loguear), así que ya vienen ordenadas.
  return utiles
    .slice(0, 15)
    .map((log, idx) => {
      const partes: string[] = [];
      if (log.comentario) partes.push(`Instrucción: "${log.comentario}"`);
      if (log.tonoRating) partes.push(`Tono: ${log.tonoRating}/5`);
      if (log.contenidoRating) partes.push(`Contenido: ${log.contenidoRating}/5`);
      return `${idx + 1}. ${partes.join(" | ")}`;
    })
    .join("\n");
}

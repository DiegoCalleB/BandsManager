export interface BandStyleContext {
  genero?: string;
  biografia?: string;
  dossierTextoExtra?: string;
  /** Memoria acumulada de feedback (valoraciones + comentarios) que la banda ha ido dejando en
   * generaciones anteriores con alcance "global" — ver `formatGlobalSetlistFeedbackForPrompt`.
   * Ya viene formateada como texto listo para el prompt. */
  feedbackMemoryText?: string;
}

/**
 * Construye el bloque de "contexto de banda" para los prompts de análisis/generación de setlist,
 * a partir de datos que la banda YA tiene rellenados en su EPK (biografía, género, dossier de
 * booking en `EPKConfig` — ver `dbGetEpkConfig`) — en vez de pedirle que repita esa información
 * en un campo nuevo solo para la IA. Sin esto, el modelo solo tiene pacing genérico de conciertos;
 * con esto, sabe qué tipo de banda es y para qué público toca.
 *
 * Devuelve cadena vacía si no hay ningún dato real que aportar (EPK sin rellenar todavía).
 */
export function buildBandStyleContextBlock(context?: BandStyleContext | null): string {
  if (!context) return '';

  const parts: string[] = [];
  if (context.genero?.trim()) parts.push(`Género: ${context.genero.trim()}`);
  if (context.biografia?.trim()) parts.push(`Biografía: ${context.biografia.trim()}`);
  if (context.dossierTextoExtra?.trim()) parts.push(`Notas de booking/estilo: ${context.dossierTextoExtra.trim()}`);

  let block = '';
  if (parts.length > 0) {
    block += `\nCONTEXTO DE LA BANDA (ajusta tu criterio a su estilo real, no a un pacing genérico):\n${parts.join('\n')}\n`;
  }
  if (context.feedbackMemoryText?.trim()) {
    block += `\nCORRECCIONES QUE LA BANDA YA TE HA ENSEÑADO EN GENERACIONES ANTERIORES (aplícalas también aquí, no las repitas como si fueran nuevas):\n${context.feedbackMemoryText.trim()}\n`;
  }

  return block;
}

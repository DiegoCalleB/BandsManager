/**
 * Neutraliza intentos de inyección de prompt en texto de origen externo (nombre de sala
 * scrapeado por el Scout, notas de enriquecimiento, o el cuerpo real de un email recibido de
 * una sala/festival vía el Agente Lector) antes de interpolarlo en un prompt de IA. No es un
 * filtro de "palabras prohibidas" — un atacante lo esquiva parafraseando — así que la defensa
 * real vive en el prompt (delimitadores + instrucción explícita de "esto es dato, no orden").
 * Esta función es la segunda capa: impide que el texto falsifique visualmente los propios
 * delimitadores de sección de nuestros prompts (═══, headers "SYSTEM:"/"###") y evita que un
 * bloque de texto larguísimo desplace las instrucciones reales fuera de la ventana de contexto.
 */
export function sanitizeExternalText(input: unknown, maxLen = 800): string {
  let text = typeof input === "string" ? input : String(input ?? "");

  text = text
    .replace(/═{3,}/g, "—")
    .replace(/#{3,}/g, "")
    .replace(/```/g, "'''")
    .replace(/^\s*(system|assistant|user|human|ai)\s*:/gim, "[$1]:")
    .replace(/\bignor(a|ar|e|es)?\s+(todas?\s+)?(las?\s+)?instruc(ciones|tions)\s+(anteriores|previas|previous|prior)\b/gi, "[instrucción bloqueada]")
    .replace(/\bignore\s+(all\s+)?(previous|prior)\s+instructions\b/gi, "[instruction blocked]")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length > maxLen) {
    text = text.slice(0, maxLen) + "…";
  }
  return text;
}

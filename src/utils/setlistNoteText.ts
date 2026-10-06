// Limpieza del TEXTO de las notas y del nombre del setlist antes de imprimirlos. Los datos reales
// (p. ej. Ruta 66) traen ruido que en el papel estorba: metadatos importados que repiten el tono y
// los BPM, el historial de edición pegado al final de la nota y paréntesis duplicados.

/** Historial de edición que la app pega al texto: "15:56 EDITADA 2 veces". */
const EDIT_HISTORY = /\s*\b\d{1,2}:\d{2}\s+EDITAD[AO]S?\s+\d+\s+(?:vez|veces)\b/gi;

export function cleanPrintedNote(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(EDIT_HISTORY, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Nota general autogenerada al importar ("[Versión Original: Rock Clásico - E, 120 BPM]"): habla
 * de la versión del disco, no de cómo toca la banda el tema, y duplica los badges de tono y BPM.
 */
export function isAutoVersionNote(text: string | null | undefined): boolean {
  return !!text && /^\s*\[?\s*versi[oó]n\s+original\s*:/i.test(text);
}

/** "(X) (X)" -> "(X)": un nombre con el mismo paréntesis repetido se imprimiría dos veces. */
export function cleanSetlistName(name: string): string {
  return name.replace(/(\([^()]+\))(?:\s*\1)+/gi, "$1").replace(/\s{2,}/g, " ").trim();
}

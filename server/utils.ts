export function safeParseJson(text: string): any {
  if (!text || typeof text !== "string") return text;
  let cleanText = text.trim();
  
  if (cleanText.startsWith("```")) {
    const firstLineBreak = cleanText.indexOf("\n");
    if (firstLineBreak !== -1) {
      cleanText = cleanText.substring(firstLineBreak + 1);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
  }
  
  const startObj = cleanText.indexOf("{");
  const endObj = cleanText.lastIndexOf("}");
  const startArr = cleanText.indexOf("[");
  const endArr = cleanText.lastIndexOf("]");
  
  let isObject = false;
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    if (startArr === -1 || startObj < startArr) {
      isObject = true;
      cleanText = cleanText.substring(startObj, endObj + 1);
    }
  }
  if (!isObject && startArr !== -1 && endArr !== -1 && endArr > startArr) {
    cleanText = cleanText.substring(startArr, endArr + 1);
  }

  try {
    return JSON.parse(cleanText);
  } catch (_err) {
    let sanitized = "";
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      if (inString) {
        if (escaped) {
          sanitized += char;
          escaped = false;
        } else if (char === "\\") {
          sanitized += char;
          escaped = true;
        } else if (char === "\"") {
          sanitized += char;
          inString = false;
        } else if (char === "\n") {
          sanitized += "\\n";
        } else if (char === "\r") {
          sanitized += "\\r";
        } else if (char === "\t") {
          sanitized += "\\t";
        } else if (char.charCodeAt(0) < 32) {
          sanitized += "\\u" + ("000" + char.charCodeAt(0).toString(16)).slice(-4);
        } else {
          sanitized += char;
        }
      } else {
        if (char === "\"") {
          inString = true;
        }
        sanitized += char;
      }
    }
    
    sanitized = sanitized.replace(/,\s*([}\]])/g, "$1");
    
    return JSON.parse(sanitized);
  }
}

// Usada como filtro de tenant en escrituras reales a Supabase (ver
// bulkImportSpotifyDiscographyToBand). Antes, un bandId vacío devolvía una banda por defecto en silencio,
// así que una importación de Spotify sin banda asociada acababa escribiendo canciones en el
// catálogo real de la banda insignia. Mejor fallar alto, igual que server/db/core.ts#cleanBandId.
export function cleanBandId(bandId?: string): string {
  if (!bandId || typeof bandId !== "string" || !bandId.trim()) {
    throw new Error("cleanBandId: se requiere un band_id válido; no hay banda por defecto.");
  }
  return bandId.toLowerCase().trim();
}


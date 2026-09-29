/**
 * PROMPT SAFETY, SANITIZACIÓN & AUDITORÍA HEURÍSTICA ANTI-IA
 * 
 * Centraliza la desinfección de texto externo y la auditoría heurística determinista
 * para evitar inyecciones de prompt, clichés de IA, monotonía sintáctica (Burstiness)
 * y desviaciones de formato.
 */

export interface PitchLengthAssessment {
  status: "optimal" | "acceptable" | "too_long" | "too_short";
  feedback: string;
  wordCount: number;
}

export interface PitchQualityIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  matchedText?: string;
}

export interface PitchQualityAudit {
  antiAiScore: number; // 0 a 100
  badge: "excelente" | "bueno" | "revisable";
  wordCount: number;
  lengthAssessment: PitchLengthAssessment;
  bannedWordsFound: Array<{ word: string; suggestion?: string }>;
  emDashesFound: number;
  ruleOfThreeDetected: boolean;
  chainedGerundsDetected: boolean;
  issues: PitchQualityIssue[];
}

export const BANNED_AI_WORDS = [
  "crucial",
  "esencial",
  "fundamental",
  "profundizar",
  "explorar",
  "aprovechar",
  "optimizar",
  "paisaje",
  "tapiz",
  "vanguardia",
  "revolucionario",
  "en el dinámico mundo",
  "espero que este correo",
  "quedo a su entera disposición",
  "agradezco de antemano",
  "cautivador",
  "inquebrantable",
  "sinergia",
  "sinergias",
  "apalancar",
  "holístico"
];

export const DIRECT_WORD_SUBSTITUTIONS: Record<string, string> = {
  "crucial": "importante",
  "esencial": "clave",
  "fundamental": "básico",
  "profundizar": "ver en detalle",
  "explorar": "mirar",
  "aprovechar": "usar",
  "optimizar": "mejorar",
  "paisaje": "circuito",
  "tapiz": "panorama",
  "vanguardia": "novedad",
  "revolucionario": "muy potente",
  "apalancar": "apoyarse en"
};

export const BANNED_OPENINGS = [
  "espero que este correo te encuentre bien",
  "espero que te encuentres bien",
  "espero que todo vaya bien",
  "me pongo en contacto con usted",
  "le escribo para presentarle",
  "por la presente",
  "agradezco de antemano su atención"
];

export function getRecommendedWordRange(category?: string): { min: number; max: number; optimal: string } {
  const cat = (category || "").toLowerCase();
  if (cat.includes("ayunt") || cat.includes("teatr") || cat.includes("auditor") || cat.includes("institu")) {
    return { min: 90, max: 180, optimal: "100-160 palabras (protocolo formal / garantías)" };
  }
  if (cat.includes("festiv")) {
    return { min: 80, max: 150, optimal: "90-135 palabras (enfoque slot y público)" };
  }
  if (cat.includes("disco") || cat.includes("club") || cat.includes("nocturn")) {
    return { min: 65, max: 125, optimal: "75-115 palabras (ultra-directo, live set)" };
  }
  if (cat.includes("medio") || cat.includes("prensa") || cat.includes("radio")) {
    return { min: 80, max: 155, optimal: "90-140 palabras (facilitador de contenido, WAV)" };
  }
  if (cat.includes("grup") || cat.includes("banda") || cat.includes("intercamb")) {
    return { min: 70, max: 140, optimal: "80-125 palabras (de colega a colega, date swap)" };
  }
  return { min: 75, max: 145, optimal: "80-130 palabras (lectura rápida en móvil, 2 párrafos)" };
}

/**
 * Sanitiza texto externo proveniente de leads, emails recibidos o scraping
 * para prevenir inyecciones de prompt.
 */
export function sanitizeExternalText(text: any, maxLength: number = 3000): string {
  if (text === null || text === undefined) return "";
  let clean = typeof text === "string" ? text : String(text);

  // 1. Neutralizar inyecciones de cambio de rol
  clean = clean.replace(/ignora\s+(las\s+)?instrucciones\s+anteriores/gi, "[instrucción bloqueada]");
  clean = clean.replace(/ignore\s+(all\s+)?previous\s+instructions/gi, "[instruction blocked]");

  // 2. Borrar delimitadores visuales de sección
  clean = clean.replace(/═{3,}/g, "---");
  clean = clean.replace(/#{3,}/g, "---");
  clean = clean.replace(/```/g, "'''");

  // 3. Neutralizar cabeceras de rol al inicio de línea
  clean = clean.replace(/^(\s*)(system|assistant):/gim, "$1[$2]:");

  // 4. Colapsar saltos de línea excesivos
  clean = clean.replace(/\n{3,}/g, "\n\n");

  // 5. Truncar longitud
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength) + "…";
  }

  return clean.trim();
}

/**
 * Validador Heurístico Determinista & Auditor Anti-IA
 */
export function auditPitchQuality(pitch: string, category?: string): PitchQualityAudit {
  const cleanText = (pitch || "").trim();
  const words = cleanText.length > 0 ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const range = getRecommendedWordRange(category);
  const issues: PitchQualityIssue[] = [];
  let scoreDeductions = 0;

  // 1. Longitud
  let lengthStatus: "optimal" | "acceptable" | "too_long" | "too_short" = "optimal";
  let lengthFeedback = `Longitud adecuada (${wordCount} palabras).`;

  if (wordCount === 0) {
    lengthStatus = "too_short";
    lengthFeedback = "El pitch está vacío.";
    scoreDeductions += 40;
    issues.push({ code: "EMPTY_PITCH", severity: "error", message: "Pitch vacío." });
  } else if (wordCount < 40) {
    lengthStatus = "too_short";
    lengthFeedback = `Texto corto (${wordCount} palabras).`;
    scoreDeductions += 15;
    issues.push({ code: "TOO_SHORT", severity: "warning", message: "Pitch muy breve." });
  } else if (wordCount > 210) {
    lengthStatus = "too_long";
    lengthFeedback = `Texto extenso (${wordCount} palabras).`;
    scoreDeductions += 15;
    issues.push({ code: "TOO_LONG", severity: "warning", message: "Excede 210 palabras." });
  }

  // 2. Detección de palabras prohibidas
  const bannedWordsFound: Array<{ word: string; suggestion?: string }> = [];
  const textLower = cleanText.toLowerCase();

  for (const banned of BANNED_AI_WORDS) {
    const escaped = banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(textLower)) {
      const suggestion = DIRECT_WORD_SUBSTITUTIONS[banned] || "eliminar o sustituir";
      bannedWordsFound.push({ word: banned, suggestion });
      scoreDeductions += 12;
      issues.push({
        code: "BANNED_AI_WORD",
        severity: "warning",
        message: `Detectada palabra cliché: "${banned}".`,
        suggestion: `Sustituir por: "${suggestion}".`,
        matchedText: banned
      });
    }
  }

  // 3. Guiones largos (Em-Dashes '—' o '--')
  const emDashMatches = (cleanText.match(/—/g) || []).length;
  const doubleDashMatches = (cleanText.match(/--/g) || []).length;
  const totalDashes = emDashMatches + doubleDashMatches;

  if (totalDashes > 0) {
    scoreDeductions += Math.min(20, totalDashes * 8);
    issues.push({
      code: "EM_DASH_DETECTED",
      severity: "warning",
      message: `Se detectaron ${totalDashes} guiones largos o dobles ('—' o '--').`,
      suggestion: "Sustituir por comas o separar en dos oraciones."
    });
  }

  // 4. Rule of Three
  const ruleOfThreeRegex = /\b([a-záéíóúñ]{4,})\s*,\s*([a-záéíóúñ]{4,})\s+y\s+([a-záéíóúñ]{4,})\b/i;
  const ruleOfThreeMatch = cleanText.match(ruleOfThreeRegex);
  const ruleOfThreeDetected = !!ruleOfThreeMatch;

  if (ruleOfThreeDetected && ruleOfThreeMatch) {
    scoreDeductions += 6;
    issues.push({
      code: "RULE_OF_THREE",
      severity: "info",
      message: `Detectada posible tríada de adjetivos ("${ruleOfThreeMatch[0]}").`,
      matchedText: ruleOfThreeMatch[0]
    });
  }

  // 5. Gerundios encadenados
  const chainedGerundsRegex = /\b([a-záéíóúñ]{4,}(?:ando|iendo))\b[^.!?\n]*\b([a-záéíóúñ]{4,}(?:ando|iendo))\b/i;
  const chainedGerundsMatch = cleanText.match(chainedGerundsRegex);
  const chainedGerundsDetected = !!chainedGerundsMatch;

  if (chainedGerundsDetected && chainedGerundsMatch) {
    scoreDeductions += 5;
    issues.push({
      code: "CHAINED_GERUNDS",
      severity: "info",
      message: "Gerundios encadenados detectados."
    });
  }

  const antiAiScore = Math.max(0, Math.min(100, 100 - scoreDeductions));
  const badge = antiAiScore >= 85 ? "excelente" : antiAiScore >= 70 ? "bueno" : "revisable";

  return {
    antiAiScore,
    badge,
    wordCount,
    lengthAssessment: {
      status: lengthStatus,
      feedback: lengthFeedback,
      wordCount
    },
    bannedWordsFound,
    emDashesFound: totalDashes,
    ruleOfThreeDetected,
    chainedGerundsDetected,
    issues
  };
}

/**
 * Sanitiza un pitch determinísticamente reemplazando guiones largos y clichés.
 */
export function sanitizePitchDeterministically(pitch: string): string {
  if (!pitch) return "";
  let clean = pitch;

  // Reemplazar em-dashes por comas o puntos
  clean = clean.replace(/\s*—\s*/g, ", ");
  clean = clean.replace(/\s*--\s*/g, ", ");

  // Reemplazar sustituciones directas
  for (const [banned, sub] of Object.entries(DIRECT_WORD_SUBSTITUTIONS)) {
    const escaped = banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    clean = clean.replace(regex, sub);
  }

  return clean.trim();
}

/**
 * Calcula la variación en la longitud de oraciones (Burstiness / Desviación Estándar)
 * Un valor bajo (< 2.0) indica monotonía sintética de IA.
 * Un valor saludable (>= 2.5) indica ritmo y asimetría humana.
 */
export function calculateSentenceBurstiness(text: string): { score: number; isOrganic: boolean } {
  if (!text || typeof text !== "string") return { score: 0, isOrganic: false };
  
  const sentences = text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("http"));

  if (sentences.length < 2) {
    return { score: 0, isOrganic: false };
  }

  const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((acc, len) => acc + len, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return {
    score: Number(stdDev.toFixed(2)),
    isOrganic: stdDev >= 2.0
  };
}

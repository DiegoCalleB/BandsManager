import { BANNED_AI_WORDS, BANNED_OPENINGS, DIRECT_WORD_SUBSTITUTIONS } from "./promptGuidelines.js";

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

export interface PitchQualityIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  matchedText?: string;
}

export interface PitchLengthAssessment {
  wordCount: number;
  minRecommended: number;
  maxRecommended: number;
  status: "optimal" | "acceptable" | "too_long" | "too_short";
  feedback: string;
}

export interface PitchQualityAudit {
  antiAiScore: number; // 0 a 100
  badge: "excelente" | "bueno" | "revisable";
  wordCount: number;
  lengthAssessment: PitchLengthAssessment;
  bannedWordsFound: Array<{ word: string; suggestion?: string }>;
  emDashesFound: number;
  throatClearingDetected: boolean;
  ruleOfThreeDetected: boolean;
  chainedGerundsDetected: boolean;
  doubleSignatureDetected: boolean;
  issues: PitchQualityIssue[];
  isReadyForDispatch: boolean;
}

/**
 * Obtiene el rango de palabras recomendado según la tipología del destinatario.
 * En lugar de imponer un techo rígido destructivo, ofrece una recomendación ergonómica
 * adaptada a la naturaleza de la comunicación (B2B salas vs Ayuntamientos vs Festivales).
 */
export function getRecommendedWordRange(category?: string): { min: number; max: number; optimal: string } {
  const cat = String(category || "").toLowerCase().trim();
  if (cat.includes("ayunt") || cat.includes("fiesta") || cat.includes("cultura") || cat.includes("instituc")) {
    return { min: 90, max: 180, optimal: "110-160 palabras (apropiado para garantías administrativas y protocolo)" };
  }
  if (cat.includes("teatr") || cat.includes("auditor") || cat.includes("fundac")) {
    return { min: 85, max: 165, optimal: "100-150 palabras (foco acústico y artístico)" };
  }
  if (cat.includes("festiv") || cat.includes("ciclo")) {
    return { min: 75, max: 150, optimal: "85-135 palabras (conciso, slot mirroring)" };
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
 * Validador Heurístico Determinista & Auditor Anti-IA
 * Evalúa el texto de un pitch sin coste de tokens (0ms) mediante reglas matemáticas y sintácticas.
 */
export function auditPitchQuality(pitch: string, category?: string): PitchQualityAudit {
  const cleanText = (pitch || "").trim();
  const words = cleanText.length > 0 ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const range = getRecommendedWordRange(category);
  const issues: PitchQualityIssue[] = [];
  let scoreDeductions = 0;

  // 1. Evaluación de longitud (recomendación flexible, no prohibición destructiva)
  let lengthStatus: "optimal" | "acceptable" | "too_long" | "too_short" = "optimal";
  let lengthFeedback = `Longitud perfecta (${wordCount} palabras). Dentro del rango ideal recomendado (${range.optimal}).`;

  if (wordCount === 0) {
    lengthStatus = "too_short";
    lengthFeedback = "El pitch está vacío.";
    scoreDeductions += 40;
    issues.push({
      code: "EMPTY_PITCH",
      severity: "error",
      message: "No se ha generado ningún texto para el mensaje."
    });
  } else if (wordCount < 40) {
    lengthStatus = "too_short";
    lengthFeedback = `Texto excesivamente corto (${wordCount} palabras). Podría resultar telegráfico o carecer de contexto de valor.`;
    scoreDeductions += 15;
    issues.push({
      code: "TOO_SHORT",
      severity: "warning",
      message: `El mensaje tiene solo ${wordCount} palabras. Se recomienda desarrollar brevemente la afinidad con la sala.`,
      suggestion: "Añadir 1 o 2 frases sobre la afinidad con su programación o fecha tentativa."
    });
  } else if (wordCount > 210) {
    lengthStatus = "too_long";
    lengthFeedback = `Texto algo extenso (${wordCount} palabras). Riesgo de truncamiento en clientes de correo móvil o pérdida de atención.`;
    scoreDeductions += 12;
    issues.push({
      code: "TOO_LONG",
      severity: "warning",
      message: `El mensaje alcanza ${wordCount} palabras. Para frío B2B se recomienda podar hacia ${range.max} palabras.`,
      suggestion: "Podar explicaciones secundarias para asegurar que la firma y enlaces queden visibles en la primera pantalla."
    });
  } else if (wordCount > range.max) {
    // Si supera el máximo recomendado pero está bajo 210, es aceptable (especialmente en ayuntamientos/teatros)
    lengthStatus = "acceptable";
    lengthFeedback = `${wordCount} palabras: Ligeramente superior al rango óptimo (${range.max} palabras), pero completamente admisible y legible.`;
  } else if (wordCount < range.min) {
    lengthStatus = "acceptable";
    lengthFeedback = `${wordCount} palabras: Ligeramente por debajo del rango habitual (${range.min} palabras), pero conciso y directo.`;
  }

  // 2. Detección de palabras prohibidas / clichés de IA
  const bannedWordsFound: Array<{ word: string; suggestion?: string }> = [];
  const textLower = cleanText.toLowerCase();

  for (const banned of BANNED_AI_WORDS) {
    const escaped = banned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(textLower)) {
      const suggestion = DIRECT_WORD_SUBSTITUTIONS[banned] || "eliminar o sustituir por lenguaje natural";
      bannedWordsFound.push({ word: banned, suggestion });
      scoreDeductions += 12;
      issues.push({
        code: "BANNED_AI_WORD",
        severity: "warning",
        message: `Detectado cliché característico de IA: "${banned}".`,
        suggestion: `Sustituir por: "${suggestion}".`,
        matchedText: banned
      });
    }
  }

  // 3. Detección de aperturas cliché (Throat-Clearing)
  let throatClearingDetected = false;
  for (const opening of BANNED_OPENINGS) {
    if (textLower.startsWith(opening.toLowerCase()) || textLower.includes(opening.toLowerCase())) {
      throatClearingDetected = true;
      scoreDeductions += 10;
      issues.push({
        code: "THROAT_CLEARING",
        severity: "warning",
        message: `Apertura con fórmula vacía: "${opening}".`,
        suggestion: "Ir directo al grano reconociendo la programación del espacio en la primera línea.",
        matchedText: opening
      });
      break;
    }
  }

  // 4. Detección de guiones largos (Em-Dashes '—' o '--')
  const emDashMatches = (cleanText.match(/—/g) || []).length;
  const doubleDashMatches = (cleanText.match(/--/g) || []).length;
  const totalDashes = emDashMatches + doubleDashMatches;

  if (totalDashes > 0) {
    scoreDeductions += Math.min(15, totalDashes * 6);
    issues.push({
      code: "EM_DASH_DETECTED",
      severity: "warning",
      message: `Se detectaron ${totalDashes} guiones largos o dobles ('—' o '--'). Es un marcador típico de redacción sintética.`,
      suggestion: "Sustituir por comas o separar en dos oraciones con punto."
    });
  }

  // 5. Detección de Rule of Three (tríadas de adjetivos/verbos tipo IA)
  const ruleOfThreeRegex = /\b([a-záéíóúñ]{4,})\s*,\s*([a-záéíóúñ]{4,})\s+y\s+([a-záéíóúñ]{4,})\b/i;
  const ruleOfThreeMatch = cleanText.match(ruleOfThreeRegex);
  const ruleOfThreeDetected = !!ruleOfThreeMatch;

  if (ruleOfThreeDetected && ruleOfThreeMatch) {
    scoreDeductions += 6;
    issues.push({
      code: "RULE_OF_THREE",
      severity: "info",
      message: `Detectada posible tríada de adjetivos ("${ruleOfThreeMatch[0]}").`,
      suggestion: "Las personas reales suelen usar uno o dos calificativos asimétricos en lugar de tríadas perfectas.",
      matchedText: ruleOfThreeMatch[0]
    });
  }

  // 6. Detección de gerundios encadenados
  const chainedGerundsRegex = /\b([a-záéíóúñ]{4,}(?:ando|iendo))\b[^.!?\n]*\b([a-záéíóúñ]{4,}(?:ando|iendo))\b/i;
  const chainedGerundsMatch = cleanText.match(chainedGerundsRegex);
  const chainedGerundsDetected = !!chainedGerundsMatch;

  if (chainedGerundsDetected && chainedGerundsMatch) {
    scoreDeductions += 5;
    issues.push({
      code: "CHAINED_GERUNDS",
      severity: "info",
      message: `Detectados gerundios encadenados en una misma cláusula ("${chainedGerundsMatch[0]}").`,
      suggestion: "Reemplazar el segundo gerundio por una forma verbal finita ('hacemos y logramos').",
      matchedText: chainedGerundsMatch[0]
    });
  }

  // 7. Detección de doble firma / datos de contacto redundantes en el cuerpo
  const doubleSignatureRegex = /(?:tel(?:éfono)?|tfno|email|correo|contacto)[:\s]+[+\d@a-z._-]+/i;
  const manualSignRegex = /(?:atentamente|un saludo cordial|saludos cordiales)[,\s]+[a-záéíóúñ\s]{3,30}$/i;
  const doubleSignatureDetected = doubleSignatureRegex.test(cleanText) || manualSignRegex.test(cleanText);

  if (doubleSignatureDetected) {
    scoreDeductions += 6;
    issues.push({
      code: "DOUBLE_SIGNATURE",
      severity: "info",
      message: "Se detectó firma manual o teléfono/correo en el cuerpo del mensaje.",
      suggestion: "El sistema ya añade automáticamente la firma oficial con enlaces y contacto del mánager; se puede suprimir del cuerpo."
    });
  }

  const antiAiScore = Math.max(0, Math.min(100, 100 - scoreDeductions));
  let badge: "excelente" | "bueno" | "revisable" = "excelente";
  if (antiAiScore < 75) {
    badge = "revisable";
  } else if (antiAiScore < 90) {
    badge = "bueno";
  }

  const isReadyForDispatch = antiAiScore >= 70 && wordCount >= 35 && cleanText.length > 0;

  return {
    antiAiScore,
    badge,
    wordCount,
    lengthAssessment: {
      wordCount,
      minRecommended: range.min,
      maxRecommended: range.max,
      status: lengthStatus,
      feedback: lengthFeedback
    },
    bannedWordsFound,
    emDashesFound: totalDashes,
    throatClearingDetected,
    ruleOfThreeDetected,
    chainedGerundsDetected,
    doubleSignatureDetected,
    issues,
    isReadyForDispatch
  };
}

/**
 * Corrige determinísticamente vicios sintácticos comunes de los modelos (0ms, sin re-prompting):
 * - Reemplaza em-dashes ('—' y '--') por comas o puntos.
 * - Limpia frases de apertura cliché vacías si están al inicio.
 * - Suprime firmas manuales duplicadas que contengan "Tel:" o "Email:" al pie.
 * - Normaliza espaciado y saltos de línea.
 */
export function sanitizePitchDeterministically(pitch: string): string {
  if (!pitch || typeof pitch !== "string") return "";

  let cleaned = pitch;

  // 1. Reemplazo de em-dashes entre palabras por comas, o punto si cierra
  cleaned = cleaned
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".");

  // 2. Limpieza de aperturas vacías típicas si están al principio
  for (const opening of BANNED_OPENINGS) {
    const escaped = opening.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^\\s*${escaped}[,.]?\\s*\\n*`, "i");
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, "");
      // Poner la primera letra que quede en mayúscula
      cleaned = cleaned.replace(/^([a-záéíóúñ])/i, (m) => m.toUpperCase());
    }
  }

  // 3. Normalizar espacios y saltos de línea triples
  cleaned = cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}


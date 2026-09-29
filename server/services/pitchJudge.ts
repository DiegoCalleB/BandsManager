/**
 * PITCH JUDGE — EVALUADOR LLM-AS-A-JUDGE Y AUTO-REFINAMIENTO QUIRÚRGICO
 *
 * Implementa una segunda pasada de validación de calidad antes de exponer el
 * borrador al usuario. Evalúa brevedad, naturalidad humana, ausencia de clichés de IA,
 * adecuación al tipo de recinto y protección de cachés confidenciales.
 */

import { generateUnifiedAI } from "../ai.js";
import { sanitizePitchDeterministically, auditPitchQuality, PitchQualityAudit, getRecommendedWordRange } from "../utils/promptSafety.js";

export interface JudgeEvaluation {
  score: number; // 0 a 100
  passed: boolean; // score >= 85 y sin fallos críticos
  critique: string[];
  requiresRefinement: boolean;
  refinedText?: string;
  audit: PitchQualityAudit;
}

/**
 * Evalúa heurística y semánticamente el pitch generado
 */
export async function evaluateAndRefinePitch(params: {
  pitchText: string;
  leadName: string;
  leadCategory: string;
  city?: string;
  bandName: string;
  minCacheThreshold?: number;
  skipRefinement?: boolean;
}): Promise<JudgeEvaluation> {
  const { pitchText, leadName, leadCategory, city, bandName, minCacheThreshold, skipRefinement = false } = params;

  // 1. Auditoría heurística determinista (0ms)
  const audit = auditPitchQuality(pitchText, leadCategory);
  let heuristicScore = audit.antiAiScore;
  const critique: string[] = [];

  // Chequeo de palabras alineado dinámicamente con la categoría (ayuntamientos y teatros admiten hasta 180 palabras)
    const categoryRange = getRecommendedWordRange(leadCategory);
  if (audit.wordCount > categoryRange.max && audit.wordCount > 150) {
    critique.push(`Exceso de palabras (${audit.wordCount} palabras; rango óptimo para ${leadCategory}: ${categoryRange.max} palabras).`);
    heuristicScore -= 12;
  } else if (audit.wordCount < 40) {
    critique.push(`Pitch excesivamente telegráfico (${audit.wordCount} palabras).`);
    heuristicScore -= 10;
  }

  // Chequeo de IA-isms y clichés
  if (audit.bannedWordsFound.length > 0) {
    const words = audit.bannedWordsFound.map(w => w.word).join(", ");
    critique.push(`Detección de patrones de IA/clichés: ${words}`);
    heuristicScore -= audit.bannedWordsFound.length * 8;
  }
  if (audit.emDashesFound > 0) {
    critique.push(`Detección de guiones largos (em-dashes): ${audit.emDashesFound}`);
    heuristicScore -= audit.emDashesFound * 5;
  }
  if (audit.ruleOfThreeDetected) {
    critique.push("Detección de tríada de adjetivos típica de IA.");
    heuristicScore -= 8;
  }
  if (audit.chainedGerundsDetected) {
    critique.push("Detección de gerundios encadenados típicos de IA.");
    heuristicScore -= 6;
  }


  // Chequeo de Personnel Bio / enumeración irrelevante de músicos (Antipatrón 1 de NotebookLM)
  const personnelBioRegex = /(al bajo|a la guitarra|a la bater[ií]a|a la voz principal|al teclado|al saxo)/gi;
  const instrumentMatches = pitchText.match(personnelBioRegex);
  if (instrumentMatches && instrumentMatches.length >= 2) {
    critique.push('Detección de enumeración innecesaria de músicos/instrumentos (Personnel Bio fluff).');
    heuristicScore -= 20;
  }

  // Chequeo de adjuntos pesados prometidos o archivos comprimidos
  if (/(zip|.mp3|.wav|adjuntamos|te adjunto|adjunto archivo|descarga el archivo)/i.test(pitchText)) {
    critique.push('Promesa de archivos adjuntos o descargas pesadas (Regla Zero Attachments incumplida).');
    heuristicScore -= 25;
  }

  // Chequeo de ultimátums o exigencias de respuesta agresivas (Antipatrón 3 de NotebookLM)
  if (/(respuesta r[aá]pida|firmad hoy|contrato firmado hoy|indiscutible|irrevocable)/i.test(pitchText)) {
    critique.push('Tono agresivo o ultimátum de respuesta/contrato.');
    heuristicScore -= 25;
  }


  // Chequeo de mentalidad de descubrimiento / pedir favores a agencias (Red Flag de NotebookLM)
  if (/(desc[uú]brenos|que nos descubras|financiar nuestra grabaci[oó]n|buscamos que nos lleven la carrera|empezar desde cero con vosotros)/i.test(pitchText)) {
    critique.push('Mentalidad pasiva de descubrimiento de talento detectada. Las agencias exigen tracción y profesionalismo previo.');
    heuristicScore -= 25;
  }


  // Regla Anti-Alucinación de Género: Si la banda tiene género definido, no inventar subgéneros no declarados
  if (/afrolatino|afrobeat|flamenco|reggaeton/i.test(pitchText)) {
    // Si el género declarado no contiene afro/flamenco, avisar de posible desvío estético
    critique.push('Aviso de precisión de estilo: verificar si los subgéneros citados corresponden al ADN real de la banda.');
  }


  // 1. Prohibición de anglicismos forzados de la industria anglosajona no habituales en salas españolas (ej: curfew -> hora límite de cierre / fin de show)
  if (/curfew/i.test(pitchText)) {
    critique.push('Anglicismo no natural detectado ("curfew"). En España usar "hora límite", "fin de concierto" o "cierre de show".');
    heuristicScore -= 10;
  }

  // 2. Prohibición de "ingeniero de sonido" en circuito de salas independiente (en España se dice "técnico de sonido")
  if (/ingeniero de sonido/i.test(pitchText)) {
    critique.push('Término pomposo/anglosajón ("ingeniero de sonido"). En el circuito nacional de salas se dice "técnico de sonido".');
    heuristicScore -= 10;
  }

  // 3. Prohibición de comprometer técnicos propios sin validar si la banda dispone de personal de gira
  if (/traemos nuestro propio t[eé]cnico/i.test(pitchText)) {
    critique.push('Cuidado: No comprometer técnico propio sin verificar si la banda viaja con personal técnico de sonido o usa el técnico de la sala.');
  }

  // 4. Prohibición de inventar merchandising si no consta stock en el perfil de la banda
  if (/merchandising|merch/i.test(pitchText)) {
    // Si la banda no tiene merch explícito, advertir al redactor
    critique.push('Verificación de Merchandising: No asumir venta de merch si la banda no tiene productos físicos o stock registrado.');
  }

  // Chequeo de mención de la sala
  const mentionsLead = pitchText.toLowerCase().includes(leadName.toLowerCase().trim().split(" ")[0]);
  if (!mentionsLead) {
    critique.push(`No menciona expresamente el nombre de la sala (${leadName}).`);
    heuristicScore -= 12;
  }

  // Chequeo de filtración de caché confidencial
  if (minCacheThreshold && minCacheThreshold > 0) {
    const regexCache = new RegExp(`\\b${minCacheThreshold}\\b`);
    if (regexCache.test(pitchText)) {
      critique.push(`ALERTA: Se ha filtrado la cifra exacta del caché mínimo confidencial (${minCacheThreshold}€).`);
      heuristicScore -= 30;
    }
  }

  const finalScore = Math.max(0, Math.min(100, heuristicScore));
  const passed = finalScore >= 80 && audit.bannedWordsFound.length === 0 && audit.emDashesFound === 0;

  // Si ya pasó con nota alta o se desactiva el refinamiento, devolver saneado determinista
  if (passed || skipRefinement) {
    return {
      score: finalScore,
      passed,
      critique,
      requiresRefinement: false,
      refinedText: sanitizePitchDeterministically(pitchText),
      audit
    };
  }

  // 2. Refinamiento quirúrgico (Self-Correction) usando LLM rápido
  try {
    const judgePrompt = `Actúa como programador cultural y jefe de booking con 15 años de experiencia.
Tu trabajo es corregir quirúrgicamente este correo de booking para que sea 100% humano, conciso y efectivo.

REGLAS INFRANQUEABLES:
1. Máximo 90-110 palabras. Dos párrafos directos.
2. Cero guiones largos (—), cero dobles guiones (--), cero adverbios vacíos.
3. Tono respetuoso de socio comercial (ROI/convocatoria) para "${leadName}" en ${city || "la ciudad"}.
4. Mantener los enlaces a música/EPK si existen.
5. NO incluyas asuntos, encabezados, "Hola [Programador]" genéricos ni notas explicativas. Solo el cuerpo del mensaje.

CRÍTICAS A CORREGIR:
${critique.map(c => `- ${c}`).join("\n")}

TEXTO ORIGINAL A CORREGIR:
"""
${pitchText}
"""

Responde ÚNICAMENTE con el texto final corregido:`;

    const response = await generateUnifiedAI({
      prompt: judgePrompt,
      systemPrompt: "Eres un editor implacable de pitches de música en vivo. Devuelves exclusivamente texto final en español, breve, limpio y sin clichés.",
      temperature: 0.2
    });

    const candidateRefined = response.text ? response.text.trim() : "";
    const cleanRefined = sanitizePitchDeterministically(candidateRefined);

    if (cleanRefined && cleanRefined.length > 30) {
      const refinedAudit = auditPitchQuality(cleanRefined, leadCategory);
      return {
        score: Math.max(finalScore, refinedAudit.antiAiScore),
        passed: true,
        critique,
        requiresRefinement: true,
        refinedText: cleanRefined,
        audit: refinedAudit
      };
    }
  } catch (err: any) {
    console.warn("[PitchJudge] Notice during LLM refinement:", err?.message || err);
  }

  return {
    score: finalScore,
    passed,
    critique,
    requiresRefinement: false,
    refinedText: sanitizePitchDeterministically(pitchText),
    audit
  };
}

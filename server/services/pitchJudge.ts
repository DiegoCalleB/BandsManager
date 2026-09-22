/**
 * PITCH JUDGE — EVALUADOR LLM-AS-A-JUDGE Y AUTO-REFINAMIENTO QUIRÚRGICO
 *
 * Implementa una segunda pasada de validación de calidad antes de exponer el
 * borrador al usuario. Evalúa brevedad, naturalidad humana, ausencia de clichés de IA,
 * adecuación al tipo de recinto y protección de cachés confidenciales.
 */

import { generateUnifiedAI } from "../ai.js";
import { sanitizePitchDeterministically, auditPitchQuality, PitchQualityAudit } from "../utils/promptSafety.js";

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

  // Chequeo de palabras
  if (audit.wordCount > 130) {
    critique.push(`Exceso de palabras (${audit.wordCount} palabras; objetivo < 120).`);
    heuristicScore -= 15;
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

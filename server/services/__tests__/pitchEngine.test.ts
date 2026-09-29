import { describe, it, expect, vi } from "vitest";
import { PitchEngine } from "../pitchEngine.js";

describe("PitchEngine - Motor Unificado", () => {
  it("debe auditar la calidad y scoring anti-IA en tiempo real", () => {
    const aiText = "Espero que estés bien. Quería aprovechar para explorar sinergias y profundizar en el tapiz musical de nuestra banda — rápida, potente y solvente.";
    const audit = PitchEngine.auditPitch(aiText, "sala");

    expect(audit).toBeDefined();
    expect(audit.isReadyForDispatch).toBe(false);
    expect(audit.antiAiScore).toBeLessThan(100);
    expect(audit.bannedWordsFound.length).toBeGreaterThan(0);
    expect(audit.emDashesFound).toBeGreaterThan(0);
    expect(audit.wordCount).toBeGreaterThan(0);
  });

  it("debe sanear determinísticamente el texto eliminando em-dashes y dobles guiones sin coste de LLM", () => {
    const raw = "Hola equipo de Sala X — nos gustaría tocar allí -- os dejamos el dossier.";
    const sanitized = PitchEngine.sanitizePitch(raw);

    expect(sanitized).not.toContain("—");
    expect(sanitized).not.toContain("--");
    expect(sanitized).toContain("Hola equipo de Sala X, nos gustaría tocar allí, os dejamos el dossier.");
  });

  it("debe aplicar el rango ergonómico de palabras por tipo de sala/evento", () => {
    const textAyto = "Estimado equipo del Área de Cultura y Festejos de Plaza Mayor. Nos ponemos en contacto para presentarles nuestra propuesta de concierto de cara a las fiestas patronales. Ofrecemos un espectáculo para todos los públicos en recintos municipales, con solvencia técnica, facturación oficial y alta en régimen de artistas. Tienen el dossier y vídeo en el enlace. ¿En qué fechas revisan la programación de las fiestas? Atentamente.";
    const auditAyto = PitchEngine.auditPitch(textAyto, "ayuntamientos");

    expect(auditAyto.lengthAssessment).toBeDefined();
    expect(auditAyto.lengthAssessment.minRecommended).toBe(90);
    expect(auditAyto.lengthAssessment.maxRecommended).toBe(180);
    expect(["optimal", "acceptable"]).toContain(auditAyto.lengthAssessment.status);
  });

  it("debe marcar como advertencia suave si una sala supera el rango recomendado sin bloquear", () => {
    const longText = Array(220).fill("concierto").join(" ");
    const auditSala = PitchEngine.auditPitch(longText, "sala");

    expect(auditSala.lengthAssessment.status).toBe("too_long");
    expect(auditSala.lengthAssessment.maxRecommended).toBe(145);
    // Verifica que añade issue descriptiva sin crashear
    const issue = auditSala.issues.find(i => i.code === "TOO_LONG");
    expect(issue).toBeDefined();
  });
});

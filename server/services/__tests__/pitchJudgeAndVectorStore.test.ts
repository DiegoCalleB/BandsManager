import { describe, it, expect } from "vitest";
import { evaluateAndRefinePitch } from "../pitchJudge.js";
import { calculateSentenceBurstiness, auditPitchQuality } from "../../utils/promptSafety.js";

describe("PitchJudge - LLM-as-a-Judge & Self-Correction", () => {
  it("debe penalizar severamente un pitch con AI-tells y exceso de palabras", async () => {
    const aiText = "Hola sala Apolo. Espero que este correo te encuentre bien. Quería aprovechar la oportunidad para profundizar en el tapiz musical de nuestra propuesta — fresca, vibrante y electrizante. " +
      "Nuestra música permite apalancar sinergias para cautivar a las masas en un viaje inolvidable lleno de melodías que resuenan en el alma. " +
      Array(80).fill("música").join(" ");

    const evalResult = await evaluateAndRefinePitch({
      pitchText: aiText,
      leadName: "Sala Apolo",
      leadCategory: "sala",
      bandName: "Los Astros",
      skipRefinement: true
    });

    expect(evalResult.passed).toBe(false);
    expect(evalResult.score).toBeLessThan(75);
    expect(evalResult.critique.length).toBeGreaterThan(0);
  });

  it("debe detectar y penalizar si se filtra el caché mínimo confidencial", async () => {
    const leakedCacheText = "Hola equipo de Café Berlín. Nos gustaría presentar nuestro directo allí. Nuestro caché mínimo son 750 euros para este concierto.";

    const evalResult = await evaluateAndRefinePitch({
      pitchText: leakedCacheText,
      leadName: "Café Berlín",
      leadCategory: "sala",
      bandName: "Los Astros",
      minCacheThreshold: 750,
      skipRefinement: true
    });

    expect(evalResult.score).toBeLessThan(70);
    expect(evalResult.critique.some(c => c.includes("confidencial") || c.includes("tarifa"))).toBe(true);
  });

  it("Auditoría de Burstiness: debe detectar ritmo orgánico y asimétrico en la longitud de oraciones", () => {
    const naturalPitch = "Hola, Marcos. Gestiono el booking de Ruidos Silenciosos en Barcelona. Vemos que vuestra línea en Sala Sol encaja con bandas como Viva Suecia. Planteamos fecha para el 14/11 con co-booking de Los Nativos. Tenéis el directo en un clic: epk.ruidossilenciosos.com. ¿Cómo lo veis?";
    const burstResult = calculateSentenceBurstiness(naturalPitch);
    expect(burstResult.score).toBeGreaterThanOrEqual(2.5);
    expect(burstResult.isOrganic).toBe(true);
  });

  it("Auditoría Anti-IA: debe rechazar textos con em-dashes y palabras cliché de IA", () => {
    const roboticText = "Aprovechamos la oportunidad para profundizar en el tapiz musical — una experiencia crucial y revolucionaria.";
    const audit = auditPitchQuality(roboticText, "sala");
    expect(audit.antiAiScore).toBeLessThan(70);
    expect(audit.bannedWordsFound.length).toBeGreaterThan(0);
    expect(audit.emDashesFound).toBeGreaterThan(0);
  });
});

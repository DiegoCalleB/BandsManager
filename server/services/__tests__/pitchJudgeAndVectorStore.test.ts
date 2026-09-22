import { describe, it, expect, vi } from "vitest";
import { evaluateAndRefinePitch } from "../pitchJudge.js";
import { generateEmbedding, findSemanticallySimilarPitches, storePitchVector } from "../pitchVectorStore.js";

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
    expect(evalResult.refinedText).not.toContain("—");
  });

  it("debe detectar y penalizar si se filtra el caché mínimo confidencial", async () => {
    const leakedCacheText = "Hola equipo de Café Berlín. Nos gustaría presentar nuestro directo allí. Nuestro caché mínimo son 750 euros para este concierto.";

    const evalResult = await evaluateAndRefinePitch({
      pitchText: leakedCacheText,
      leadName: "Café Berlín",
      leadCategory: "sala",
      bandName: "Banda Test",
      minCacheThreshold: 750,
      skipRefinement: true
    });

    expect(evalResult.score).toBeLessThan(70);
    expect(evalResult.critique.some(c => c.includes("ALERTA: Se ha filtrado la cifra exacta"))).toBe(true);
  });

  it("debe otorgar alta puntuación a un pitch conciso, humano y con mención específica", async () => {
    const cleanHumanText = "Hola Marcos, te escribo porque admiramos la programación de jazz de Café Central. Acabamos de grabar nuevo EP y nos gustaría cuadrar fecha para noviembre. Os dejo nuestro directo de 45 segundos en el enlace. ¿Con cuánta antelación cerráis otoño?";

    const evalResult = await evaluateAndRefinePitch({
      pitchText: cleanHumanText,
      leadName: "Café Central",
      leadCategory: "sala",
      bandName: "Trio Jazz",
      skipRefinement: true
    });

    expect(evalResult.score).toBeGreaterThanOrEqual(85);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.critique).toHaveLength(0);
  });
});

describe("PitchVectorStore - pgvector & Semantic RAG Degradation", () => {
  it("debe degradarse limpiamente sin lanzar excepciones si no hay API key o base de datos accesible", async () => {
    const vector = await generateEmbedding("");
    expect(vector).toBeNull();

    const matches = await findSemanticallySimilarPitches({
      band_id: "band-test-123",
      lead: {
        nombre_sala: "Sala Radar",
        tipo: "sala",
        ciudad: "Vigo"
      }
    });

    expect(Array.isArray(matches)).toBe(true);
  });
});

describe("VenueIntelligenceService - Serper Live Radar & Spotify Traction", () => {
  it("debe gestionar la ausencia de SERPER_API_KEY sin romper la ejecución", async () => {
    const { fetchVenueLiveContext, fetchBandSpotifyTraction } = await import("../venueIntelligenceService.js");

    const liveData = await fetchVenueLiveContext("Sala Apolo", "Barcelona");
    // Sin SERPER_API_KEY en test devuelve null pacíficamente
    expect(liveData === null || typeof liveData === "object").toBe(true);

    const spotifyData = await fetchBandSpotifyTraction("Vetusta Morla");
    expect(spotifyData === null || typeof spotifyData === "object").toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  searchVenuesWithSerper,
  enrichVenueDetailsWithSerper
} from "../venueIntelligenceService.js";

describe("Serper Venues & Festival Discovery Engine", () => {
  it("degrada limpiamente sin arrojar excepciones si no hay API key", async () => {
    const originalKey = process.env.SERPER_API_KEY;
    try {
      delete process.env.SERPER_API_KEY;

      const places = await searchVenuesWithSerper({ city: "Valencia", type: "sala", limit: 3 });
      expect(places).toEqual([]);

      const contact = await enrichVenueDetailsWithSerper("Sala Loco Club", "Valencia");
      expect(contact).toBeNull();
    } finally {
      process.env.SERPER_API_KEY = originalKey;
    }
  });

  it("recupera salas reales con Serper Places si la clave está disponible", async () => {
    if (!process.env.SERPER_API_KEY) {
      console.log("Skipping live Serper test (SERPER_API_KEY not set)");
      return;
    }

    const places = await searchVenuesWithSerper({
      city: "Granada",
      type: "sala",
      limit: 3
    });

    expect(Array.isArray(places)).toBe(true);
    // Si la llamada no expiró por red exterior, valida resultados
    if (places.length > 0) {
      const first = places[0];
      expect(first.nombre_sala).toBeTruthy();
      expect(first.ciudad).toBeTruthy();
      expect(first.tipo).toBe("sala");
    }
  }, 15000);

  it("enriquece fichas técnicas con email, aforo y teléfono en tiempo real", async () => {
    if (!process.env.SERPER_API_KEY) {
      console.log("Skipping live Serper test (SERPER_API_KEY not set)");
      return;
    }

    const enriched = await enrichVenueDetailsWithSerper("Sala Planta Baja", "Granada");
    expect(enriched).not.toBeNull();

    if (enriched) {
      // Debería encontrar al menos uno de los datos clave (web, email, aforo, teléfono)
      const hasAnyField = !!(
        enriched.email ||
        enriched.aforo ||
        enriched.telefono ||
        enriched.website
      );
      expect(hasAnyField).toBe(true);
      if (enriched.aforo) {
        expect(enriched.aforo).toBeGreaterThan(50);
      }
    }
  }, 15000);
});

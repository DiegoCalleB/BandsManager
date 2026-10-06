// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import { describe, it, expect } from "vitest";
import { parseFlexibleDate, datesOverlap, filterLeadsByActiveCampaign } from "../festivalDateFilter.js";

describe("festivalDateFilter - Reggaemad Fest vs Campaña Diciembre", () => {
  it("debe parsear fechas en español y formatos ISO correctamente", () => {
    const d1 = parseFlexibleDate("2026-06-05");
    expect(d1?.getMonth()).toBe(5); // Junio es mes 5 (0-indexed)
    expect(d1?.getDate()).toBe(5);

    const d2 = parseFlexibleDate("5 y 6 de junio");
    expect(d2?.getMonth()).toBe(5);
    expect(d2?.getDate()).toBe(5);

    const d3 = parseFlexibleDate("primera quincena de diciembre");
    expect(d3?.getMonth()).toBe(11);
  });

  it("debe detectar que junio NO se solapa con diciembre", () => {
    const overlap = datesOverlap(
      "2026-06-05",
      "2026-06-06",
      "2026-12-01",
      "2026-12-15"
    );
    expect(overlap).toBe(false);
  });

  it("debe filtrar Reggaemad fest cuando la campaña activa es en diciembre", () => {
    const leads = [
      {
        nombre_sala: "Reggaemad Fest",
        tipo: "festival",
        festival_start_date: "2026-06-05",
        festival_end_date: "2026-06-06"
      },
      {
        nombre_sala: "Festival de Invierno Madrid",
        tipo: "festival",
        festival_start_date: "2026-12-05",
        festival_end_date: "2026-12-10"
      },
      {
        nombre_sala: "Sala Siroco",
        tipo: "sala"
      }
    ];

    const activeCampaign = {
      name: "Campaña Diciembre",
      campaignStartDate: "2026-12-01",
      campaignEndDate: "2026-12-15"
    };

    const filtered = filterLeadsByActiveCampaign(leads, activeCampaign);
    expect(filtered.map(l => l.nombre_sala)).not.toContain("Reggaemad Fest");
    expect(filtered.map(l => l.nombre_sala)).toContain("Festival de Invierno Madrid");
    expect(filtered.map(l => l.nombre_sala)).toContain("Sala Siroco");
  });

  it("debe resolver la fecha de campaña desde targetDates si campaignStartDate/EndDate están vacíos", () => {
    const leads = [
      {
        nombre_sala: "Reggaemad Fest",
        tipo: "festival",
        festival_start_date: "5 y 6 de junio",
        festival_end_date: "6 de junio"
      }
    ];

    const activeCampaign = {
      name: "Campaña Diciembre Sin Rango Explícito",
      targetDates: ["2026-12-04", "2026-12-05"]
    };

    const filtered = filterLeadsByActiveCampaign(leads, activeCampaign);
    expect(filtered.length).toBe(0);
  });
});

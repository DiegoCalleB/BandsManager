import { describe, it, expect } from "vitest";
import { sanearYAuditarHighlights } from "../auditarHighlights.js";
import type { NormalizedHighlight } from "../reelsCore.js";

const base: NormalizedHighlight = {
  id: "hl-1", title: "El solo", range: "0:15-0:30", startSec: 15, endSec: 30, duration: 15, confidence: 90, energyLevel: "Alta",
  hookText: "¿Qué pasó en el segundo 12?", recommendedCopy: "Nadie esperaba este giro en el solo. Os lo contamos.",
  copyTikTok: "El giro del solo", copyYouTube: "El giro del solo en directo", copyFacebook: "El giro del solo",
  hashtags: ["#rock", "#directo", "#madrid"], cta: "", reason: ""
};

describe("sanearYAuditarHighlights", () => {
  it("anota la auditoría y conserva el resto del highlight", () => {
    const [h] = sanearYAuditarHighlights([base]);
    expect(h.id).toBe("hl-1");
    expect(h.startSec).toBe(15);
    expect(h.auditoriaCopy.apto).toBe(true);
  });

  it("mueve los hashtags del texto a la lista", () => {
    const [h] = sanearYAuditarHighlights([{ ...base, recommendedCopy: "El solo que nadie esperaba #rock #nuevo" }]);
    expect(h.recommendedCopy).not.toMatch(/#/);
    expect(h.hashtags).toContain("#nuevo");
  });

  it("marca como no apto el cebo de interacción", () => {
    const [h] = sanearYAuditarHighlights([{ ...base, recommendedCopy: "Comenta SÍ si te gusta y dale like" }]);
    expect(h.auditoriaCopy.apto).toBe(false);
    expect(h.auditoriaCopy.problemas.map((p) => p.codigo)).toContain("cebo_engagement");
  });

  it("lista vacía → lista vacía", () => {
    expect(sanearYAuditarHighlights([])).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { auditarCopyReel } from "../auditoriaCopyReel.js";
import { BUENOS, MALOS } from "./fixtures/copyReelDorado.js";

describe("auditor de copy · set dorado", () => {
  it.each(MALOS)("rechaza: $nombre", ({ copy }) => {
    expect(auditarCopyReel(copy).apto).toBe(false);
  });

  it.each(BUENOS)("acepta: $nombre", ({ copy }) => {
    const r = auditarCopyReel(copy);
    expect(r.problemas.filter((p) => p.gravedad === "error")).toEqual([]);
  });

  it("separa limpio: todo bueno puntúa por encima de todo malo", () => {
    const peorBueno = Math.min(...BUENOS.map((b) => auditarCopyReel(b.copy).puntuacion));
    const mejorMalo = Math.max(...MALOS.map((m) => auditarCopyReel(m.copy).puntuacion));
    expect(peorBueno).toBeGreaterThan(mejorMalo);
  });
});

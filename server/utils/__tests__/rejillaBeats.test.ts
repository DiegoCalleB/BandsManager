import { describe, expect, it } from "vitest";
import { ajustarAlBeat, expresionFlash, rejillaDeBeats } from "../rejillaBeats.js";

/** Onsets de un 120 BPM (0,5 s) que arranca en 0,23 s, con un golpe de relleno fuera de rejilla. */
const onsets = [...Array.from({ length: 40 }, (_, i) => 0.23 + i * 0.5), 3.37];

describe("rejillaDeBeats", () => {
  it("encuentra la fase del pulso y devuelve pulsos y compases dentro del tramo, relativos a su inicio", () => {
    const r = rejillaDeBeats(onsets, 120, 2, 10);
    // Primer pulso tras 2 s: 2,23 → 0,23 relativo al tramo.
    expect(r.pulsos[0]).toBeCloseTo(0.23, 1);
    expect(r.pulsos[1] - r.pulsos[0]).toBeCloseTo(0.5, 5);
    expect(r.pulsos.every((t) => t >= 0 && t <= 8)).toBe(true);
    expect(r.compases.length).toBe(Math.ceil(r.pulsos.length / 4));
    expect(r.compases[1] - r.compases[0]).toBeCloseTo(2, 5);
  });

  it("sin BPM o sin onsets no inventa rejilla", () => {
    expect(rejillaDeBeats(onsets, null, 0, 10)).toEqual({ pulsos: [], compases: [] });
    expect(rejillaDeBeats([], 120, 0, 10)).toEqual({ pulsos: [], compases: [] });
  });
});

describe("ajustarAlBeat", () => {
  const pulsos = [0.23, 0.73, 1.23, 1.73];
  it("lleva el tiempo al pulso más cercano si está dentro de la tolerancia", () => {
    expect(ajustarAlBeat(1.3, pulsos)).toBeCloseTo(1.23, 5);
    expect(ajustarAlBeat(1.0, pulsos, 0.1)).toBe(1.0); // a 0,23 de cualquier pulso: no se toca
    expect(ajustarAlBeat(1.0, [])).toBe(1.0);
  });
});

describe("expresionFlash", () => {
  it("se evalúa por fotograma (sin eval=frame ffmpeg aclara TODO el vídeo) y solo en los golpes", () => {
    const f = expresionFlash([0.5, 2.5]);
    expect(f).toContain(":eval=frame");
    expect(f).toContain("between(t,0.500,0.620)");
    expect(f).toContain("between(t,2.500,2.620)");
  });
  it("sin golpes no hay flash; con muchos, se acota para no generar una expresión gigante", () => {
    expect(expresionFlash([])).toBe("");
    const brillo = expresionFlash(Array.from({ length: 200 }, (_, i) => i)).split(":contrast")[0];
    expect((brillo.match(/between/g) || []).length).toBe(40);
  });
});

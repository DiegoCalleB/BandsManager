import { describe, it, expect } from "vitest";
import { evaluarLector, CASOS_LECTOR } from "../lectorGolden.js";

describe("banco de evaluación del Lector", () => {
  const r = evaluarLector();

  it("no aparecen fallos nuevos (cada fallo conocido lleva su motivo)", () => {
    const nuevos = r.fallos.filter((f) => !f.conocido);
    expect(nuevos, JSON.stringify(nuevos)).toEqual([]);
  });

  it("los fallos conocidos siguen fallando: si uno se arregla, hay que quitarle la marca", () => {
    const arreglados = CASOS_LECTOR.filter((c) => c.conocido && !r.fallos.some((f) => f.id === c.id)).map((c) => c.id);
    expect(arreglados).toEqual([]);
  });

  it("exactitud global y rechazos nunca por debajo del suelo actual", () => {
    expect(r.exactitud).toBeGreaterThanOrEqual(0.94);
    expect(r.porClase.rejection.aciertos).toBe(r.porClase.rejection.total);
  });

  it("los ids son únicos", () => {
    expect(new Set(CASOS_LECTOR.map((c) => c.id)).size).toBe(CASOS_LECTOR.length);
  });
});

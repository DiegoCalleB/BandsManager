import { describe, it, expect } from "vitest";
import { evaluarRedactor, CASOS_REDACTOR } from "../redactorGolden.js";

describe("banco de evaluación del Redactor", () => {
  const r = evaluarRedactor();

  it("no aparecen fallos nuevos (cada fallo conocido lleva su motivo)", () => {
    const nuevos = r.fallos.filter((f) => !f.conocido);
    expect(nuevos, JSON.stringify(nuevos)).toEqual([]);
  });

  it("los fallos conocidos siguen fallando: si uno se arregla, hay que quitarle la marca", () => {
    const arreglados = CASOS_REDACTOR.filter((c) => c.conocido && !r.fallos.some((f) => f.id === c.id)).map((c) => c.id);
    expect(arreglados).toEqual([]);
  });

  it("detecta todos los datos inventados y todos los pitches largos", () => {
    expect(r.porMotivo.inventa_datos.detectados).toBe(r.porMotivo.inventa_datos.total);
    expect(r.porMotivo.largo.detectados).toBe(r.porMotivo.largo.total);
  });

  it("los ids son únicos", () => {
    expect(new Set(CASOS_REDACTOR.map((c) => c.id)).size).toBe(CASOS_REDACTOR.length);
  });
});

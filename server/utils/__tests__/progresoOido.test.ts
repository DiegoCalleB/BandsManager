import { describe, it, expect } from "vitest";
import { iniciarProgreso, avanzarProgreso, terminarProgreso, leerProgreso, olvidarProgreso } from "../progresoOido";

describe("progresoOido", () => {
  it("avanza por etapas y termina al 100 %", () => {
    iniciarProgreso("b:1", "acordes");
    expect(leerProgreso("b:1")!.pct).toBe(0);
    avanzarProgreso("b:1", "pulso", "Midiendo el tempo…");
    const p = leerProgreso("b:1")!;
    expect(p.actual).toBe("pulso");
    expect(p.pct).toBe(50);
    terminarProgreso("b:1");
    expect(leerProgreso("b:1")).toMatchObject({ estado: "listo", pct: 100, actual: null });
    olvidarProgreso("b:1");
    expect(leerProgreso("b:1")).toBeNull();
  });
  it("la letra tiene más etapas que los acordes y un error se conserva", () => {
    iniciarProgreso("b:2", "letra");
    expect(leerProgreso("b:2")!.etapas.length).toBeGreaterThan(4);
    avanzarProgreso("b:2", "inexistente", "x");
    expect(leerProgreso("b:2")!.actual).toBe("voz");
    terminarProgreso("b:2", "No se oye letra");
    expect(leerProgreso("b:2")).toMatchObject({ estado: "error", error: "No se oye letra" });
  });
});

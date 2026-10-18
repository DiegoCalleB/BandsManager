import { describe, it, expect } from "vitest";
import { razonDelTramo } from "../razonDelTramo";
import type { ViralWindow } from "../reelsApiTypes";

const v = (p: Partial<ViralWindow>): ViralWindow => ({ start: 0, end: 30, energia: 50, arranque: 50, dinamismo: 50, score: 50, motivo: "m", ...p });

describe("razonDelTramo", () => {
  it("sin ventanas medidas no inventa una razón", () => {
    expect(razonDelTramo({ start: 10, end: 40 }, [])).toBeNull();
  });

  it("elige la ventana que más se solapa con el corte, no la que empieza antes", () => {
    const ventanas = [v({ start: 0, end: 20, motivo: "a" }), v({ start: 38, end: 70, motivo: "b" })];
    expect(razonDelTramo({ start: 40, end: 70 }, ventanas)?.motivo).toBe("b");
  });

  it("un corte sin solape con ninguna ventana no tiene razón", () => {
    expect(razonDelTramo({ start: 100, end: 130 }, [v({ start: 0, end: 30 })])).toBeNull();
  });

  it("ordena las señales de mayor a menor y marca la principal", () => {
    const r = razonDelTramo({ start: 0, end: 30 }, [v({ energia: 40, arranque: 90, dinamismo: 60 })])!;
    expect(r.senales.map((s) => s.clave)).toEqual(["arranque", "montaje", "volumen"]);
    expect(r.principal.clave).toBe("arranque");
  });

  it("la señal del público solo sale si hay datos reales", () => {
    expect(razonDelTramo({ start: 0, end: 30 }, [v({})])!.senales.some((s) => s.clave === "publico")).toBe(false);
    const conPublico = razonDelTramo({ start: 0, end: 30 }, [v({ publico: 95 })])!;
    expect(conPublico.principal.clave).toBe("publico");
  });

  it("devuelve la puntuación combinada de la ventana", () => {
    expect(razonDelTramo({ start: 0, end: 30 }, [v({ score: 77 })])!.puntuacion).toBe(77);
  });
});

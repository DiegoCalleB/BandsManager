import { describe, expect, it } from "vitest";
import type { SegmentoAcordeAnalizado } from "../../types";
import { ponerAcordeEnRango } from "../lineaTiempoAcordes";

const seg = (t0: number, t1: number, acorde: string): SegmentoAcordeAnalizado => ({ t0, t1, acorde, confianza: 0.6 });

describe("ponerAcordeEnRango", () => {
  it("mete un Do en medio de un compás de La menor sin tocar el resto", () => {
    const r = ponerAcordeEnRango([seg(0, 8, "Am")], 2, 4, "C")!;
    expect(r.map((s) => [s.t0, s.t1, s.acorde])).toEqual([[0, 2, "Am"], [2, 4, "C"], [4, 8, "Am"]]);
    expect(r[1]).toMatchObject({ editado: true, detectado: "Am", confianza: 1 });
  });
  it("entiende la notación española y la normaliza", () => {
    expect(ponerAcordeEnRango([seg(0, 4, "N")], 0, 4, "Do")![0].acorde).toBe("C");
    expect(ponerAcordeEnRango([seg(0, 4, "N")], 0, 4, "Sib")![0].acorde).toBe("A#");
  });
  it("cubre varios tramos y recorta los de los extremos", () => {
    const r = ponerAcordeEnRango([seg(0, 3, "Am"), seg(3, 5, "G"), seg(5, 9, "F")], 2, 6, "C")!;
    expect(r.map((s) => [s.t0, s.t1, s.acorde])).toEqual([[0, 2, "Am"], [2, 6, "C"], [6, 9, "F"]]);
  });
  it("absorbe las astillas menores que el tramo mínimo", () => {
    const r = ponerAcordeEnRango([seg(0, 4.1, "Am")], 0.1, 4, "C")!;
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ t0: 0, t1: 4.1, acorde: "C" });
  });
  it("rechaza lo que no es un acorde y lo que no cambia nada", () => {
    expect(ponerAcordeEnRango([seg(0, 4, "Am")], 0, 4, "hola")).toBeNull();
    expect(ponerAcordeEnRango([seg(0, 4, "Am")], 0, 4, "Lam")).toBeNull();
    expect(ponerAcordeEnRango([seg(0, 4, "Am")], 10, 12, "C")).toBeNull();
  });
  it("«N» quita el acorde", () => {
    expect(ponerAcordeEnRango([seg(0, 4, "Am")], 0, 4, "N")![0].acorde).toBe("N");
  });
});

import { describe, expect, it } from "vitest";
import type { SegmentoAcordeAnalizado } from "../../types";
import type { Cuadricula } from "../cuadriculaCompases";
import { compasesHermanos, ponerAcordeEnHermanos } from "../acordeEnHermanos";

const seg = (t0: number, t1: number, acorde: string, editado?: boolean): SegmentoAcordeAnalizado => ({ t0, t1, acorde, confianza: 0.6, ...(editado ? { editado } : {}) });
// 4 compases de 4 s (4 tiempos de 1 s): 1-2 bloque A, 3-4 bloque A también, 5 bloque B.
const compas = (n: number, bloque: number, acordes: string[]) => ({ n, t0: (n - 1) * 4, t1: n * 4, bloque, acordes });
const cuadricula = {
  compases: [compas(1, 0, ["Am", "Am", "Am", "Am"]), compas(2, 0, ["Am", "Am", "Am", "Am"]), compas(3, 1, ["Am", "Am", "Am", "Am"]), compas(4, 2, ["G", "G", "G", "G"])],
  bloques: [{ indice: 0, letra: "A" }, { indice: 1, letra: "A" }, { indice: 2, letra: "B" }],
} as unknown as Cuadricula;
const puesto = { compas: 1, tiempo: 2, antes: ["Am", "Am"], acorde: "C" };

describe("compasesHermanos", () => {
  it("encuentra los compases iguales de los bloques de la misma letra", () => {
    const r = compasesHermanos(cuadricula, [seg(0, 12, "Am"), seg(12, 16, "G")], puesto);
    expect(r).toEqual([{ t0: 6, t1: 8 }, { t0: 10, t1: 12 }]);
  });
  it("salta los que ya se corrigieron a mano y los de otra progresión", () => {
    const r = compasesHermanos(cuadricula, [seg(0, 4, "Am"), seg(4, 8, "Am", true), seg(8, 12, "Am"), seg(12, 16, "G")], puesto);
    expect(r).toEqual([{ t0: 10, t1: 12 }]);
  });
});

describe("ponerAcordeEnHermanos", () => {
  it("pone el acorde en todos y cuenta cuántos cambiaron", () => {
    const { segmentos, cambiados } = ponerAcordeEnHermanos([seg(0, 12, "Am")], [{ t0: 6, t1: 8 }, { t0: 10, t1: 12 }], "C");
    expect(cambiados).toBe(2);
    expect(segmentos.filter((s) => s.acorde === "C").map((s) => [s.t0, s.t1])).toEqual([[6, 8], [10, 12]]);
  });
});

import { describe, it, expect } from "vitest";
import { ajustarCortes, mejorFinal } from "../ajusteDeCortes";

// 120 s sonando a -10 dB con un respiro (-45 dB) entre 48 y 49 s.
const curva = Array.from({ length: 1200 }, (_, i) => ({ t: i / 10, db: i / 10 >= 48 && i / 10 < 49 ? -45 : -10 }));
const o = { videoDuration: 120, objetivo: 30 };
const corte = (s: number, e: number) => ({ startSec: s, endSec: e, duration: e - s, range: "", reason: "" });

describe("ajusteDeCortes", () => {
  it("mueve el final al respiro cercano", () => {
    const e = mejorFinal(20, 46, curva, [], o);
    expect(e).toBeGreaterThanOrEqual(47.5);
    expect(e).toBeLessThanOrEqual(49.5);
  });

  it("no mueve el final si no hay respiro al alcance", () => {
    expect(mejorFinal(20, 40, curva, [], o)).toBe(40);
  });

  it("respeta la duración máxima flexible (1,4x el objetivo)", () => {
    const e = mejorFinal(10, 40, curva, [], { ...o, objetivo: 30 });
    expect(e - 10).toBeLessThanOrEqual(42);
  });

  it("ajustarCortes actualiza duración, rango y motivo", () => {
    const [r] = ajustarCortes([corte(20, 46)], curva, [], o);
    expect(r.endSec).not.toBe(46);
    expect(r.duration).toBeCloseTo(r.endSec - r.startSec, 1);
    expect(r.reason).toContain("Ajustado");
  });

  it("sin curva de audio devuelve los cortes tal cual", () => {
    const c = [corte(1, 20)];
    expect(ajustarCortes(c, [], [], o)).toBe(c);
  });
});

import { describe, it, expect } from "vitest";
import { evaluarCaso, resumirBanco, formatearBanco, mejorTramoPosible, type CasoBanco } from "./bancoDeteccion.js";

// 120 s de audio plano a -30 dB con un subidón a -10 dB entre 60 y 90 s.
const curva = Array.from({ length: 1200 }, (_, i) => ({ t: i / 10, db: i / 10 >= 60 && i / 10 < 90 ? -10 : -30 }));
const interesEn = (a: number, b: number) => Array.from({ length: 120 }, (_, s) => (s >= a && s < b ? 100 : 5));

const caso = (nombre: string, interes: number[]): CasoBanco => ({ nombre, tipo: "concierto", curva, cambiosDePlano: [], interes });

describe("banco de detección", () => {
  it("mejorTramoPosible encuentra el pico del público", () => {
    expect(mejorTramoPosible(interesEn(60, 90), 30)).toBe(100);
  });

  it("captura todo cuando el público coincide con el subidón", () => {
    const r = evaluarCaso(caso("a", interesEn(60, 90)));
    expect(r.viral.captura).toBeCloseTo(1, 1);
    expect(r.viral.acierta3).toBe(true);
  });

  it("puntúa peor cuando el público ve otra parte que cuando coincide", () => {
    // 600 s con el subidón en 300-330 s: el top 3 no puede cubrir el resto.
    const larga = Array.from({ length: 6000 }, (_, i) => ({ t: i / 10, db: i / 10 >= 300 && i / 10 < 330 ? -10 : -30 }));
    const base = { tipo: "concierto" as const, curva: larga, cambiosDePlano: [] };
    const coincide = evaluarCaso({ ...base, nombre: "c", interes: Array.from({ length: 600 }, (_, s) => (s >= 300 && s < 330 ? 100 : 5)) });
    const otra = evaluarCaso({ ...base, nombre: "o", interes: Array.from({ length: 600 }, (_, s) => (s >= 30 && s < 60 ? 100 : 5)) });
    expect(coincide.viral.captura).toBeGreaterThan(otra.viral.captura);
  });

  it("resume y formatea; sin casos explica cómo generarlos", () => {
    const r = [evaluarCaso(caso("a", interesEn(60, 90)))];
    expect(resumirBanco(r).casos).toBe(1);
    expect(formatearBanco(r)).toContain("Detector:");
    expect(formatearBanco([])).toContain("--generar");
  });
});

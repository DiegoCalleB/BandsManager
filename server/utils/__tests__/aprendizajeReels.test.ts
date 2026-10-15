import { describe, expect, it } from "vitest";
import {
  FORMATOS,
  formatoDeClip,
  kpisDeReel,
  medicionesPendientes,
  recomendarFormato,
  resumirAprendizaje,
  type ReelMedido
} from "../aprendizajeReels.js";

describe("medicionesPendientes", () => {
  const publicado = "2026-10-10T20:00:00Z";
  it("toca cada medición cuando pasa su hora y solo una vez", () => {
    expect(medicionesPendientes(publicado, [], new Date("2026-10-10T20:30:00Z"))).toEqual([]);
    expect(medicionesPendientes(publicado, [], new Date("2026-10-10T21:05:00Z"))).toEqual([1]);
    expect(medicionesPendientes(publicado, [1], new Date("2026-10-11T21:00:00Z"))).toEqual([24]);
    // Si se acumulan (worker parado), solo la más reciente: repetir la lectura en las anteriores las falsearía.
    expect(medicionesPendientes(publicado, [1, 24], new Date("2026-10-20T00:00:00Z"))).toEqual([168]);
    expect(medicionesPendientes(publicado, [], new Date("2026-10-12T00:00:00Z"))).toEqual([24]);
    expect(medicionesPendientes(publicado, [1, 24, 72, 168], new Date("2026-11-20T00:00:00Z"))).toEqual([]);
  });
  it("una fecha de publicación inválida no genera mediciones", () => {
    expect(medicionesPendientes("no-es-fecha", [], new Date())).toEqual([]);
  });
});

describe("kpisDeReel", () => {
  it("rewatch = tiempo medio visto / duración (2 = de media se ve dos veces)", () => {
    const k = kpisDeReel({ duracionSeg: 10, avgWatchMs: 20_000, reach: 1000, shares: 30, saves: 10, views: 2500 });
    expect(k.rewatch).toBeCloseTo(2, 5);
    expect(k.tasaCompartir).toBeCloseTo(0.03, 5);
    expect(k.tasaGuardar).toBeCloseTo(0.01, 5);
  });
  it("sin duración o sin alcance, el KPI es null (no 0, que mentiría)", () => {
    const k = kpisDeReel({ duracionSeg: 0, avgWatchMs: 20_000, reach: 0, shares: 3, saves: 1, views: 0 });
    expect(k).toEqual({ rewatch: null, tasaCompartir: null, tasaGuardar: null });
  });
});

describe("formatoDeClip", () => {
  it("clasifica por duración y loop", () => {
    expect(formatoDeClip(12, true)).toBe("loop_corto");
    expect(formatoDeClip(12, false)).toBe("corto");
    expect(formatoDeClip(25, true)).toBe("medio");
    expect(formatoDeClip(45, false)).toBe("largo");
  });
});

const reel = (formato: (typeof FORMATOS)[number], rewatch: number): ReelMedido => ({ formato, rewatch, tasaCompartir: 0.01, tasaGuardar: 0.01 });

describe("recomendarFormato", () => {
  it("con menos de 3 reels medidos explora: no presume de saber nada", () => {
    const r = recomendarFormato([reel("corto", 2)], () => 0.5);
    expect(r.modo).toBe("explorando");
    expect(r.muestras).toBe(1);
  });

  it("con datos, aprovecha el formato que de verdad se vuelve a ver", () => {
    const historial = [
      ...Array.from({ length: 6 }, () => reel("loop_corto", 1.6)),
      ...Array.from({ length: 6 }, () => reel("largo", 0.4))
    ];
    // rng determinista a mitad de cada distribución: gana la de más éxitos.
    const r = recomendarFormato(historial, () => 0.5);
    expect(r.modo).toBe("aprovechando");
    expect(r.formato).toBe("loop_corto");
    expect(r.explicacion).toMatch(/6 de 6/);
  });

  it("es reproducible con el mismo generador aleatorio", () => {
    const h = [reel("corto", 1.2), reel("medio", 0.8), reel("loop_corto", 1.1), reel("largo", 0.3)];
    let semilla = 1;
    const rng = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    const a = recomendarFormato(h, rng).formato;
    semilla = 1;
    expect(recomendarFormato(h, rng).formato).toBe(a);
  });
});

describe("resumirAprendizaje", () => {
  it("medianas y mejor reel; sin datos, nulls", () => {
    const r = resumirAprendizaje([reel("corto", 1), reel("medio", 3), reel("largo", 2)]);
    expect(r.reelsMedidos).toBe(3);
    expect(r.rewatchMediano).toBe(2);
    expect(resumirAprendizaje([]).rewatchMediano).toBeNull();
  });
});

describe("cuantilBeta (valores conocidos)", () => {
  it("Beta(1,1) es uniforme; Beta(2,1) tiene CDF x²; Beta(1,2) tiene CDF 1-(1-x)²", async () => {
    const { cuantilBeta } = await import("../aprendizajeReels.js");
    expect(cuantilBeta(0.3, 1, 1)).toBeCloseTo(0.3, 6);
    expect(cuantilBeta(0.25, 2, 1)).toBeCloseTo(0.5, 6);
    expect(cuantilBeta(0.75, 1, 2)).toBeCloseTo(0.5, 6);
  });
});

describe("bloqueAprendizajeParaPrompt", () => {
  it("mientras explora no mete nada en el prompt; con datos, cita lo medido y el formato", async () => {
    const { bloqueAprendizajeParaPrompt } = await import("../aprendizajeReels.js");
    const resumen = { reelsMedidos: 6, rewatchMediano: 1.4, tasaCompartirMediana: 0.02, tasaGuardarMediana: 0.01 };
    expect(bloqueAprendizajeParaPrompt(resumen, { formato: "corto", modo: "explorando", muestras: 1, explicacion: "" })).toBe("");
    const bloque = bloqueAprendizajeParaPrompt(resumen, { formato: "loop_corto", modo: "aprovechando", muestras: 6, explicacion: "5 de 6 se vieron enteros" });
    expect(bloque).toContain("6 reels medidos");
    expect(bloque).toContain("1.40");
    expect(bloque).toContain("loop corto");
  });
});

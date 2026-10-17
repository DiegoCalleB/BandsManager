import { describe, it, expect } from "vitest";
import { resumenSemanal, type ReelSemana } from "../resumenSemanalReels";
import type { Recomendacion } from "../aprendizajeReels";

const AHORA = new Date("2026-10-17T10:00:00Z");
const reel = (p: Partial<ReelSemana> = {}): ReelSemana => ({
  postId: "p", texto: "Directo en Sala X", medidoEn: "2026-10-15T10:00:00Z", formato: "loop_corto", rewatch: 1.2, tasaCompartir: 0.02, tasaGuardar: 0.01, ...p
});
const rec: Recomendacion = { formato: "loop_corto", modo: "aprovechando", muestras: 5, explicacion: "En formato loop corto, 4 de 5 reels se vieron enteros de media o más." };

describe("resumenSemanal", () => {
  it("sin Reels medidos esta semana lo dice y no inventa nada", () => {
    const r = resumenSemanal([reel({ medidoEn: "2026-09-01T10:00:00Z" })], rec, AHORA);
    expect(r.reelsMedidos).toBe(0);
    expect(r.mejores).toEqual([]);
    expect(r.patron).toBeNull();
  });

  it("los 3 mejores por rewatch, de mayor a menor", () => {
    const r = resumenSemanal([
      reel({ postId: "a", rewatch: 0.8 }), reel({ postId: "b", rewatch: 2.1 }), reel({ postId: "c", rewatch: 1.5 }), reel({ postId: "d", rewatch: 1.1 })
    ], rec, AHORA);
    expect(r.reelsMedidos).toBe(4);
    expect(r.mejores.map((m) => m.postId)).toEqual(["b", "c", "d"]);
  });

  it("un Reel sin rewatch no entra en el ranking pero tampoco cuenta como medido", () => {
    const r = resumenSemanal([reel({ postId: "a", rewatch: null }), reel({ postId: "b" })], rec, AHORA);
    expect(r.reelsMedidos).toBe(1);
    expect(r.mejores.map((m) => m.postId)).toEqual(["b"]);
  });

  it("solo habla de patrón con al menos 2 Reels y si coinciden en formato", () => {
    expect(resumenSemanal([reel({ postId: "a" })], rec, AHORA).patron).toBeNull();
    const igual = resumenSemanal([reel({ postId: "a" }), reel({ postId: "b", rewatch: 1.4 })], rec, AHORA);
    expect(igual.patron).toMatch(/loop corto/);
    const mezcla = resumenSemanal([reel({ postId: "a" }), reel({ postId: "b", formato: "largo", rewatch: 1.4 })], rec, AHORA);
    expect(mezcla.patron).toBeNull();
  });

  it("recorta el texto largo del Reel", () => {
    const r = resumenSemanal([reel({ texto: "x".repeat(300) })], rec, AHORA);
    expect(r.mejores[0].texto.length).toBeLessThanOrEqual(81);
  });

  it("el consejo sale de la recomendación: explorando no presume de saber", () => {
    expect(resumenSemanal([reel()], rec, AHORA).proximo).toMatch(/loop corto/);
    const explorando: Recomendacion = { ...rec, modo: "explorando", muestras: 1 };
    expect(resumenSemanal([reel()], explorando, AHORA).proximo).toMatch(/seguir midiendo|Sigue/i);
  });
});

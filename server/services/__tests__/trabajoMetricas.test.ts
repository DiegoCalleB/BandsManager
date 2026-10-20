import { describe, it, expect, vi } from "vitest";
import { estadoMetricas, iniciarMetricas } from "../trabajoMetricas";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("trabajoMetricas", () => {
  it("una cuenta sin trabajo está inactiva", () => {
    expect(estadoMetricas("cuenta-sin-trabajo").estado).toBe("inactivo");
  });

  it("corre en segundo plano, expone el avance y acaba en 'listo'", async () => {
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    const ok = iniciarMetricas("c1", 2, "2026-10-01", async (e) => {
      e.hechas = 1;
      await puerta;
      e.hechas = 2;
      e.filas = 4;
    });
    expect(ok).toBe(true);
    expect(estadoMetricas("c1")).toMatchObject({ estado: "en_curso", hechas: 1, total: 2 });
    soltar();
    await esperar(5);
    expect(estadoMetricas("c1")).toMatchObject({ estado: "listo", hechas: 2, filas: 4 });
  });

  it("no lanza un segundo trabajo mientras hay uno en curso para la misma cuenta", async () => {
    let soltar!: () => void;
    const puerta = new Promise<void>((r) => (soltar = r));
    expect(iniciarMetricas("c2", 1, "p", () => puerta)).toBe(true);
    const segundo = vi.fn(async () => {});
    expect(iniciarMetricas("c2", 1, "p", segundo)).toBe(false);
    expect(segundo).not.toHaveBeenCalled();
    soltar();
    await esperar(5);
  });

  it("si el trabajo falla queda en 'error' y la cuenta puede reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    iniciarMetricas("c3", 1, "p", async () => {
      throw new Error("boom");
    });
    await esperar(5);
    expect(estadoMetricas("c3")).toMatchObject({ estado: "error" });
    expect(iniciarMetricas("c3", 1, "p", async () => {})).toBe(true);
  });
});

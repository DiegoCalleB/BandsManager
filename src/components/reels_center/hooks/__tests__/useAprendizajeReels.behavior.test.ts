// @vitest-environment happy-dom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("../../../../utils/api", () => ({ apiFetch }));

import { duracionDeFormato, useAprendizajeReels } from "../useAprendizajeReels";

// Con llaves: si el callback DEVOLVIERA el mock (mockReset() lo devuelve), Vitest lo tomaría por
// teardown y llamaría a apiFetch() tras cada test, rechazando fuera de cualquier catch.
beforeEach(() => {
  apiFetch.mockReset();
});
afterEach(cleanup);

describe("useAprendizajeReels", () => {
  it("carga lo aprendido una vez", async () => {
    const recomendacion = { formato: "loop_corto", modo: "aprovechando", muestras: 5, explicacion: "4 de 5" };
    apiFetch.mockResolvedValue({ success: true, resumen: { reelsMedidos: 5, rewatchMediano: 1.3, tasaCompartirMediana: null, tasaGuardarMediana: null }, recomendacion });
    const { result } = renderHook(() => useAprendizajeReels());
    await waitFor(() => expect(result.current.aprendizaje?.recomendacion).toEqual(recomendacion));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith("/api/reels/aprendizaje");
  });

  it("si falla, no muestra nada y no rompe", async () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    apiFetch.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useAprendizajeReels());
    await waitFor(() => expect(aviso).toHaveBeenCalled());
    expect(result.current.aprendizaje).toBeNull();
    aviso.mockRestore();
  });
});

describe("duracionDeFormato", () => {
  it("lleva cada formato a una opción del selector", () => {
    expect([duracionDeFormato("loop_corto"), duracionDeFormato("corto"), duracionDeFormato("medio"), duracionDeFormato("largo")]).toEqual([15, 15, 30, 60]);
  });
});

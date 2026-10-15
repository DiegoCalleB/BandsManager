import { describe, it, expect, vi, beforeEach } from "vitest";

const apiFetch = vi.fn();
vi.mock("../api", () => ({ apiFetch: (...a: unknown[]) => apiFetch(...a) }));

import { analizarAcordesDelAudio, resumenAnalisisAcordes } from "../analisisAcordesCliente";

const analisis = (acordes: string[]) => ({ segmentos: acordes.map((acorde) => ({ acorde })) }) as any;

describe("analizarAcordesDelAudio", () => {
  beforeEach(() => apiFetch.mockReset());

  it("llama al endpoint de la canción y devuelve el análisis", async () => {
    apiFetch.mockResolvedValue({ analisis: analisis(["C"]) });
    const r = await analizarAcordesDelAudio("a/b");
    expect(apiFetch).toHaveBeenCalledWith("/api/songs/a%2Fb/analizar-acordes", { method: "POST", body: "{}" });
    expect(r.segmentos).toHaveLength(1);
  });
  it("envía sobrescribir solo cuando se pide", async () => {
    apiFetch.mockResolvedValue({ analisis: analisis(["C"]) });
    await analizarAcordesDelAudio("x", true);
    expect(apiFetch.mock.calls[0][1].body).toBe('{"sobrescribir":true}');
  });
  it("lanza con el motivo del servidor si no hay análisis", async () => {
    apiFetch.mockResolvedValue({ error: "audio ilegible" });
    await expect(analizarAcordesDelAudio("x")).rejects.toThrow("audio ilegible");
  });
});

describe("resumenAnalisisAcordes", () => {
  it("cuenta los tramos dudosos", () => {
    expect(resumenAnalisisAcordes(analisis(["C", "N", "G"]))).toContain("1 sin acorde claro");
    expect(resumenAnalisisAcordes(analisis(["C", "G"]))).toMatch(/^✓/);
  });
});

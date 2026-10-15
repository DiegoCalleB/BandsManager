import { beforeEach, describe, expect, it, vi } from "vitest";

const ia = vi.hoisted(() => ({ cliente: {} as object | null, respuesta: vi.fn() }));
vi.mock("../../ai.js", () => ({
  getAiClient: () => ia.cliente,
  GEMINI_MODEL: "gemini-test",
  generateContentWithFallback: ia.respuesta
}));

const { diagnosticarHook } = await import("../hookDoctor.js");
const { emptyBandProfile } = await import("../../utils/bandProfile.js");

const perfil = { ...emptyBandProfile(), name: "Los Peregrinos" };

beforeEach(() => {
  ia.cliente = {};
  ia.respuesta.mockReset();
});

describe("diagnosticarHook", () => {
  it("usa el fallback de modelos y registra el consumo en el ledger de la banda", async () => {
    ia.respuesta.mockResolvedValue({ text: JSON.stringify({ cringeScore: 12, estimatedRetention3s: 88, verdict: "Bien", improvedHook: "Nadie lo vio venir" }) });
    const r = await diagnosticarHook(perfil, "band-a", { hookText: "Nuevo tema", copyText: "copy" });
    expect(ia.respuesta).toHaveBeenCalledWith({}, expect.objectContaining({ bandId: "band-a", preferredModel: "gemini-test" }));
    expect(r.generatedByAI).toBe(true);
    expect(r.diagnosis).toMatchObject({ cringeScore: 12, estimatedRetention3s: 88, improvedHook: "Nadie lo vio venir" });
  });

  it("si el modelo no da una retención numérica, no se inventa una", async () => {
    ia.respuesta.mockResolvedValue({ text: JSON.stringify({ cringeScore: 30, verdict: "Ok" }) });
    const r = await diagnosticarHook(perfil, "band-a", {});
    expect(r.diagnosis.estimatedRetention3s).toBeNull();
  });

  it("sin IA: diagnóstico por reglas y retención null (no una cifra fingida)", async () => {
    ia.cliente = null;
    const r = await diagnosticarHook(perfil, "band-a", { hookText: "Escucha nuestro nuevo tema" });
    expect(r.generatedByAI).toBe(false);
    expect(r.diagnosis.estimatedRetention3s).toBeNull();
    expect(ia.respuesta).not.toHaveBeenCalled();
  });

  it("si el modelo falla, cae al diagnóstico por reglas en vez de romper", async () => {
    ia.respuesta.mockRejectedValue(new Error("cuota agotada"));
    const r = await diagnosticarHook(perfil, "band-a", { hookText: "Gancho" });
    expect(r.generatedByAI).toBe(false);
    expect(r.diagnosis.improvedHook).toBe("Gancho");
  });
});

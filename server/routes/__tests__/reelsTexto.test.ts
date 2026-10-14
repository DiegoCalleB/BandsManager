import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import { _vaciarRateLimitStore } from "../../middleware/rateLimiter";

/** Cableado de las rutas de texto de Reels: auth, banda de la sesión, validación y respuesta. */

vi.mock("../../state.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1", role: "leader", band_id: "band-sesion", allowedBandIds: ["band-sesion"] };
    next();
  },
  loadState: () => ({ users: [], bands: [] })
}));
vi.mock("../../db.js", () => ({
  dbGetRegisteredBandById: async () => ({ nombre_banda: "Los Peregrinos" }),
  dbGetEpkConfig: async () => null
}));

const perfeccionarCopy = vi.hoisted(() => vi.fn());
vi.mock("../../services/copyPerfecto.js", () => ({ perfeccionarCopy }));
vi.mock("../../services/hookDoctor.js", () => ({ diagnosticarHook: vi.fn() }));

const { default: router } = await import("../reelsTexto.js");

const app = express();
app.use(express.json());
app.use("/api", router);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;
afterAll(() => server.close());

const realFetch = globalThis.fetch;
async function post(ruta: string, cuerpo: unknown) {
  const res = await realFetch(`http://127.0.0.1:${puerto}${ruta}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  _vaciarRateLimitStore();
  perfeccionarCopy.mockReset().mockResolvedValue({ generatedByAI: true, ganador: { copy: {}, arquetipo: "curiosidad", auditoria: {} }, alternativas: [], motivo: "" });
});

describe("POST /api/reels/copy-perfecto", () => {
  it("usa la banda de la SESIÓN, nunca la del cuerpo (multi-tenancy)", async () => {
    const { status } = await post("/api/reels/copy-perfecto", { hookText: "Hola", band_id: "band-ajena", bandId: "band-ajena" });
    expect(status).toBe(200);
    expect(perfeccionarCopy.mock.calls[0][0].bandId).toBe("band-sesion");
  });

  it("400 si no hay texto que mejorar", async () => {
    const { status, body } = await post("/api/reels/copy-perfecto", { title: "algo" });
    expect(status).toBe(400);
    expect(body.success).toBe(false);
    expect(perfeccionarCopy).not.toHaveBeenCalled();
  });

  it("acota la entrada: tipos raros fuera, textos y hashtags recortados, tipo de contenido validado", async () => {
    await post("/api/reels/copy-perfecto", {
      hookText: "x".repeat(500),
      recommendedCopy: 42,
      hashtags: ["#ok", 7, { a: 1 }, ...Array.from({ length: 40 }, (_, i) => `#h${i}`)],
      contentType: "malicioso"
    });
    const entrada = perfeccionarCopy.mock.calls[0][0];
    expect(entrada.actual.hookText).toHaveLength(200);
    expect(entrada.actual.recommendedCopy).toBe("");
    expect(entrada.actual.hashtags).toHaveLength(30);
    expect(entrada.actual.hashtags[0]).toBe("#ok");
    expect(entrada.tipoContenido).toBe("concierto");
  });

  it("un fallo interno no filtra el mensaje del error", async () => {
    perfeccionarCopy.mockRejectedValue(new Error("SECRETO interno de Supabase"));
    const { status, body } = await post("/api/reels/copy-perfecto", { hookText: "Hola" });
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("SECRETO");
  });
});

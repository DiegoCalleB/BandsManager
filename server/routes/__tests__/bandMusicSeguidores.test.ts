import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

vi.mock("../../state.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1", role: "leader", band_id: "band-sesion", allowedBandIds: ["band-sesion"] };
    next();
  },
  requireCronOrAuth: (_req: any, _res: any, next: any) => next(),
  loadState: () => ({ bands: [] }),
  saveState: () => undefined,
}));
const dbGetBandContacts = vi.hoisted(() => vi.fn());
vi.mock("../../db.js", () => ({ dbGetBandContacts }));
const guardarMetricasBanda = vi.hoisted(() => vi.fn());
vi.mock("../../services/metricasBandaService.js", () => ({ capturarMetricasBanda: vi.fn(), guardarMetricasBanda }));
vi.mock("../../services/musicPreviewService.js", () => ({ previewDeBanda: vi.fn() }));
vi.mock("../../services/spotifyService.js", () => ({ artistaSpotifyExiste: vi.fn(), resolverUrlSpotifyDeBanda: vi.fn() }));
vi.mock("../../db/core.js", () => ({ getSupabase: vi.fn() }));
vi.mock("../../db/enlacesBandas.js", () => ({ cargarEnlacesDeContactos: vi.fn(), guardarEnlace: vi.fn() }));

const { default: router } = await import("../bandMusic.js");
const app = express();
app.use(express.json());
app.use("/api", router);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;
afterAll(() => server.close());

const put = async (ruta: string, cuerpo: unknown) => {
  const res = await globalThis.fetch(`http://127.0.0.1:${puerto}${ruta}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-band-id": "band-ajena" },
    body: JSON.stringify(cuerpo),
  });
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  dbGetBandContacts.mockReset().mockResolvedValue([{ id: "c1", nombre_banda: "Bala" }]);
  guardarMetricasBanda.mockReset().mockResolvedValue(1);
});

describe("PUT /api/bands/:id/metricas/seguidores", () => {
  it("guarda la fila de Spotify de la banda de la SESIÓN, no la de la cabecera", async () => {
    const { status, body } = await put("/api/bands/c1/metricas/seguidores", { seguidores: "1500" });
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, seguidores: 1500 });
    expect(dbGetBandContacts).toHaveBeenCalledWith("band-sesion");
    expect(guardarMetricasBanda).toHaveBeenCalledWith(
      { id: "c1", band_id: "band-sesion" },
      expect.stringMatching(/^\d{4}-\d{2}$/),
      [{ fuente: "spotify", seguidores: 1500 }],
    );
  });

  it("rechaza un número inválido sin tocar la base", async () => {
    const { status } = await put("/api/bands/c1/metricas/seguidores", { seguidores: "12.5" });
    expect(status).toBe(400);
    expect(guardarMetricasBanda).not.toHaveBeenCalled();
  });

  it("404 si la banda no es de la cuenta", async () => {
    const { status } = await put("/api/bands/otra/metricas/seguidores", { seguidores: 10 });
    expect(status).toBe(404);
    expect(guardarMetricasBanda).not.toHaveBeenCalled();
  });

  it("un fallo no filtra el error interno", async () => {
    guardarMetricasBanda.mockRejectedValue(new Error("SECRETO de Supabase"));
    const { status, body } = await put("/api/bands/c1/metricas/seguidores", { seguidores: 10 });
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("SECRETO");
  });
});

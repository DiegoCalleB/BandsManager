import { afterAll, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

vi.mock("../../state.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1", role: "leader", band_id: "band-sesion", allowedBandIds: ["band-sesion"] };
    next();
  }
}));
const aprendizajeDeBanda = vi.hoisted(() => vi.fn());
vi.mock("../../services/metricasReels.js", () => ({ aprendizajeDeBanda }));

const { default: router } = await import("../reelsAprendizaje.js");
const app = express();
app.use("/api", router);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;
afterAll(() => server.close());

const get = async (ruta: string) => {
  const res = await globalThis.fetch(`http://127.0.0.1:${puerto}${ruta}`, { headers: { "x-band-id": "band-ajena" } });
  return { status: res.status, body: await res.json() };
};

describe("GET /api/reels/aprendizaje", () => {
  it("devuelve el aprendizaje de la banda de la SESIÓN, no la de la cabecera", async () => {
    aprendizajeDeBanda.mockResolvedValue({ resumen: { reelsMedidos: 0 }, recomendacion: { modo: "explorando" } });
    const { status, body } = await get("/api/reels/aprendizaje?band_id=band-ajena");
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, resumen: { reelsMedidos: 0 }, recomendacion: { modo: "explorando" } });
    expect(aprendizajeDeBanda).toHaveBeenCalledWith("band-sesion");
  });

  it("un fallo no filtra el error interno", async () => {
    aprendizajeDeBanda.mockRejectedValue(new Error("SECRETO de Supabase"));
    const { status, body } = await get("/api/reels/aprendizaje");
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("SECRETO");
  });
});

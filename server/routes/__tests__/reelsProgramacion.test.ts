import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "net";

vi.mock("../../state.js", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: "u1", role: "leader", band_id: "band-sesion", allowedBandIds: ["band-sesion"] };
    next();
  }
}));
const dbGetSocialPosts = vi.hoisted(() => vi.fn());
const dbGetBandSchedule = vi.hoisted(() => vi.fn());
const dbOrigenesDeClips = vi.hoisted(() => vi.fn());
vi.mock("../../db/social.js", () => ({ dbGetSocialPosts }));
vi.mock("../../db/schedule.js", () => ({ dbGetBandSchedule }));
vi.mock("../../db/reelClips.js", () => ({ dbOrigenesDeClips }));

const { default: router } = await import("../reelsProgramacion.js");
const app = express();
app.use("/api", router);
const server = app.listen(0);
const puerto = (server.address() as AddressInfo).port;
afterAll(() => server.close());

const get = async (ruta: string) => {
  const res = await globalThis.fetch(`http://127.0.0.1:${puerto}${ruta}`);
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  vi.resetAllMocks();
  dbGetBandSchedule.mockResolvedValue({ timezone: "Europe/Madrid" });
  dbOrigenesDeClips.mockResolvedValue({});
});

describe("GET /api/reels/proximo-hueco", () => {
  it("lee los posts de la banda de la SESIÓN y propone un hueco futuro", async () => {
    dbGetSocialPosts.mockResolvedValue([]);
    const { status, body } = await get("/api/reels/proximo-hueco?plataforma=Instagram");
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, origenHora: "fallback" });
    expect(body.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dbGetSocialPosts).toHaveBeenCalledWith("band-sesion");
  });

  it("canoniza la URL de YouTube antes de buscar los orígenes de los clips", async () => {
    dbGetSocialPosts.mockResolvedValue([{ id: "p", fecha: "2099-01-01", plataforma: "Instagram", estado: "aprobado", video_url: "https://x/a.mp4" }]);
    await get("/api/reels/proximo-hueco?videoOrigen=" + encodeURIComponent("https://youtu.be/8Jdw41lYdak"));
    expect(dbOrigenesDeClips).toHaveBeenCalledWith("band-sesion", ["https://x/a.mp4"]);
  });

  it("una plataforma inventada cae a Instagram", async () => {
    dbGetSocialPosts.mockResolvedValue([]);
    const { status } = await get("/api/reels/proximo-hueco?plataforma=Myspace");
    expect(status).toBe(200);
  });

  it("un fallo no filtra el error interno", async () => {
    dbGetSocialPosts.mockRejectedValue(new Error("SECRETO de Supabase"));
    const { status, body } = await get("/api/reels/proximo-hueco");
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("SECRETO");
  });
});

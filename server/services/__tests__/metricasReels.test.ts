import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SocialPost } from "../../../src/types.js";

const db = vi.hoisted(() => ({
  posts: [] as SocialPost[],
  tomadas: new Map<string, number[]>(),
  guardadas: [] as Array<{ fila: Record<string, unknown>; bandId: string }>,
  ultimas: [] as Array<Record<string, unknown>>,
  cred: { token: "EAA", igUserId: "1" } as null | { token: string; igUserId: string },
  insights: vi.fn()
}));
vi.mock("../../db/reelMetricas.js", () => ({
  dbPostsPublicadosRecientes: async () => db.posts,
  dbMedicionesTomadas: async () => db.tomadas,
  dbGuardarMetricaReel: async (fila: Record<string, unknown>, bandId: string) => { db.guardadas.push({ fila, bandId }); },
  dbUltimasMetricasDeBanda: async () => db.ultimas
}));
vi.mock("../../db/reelClips.js", () => ({ dbBuscarReelClip: async () => ({ duracion_seg: 11.6, loop_perfecto: true }) }));
vi.mock("../credencialesInstagram.js", () => ({ credencialesInstagram: async () => db.cred }));
vi.mock("../publicadores/instagramInsights.js", () => ({ leerInsightsReel: db.insights }));

const { tickMetricas, aprendizajeDeBanda, reelMedidoDe } = await import("../metricasReels.js");

const post = (p: Partial<SocialPost> = {}): SocialPost => ({
  id: "p1", band_id: "band-a", fecha: "2026-10-10", plataforma: "Instagram", contenido: "", estado: "publicado", responsable: "",
  published_id: "media-9", published_at: "2026-10-10T20:00:00Z", video_url: "https://x/clip.mp4", ...p
});
const INSIGHTS = { views: 2500, reach: 1000, likes: 80, comments: 9, shares: 30, saves: 12, avgWatchMs: 23_200, totalWatchMs: null };

beforeEach(() => {
  db.posts = [post()];
  db.tomadas = new Map();
  db.guardadas = [];
  db.ultimas = [];
  db.cred = { token: "EAA", igUserId: "1" };
  db.insights.mockReset().mockResolvedValue(INSIGHTS);
});

describe("tickMetricas", () => {
  it("mide lo que toca con la cuenta de la banda y copia duración y loop del clip", async () => {
    const r = await tickMetricas(new Date("2026-10-11T21:00:00Z")); // 25 h tras publicar
    expect(r.medidos).toBe(1);
    expect(db.insights).toHaveBeenCalledWith({ token: "EAA", igUserId: "1" }, "media-9");
    expect(db.guardadas[0]).toMatchObject({ bandId: "band-a", fila: { post_id: "p1", horas: 24, views: 2500, avg_watch_ms: 23_200, duracion_seg: 11.6, loop_perfecto: true } });
  });

  it("no repite una medición ya tomada", async () => {
    db.tomadas = new Map([["p1", [24]]]);
    expect((await tickMetricas(new Date("2026-10-11T21:00:00Z"))).medidos).toBe(0);
  });

  it("sin Instagram conectado no lee nada (ni usa una cuenta global)", async () => {
    db.cred = null;
    await tickMetricas(new Date("2026-10-11T21:00:00Z"));
    expect(db.insights).not.toHaveBeenCalled();
    expect(db.guardadas).toEqual([]);
  });

  it("un fallo de Meta en un post no frena a los demás", async () => {
    db.posts = [post({ id: "malo" }), post({ id: "bueno", published_id: "media-10" })];
    db.insights.mockRejectedValueOnce(new Error("token caducado")).mockResolvedValueOnce(INSIGHTS);
    const r = await tickMetricas(new Date("2026-10-11T21:00:00Z"));
    expect(r.medidos).toBe(1);
    expect(db.guardadas[0].fila.post_id).toBe("bueno");
  });
});

describe("aprendizaje", () => {
  it("sin duración del clip, la medición no cuenta (no se puede calcular rewatch)", () => {
    expect(reelMedidoDe({ duracion_seg: null, avg_watch_ms: 1000 } as never)).toBeNull();
  });

  it("resume y recomienda a partir de las métricas guardadas de la banda", async () => {
    db.ultimas = Array.from({ length: 4 }, (_, i) => ({ post_id: `p${i}`, duracion_seg: 10, loop_perfecto: true, avg_watch_ms: 18_000, reach: 1000, shares: 20, saves: 5, views: 3000 }));
    const a = await aprendizajeDeBanda("band-a", () => 0.5);
    expect(a.resumen.reelsMedidos).toBe(4);
    expect(a.resumen.rewatchMediano).toBeCloseTo(1.8, 5);
    expect(a.recomendacion).toMatchObject({ modo: "aprovechando", formato: "loop_corto" });
  });
});

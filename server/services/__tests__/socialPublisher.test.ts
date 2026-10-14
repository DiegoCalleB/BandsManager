import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SocialPost } from "../../../src/types.js";

const db = vi.hoisted(() => ({
  posts: [] as SocialPost[],
  upserts: [] as Array<Partial<SocialPost>>,
  reclamo: vi.fn(),
  epk: null as null | { enlacesRedes: Record<string, string> },
  clip: null as null | { derechos: string | null }
}));
const publicarReelInstagram = vi.hoisted(() => vi.fn());

vi.mock("../../db/social.js", () => ({
  dbGetSocialPosts: vi.fn(async () => db.posts),
  dbUpsertSocialPost: vi.fn(async (p: Partial<SocialPost>) => { db.upserts.push(p); return p; }),
  dbReclamarPostParaPublicar: db.reclamo,
  dbGetPostsPorPublicar: vi.fn(async () => db.posts)
}));
vi.mock("../../db/epk.js", () => ({ dbGetEpkConfig: vi.fn(async () => db.epk) }));
vi.mock("../../db/schedule.js", () => ({ dbGetBandSchedule: vi.fn(async () => ({ timezone: "Europe/Madrid" })) }));
vi.mock("../../db/reelClips.js", () => ({ dbBuscarReelClip: vi.fn(async () => db.clip) }));
vi.mock("../publicadores/instagramReels.js", () => ({ publicarReelInstagram }));

const { publishSocialPostNow, tickPublicador, motivoParaNoAutopublicar } = await import("../socialPublisher.js");

const CLIP = "https://x.supabase.co/storage/v1/object/public/clips/band-a/c.mp4";
const post = (p: Partial<SocialPost> = {}): SocialPost => ({
  id: "p1",
  band_id: "band-a",
  fecha: "2026-10-14",
  hora_programada: "20:30",
  plataforma: "Instagram",
  contenido: "Copy",
  estado: "aprobado",
  auto_publish: true,
  responsable: "",
  video_url: CLIP,
  ...p
});

beforeEach(() => {
  db.posts = [post()];
  db.upserts = [];
  db.reclamo.mockReset().mockImplementation(async (id: string) => ({ ...db.posts.find((p) => p.id === id)!, estado: "publicando" }));
  db.epk = { enlacesRedes: { instagram_access_token: "EAAtok", instagram_account_id: "1789" } };
  db.clip = { derechos: "canal_de_la_banda" };
  publicarReelInstagram.mockReset().mockResolvedValue({ publishedId: "media-9", permalink: "https://instagram.com/reel/x" });
});

describe("publishSocialPostNow", () => {
  it("publica de verdad y guarda el id real, sin métricas inventadas", async () => {
    const r = await publishSocialPostNow("p1", "band-a");
    expect(r).toMatchObject({ success: true, modo: "publicado", publishedId: "media-9" });
    expect(publicarReelInstagram).toHaveBeenCalledWith({ token: "EAAtok", igUserId: "1789" }, { videoUrl: CLIP, caption: "Copy" });
    const final = db.upserts.at(-1)!;
    expect(final).toMatchObject({ estado: "publicado", published_id: "media-9" });
    expect(final.metrics).toBeUndefined();
  });

  it("sin Instagram conectado: modo asistido, sin tocar el post", async () => {
    db.epk = null;
    const r = await publishSocialPostNow("p1", "band-a");
    expect(r).toMatchObject({ success: false, modo: "asistido" });
    expect(db.reclamo).not.toHaveBeenCalled();
    expect(db.upserts).toEqual([]);
  });

  it("si otro proceso ya lo reclamó, no publica dos veces", async () => {
    db.reclamo.mockResolvedValue(null);
    const r = await publishSocialPostNow("p1", "band-a");
    expect(r.success).toBe(false);
    expect(publicarReelInstagram).not.toHaveBeenCalled();
  });

  it("si Instagram falla, el post queda fallido con el motivo real", async () => {
    publicarReelInstagram.mockRejectedValue(new Error("Invalid OAuth access token"));
    const r = await publishSocialPostNow("p1", "band-a");
    expect(r).toMatchObject({ success: false, modo: "fallido", error: "Invalid OAuth access token" });
    expect(db.upserts.at(-1)).toMatchObject({ estado: "fallido", publish_error: "Invalid OAuth access token" });
  });
});

describe("tickPublicador", () => {
  it("publica lo vencido en hora de Madrid y no lo futuro", async () => {
    db.posts = [post({ id: "ya" }), post({ id: "luego", hora_programada: "22:00" })];
    await tickPublicador(new Date("2026-10-14T18:31:00Z"));
    expect(db.reclamo).toHaveBeenCalledTimes(1);
    expect(db.reclamo.mock.calls[0][0]).toBe("ya");
  });

  it("lo que no puede publicarse solo pasa a fallido con el motivo (no se reintenta cada minuto)", async () => {
    db.clip = { derechos: null };
    await tickPublicador(new Date("2026-10-14T18:31:00Z"));
    expect(publicarReelInstagram).not.toHaveBeenCalled();
    expect(db.upserts.at(-1)).toMatchObject({ id: "p1", estado: "fallido" });
    expect(db.upserts.at(-1)!.publish_error).toMatch(/copyright/);
  });

  it("rescata un 'publicando' colgado", async () => {
    db.posts = [post({ estado: "publicando", publish_started_at: "2026-10-14T17:00:00Z" })];
    await tickPublicador(new Date("2026-10-14T18:31:00Z"));
    expect(db.upserts.at(-1)).toMatchObject({ estado: "fallido" });
  });
});

describe("motivoParaNoAutopublicar", () => {
  const cred = { token: "t", igUserId: "1" };
  const ok = { derechos: "canal_de_la_banda" as const };
  it("cada bloqueo da un motivo accionable", () => {
    expect(motivoParaNoAutopublicar(post(), cred, ok)).toBeNull();
    expect(motivoParaNoAutopublicar(post({ plataforma: "TikTok" }), cred, ok)).toMatch(/TikTok/);
    expect(motivoParaNoAutopublicar(post({ video_url: "https://youtu.be/abc" }), cred, ok)).toMatch(/renderiza/);
    expect(motivoParaNoAutopublicar(post({ video_url: "/clips/a.mp4" }), cred, ok)).toMatch(/renderiza/);
    expect(motivoParaNoAutopublicar(post(), null, ok)).toMatch(/Métricas/);
    expect(motivoParaNoAutopublicar(post(), cred, null)).toMatch(/copyright/);
  });
});

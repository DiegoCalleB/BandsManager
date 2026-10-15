import { describe, expect, it, vi } from "vitest";
import { hostGraphPara, publicarReelInstagram, type DependenciasGraph } from "../instagramReels.js";

function respuestas(...cuerpos: Array<Record<string, unknown> | { status: number; body: Record<string, unknown> }>) {
  const llamadas: Array<{ url: string; init?: RequestInit }> = [];
  const cola = [...cuerpos];
  const deps: DependenciasGraph = {
    fetch: vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      llamadas.push({ url: String(url), init });
      const r = cola.shift() || {};
      const { status, body } = "status" in r && "body" in r ? (r as { status: number; body: Record<string, unknown> }) : { status: 200, body: r };
      return new Response(JSON.stringify(body), { status });
    }) as unknown as typeof fetch,
    esperar: vi.fn(async () => {})
  };
  return { deps, llamadas };
}

const cred = { igUserId: "1789", token: "EAAtoken" };
const reel = { videoUrl: "https://x.supabase.co/storage/v1/object/public/clips/a.mp4", caption: "Hola" };

describe("publicarReelInstagram", () => {
  it("crea el contenedor, espera a FINISHED y publica", async () => {
    const { deps, llamadas } = respuestas(
      { id: "cont-1" },
      { status_code: "IN_PROGRESS" },
      { status_code: "FINISHED" },
      { id: "media-9" },
      { permalink: "https://www.instagram.com/reel/abc/" }
    );
    const r = await publicarReelInstagram(cred, reel, deps);
    expect(r).toEqual({ publishedId: "media-9", permalink: "https://www.instagram.com/reel/abc/" });
    expect(llamadas[0].url).toBe("https://graph.facebook.com/v21.0/1789/media");
    const cuerpo = new URLSearchParams(String(llamadas[0].init?.body));
    expect(cuerpo.get("media_type")).toBe("REELS");
    expect(cuerpo.get("video_url")).toBe(reel.videoUrl);
    expect(llamadas[3].url).toBe("https://graph.facebook.com/v21.0/1789/media_publish");
    expect(new URLSearchParams(String(llamadas[3].init?.body)).get("creation_id")).toBe("cont-1");
    expect(deps.esperar).toHaveBeenCalledTimes(1);
  });

  it("si Instagram marca ERROR no publica", async () => {
    const { deps, llamadas } = respuestas({ id: "cont-1" }, { status_code: "ERROR", status: "Formato no soportado" });
    await expect(publicarReelInstagram(cred, reel, deps)).rejects.toThrow("Formato no soportado");
    expect(llamadas.some((l) => l.url.includes("media_publish"))).toBe(false);
  });

  it("propaga el mensaje de error de Graph (token caducado, permisos…)", async () => {
    const { deps } = respuestas({ status: 400, body: { error: { message: "Invalid OAuth access token" } } });
    await expect(publicarReelInstagram(cred, reel, deps)).rejects.toThrow("Invalid OAuth access token");
  });

  it("se rinde tras el tope de sondeos sin publicar", async () => {
    const { deps, llamadas } = respuestas({ id: "cont-1" }, ...Array.from({ length: 60 }, () => ({ status_code: "IN_PROGRESS" })));
    await expect(publicarReelInstagram(cred, reel, deps)).rejects.toThrow("sigue procesando");
    expect(llamadas.some((l) => l.url.includes("media_publish"))).toBe(false);
  });

  it("un permalink que falla no invalida una publicación hecha", async () => {
    const { deps } = respuestas({ id: "c" }, { status_code: "FINISHED" }, { id: "m" }, { status: 500, body: {} });
    await expect(publicarReelInstagram(cred, reel, deps)).resolves.toEqual({ publishedId: "m", permalink: undefined });
  });
});

describe("hostGraphPara", () => {
  it("tokens de Instagram Login van a graph.instagram.com", () => {
    expect(hostGraphPara("IGAAxyz")).toBe("https://graph.instagram.com");
    expect(hostGraphPara("EAAxyz")).toBe("https://graph.facebook.com");
  });
});

import { describe, expect, it, vi } from "vitest";
import { leerInsightsReel, parsearInsights } from "../instagramInsights.js";

const cred = { igUserId: "1", token: "EAAtok" };
const metrica = (name: string, value: number) => ({ name, values: [{ value }] });

describe("parsearInsights", () => {
  it("lee cada métrica; lo que no viene es null, no 0", () => {
    const m = parsearInsights({ data: [metrica("views", 2500), metrica("reach", 1000), metrica("ig_reels_avg_watch_time", 18400), { name: "shares", total_value: { value: 30 } }] });
    expect(m).toEqual({ views: 2500, reach: 1000, likes: null, comments: null, shares: 30, saves: null, avgWatchMs: 18400, totalWatchMs: null });
  });
  it("acepta `plays` cuando no hay `views` (cuentas con el juego antiguo)", () => {
    expect(parsearInsights({ data: [metrica("plays", 900)] }).views).toBe(900);
  });
});

describe("leerInsightsReel", () => {
  it("si Meta rechaza el juego nuevo, reintenta con el anterior", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "metric views not supported" } }), { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [metrica("plays", 900)] }), { status: 200 }));
    const m = await leerInsightsReel(cred, "media-9", { fetch: f as unknown as typeof fetch });
    expect(m.views).toBe(900);
    expect(String(f.mock.calls[0][0])).toContain("metric=views,");
    expect(String(f.mock.calls[1][0])).toContain("metric=plays,");
    expect(String(f.mock.calls[0][0])).toMatch(/^https:\/\/graph\.facebook\.com\/v21\.0\/media-9\/insights/);
  });
  it("si fallan ambos, lanza con el motivo de Meta (sin el token)", async () => {
    const f = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), { status: 400 }));
    const e = await leerInsightsReel(cred, "m", { fetch: f as unknown as typeof fetch }).catch((x: Error) => x);
    expect((e as Error).message).toContain("Invalid OAuth access token");
    expect((e as Error).message).not.toContain("EAAtok");
  });
});

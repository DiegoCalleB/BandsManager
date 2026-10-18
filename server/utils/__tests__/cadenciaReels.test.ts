import { describe, it, expect } from "vitest";
import { proponerHueco, mejorHoraSegunSeguidores, HORA_FALLBACK } from "../cadenciaReels.js";
import type { SocialPost } from "../../../src/types.js";

const post = (p: Partial<SocialPost>): SocialPost => ({
  id: "p", fecha: "2026-10-15", hora_programada: "20:30", plataforma: "Instagram", contenido: "", estado: "aprobado", responsable: "x", ...p
});
// 14 oct 2026, 10:00 en Madrid (CEST, UTC+2)
const AHORA = new Date("2026-10-14T08:00:00Z");
const ZONA = "Europe/Madrid";

const horasPlanas = (pico: number, valor = 100) =>
  Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, h === pico ? valor : 10]));

describe("mejorHoraSegunSeguidores", () => {
  it("publica 15 min antes de la hora pico", () => {
    expect(mejorHoraSegunSeguidores(horasPlanas(21))).toBe("20:45");
  });
  it("pico a las 0 → 23:45", () => {
    expect(mejorHoraSegunSeguidores(horasPlanas(0))).toBe("23:45");
  });
  it("sin datos o con pocos seguidores → null (no se inventa una hora)", () => {
    expect(mejorHoraSegunSeguidores(null)).toBeNull();
    expect(mejorHoraSegunSeguidores({ 20: 3, 21: 2 })).toBeNull();
    expect(mejorHoraSegunSeguidores(Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, 1])))).toBeNull();
  });
});

describe("proponerHueco", () => {
  it("sin datos usa el fallback y lo dice", () => {
    const h = proponerHueco({ posts: [], ahora: AHORA, zona: ZONA, plataforma: "Instagram" });
    expect(h).toMatchObject({ fecha: "2026-10-14", hora: HORA_FALLBACK, origenHora: "fallback" });
  });

  it("con datos de la cuenta usa la hora medida, redondeada al cuarto de hora", () => {
    const h = proponerHueco({ posts: [], ahora: AHORA, zona: ZONA, plataforma: "Instagram", seguidoresPorHora: horasPlanas(21) });
    expect(h).toMatchObject({ hora: "20:45", origenHora: "datos" });
  });

  it("un Reel por día y plataforma: salta los días ocupados", () => {
    const posts = [post({ fecha: "2026-10-14" }), post({ fecha: "2026-10-15" })];
    expect(proponerHueco({ posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram" }).fecha).toBe("2026-10-16");
  });

  it("otra plataforma no ocupa el día", () => {
    const posts = [post({ fecha: "2026-10-14", plataforma: "TikTok" })];
    expect(proponerHueco({ posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram" }).fecha).toBe("2026-10-14");
  });

  it("un fallido no ocupa el día", () => {
    const posts = [post({ fecha: "2026-10-14", estado: "fallido" })];
    expect(proponerHueco({ posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram" }).fecha).toBe("2026-10-14");
  });

  it("si la hora de hoy ya pasó, empieza mañana", () => {
    const tarde = new Date("2026-10-14T19:00:00Z"); // 21:00 Madrid
    expect(proponerHueco({ posts: [], ahora: tarde, zona: ZONA, plataforma: "Instagram" }).fecha).toBe("2026-10-15");
  });

  it("dos clips del mismo vídeo no van a menos de 48 h", () => {
    const posts = [post({ fecha: "2026-10-14", video_url: "https://x/a.mp4" })];
    const h = proponerHueco({
      posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram",
      videoOrigen: "yt-1", origenPorClip: { "https://x/a.mp4": "yt-1" }
    });
    // 14 a las 20:30 → el 15 a las 20:30 son 24 h, el 16 a las 20:30 son 48 h exactas.
    expect(h.fecha).toBe("2026-10-16");
  });

  it("clips de vídeos distintos sí pueden ir en días consecutivos", () => {
    const posts = [post({ fecha: "2026-10-14", video_url: "https://x/a.mp4" })];
    const h = proponerHueco({
      posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram",
      videoOrigen: "yt-2", origenPorClip: { "https://x/a.mp4": "yt-1" }
    });
    expect(h.fecha).toBe("2026-10-15");
  });

  it("agenda llena 30 días → lo avisa en vez de callar", () => {
    const posts = Array.from({ length: 40 }, (_, i) => post({ id: `p${i}`, fecha: new Date(Date.UTC(2026, 9, 14 + i)).toISOString().slice(0, 10) }));
    expect(proponerHueco({ posts, ahora: AHORA, zona: ZONA, plataforma: "Instagram" }).motivo).toMatch(/agenda llena/i);
  });
});

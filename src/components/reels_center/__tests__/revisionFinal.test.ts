import { describe, it, expect } from "vitest";
import { prepararRevisionFinal, type EntradaRevision } from "../revisionFinal";

// Siempre en el futuro: con una fecha fija el test se rompía solo al pasar esa hora (la validación rechaza horas pasadas).
const MANANA = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const CLIP = "https://x.supabase.co/storage/v1/object/public/clips/band/c.mp4";
// Siempre en el futuro: una fecha fija caduca y el test falla el día que se cumple.
const MANANA = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const base = (p: Partial<EntradaRevision> = {}): EntradaRevision => ({
  copy: "Nuevo directo 🎸 #rock",
  fecha: MANANA,
  hora: "20:30",
  plataforma: "Instagram",
  videoUrl: CLIP,
  calidad: { aprobado: true, bloqueantes: [], avisos: [] },
  derechosDeclarados: true,
  autoPublish: true,
  cuentaConectada: true,
  avisosCadencia: [],
  ...p
});

describe("prepararRevisionFinal", () => {
  it("todo en orden: se puede aprobar y saldrá solo", () => {
    const r = prepararRevisionFinal(base());
    expect(r).toMatchObject({ puedeAprobar: true, saldraSolo: true, bloqueos: [], avisos: [] });
  });

  it("un copy sin hashtag o sin fecha bloquea la aprobación y dice por qué", () => {
    const r = prepararRevisionFinal(base({ copy: "Sin hashtag", fecha: "" }));
    expect(r.puedeAprobar).toBe(false);
    expect(r.bloqueos.length).toBeGreaterThanOrEqual(2);
  });

  it("sin cuenta conectada se puede aprobar pero avisa de que habrá que subirlo a mano", () => {
    const r = prepararRevisionFinal(base({ cuentaConectada: false }));
    expect(r.puedeAprobar).toBe(true);
    expect(r.saldraSolo).toBe(false);
    expect(r.avisos.join(" ")).toMatch(/cuenta/i);
  });

  it("un clip que suspendió el control de calidad no sale solo y cita el motivo", () => {
    const calidad = { aprobado: false, bloqueantes: [{ codigo: "sin_audio", mensaje: "El vídeo no tiene pista de audio." }], avisos: [] };
    const r = prepararRevisionFinal(base({ calidad }));
    expect(r.saldraSolo).toBe(false);
    expect(r.avisos.join(" ")).toMatch(/no tiene pista de audio/);
  });

  it("calidad sin medir tampoco sale solo", () => {
    expect(prepararRevisionFinal(base({ calidad: null })).saldraSolo).toBe(false);
    expect(prepararRevisionFinal(base({ calidad: undefined })).saldraSolo).toBe(false);
  });

  it("un enlace de YouTube (clip sin renderizar) no sale solo", () => {
    const r = prepararRevisionFinal(base({ videoUrl: "https://youtu.be/abc" }));
    expect(r.saldraSolo).toBe(false);
    expect(r.avisos.join(" ")).toMatch(/renderiza/i);
  });

  it("sin derechos declarados no sale solo", () => {
    expect(prepararRevisionFinal(base({ derechosDeclarados: false })).saldraSolo).toBe(false);
  });

  it("otra plataforma distinta de Instagram no sale sola", () => {
    const r = prepararRevisionFinal(base({ plataforma: "TikTok" }));
    expect(r.saldraSolo).toBe(false);
    expect(r.avisos.join(" ")).toMatch(/TikTok/);
  });

  it("si la persona no marcó subida automática no se avisa de nada de eso: es lo que pidió", () => {
    const r = prepararRevisionFinal(base({ autoPublish: false, cuentaConectada: false, calidad: null }));
    expect(r.saldraSolo).toBe(false);
    expect(r.avisos).toEqual([]);
  });

  it("arrastra los avisos de cadencia", () => {
    expect(prepararRevisionFinal(base({ avisosCadencia: ["Ya hay un Reel ese día."] })).avisos).toContain("Ya hay un Reel ese día.");
  });
});

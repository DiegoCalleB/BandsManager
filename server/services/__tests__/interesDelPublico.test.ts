import { describe, expect, it, vi } from "vitest";
import { interesDelPublico } from "../interesDelPublico.js";

const heatmap = Array.from({ length: 100 }, (_, i) => ({ start: i * 2, end: i * 2 + 2, valor: i === 50 ? 1 : 0.3 }));
const base = { videoId: "8Jdw41lYdak", tipo: "concierto" as const };
const sinComentarios = async () => [];
const marcas = ["1:40", "1:41", "1:42", "1:43", "1:44"].map((m) => ({ texto: `${m} 🔥`, likes: 4 }));

describe("interesDelPublico", () => {
  it("no es música → no usa nada y no lee comentarios", async () => {
    const leer = vi.fn(sinComentarios);
    const r = await interesDelPublico({ ...base, tipo: "otro", ficha: { esMusica: false, heatmap, duration: 200 } }, leer);
    expect(r.curva).toBeNull();
    expect(r.nota).toMatch(/solo se usan en vídeos de música/);
    expect(leer).not.toHaveBeenCalled();
  });

  it("música con heatmap → curva con peso de heatmap", async () => {
    const r = await interesDelPublico({ ...base, ficha: { esMusica: true, heatmap, duration: 200 } }, sinComentarios);
    expect(r.curva?.peso).toBe(0.4);
    expect(r.nota).toMatch(/gráfico de repeticiones/);
  });

  it("sin heatmap pero con marcas suficientes → solo comentarios, menos peso", async () => {
    const r = await interesDelPublico({ ...base, ficha: { esMusica: true, heatmap: [], duration: 200 } }, async () => marcas);
    expect(r.curva?.peso).toBe(0.25);
    expect(r.nota).toMatch(/5 marcas de tiempo/);
  });

  it("música sin datos de público → null con una nota que lo explica", async () => {
    const r = await interesDelPublico({ ...base, ficha: { esMusica: true, heatmap: [], duration: 200 } }, sinComentarios);
    expect(r.curva).toBeNull();
    expect(r.nota).toMatch(/no tiene todavía datos de público/);
  });

  it("categoría desconocida: decide el tipo detectado por el título", async () => {
    const f = { esMusica: null, heatmap, duration: 200 };
    expect((await interesDelPublico({ ...base, ficha: f }, sinComentarios)).curva).not.toBeNull();
    expect((await interesDelPublico({ ...base, tipo: "otro", ficha: f }, sinComentarios)).curva).toBeNull();
  });

  it("duración desconocida → null sin leer comentarios", async () => {
    const leer = vi.fn(sinComentarios);
    const r = await interesDelPublico({ ...base, ficha: { esMusica: true, heatmap, duration: 0 } }, leer);
    expect(r.curva).toBeNull();
    expect(leer).not.toHaveBeenCalled();
  });
});

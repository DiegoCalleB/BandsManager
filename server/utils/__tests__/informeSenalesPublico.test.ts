import { describe, expect, it } from "vitest";
import { informeSenalesPublico, mejoresTramos } from "../informeSenalesPublico.js";

const heatmap = (duracion: number, picoEn: number) =>
  Array.from({ length: 100 }, (_, i) => ({ start_time: (i * duracion) / 100, end_time: ((i + 1) * duracion) / 100, value: Math.abs(i - picoEn) < 6 ? 1 : 0.25 }));
const ficha = (extra: Record<string, unknown> = {}) => ({ title: "Directo en la sala", duration: 300, categories: ["Music"], heatmap: heatmap(300, 60), ...extra });
const hilo = (texto: string, likes = 3) => ({ snippet: { topLevelComment: { snippet: { textOriginal: texto, likeCount: likes } } } });

describe("informeSenalesPublico", () => {
  it("un vídeo de música con heatmap propone los tramos que más repite la gente", () => {
    const t = informeSenalesPublico({ ficha: ficha(), duracionClip: 30 });
    expect(t).toMatch(/Música: sí/);
    expect(t).toMatch(/SE USAN/);
    expect(t).toMatch(/gráfico de repeticiones/);
    expect(t).toMatch(/peso en la puntuación 0.4/);
    expect(t).toMatch(/Tramos de 30 s/);
  });

  it("el tramo propuesto cae sobre el pico del gráfico", () => {
    const curva = Array.from({ length: 300 }, (_, s) => (s >= 170 && s < 190 ? 100 : 10));
    const [t] = mejoresTramos(curva, 20, 1);
    expect(t.start).toBe(170);
  });

  it("los tramos no se solapan", () => {
    const curva = Array.from({ length: 200 }, (_, s) => (s % 40 < 20 ? 90 : 10));
    const t = mejoresTramos(curva, 20, 4);
    for (let i = 1; i < t.length; i++) expect(t[i].start).toBeGreaterThanOrEqual(t[i - 1].end);
  });

  it("solo lista tramos con señal, del más al menos repetido, y nunca uno con interés 0", () => {
    const t = informeSenalesPublico({ ficha: ficha(), duracionClip: 30 });
    const interes = [...t.matchAll(/interés (\d+)\/100/g)].map((m) => Number(m[1]));
    expect(interes.length).toBeGreaterThan(0);
    expect(interes.every((n) => n >= 15)).toBe(true);
    expect([...interes].sort((a, b) => b - a)).toEqual(interes);
  });

  it("un vídeo sin ningún pico claro no inventa tramos", () => {
    const plano = Array.from({ length: 100 }, (_, i) => ({ start_time: i * 3, end_time: i * 3 + 3, value: 0.5 }));
    const t = informeSenalesPublico({ ficha: ficha({ heatmap: plano }) });
    expect(t).not.toMatch(/Tramos de 30 s que más repite/);
  });

  it("un vídeo que no es música dice por qué no se usan las señales", () => {
    const t = informeSenalesPublico({ ficha: ficha({ categories: ["Gaming"], title: "Tutorial de Excel" }) });
    expect(t).toMatch(/no \(otra categoría\)/);
    expect(t).toMatch(/NO se usan/);
    expect(t).not.toMatch(/Tramos de/);
  });

  it("sin heatmap ni comentarios lo dice y avisa de que sale como antes", () => {
    const t = informeSenalesPublico({ ficha: ficha({ heatmap: undefined }) });
    expect(t).toMatch(/no viene/);
    expect(t).toMatch(/sale igual que antes/);
  });

  it("lee los comentarios de la respuesta cruda de la Data API", () => {
    const items = ["1:40 🔥", "1:41 brutal", "1:42 ese solo", "1:43 uf", "1:44 sí"].map((x) => hilo(x));
    const t = informeSenalesPublico({ ficha: ficha({ heatmap: undefined }), comentarios: { items } });
    expect(t).toMatch(/Comentarios leídos: 5 · con marca de tiempo válida: 5/);
    expect(t).toMatch(/5 marcas de comentarios/);
    expect(t).toMatch(/peso en la puntuación 0.25/);
  });

  it("acepta también una lista de comentarios ya extraída", () => {
    const t = informeSenalesPublico({ ficha: ficha(), comentarios: [{ texto: "2:00 🔥", likes: 9 }] });
    expect(t).toMatch(/Comentarios leídos: 1/);
  });

  it("no se rompe con una ficha vacía o basura", () => {
    expect(() => informeSenalesPublico({ ficha: {} })).not.toThrow();
    expect(() => informeSenalesPublico({ ficha: null, comentarios: null })).not.toThrow();
  });
});

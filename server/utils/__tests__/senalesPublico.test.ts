import { describe, expect, it } from "vitest";
import { curvaDeInteres, esVideoDeMusica, interesMedio, marcasDeTiempo, normalizarHeatmap, usarSenalesDePublico } from "../senalesPublico.js";

const heatmapPlano = (n = 100, duracion = 200, pico?: { i: number; v: number }) =>
  Array.from({ length: n }, (_, i) => ({ start_time: (i * duracion) / n, end_time: ((i + 1) * duracion) / n, value: pico && i === pico.i ? pico.v : 0.3 }));

describe("esVideoDeMusica", () => {
  it("la categoría 10 de la Data API es música", () => expect(esVideoDeMusica({ categoriaId: "10" })).toBe(true));
  it("la categoría 'Music' de yt-dlp es música, en cualquier caja", () => expect(esVideoDeMusica({ categorias: ["music"] })).toBe(true));
  it("track o artist en la ficha de yt-dlp también", () => expect(esVideoDeMusica({ pista: true })).toBe(true));
  it("otra categoría conocida NO es música", () => {
    expect(esVideoDeMusica({ categoriaId: "24" })).toBe(false);
    expect(esVideoDeMusica({ categorias: ["Gaming"] })).toBe(false);
  });
  it("sin datos es desconocido (null), no falso", () => expect(esVideoDeMusica({})).toBeNull());
});

describe("usarSenalesDePublico", () => {
  it("música declarada → sí", () => expect(usarSenalesDePublico(true, "otro")).toBe(true));
  it("no música → no, aunque el título parezca un bolo", () => expect(usarSenalesDePublico(false, "concierto")).toBe(false));
  it("desconocido: solo si el título/descripcion apuntan a bolo o videoclip", () => {
    expect(usarSenalesDePublico(null, "concierto")).toBe(true);
    expect(usarSenalesDePublico(null, "videoclip")).toBe(true);
    expect(usarSenalesDePublico(null, "otro")).toBe(false);
    expect(usarSenalesDePublico(null, "ensayo")).toBe(false);
  });
});

describe("normalizarHeatmap", () => {
  it("acepta el formato de yt-dlp", () => {
    const h = normalizarHeatmap(heatmapPlano(100, 200, { i: 50, v: 1 }), 200);
    expect(h).toHaveLength(100);
    expect(h[50]).toEqual({ start: 100, end: 102, valor: 1 });
  });
  it("sin heatmap o con basura → []", () => {
    expect(normalizarHeatmap(undefined, 200)).toEqual([]);
    expect(normalizarHeatmap("x", 200)).toEqual([]);
    expect(normalizarHeatmap([{ start_time: "a" }], 200)).toEqual([]);
  });
  it("con muy pocos tramos no es una curva fiable → []", () => {
    expect(normalizarHeatmap(heatmapPlano(5, 200), 200)).toEqual([]);
  });
  it("recorta valores fuera de 0-1 y descarta los no finitos", () => {
    const bruto = heatmapPlano(20, 100);
    bruto[3].value = 7;
    bruto[4].value = Number.NaN;
    const h = normalizarHeatmap(bruto, 100);
    expect(h).toHaveLength(19);
    expect(h.find((p) => p.start === 15)?.valor).toBe(1);
  });
  it("ignora tramos fuera de la duración del vídeo", () => {
    expect(normalizarHeatmap(heatmapPlano(20, 100), 50).every((p) => p.end <= 50)).toBe(true);
  });
});

describe("marcasDeTiempo", () => {
  const c = (texto: string, likes = 0) => ({ texto, likes });
  it("lee m:ss y h:mm:ss", () => {
    const m = marcasDeTiempo([c("1:02:33 la entrada del solo"), c("el 2:34 es brutal")], 4000);
    expect(m.map((x) => x.t).sort((a, b) => a - b)).toEqual([154, 3753]);
  });
  it("pondera por likes de forma suave", () => {
    const [sin, con] = [marcasDeTiempo([c("2:00 🔥", 0)], 300)[0], marcasDeTiempo([c("2:00 🔥", 500)], 300)[0]];
    expect(con.peso).toBeGreaterThan(sin.peso);
    expect(con.peso).toBeLessThan(sin.peso * 10);
  });
  it("ignora 0:00, minutos > 59 con segundos > 59 y marcas fuera del vídeo", () => {
    expect(marcasDeTiempo([c("0:00 intro"), c("9:99 no es hora"), c("20:00 más largo que el vídeo")], 300)).toEqual([]);
  });
  it("un comentario con un índice de temas (muchas marcas) no es una reacción", () => {
    expect(marcasDeTiempo([c("0:10 a\n1:00 b\n2:00 c\n3:00 d\n4:00 e")], 600)).toEqual([]);
  });
  it("no confunde un decimal o una proporción con una marca", () => {
    expect(marcasDeTiempo([c("rinde 3.45:1 en directo"), c("a las 12:30:45:10")], 600)).toEqual([]);
  });
  it("una marca repetida en el mismo comentario cuenta una vez", () => {
    expect(marcasDeTiempo([c("1:30 y otra vez 1:30")], 300)).toHaveLength(1);
  });
});

describe("curvaDeInteres", () => {
  it("sin heatmap y con pocas marcas no hay evidencia → null", () => {
    expect(curvaDeInteres({ duracion: 200, heatmap: [], marcas: [{ t: 10, peso: 1 }] })).toBeNull();
  });
  it("con heatmap: el pico es el máximo y pesa 0.4", () => {
    const heatmap = normalizarHeatmap(heatmapPlano(100, 200, { i: 50, v: 1 }), 200);
    const r = curvaDeInteres({ duracion: 200, heatmap })!;
    expect(r.peso).toBe(0.4);
    expect(r.curva).toHaveLength(200);
    expect(interesMedio(r.curva, 100, 102)).toBeGreaterThan(interesMedio(r.curva, 20, 22));
    expect(Math.max(...r.curva)).toBe(100);
  });
  it("solo comentarios (≥5 marcas): pesa menos que el heatmap", () => {
    const marcas = [100, 101, 102, 103, 104].map((t) => ({ t, peso: 2 }));
    const r = curvaDeInteres({ duracion: 200, marcas })!;
    expect(r.peso).toBe(0.25);
    expect(interesMedio(r.curva, 98, 106)).toBeGreaterThan(interesMedio(r.curva, 10, 18));
  });
  it("el pico del principio (gente que revisiona la intro) no domina la curva", () => {
    const bruto = heatmapPlano(100, 200, { i: 50, v: 0.8 });
    bruto[0].value = 1;
    const r = curvaDeInteres({ duracion: 200, heatmap: normalizarHeatmap(bruto, 200) })!;
    expect(interesMedio(r.curva, 100, 102)).toBeGreaterThan(interesMedio(r.curva, 0, 2));
  });
  it("si lo único que destaca es la intro, no hay señal → null", () => {
    const bruto = heatmapPlano(100, 200, { i: 0, v: 1 });
    expect(curvaDeInteres({ duracion: 200, heatmap: normalizarHeatmap(bruto, 200) })).toBeNull();
  });
  it("una curva totalmente plana no aporta señal → null", () => {
    expect(curvaDeInteres({ duracion: 200, heatmap: normalizarHeatmap(heatmapPlano(100, 200), 200) })).toBeNull();
  });
});

describe("interesMedio", () => {
  it("media del tramo y 0 fuera de rango", () => {
    expect(interesMedio([0, 50, 100, 100], 1, 3)).toBe(75);
    expect(interesMedio([10, 20], 5, 9)).toBe(0);
  });
});

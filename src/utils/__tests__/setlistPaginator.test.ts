import { describe, it, expect } from "vitest";
import {
  ItemKind,
  maxFontPtForWidth,
  partitionItems,
  planPages,
} from "../setlistPaginator";

// Altura sintética: cada fila mide `rowFactor * fontPt` px (como un título con interlineado 1).
const linear = (n: number, rowFactor = 1.6) => (pt: number) =>
  new Array(n).fill(pt * rowFactor);

const songs = (n: number): ItemKind[] => new Array(n).fill("song");

describe("planPages", () => {
  it("un set corto cabe en una hoja y sube la letra hasta el techo", () => {
    const plan = planPages({
      kinds: songs(6),
      heightsAt: linear(6),
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 48,
    });
    expect(plan.pages).toHaveLength(1);
    expect(plan.fontPt).toBe(48);
  });

  it("llena la hoja con letra más grande cuanto menos temas hay", () => {
    const base = { availableHeightPx: 1000, minFontPt: 17, comfortFontPt: 19, maxFontPt: 60 };
    const few = planPages({ ...base, kinds: songs(5), heightsAt: linear(5) });
    const many = planPages({ ...base, kinds: songs(12), heightsAt: linear(12) });
    expect(few.fontPt).toBeGreaterThan(many.fontPt);
    expect(many.pages).toHaveLength(1);
  });

  it("parte en dos hojas cuando una sola obligaría a letra incómoda", () => {
    // 20 filas * 1.6 * pt <= 1000 -> a 1 hoja cabe a 31pt; forzamos que 1 hoja dé < comfort.
    const plan = planPages({
      kinds: songs(40),
      heightsAt: linear(40),
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 48,
    });
    // 1 hoja: 40*1.6*pt<=1000 -> 15pt (<17): no legible. 2 hojas: 31pt.
    expect(plan.pages.length).toBe(2);
    expect(plan.fontPt).toBeGreaterThanOrEqual(19);
    // Reparto equilibrado: 20/20, no 38/2.
    expect(plan.pages[0].to - plan.pages[0].from).toBe(20);
  });

  it("no deja una hoja con dos temas sueltos", () => {
    const plan = planPages({
      kinds: songs(31),
      heightsAt: linear(31),
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 48,
    });
    const counts = plan.pages.map((p) => p.to - p.from);
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(Math.floor(31 / counts.length) - 1);
  });

  it("nunca acaba una hoja con un encabezado de bloque colgando", () => {
    const kinds: ItemKind[] = [
      "header", "song", "song", "song", "song",
      "header", "song", "song", "song", "song",
      "bis", "song", "song",
    ];
    const plan = planPages({
      kinds,
      heightsAt: linear(kinds.length),
      availableHeightPx: 360,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 20,
    });
    expect(plan.pages.length).toBeGreaterThan(1);
    for (const p of plan.pages) {
      expect(kinds[p.to - 1]).not.toBe("header");
      expect(kinds[p.to - 1]).not.toBe("bis");
    }
  });

  it("prefiere cortar justo antes de un bloque nuevo", () => {
    const kinds: ItemKind[] = [
      "header", "song", "song", "song", "song",
      "header", "song", "song", "song", "song",
    ];
    const plan = planPages({
      kinds,
      heightsAt: linear(kinds.length),
      availableHeightPx: 5 * 1.6 * 20 + 5,
      fillTarget: 1,
      minFontPt: 20,
      comfortFontPt: 20,
      maxFontPt: 20,
    });
    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[1].from).toBe(5);
  });

  it("todos los items quedan repartidos, en orden y sin solaparse", () => {
    const kinds: ItemKind[] = [
      "header", "song", "song", "other", "song", "bis", "song", "song", "song", "song",
      "song", "song", "header", "song", "song", "song",
    ];
    const plan = planPages({
      kinds,
      heightsAt: linear(kinds.length),
      availableHeightPx: 300,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 30,
    });
    let cursor = 0;
    for (const p of plan.pages) {
      expect(p.from).toBe(cursor);
      expect(p.to).toBeGreaterThan(p.from);
      cursor = p.to;
    }
    expect(cursor).toBe(kinds.length);
  });

  it("el aire entre filas respeta el tope y nunca desborda la hoja", () => {
    const plan = planPages({
      kinds: songs(3),
      heightsAt: linear(3),
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 20,
    });
    const page = plan.pages[0];
    const fontPx = (plan.fontPt * 96) / 72;
    expect(page.rowGapPx).toBeLessThanOrEqual(fontPx * 0.55 + 0.001);
    expect(page.usedPx + page.rowGapPx * (page.to - page.from - 1)).toBeLessThanOrEqual(1000);
  });

  it("deja aire: con fillTarget 0.9 no llena la hoja hasta el borde", () => {
    const base = {
      kinds: songs(10),
      heightsAt: linear(10),
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 60,
    };
    const tight = planPages({ ...base, fillTarget: 1 });
    const roomy = planPages({ ...base, fillTarget: 0.9 });
    expect(roomy.fontPt).toBeLessThan(tight.fontPt);
    expect(roomy.pages[0].usedPx).toBeLessThanOrEqual(900 + 0.5);
  });

  it("modo letra máxima: sube la comodidad y reparte en más hojas", () => {
    const base = {
      kinds: songs(14),
      heightsAt: linear(14),
      availableHeightPx: 1000,
      minFontPt: 17,
      maxFontPt: 60,
    };
    const normal = planPages({ ...base, comfortFontPt: 19 });
    const grande = planPages({ ...base, comfortFontPt: 40 });
    expect(grande.pages.length).toBeGreaterThanOrEqual(normal.pages.length);
    expect(grande.fontPt).toBeGreaterThanOrEqual(normal.fontPt - 1);
  });

  it("repertorio vacío: una hoja vacía sin romper", () => {
    const plan = planPages({
      kinds: [],
      heightsAt: () => [],
      availableHeightPx: 1000,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 48,
    });
    expect(plan.pages).toHaveLength(1);
  });

  it("si ni con el máximo de hojas cabe a la letra mínima, baja del mínimo antes que perder temas", () => {
    const plan = planPages({
      kinds: songs(60),
      heightsAt: linear(60),
      availableHeightPx: 200,
      minFontPt: 17,
      comfortFontPt: 19,
      maxFontPt: 48,
      floorFontPt: 10,
      maxPages: 2,
    });
    expect(plan.pages).toHaveLength(2);
    expect(plan.fontPt).toBeLessThan(17);
  });
});

describe("planPages con hojas impuestas", () => {
  const base = {
    availableHeightPx: 1000,
    minFontPt: 17,
    comfortFontPt: 19,
    maxFontPt: 40,
    heightsAt: linear(30),
    kinds: songs(30),
  };

  it("1 hoja con 30 temas baja de la letra mínima antes que dejar temas fuera", () => {
    const plan = planPages({ ...base, availableHeightPx: 600, forcedPages: 1 });
    expect(plan.pages).toHaveLength(1);
    expect(plan.pages[0].to - plan.pages[0].from).toBe(30);
    expect(plan.fontPt).toBeLessThan(17);
    expect(plan.pages[0].usedPx).toBeLessThanOrEqual(600);
  });

  it("más hojas = letra mayor, y todas respetan el reparto equilibrado", () => {
    const one = planPages({ ...base, forcedPages: 1 });
    const two = planPages({ ...base, forcedPages: 2 });
    const three = planPages({ ...base, forcedPages: 3 });
    expect(two.fontPt).toBeGreaterThan(one.fontPt);
    expect(three.fontPt).toBeGreaterThanOrEqual(two.fontPt);
    expect(two.pages).toHaveLength(2);
    expect(three.pages).toHaveLength(3);
    expect(Math.abs(two.pages[0].to - two.pages[0].from - 15)).toBeLessThanOrEqual(1);
  });

  it("pedir más hojas que temas no rompe: se limita al nº de items", () => {
    const plan = planPages({ ...base, kinds: songs(2), heightsAt: linear(2), forcedPages: 5 });
    expect(plan.pages).toHaveLength(2);
  });

  it("con hojas impuestas sigue sin dejar un encabezado colgando", () => {
    const kinds: ItemKind[] = ["header", "song", "song", "header", "song", "song"];
    const plan = planPages({
      ...base,
      kinds,
      heightsAt: linear(kinds.length),
      forcedPages: 2,
    });
    for (const p of plan.pages) expect(kinds[p.to - 1]).not.toBe("header");
  });
});

describe("partitionItems", () => {
  it("devuelve null si un solo item no cabe en una hoja", () => {
    expect(partitionItems(["song"], [500], 1, 100)).toBeNull();
  });
});

describe("maxFontPtForWidth", () => {
  it("el título más ancho fija el techo de letra", () => {
    // A 100px mide 800px; la fila admite 400px -> 50px -> 37.5pt.
    expect(maxFontPtForWidth(800, 400)).toBeCloseTo(37.5, 1);
  });
});

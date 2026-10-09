import { describe, it, expect } from "vitest";
import {
  buildStageSetlistHtml,
  generatePdfStylesheet,
  getTokenValueForPrint,
  type StageSheetOptions,
} from "../repertorioPdf";
import { formatItemDuration, formatSecondsToMinutes } from "../repertorioUtils";
import type { Setlist, Song } from "../../types";

describe("repertorioPdf: estilos", () => {
  it("getTokenValueForPrint devuelve un fallback seguro cuando no hay DOM", () => {
    expect(getTokenValueForPrint("--bg")).toBe("#666666");
  });

  it("generatePdfStylesheet genera CSS con las clases clave", () => {
    const css = generatePdfStylesheet();
    expect(css).toContain(".set-table");
    expect(css).toContain(".key-badge");
    expect(css).toContain(".header");
    expect(css).toContain("body {");
  });
});

// Datos ficticios (nada de bandas reales)
const cancion = (over: Partial<Song> = {}): Song =>
  ({
    id: "s1",
    titulo: "Tema Uno",
    duracion: "3:30",
    duracionSegundos: 210,
    tonalidad: "Am",
    bpm: 120,
    ...over,
  }) as Song;

const setlist = (items: Setlist["items"]): Setlist =>
  ({ id: "sl1", nombre: "Show Demo", items }) as Setlist;

const opts = (over: Partial<StageSheetOptions> = {}): StageSheetOptions => ({
  setlist: setlist([{ id: "i1", tipoItem: "cancion", songId: "s1" }]),
  songs: [cancion()],
  metrics: { formattedTime: "3m 30s", songCount: 1, avgBpm: 120 },
  bandDisplayName: "Banda Demo",
  stylesheet: "/*css*/",
  colors: { ok: "#0f0", acc: "#f80", sunken: "#111" },
  ...over,
});

describe("buildStageSetlistHtml", () => {
  it("incluye cabecera, métricas y la canción numerada", () => {
    const html = buildStageSetlistHtml(opts());
    expect(html).toContain("BANDA DEMO — HOJA DE ESCENARIO");
    expect(html).toContain("Show Demo (3m 30s • 1 Temas)");
    expect(html).toContain("AVG BPM: 120");
    expect(html).toContain('<td class="num">1</td>');
    expect(html).toContain("Tema Uno");
  });

  it("usa la tonalidad deseada del ítem por encima de la del tema", () => {
    const html = buildStageSetlistHtml(
      opts({
        setlist: setlist([
          { id: "i1", tipoItem: "cancion", songId: "s1", tonalidadDeseada: "Cm" },
        ]),
      }),
    );
    expect(html).toContain('<span class="key-badge">Cm</span>');
    expect(html).not.toContain('<span class="key-badge">Am</span>');
  });

  it("omite canciones que ya no existen en el catálogo", () => {
    const html = buildStageSetlistHtml(
      opts({
        setlist: setlist([{ id: "i1", tipoItem: "cancion", songId: "borrada" }]),
      }),
    );
    expect(html).not.toContain('class="num"');
  });

  it("pinta cabeceras de bloque y eventos con su duración", () => {
    const html = buildStageSetlistHtml(
      opts({
        setlist: setlist([
          { id: "h", tipoItem: "bloque", bloqueSubtipo: "header", tituloCustom: "Bloque 1" },
          {
            id: "c",
            tipoItem: "chapa",
            tituloCustom: "Charla",
            duracionEstimadaSegundos: 90,
            notaTema: "Agradecer a la sala",
          },
        ]),
      }),
    );
    expect(html).toContain("Bloque 1");
    expect(html).toContain("Charla");
    expect(html).toContain("1m 30s");
    expect(html).toContain("CUE: Agradecer a la sala");
  });

  it("escapa HTML en textos de usuario (no se puede inyectar script en la ventana de impresión)", () => {
    const html = buildStageSetlistHtml(
      opts({
        songs: [cancion({ titulo: '<img src=x onerror="alert(1)">' })],
        bandDisplayName: "<script>alert(2)</script>",
      }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert(2)");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    // El único <script> permitido es el de window.print() de la propia plantilla
    expect(html.match(/<script>/g)).toHaveLength(1);
  });
});

describe("helpers de duración", () => {
  it("formatSecondsToMinutes", () => {
    expect(formatSecondsToMinutes(120)).toBe("2 min");
    expect(formatSecondsToMinutes(150)).toBe("2m 30s");
    expect(formatSecondsToMinutes(0)).toBe("0 min");
  });

  it("formatItemDuration prioriza segundos sobre minutos", () => {
    expect(formatItemDuration({ id: "x", duracionEstimadaSegundos: 90 })).toBe("1m 30s");
    expect(formatItemDuration({ id: "x", duracionEstimadaSegundos: 120 })).toBe("2 min");
    expect(formatItemDuration({ id: "x", duracionEstimadaMinutos: 3 })).toBe("3 min");
    expect(formatItemDuration({ id: "x" })).toBe("0 min");
  });
});

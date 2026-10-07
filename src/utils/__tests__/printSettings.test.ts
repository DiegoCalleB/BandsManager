import { describe, it, expect } from "vitest";
import { DEFAULT_PRINT_SETTINGS, mergePrintSettings, sanitizePrintSettings } from "../printSettings";

describe("sanitizePrintSettings", () => {
  it("acepta valores válidos de cada clave", () => {
    const ok = {
      textAlign: "center",
      columnsChoice: 2,
      showGeneralNotes: false,
      showTonality: true,
      showBpm: true,
      showDuration: true,
      showBandLogo: false,
      showWatermark: false,
      showAppBranding: false,
      handwritingFont: "sans",
      handwritingColor: "black",
    };
    expect(sanitizePrintSettings(ok)).toEqual(ok);
  });

  it("descarta claves desconocidas: no se puede guardar nada más que la lista blanca", () => {
    expect(
      sanitizePrintSettings({ textAlign: "left", band_id: "otra-banda", __proto__: { x: 1 }, notas: "x".repeat(1e5) }),
    ).toEqual({ textAlign: "left" });
  });

  it("descarta valores fuera del enum o de tipo erróneo", () => {
    expect(
      sanitizePrintSettings({
        textAlign: "right",
        columnsChoice: 3,
        showBpm: "yes",
        showTonality: 1,
        handwritingFont: "comic",
        handwritingColor: null,
      }),
    ).toEqual({});
  });

  it("columnsChoice acepta 'auto', 1 y 2, pero no sus versiones en texto", () => {
    expect(sanitizePrintSettings({ columnsChoice: "auto" })).toEqual({ columnsChoice: "auto" });
    expect(sanitizePrintSettings({ columnsChoice: 1 })).toEqual({ columnsChoice: 1 });
    expect(sanitizePrintSettings({ columnsChoice: "2" })).toEqual({});
  });

  it("entradas que no son un objeto dan vacío", () => {
    for (const x of [null, undefined, 3, "texto", [], [{ textAlign: "left" }]]) {
      expect(sanitizePrintSettings(x)).toEqual({});
    }
  });
});

describe("mergePrintSettings", () => {
  it("sin nada guardado devuelve los valores por defecto", () => {
    expect(mergePrintSettings(null)).toEqual(DEFAULT_PRINT_SETTINGS);
  });

  it("un guardado incompleto o antiguo se completa con los valores por defecto", () => {
    const m = mergePrintSettings({ textAlign: "center", showBpm: true });
    expect(m.textAlign).toBe("center");
    expect(m.showBpm).toBe(true);
    expect(m.columnsChoice).toBe(DEFAULT_PRINT_SETTINGS.columnsChoice);
    expect(m.handwritingColor).toBe(DEFAULT_PRINT_SETTINGS.handwritingColor);
  });

  it("un guardado corrupto no rompe: lo inválido cae al valor por defecto", () => {
    const m = mergePrintSettings({ textAlign: "diagonal", showBpm: "sí" });
    expect(m).toEqual(DEFAULT_PRINT_SETTINGS);
  });

  it("los valores por defecto coinciden con el comportamiento anterior del modal", () => {
    expect(DEFAULT_PRINT_SETTINGS).toMatchObject({
      textAlign: "left",
      columnsChoice: "auto",
      showWatermark: true,
      showTonality: false,
      showBpm: false,
    });
  });
});

describe("badgesScope y markedSongs", () => {
  it("acepta el ámbito y los temas marcados por músico", () => {
    expect(sanitizePrintSettings({ badgesScope: "marked", markedSongs: { paco: ["a", "b", "a"], vacio: [] } })).toEqual({
      badgesScope: "marked",
      markedSongs: { paco: ["a", "b"] },
    });
  });

  it("descarta ámbito inválido y limpia basura en los marcados", () => {
    const out = sanitizePrintSettings({
      badgesScope: "some",
      markedSongs: { ok: ["x", 3, null, "y".repeat(500)], mal: "texto", arr: { 0: "x" } },
    });
    expect(out).toEqual({ markedSongs: { ok: ["x"] } });
  });

  it("por defecto: tono/BPM en todos los temas y sin marcas", () => {
    expect(DEFAULT_PRINT_SETTINGS.badgesScope).toBe("all");
    expect(mergePrintSettings(null).markedSongs).toEqual({});
  });
});

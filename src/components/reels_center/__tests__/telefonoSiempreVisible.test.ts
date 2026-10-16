import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * El móvil de vista previa tiene que quedarse a la vista al hacer scroll en escritorio.
 * `sticky` falla EN SILENCIO si un ancestro tiene overflow-x-hidden (crea su propio contenedor de
 * scroll) o si la rejilla estira las columnas (items-stretch), así que se fija aquí.
 */
const sinComentarios = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
const layout = sinComentarios(readFileSync(new URL("../ReelsCenterLayout.tsx", import.meta.url), "utf8"));
const panel = readFileSync(new URL("../ReelsPhonePreviewPanel.tsx", import.meta.url), "utf8");

describe("móvil de vista previa siempre visible (escritorio)", () => {
  it("el panel del móvil es sticky en xl y no pasa de la altura de la pantalla", () => {
    expect(panel).toMatch(/xl:sticky/);
    expect(panel).toMatch(/xl:top-\d+/);
    expect(panel).toMatch(/xl:max-h-\[calc\(100vh-/);
    expect(panel).toMatch(/xl:overflow-y-auto/);
  });

  it("la rejilla no estira las columnas: sin items-start el sticky no tiene recorrido", () => {
    expect(layout).toMatch(/xl:grid-cols-12 gap-6 items-start/);
    expect(layout).not.toMatch(/xl:grid-cols-12 gap-6 items-stretch/);
  });

  it("la raíz recorta con overflow-x-clip, no con overflow-x-hidden (que rompe el sticky)", () => {
    expect(layout).toMatch(/data-modulo="reels"[\s\S]{0,200}overflow-x-clip/);
    expect(layout).not.toMatch(/overflow-x-hidden/);
  });

  it("en móvil/tablet no cambia nada: todo lo sticky va prefijado con xl:", () => {
    expect(panel).not.toMatch(/(^|[\s"`])sticky/);
  });
});

import { describe, it, expect } from "vitest";
import { generatePdfStylesheet, getTokenValueForPrint } from "../repertorioPdf";

describe("repertorioPdf", () => {
  it("getTokenValueForPrint devuelve un fallback seguro cuando no hay DOM", () => {
    const val = getTokenValueForPrint("--bg");
    expect(val).toBe("#666666");
  });

  it("generatePdfStylesheet genera estilos CSS válidos conteniendo clases clave", () => {
    const css = generatePdfStylesheet();
    expect(css).toContain(".set-table");
    expect(css).toContain(".key-badge");
    expect(css).toContain(".header");
    expect(css).toContain("body {");
  });
});

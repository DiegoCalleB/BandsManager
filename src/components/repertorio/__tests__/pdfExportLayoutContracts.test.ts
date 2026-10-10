import { readPdfExportModule } from "./pdfExportSource";
import { describe, it, expect } from "vitest";

// Contratos de maquetación que ya fallaron una vez con datos reales (Ruta 66) y que ninguna prueba
// con datos de ejemplo detectaba. Son comprobaciones estáticas del CSS de impresión.
const source = readPdfExportModule();

/** Cuerpo de la primera regla CSS cuyo selector sea exactamente `selector`. */
function regla(selector: string): string {
  const m = source.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
  expect(m, `no se encontró la regla ${selector}`).not.toBeNull();
  return m![1];
}

describe("CSS de impresión: el alto de la cabecera no puede depender de que cargue una imagen", () => {
  // La hoja se mide en un iframe oculto ANTES de que el logo remoto cargue. Con `max-height` el
  // <img> sin cargar mide 0px, la cabecera se mide más baja de lo que luego imprime y la última
  // canción cae a una hoja extra ("Hoja 1 de 1" con 2 hojas físicas).
  it(".band-logo-img tiene alto fijo (height), no solo max-height", () => {
    expect(regla(".band-logo-img")).toMatch(/(^|[\s;])height\s*:\s*\d+px/);
  });

  it("el logo de la cabecera centrada también tiene alto fijo", () => {
    expect(regla(".is-centered .band-logo-img")).toMatch(/(^|[\s;])height\s*:\s*\d+px/);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// El setlist impreso se construye concatenando HTML con datos de la banda (títulos, notas de
// cada músico, nombres). Esa ventana (`window.open("")`) es del mismo origen que la app, así que
// un "<img onerror=...>" en una nota de un miembro ejecutaría JS con su sesión. Invariante: todo
// `${...}` que meta uno de esos campos en el HTML pasa por escapeHtml.
const FILE = resolve(__dirname, "../PdfExportModal.tsx");
const USER_FIELDS =
  /\b(titulo|tituloCustom|notaTema|notas|bandName|activeSetlist\.nombre|member\.name|member\.instrument|line\.text|truncatedTitle|customLogoUrl|absoluteLogoUrl)\b/;

describe("PdfExportModal: HTML de impresión", () => {
  const source = readFileSync(FILE, "utf8");
  // Solo las plantillas HTML (las que contienen etiquetas), no las llamadas de medición.
  const interpolations = [...source.matchAll(/\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)]
    .map((m) => ({ expr: m[1], index: m.index ?? 0 }))
    .filter(({ expr }) => USER_FIELDS.test(expr));

  it("encuentra interpolaciones de datos de usuario (la regla no es vacía)", () => {
    expect(interpolations.length).toBeGreaterThan(8);
  });

  it("ninguna interpolación de texto de usuario va sin escapeHtml", () => {
    const offenders = interpolations
      .filter(({ expr, index }) => {
        // Se ignoran las que no están dentro de HTML (p. ej. `item.notas ||` de una condición).
        const around = source.slice(Math.max(0, index - 160), index + expr.length + 40);
        const inHtml = /<[a-z!][^>]*\$\{|>\s*\$\{|\$\{[^}]*\}\s*<\/|="\$\{/.test(around);
        return inHtml && !expr.includes("escapeHtml(");
      })
      .map(({ expr }) => expr.trim());
    expect(offenders).toEqual([]);
  });

  it("el logo de reserva de la marca de agua no mete texto de usuario en JavaScript", () => {
    expect(source).not.toMatch(/onerror="[^"]*\$\{/);
  });
});

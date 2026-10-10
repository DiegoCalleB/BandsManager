import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repertorio = resolve(__dirname, "..");

const sourcesOf = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : sourcesOf(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

/**
 * Código completo del exportador PDF: el contenedor `PdfExportModal.tsx` más todo lo extraído a
 * `pdf_export/`. Los tests de contrato que leen el código fuente usan esto para seguir
 * protegiendo el HTML/CSS de impresión aunque el código cambie de archivo.
 */
export const readPdfExportModule = (): string =>
  [join(repertorio, "PdfExportModal.tsx"), ...sourcesOf(join(repertorio, "pdf_export"))]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

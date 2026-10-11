/**
 * Vista previa de las hojas reales que se imprimirán (clic en un tema para editar su nota).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { mmToPx } from "../../../utils/textFit";
import { usePdfExport } from "./PdfExportContext";

/**
 * Vista previa de las hojas reales que se imprimirán (clic en un tema para editar su nota).
 * @returns Sección de interfaz.
 */
export function SheetPreviewPane() {
  const { previewBoxRef, previewDoc, previewScale, previewHeightPx, previewFrameRef, previewLoading } = usePdfExport();
  return (
    <>
      {/* Vista previa: las hojas reales que se imprimirán (clic en un tema = editar su nota). */}
      <div
        ref={previewBoxRef}
        className="relative sm:flex-1 sm:overflow-y-auto p-3 sm:p-6 flex justify-center bg-[var(--sunken)]"
      >
        {previewDoc ? (
          <div
            className="shrink-0"
            style={{
              width: mmToPx(210) * previewScale,
              height: previewHeightPx * previewScale,
            }}
          >
            <iframe
              ref={previewFrameRef}
              title="Vista previa del setlist impreso"
              sandbox="allow-scripts"
              srcDoc={previewDoc.html}
              style={{
                width: mmToPx(210),
                height: previewHeightPx,
                border: 0,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                opacity: previewLoading ? 0.55 : 1,
                transition: "opacity 150ms",
              }}
            />
          </div>
        ) : (
          <p className="m-auto text-sm text-[var(--ink-2)]">Maquetando el setlist…</p>
        )}
        {previewLoading && previewDoc && (
          <span className="absolute top-3 right-4 rounded-[var(--r-pill)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">
            Actualizando…
          </span>
        )}
      </div>
    </>
  );
}

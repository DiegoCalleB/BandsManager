/**
 * Navegación entre hojas de la vista previa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { usePdfExport } from "./PdfExportContext";

/**
 * Navegación entre hojas de la vista previa.
 * @returns Sección de interfaz.
 */
export function SheetPager() {
  const { membersToExport, previewPageIndex, currentPreviewMember, setPreviewPageIndex } = usePdfExport();
  return (
    <>
      {/* Pager Navigation for Multiple Sheets — recortado en móvil: sin el texto largo"Previsualizando hoja X de Y", y los botones Anterior/Siguiente solo con icono (el
 texto competía por ancho con el badge del músico en pantallas pequeñas). */}
      {membersToExport.length > 1 && (
        <div
          className={`px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs font-sans shrink-0 ${"bg-[var(--sunken)]"}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline font-bold text-[var(--ink-2)] shrink-0">
              Previsualizando hoja {previewPageIndex + 1} de{" "}
              {membersToExport.length}:
            </span>
            <span className="sm:hidden font-bold text-[var(--ink-2)] shrink-0">
              {previewPageIndex + 1}/{membersToExport.length}
            </span>
            <span className="px-2.5 sm:px-3 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ink)] font-bold flex items-center gap-1.5 min-w-0 truncate">
              <span className="truncate">
                <ShowIcon inline emoji="👤" />{currentPreviewMember.name}
              </span>
              <span className="hidden sm:inline text-[var(--ink-2)] text-micro shrink-0">
                ({currentPreviewMember.instrument})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              disabled={previewPageIndex <= 0}
              onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
              className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />{" "}
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              disabled={previewPageIndex >= membersToExport.length - 1}
              onClick={() =>
                setPreviewPageIndex((p) =>
                  Math.min(membersToExport.length - 1, p + 1),
                )
              }
              className="p-1.5 sm:p-1 sm:px-3 rounded-[var(--r-pill)] bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="hidden sm:inline">Siguiente</span>{" "}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

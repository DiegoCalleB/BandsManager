/**
 * Cabecera del modal con título, métricas del setlist y botones de acción.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Printer, X, Zap } from "lucide-react";
import { Button } from "../../ui";
import { usePdfExport } from "./PdfExportContext";

/**
 * Cabecera del modal con título, métricas del setlist y botones de acción.
 * @returns Sección de interfaz.
 */
export function PdfExportHeader() {
  const { activeSetlist, activeSetlistMetrics, handlePrint, membersToExport, currentPreviewMember, onClose } = usePdfExport();
  return (
    <>
      <div
        className={`p-3 sm:p-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 max-sm:sticky max-sm:top-0 max-sm:z-10 ${"bg-[var(--sunken)]"}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden sm:flex p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm sm:text-lg text-[var(--ink)] truncate">
                Generador de repertorios
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-micro font-bold font-sans bg-[var(--surface)] text-[var(--ink)] shrink-0">
                Rock stage edition
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] font-sans mt-0.5 truncate">
              <span className="font-bold text-[var(--ink)]">
                {activeSetlist.nombre}
              </span>
              <span className="hidden sm:inline">
                {" "}
                ({activeSetlistMetrics.songCount} temas • Letras grandes
                para el suelo de escenario con notas a mano)
              </span>
              <span className="sm:hidden">
                {" "}
                · {activeSetlistMetrics.songCount} temas
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={() => handlePrint()}
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-[var(--r-pill)] font-sans text-xs font-bold transition-ui flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] active:scale-[0.97]/20"
          >
            <Printer className="w-4 h-4" />
            {/*"Músico(s)", no"Hoja(s)": cada uno puede generar más de una página física según
 el auto-ajuste (ver computeAutoFitPlan) — el número real de páginas no se sabe
 hasta medir el contenido, así que no se promete aquí. Texto completo solo en
 desktop; en móvil solo"Imprimir" para no competir por ancho con el resto del
 header. */}
            <span className="hidden sm:inline">
              Imprimir para {membersToExport.length}{" "}
              {membersToExport.length === 1 ? "Músico" : "Músicos"} (PDF)
            </span>
            <span className="sm:hidden">Imprimir</span>
          </button>
          {/* Solo la hoja del músico en vista (con SUS temas marcados): para mandársela o guardar su PDF. */}
          {membersToExport.length > 1 && currentPreviewMember && (
            <button
              onClick={() => handlePrint(currentPreviewMember)}
              title={`Imprimir o guardar en PDF solo la hoja de ${currentPreviewMember.name}`}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-[var(--r-pill)] font-sans text-xs font-bold transition-ui flex items-center gap-1.5 cursor-pointer bg-[var(--surface)] text-[var(--ink)] active:scale-[0.97]"
            >
              <Printer className="w-4 h-4" />
              <span className="max-w-[9rem] truncate">Solo {currentPreviewMember.name}</span>
            </button>
          )}
          <Button variant="ghost" size="sm" aria-label="Cerrar"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Customization Control Panel */}
    </>
  );
}

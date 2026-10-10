/**
 * Maqueta del modal de exportación: cabecera, panel de ajustes, paginador, vista previa y notas.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ModalPortal } from "../../common/ModalPortal";
import { MemberNotesHost } from "./MemberNotesHost";
import { PdfControlPanel } from "./PdfControlPanel";
import { usePdfExport } from "./PdfExportContext";
import { PdfExportHeader } from "./PdfExportHeader";
import { SheetPager } from "./SheetPager";
import { SheetPreviewPane } from "./SheetPreviewPane";

/**
 * Maqueta del modal de exportación: cabecera, panel de ajustes, paginador, vista previa y notas.
 * @returns Sección de interfaz.
 */
export function PdfExportLayout() {
  const { isOpen, onClose } = usePdfExport();
  return (
    <>
      <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/90 flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto overscroll-contain">
      <div
        className={`w-full max-w-7xl sm:max-h-[96vh] my-auto flex flex-col rounded-[var(--r-l)] sm:overflow-hidden ${"bg-[var(--surface)]"}`}
      >
        {/* Modal Top Header — recortado a lo esencial en móvil (badge decorativo e info extra
 ocultos: ver hidden/sm:inline-block y sm:block más abajo) para que en pantallas
 pequeñas no compita por espacio con los controles y la vista previa, que son lo que
 de verdad hace falta ver de un vistazo. */}
        <PdfExportHeader />
        <PdfControlPanel />
        <SheetPager />

        <SheetPreviewPane />
      </div>

      <MemberNotesHost />
      </div>
    </ModalPortal>
    </>
  );
}

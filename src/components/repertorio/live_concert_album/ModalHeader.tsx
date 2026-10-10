/**
 * Cabecera del modal: título, versión y botón de cierre.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Disc3, X } from "lucide-react";
import { Button } from "../../ui";
import { useLiveConcertAlbum } from "./LiveConcertAlbumContext";

/**
 * Cabecera del modal: título, versión y botón de cierre.
 * @returns Sección de interfaz.
 */
export function ModalHeader() {
  const { onClose } = useLiveConcertAlbum();
  return (
    <>
      <div
        className={`p-6 flex items-start justify-between ${"bg-[var(--acc)]/10"}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--acc)]  flex items-center justify-center text-[var(--on-acc)]">
            <Disc3 className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">
                Live concert to album generator
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-[var(--acc)]/20 text-[var(--ink)] rounded-[var(--r-pill)]">
                v2.0 Híbrido
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              Módulo para transformar conciertos en directo en un Disco
              completo, separando canciones y presentaciones.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" aria-label="Cerrar"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
}

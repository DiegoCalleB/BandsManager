/**
 * Cabecera del explorador con el acceso a descartados.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Ban,Search,X } from "lucide-react";
import { IconButton } from "../../ui";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Cabecera del explorador con el acceso a descartados.
 * @returns Sección de interfaz.
 */
export function ExplorerHeader() {
  const { discardedList, setShowDiscardedModal, onClose } = useGooglePlacesExplorer();
  return (
    <>
      <div className="p-4 sm:p-5 flex items-center justify-between shrink-0 bg-[var(--bg)]/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-[var(--acc)]">
                Buscador de Salas y Nuevos Leads (Scout Descubridor)
              </h2>
              <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/10 text-[var(--ink)] font-sans font-bold">
                IA + Google Places
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] font-sans">
              Busca y categoriza nuevas salas, ayuntamientos, festivales,
              grupos y agencias en cualquier ciudad y enriquece sus correos
              sin alucinar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {discardedList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDiscardedModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-bold bg-[var(--alert)]/10 hover:bg-[var(--alert)]/20 text-[var(--ink-2)] transition-ui cursor-pointer"
              title="Ver y gestionar sugerencias marcadas como no deseadas"
            >
              <Ban className="w-3.5 h-3.5 text-[var(--alert)]" />
              <span>{discardedList.length} no deseadas</span>
            </button>
          )}

          <IconButton
            label="Cerrar"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
    </>
  );
}

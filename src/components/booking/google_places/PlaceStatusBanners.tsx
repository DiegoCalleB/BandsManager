/**
 * Avisos de origen de búsqueda, error, extracción e importación.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle,CheckCircle2 } from "lucide-react";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Avisos de origen de búsqueda, error, extracción e importación.
 * @returns Sección de interfaz.
 */
export function PlaceStatusBanners() {
  const { searchSource, places, emailsFoundCount, searchError, extractStatus, importSuccessMsg } = useGooglePlacesExplorer();
  return (
    <>
      {searchSource && (
        <div className="flex items-center justify-between text-xs px-2 text-[var(--ink-2)]">
          <span>
            Fuente:{" "}
            <strong className="text-[var(--acc)]">{searchSource}</strong>
          </span>
          <span>
            Encontrados:{" "}
            <strong className="text-[var(--ink)]">{places.length}</strong>{" "}
            | Con email:{" "}
            <strong className="text-[var(--ok)]">
              {emailsFoundCount}
            </strong>
          </span>
        </div>
      )}

      {searchError && (
        <div className="p-3 bg-[var(--alert)]/10 text-[var(--ink-2)] text-xs rounded-[var(--r-m)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {extractStatus && (
        <div className="p-3 bg-[var(--tentative)]/10 text-[var(--tentative)] text-xs rounded-[var(--r-m)] flex items-center gap-2 animate-fadeIn">
          <span>{extractStatus}</span>
        </div>
      )}

      {importSuccessMsg && (
        <div className="p-3 bg-[var(--ok)]/10 text-[var(--ink-2)] text-xs rounded-[var(--r-m)] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
          <span>{importSuccessMsg}</span>
        </div>
      )}
    </>
  );
}

/**
 * Aviso temporal al descartar un lugar.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Ban,X } from "lucide-react";
import { IconButton } from "../../ui";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Aviso temporal al descartar un lugar.
 * @returns Sección de interfaz.
 */
export function PlaceDiscardToast() {
  const { discardToast, setDiscardToast } = useGooglePlacesExplorer();
  return (
    <>
      {discardToast && (
        <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--alert)]/15 text-[var(--ink)] text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-[var(--alert)] shrink-0" />
            <span>{discardToast}</span>
          </div>
          <IconButton
            label="Cerrar"
            variant="danger"
            size="icon-xs"
            onClick={() => setDiscardToast("")}
          >
            <X className="w-3 h-3" />
          </IconButton>
        </div>
      )}
    </>
  );
}

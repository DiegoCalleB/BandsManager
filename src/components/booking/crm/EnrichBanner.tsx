/**
 * Aviso del estado del enriquecimiento de direcciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MapPin, X } from "lucide-react";
import { IconButton } from "../../ui";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Aviso del estado del enriquecimiento de direcciones.
 * @returns Sección de interfaz.
 */
export function EnrichBanner() {
  const { enrichStatusMsg, setEnrichStatusMsg } = useBookingCrm();
  return (
    <>
      {/* Enrich Status Banner */}
      {enrichStatusMsg && (
      <div
        className={`p-2.5 rounded-[var(--r-m)] text-micro font-sans flex items-center justify-between gap-2 animate-fadeIn ${
          enrichStatusMsg.includes('¡Éxito!') ? 'bg-[var(--ok-soft)] text-[var(--ok)]' : 'bg-[var(--sunken)] text-[var(--ink-2)]'
        }`}
      >
        <div className="flex items-center gap-2">
          <MapPin
            className={`w-4 h-4 shrink-0 ${enrichStatusMsg.includes('¡Éxito!') ? 'text-[var(--ok)]' : 'text-[var(--ink-2)]'}`}
          />
          <span>{enrichStatusMsg}</span>
        </div>
        <IconButton
          label="Cerrar"
          size="icon-xs"
          type="button"
          onClick={() => setEnrichStatusMsg('')}
        >
          <X className="w-3.5 h-3.5" />
        </IconButton>
      </div>
      )}
    </>
  );
}

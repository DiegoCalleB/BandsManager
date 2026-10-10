/**
 * Explorador de lugares de Google Places para el CRM de booking.
 * Contenedor: controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import type { BookingCampaign,Lead } from "../../types";
import { GooglePlacesExplorerProvider } from "./google_places/GooglePlacesExplorerProvider";
import { GooglePlacesExplorerView } from "./google_places/GooglePlacesExplorerView";
import { useGooglePlacesExplorerController } from "./google_places/hooks/useGooglePlacesExplorerController";

export interface GooglePlacesExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLeads: (leads: Lead[]) => void;
  activeCampaign?: BookingCampaign | null;
  existingLeads?: Lead[];
  bandGenre?: string;
  bandName?: string;
  similarBands?: string[];
}


/**
 * Explorador de lugares de Google Places.
 * @param props Estado de apertura, campaña activa, leads existentes y callbacks.
 * @returns El modal con su contexto, o `null` si está cerrado.
 */
export function GooglePlacesExplorerModal({
  existingLeads = [],
  bandGenre = "",
  bandName = "",
  similarBands = [],
  ...props
}: GooglePlacesExplorerModalProps) {
  const controller = useGooglePlacesExplorerController({ ...props, existingLeads, bandGenre, bandName, similarBands });
  if (!props.isOpen) return null;

  return (
    <GooglePlacesExplorerProvider value={{ ...controller, ...props, existingLeads, bandGenre, bandName, similarBands }}>
      <GooglePlacesExplorerView />
    </GooglePlacesExplorerProvider>
  );
}

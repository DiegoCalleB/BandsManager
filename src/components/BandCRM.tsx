/**
 * CRM de bandas aliadas: contactos, intercambio de fechas (swaps), pitches y tono de comunicación.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `bandCRM/` (AGENTS.md §5.6).
 */
import type { Lead, ThemeColors } from "../types";
import { BandCrmLayout } from "./bandCRM/BandCrmLayout";
import { BandCrmProvider } from "./bandCRM/BandCrmProvider";
import { useBandCrmController } from "./bandCRM/hooks/useBandCrmController";

export interface BandCRMProps {
  colors: ThemeColors;
  leads?: Lead[];
  onAddLead?: (lead: Lead) => void;
  onUpdateLead?: (id: string, updatedFields: Partial<Lead>) => void;
  onDeleteBand?: (id: string) => void;
  currentBandId?: string;
  /** Nombre de la banda activa: firma los pitches (nunca el de otra banda). */
  bandName?: string;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
}

/**
 * Pantalla "Bandas" de la banda activa.
 * @param props Tema, leads, banda activa y callbacks de persistencia/navegación.
 * @returns La pantalla completa con su contexto.
 */
export default function BandCRM({ leads = [], ...props }: BandCRMProps) {
  const controller = useBandCrmController({
    bandName: props.bandName,
    currentBandId: props.currentBandId,
    leads,
    onUpdateLead: props.onUpdateLead,
    onAddLead: props.onAddLead,
  });

  return (
    <BandCrmProvider value={{ ...controller, ...props, leads }}>
      <BandCrmLayout />
    </BandCrmProvider>
  );
}

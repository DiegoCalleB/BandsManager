/**
 * Gestor de giras: vehículos, dietas, paradas, convocados y volcado a calendario y finanzas.
 * Orquesta controlador, contexto y vista; la lógica vive en `tour_manager/` (AGENTS.md §5.6).
 */
import type { MainView } from "../app/appViews";
import type { BookingCampaign,Concert,Lead,Payment,ThemeColors,Tour } from "../types";
import { TourManagerProvider } from "./tour_manager/TourManagerProvider";
import { TourManagerView } from "./tour_manager/TourManagerView";
import { useTourManagerController } from "./tour_manager/hooks/useTourManagerController";

export interface TourManagerProps {
  colors: ThemeColors;
  tours: Tour[];
  concerts: Concert[];
  leads?: Lead[];
  activeCampaign?: BookingCampaign | null;
  setActiveCampaign?: (campaign: BookingCampaign | null) => void;
  onAddLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  onSaveTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
  bandUsers?: Array<{
    id: string;
    name: string;
    username?: string;
    role?: string;
    instrument?: string;
    band_id?: string;
    bandName?: string;
  }>;
  currentUser?: {
    id?: string;
    name?: string;
    username?: string;
    role?: string;
    band_id?: string;
    instrument?: string;
  };
  currentBandId?: string;
  currentBandName?: string;
  onAddConcert?: (concert: Concert) => void;
  onUpdateConcert?: (id: string, updatedFields: Partial<Concert>) => void;
  onAddPayment?: (payment: Payment) => void;
  onNavigate?: (view: MainView, options?: Record<string, unknown>) => void;
}

/**
 * Gestor de giras de la banda activa.
 * @param props Giras, conciertos, leads, miembros y callbacks de persistencia.
 * @returns La pantalla con su contexto.
 */
export default function TourManager({ leads = [], bandUsers = [], currentBandId = "", currentBandName = "Tu Banda", ...props }: TourManagerProps) {
  const controller = useTourManagerController({
    bandUsers,
    leads,
    currentBandId,
    currentBandName,
    concerts: props.concerts,
    onUpdateConcert: props.onUpdateConcert,
    onAddConcert: props.onAddConcert,
    onSaveTour: props.onSaveTour,
    onAddPayment: props.onAddPayment,
    onDeleteTour: props.onDeleteTour,
  });

  return (
    <TourManagerProvider value={{ ...controller, ...props, leads, bandUsers, currentBandId, currentBandName }}>
      <TourManagerView />
    </TourManagerProvider>
  );
}

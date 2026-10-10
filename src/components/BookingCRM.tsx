/**
 * CRM de booking: salas, medios y grupos con filtros, rastreo, plantillas y negociación asistida.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `booking/crm/` (AGENTS.md §5.6).
 */
import type { BookingCampaign, Concert, EPKConfig, Lead, LeadStatus, ThemeColors, Tour, User } from '../types';
import { autoDetectVenueAddress, normalizeStatus, normalizeType, VENUE_ADDRESS_DATABASE } from '../utils/bookingUtils';
import { BookingCrmLayout } from './booking/crm/BookingCrmLayout';
import { BookingCrmProvider } from './booking/crm/BookingCrmProvider';
import { useBookingCrmController } from './booking/crm/hooks/useBookingCrmController';

// Re-exports históricos: otros módulos importan estos helpers desde la pantalla.
// eslint-disable-next-line react-refresh/only-export-components
export { autoDetectVenueAddress, normalizeStatus, normalizeType, VENUE_ADDRESS_DATABASE };

export interface BookingCRMProps {
  leads: Lead[];
  colors: ThemeColors;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  onAddLead?: (lead: Lead) => void;
  onDeleteLead?: (id: string) => void;
  onBulkDeleteLeads?: (ids: string[]) => void;
  initialSection?: 'salas' | 'medios' | 'grupos';
  onSectionChange?: (section: 'salas' | 'medios' | 'grupos' | 'bandas') => void;
  onNavigate?: (view: string, options?: Record<string, unknown>) => void;
  bandsCount?: number;
  initialStatusFilter?: LeadStatus | 'todos';
  initialSelectedLeadId?: string;
  epkConfig?: Partial<EPKConfig>;
  onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
  currentBandId?: string;
  currentUser?: User;
  bandName?: string;
  activeCampaign?: BookingCampaign | null;
  onCampaignChange?: (campaign: BookingCampaign | null) => void;
  concerts?: Concert[];
  tours?: Tour[];
}

/**
 * Pantalla "Booking" de la banda activa.
 * @param props Leads, campaña activa, EPK y callbacks de persistencia/navegación.
 * @returns La pantalla completa con su contexto.
 */
export default function BookingCRM({
  initialSection = 'salas',
  initialStatusFilter = 'todos',
  concerts = [],
  tours = [],
  ...props
}: BookingCRMProps) {
  const controller = useBookingCrmController({
    bandName: props.bandName,
    initialSection,
    onSectionChange: props.onSectionChange,
    initialStatusFilter,
    initialSelectedLeadId: props.initialSelectedLeadId,
    leads: props.leads,
    epkConfig: props.epkConfig,
    onUpdateEpkConfig: props.onUpdateEpkConfig,
    onUpdateLead: props.onUpdateLead,
    activeCampaign: props.activeCampaign,
    currentBandId: props.currentBandId,
    onAddLead: props.onAddLead,
    onDeleteLead: props.onDeleteLead,
  });

  return (
    <BookingCrmProvider value={{ ...controller, ...props, initialSection, initialStatusFilter, concerts, tours }}>
      <BookingCrmLayout />
    </BookingCrmProvider>
  );
}

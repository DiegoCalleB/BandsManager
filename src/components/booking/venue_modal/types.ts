import { Lead, LeadStatus, LeadType, Concert, EmailMessage, InteractionLog } from '../../../types';

export interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  normalizeType: (type?: string) => string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  sectionTab: 'salas' | 'medios' | 'grupos';
  activeCampaign?: any;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  isUploadingLeadLogo?: boolean;
  initialTab?: 'pitch' | 'emails' | 'intelligence' | 'bitacora';
  onFilterByRouteCity?: (city: string) => void;
  bandName?: string;
  concerts?: Concert[];
}

export type VenueModalTab = 'pitch' | 'emails' | 'intelligence' | 'bitacora';

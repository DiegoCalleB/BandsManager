/**
 * Lista de leads del CRM de booking en rejilla o tabla.
 * Contenedor: controlador + proveedor + vista (Strangler Fig, AGENTS.md §5.6).
 */
import React from "react";
import type { BookingCampaign,Concert,Lead,LeadStatus } from "../../types";
import { LeadsTableProvider } from "./leads_table/LeadsTableProvider";
import { LeadsTableView } from "./leads_table/LeadsTableView";
import { useLeadsTableController } from "./leads_table/hooks/useLeadsTableController";

export interface LeadsTableProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (
    lead: Lead,
    options?: {
      tab?: "info" | "emails" | "copilot" | "bitacora";
      pitchDraft?: string;
    },
  ) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string, name: string) => void;
  onLeadLogoUpload?: (file: File) => Promise<string | null> | void;
  viewMode: "grid" | "table";
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  normalizeType: (type?: string) => string;
  sectionTab?: "salas" | "medios" | "grupos";
  mediaTypeFilter?: "televisión" | "radio" | "redes" | "managements" | "todos";
  setMediaTypeFilter?: (
    type: "televisión" | "radio" | "redes" | "managements" | "todos",
  ) => void;
  selectedLeadIds?: string[];
  onToggleSelectLead?: (id: string, e?: React.MouseEvent) => void;
  onSelectAllFiltered?: () => void;
  onDeselectAll?: () => void;
  isAllSelected?: boolean;
  isSomeSelected?: boolean;
  activeCampaign?: BookingCampaign | null;
  onFilterByRouteCity?: (city: string) => void;
  effectiveBandName?: string;
  concerts?: Concert[];
}

/** Props con los valores por defecto ya aplicados. */
export type ResolvedLeadsTableProps = LeadsTableProps &
  Required<Pick<LeadsTableProps, "sectionTab" | "mediaTypeFilter" | "selectedLeadIds" | "isAllSelected" | "isSomeSelected" | "concerts">>;

/**
 * Lista de leads del CRM de booking.
 * @param props Leads, selección, modo de vista y callbacks de edición.
 * @returns La lista con su contexto.
 */
export const LeadsTable: React.FC<LeadsTableProps> = ({
  sectionTab = "salas",
  mediaTypeFilter = "todos",
  selectedLeadIds = [],
  isAllSelected = false,
  isSomeSelected = false,
  concerts = [],
  ...props
}) => {
  const resolved: ResolvedLeadsTableProps = { ...props, sectionTab, mediaTypeFilter, selectedLeadIds, isAllSelected, isSomeSelected, concerts };
  const controller = useLeadsTableController(resolved);
  return (
    <LeadsTableProvider value={{ ...controller, ...resolved }}>
      <LeadsTableView />
    </LeadsTableProvider>
  );
};

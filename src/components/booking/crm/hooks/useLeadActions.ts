/**
 * Acciones sobre un lead: abrir, editar, borrar, aprobar, rechazar, corregir estado, email manual y respuesta simulada.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, RefObject, SetStateAction } from "react";
import { Lead, LeadStatus, LeadType } from "../../../../types";
import { normalizeStatus } from "../../../../utils/bookingUtils";
import { leadStatusBadgeClass, leadStatusDotColor, leadStatusLabel } from "../../../../utils/leadStatusPresentation";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadActionsParams {
  setSelectedLead: Dispatch<SetStateAction<Lead>>;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  setIsEditingLeadInfo: Dispatch<SetStateAction<boolean>>;
  setIsRejecting: Dispatch<SetStateAction<boolean>>;
  setRejectionNotes: Dispatch<SetStateAction<string>>;
  setActiveTab: Dispatch<SetStateAction<"info" | "emails" | "copilot" | "bitacora">>;
  setVenueDetailInitialTab: Dispatch<SetStateAction<"info" | "emails" | "copilot" | "bitacora">>;
  setManualEmailBody: Dispatch<SetStateAction<string>>;
  setManualEmailSubject: Dispatch<SetStateAction<string>>;
  effectiveBandName: string;
  setManualEmailStatus: Dispatch<SetStateAction<string>>;
  interventionPanelRef: RefObject<HTMLDivElement>;
  leads: Lead[];
  selectedLead: Lead;
  setSelectedLeadIds: Dispatch<SetStateAction<string[]>>;
  onDeleteLead: (id: string) => void;
  searchTerm: string;
  selectedCityFilter: string;
  statusFilter: LeadStatus | "todos" | "seguimientos";
  typeFilter: LeadType | "todos" | "radio" | "tv" | "prensa" | "redes" | "podcast";
  minCapacityFilter: number;
  onlyFavoritesFilter: boolean;
  onlyVerifiedFilter: boolean;
  activeSavedFilterId: string;
}

/**
 * Acciones sobre un lead: abrir, editar, borrar, aprobar, rechazar, corregir estado, email manual y respuesta simulada.
 * @param params Estado y callbacks del contenedor ({@link LeadActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadActions({ setSelectedLead, setEditedPitch, setIsEditingPitch, setIsEditingLeadInfo, setIsRejecting, setRejectionNotes, setActiveTab, setVenueDetailInitialTab, setManualEmailBody, setManualEmailSubject, effectiveBandName, setManualEmailStatus, interventionPanelRef, leads, selectedLead, setSelectedLeadIds, onDeleteLead, searchTerm, selectedCityFilter, statusFilter, typeFilter, minCapacityFilter, onlyFavoritesFilter, onlyVerifiedFilter, activeSavedFilterId }: LeadActionsParams) {
  const getStatusDotColor = (status: LeadStatus | string) => leadStatusDotColor(normalizeStatus(status));

  const getStatusBadgeClass = (status: LeadStatus | string) => leadStatusBadgeClass(normalizeStatus(status));

  const getStatusLabel = (status: LeadStatus | string) => leadStatusLabel(normalizeStatus(status), String(status));

  const handleOpenLead = (lead: Lead, options?: { tab?: 'info' | 'emails' | 'copilot' | 'bitacora'; pitchDraft?: string }) => {
    setSelectedLead(lead);
    if (options?.pitchDraft) {
      setEditedPitch(options.pitchDraft);
    } else {
      setEditedPitch(lead.pitch_generado || '');
    }
    setIsEditingPitch(false);
    setIsEditingLeadInfo(false);
    setIsRejecting(false);
    setRejectionNotes('');

    const targetTab = options?.tab || (lead.estado === 'negociando' || lead.estado === 'interesado' ? 'emails' : 'info');
    setActiveTab(targetTab);
    setVenueDetailInitialTab(targetTab);
    setManualEmailBody('');
    setManualEmailSubject(
      lead.hilo_emails && lead.hilo_emails.length > 0
        ? `RE: ${lead.hilo_emails[lead.hilo_emails.length - 1].asunto}`
        : `Propuesta de concierto: ${effectiveBandName}`
    );
    setManualEmailStatus('');

    setTimeout(() => {
      interventionPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleDeleteSingleLead = (id: string, name?: string) => {
    const leadToDelete = leads.find((l) => l.id === id);
    const targetName = name || leadToDelete?.nombre_sala || 'esta sala';
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar "${targetName}" de tu CRM?\nSe eliminará de tu agenda y se guardará en la lista negra para no volver a sugerirla.`
      )
    ) {
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      setSelectedLeadIds((prev) => prev.filter((item) => item !== id));
      if (onDeleteLead) {
        onDeleteLead(id);
      }
    }
  };

  const textSub = 'text-[var(--ink-2)]';

  const textMuted = 'text-[var(--ink-2)]';

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCityFilter ? 1 : 0) +
    (statusFilter !== 'todos' ? 1 : 0) +
    (typeFilter !== 'todos' ? 1 : 0) +
    (minCapacityFilter > 0 ? 1 : 0) +
    (onlyFavoritesFilter ? 1 : 0) +
    (onlyVerifiedFilter ? 1 : 0) +
    (activeSavedFilterId ? 1 : 0);

  return { activeFiltersCount, handleOpenLead, handleDeleteSingleLead, getStatusBadgeClass, getStatusLabel, getStatusDotColor, textSub, textMuted };
}

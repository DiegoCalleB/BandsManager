/**
 * Selección múltiple, envío masivo, ciudades, interacciones y plantillas del CRM.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useCityChips } from "../../../../hooks/useCityChips";
import { useEmailTemplates } from "../../../../hooks/useEmailTemplates";
import { useGmailIntegration } from "../../../../hooks/useGmailIntegration";
import { useInteractionLog } from "../../../../hooks/useInteractionLog";
import { BookingCampaign, EPKConfig, Lead, LeadStatus, LeadType } from "../../../../types";
import { autoDetectVenueAddress } from "../../../../utils/bookingUtils";
import { BulkProgressItem } from "../../BulkProgressModal";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadSelectionAndTemplatesParams {
  leads: Lead[];
  sectionTab: "salas" | "medios" | "grupos";
  epkConfig: Partial<EPKConfig>;
  onUpdateEpkConfig: (newConfig: Partial<EPKConfig>) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: Dispatch<SetStateAction<string>>;
  selectedLead: Lead;
  setSelectedLead: Dispatch<SetStateAction<Lead>>;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  activeCampaign: BookingCampaign;
  setMinCapacityFilter: Dispatch<SetStateAction<number>>;
  setTypeFilter: Dispatch<SetStateAction<"todos" | LeadType | "radio" | "tv" | "prensa" | "redes" | "podcast">>;
  setStatusFilter: Dispatch<SetStateAction<LeadStatus | "todos" | "seguimientos">>;
  setSearchTerm: Dispatch<SetStateAction<string>>;
}

/**
 * Selección múltiple, envío masivo, ciudades, interacciones y plantillas del CRM.
 * @param params Estado y callbacks del contenedor ({@link LeadSelectionAndTemplatesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadSelectionAndTemplates({ leads, sectionTab, epkConfig, onUpdateEpkConfig, selectedCityFilter, setSelectedCityFilter, selectedLead, setSelectedLead, onUpdateLead, activeCampaign, setMinCapacityFilter, setTypeFilter, setStatusFilter, setSearchTerm }: LeadSelectionAndTemplatesParams) {
  // En móvil, tarjetas: la tabla de 10 columnas no cabe en 390 px.
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'grid' : 'table',
  );

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  const [bulkProgressState, setBulkProgressState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    items: BulkProgressItem[];
    currentIndex: number;
    totalCount: number;
    isCompleted: boolean;
  }>({
    isOpen: false,
    title: '',
    items: [],
    currentIndex: 0,
    totalCount: 0,
    isCompleted: false,
  });

  const {
    activeLeadsForSection,
    cityCounts,
    displayCityChips,
  } = useCityChips(leads, sectionTab, epkConfig, onUpdateEpkConfig, selectedCityFilter, setSelectedCityFilter);

  useInteractionLog(selectedLead, setSelectedLead, onUpdateLead);

  const {
    templateTab,
    setTemplateTab,
    testPromptResult,
    isTestingPrompt,
    isOptimizingTemplate,
    optimizationFeedbackMsg,
    setOptimizationFeedbackMsg,
    isGeneratingAllTemplates,
    handleGenerateAllFromBase,
    getActiveTemplateData,
    handleOptimizeTemplate,
    handleTestPrompt,
    handleSaveTemplates,
  } = useEmailTemplates();

  useGmailIntegration(selectedLead, setSelectedLead, onUpdateLead);

  const [filterByCampaign, setFilterByCampaign] = useState(
    Boolean(activeCampaign && (activeCampaign.isActive ?? activeCampaign.is_active ?? true))
  );

  // Automatically activate campaign filter & reset conflicting manual search filters whenever a campaign is active
  useEffect(() => {
    if (activeCampaign && (activeCampaign.isActive ?? activeCampaign.is_active ?? true)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- activa el filtro al haber una campaña activa
      setFilterByCampaign(true);
      if (sectionTab === 'salas') {
        setSelectedCityFilter('');
        setMinCapacityFilter(0);
        setTypeFilter('todos');
        setStatusFilter('todos');
        setSearchTerm('');
      }
    }
  }, [activeCampaign?.id, activeCampaign?.isActive, activeCampaign?.is_active]);

  // Keep selectedLead synchronized with the latest leads prop data
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l.id === selectedLead.id);
      if (updated && updated !== selectedLead) {
        setSelectedLead(updated);
      }
    }
  }, [leads]);

  // Automatically detect & save address when a lead is selected
  useEffect(() => {
    if (selectedLead && !selectedLead.direccion && selectedLead.nombre_sala) {
      const detected = autoDetectVenueAddress(selectedLead.nombre_sala, selectedLead.ciudad || '');
      if (detected) {
        onUpdateLead(selectedLead.id, { direccion: detected });
        setSelectedLead((prev) => (prev ? { ...prev, direccion: detected } : null));
      }
    }
  }, [selectedLead?.id, selectedLead?.nombre_sala, selectedLead?.direccion]);

  return { filterByCampaign, setSelectedLeadIds, setFilterByCampaign, viewMode, setViewMode, activeLeadsForSection, displayCityChips, cityCounts, selectedLeadIds, setBulkProgressState, templateTab, setTemplateTab, getActiveTemplateData, isTestingPrompt, testPromptResult, handleTestPrompt, handleSaveTemplates, handleOptimizeTemplate, isOptimizingTemplate, handleGenerateAllFromBase, isGeneratingAllTemplates, optimizationFeedbackMsg, setOptimizationFeedbackMsg, bulkProgressState };
}

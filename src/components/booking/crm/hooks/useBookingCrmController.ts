/**
 * Compone los hooks del CRM de booking (navegación, selección, edición, formularios, rastreo, filtrado y acciones).
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { BookingCampaign, EPKConfig, Lead, LeadStatus } from "../../../../types";
import { useCrmNavigation } from "./useCrmNavigation";
import { useLeadActions } from "./useLeadActions";
import { useLeadEditing } from "./useLeadEditing";
import { useLeadFiltering } from "./useLeadFiltering";
import { useLeadFormsAndEnrichment } from "./useLeadFormsAndEnrichment";
import { useLeadScraping } from "./useLeadScraping";
import { useLeadSelectionAndTemplates } from "./useLeadSelectionAndTemplates";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BookingCrmControllerParams {
  bandName: string;
  initialSection: "salas" | "medios" | "grupos";
  onSectionChange: (section: "salas" | "medios" | "grupos" | "bandas") => void;
  initialStatusFilter: LeadStatus | "todos";
  initialSelectedLeadId: string;
  leads: Lead[];
  epkConfig: Partial<EPKConfig>;
  onUpdateEpkConfig: (newConfig: Partial<EPKConfig>) => void;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  activeCampaign: BookingCampaign;
  currentBandId: string;
  onAddLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
}

/**
 * Compone los hooks del CRM de booking (navegación, selección, edición, formularios, rastreo, filtrado y acciones).
 * @param params Estado y callbacks del contenedor ({@link BookingCrmControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBookingCrmController({ bandName, initialSection, onSectionChange, initialStatusFilter, initialSelectedLeadId, leads, epkConfig, onUpdateEpkConfig, onUpdateLead, activeCampaign, currentBandId, onAddLead, onDeleteLead }: BookingCrmControllerParams) {
  const { sectionTab, selectedCityFilter, setSelectedCityFilter, selectedLead, setSelectedLead, setMinCapacityFilter, setTypeFilter, setStatusFilter, setSearchTerm, searchTerm, statusFilter, typeFilter, minCapacityFilter, routeAnchorCity, effectiveBandName, interventionPanelRef, onlyFavoritesFilter, onlyVerifiedFilter, activeSavedFilterId, bookingTutorial, setIsTemplatesSectionOpen, isMobileToolsOpen, setIsMobileToolsOpen, setIsAgentConfigOpen, isMobileFiltersOpen, setIsMobileFiltersOpen, handleSelectSectionTab, setOnlyFavoritesFilter, setOnlyVerifiedFilter, isSavingFilterOpen, setIsSavingFilterOpen, newFilterName, setNewFilterName, handleSaveCurrentFilter, savedFilters, handleApplySavedFilter, handleDeleteSavedFilter, handleClearAllFilters, setActiveSavedFilterId, setRouteAnchorCity, isTemplatesSectionOpen, isAgentConfigOpen } = useCrmNavigation({ bandName, initialSection, onSectionChange, initialStatusFilter, initialSelectedLeadId, leads });

  const { filterByCampaign, setSelectedLeadIds, setFilterByCampaign, viewMode, setViewMode, activeLeadsForSection, displayCityChips, cityCounts, selectedLeadIds, setBulkProgressState, templateTab, setTemplateTab, getActiveTemplateData, isTestingPrompt, testPromptResult, handleTestPrompt, handleSaveTemplates, handleOptimizeTemplate, isOptimizingTemplate, handleGenerateAllFromBase, isGeneratingAllTemplates, optimizationFeedbackMsg, setOptimizationFeedbackMsg, bulkProgressState } = useLeadSelectionAndTemplates({ leads, sectionTab, epkConfig, onUpdateEpkConfig, selectedCityFilter, setSelectedCityFilter, selectedLead, setSelectedLead, onUpdateLead, activeCampaign, setMinCapacityFilter, setTypeFilter, setStatusFilter, setSearchTerm });

  const { setEditedLeadInfo, setEditedPitch, setIsEditingPitch, setIsEditingLeadInfo, setIsRejecting, setRejectionNotes, setVenueDetailInitialTab, setIsExportLeadsOpen, duplicateGroupsCount, isDispatchingEmails, handleTriggerEnviadorAgent, setIsPlacesExplorerOpen, setIsExcelImportOpen, setIsDuplicatesModalOpen, setIsContactEnricherOpen, setIsQueueMonitorOpen, setRoadbookModalLead, setIsRoadbookModalOpen, venueDetailInitialTab, isPlacesExplorerOpen, isExcelImportOpen, isContactEnricherOpen, isExportLeadsOpen, isDuplicatesModalOpen, isRoadbookModalOpen, roadbookModalLead, isQueueMonitorOpen } = useLeadEditing({ leads });

  const { newLeadData, setIsModalScraping, setModalScrapeStatus, setModalScrapeError, setModalScrapeSuccessMsg, setNewLeadData, setIsAddingLeadModalOpen, setActiveTab, setManualEmailBody, setManualEmailSubject, setManualEmailStatus, isEnrichingAddresses, handleEnrichAddresses, enrichStatusMsg, setEnrichStatusMsg, handleLeadLogoUpload, isUploadingLeadLogo, isSimulatingAvanzado, simulationRole, simulationScenario, simulationSenderName, simulationSubject, simulationCustomInstruction, simulationMessage, simulationGenerated, isGeneratingSimulation, PREDEFINED_SCENARIOS, setIsSimulatingAvanzado, handleRoleChange, handleScenarioChange, setSimulationSenderName, setSimulationSubject, setSimulationCustomInstruction, setSimulationMessage, handleGenerateSimulationEmail, handleCommitSimulation, isAddingLeadModalOpen, isModalScraping, modalScrapeStatus, modalScrapeError, modalScrapeSuccessMsg } = useLeadFormsAndEnrichment({ currentBandId, setEditedLeadInfo, selectedLead, setSelectedLead, onUpdateLead });

  const { sectionLeads, filteredLeads } = useLeadFiltering({ leads, sectionTab, filterByCampaign, activeCampaign, searchTerm, statusFilter, typeFilter, selectedCityFilter, minCapacityFilter, routeAnchorCity });

  const { handleAddNewLeadSubmit, handleModalScrape } = useLeadScraping({ newLeadData, setIsModalScraping, setModalScrapeStatus, setModalScrapeError, setModalScrapeSuccessMsg, setNewLeadData, onUpdateLead, setSelectedLead, sectionTab, effectiveBandName, onAddLead, setIsAddingLeadModalOpen });

  const { activeFiltersCount, handleOpenLead, handleDeleteSingleLead, getStatusBadgeClass, getStatusLabel, getStatusDotColor, textSub, textMuted } = useLeadActions({ setSelectedLead, setEditedPitch, setIsEditingPitch, setIsEditingLeadInfo, setIsRejecting, setRejectionNotes, setActiveTab, setVenueDetailInitialTab, setManualEmailBody, setManualEmailSubject, effectiveBandName, setManualEmailStatus, interventionPanelRef, leads, selectedLead, setSelectedLeadIds, onDeleteLead, searchTerm, selectedCityFilter, statusFilter, typeFilter, minCapacityFilter, onlyFavoritesFilter, onlyVerifiedFilter, activeSavedFilterId });

  return { sectionTab, setNewLeadData, setIsAddingLeadModalOpen, bookingTutorial, setIsExportLeadsOpen, setIsTemplatesSectionOpen, isMobileToolsOpen, setIsMobileToolsOpen, duplicateGroupsCount, isDispatchingEmails, handleTriggerEnviadorAgent, setIsPlacesExplorerOpen, setIsExcelImportOpen, setIsDuplicatesModalOpen, setIsContactEnricherOpen, setIsAgentConfigOpen, setIsQueueMonitorOpen, setRoadbookModalLead, selectedLead, setIsRoadbookModalOpen, isEnrichingAddresses, handleEnrichAddresses, searchTerm, setSearchTerm, typeFilter, setTypeFilter, sectionLeads, activeFiltersCount, isMobileFiltersOpen, setIsMobileFiltersOpen, filterByCampaign, setFilterByCampaign, filteredLeads, viewMode, setViewMode, enrichStatusMsg, setEnrichStatusMsg, handleSelectSectionTab, onlyFavoritesFilter, setOnlyFavoritesFilter, onlyVerifiedFilter, setOnlyVerifiedFilter, minCapacityFilter, setMinCapacityFilter, isSavingFilterOpen, setIsSavingFilterOpen, newFilterName, setNewFilterName, handleSaveCurrentFilter, savedFilters, activeSavedFilterId, handleApplySavedFilter, handleDeleteSavedFilter, selectedCityFilter, setSelectedCityFilter, handleClearAllFilters, activeLeadsForSection, displayCityChips, cityCounts, setActiveSavedFilterId, handleOpenLead, effectiveBandName, statusFilter, setStatusFilter, routeAnchorCity, setRouteAnchorCity, selectedLeadIds, setSelectedLeadIds, setBulkProgressState, handleDeleteSingleLead, handleLeadLogoUpload, getStatusBadgeClass, getStatusLabel, setSelectedLead, getStatusDotColor, isUploadingLeadLogo, venueDetailInitialTab, isTemplatesSectionOpen, textSub, textMuted, templateTab, setTemplateTab, getActiveTemplateData, isTestingPrompt, testPromptResult, handleTestPrompt, handleSaveTemplates, handleOptimizeTemplate, isOptimizingTemplate, handleGenerateAllFromBase, isGeneratingAllTemplates, optimizationFeedbackMsg, setOptimizationFeedbackMsg, isSimulatingAvanzado, simulationRole, simulationScenario, simulationSenderName, simulationSubject, simulationCustomInstruction, simulationMessage, simulationGenerated, isGeneratingSimulation, PREDEFINED_SCENARIOS, setIsSimulatingAvanzado, handleRoleChange, handleScenarioChange, setSimulationSenderName, setSimulationSubject, setSimulationCustomInstruction, setSimulationMessage, handleGenerateSimulationEmail, handleCommitSimulation, isAddingLeadModalOpen, newLeadData, isModalScraping, modalScrapeStatus, modalScrapeError, modalScrapeSuccessMsg, handleAddNewLeadSubmit, handleModalScrape, isPlacesExplorerOpen, isExcelImportOpen, isContactEnricherOpen, isAgentConfigOpen, isExportLeadsOpen, isDuplicatesModalOpen, isRoadbookModalOpen, roadbookModalLead, isQueueMonitorOpen, bulkProgressState };
}

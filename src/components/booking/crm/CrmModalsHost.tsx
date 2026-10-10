/**
 * Modales del CRM: simulación, alta, explorador de lugares, importación, enriquecimiento, autonomía, exportación, duplicados, roadbook, cola, progreso masivo y tutorial.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ModuleTutorialModal } from "../../common/ModuleTutorialModal";
import { AgentAutonomySettingsModal } from "../../dashboard/AgentAutonomySettingsModal";
import { AddLeadModal } from "../AddLeadModal";
import { AgentQueueMonitorModal } from "../AgentQueueMonitorModal";
import { BulkProgressModal } from "../BulkProgressModal";
import { CRMContactEnricherModal } from "../CRMContactEnricherModal";
import { ExcelImportModal } from "../ExcelImportModal";
import { ExportLeadsModal } from "../ExportLeadsModal";
import { GooglePlacesExplorerModal } from "../GooglePlacesExplorerModal";
import { LeadDuplicatesModal } from "../LeadDuplicatesModal";
import { NegotiationSimulationModal } from "../NegotiationSimulationModal";
import { RoadbookContractModal } from "../RoadbookContractModal";
import { useBookingCrm } from "./BookingCrmContext";
import { isStitchLight } from "./crmTheme";

/**
 * Modales del CRM: simulación, alta, explorador de lugares, importación, enriquecimiento, autonomía, exportación, duplicados, roadbook, cola, progreso masivo y tutorial.
 * @returns Sección de interfaz.
 */
export function CrmModalsHost() {
  const { isSimulatingAvanzado, selectedLead, textSub, textMuted, simulationRole, simulationScenario, simulationSenderName, simulationSubject, simulationCustomInstruction, simulationMessage, simulationGenerated, isGeneratingSimulation, PREDEFINED_SCENARIOS, setIsSimulatingAvanzado, handleRoleChange, handleScenarioChange, setSimulationSenderName, setSimulationSubject, setSimulationCustomInstruction, setSimulationMessage, handleGenerateSimulationEmail, handleCommitSimulation, isAddingLeadModalOpen, sectionTab, newLeadData, setNewLeadData, isModalScraping, modalScrapeStatus, modalScrapeError, modalScrapeSuccessMsg, isUploadingLeadLogo, setIsAddingLeadModalOpen, handleAddNewLeadSubmit, handleModalScrape, handleLeadLogoUpload, isPlacesExplorerOpen, leads, activeCampaign, epkConfig, currentUser, effectiveBandName, setIsPlacesExplorerOpen, isExcelImportOpen, setIsExcelImportOpen, onAddLead, isContactEnricherOpen, setIsContactEnricherOpen, onUpdateLead, isAgentConfigOpen, setIsAgentConfigOpen, currentBandId, setIsTemplatesSectionOpen, isExportLeadsOpen, setIsExportLeadsOpen, filteredLeads, selectedLeadIds, isDuplicatesModalOpen, setIsDuplicatesModalOpen, handleDeleteSingleLead, isRoadbookModalOpen, setIsRoadbookModalOpen, setRoadbookModalLead, roadbookModalLead, concerts, isQueueMonitorOpen, setIsQueueMonitorOpen, bulkProgressState, setBulkProgressState, bookingTutorial } = useBookingCrm();
  return (
    <>
      {/* ADD NEW LEAD / MEDIO MODAL */}
      <NegotiationSimulationModal
      isOpen={isSimulatingAvanzado}
      selectedLead={selectedLead}
      textSub={textSub}
      textMuted={textMuted}
      simulationRole={simulationRole}
      simulationScenario={simulationScenario}
      simulationSenderName={simulationSenderName}
      simulationSubject={simulationSubject}
      simulationCustomInstruction={simulationCustomInstruction}
      simulationMessage={simulationMessage}
      simulationGenerated={simulationGenerated}
      isGeneratingSimulation={isGeneratingSimulation}
      predefinedScenarios={PREDEFINED_SCENARIOS}
      onClose={() => setIsSimulatingAvanzado(false)}
      onRoleChange={handleRoleChange}
      onScenarioChange={handleScenarioChange}
      onSenderNameChange={setSimulationSenderName}
      onSubjectChange={setSimulationSubject}
      onCustomInstructionChange={setSimulationCustomInstruction}
      onMessageChange={setSimulationMessage}
      onGenerate={handleGenerateSimulationEmail}
      onCommit={handleCommitSimulation}
      />

      <AddLeadModal
      isOpen={isAddingLeadModalOpen}
      sectionTab={sectionTab}
      textSub={textSub}
      newLeadData={newLeadData}
      setNewLeadData={setNewLeadData}
      isModalScraping={isModalScraping}
      modalScrapeStatus={modalScrapeStatus}
      modalScrapeError={modalScrapeError}
      modalScrapeSuccessMsg={modalScrapeSuccessMsg}
      isUploadingLeadLogo={isUploadingLeadLogo}
      onClose={() => setIsAddingLeadModalOpen(false)}
      onSubmit={handleAddNewLeadSubmit}
      onModalScrape={handleModalScrape}
      onLeadLogoUpload={(file) => handleLeadLogoUpload(file, false)}
      />

      <GooglePlacesExplorerModal
      isOpen={isPlacesExplorerOpen}
      existingLeads={leads}
      activeCampaign={activeCampaign}
      bandGenre={epkConfig?.genero || (currentUser as (typeof currentUser & { genero?: string }) | undefined)?.genero || ''}
      bandName={effectiveBandName}
      similarBands={epkConfig?.bandasSimilares || []}
      onClose={() => setIsPlacesExplorerOpen(false)}
      onImportLeads={() => {
      window.dispatchEvent(new CustomEvent('app-data-updated'));
      }}
      />

      <ExcelImportModal
      isOpen={isExcelImportOpen}
      existingLeads={leads}
      onClose={() => setIsExcelImportOpen(false)}
      onSuccess={(importedLeads) => {
      window.dispatchEvent(new CustomEvent('app-data-updated'));
      if (importedLeads.length > 0 && onAddLead) {
        importedLeads.forEach((l) => onAddLead(l));
      }
      }}
      />

      <CRMContactEnricherModal
      isOpen={isContactEnricherOpen}
      onClose={() => setIsContactEnricherOpen(false)}
      leads={leads}
      onUpdateLead={onUpdateLead}
      />

      <AgentAutonomySettingsModal
      isOpen={isAgentConfigOpen}
      onClose={() => setIsAgentConfigOpen(false)}
      bandName={effectiveBandName}
      bandId={currentBandId || currentUser?.band_id || ''}
      currentUser={currentUser}
      onOpenTemplatesSection={() => {
      setIsTemplatesSectionOpen(true);
      setTimeout(() => {
        const el = document.getElementById('ai-template-config-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      }}
      />

      <ExportLeadsModal
      isOpen={isExportLeadsOpen}
      onClose={() => setIsExportLeadsOpen(false)}
      allLeads={leads}
      filteredLeads={filteredLeads}
      selectedLeadIds={selectedLeadIds}
      bandName={effectiveBandName}
      />

      <LeadDuplicatesModal
      isOpen={isDuplicatesModalOpen}
      onClose={() => setIsDuplicatesModalOpen(false)}
      leads={leads}
      onUpdateLead={(lead) => onUpdateLead(lead.id, lead)}
      onDeleteLead={handleDeleteSingleLead}
      isStitchLight={isStitchLight}
      />

      <RoadbookContractModal
      isOpen={isRoadbookModalOpen}
      onClose={() => {
      setIsRoadbookModalOpen(false);
      setRoadbookModalLead(null);
      }}
      lead={roadbookModalLead}
      leads={leads}
      concerts={concerts}
      bandName={effectiveBandName}
      isStitchLight={isStitchLight}
      />

      <AgentQueueMonitorModal isOpen={isQueueMonitorOpen} onClose={() => setIsQueueMonitorOpen(false)} bandName={effectiveBandName} />

      {/* BULK PROGRESS MODAL */}
      <BulkProgressModal
      isOpen={bulkProgressState.isOpen}
      onClose={() => setBulkProgressState((prev) => ({ ...prev, isOpen: false }))}
      title={bulkProgressState.title}
      subtitle={bulkProgressState.subtitle}
      items={bulkProgressState.items}
      currentIndex={bulkProgressState.currentIndex}
      totalCount={bulkProgressState.totalCount}
      isCompleted={bulkProgressState.isCompleted}
      />

      {/* MODULE TUTORIAL MODAL */}
      <ModuleTutorialModal isOpen={bookingTutorial.isOpen} onClose={bookingTutorial.closeTutorial} moduleId="booking" />
    </>
  );
}

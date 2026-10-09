---
id: ui_booking_crm
title: "Booking CRM Component"
layer: frontend
domain: booking
file: "src/components/BookingCRM.tsx"
tags: ["ui", "booking", "crm"]
---

# 📌 Booking CRM Component

> **Ubicación:** `src/components/BookingCRM.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/booking`

## 📖 Descripción
Panel principal del embudo de contratación, gestión de salas y radar comercial.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(Layer: #hook, Domain: #booking)*
- [[src_components_DirectionsCard|src/components/DirectionsCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_VenueMap|src/components/VenueMap.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_AddLeadModal|src/components/booking/AddLeadModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(Layer: #agent, Domain: #booking)*
- [[src_components_booking_BookingFiltersPanel|src/components/booking/BookingFiltersPanel.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkLeadsActionBar|src/components/booking/BulkLeadsActionBar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_BulkProgressModal|src/components/booking/BulkProgressModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_CRMContactEnricherModal|src/components/booking/CRMContactEnricherModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_ExampleThreadsSection|src/components/booking/ExampleThreadsSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_ExportLeadsModal|src/components/booking/ExportLeadsModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_MorningBriefingRadar|src/components/booking/MorningBriefingRadar.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_NegotiationSimulationModal|src/components/booking/NegotiationSimulationModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_RoadbookContractModal|src/components/booking/RoadbookContractModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_TemplateConfigSection|src/components/booking/TemplateConfigSection.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_TemplateRecommendationsCard|src/components/booking/TemplateRecommendationsCard.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_booking_venue_modal_VenueWorkspaceModal|src/components/booking/venue_modal/VenueWorkspaceModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialTrigger|src/components/common/ModuleTutorialTrigger.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useCityChips|src/hooks/useCityChips.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useGmailIntegration|src/hooks/useGmailIntegration.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useInteractionLog|src/hooks/useInteractionLog.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useNegotiationSimulation|src/hooks/useNegotiationSimulation.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useSavedFilters|src/hooks/useSavedFilters.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_bookingFollowup|src/utils/bookingFollowup.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_campaignMatch|src/utils/campaignMatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_duplicateLeads|src/utils/duplicateLeads.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_leadReliability|src/utils/leadReliability.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_leadStatusPresentation|src/utils/leadStatusPresentation.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_tourRouting|src/utils/tourRouting.ts]] *(Layer: #service, Domain: #system)*
- [[ui_leads_table|Leads Table & Actions]] *(Layer: #frontend, Domain: #booking)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(Layer: #frontend, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

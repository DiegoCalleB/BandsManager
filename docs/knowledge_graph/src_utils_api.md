---
id: src_utils_api
title: "src/utils/api.ts"
layer: service
domain: system
file: "src/utils/api.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/api.ts

> **Ubicación:** `src/utils/api.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Centralized authenticated API fetch helper for BandsManager

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*
- [[src_components_booking_AddLeadModal|src/components/booking/AddLeadModal.tsx]] *(from #frontend)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(from #agent)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_booking_BoloConfirmadoSetlistModal|src/components/booking/BoloConfirmadoSetlistModal.tsx]] *(from #frontend)*
- [[src_components_booking_BookingSimulationModal|src/components/booking/BookingSimulationModal.tsx]] *(from #frontend)*
- [[src_components_booking_ChangeLeadImageModal|src/components/booking/ChangeLeadImageModal.tsx]] *(from #frontend)*
- [[src_components_booking_CRMContactEnricherModal|src/components/booking/CRMContactEnricherModal.tsx]] *(from #frontend)*
- [[src_components_booking_DealSupportCard|src/components/booking/DealSupportCard.tsx]] *(from #frontend)*
- [[src_components_booking_ExampleThreadsSection|src/components/booking/ExampleThreadsSection.tsx]] *(from #frontend)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(from #frontend)*
- [[src_components_booking_GooglePlacesExplorerModal|src/components/booking/GooglePlacesExplorerModal.tsx]] *(from #frontend)*
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenuePitchWorkspace|src/components/booking/venue_modal/VenuePitchWorkspace.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueMessageThread|src/components/booking/venue_panel/hooks/useVenueMessageThread.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(from #agent)*
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(from #frontend)*
- [[src_components_CalendarView|src/components/CalendarView.tsx]] *(from #frontend)*
- [[src_components_campaign_CampaignManagerModal|src/components/campaign/CampaignManagerModal.tsx]] *(from #frontend)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(from #agent)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(from #frontend)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_reels_ViralGrowthStudio|src/components/reels/ViralGrowthStudio.tsx]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiMusicModal|src/components/song_studio/SongStudioAiMusicModal.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_hooks_useApoyableDeals|src/hooks/useApoyableDeals.ts]] *(from #hook)*
- [[src_hooks_useColaLetras|src/hooks/useColaLetras.ts]] *(from #hook)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(from #hook)*
- [[src_hooks_useEmailValidation|src/hooks/useEmailValidation.ts]] *(from #hook)*
- [[src_hooks_useNegotiationSimulation|src/hooks/useNegotiationSimulation.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_utils_analisisAcordesCliente|src/utils/analisisAcordesCliente.ts]] *(from #service)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*
- [[ui_leads_table|Leads Table & Actions]] *(from #frontend)*
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

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
- [[src_components_band_switcher_hooks_useBandActions|src/components/band_switcher/hooks/useBandActions.ts]] *(from #frontend)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandBulkActions|src/components/bandCRM/hooks/useBandBulkActions.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrmData|src/components/bandCRM/hooks/useBandCrmData.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrud|src/components/bandCRM/hooks/useBandCrud.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandForm|src/components/bandCRM/hooks/useBandForm.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandToneAnalysis|src/components/bandCRM/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_bandCRM_SpotifySweepModal|src/components/bandCRM/SpotifySweepModal.tsx]] *(from #frontend)*
- [[src_components_booking_AddLeadModal|src/components/booking/AddLeadModal.tsx]] *(from #frontend)*
- [[src_components_booking_AgentQueueMonitorModal|src/components/booking/AgentQueueMonitorModal.tsx]] *(from #agent)*
- [[src_components_booking_BandPreviewPlayer|src/components/booking/BandPreviewPlayer.tsx]] *(from #frontend)*
- [[src_components_booking_BoloConfirmadoSetlistModal|src/components/booking/BoloConfirmadoSetlistModal.tsx]] *(from #frontend)*
- [[src_components_booking_BookingSimulationModal|src/components/booking/BookingSimulationModal.tsx]] *(from #frontend)*
- [[src_components_booking_ChangeLeadImageModal|src/components/booking/ChangeLeadImageModal.tsx]] *(from #frontend)*
- [[src_components_booking_crm_BulkActionsSection|src/components/booking/crm/BulkActionsSection.tsx]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadEditing|src/components/booking/crm/hooks/useLeadEditing.ts]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadFormsAndEnrichment|src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadScraping|src/components/booking/crm/hooks/useLeadScraping.ts]] *(from #frontend)*
- [[src_components_booking_CRMContactEnricherModal|src/components/booking/CRMContactEnricherModal.tsx]] *(from #frontend)*
- [[src_components_booking_DealSupportCard|src/components/booking/DealSupportCard.tsx]] *(from #frontend)*
- [[src_components_booking_ExampleThreadsSection|src/components/booking/ExampleThreadsSection.tsx]] *(from #frontend)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useAlternativePlaceSources|src/components/booking/google_places/hooks/useAlternativePlaceSources.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_useMassCampaignSearch|src/components/booking/google_places/hooks/useMassCampaignSearch.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceCrmImport|src/components/booking/google_places/hooks/usePlaceCrmImport.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceEmailExtraction|src/components/booking/google_places/hooks/usePlaceEmailExtraction.ts]] *(from #frontend)*
- [[src_components_booking_google_places_hooks_usePlaceSearch|src/components/booking/google_places/hooks/usePlaceSearch.ts]] *(from #frontend)*
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(from #frontend)*
- [[src_components_booking_leads_table_hooks_useLeadsBatchDateScan|src/components/booking/leads_table/hooks/useLeadsBatchDateScan.ts]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenuePitchWorkspace|src/components/booking/venue_modal/VenuePitchWorkspace.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueEnrichment|src/components/booking/venue_panel/hooks/useVenueEnrichment.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueMessageThread|src/components/booking/venue_panel/hooks/useVenueMessageThread.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_useVenueScoutActions|src/components/booking/venue_panel/hooks/useVenueScoutActions.ts]] *(from #frontend)*
- [[src_components_booking_venue_panel_VenueAgentWorkflowBanner|src/components/booking/venue_panel/VenueAgentWorkflowBanner.tsx]] *(from #agent)*
- [[src_components_calendar_hooks_useCreateEventForm|src/components/calendar/hooks/useCreateEventForm.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useEventReminder|src/components/calendar/hooks/useEventReminder.ts]] *(from #frontend)*
- [[src_components_calendar_hooks_useRunOfShowAndGear|src/components/calendar/hooks/useRunOfShowAndGear.ts]] *(from #frontend)*
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_components_calendar_useCalendarConflicts|src/components/calendar/useCalendarConflicts.ts]] *(from #frontend)*
- [[src_components_campaign_CampaignManagerModal|src/components/campaign/CampaignManagerModal.tsx]] *(from #frontend)*
- [[src_components_chatbot_hooks_useLeadEmailActions|src/components/chatbot/hooks/useLeadEmailActions.ts]] *(from #frontend)*
- [[src_components_chords_ModalOido|src/components/chords/ModalOido.tsx]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*
- [[src_components_dashboard_agent_autonomy_hooks_useAutonomyConfig|src/components/dashboard/agent_autonomy/hooks/useAutonomyConfig.ts]] *(from #agent)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_fans_panel_hooks_useQrCustomization|src/components/fans_panel/hooks/useQrCustomization.ts]] *(from #frontend)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useBandToneAnalysis|src/components/reels_center/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useCopyActions|src/components/reels_center/hooks/useCopyActions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelsSync|src/components/reels_center/hooks/useReelsSync.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelStyleOptions|src/components/reels_center/hooks/useReelStyleOptions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useSocialPublishing|src/components/reels_center/hooks/useSocialPublishing.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*
- [[src_components_reels_ViralGrowthStudio|src/components/reels/ViralGrowthStudio.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useAlbumGeneration|src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertAnalysis|src/components/repertorio/live_concert_album/hooks/useConcertAnalysis.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertTranscription|src/components/repertorio/live_concert_album/hooks/useConcertTranscription.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetPreview|src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useYoutubeCookies|src/components/repertorio/live_concert_album/hooks/useYoutubeCookies.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_hooks_usePrintSettingsPersistence|src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts]] *(from #frontend)*
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
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

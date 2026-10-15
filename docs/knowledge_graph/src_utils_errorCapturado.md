---
id: src_utils_errorCapturado
title: "src/utils/errorCapturado.ts"
layer: service
domain: system
file: "src/utils/errorCapturado.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/errorCapturado.ts

> **Ubicación:** `src/utils/errorCapturado.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Vista tipada de un valor capturado en un `catch`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_correo_smtp_imap|Correo SMTP / IMAP]] *(Layer: #external, Domain: #system)*
- [[ext_fal|fal.ai]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_redactor|Agente Redactor (borradores de respuesta)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(from #db)*
- [[hook_app_data|useAppData Hook]] *(from #hook)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[route_leads_pitch|Leads Pitch Generation Route]] *(from #route)*
- [[route_leads_reply|Leads Reply Route]] *(from #route)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[sec_ssrf_guard|SSRF URL Validator]] *(from #security)*
- [[server|server.ts]] *(from #route)*
- [[server_ai|server/ai.ts]] *(from #service)*
- [[server_audit_dbRoundTrip|server/audit/dbRoundTrip.ts]] *(from #service)*
- [[server_audit_pgliteSchema|server/audit/pgliteSchema.ts]] *(from #service)*
- [[server_controllers_tours_controller|server/controllers/tours.controller.ts]] *(from #service)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(from #db)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(from #db)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(from #db)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(from #db)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(from #db)*
- [[server_migrations_runner|server/migrations/runner.ts]] *(from #service)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_agentQueue|server/routes/agentQueue.ts]] *(from #agent)*
- [[server_routes_ai_music_audioPublico|server/routes/ai_music/audioPublico.ts]] *(from #route)*
- [[server_routes_ai_music_cacheStems|server/routes/ai_music/cacheStems.ts]] *(from #route)*
- [[server_routes_ai_music_diagnosticos|server/routes/ai_music/diagnosticos.ts]] *(from #route)*
- [[server_routes_ai_music_diagnosticosInfra|server/routes/ai_music/diagnosticosInfra.ts]] *(from #route)*
- [[server_routes_ai_music_generacionMusical|server/routes/ai_music/generacionMusical.ts]] *(from #route)*
- [[server_routes_ai_music_motoresNeuronales|server/routes/ai_music/motoresNeuronales.ts]] *(from #route)*
- [[server_routes_ai_music_rutasEstadoStems|server/routes/ai_music/rutasEstadoStems.ts]] *(from #route)*
- [[server_routes_ai_music_rutasGeneracion|server/routes/ai_music/rutasGeneracion.ts]] *(from #route)*
- [[server_routes_ai_music_rutasWebhooks|server/routes/ai_music/rutasWebhooks.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_routes_leads_emailValidation|server/routes/leads/emailValidation.ts]] *(from #route)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(from #route)*
- [[server_routes_leads_import|server/routes/leads/import.ts]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(from #route)*
- [[server_routes_leads_templates|server/routes/leads/templates.ts]] *(from #route)*
- [[server_routes_metrics|server/routes/metrics.ts]] *(from #route)*
- [[server_routes_posts|server/routes/posts.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_routes_spotify|server/routes/spotify.ts]] *(from #route)*
- [[server_routes_tiposChat|server/routes/tiposChat.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_routes_transposeRoute|server/routes/transposeRoute.ts]] *(from #route)*
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*
- [[server_routes_users_rutasBandas|server/routes/users/rutasBandas.ts]] *(from #route)*
- [[server_routes_users_rutasGoogle|server/routes/users/rutasGoogle.ts]] *(from #route)*
- [[server_routes_users_rutasMiembros|server/routes/users/rutasMiembros.ts]] *(from #route)*
- [[server_routes_users_rutasPreferencias|server/routes/users/rutasPreferencias.ts]] *(from #route)*
- [[server_routes_users_rutasRegistro|server/routes/users/rutasRegistro.ts]] *(from #route)*
- [[server_services_agentQueueWorker|server/services/agentQueueWorker.ts]] *(from #agent)*
- [[server_services_apifyInstagramService|server/services/apifyInstagramService.ts]] *(from #service)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_LalalAiService|server/services/audioSeparator/LalalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_LocalDspService|server/services/audioSeparator/LocalDspService.ts]] *(from #service)*
- [[server_services_audioSeparator_ReplicateService|server/services/audioSeparator/ReplicateService.ts]] *(from #service)*
- [[server_services_audioTransposeService|server/services/audioTransposeService.ts]] *(from #service)*
- [[server_services_bandsintownVenueService|server/services/bandsintownVenueService.ts]] *(from #service)*
- [[server_services_clipArchivos|server/services/clipArchivos.ts]] *(from #service)*
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_services_colaLetras|server/services/colaLetras.ts]] *(from #service)*
- [[server_services_comentariosYoutube|server/services/comentariosYoutube.ts]] *(from #service)*
- [[server_services_controlCalidad|server/services/controlCalidad.ts]] *(from #service)*
- [[server_services_copyPerfecto|server/services/copyPerfecto.ts]] *(from #service)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*
- [[server_services_googlePlacesVenueService|server/services/googlePlacesVenueService.ts]] *(from #service)*
- [[server_services_hookDoctor|server/services/hookDoctor.ts]] *(from #service)*
- [[server_services_jinaReaderService|server/services/jinaReaderService.ts]] *(from #service)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[server_services_multiSourceVenueDiscoveryService|server/services/multiSourceVenueDiscoveryService.ts]] *(from #service)*
- [[server_services_musicbrainzVenueService|server/services/musicbrainzVenueService.ts]] *(from #service)*
- [[server_services_openDataCulturalService|server/services/openDataCulturalService.ts]] *(from #service)*
- [[server_services_perfilDeLaPeticion|server/services/perfilDeLaPeticion.ts]] *(from #service)*
- [[server_services_pitchJudge|server/services/pitchJudge.ts]] *(from #service)*
- [[server_services_pitchVectorStore|server/services/pitchVectorStore.ts]] *(from #service)*
- [[server_services_publicCulturalEventsRadarService|server/services/publicCulturalEventsRadarService.ts]] *(from #service)*
- [[server_services_senalesVideo|server/services/senalesVideo.ts]] *(from #service)*
- [[server_services_sentimentAnalysis|server/services/sentimentAnalysis.ts]] *(from #service)*
- [[server_services_setlistVenueService|server/services/setlistVenueService.ts]] *(from #service)*
- [[server_services_similarBandsVenueMatcherService|server/services/similarBandsVenueMatcherService.ts]] *(from #service)*
- [[server_services_socialEngagementService|server/services/socialEngagementService.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*
- [[server_services_socialRadarService|server/services/socialRadarService.ts]] *(from #service)*
- [[server_services_spotifyAudienceService|server/services/spotifyAudienceService.ts]] *(from #service)*
- [[server_services_spotifyService|server/services/spotifyService.ts]] *(from #service)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(from #service)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(from #service)*
- [[server_services_tourLogisticsService|server/services/tourLogisticsService.ts]] *(from #service)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(from #service)*
- [[server_services_transcripcionLetra|server/services/transcripcionLetra.ts]] *(from #service)*
- [[server_services_venueEventsRadarService|server/services/venueEventsRadarService.ts]] *(from #service)*
- [[server_services_venueIntelligenceService|server/services/venueIntelligenceService.ts]] *(from #service)*
- [[server_services_youtubeMeta|server/services/youtubeMeta.ts]] *(from #service)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(from #service)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(from #service)*
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(from #service)*
- [[server_utils_enrichCoversWithoutAudio|server/utils/enrichCoversWithoutAudio.ts]] *(from #service)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*
- [[server_utils_perfectSetlistPlanner|server/utils/perfectSetlistPlanner.ts]] *(from #service)*
- [[server_utils_setlistImport|server/utils/setlistImport.ts]] *(from #service)*
- [[server_utils_storage|server/utils/storage.ts]] *(from #service)*
- [[server_utils_templateOptimizer|server/utils/templateOptimizer.ts]] *(from #service)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(from #service)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(from #service)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(from #service)*
- [[src_components_bandCRM_AIBandScoutModal|src/components/bandCRM/AIBandScoutModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(from #frontend)*
- [[src_components_booking_DealSupportCard|src/components/booking/DealSupportCard.tsx]] *(from #frontend)*
- [[src_components_booking_ExampleThreadsSection|src/components/booking/ExampleThreadsSection.tsx]] *(from #frontend)*
- [[src_components_booking_ExcelImportModal|src/components/booking/ExcelImportModal.tsx]] *(from #frontend)*
- [[src_components_booking_FastDealModal|src/components/booking/FastDealModal.tsx]] *(from #frontend)*
- [[src_components_booking_LeadDuplicatesModal|src/components/booking/LeadDuplicatesModal.tsx]] *(from #frontend)*
- [[src_components_booking_MultiModelPitchComparatorModal|src/components/booking/MultiModelPitchComparatorModal.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueEmailThread|src/components/booking/venue_modal/VenueEmailThread.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenuePitchWorkspace|src/components/booking/venue_modal/VenuePitchWorkspace.tsx]] *(from #frontend)*
- [[src_components_booking_venue_modal_VenueProfileColumn|src/components/booking/venue_modal/VenueProfileColumn.tsx]] *(from #frontend)*
- [[src_components_campaign_CampaignManagerModal|src/components/campaign/CampaignManagerModal.tsx]] *(from #frontend)*
- [[src_components_CheckoutButton|src/components/CheckoutButton.tsx]] *(from #frontend)*
- [[src_components_chords_ProfesorIA|src/components/chords/ProfesorIA.tsx]] *(from #frontend)*
- [[src_components_dashboard_AlertSettingsModal|src/components/dashboard/AlertSettingsModal.tsx]] *(from #frontend)*
- [[src_components_EmailAccountConfig|src/components/EmailAccountConfig.tsx]] *(from #frontend)*
- [[src_components_epk_AILogoGeneratorModal|src/components/epk/AILogoGeneratorModal.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_LoginModal|src/components/LoginModal.tsx]] *(from #frontend)*
- [[src_components_Planes|src/components/Planes.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_PublicFanCapture|src/components/PublicFanCapture.tsx]] *(from #frontend)*
- [[src_components_PublicMusiciansLanding|src/components/PublicMusiciansLanding.tsx]] *(from #frontend)*
- [[src_components_QrExportModal|src/components/QrExportModal.tsx]] *(from #frontend)*
- [[src_components_reels_ViralGrowthStudio|src/components/reels/ViralGrowthStudio.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_ExportAlbumSongsModal|src/components/repertorio/ExportAlbumSongsModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_ImportSetlistModal|src/components/repertorio/ImportSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiMusicModal|src/components/song_studio/SongStudioAiMusicModal.tsx]] *(from #frontend)*
- [[src_components_TunerModal|src/components/TunerModal.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_hooks_useColaLetras|src/hooks/useColaLetras.ts]] *(from #hook)*
- [[src_hooks_useEmailTemplates|src/hooks/useEmailTemplates.ts]] *(from #hook)*
- [[src_hooks_useGmailIntegration|src/hooks/useGmailIntegration.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_pages_PublicDealView|src/pages/PublicDealView.tsx]] *(from #frontend)*
- [[src_services_weatherService|src/services/weatherService.ts]] *(from #service)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(from #service)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(from #service)*
- [[src_utils_gmail|src/utils/gmail.ts]] *(from #service)*
- [[src_utils_saveErrors|src/utils/saveErrors.ts]] *(from #service)*
- [[src_utils_shareUtils|src/utils/shareUtils.ts]] *(from #service)*
- [[src_utils_webPush|src/utils/webPush.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/errorCapturado.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

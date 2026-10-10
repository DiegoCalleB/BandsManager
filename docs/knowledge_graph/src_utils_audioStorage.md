---
id: src_utils_audioStorage
title: "src/utils/audioStorage.ts"
layer: service
domain: repertoire
file: "src/utils/audioStorage.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioStorage.ts

> **Ubicación:** `src/utils/audioStorage.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Audio Storage & Utility Helpers for BandManager

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_AlbumCover|src/components/AlbumCover.tsx]] *(from #frontend)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_band_switcher_hooks_useBandActions|src/components/band_switcher/hooks/useBandActions.ts]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandForm|src/components/bandCRM/hooks/useBandForm.ts]] *(from #frontend)*
- [[src_components_booking_ChangeLeadImageModal|src/components/booking/ChangeLeadImageModal.tsx]] *(from #frontend)*
- [[src_components_booking_crm_hooks_useLeadFormsAndEnrichment|src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatAudioGeneration|src/components/chatbot/hooks/useChatAudioGeneration.ts]] *(from #frontend)*
- [[src_components_ensayos_GrabacionActaTab|src/components/ensayos/GrabacionActaTab.tsx]] *(from #frontend)*
- [[src_components_epk_EPKPerfilBlock|src/components/epk/EPKPerfilBlock.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_Merchan|src/components/Merchan.tsx]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useFansPaymentsStep|src/components/onboarding/wizard/hooks/useFansPaymentsStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useIdentityStep|src/components/onboarding/wizard/hooks/useIdentityStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useMusicSetlistStep|src/components/onboarding/wizard/hooks/useMusicSetlistStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_usePhotosStep|src/components/onboarding/wizard/hooks/usePhotosStep.ts]] *(from #frontend)*
- [[src_components_onboarding_wizard_hooks_useRiderStep|src/components/onboarding/wizard/hooks/useRiderStep.ts]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_AssignSongsToAlbumModal|src/components/repertorio/AssignSongsToAlbumModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useCatalogActions|src/components/repertorio/hooks/useCatalogActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioDialogs|src/components/repertorio/hooks/useRepertorioDialogs.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPersistence|src/components/repertorio/hooks/useRepertorioPersistence.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPlaybackAndModals|src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistCrud|src/components/repertorio/hooks/useSetlistCrud.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistItemActions|src/components/repertorio/hooks/useSetlistItemActions.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistItemsMutations|src/components/repertorio/hooks/useSetlistItemsMutations.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSetlistReordering|src/components/repertorio/hooks/useSetlistReordering.ts]] *(from #frontend)*
- [[src_components_repertorio_hooks_useSongEditing|src/components/repertorio/hooks/useSongEditing.ts]] *(from #frontend)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaMicRecording|src/components/song_studio/hooks/useIdeaMicRecording.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useResolvedAudioUrls|src/components/song_studio/hooks/useResolvedAudioUrls.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useStudioPlaybackEngine|src/components/song_studio/hooks/useStudioPlaybackEngine.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_components_WaveformTrack|src/components/WaveformTrack.tsx]] *(from #frontend)*
- [[src_hooks_useAccompanimentGenerator|src/hooks/useAccompanimentGenerator.ts]] *(from #hook)*
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(from #hook)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(from #service)*
- [[src_utils_audioParaSubida|src/utils/audioParaSubida.ts]] *(from #service)*
- [[src_utils_stemSeparator|src/utils/stemSeparator.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

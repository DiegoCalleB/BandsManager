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
- [[src_components_BandCRM|src/components/BandCRM.tsx]] *(from #frontend)*
- [[src_components_bandCRM_ChangeBandImageModal|src/components/bandCRM/ChangeBandImageModal.tsx]] *(from #frontend)*
- [[src_components_BandSwitcherModal|src/components/BandSwitcherModal.tsx]] *(from #frontend)*
- [[src_components_booking_ChangeLeadImageModal|src/components/booking/ChangeLeadImageModal.tsx]] *(from #frontend)*
- [[src_components_Chatbot|src/components/Chatbot.tsx]] *(from #frontend)*
- [[src_components_ensayos_GrabacionActaTab|src/components/ensayos/GrabacionActaTab.tsx]] *(from #frontend)*
- [[src_components_epk_EPKPerfilBlock|src/components/epk/EPKPerfilBlock.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_Merchan|src/components/Merchan.tsx]] *(from #frontend)*
- [[src_components_onboarding_OnboardingWizardModal|src/components/onboarding/OnboardingWizardModal.tsx]] *(from #frontend)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_AssignSongsToAlbumModal|src/components/repertorio/AssignSongsToAlbumModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_DiscografiaView|src/components/repertorio/DiscografiaView.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SpotifyDiscographyModal|src/components/repertorio/SpotifyDiscographyModal.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*
- [[src_components_WaveformTrack|src/components/WaveformTrack.tsx]] *(from #frontend)*
- [[src_hooks_useAccompanimentGenerator|src/hooks/useAccompanimentGenerator.ts]] *(from #hook)*
- [[src_hooks_useMezclaStems|src/hooks/useMezclaStems.ts]] *(from #hook)*
- [[src_hooks_useRepertorioShortcutsAndEvents|src/hooks/useRepertorioShortcutsAndEvents.ts]] *(from #hook)*
- [[src_hooks_useRepertorioSongAlbumHandlers|src/hooks/useRepertorioSongAlbumHandlers.ts]] *(from #hook)*
- [[src_hooks_useRepertorioSync|src/hooks/useRepertorioSync.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(from #hook)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(from #service)*
- [[src_utils_audioParaSubida|src/utils/audioParaSubida.ts]] *(from #service)*
- [[src_utils_stemSeparator|src/utils/stemSeparator.ts]] *(from #service)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

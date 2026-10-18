---
id: src_services_sesionLocal
title: "src/services/sesionLocal.ts"
layer: service
domain: system
file: "src/services/sesionLocal.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/sesionLocal.ts

> **Ubicación:** `src/services/sesionLocal.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lectura de la sesión guardada en el navegador: token, usuario y banda activa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_hooks_useHashRoute|src/app/hooks/useHashRoute.ts]] *(from #service)*
- [[src_components_atril_hooks_useAtrilAudio|src/components/atril/hooks/useAtrilAudio.ts]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilEditing|src/components/atril/hooks/useAtrilEditing.ts]] *(from #frontend)*
- [[src_components_bandCRM_hooks_useBandCrmData|src/components/bandCRM/hooks/useBandCrmData.ts]] *(from #frontend)*
- [[src_components_booking_FastDealModal|src/components/booking/FastDealModal.tsx]] *(from #frontend)*
- [[src_components_booking_venue_panel_hooks_buildVenuePanelActions|src/components/booking/venue_panel/hooks/buildVenuePanelActions.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useAgentRuns|src/components/chatbot/hooks/useAgentRuns.ts]] *(from #agent)*
- [[src_components_chatbot_hooks_useAgentTriggerAction|src/components/chatbot/hooks/useAgentTriggerAction.ts]] *(from #agent)*
- [[src_components_chatbot_hooks_useChatAudioGeneration|src/components/chatbot/hooks/useChatAudioGeneration.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useChatSend|src/components/chatbot/hooks/useChatSend.ts]] *(from #frontend)*
- [[src_components_chatbot_hooks_useEntityActions|src/components/chatbot/hooks/useEntityActions.ts]] *(from #frontend)*
- [[src_components_CheckoutButton|src/components/CheckoutButton.tsx]] *(from #frontend)*
- [[src_components_dashboard_hooks_useGuardadoPanel|src/components/dashboard/hooks/useGuardadoPanel.ts]] *(from #frontend)*
- [[src_components_repertorio_BulkAlbumAudioUploaderModal|src/components/repertorio/BulkAlbumAudioUploaderModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_hooks_useRepertorioPersistence|src/components/repertorio/hooks/useRepertorioPersistence.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioStructureUploadModal|src/components/song_studio/SongStudioStructureUploadModal.tsx]] *(from #frontend)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*
- [[src_services_api|src/services/api.ts]] *(from #service)*
- [[src_utils_api|src/utils/api.ts]] *(from #service)*
- [[src_utils_calendarViewPreferences|src/utils/calendarViewPreferences.ts]] *(from #service)*
- [[src_utils_instrumentoProfesor|src/utils/instrumentoProfesor.ts]] *(from #service)*
- [[src_utils_userPreferences|src/utils/userPreferences.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/services/__tests__/sesionLocal.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

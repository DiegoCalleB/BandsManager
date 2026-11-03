---
id: src_hooks_useNotacion
title: "src/hooks/useNotacion.ts"
layer: hook
domain: system
file: "src/hooks/useNotacion.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useNotacion.ts

> **Ubicación:** `src/hooks/useNotacion.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Notación de acordes y tonalidades que ve cada persona (Do Re Mi / Mim  ↔  C D E / Em).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_notacionAcordes|src/utils/notacionAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilHeader|src/components/atril/AtrilHeader.tsx]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilState|src/components/atril/hooks/useAtrilState.ts]] *(from #frontend)*
- [[src_components_chatbot_ChatMessageBubble|src/components/chatbot/ChatMessageBubble.tsx]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*
- [[src_components_ensayos_OrdenDelDiaTab|src/components/ensayos/OrdenDelDiaTab.tsx]] *(from #frontend)*
- [[src_components_onboarding_steps_StepMusicSetlist|src/components/onboarding/steps/StepMusicSetlist.tsx]] *(from #frontend)*
- [[src_components_repertorio_AddSongsToSetlistModal|src/components/repertorio/AddSongsToSetlistModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_EnergyChart|src/components/repertorio/EnergyChart.tsx]] *(from #frontend)*
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(from #frontend)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_PdfControlPanel|src/components/repertorio/pdf_export/PdfControlPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistAddBar|src/components/repertorio/SetlistAddBar.tsx]] *(from #frontend)*
- [[src_components_repertorio_SetlistSongRow|src/components/repertorio/SetlistSongRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_song_transition_TransitionTrackCard|src/components/repertorio/song_transition/TransitionTrackCard.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongModal|src/components/repertorio/SongModal.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceFooter|src/components/setlist_performance/PerformanceFooter.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceRehearsalBar|src/components/setlist_performance/PerformanceRehearsalBar.tsx]] *(from #frontend)*
- [[src_components_setlist_performance_PerformanceSongDrawer|src/components/setlist_performance/PerformanceSongDrawer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioHeader|src/components/song_studio/SongStudioHeader.tsx]] *(from #frontend)*
- [[src_components_SpotifyPlayerBar|src/components/SpotifyPlayerBar.tsx]] *(from #frontend)*
- [[src_components_user_profile_NotacionPreferenceCard|src/components/user_profile/NotacionPreferenceCard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

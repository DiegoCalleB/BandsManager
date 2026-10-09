---
id: src_components_SongStudioModal
title: "src/components/SongStudioModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/SongStudioModal.tsx"
tags: ["frontend", "repertoire", "auto", "pantalla"]
---

# 📌 src/components/SongStudioModal.tsx

> **Ubicación:** `src/components/SongStudioModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: getIdeaTracks, MoisesSeparationPreset, MoisesStemOption, MOISES_AVAILABLE_STEMS, MOISES_PRESETS_CONFIG, SongStudioModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_Atril|src/components/Atril.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_WaveformTrack|src/components/WaveformTrack.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_song_studio_SongStudioAiComposerModal|src/components/song_studio/SongStudioAiComposerModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiGeneratorModal|src/components/song_studio/SongStudioAiGeneratorModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiMusicModal|src/components/song_studio/SongStudioAiMusicModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioAiTrackGenModal|src/components/song_studio/SongStudioAiTrackGenModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioCubaseHelpModal|src/components/song_studio/SongStudioCubaseHelpModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioDeleteConfirmModal|src/components/song_studio/SongStudioDeleteConfirmModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioMoisesStemsModal|src/components/song_studio/SongStudioMoisesStemsModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioStemProgressModal|src/components/song_studio/SongStudioStemProgressModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_hooks_useAccompanimentGenerator|src/hooks/useAccompanimentGenerator.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useIdeaComments|src/hooks/useIdeaComments.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useStudioShareModal|src/hooks/useStudioShareModal.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_accompanimentSynth|src/utils/accompanimentSynth.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioParaSubida|src/utils/audioParaSubida.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMoisesStemsModal|src/components/song_studio/SongStudioMoisesStemsModal.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

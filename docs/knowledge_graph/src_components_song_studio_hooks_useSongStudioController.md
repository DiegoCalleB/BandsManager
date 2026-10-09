---
id: src_components_song_studio_hooks_useSongStudioController
title: "src/components/song_studio/hooks/useSongStudioController.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useSongStudioController.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useSongStudioController.ts

> **Ubicación:** `src/components/song_studio/hooks/useSongStudioController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Controlador de Song Studio: compone todos los hooks de estado y lógica del estudio y expone lo que consumen las vistas

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_hooks_useAiTrackGeneration|src/components/song_studio/hooks/useAiTrackGeneration.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useIdeaDurations|src/components/song_studio/hooks/useIdeaDurations.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useIdeaLoopControls|src/components/song_studio/hooks/useIdeaLoopControls.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useIdeaMicRecording|src/components/song_studio/hooks/useIdeaMicRecording.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useIdeaPlaybackTracks|src/components/song_studio/hooks/useIdeaPlaybackTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useMoisesStemsPanel|src/components/song_studio/hooks/useMoisesStemsPanel.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useResolvedAudioUrls|src/components/song_studio/hooks/useResolvedAudioUrls.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useStudioFullScreen|src/components/song_studio/hooks/useStudioFullScreen.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useStudioIdeasView|src/components/song_studio/hooks/useStudioIdeasView.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useStudioKeyboardShortcuts|src/components/song_studio/hooks/useStudioKeyboardShortcuts.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useStudioMasterGain|src/components/song_studio/hooks/useStudioMasterGain.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useStudioPlaybackEngine|src/components/song_studio/hooks/useStudioPlaybackEngine.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useTrackAudioDsp|src/components/song_studio/hooks/useTrackAudioDsp.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_hooks_useAccompanimentGenerator|src/hooks/useAccompanimentGenerator.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useIdeaComments|src/hooks/useIdeaComments.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useStudioShareModal|src/hooks/useStudioShareModal.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

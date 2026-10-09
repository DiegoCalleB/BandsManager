---
id: src_components_song_studio_ideaTracks
title: "src/components/song_studio/ideaTracks.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/ideaTracks.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/ideaTracks.ts

> **Ubicación:** `src/components/song_studio/ideaTracks.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: getIdeaTracks.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useAiTrackGeneration|src/components/song_studio/hooks/useAiTrackGeneration.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaPlaybackTracks|src/components/song_studio/hooks/useIdeaPlaybackTracks.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useResolvedAudioUrls|src/components/song_studio/hooks/useResolvedAudioUrls.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useStudioKeyboardShortcuts|src/components/song_studio/hooks/useStudioKeyboardShortcuts.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioDialogs|src/components/song_studio/SongStudioDialogs.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaCard|src/components/song_studio/SongStudioIdeaCard.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaComments|src/components/song_studio/SongStudioIdeaComments.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

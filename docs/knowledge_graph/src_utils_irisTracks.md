---
id: src_utils_irisTracks
title: "src/utils/irisTracks.ts"
layer: service
domain: repertoire
file: "src/utils/irisTracks.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/irisTracks.ts

> **Ubicación:** `src/utils/irisTracks.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: getSongIrisStemIdea, esIdeaIris, irisPrimero, hasIrisStems, getIdeaTracks, pistasDeIdeas, metaStemsDeIdeas, pistasDeCancion.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaPlaybackTracks|src/components/song_studio/hooks/useIdeaPlaybackTracks.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useMoisesStemsPanel|src/components/song_studio/hooks/useMoisesStemsPanel.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useStudioIdeasView|src/components/song_studio/hooks/useStudioIdeasView.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAddIdeaForm|src/components/song_studio/SongStudioAddIdeaForm.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioDialogs|src/components/song_studio/SongStudioDialogs.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaHeader|src/components/song_studio/SongStudioIdeaHeader.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaMixer|src/components/song_studio/SongStudioIdeaMixer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioOverdubDrawer|src/components/song_studio/SongStudioOverdubDrawer.tsx]] *(from #frontend)*
- [[src_hooks_useIdeaComments|src/hooks/useIdeaComments.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/irisTracks.test.ts`
- `src/utils/__tests__/pistasDeCancion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

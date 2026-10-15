---
id: src_components_song_studio_SongStudioContext
title: "src/components/song_studio/SongStudioContext.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioContext.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioContext.ts

> **Ubicación:** `src/components/song_studio/SongStudioContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Contexto de Song Studio (solo tipos, contexto y hook; el proveedor vive en SongStudioProvider.tsx): reparte el estado y las acciones del controlador a las vistas del estudio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioAddIdeaForm|src/components/song_studio/SongStudioAddIdeaForm.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioDialogs|src/components/song_studio/SongStudioDialogs.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioHeader|src/components/song_studio/SongStudioHeader.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioHeaderControls|src/components/song_studio/SongStudioHeaderControls.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaCard|src/components/song_studio/SongStudioIdeaCard.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaComments|src/components/song_studio/SongStudioIdeaComments.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaHeader|src/components/song_studio/SongStudioIdeaHeader.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaMixer|src/components/song_studio/SongStudioIdeaMixer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeasBar|src/components/song_studio/SongStudioIdeasBar.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeasFeed|src/components/song_studio/SongStudioIdeasFeed.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaTrackActions|src/components/song_studio/SongStudioIdeaTrackActions.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaTransport|src/components/song_studio/SongStudioIdeaTransport.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaVoteBar|src/components/song_studio/SongStudioIdeaVoteBar.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIrisBar|src/components/song_studio/SongStudioIrisBar.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIrisSheet|src/components/song_studio/SongStudioIrisSheet.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioLayout|src/components/song_studio/SongStudioLayout.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioLiveRecordingRow|src/components/song_studio/SongStudioLiveRecordingRow.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMiniTransport|src/components/song_studio/SongStudioMiniTransport.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioOverdubDrawer|src/components/song_studio/SongStudioOverdubDrawer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioProvider|src/components/song_studio/SongStudioProvider.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioReadinessSelect|src/components/song_studio/SongStudioReadinessSelect.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioToolsMenu|src/components/song_studio/SongStudioToolsMenu.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/song_studio/__tests__/songStudioModulesContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

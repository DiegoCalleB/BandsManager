---
id: src_components_song_studio_SongStudioIdeaCard
title: "src/components/song_studio/SongStudioIdeaCard.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioIdeaCard.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioIdeaCard.tsx

> **Ubicación:** `src/components/song_studio/SongStudioIdeaCard.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tarjeta de una idea de audio: cabecera, transporte, mezclador, overdub, votos y comentarios

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaComments|src/components/song_studio/SongStudioIdeaComments.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaVoteBar|src/components/song_studio/SongStudioIdeaVoteBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioLiveRecordingRow|src/components/song_studio/SongStudioLiveRecordingRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioOverdubDrawer|src/components/song_studio/SongStudioOverdubDrawer.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_studioConstants|src/components/song_studio/studioConstants.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_PopoverAncla|src/components/ui/PopoverAncla.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioIdeasFeed|src/components/song_studio/SongStudioIdeasFeed.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIrisSheet|src/components/song_studio/SongStudioIrisSheet.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

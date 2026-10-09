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
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaComments|src/components/song_studio/SongStudioIdeaComments.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaHeader|src/components/song_studio/SongStudioIdeaHeader.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaMixer|src/components/song_studio/SongStudioIdeaMixer.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaTrackActions|src/components/song_studio/SongStudioIdeaTrackActions.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaTransport|src/components/song_studio/SongStudioIdeaTransport.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioIdeaVoteBar|src/components/song_studio/SongStudioIdeaVoteBar.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioOverdubDrawer|src/components/song_studio/SongStudioOverdubDrawer.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_ideaTracks|src/components/song_studio/ideaTracks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_studioConstants|src/components/song_studio/studioConstants.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioIdeasFeed|src/components/song_studio/SongStudioIdeasFeed.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIrisSheet|src/components/song_studio/SongStudioIrisSheet.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

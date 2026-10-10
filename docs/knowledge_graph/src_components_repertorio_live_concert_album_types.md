---
id: src_components_repertorio_live_concert_album_types
title: "src/components/repertorio/live_concert_album/types.ts"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/types.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/types.ts

> **Ubicación:** `src/components/repertorio/live_concert_album/types.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Shared contract of the live-concert-to-album flow.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_hooks_useAlbumGeneration|src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertAnalysis|src/components/repertorio/live_concert_album/hooks/useConcertAnalysis.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertTranscription|src/components/repertorio/live_concert_album/hooks/useConcertTranscription.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useLiveConcertAlbumController|src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetPreview|src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useTrackEditing|src/components/repertorio/live_concert_album/hooks/useTrackEditing.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useTrackHistory|src/components/repertorio/live_concert_album/hooks/useTrackHistory.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_hooks_useYoutubeCookies|src/components/repertorio/live_concert_album/hooks/useYoutubeCookies.ts]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackChordsPanel|src/components/repertorio/live_concert_album/TrackChordsPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackHeaderRow|src/components/repertorio/live_concert_album/TrackHeaderRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackRow|src/components/repertorio/live_concert_album/TrackRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackSnippetPlayer|src/components/repertorio/live_concert_album/TrackSnippetPlayer.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackSpeechPanel|src/components/repertorio/live_concert_album/TrackSpeechPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackTitleRow|src/components/repertorio/live_concert_album/TrackTitleRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

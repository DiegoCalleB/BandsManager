---
id: src_components_repertorio_live_concert_album_hooks_useLiveConcertAlbumController
title: "src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts

> **Ubicación:** `src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Compone todos los hooks del flujo concierto→álbum y expone el estado y handlers que consumen las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_live_concert_album_hooks_useAlbumGeneration|src/components/repertorio/live_concert_album/hooks/useAlbumGeneration.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertAnalysis|src/components/repertorio/live_concert_album/hooks/useConcertAnalysis.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertSourceMedia|src/components/repertorio/live_concert_album/hooks/useConcertSourceMedia.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useConcertTranscription|src/components/repertorio/live_concert_album/hooks/useConcertTranscription.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetPreview|src/components/repertorio/live_concert_album/hooks/useSnippetPreview.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useSnippetScrubber|src/components/repertorio/live_concert_album/hooks/useSnippetScrubber.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useTrackEditing|src/components/repertorio/live_concert_album/hooks/useTrackEditing.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useTrackHistory|src/components/repertorio/live_concert_album/hooks/useTrackHistory.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_hooks_useYoutubeCookies|src/components/repertorio/live_concert_album/hooks/useYoutubeCookies.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_types|src/components/repertorio/live_concert_album/types.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumContext|src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts]] *(from #frontend)*
- [[src_components_repertorio_LiveConcertToAlbumModal|src/components/repertorio/LiveConcertToAlbumModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

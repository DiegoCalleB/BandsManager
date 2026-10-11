---
id: src_components_repertorio_live_concert_album_LiveConcertAlbumContext
title: "src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts

> **Ubicación:** `src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del flujo concierto→álbum: reparte el estado y las acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_live_concert_album_hooks_useLiveConcertAlbumController|src/components/repertorio/live_concert_album/hooks/useLiveConcertAlbumController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_AudioAvailabilityBanner|src/components/repertorio/live_concert_album/AudioAvailabilityBanner.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_ConcertErrorBanner|src/components/repertorio/live_concert_album/ConcertErrorBanner.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_ConcertTimeline|src/components/repertorio/live_concert_album/ConcertTimeline.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_EditorToolbar|src/components/repertorio/live_concert_album/EditorToolbar.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_FirstTrackHint|src/components/repertorio/live_concert_album/FirstTrackHint.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_GenerateAlbumButton|src/components/repertorio/live_concert_album/GenerateAlbumButton.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_GeneratedAlbumResult|src/components/repertorio/live_concert_album/GeneratedAlbumResult.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_IngestStep|src/components/repertorio/live_concert_album/IngestStep.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_LinkedSourceNotice|src/components/repertorio/live_concert_album/LinkedSourceNotice.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumLayout|src/components/repertorio/live_concert_album/LiveConcertAlbumLayout.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumProvider|src/components/repertorio/live_concert_album/LiveConcertAlbumProvider.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_ModalHeader|src/components/repertorio/live_concert_album/ModalHeader.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_QuickNamingDialog|src/components/repertorio/live_concert_album/QuickNamingDialog.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackChordsPanel|src/components/repertorio/live_concert_album/TrackChordsPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackHeaderRow|src/components/repertorio/live_concert_album/TrackHeaderRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackRow|src/components/repertorio/live_concert_album/TrackRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TracksEditorStep|src/components/repertorio/live_concert_album/TracksEditorStep.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackSnippetPlayer|src/components/repertorio/live_concert_album/TrackSnippetPlayer.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackSpeechPanel|src/components/repertorio/live_concert_album/TrackSpeechPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TrackTitleRow|src/components/repertorio/live_concert_album/TrackTitleRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_TranscribeAllProgress|src/components/repertorio/live_concert_album/TranscribeAllProgress.tsx]] *(from #frontend)*
- [[src_components_repertorio_live_concert_album_YoutubeCookiesDialog|src/components/repertorio/live_concert_album/YoutubeCookiesDialog.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/live_concert_album/__tests__/liveConcertAlbumContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: src_components_repertorio_live_concert_album_TracksEditorStep
title: "src/components/repertorio/live_concert_album/TracksEditorStep.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/TracksEditorStep.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/TracksEditorStep.tsx

> **Ubicación:** `src/components/repertorio/live_concert_album/TracksEditorStep.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Paso 2 del flujo: editor de cortes (avisos, barra de herramientas, línea de tiempo, filas y botón de generar).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_live_concert_album_AudioAvailabilityBanner|src/components/repertorio/live_concert_album/AudioAvailabilityBanner.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_live_concert_album_ConcertTimeline|src/components/repertorio/live_concert_album/ConcertTimeline.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_EditorToolbar|src/components/repertorio/live_concert_album/EditorToolbar.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_FirstTrackHint|src/components/repertorio/live_concert_album/FirstTrackHint.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_GenerateAlbumButton|src/components/repertorio/live_concert_album/GenerateAlbumButton.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_LinkedSourceNotice|src/components/repertorio/live_concert_album/LinkedSourceNotice.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumContext|src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TrackRow|src/components/repertorio/live_concert_album/TrackRow.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TranscribeAllProgress|src/components/repertorio/live_concert_album/TranscribeAllProgress.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumLayout|src/components/repertorio/live_concert_album/LiveConcertAlbumLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

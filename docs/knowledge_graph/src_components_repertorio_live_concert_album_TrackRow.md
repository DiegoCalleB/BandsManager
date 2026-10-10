---
id: src_components_repertorio_live_concert_album_TrackRow
title: "src/components/repertorio/live_concert_album/TrackRow.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/live_concert_album/TrackRow.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/live_concert_album/TrackRow.tsx

> **Ubicación:** `src/components/repertorio/live_concert_album/TrackRow.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Fila editable de un corte: tipo, tiempos, reproductor de fragmento, letra/acordes y acciones.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_live_concert_album_LiveConcertAlbumContext|src/components/repertorio/live_concert_album/LiveConcertAlbumContext.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TrackChordsPanel|src/components/repertorio/live_concert_album/TrackChordsPanel.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_live_concert_album_TrackHeaderRow|src/components/repertorio/live_concert_album/TrackHeaderRow.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TrackSnippetPlayer|src/components/repertorio/live_concert_album/TrackSnippetPlayer.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TrackSpeechPanel|src/components/repertorio/live_concert_album/TrackSpeechPanel.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_TrackTitleRow|src/components/repertorio/live_concert_album/TrackTitleRow.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_live_concert_album_types|src/components/repertorio/live_concert_album/types.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_live_concert_album_TracksEditorStep|src/components/repertorio/live_concert_album/TracksEditorStep.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

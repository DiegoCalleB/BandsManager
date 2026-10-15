---
id: src_components_song_studio_SongStudioIdeaMixer
title: "src/components/song_studio/SongStudioIdeaMixer.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioIdeaMixer.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioIdeaMixer.tsx

> **Ubicación:** `src/components/song_studio/SongStudioIdeaMixer.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Mezclador de pistas de una idea: pistas, grabación en directo y ajustes

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioLiveRecordingRow|src/components/song_studio/SongStudioLiveRecordingRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioIdeaCard|src/components/song_studio/SongStudioIdeaCard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

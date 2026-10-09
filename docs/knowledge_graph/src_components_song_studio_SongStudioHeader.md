---
id: src_components_song_studio_SongStudioHeader
title: "src/components/song_studio/SongStudioHeader.tsx"
layer: frontend
domain: repertoire
file: "src/components/song_studio/SongStudioHeader.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/SongStudioHeader.tsx

> **Ubicación:** `src/components/song_studio/SongStudioHeader.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Cabecera del estudio: título, estado, favorita, preparación, herramientas y controles

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_SongStudioContext|src/components/song_studio/SongStudioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioHeaderControls|src/components/song_studio/SongStudioHeaderControls.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioReadinessSelect|src/components/song_studio/SongStudioReadinessSelect.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_song_studio_SongStudioToolsMenu|src/components/song_studio/SongStudioToolsMenu.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_formatSongTitle|src/utils/formatSongTitle.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_SongStudioLayout|src/components/song_studio/SongStudioLayout.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

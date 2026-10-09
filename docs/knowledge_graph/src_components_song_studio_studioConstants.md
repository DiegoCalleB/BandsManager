---
id: src_components_song_studio_studioConstants
title: "src/components/song_studio/studioConstants.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/studioConstants.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/studioConstants.ts

> **Ubicación:** `src/components/song_studio/studioConstants.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SECCIONES_TEMA, AI_TRACK_STYLE_PRESETS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useAiTrackGeneration|src/components/song_studio/hooks/useAiTrackGeneration.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongIdeasCrud|src/components/song_studio/hooks/useSongIdeasCrud.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioAddIdeaForm|src/components/song_studio/SongStudioAddIdeaForm.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioIdeaCard|src/components/song_studio/SongStudioIdeaCard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

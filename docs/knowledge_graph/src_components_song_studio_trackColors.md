---
id: src_components_song_studio_trackColors
title: "src/components/song_studio/trackColors.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/trackColors.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/trackColors.ts

> **Ubicación:** `src/components/song_studio/trackColors.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: RAINBOW_HUE_STEPS, hslToHex, getTrackRainbowColor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_SongStudioMixerTrackRow|src/components/song_studio/SongStudioMixerTrackRow.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

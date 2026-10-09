---
id: src_components_song_studio_hooks_useTrackAudioDsp
title: "src/components/song_studio/hooks/useTrackAudioDsp.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useTrackAudioDsp.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useTrackAudioDsp.ts

> **Ubicación:** `src/components/song_studio/hooks/useTrackAudioDsp.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Procesado de audio por pista (cadena WebAudio: ganancia, paneo, EQ, filtro limpio) y cuenta atrás con metrónomo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

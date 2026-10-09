---
id: src_components_song_studio_hooks_useStudioPlaybackEngine
title: "src/components/song_studio/hooks/useStudioPlaybackEngine.ts"
layer: frontend
domain: repertoire
file: "src/components/song_studio/hooks/useStudioPlaybackEngine.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/song_studio/hooks/useStudioPlaybackEngine.ts

> **Ubicación:** `src/components/song_studio/hooks/useStudioPlaybackEngine.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Motor de reproducción multipista de Song Studio: sincronía maestra, play/pausa/stop/seek y silencio de otros audios al abrir

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_silentAudio|src/components/song_studio/silentAudio.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

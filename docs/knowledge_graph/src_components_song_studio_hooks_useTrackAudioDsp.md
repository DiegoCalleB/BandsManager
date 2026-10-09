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
Exporta: CleanRecordingPipeline, TrackAudioDspParams, useTrackAudioDsp.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_audioContext|src/components/song_studio/audioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioLatency|src/utils/audioLatency.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_song_studio_hooks_useIdeaMicRecording|src/components/song_studio/hooks/useIdeaMicRecording.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useSongStudioController|src/components/song_studio/hooks/useSongStudioController.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

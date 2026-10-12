---
id: src_utils_audioLatency
title: "src/utils/audioLatency.ts"
layer: service
domain: repertoire
file: "src/utils/audioLatency.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioLatency.ts

> **Ubicación:** `src/utils/audioLatency.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: StudioAudioStreamOptions, getLowLatencyAudioStream, CleanPipelineResult, createCleanAudioRecordingPipeline, trimAudioBlobLatency, normalizeAudioBuffer, cleanAudioBlobOffline, getSystemAudioLatencyMs.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_song_studio_audioContext|src/components/song_studio/audioContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_PracticeModePanel|src/components/PracticeModePanel.tsx]] *(from #frontend)*
- [[src_components_song_studio_hooks_useIdeaMicRecording|src/components/song_studio/hooks/useIdeaMicRecording.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackAudioDsp|src/components/song_studio/hooks/useTrackAudioDsp.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackMixerActions|src/components/song_studio/hooks/useTrackMixerActions.ts]] *(from #frontend)*
- [[src_components_song_studio_hooks_useTrackOverdub|src/components/song_studio/hooks/useTrackOverdub.ts]] *(from #frontend)*
- [[src_hooks_useGrabarIdea|src/hooks/useGrabarIdea.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

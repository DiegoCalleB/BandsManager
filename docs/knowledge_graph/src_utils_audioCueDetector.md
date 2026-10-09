---
id: src_utils_audioCueDetector
title: "src/utils/audioCueDetector.ts"
layer: service
domain: repertoire
file: "src/utils/audioCueDetector.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/audioCueDetector.ts

> **Ubicación:** `src/utils/audioCueDetector.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: CueDetectionOptions, AudioCueAnalysis, detectAudioCuesFromFloatChannel, detectAudioCuesFromBuffer, detectAudioCuesFromUrl, detectAudioCuesForSong, applyDetectedCuesToSong, detectLiveConcertTrackCues.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/audioCueDetector.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

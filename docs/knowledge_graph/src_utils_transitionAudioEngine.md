---
id: src_utils_transitionAudioEngine
title: "src/utils/transitionAudioEngine.ts"
layer: service
domain: repertoire
file: "src/utils/transitionAudioEngine.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/transitionAudioEngine.ts

> **Ubicación:** `src/utils/transitionAudioEngine.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: TransitionStyle, TransitionConfig, DEFAULT_TRANSITION_CONFIG, TransitionTimeline, computeTransitionTimeline, TransitionGains, getTransitionGains, TransitionPro.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_crossfade|src/utils/crossfade.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(from #service)*
- [[src_utils_transitionSynthesizer|src/utils/transitionSynthesizer.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

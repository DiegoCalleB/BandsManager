---
id: src_utils_transitionSynthesizer
title: "src/utils/transitionSynthesizer.ts"
layer: service
domain: system
file: "src/utils/transitionSynthesizer.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/transitionSynthesizer.ts

> **Ubicación:** `src/utils/transitionSynthesizer.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SyntheticPlayerController, playSyntheticTransition.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_harmonicAnalysis|src/utils/harmonicAnalysis.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_SongTransitionPreviewModal|src/components/repertorio/SongTransitionPreviewModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

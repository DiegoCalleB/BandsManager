---
id: src_components_repertorio_SongTransitionPreviewModal
title: "src/components/repertorio/SongTransitionPreviewModal.tsx"
layer: frontend
domain: repertoire
file: "src/components/repertorio/SongTransitionPreviewModal.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/SongTransitionPreviewModal.tsx

> **Ubicación:** `src/components/repertorio/SongTransitionPreviewModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: SongTransitionPreviewModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioCueDetector|src/utils/audioCueDetector.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_energyPacingUtils|src/utils/energyPacingUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_transitionAudioEngine|src/utils/transitionAudioEngine.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_transitionSynthesizer|src/utils/transitionSynthesizer.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

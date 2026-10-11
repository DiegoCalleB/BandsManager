---
id: src_components_reels_center_hooks_useReelsCenterController
title: "src/components/reels_center/hooks/useReelsCenterController.ts"
layer: frontend
domain: social
file: "src/components/reels_center/hooks/useReelsCenterController.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/hooks/useReelsCenterController.ts

> **Ubicación:** `src/components/reels_center/hooks/useReelsCenterController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Compone todos los hooks del Centro de Reels y expone el estado y los handlers que consumen las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useBandToneAnalysis|src/components/reels_center/hooks/useBandToneAnalysis.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useClipFeedbackState|src/components/reels_center/hooks/useClipFeedbackState.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useCopyActions|src/components/reels_center/hooks/useCopyActions.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useCopyDraftState|src/components/reels_center/hooks/useCopyDraftState.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useHighlightEditing|src/components/reels_center/hooks/useHighlightEditing.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useReelStyleOptions|src/components/reels_center/hooks/useReelStyleOptions.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useReelsSync|src/components/reels_center/hooks/useReelsSync.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useRenderedClipState|src/components/reels_center/hooks/useRenderedClipState.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useSocialPublishing|src/components/reels_center/hooks/useSocialPublishing.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useVideoFileInput|src/components/reels_center/hooks/useVideoFileInput.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_center_hooks_useVideoSource|src/components/reels_center/hooks/useVideoSource.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_ReelsCenterContext|src/components/reels_center/ReelsCenterContext.ts]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

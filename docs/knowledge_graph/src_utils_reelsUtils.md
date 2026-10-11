---
id: src_utils_reelsUtils
title: "src/utils/reelsUtils.ts"
layer: service
domain: social
file: "src/utils/reelsUtils.ts"
tags: ["service", "social", "auto"]
---

# 📌 src/utils/reelsUtils.ts

> **Ubicación:** `src/utils/reelsUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: ReelCard, HighlightClip, SubtitleCue, OptimalTime, parseRangeTimes, formatTime, getYouTubeId, getStartTimeInSeconds.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useCopyActions|src/components/reels_center/hooks/useCopyActions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useCopyDraftState|src/components/reels_center/hooks/useCopyDraftState.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useHighlightEditing|src/components/reels_center/hooks/useHighlightEditing.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelStyleOptions|src/components/reels_center/hooks/useReelStyleOptions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*
- [[src_components_reels_center_reelsHelpers|src/components/reels_center/reelsHelpers.ts]] *(from #frontend)*
- [[src_components_reels_ReelsPhoneMockup|src/components/reels/ReelsPhoneMockup.tsx]] *(from #frontend)*
- [[src_components_reels_ReelsTheaterModal|src/components/reels/ReelsTheaterModal.tsx]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/reels_center/__tests__/reelsHelpers.test.ts`
- `src/utils/__tests__/reelsUtils.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

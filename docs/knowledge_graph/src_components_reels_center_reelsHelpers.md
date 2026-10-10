---
id: src_components_reels_center_reelsHelpers
title: "src/components/reels_center/reelsHelpers.ts"
layer: frontend
domain: social
file: "src/components/reels_center/reelsHelpers.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/reelsHelpers.ts

> **Ubicación:** `src/components/reels_center/reelsHelpers.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Helpers puros del Centro de Reels (rangos de tiempo, claves de archivo, copy por red).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_HighlightsLighttable|src/components/reels_center/HighlightsLighttable.tsx]] *(from #frontend)*
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useHighlightEditing|src/components/reels_center/hooks/useHighlightEditing.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*
- [[src_components_reels_center_PlatformSelector|src/components/reels_center/PlatformSelector.tsx]] *(from #frontend)*
- [[src_components_reels_center_reelsApiTypes|src/components/reels_center/reelsApiTypes.ts]] *(from #frontend)*
- [[src_components_reels_center_ReelsCenterLayout|src/components/reels_center/ReelsCenterLayout.tsx]] *(from #frontend)*
- [[src_components_reels_center_VideoInputArea|src/components/reels_center/VideoInputArea.tsx]] *(from #frontend)*
- [[src_components_ReelsCenter|src/components/ReelsCenter.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/reels_center/__tests__/reelsHelpers.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

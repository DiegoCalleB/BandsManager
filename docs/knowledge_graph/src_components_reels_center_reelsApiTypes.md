---
id: src_components_reels_center_reelsApiTypes
title: "src/components/reels_center/reelsApiTypes.ts"
layer: frontend
domain: social
file: "src/components/reels_center/reelsApiTypes.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/reelsApiTypes.ts

> **Ubicación:** `src/components/reels_center/reelsApiTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Contratos tipados de las respuestas de la API del Centro de Reels.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_posts|server/routes/posts.ts]] *(Layer: #route, Domain: #system)*
- [[server_routes_reels|server/routes/reels.ts]] *(Layer: #route, Domain: #social)*
- [[src_components_bandCRM_BandToneModal|src/components/bandCRM/BandToneModal.tsx]] *(Layer: #frontend, Domain: #booking)*
- [[src_components_reels_center_reelsHelpers|src/components/reels_center/reelsHelpers.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_reelsUtils|src/utils/reelsUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_HighlightsLighttable|src/components/reels_center/HighlightsLighttable.tsx]] *(from #frontend)*
- [[src_components_reels_center_hooks_useAnalysisTimeline|src/components/reels_center/hooks/useAnalysisTimeline.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useBandToneAnalysis|src/components/reels_center/hooks/useBandToneAnalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipReanalysis|src/components/reels_center/hooks/useClipReanalysis.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useClipRendering|src/components/reels_center/hooks/useClipRendering.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useCopyActions|src/components/reels_center/hooks/useCopyActions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelsSync|src/components/reels_center/hooks/useReelsSync.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useReelStyleOptions|src/components/reels_center/hooks/useReelStyleOptions.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useSocialPublishing|src/components/reels_center/hooks/useSocialPublishing.ts]] *(from #frontend)*
- [[src_components_reels_center_hooks_useVideoAnalyzer|src/components/reels_center/hooks/useVideoAnalyzer.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

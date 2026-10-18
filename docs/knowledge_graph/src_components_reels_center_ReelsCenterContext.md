---
id: src_components_reels_center_ReelsCenterContext
title: "src/components/reels_center/ReelsCenterContext.ts"
layer: frontend
domain: social
file: "src/components/reels_center/ReelsCenterContext.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels_center/ReelsCenterContext.ts

> **Ubicación:** `src/components/reels_center/ReelsCenterContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Contexto del Centro de Reels: reparte el estado y las acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_center_hooks_useReelsCenterController|src/components/reels_center/hooks/useReelsCenterController.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_center_AnalysisOptions|src/components/reels_center/AnalysisOptions.tsx]] *(from #frontend)*
- [[src_components_reels_center_AnalysisProgress|src/components/reels_center/AnalysisProgress.tsx]] *(from #frontend)*
- [[src_components_reels_center_AnalysisStatusNotices|src/components/reels_center/AnalysisStatusNotices.tsx]] *(from #frontend)*
- [[src_components_reels_center_AnalyzeButton|src/components/reels_center/AnalyzeButton.tsx]] *(from #frontend)*
- [[src_components_reels_center_AutoPublishPanel|src/components/reels_center/AutoPublishPanel.tsx]] *(from #frontend)*
- [[src_components_reels_center_ClipReanalysisPanel|src/components/reels_center/ClipReanalysisPanel.tsx]] *(from #frontend)*
- [[src_components_reels_center_ClipSummaryHeader|src/components/reels_center/ClipSummaryHeader.tsx]] *(from #frontend)*
- [[src_components_reels_center_ConnectAccountDialog|src/components/reels_center/ConnectAccountDialog.tsx]] *(from #frontend)*
- [[src_components_reels_center_CopyEditor|src/components/reels_center/CopyEditor.tsx]] *(from #frontend)*
- [[src_components_reels_center_EditorActions|src/components/reels_center/EditorActions.tsx]] *(from #frontend)*
- [[src_components_reels_center_HighlightsLighttable|src/components/reels_center/HighlightsLighttable.tsx]] *(from #frontend)*
- [[src_components_reels_center_KanbanBoard|src/components/reels_center/KanbanBoard.tsx]] *(from #frontend)*
- [[src_components_reels_center_PlatformSelector|src/components/reels_center/PlatformSelector.tsx]] *(from #frontend)*
- [[src_components_reels_center_PostSchedulerEditor|src/components/reels_center/PostSchedulerEditor.tsx]] *(from #frontend)*
- [[src_components_reels_center_PublicationsCalendar|src/components/reels_center/PublicationsCalendar.tsx]] *(from #frontend)*
- [[src_components_reels_center_RecommendationTips|src/components/reels_center/RecommendationTips.tsx]] *(from #frontend)*
- [[src_components_reels_center_RecoveredAnalysisNotice|src/components/reels_center/RecoveredAnalysisNotice.tsx]] *(from #frontend)*
- [[src_components_reels_center_ReelsCenterHeader|src/components/reels_center/ReelsCenterHeader.tsx]] *(from #frontend)*
- [[src_components_reels_center_ReelsCenterLayout|src/components/reels_center/ReelsCenterLayout.tsx]] *(from #frontend)*
- [[src_components_reels_center_ReelsCenterProvider|src/components/reels_center/ReelsCenterProvider.tsx]] *(from #frontend)*
- [[src_components_reels_center_ReelsPhonePreviewPanel|src/components/reels_center/ReelsPhonePreviewPanel.tsx]] *(from #frontend)*
- [[src_components_reels_center_SchedulerInputs|src/components/reels_center/SchedulerInputs.tsx]] *(from #frontend)*
- [[src_components_reels_center_SoulWriterCard|src/components/reels_center/SoulWriterCard.tsx]] *(from #frontend)*
- [[src_components_reels_center_SyncNotices|src/components/reels_center/SyncNotices.tsx]] *(from #frontend)*
- [[src_components_reels_center_VideoInputArea|src/components/reels_center/VideoInputArea.tsx]] *(from #frontend)*
- [[src_components_reels_center_VideoSourceSelector|src/components/reels_center/VideoSourceSelector.tsx]] *(from #frontend)*
- [[src_components_reels_center_VideoUploadCard|src/components/reels_center/VideoUploadCard.tsx]] *(from #frontend)*
- [[src_components_reels_center_ViralGrowthStudioPanel|src/components/reels_center/ViralGrowthStudioPanel.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/reels_center/__tests__/reelsCenterContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

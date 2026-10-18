---
id: src_components_reels_metrics_MetricsContext
title: "src/components/reels/metrics/MetricsContext.ts"
layer: frontend
domain: social
file: "src/components/reels/metrics/MetricsContext.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels/metrics/MetricsContext.ts

> **Ubicación:** `src/components/reels/metrics/MetricsContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Contexto de la vista de métricas sociales: reparte estado y acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_ReelsMetricsView|src/components/reels/ReelsMetricsView.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useReelsMetricsController|src/components/reels/metrics/hooks/useReelsMetricsController.ts]] *(Layer: #frontend, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_metrics_ContentVideosSection|src/components/reels/metrics/ContentVideosSection.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_FansCard|src/components/reels/metrics/FansCard.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_InstagramCard|src/components/reels/metrics/InstagramCard.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_InstagramConnectionModal|src/components/reels/metrics/InstagramConnectionModal.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricFormCard|src/components/reels/metrics/MetricFormCard.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricsChartSection|src/components/reels/metrics/MetricsChartSection.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricsHistoryTable|src/components/reels/metrics/MetricsHistoryTable.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricsLayout|src/components/reels/metrics/MetricsLayout.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricsProvider|src/components/reels/metrics/MetricsProvider.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_PlatformsRadarHeader|src/components/reels/metrics/PlatformsRadarHeader.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_ScreenshotScanModal|src/components/reels/metrics/ScreenshotScanModal.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_SpotifyCard|src/components/reels/metrics/SpotifyCard.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_TikTokCard|src/components/reels/metrics/TikTokCard.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_YouTubeCard|src/components/reels/metrics/YouTubeCard.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/reels/metrics/__tests__/metricsModularizationContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

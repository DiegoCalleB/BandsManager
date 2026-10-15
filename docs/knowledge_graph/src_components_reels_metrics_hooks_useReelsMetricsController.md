---
id: src_components_reels_metrics_hooks_useReelsMetricsController
title: "src/components/reels/metrics/hooks/useReelsMetricsController.ts"
layer: frontend
domain: social
file: "src/components/reels/metrics/hooks/useReelsMetricsController.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels/metrics/hooks/useReelsMetricsController.ts

> **Ubicación:** `src/components/reels/metrics/hooks/useReelsMetricsController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Compone los hooks de la vista de métricas (resumen, gráfico, plan de crecimiento, Instagram, capturas y formulario).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_metrics_hooks_useContentItems|src/components/reels/metrics/hooks/useContentItems.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useGrowthPlan|src/components/reels/metrics/hooks/useGrowthPlan.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useInstagramConnection|src/components/reels/metrics/hooks/useInstagramConnection.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useMetricForm|src/components/reels/metrics/hooks/useMetricForm.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useMetricsChart|src/components/reels/metrics/hooks/useMetricsChart.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useMetricsSummary|src/components/reels/metrics/hooks/useMetricsSummary.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useScreenshotScan|src/components/reels/metrics/hooks/useScreenshotScan.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_metrics_MetricsContext|src/components/reels/metrics/MetricsContext.ts]] *(from #frontend)*
- [[src_components_reels_ReelsMetricsView|src/components/reels/ReelsMetricsView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

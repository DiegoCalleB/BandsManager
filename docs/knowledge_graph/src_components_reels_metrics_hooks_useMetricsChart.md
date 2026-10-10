---
id: src_components_reels_metrics_hooks_useMetricsChart
title: "src/components/reels/metrics/hooks/useMetricsChart.ts"
layer: frontend
domain: social
file: "src/components/reels/metrics/hooks/useMetricsChart.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels/metrics/hooks/useMetricsChart.ts

> **Ubicación:** `src/components/reels/metrics/hooks/useMetricsChart.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Serie temporal, resumen del periodo, dominio del eje y curvas del gráfico de métricas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_metrics_metricsPeriods|src/components/reels/metrics/metricsPeriods.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_metricsTypes|src/components/reels/metrics/metricsTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_canalColor|src/utils/canalColor.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_metrics_hooks_useReelsMetricsController|src/components/reels/metrics/hooks/useReelsMetricsController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

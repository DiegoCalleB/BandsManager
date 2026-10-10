---
id: src_components_reels_ReelsMetricsView
title: "src/components/reels/ReelsMetricsView.tsx"
layer: frontend
domain: social
file: "src/components/reels/ReelsMetricsView.tsx"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/reels/ReelsMetricsView.tsx

> **Ubicación:** `src/components/reels/ReelsMetricsView.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Vista de métricas sociales: radar de plataformas, gráfico, histórico y plan de crecimiento con IA.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_reels_metrics_MetricsLayout|src/components/reels/metrics/MetricsLayout.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_MetricsProvider|src/components/reels/metrics/MetricsProvider.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_reels_metrics_hooks_useReelsMetricsController|src/components/reels/metrics/hooks/useReelsMetricsController.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_FansPanelBody|src/components/fans_panel/FansPanelBody.tsx]] *(from #frontend)*
- [[src_components_reels_metrics_MetricsContext|src/components/reels/metrics/MetricsContext.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/reels/metrics/__tests__/metricsModularizationContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

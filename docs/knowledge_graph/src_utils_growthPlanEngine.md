---
id: src_utils_growthPlanEngine
title: "src/utils/growthPlanEngine.ts"
layer: service
domain: system
file: "src/utils/growthPlanEngine.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/growthPlanEngine.ts

> **Ubicación:** `src/utils/growthPlanEngine.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ActionItem, ChannelRecommendation, GrowthPlan, getDeterministicGrowthPlan.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandGrowthTiers|src/utils/bandGrowthTiers.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_ReelsMetricsView|src/components/reels/ReelsMetricsView.tsx]] *(from #frontend)*
- [[src_components_reels_SocialGrowthPlanView|src/components/reels/SocialGrowthPlanView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

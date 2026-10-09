---
id: src_utils_bandGrowthTiers
title: "src/utils/bandGrowthTiers.ts"
layer: service
domain: system
file: "src/utils/bandGrowthTiers.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/bandGrowthTiers.ts

> **Ubicación:** `src/utils/bandGrowthTiers.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: BandTier, BandProfileArchetype, detectBandProfileArchetype.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_reels_SocialGrowthPlanView|src/components/reels/SocialGrowthPlanView.tsx]] *(from #frontend)*
- [[src_utils_growthPlanEngine|src/utils/growthPlanEngine.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

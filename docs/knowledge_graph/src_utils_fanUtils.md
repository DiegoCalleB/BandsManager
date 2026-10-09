---
id: src_utils_fanUtils
title: "src/utils/fanUtils.ts"
layer: service
domain: social
file: "src/utils/fanUtils.ts"
tags: ["service", "social", "auto"]
---

# 📌 src/utils/fanUtils.ts

> **Ubicación:** `src/utils/fanUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Exporta: FanMetrics, calculateFanEngagementMetrics, filterFans, sanitizeConcertDisplayName.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(from #frontend)*
- [[src_components_PublicFanCapture|src/components/PublicFanCapture.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

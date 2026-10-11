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
- [[src_components_fans_landing_FanIdentityHeader|src/components/fans_landing/FanIdentityHeader.tsx]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanBandProfile|src/components/fans_landing/hooks/useFanBandProfile.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanJoinForm|src/components/fans_landing/hooks/useFanJoinForm.ts]] *(from #frontend)*
- [[src_components_PublicFanCapture|src/components/PublicFanCapture.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/fanUtils.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

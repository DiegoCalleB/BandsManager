---
id: src_utils_campaignMatch
title: "src/utils/campaignMatch.ts"
layer: service
domain: system
file: "src/utils/campaignMatch.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/campaignMatch.ts

> **Ubicación:** `src/utils/campaignMatch.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: parseFlexibleDate, leadMatchesCampaignCity, leadMatchesCampaignCapacity, leadMatchesCampaignDates, leadMatchesCampaign.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useLeadFiltering|src/components/booking/crm/hooks/useLeadFiltering.ts]] *(from #frontend)*
- [[src_components_campaign_GlobalCampaignBar|src/components/campaign/GlobalCampaignBar.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/campaignMatch.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

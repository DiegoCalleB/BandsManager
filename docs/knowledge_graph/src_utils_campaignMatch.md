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
- [[src_components_campaign_GlobalCampaignBar|src/components/campaign/GlobalCampaignBar.tsx]] *(from #frontend)*
- [[ui_booking_crm|Booking CRM Component]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: server_db_dealSupport
title: "server/db/dealSupport.ts"
layer: db
domain: system
file: "server/db/dealSupport.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/dealSupport.ts

> **Ubicación:** `server/db/dealSupport.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: dbListSupportableDeals, dbDealHasSupport, dbRecordDealSupport, dbRecordDealSupportFromSession, dbRecordDealSupportRefund.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_deals|server/db/deals.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_dealSupport|server/utils/dealSupport.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_concert_deals|tabla concert_deals]] *(Layer: #schema, Domain: #system)*
- [[tabla_deal_support_contributions|tabla deal_support_contributions]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/dealSupport.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

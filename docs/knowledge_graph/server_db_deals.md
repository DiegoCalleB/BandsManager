---
id: server_db_deals
title: "server/db/deals.ts"
layer: db
domain: system
file: "server/db/deals.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/deals.ts

> **Ubicación:** `server/db/deals.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Acuerdos de concierto (`concert_deals`): comisión, hash SHA-256 del acuerdo, token público y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_sync|server/db/sync.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_dealSupport|server/utils/dealSupport.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_concert_deals|tabla concert_deals]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_dealSupport|server/db/dealSupport.ts]] *(from #db)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_donations|server/routes/donations.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/deals.test.ts`
- `server/routes/__tests__/dealsRouter.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

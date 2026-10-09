---
id: server_db_sync
title: "server/db/sync.ts"
layer: db
domain: system
file: "server/db/sync.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/sync.ts

> **Ubicación:** `server/db/sync.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Carga del estado en memoria desde Supabase (`loadStateFromSupabase`) e invalidación de caché por

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(Layer: #db, Domain: #finances)*
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_concerts|server/db/concerts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_contacts|server/db/contacts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_db_fans|server/db/fans.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_production|server/db/production.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_social|server/db/social.ts]] *(Layer: #db, Domain: #social)*
- [[server_db_tours|server/db/tours.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*
- [[server_seeds_demoEpk|server/seeds/demoEpk.ts]] *(Layer: #service, Domain: #epk)*
- [[tabla_user_bands|tabla user_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/stateCacheInvalidation.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

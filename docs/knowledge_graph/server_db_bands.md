---
id: server_db_bands
title: "server/db/bands.ts"
layer: db
domain: system
file: "server/db/bands.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/bands.ts

> **Ubicación:** `server/db/bands.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Bandas registradas (`registered_bands`) y migración de planes. Lectura y escritura siempre con el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(from #db)*
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(from #db)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(from #db)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(from #db)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(from #db)*
- [[server_db_concerts|server/db/concerts.ts]] *(from #db)*
- [[server_db_contacts|server/db/contacts.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(from #db)*
- [[server_db_fans|server/db/fans.ts]] *(from #db)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(from #db)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(from #db)*
- [[server_db_production|server/db/production.ts]] *(from #db)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(from #db)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_db_tours|server/db/tours.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/bandDnaExpresionLock.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

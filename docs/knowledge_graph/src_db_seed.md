---
id: src_db_seed
title: "src/db_seed.ts"
layer: service
domain: system
file: "src/db_seed.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/db_seed.ts

> **Ubicación:** `src/db_seed.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: INITIAL_LEADS, INITIAL_REHEARSALS, INITIAL_CONCERTS, INITIAL_SOCIAL_POSTS, INITIAL_PAYMENTS, INITIAL_MESSAGES, INITIAL_SOCIAL_METRICS, INITIAL_USERS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_data_mouredevBandsSeed|src/data/mouredevBandsSeed.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

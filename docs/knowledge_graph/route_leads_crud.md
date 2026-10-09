---
id: route_leads_crud
title: "Leads CRUD Route"
layer: route
domain: booking
file: "server/routes/leads/crud.ts"
tags: ["api", "route", "leads"]
---

# 📌 Leads CRUD Route

> **Ubicación:** `server/routes/leads/crud.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Endpoints REST para creación, actualización y filtrado de salas por banda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_pitchLearning|server/db/pitchLearning.ts]] *(Layer: #db, Domain: #booking)*
- [[server_routes_leads_helpers|server/routes/leads/helpers.ts]] *(Layer: #route, Domain: #booking)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_festivalDateFilter|server/utils/festivalDateFilter.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_planLimits|server/utils/planLimits.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_spanishFestivalsDB|server/utils/spanishFestivalsDB.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[hook_booking_pipeline|useBookingPipeline Hook]] *(from #hook)*
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

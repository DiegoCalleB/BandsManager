---
id: server_routes_leads_exampleThreads
title: "server/routes/leads/exampleThreads.ts"
layer: route
domain: booking
file: "server/routes/leads/exampleThreads.ts"
tags: ["route", "booking", "auto"]
---

# 📌 server/routes/leads/exampleThreads.ts

> **Ubicación:** `server/routes/leads/exampleThreads.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
CRUD de hilos de ejemplo que alimentan el tono del Redactor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(Layer: #security, Domain: #auth)*
- [[server_db_exampleThreads|server/db/exampleThreads.ts]] *(Layer: #db, Domain: #system)*
- [[server_promptsManager|server/promptsManager.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_leads|server/routes/leads.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

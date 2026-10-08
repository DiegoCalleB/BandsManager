---
id: db_leads
title: "Leads DB Handlers"
layer: db
domain: booking
file: "server/db/leads.ts"
tags: ["database", "leads", "supabase"]
---

# 📌 Leads DB Handlers

> **Ubicación:** `server/db/leads.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Operaciones CRUD en Supabase PostgreSQL con scoping forzoso por bandId.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

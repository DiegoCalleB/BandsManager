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
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_tolerantWrite|server/db/tolerantWrite.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_deleted_bands|tabla deleted_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_deleted_leads|tabla deleted_leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[agent_lector|Lector Agent (Listener)]] *(from #agent)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[fn_acceso_sesion|Acceso y sesión]] *(from #feature)*
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[fn_metricas_panel|Panel y métricas]] *(from #feature)*
- [[fn_scout_salas|Búsqueda de salas y festivales]] *(from #feature)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_deals|server/db/deals.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/leads.test.ts`
- `server/db/__tests__/leadsClearFields.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

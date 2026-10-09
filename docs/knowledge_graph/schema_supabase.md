---
id: schema_supabase
title: "Supabase PostgreSQL Schema"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "postgresql", "supabase", "rls"]
---

# 📌 Supabase PostgreSQL Schema

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Esquema relacional de tablas, índices pgvector, funciones y políticas RLS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_agent_schedule|Estado del Scheduler de agentes]] *(from #db)*
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(from #db)*
- [[db_leads|Leads DB Handlers]] *(from #db)*
- [[db_payments|Pagos y suscripciones (Stripe)]] *(from #db)*
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

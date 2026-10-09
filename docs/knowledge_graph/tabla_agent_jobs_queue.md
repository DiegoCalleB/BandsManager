---
id: tabla_agent_jobs_queue
title: "tabla agent_jobs_queue"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla agent_jobs_queue

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `agent_jobs_queue` (15 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_agentQueueService|server/services/agentQueueService.ts]] *(from #agent)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `agent_type`
- `status`
- `payload`
- `attempts`
- `max_attempts`
- `error_message`
- `scheduled_at`
- `started_at`
- `completed_at`
- `locked_by`
- `locked_until`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260925_create_agent_jobs_queue.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

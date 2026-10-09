---
id: tabla_agent_execution_logs
title: "tabla agent_execution_logs"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla agent_execution_logs

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `agent_execution_logs` (14 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `agente`
- `motor`
- `disparado_por_tipo`
- `usuario_id`
- `usuario_email`
- `estado`
- `mensaje`
- `leads_afectados`
- `conteo_afectados`
- `duracion_ms`
- `detalles`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260928_append_only_audit_logs.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

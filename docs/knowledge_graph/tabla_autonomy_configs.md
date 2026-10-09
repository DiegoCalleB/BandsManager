---
id: tabla_autonomy_configs
title: "tabla autonomy_configs"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla autonomy_configs

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `autonomy_configs` (17 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_autonomy|server/db/autonomy.ts]] *(from #db)*

---

## 🗄️ Columnas
- `band_id`
- `dispatch_level`
- `negotiation_depth`
- `min_cache_threshold`
- `max_cache_threshold`
- `auto_decline_under_min_cache`
- `notify_on_every_proposal`
- `require_human_for_final_sign_off`
- `sin`
- `para`
- `mark_as_read_in_inbox`
- `agent_sender_email`
- `agent_sender_name`
- `agent_reply_to_email`
- `updated_at`
- `negotiation_start_cache_by_type`
- `response_strategies`

**Definida en:** `supabase_schema.sql`, `supabase/migration_agent_sender_emails.sql`, `supabase/migration_negotiation_start_cache.sql`, `supabase/migration_response_strategies.sql`, `supabase/migrations/20260927_add_mark_as_read_in_inbox_to_autonomy_configs.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

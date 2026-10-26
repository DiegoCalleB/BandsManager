---
id: tabla_ai_token_ledger
title: "tabla ai_token_ledger"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla ai_token_ledger

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `ai_token_ledger` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `prompt_tokens`
- `completion_tokens`
- `model_name`
- `estimated_cost_eur`
- `settled_at`
- `settled_by_event`
- `created_at`
- `user_id`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260914_ai_token_ledger.sql`, `supabase/migrations/20260915_ai_token_ledger_band_scope.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

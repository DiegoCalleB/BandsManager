---
id: tabla_ai_token_ledger
title: "tabla ai_token_ledger"
layer: schema
domain: system
file: "supabase/migrations/20260914_ai_token_ledger.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla ai_token_ledger

> **Ubicación:** `supabase/migrations/20260914_ai_token_ledger.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `ai_token_ledger` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_ai_ledger|AI Token Ledger]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `user_id`
- `prompt_tokens`
- `completion_tokens`
- `model_name`
- `estimated_cost_eur`
- `settled_by_event`
- `created_at`

**Definida en:** `supabase/migrations/20260914_ai_token_ledger.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

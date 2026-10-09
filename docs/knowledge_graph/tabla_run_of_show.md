---
id: tabla_run_of_show
title: "tabla run_of_show"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla run_of_show

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `run_of_show` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_production|server/db/production.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `fecha`
- `time`
- `activity`
- `done`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

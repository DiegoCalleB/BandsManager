---
id: tabla_gear_checklists
title: "tabla gear_checklists"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla gear_checklists

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `gear_checklists` (7 columnas).

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
- `label`
- `checked`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

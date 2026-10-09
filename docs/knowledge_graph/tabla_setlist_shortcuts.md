---
id: tabla_setlist_shortcuts
title: "tabla setlist_shortcuts"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla setlist_shortcuts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `setlist_shortcuts` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `icono`
- `etiqueta`
- `titulo_custom`
- `duracion_estimada_minutos`
- `duracion_estimada_segundos`
- `nota_tema`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20260908_create_setlist_shortcuts.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

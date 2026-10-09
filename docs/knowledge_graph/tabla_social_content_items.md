---
id: tabla_social_content_items
title: "tabla social_content_items"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla social_content_items

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `social_content_items` (15 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_social|server/db/social.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `platform`
- `external_id`
- `title`
- `url`
- `thumbnail_url`
- `published_at`
- `views`
- `likes`
- `comments`
- `shares`
- `last_scraped_at`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

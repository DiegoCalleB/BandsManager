---
id: tabla_reel_analyses
title: "tabla reel_analyses"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla reel_analyses

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `reel_analyses` (17 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_reelAnalyses|server/db/reelAnalyses.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `o`
- `source_type`
- `source_url`
- `video_title`
- `video_duration`
- `target_duration`
- `highlights`
- `optimal_time`
- `energy_windows`
- `video_meta`
- `generated_by_ai`
- `notice`
- `created_at`
- `updated_at`
- `video_key`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

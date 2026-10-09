---
id: tabla_song_stems_cache
title: "tabla song_stems_cache"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla song_stems_cache

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `song_stems_cache` (17 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_stemsCache|server/db/stemsCache.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `song_hash`
- `engine`
- `engine_used`
- `is_neural`
- `degraded`
- `status`
- `locked_at`
- `locked_by`
- `timing_breakdown`
- `stems_map`
- `created_at`
- `updated_at`
- `degraded_reason`
- `audio_url`
- `song_title`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260913_add_stems_cache_and_prediction_jobs.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

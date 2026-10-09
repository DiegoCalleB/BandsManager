---
id: tabla_stem_storage_retry_queue
title: "tabla stem_storage_retry_queue"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla stem_storage_retry_queue

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `stem_storage_retry_queue` (14 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_stemStorageRetryQueue|server/services/stemStorageRetryQueue.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `file_path`
- `storage_sub_path`
- `mime_type`
- `band_id`
- `attempts`
- `max_attempts`
- `next_retry_at`
- `last_error`
- `status`
- `created_at`
- `updated_at`
- `completed`
- `exhausted`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260913_add_stems_cache_and_prediction_jobs.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

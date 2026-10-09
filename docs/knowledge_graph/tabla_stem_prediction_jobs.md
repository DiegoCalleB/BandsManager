---
id: tabla_stem_prediction_jobs
title: "tabla stem_prediction_jobs"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla stem_prediction_jobs

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `stem_prediction_jobs` (17 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `song_hash`
- `engine`
- `provider`
- `status`
- `audio_url`
- `song_title`
- `webhook_received_at`
- `webhook_signature_verified`
- `result_stems_map`
- `error_message`
- `created_at`
- `updated_at`
- `succeeded`
- `failed`
- `canceled`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260913_add_stems_cache_and_prediction_jobs.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

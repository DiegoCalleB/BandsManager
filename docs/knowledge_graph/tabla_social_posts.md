---
id: tabla_social_posts
title: "tabla social_posts"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla social_posts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `social_posts` (21 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[server_db_reelMetricas|server/db/reelMetricas.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[tabla_reel_metricas|tabla reel_metricas]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `fecha`
- `plataforma`
- `contenido`
- `estado`
- `responsable`
- `created_at`
- `updated_at`
- `hora_programada`
- `video_url`
- `thumbnail_url`
- `media_type`
- `auto_publish`
- `published_id`
- `published_at`
- `publish_error`
- `account_handle`
- `hashtags`
- `metrics`
- `publish_started_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261102_columnas_escritas_sin_migracion.sql`, `supabase/migrations/20261104_reels_publicacion_real.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

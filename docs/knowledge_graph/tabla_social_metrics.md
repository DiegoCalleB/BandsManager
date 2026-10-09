---
id: tabla_social_metrics
title: "tabla social_metrics"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla social_metrics

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `social_metrics` (23 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_social|server/db/social.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `fecha`
- `instagram`
- `tiktok`
- `youtube`
- `spotify`
- `notas`
- `created_at`
- `updated_at`
- `spotify_monthly_listeners`
- `spotify_followers`
- `spotify_popularity`
- `youtube_subscribers`
- `youtube_total_views`
- `youtube_video_count`
- `instagram_followers`
- `instagram_following`
- `instagram_posts_count`
- `instagram_engagement_rate`
- `tiktok_followers`
- `tiktok_total_likes`
- `tiktok_video_count`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

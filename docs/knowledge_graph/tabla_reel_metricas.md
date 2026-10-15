---
id: tabla_reel_metricas
title: "tabla reel_metricas"
layer: schema
domain: social
file: "supabase/migrations/20261106_reel_metricas.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla reel_metricas

> **Ubicación:** `supabase/migrations/20261106_reel_metricas.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `reel_metricas` (15 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_social_posts|tabla social_posts]] *(Layer: #schema, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_reelMetricas|server/db/reelMetricas.ts]] *(from #db)*

---

## 🗄️ Columnas
- `post_id`
- `horas`
- `band_id`
- `published_id`
- `duracion_seg`
- `loop_perfecto`
- `views`
- `reach`
- `likes`
- `comments`
- `shares`
- `saves`
- `avg_watch_ms`
- `total_watch_ms`
- `medido_en`

**Definida en:** `supabase/migrations/20261106_reel_metricas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

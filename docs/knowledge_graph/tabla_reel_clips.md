---
id: tabla_reel_clips
title: "tabla reel_clips"
layer: schema
domain: social
file: "supabase/migrations/20261104_reels_publicacion_real.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla reel_clips

> **Ubicación:** `supabase/migrations/20261104_reels_publicacion_real.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `reel_clips` (12 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_reelClips|server/db/reelClips.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `clip_url`
- `source_url`
- `source_author`
- `source_author_url`
- `derechos`
- `loop_perfecto`
- `hook_text`
- `created_at`
- `control_calidad`
- `duracion_seg`

**Definida en:** `supabase/migrations/20261104_reels_publicacion_real.sql`, `supabase/migrations/20261105_reel_clips_control_calidad.sql`, `supabase/migrations/20261106_reel_metricas.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

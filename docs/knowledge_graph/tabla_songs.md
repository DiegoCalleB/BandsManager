---
id: tabla_songs
title: "tabla songs"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla songs

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `songs` (42 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_routes_songs_structureUpload|server/routes/songs/structureUpload.ts]] *(from #route)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `titulo`
- `duracion`
- `duracion_segundos`
- `duracion_minutos`
- `tonalidad`
- `bpm`
- `afinacion`
- `album_disco`
- `orden_album`
- `album`
- `genero`
- `tipo`
- `estado`
- `energia`
- `portada_url`
- `favorito_general`
- `estado_tema`
- `es_version_covers`
- `enlace_acordes`
- `notas_internas`
- `audio_principal_url`
- `audio_ideas`
- `cifrado_texto`
- `guia_sustituto`
- `created_at`
- `updated_at`
- `notas_repertorio`
- `notas_miembros`
- `notas_por_miembro`
- `energia_variacion`
- `energia_variacion_calculada_en`
- `energia_db_promedio`
- `energia_bpm_detectado`
- `energia_manual`
- `bpm_detectado_en`
- `tonalidad_detectada_en`
- `energia_onset_density`
- `analisis_acordes`
- `pistas`
- `stems_meta`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migration_song_energia_variacion.sql`, `supabase/migrations/20260903_add_energia_db_promedio.sql`, `supabase/migrations/20260904_add_energia_bpm_detectado.sql`, `supabase/migrations/20260904_add_energia_manual.sql`, `supabase/migrations/20260915_add_bpm_tonalidad_detectados_en.sql`, `supabase/migrations/20260915b_add_energia_onset_density.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`, `supabase/migrations/20261010_analisis_acordes.sql`, `supabase/migrations/20261018_songs_pistas.sql`, `supabase/migrations/20261019_songs_stems_meta.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

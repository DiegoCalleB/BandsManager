---
id: tabla_rehearsals
title: "tabla rehearsals"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla rehearsals

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `rehearsals` (25 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*
- [[tabla_setlists|tabla setlists]] *(Layer: #schema, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_rehearsals|server/db/rehearsals.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `band_name`
- `fecha`
- `hora`
- `hora_fin`
- `lugar`
- `asistentes`
- `notas`
- `estado`
- `setlist_id`
- `convocatoria_tipo`
- `convocados_ids`
- `convocados_nombres`
- `agenda`
- `objetivos`
- `duracion_estimada_min`
- `duracion_real_seg`
- `cronometro_estado`
- `acta`
- `grabaciones`
- `rating_general`
- `temperatura_local`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20260916_add_ensayos_pro_fields.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

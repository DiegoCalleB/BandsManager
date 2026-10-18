---
id: tabla_setlists
title: "tabla setlists"
layer: schema
domain: repertoire
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla setlists

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Tabla de Supabase `setlists` (11 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[tabla_concerts|tabla concerts]] *(from #schema)*
- [[tabla_rehearsals|tabla rehearsals]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `nombre`
- `descripcion`
- `tipo_formato`
- `duracion_total_estimada_minutos`
- `items`
- `fecha_creacion`
- `fecha_ultima_edicion`
- `ai_analysis_json`
- `ai_analysis_generated_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20260904_add_ai_analysis_to_setlists.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

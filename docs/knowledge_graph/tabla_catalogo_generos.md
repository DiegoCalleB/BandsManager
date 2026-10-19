---
id: tabla_catalogo_generos
title: "tabla catalogo_generos"
layer: schema
domain: system
file: "supabase/migrations/20261113_catalogo_global_base.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_generos

> **Ubicación:** `supabase/migrations/20261113_catalogo_global_base.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_generos` (7 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[tabla_catalogo_generos_alias|tabla catalogo_generos_alias]] *(from #schema)*
- [[tabla_catalogo_sala_generos|tabla catalogo_sala_generos]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `nombre_es`
- `nombre_en`
- `padre_id`
- `wikidata_qid`
- `musicbrainz_id`
- `created_at`

**Definida en:** `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

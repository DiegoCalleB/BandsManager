---
id: tabla_catalogo_aportaciones
title: "tabla catalogo_aportaciones"
layer: schema
domain: system
file: "supabase/migrations/20261130_catalogo_aportaciones.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_aportaciones

> **Ubicación:** `supabase/migrations/20261130_catalogo_aportaciones.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_aportaciones` (12 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_aportaciones|server/db/aportaciones.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `como`
- `ficha_id`
- `campo`
- `valor`
- `fuente`
- `comentario`
- `contacto`
- `idioma`
- `estado`
- `revisada_en`
- `created_at`

**Definida en:** `supabase/migrations/20261130_catalogo_aportaciones.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

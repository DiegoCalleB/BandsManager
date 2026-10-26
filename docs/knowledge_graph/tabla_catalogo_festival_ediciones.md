---
id: tabla_catalogo_festival_ediciones
title: "tabla catalogo_festival_ediciones"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_festival_ediciones

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_festival_ediciones` (12 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_festivales|tabla catalogo_festivales]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `festival_id`
- `anio`
- `inicio`
- `fin`
- `recinto`
- `localizacion`
- `estado`
- `fuente`
- `verificado_en`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

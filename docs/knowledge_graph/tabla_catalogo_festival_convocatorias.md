---
id: tabla_catalogo_festival_convocatorias
title: "tabla catalogo_festival_convocatorias"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_festival_convocatorias

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_festival_convocatorias` (19 columnas).

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
- `edicion_anio`
- `abre`
- `cierra`
- `url`
- `canal`
- `estado`
- `admite_independientes`
- `exige_sello_o_agencia`
- `exige_residencia`
- `cuota`
- `remuneracion`
- `resumen_es`
- `resumen_en`
- `fuente`
- `verificado_en`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

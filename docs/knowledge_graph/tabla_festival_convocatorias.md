---
id: tabla_festival_convocatorias
title: "tabla festival_convocatorias"
layer: schema
domain: system
file: "supabase/migrations/20261111_festivales.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla festival_convocatorias

> **Ubicación:** `supabase/migrations/20261111_festivales.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `festival_convocatorias` (19 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_festivales|tabla festivales]] *(Layer: #schema, Domain: #system)*

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

**Definida en:** `supabase/migrations/20261111_festivales.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

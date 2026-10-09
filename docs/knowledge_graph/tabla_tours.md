---
id: tabla_tours
title: "tabla tours"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla tours

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `tours` (20 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_tours|server/db/tours.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `nombre`
- `fecha_inicio`
- `fecha_fin`
- `vehiculo`
- `consumo_l100km`
- `precio_carburante_eur`
- `tipo_combustible`
- `presupuesto_logistica`
- `vehiculos`
- `stops`
- `estado`
- `created_at`
- `updated_at`
- `convocatoria_tipo`
- `convocados_ids`
- `convocados_nombres`
- `sincronizar_calendario`
- `sincronizar_finanzas`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

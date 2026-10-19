---
id: tabla_catalogo_staging
title: "tabla catalogo_staging"
layer: schema
domain: system
file: "supabase/migrations/20261113_catalogo_global_base.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_staging

> **Ubicación:** `supabase/migrations/20261113_catalogo_global_base.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_staging` (11 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_ingestas|tabla catalogo_ingestas]] *(Layer: #schema, Domain: #system)*
- [[tabla_salas_catalogo|tabla salas_catalogo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `ingesta_id`
- `fuente`
- `external_id`
- `licencia`
- `datos`
- `clave`
- `sala_id`
- `estado`
- `motivo`
- `created_at`

**Definida en:** `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

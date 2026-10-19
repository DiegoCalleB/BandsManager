---
id: tabla_catalogo_ingestas
title: "tabla catalogo_ingestas"
layer: schema
domain: system
file: "supabase/migrations/20261113_catalogo_global_base.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_ingestas

> **Ubicación:** `supabase/migrations/20261113_catalogo_global_base.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_ingestas` (12 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[tabla_catalogo_staging|tabla catalogo_staging]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `fuente`
- `pais`
- `parametros`
- `estado`
- `inicio`
- `fin`
- `leidas`
- `nuevas`
- `enlazadas`
- `descartadas`
- `error`

**Definida en:** `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

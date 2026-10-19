---
id: tabla_catalogo_generos_alias
title: "tabla catalogo_generos_alias"
layer: schema
domain: system
file: "supabase/migrations/20261113_catalogo_global_base.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_generos_alias

> **Ubicación:** `supabase/migrations/20261113_catalogo_global_base.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_generos_alias` (2 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_generos|tabla catalogo_generos]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `alias`
- `genero_id`

**Definida en:** `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

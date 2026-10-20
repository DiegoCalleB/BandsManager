---
id: tabla_catalogo_sala_generos
title: "tabla catalogo_sala_generos"
layer: schema
domain: system
file: "supabase/migrations/20261113_catalogo_global_base.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_sala_generos

> **Ubicación:** `supabase/migrations/20261113_catalogo_global_base.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_sala_generos` (4 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_generos|tabla catalogo_generos]] *(Layer: #schema, Domain: #system)*
- [[tabla_salas_catalogo|tabla salas_catalogo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `sala_id`
- `genero_id`
- `fuente`
- `created_at`

**Definida en:** `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

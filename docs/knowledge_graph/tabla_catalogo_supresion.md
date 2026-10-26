---
id: tabla_catalogo_supresion
title: "tabla catalogo_supresion"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_supresion

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_supresion` (5 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_catalogo_salas|tabla catalogo_salas]] *(Layer: #schema, Domain: #system)*
- [[tabla_salas_catalogo|tabla salas_catalogo]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*

---

## 🗄️ Columnas
- `email_sha256`
- `motivo`
- `origen`
- `sala_id`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261113_catalogo_global_base.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

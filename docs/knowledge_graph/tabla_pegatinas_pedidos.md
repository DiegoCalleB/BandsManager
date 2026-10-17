---
id: tabla_pegatinas_pedidos
title: "tabla pegatinas_pedidos"
layer: schema
domain: system
file: "supabase/migrations/20261108_pegatinas_pedidos.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla pegatinas_pedidos

> **Ubicación:** `supabase/migrations/20261108_pegatinas_pedidos.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `pegatinas_pedidos` (12 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_pegatinas|server/db/pegatinas.ts]] *(from #db)*

---

## 🗄️ Columnas
- `band_id`
- `plan`
- `cantidad`
- `expres`
- `nombre`
- `direccion`
- `cp`
- `ciudad`
- `pais`
- `telefono`
- `estado`
- `created_at`

**Definida en:** `supabase/migrations/20261108_pegatinas_pedidos.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: tabla_band_cartel_estilo
title: "tabla band_cartel_estilo"
layer: schema
domain: system
file: "supabase/migrations/20261105_band_cartel_estilo.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_cartel_estilo

> **Ubicación:** `supabase/migrations/20261105_band_cartel_estilo.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_cartel_estilo` (5 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_cartelEstilo|server/db/cartelEstilo.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `estilo`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20261105_band_cartel_estilo.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

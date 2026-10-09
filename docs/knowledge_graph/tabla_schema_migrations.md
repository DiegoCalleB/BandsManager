---
id: tabla_schema_migrations
title: "tabla schema_migrations"
layer: schema
domain: system
file: "server/migrations/runner.ts"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla schema_migrations

> **Ubicación:** `server/migrations/runner.ts`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `schema_migrations` (4 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_migrations_runner|server/migrations/runner.ts]] *(from #service)*

---

## 🗄️ Columnas
- `nombre`
- `checksum`
- `origen`
- `aplicada_en`

**Definida en:** `server/migrations/runner.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

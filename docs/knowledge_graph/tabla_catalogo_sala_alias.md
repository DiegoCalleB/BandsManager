---
id: tabla_catalogo_sala_alias
title: "tabla catalogo_sala_alias"
layer: schema
domain: system
file: "supabase/migrations/20261115_catalogo_sala_alias.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_sala_alias

> **Ubicación:** `supabase/migrations/20261115_catalogo_sala_alias.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_sala_alias` (4 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*

---

## 🗄️ Columnas
- `alias_clave`
- `clave`
- `nombre`
- `created_at`

**Definida en:** `supabase/migrations/20261115_catalogo_sala_alias.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: tabla_catalogo_salas
title: "tabla catalogo_salas"
layer: schema
domain: system
file: "supabase/migrations/20261117_sala_web_revisada.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla catalogo_salas

> **Ubicación:** `supabase/migrations/20261117_sala_web_revisada.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `catalogo_salas` (1 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(from #db)*
- [[server_db_salasPublicas|server/db/salasPublicas.ts]] *(from #db)*

---

## 🗄️ Columnas
- `web_revisada_en`

**Definida en:** `supabase/migrations/20261117_sala_web_revisada.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

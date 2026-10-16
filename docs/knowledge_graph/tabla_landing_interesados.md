---
id: tabla_landing_interesados
title: "tabla landing_interesados"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla landing_interesados

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `landing_interesados` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_interesados|server/db/interesados.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `email`
- `idioma`
- `origen`
- `consentimiento_at`
- `confirmado_at`
- `baja_at`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261108_landing_interesados.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

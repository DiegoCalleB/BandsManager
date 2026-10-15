---
id: tabla_musicians_waitlist
title: "tabla musicians_waitlist"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla musicians_waitlist

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `musicians_waitlist` (16 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_fans|server/db/fans.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `nombre_banda`
- `nombre_contacto`
- `email`
- `instagram`
- `telefono`
- `ciudad`
- `genero`
- `enlace_musica`
- `interes_principal`
- `notas`
- `idioma`
- `banda_origen`
- `concierto_origen`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase/migration_musicians_waitlist.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

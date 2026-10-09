---
id: tabla_fans
title: "tabla fans"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla fans

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `fans` (15 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_concerts|tabla concerts]] *(Layer: #schema, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_fans|server/db/fans.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `nombre`
- `email`
- `ciudad`
- `como_conocio`
- `concierto_origen_id`
- `concierto_origen_nombre`
- `fecha_captura`
- `consentimiento_rgpd`
- `mensaje`
- `cancion_favorita`
- `instagram`
- `created_at`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: tabla_category_pitch_templates
title: "tabla category_pitch_templates"
layer: schema
domain: booking
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla category_pitch_templates

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `category_pitch_templates` (13 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_categoryTemplates|server/db/categoryTemplates.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `category`
- `title`
- `subject`
- `body`
- `guidelines`
- `custom_instruction`
- `tone_rating`
- `content_rating`
- `feedback_logs`
- `updated_at`
- `created_at`

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

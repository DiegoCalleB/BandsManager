---
id: tabla_band_print_settings
title: "tabla band_print_settings"
layer: schema
domain: system
file: "supabase/migrations/20261011_band_print_settings.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_print_settings

> **Ubicación:** `supabase/migrations/20261011_band_print_settings.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_print_settings` (5 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_printSettings|server/db/printSettings.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `settings`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20261011_band_print_settings.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: tabla_band_alert_settings
title: "tabla band_alert_settings"
layer: schema
domain: system
file: "supabase/migrations/20260920_add_alert_settings_table.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_alert_settings

> **Ubicación:** `supabase/migrations/20260920_add_alert_settings_table.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_alert_settings` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `email_notifications_enabled`
- `in_app_notifications_enabled`
- `digest_frequency`
- `recipient_email`
- `recipient_role`
- `rules`
- `created_at`
- `updated_at`

**Definida en:** `supabase/migrations/20260920_add_alert_settings_table.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

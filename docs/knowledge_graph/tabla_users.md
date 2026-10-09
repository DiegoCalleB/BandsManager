---
id: tabla_users
title: "tabla users"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla users

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `users` (22 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_users|server/routes/users.ts]] *(from #route)*
- [[tabla_ai_token_ledger|tabla ai_token_ledger]] *(from #schema)*
- [[tabla_user_bands|tabla user_bands]] *(from #schema)*

---

## 🗄️ Columnas
- `id`
- `username`
- `name`
- `role`
- `plan`
- `band_name`
- `band_id`
- `email`
- `instrument`
- `avatar_color`
- `password_hash`
- `salt`
- `google_oauth`
- `main_band_id`
- `band_order`
- `ui_preferences`
- `created_at`
- `updated_at`
- `tier`
- `plan_pendiente`
- `fecha_cambio_plan`
- `estado_suscripcion`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migration_user_ui_preferences.sql`, `supabase/migrations/20260914_ai_token_ledger.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

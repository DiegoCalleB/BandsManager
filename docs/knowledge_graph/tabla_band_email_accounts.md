---
id: tabla_band_email_accounts
title: "tabla band_email_accounts"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_email_accounts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `band_email_accounts` (10 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_emailAccounts|server/db/emailAccounts.ts]] *(from #db)*

---

## 🗄️ Columnas
- `band_id`
- `provider`
- `email`
- `app_password`
- `smtp_host`
- `smtp_port`
- `smtp_secure`
- `imap_host`
- `imap_port`
- `updated_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

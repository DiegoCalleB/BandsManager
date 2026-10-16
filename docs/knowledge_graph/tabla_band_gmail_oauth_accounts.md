---
id: tabla_band_gmail_oauth_accounts
title: "tabla band_gmail_oauth_accounts"
layer: schema
domain: auth
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_gmail_oauth_accounts

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/auth`

## 📖 Descripción
Tabla de Supabase `band_gmail_oauth_accounts` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_gmailOAuth|server/db/gmailOAuth.ts]] *(from #security)*

---

## 🗄️ Columnas
- `band_id`
- `gmail_email`
- `refresh_token`
- `scope`
- `connected_at`
- `updated_at`
- `needs_reauth_at`
- `gmail_history_id`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261105_gmail_needs_reauth.sql`, `supabase/migrations/20261107_gmail_history_id.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

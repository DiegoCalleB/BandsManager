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
Tabla de Supabase `band_gmail_oauth_accounts` (6 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

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

**Definida en:** `supabase_schema.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

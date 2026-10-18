---
id: tabla_band_social_accounts
title: "tabla band_social_accounts"
layer: schema
domain: social
file: "supabase/migrations/20261009_sincronizar_esquema_auditoria.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla band_social_accounts

> **Ubicación:** `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `band_social_accounts` (13 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_social|server/db/social.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `plataforma`
- `handle`
- `account_name`
- `avatar_url`
- `status`
- `auto_publish_enabled`
- `connected_at`
- `last_sync_at`
- `followers_count`
- `total_views`
- `account_id`

**Definida en:** `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

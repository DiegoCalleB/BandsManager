---
id: tabla_stripe_webhook_events
title: "tabla stripe_webhook_events"
layer: schema
domain: finances
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla stripe_webhook_events

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/finances`

## 📖 Descripción
Tabla de Supabase `stripe_webhook_events` (4 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_webhooks|server/db/webhooks.ts]] *(from #db)*

---

## 🗄️ Columnas
- `event_id`
- `event_type`
- `payload`
- `processed_at`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

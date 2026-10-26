---
id: tabla_fan_link_clicks
title: "tabla fan_link_clicks"
layer: schema
domain: social
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla fan_link_clicks

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/social`

## 📖 Descripción
Tabla de Supabase `fan_link_clicks` (8 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `button_type`
- `concert_id`
- `concert_date`
- `user_agent`
- `referer`
- `created_at`

**Definida en:** `supabase_schema.sql`, `supabase/migration_fan_link_clicks.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

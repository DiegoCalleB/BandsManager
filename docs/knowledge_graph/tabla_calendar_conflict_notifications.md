---
id: tabla_calendar_conflict_notifications
title: "tabla calendar_conflict_notifications"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla calendar_conflict_notifications

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `calendar_conflict_notifications` (5 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(from #db)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `user_id`
- `huella`
- `notified_at`

**Definida en:** `supabase_schema.sql`, `supabase/migrations/20261013_calendar_conflict_notifications.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

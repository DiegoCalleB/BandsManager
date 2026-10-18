---
id: db_calendar_conflicts
title: "Persistencia de avisos de choque"
layer: db
domain: booking
file: "server/db/calendarConflicts.ts"
tags: ["calendar", "db"]
---

# 📌 Persistencia de avisos de choque

> **Ubicación:** `server/db/calendarConflicts.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/booking`

## 📖 Descripción
Miembros por banda, bandas de un usuario y tabla calendar_conflict_notifications para no repetir avisos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[schema_supabase|Supabase PostgreSQL Schema]] *(Layer: #schema, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_calendar_conflict_notifications|tabla calendar_conflict_notifications]] *(Layer: #schema, Domain: #system)*
- [[tabla_users|tabla users]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[service_calendar_conflicts|Avisos de choques por email]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/calendarConflictService.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

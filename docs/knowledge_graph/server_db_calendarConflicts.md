---
id: server_db_calendarConflicts
title: "server/db/calendarConflicts.ts"
layer: db
domain: system
file: "server/db/calendarConflicts.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/calendarConflicts.ts

> **Ubicación:** `server/db/calendarConflicts.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Soporte de datos para los avisos de choque de calendario: quién pertenece a cada banda y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_users|server/db/users.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

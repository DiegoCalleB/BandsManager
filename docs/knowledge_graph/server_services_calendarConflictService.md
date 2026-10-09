---
id: server_services_calendarConflictService
title: "server/services/calendarConflictService.ts"
layer: service
domain: system
file: "server/services/calendarConflictService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/calendarConflictService.ts

> **Ubicación:** `server/services/calendarConflictService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Avisos por email de choques de calendario.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_calendarConflicts|src/utils/calendarConflicts.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_concerts|server/routes/concerts.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

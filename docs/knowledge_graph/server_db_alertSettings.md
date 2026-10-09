---
id: server_db_alertSettings
title: "server/db/alertSettings.ts"
layer: db
domain: system
file: "server/db/alertSettings.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/alertSettings.ts

> **Ubicación:** `server/db/alertSettings.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajustes de alertas por banda (`band_alert_settings`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_services_calendarConflictService|server/services/calendarConflictService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

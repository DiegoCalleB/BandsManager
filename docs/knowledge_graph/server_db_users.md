---
id: server_db_users
title: "server/db/users.ts"
layer: db
domain: system
file: "server/db/users.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/users.ts

> **Ubicación:** `server/db/users.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Usuarios (`users`) y su pertenencia a bandas (`user_bands`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_db_calendarConflicts|server/db/calendarConflicts.ts]] *(from #db)*
- [[server_db_sync|server/db/sync.ts]] *(from #db)*
- [[server_routes_deals|server/routes/deals.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: server_db_schedule
title: "server/db/schedule.ts"
layer: db
domain: system
file: "server/db/schedule.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/schedule.ts

> **Ubicación:** `server/db/schedule.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Horario comercial de la banda (`band_schedules`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[tabla_band_schedules|tabla band_schedules]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

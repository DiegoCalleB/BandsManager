---
id: server_db_printSettings
title: "server/db/printSettings.ts"
layer: db
domain: system
file: "server/db/printSettings.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/printSettings.ts

> **Ubicación:** `server/db/printSettings.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajustes de impresión del setlist por banda (`band_print_settings`).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[src_utils_printSettings|src/utils/printSettings.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

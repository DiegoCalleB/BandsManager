---
id: server_db_referidos
title: "server/db/referidos.ts"
layer: db
domain: system
file: "server/db/referidos.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/referidos.ts

> **Ubicación:** `server/db/referidos.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Referidos entre bandas sobre `registered_bands` (ref_code, referido_por, referido_en).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_utils_referidos|server/utils/referidos.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_services_perfilPublicoBanda|server/services/perfilPublicoBanda.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

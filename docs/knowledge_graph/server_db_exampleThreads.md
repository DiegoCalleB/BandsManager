---
id: server_db_exampleThreads
title: "server/db/exampleThreads.ts"
layer: db
domain: system
file: "server/db/exampleThreads.ts"
tags: ["db", "system", "auto"]
---

# 📌 server/db/exampleThreads.ts

> **Ubicación:** `server/db/exampleThreads.ts`  
> **Capa:** `#layer/db` | **Dominio:** `#domain/system`

## 📖 Descripción
Hilos de ejemplo (`pitch_example_threads`) que alimentan el tono del Redactor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_bands|server/db/bands.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

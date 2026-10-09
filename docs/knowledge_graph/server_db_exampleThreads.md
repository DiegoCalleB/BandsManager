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
- [[tabla_pitch_example_threads|tabla pitch_example_threads]] *(Layer: #schema, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[server_db|server/db.ts]] *(from #db)*
- [[server_routes_leads_exampleThreads|server/routes/leads/exampleThreads.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/db/__tests__/exampleThreads.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

---
id: server_services_catalogoScheduler
title: "server/services/catalogoScheduler.ts"
layer: service
domain: system
file: "server/services/catalogoScheduler.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/catalogoScheduler.ts

> **Ubicación:** `server/services/catalogoScheduler.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Sincronización periódica del catálogo compartido de salas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_salasCatalogo|server/db/salasCatalogo.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server|server.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/catalogoScheduler.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

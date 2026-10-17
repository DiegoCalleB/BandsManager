---
id: server_services_avisosPublicacion
title: "server/services/avisosPublicacion.ts"
layer: service
domain: system
file: "server/services/avisosPublicacion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/avisosPublicacion.ts

> **Ubicación:** `server/services/avisosPublicacion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Envía el aviso de Reels que no se han publicado (ver utils/avisoPublicacionFallida.ts).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_alertSettings|server/db/alertSettings.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_avisoPublicacionFallida|server/utils/avisoPublicacionFallida.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_errorTracking|server/utils/errorTracking.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/avisosPublicacion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

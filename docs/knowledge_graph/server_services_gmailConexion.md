---
id: server_services_gmailConexion
title: "server/services/gmailConexion.ts"
layer: service
domain: system
file: "server/services/gmailConexion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/gmailConexion.ts

> **Ubicación:** `server/services/gmailConexion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lo que ocurre justo después de guardar la conexión de Gmail de una banda (callback de OAuth):

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_core|server/db/core.ts]] *(Layer: #db, Domain: #system)*
- [[server_services_transactionalEmail|server/services/transactionalEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_avisosCuentaEmail|server/utils/avisosCuentaEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/gmailConexion.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

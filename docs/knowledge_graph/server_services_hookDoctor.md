---
id: server_services_hookDoctor
title: "server/services/hookDoctor.ts"
layer: service
domain: system
file: "server/services/hookDoctor.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/hookDoctor.ts

> **Ubicación:** `server/services/hookDoctor.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Hook Doctor: audita el gancho y el copy de un Reel y propone una versión mejor.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_bandProfile|server/utils/bandProfile.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reelsTexto|server/routes/reelsTexto.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/hookDoctor.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

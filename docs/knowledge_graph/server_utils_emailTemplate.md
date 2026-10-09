---
id: server_utils_emailTemplate
title: "server/utils/emailTemplate.ts"
layer: service
domain: system
file: "server/utils/emailTemplate.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailTemplate.ts

> **Ubicación:** `server/utils/emailTemplate.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Server-side email template generator and signature cleaner.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_tracking|server/routes/tracking.ts]] *(Layer: #route, Domain: #system)*
- [[server_utils_bandHash|server/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

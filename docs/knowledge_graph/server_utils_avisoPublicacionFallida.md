---
id: server_utils_avisoPublicacionFallida
title: "server/utils/avisoPublicacionFallida.ts"
layer: service
domain: system
file: "server/utils/avisoPublicacionFallida.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/avisoPublicacionFallida.ts

> **Ubicación:** `server/utils/avisoPublicacionFallida.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Aviso por email cuando el worker no ha podido publicar un Reel programado. Lógica pura (a quién

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_avisosCuentaEmail|server/utils/avisosCuentaEmail.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_avisosPublicacion|server/services/avisosPublicacion.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/avisosPublicacion.test.ts`
- `server/utils/__tests__/avisoPublicacionFallida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

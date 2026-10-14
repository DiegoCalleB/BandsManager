---
id: server_utils_emailsCicloVida
title: "server/utils/emailsCicloVida.ts"
layer: service
domain: system
file: "server/utils/emailsCicloVida.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailsCicloVida.ts

> **Ubicación:** `server/utils/emailsCicloVida.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Emails de ciclo de vida (onboarding): qué toca enviar a cada usuario y con qué texto.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_trackingSeguro|server/utils/trackingSeguro.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_emailsCicloVida|server/routes/emailsCicloVida.ts]] *(from #route)*
- [[server_services_emailsCicloVida|server/services/emailsCicloVida.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/emailsCicloVida.test.ts`
- `server/utils/__tests__/emailsCicloVida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

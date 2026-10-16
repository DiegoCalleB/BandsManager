---
id: server_utils_avisosCuentaEmail
title: "server/utils/avisosCuentaEmail.ts"
layer: service
domain: system
file: "server/utils/avisosCuentaEmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/avisosCuentaEmail.ts

> **Ubicación:** `server/utils/avisosCuentaEmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Avisos por email de lo que ocurre con la cuenta de una banda al conectar su Gmail. Lógica pura

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_email|server/utils/email.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_html|server/utils/html.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_gmailConexion|server/services/gmailConexion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/avisosCuentaEmail.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

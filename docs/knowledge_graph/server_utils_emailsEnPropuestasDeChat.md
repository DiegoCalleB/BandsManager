---
id: server_utils_emailsEnPropuestasDeChat
title: "server/utils/emailsEnPropuestasDeChat.ts"
layer: service
domain: system
file: "server/utils/emailsEnPropuestasDeChat.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/emailsEnPropuestasDeChat.ts

> **Ubicación:** `server/utils/emailsEnPropuestasDeChat.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El chat puede proponer crear una sala o modificarla con un `email_contacto`. Una IA que «completa» una ficha se

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_emailConEvidencia|server/utils/emailConEvidencia.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/emailsEnPropuestasDeChat.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

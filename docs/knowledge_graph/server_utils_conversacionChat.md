---
id: server_utils_conversacionChat
title: "server/utils/conversacionChat.ts"
layer: service
domain: system
file: "server/utils/conversacionChat.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/conversacionChat.ts

> **Ubicación:** `server/utils/conversacionChat.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Preparación de la conversación del chat del Mánager Virtual antes de enviarla al modelo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/chatLimites.test.ts`
- `server/utils/__tests__/conversacionChat.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

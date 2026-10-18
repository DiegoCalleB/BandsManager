---
id: server_routes_tiposChat
title: "server/routes/tiposChat.ts"
layer: route
domain: system
file: "server/routes/tiposChat.ts"
tags: ["route", "system", "auto"]
---

# 📌 server/routes/tiposChat.ts

> **Ubicación:** `server/routes/tiposChat.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/system`

## 📖 Descripción
Tipos del chat del Mánager Virtual (chat.ts): mensajes del historial, acciones que propone la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/chatCatalogo.test.ts`
- `server/services/__tests__/chatLecturas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

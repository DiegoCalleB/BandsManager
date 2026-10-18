---
id: server_services_chatLecturas
title: "server/services/chatLecturas.ts"
layer: service
domain: system
file: "server/services/chatLecturas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/chatLecturas.ts

> **Ubicación:** `server/services/chatLecturas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Herramientas de LECTURA del chatbot. Las `propose_*` de chatTools.ts escriben y exigen confirmación;

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_gemini|Gemini (Google GenAI)]] *(Layer: #external, Domain: #system)*
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_routes_tiposChat|server/routes/tiposChat.ts]] *(Layer: #route, Domain: #system)*
- [[server_services_chatTools|server/services/chatTools.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_chatPromptBloques|server/utils/chatPromptBloques.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_conversacionChat|server/utils/conversacionChat.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_chat|server/routes/chat.ts]] *(from #route)*
- [[server_services_chatPrompt|server/services/chatPrompt.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/chatLecturas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

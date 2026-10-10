---
id: src_components_chatbot_hooks_useChatSend
title: "src/components/chatbot/hooks/useChatSend.ts"
layer: frontend
domain: system
file: "src/components/chatbot/hooks/useChatSend.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/hooks/useChatSend.ts

> **Ubicación:** `src/components/chatbot/hooks/useChatSend.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Envía el mensaje del usuario al asistente y encadena la respuesta con sus acciones propuestas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_chat|server/routes/chat.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

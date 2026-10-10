---
id: src_components_chatbot_ChatContext
title: "src/components/chatbot/ChatContext.ts"
layer: frontend
domain: system
file: "src/components/chatbot/ChatContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/chatbot/ChatContext.ts

> **Ubicación:** `src/components/chatbot/ChatContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del chat del asistente: reparte el estado y las acciones del controlador a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chatbot_ActiveRunPanel|src/components/chatbot/ActiveRunPanel.tsx]] *(from #frontend)*
- [[src_components_chatbot_AutonomyModalHost|src/components/chatbot/AutonomyModalHost.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatInputForm|src/components/chatbot/ChatInputForm.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatLayout|src/components/chatbot/ChatLayout.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatLoadingIndicator|src/components/chatbot/ChatLoadingIndicator.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatMessageBubble|src/components/chatbot/ChatMessageBubble.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatProvider|src/components/chatbot/ChatProvider.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/chatbot/__tests__/chatbotContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?

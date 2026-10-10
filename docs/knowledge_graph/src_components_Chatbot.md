---
id: src_components_Chatbot
title: "src/components/Chatbot.tsx"
layer: frontend
domain: system
file: "src/components/Chatbot.tsx"
tags: ["frontend", "system", "auto", "pantalla"]
---

# 📌 src/components/Chatbot.tsx

> **Ubicación:** `src/components/Chatbot.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Chat del asistente de la banda: conversa, propone acciones y lanza agentes con aprobación humana.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_chatbot_ChatLayout|src/components/chatbot/ChatLayout.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_ChatProvider|src/components/chatbot/ChatProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_chatTypes|src/components/chatbot/chatTypes.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_chatbot_hooks_useChatController|src/components/chatbot/hooks/useChatController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_chatbot_ChatbotHeader|src/components/chatbot/ChatbotHeader.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/chatbot/__tests__/chatbotContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
